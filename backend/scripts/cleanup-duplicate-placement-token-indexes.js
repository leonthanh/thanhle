const sequelize = require("../db");

const TOKEN_INDEX_TARGETS = [
  {
    tableName: "placement_attempts",
    columnName: "attemptToken",
    preferredIndexName: "placement_attempts_attempt_token",
  },
  {
    tableName: "placement_packages",
    columnName: "shareToken",
    preferredIndexName: "placement_packages_share_token",
  },
  {
    tableName: "placement_attempt_items",
    columnName: "attemptItemToken",
    preferredIndexName: "placement_item_token_uq",
  },
];

const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1"]);

const quoteIdentifier = (identifier) =>
  `\`${String(identifier).replace(/`/g, "``")}\``;

const groupIndexRows = (rows) => {
  const indexesByName = new Map();

  for (const row of rows) {
    const tableName = String(row.tableName || "");
    const indexName = String(row.indexName || "");
    const key = `${tableName}\u0000${indexName}`;
    let index = indexesByName.get(key);

    if (!index) {
      index = {
        tableName,
        indexName,
        nonUnique: Number(row.nonUnique),
        indexType: String(row.indexType || "").toUpperCase(),
        columns: [],
      };
      indexesByName.set(key, index);
    }

    index.columns.push({
      columnName: String(row.columnName || ""),
      subPart: row.subPart == null ? null : Number(row.subPart),
      collation: row.collation == null ? null : String(row.collation),
    });
  }

  return Array.from(indexesByName.values());
};

const getIndexSignature = (index) =>
  JSON.stringify({
    nonUnique: index.nonUnique,
    indexType: index.indexType,
    columns: index.columns,
  });

const isUniqueTokenIndex = (index, target) =>
  index.nonUnique === 0 &&
  index.columns.length === 1 &&
  index.columns[0].columnName === target.columnName &&
  index.columns[0].subPart === null;

const buildCleanupPlan = (rows, target) => {
  const tableIndexes = groupIndexRows(rows).filter(
    (index) => index.tableName === target.tableName
  );
  const preferredIndex = tableIndexes.find(
    (index) => index.indexName === target.preferredIndexName
  );

  if (preferredIndex && !isUniqueTokenIndex(preferredIndex, target)) {
    throw new Error(
      `${target.tableName}.${target.preferredIndexName} exists but is not the expected unique token index.`
    );
  }

  const tokenIndexes = tableIndexes.filter((index) =>
    isUniqueTokenIndex(index, target)
  );
  if (tokenIndexes.length === 0) {
    throw new Error(
      `No unique index found for ${target.tableName}.${target.columnName}; refusing cleanup.`
    );
  }

  const signatures = new Set(tokenIndexes.map(getIndexSignature));
  if (signatures.size !== 1) {
    throw new Error(
      `Unique indexes for ${target.tableName}.${target.columnName} have different definitions; refusing automatic cleanup.`
    );
  }

  return {
    ...target,
    dropIndexNames: tokenIndexes
      .filter(
        (index) =>
          !preferredIndex || index.indexName !== target.preferredIndexName
      )
      .map((index) => index.indexName)
      .sort((left, right) => left.localeCompare(right)),
    addIndex: !preferredIndex,
  };
};

const buildCleanupPlans = (rows) =>
  TOKEN_INDEX_TARGETS.map((target) => buildCleanupPlan(rows, target));

const buildAlterStatement = (plan) => {
  const clauses = plan.dropIndexNames.map(
    (indexName) => `DROP INDEX ${quoteIdentifier(indexName)}`
  );

  if (plan.addIndex) {
    clauses.push(
      `ADD UNIQUE INDEX ${quoteIdentifier(plan.preferredIndexName)} (${quoteIdentifier(plan.columnName)})`
    );
  }

  if (clauses.length === 0) return null;
  return `ALTER TABLE ${quoteIdentifier(plan.tableName)} ${clauses.join(", ")}`;
};

const parseArgs = (args) => {
  const help = args.includes("--help") || args.includes("-h");
  const apply = args.includes("--apply");
  const dryRun = args.includes("--dry-run");
  const databaseArg = args.find((arg) => arg.startsWith("--database="));
  const unknownArgs = args.filter(
    (arg) =>
      !["--help", "-h", "--apply", "--dry-run"].includes(arg) &&
      !arg.startsWith("--database=")
  );

  if (unknownArgs.length) {
    throw new Error(`Unknown option(s): ${unknownArgs.join(", ")}`);
  }
  if (apply && dryRun) {
    throw new Error("Use either --dry-run or --apply, not both.");
  }

  return {
    help,
    apply,
    expectedDatabase: databaseArg ? databaseArg.slice("--database=".length) : "",
  };
};

const printUsage = () => {
  console.log(
    "Usage: node scripts/cleanup-duplicate-placement-token-indexes.js --database=<name> [--dry-run | --apply]"
  );
  console.log("Default mode is dry-run. The script only allows localhost databases.");
};

const assertSafeDatabase = (expectedDatabase) => {
  const databaseName = String(sequelize.config.database || "");
  const host = String(sequelize.config.host || "").trim().toLowerCase();

  if (!expectedDatabase || databaseName !== expectedDatabase) {
    throw new Error(
      `Database mismatch. Expected "${expectedDatabase || "(missing)"}", configured "${databaseName || "(missing)"}".`
    );
  }
  if (!LOCAL_DATABASE_HOSTS.has(host)) {
    throw new Error(
      `Refusing cleanup on non-local database host "${host || "(missing)"}".`
    );
  }
}

const fetchIndexRows = async () => {
  const tableNames = TOKEN_INDEX_TARGETS.map((target) => `'${target.tableName}'`).join(", ");
  const [rows] = await sequelize.query(
    `
      SELECT
        TABLE_NAME AS tableName,
        INDEX_NAME AS indexName,
        NON_UNIQUE AS nonUnique,
        SEQ_IN_INDEX AS sequenceInIndex,
        COLUMN_NAME AS columnName,
        SUB_PART AS subPart,
        COLLATION AS collation,
        INDEX_TYPE AS indexType
      FROM information_schema.statistics
      WHERE TABLE_SCHEMA = :databaseName
        AND TABLE_NAME IN (${tableNames})
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `,
    { replacements: { databaseName: sequelize.config.database } }
  );

  return rows;
};

const runCli = async () => {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  assertSafeDatabase(options.expectedDatabase);
  await sequelize.authenticate();

  const plans = buildCleanupPlans(await fetchIndexRows());
  const summary = plans.map((plan) => ({
    tableName: plan.tableName,
    columnName: plan.columnName,
    keepIndexName: plan.preferredIndexName,
    dropCount: plan.dropIndexNames.length,
    dropIndexNames: plan.dropIndexNames,
    addCanonicalIndex: plan.addIndex,
  }));
  console.log(`Database: ${sequelize.config.database}`);
  console.log(`Mode: ${options.apply ? "APPLY" : "DRY RUN"}`);
  console.log("Plan:", JSON.stringify(summary, null, 2));

  if (!options.apply) {
    console.log("Dry-run only; no database changes were made.");
    return;
  }

  for (const plan of plans) {
    const statement = buildAlterStatement(plan);
    if (!statement) continue;
    await sequelize.query(statement);
  }

  const remainingPlans = buildCleanupPlans(await fetchIndexRows()).filter(
    (plan) => plan.dropIndexNames.length > 0 || plan.addIndex
  );
  if (remainingPlans.length > 0) {
    throw new Error(
      `Cleanup verification failed for: ${remainingPlans.map((plan) => plan.tableName).join(", ")}.`
    );
  }

  console.log("Cleanup verified: one canonical unique token index remains per table.");
};

if (require.main === module) {
  runCli()
    .catch((error) => {
      console.error("Placement token index cleanup failed:", error);
      process.exitCode = 1;
    })
    .finally(() => sequelize.close());
}

module.exports = {
  TOKEN_INDEX_TARGETS,
  buildAlterStatement,
  buildCleanupPlan,
  buildCleanupPlans,
};
