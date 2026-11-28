const PlacementAttempt = require("../models/PlacementAttempt");
const PlacementPackage = require("../models/PlacementPackage");
const PlacementAttemptItem = require("../models/PlacementAttemptItem");
const {
  TOKEN_INDEX_TARGETS,
  buildAlterStatement,
  buildCleanupPlan,
} = require("../scripts/cleanup-duplicate-placement-token-indexes");

const tokenModels = [
  { model: PlacementAttempt, columnName: "attemptToken" },
  { model: PlacementPackage, columnName: "shareToken" },
  { model: PlacementAttemptItem, columnName: "attemptItemToken" },
];

const createIndexRow = (target, indexName, overrides = {}) => ({
  tableName: target.tableName,
  indexName,
  nonUnique: 0,
  sequenceInIndex: 1,
  columnName: target.columnName,
  subPart: null,
  collation: "A",
  indexType: "BTREE",
  ...overrides,
});

describe("placement token index definitions", () => {
  test.each(tokenModels)(
    "$columnName remains unique through a single explicit index",
    ({ model, columnName }) => {
      expect(model.rawAttributes[columnName].unique).not.toBe(true);

      const uniqueIndexes = model.options.indexes.filter(
        (index) =>
          index.unique &&
          index.fields.length === 1 &&
          index.fields[0] === columnName
      );
      expect(uniqueIndexes).toHaveLength(1);
    }
  );
});

describe("duplicate placement token index cleanup plan", () => {
  const target = TOKEN_INDEX_TARGETS[0];

  test("keeps the canonical unique index and drops only redundant duplicates", () => {
    const duplicateName = "attemptToken_10";
    const plan = buildCleanupPlan(
      [
        createIndexRow(target, target.preferredIndexName),
        createIndexRow(target, duplicateName),
        createIndexRow(target, "PRIMARY", { columnName: "id" }),
      ],
      target
    );

    expect(plan.dropIndexNames).toEqual([duplicateName]);
    expect(plan.addIndex).toBe(false);
    expect(buildAlterStatement(plan)).toBe(
      "ALTER TABLE `placement_attempts` DROP INDEX `attemptToken_10`"
    );
  });

  test("replaces a legacy token index with the canonical index in one ALTER", () => {
    const legacyName = "attemptToken";
    const plan = buildCleanupPlan(
      [createIndexRow(target, legacyName)],
      target
    );

    expect(plan.dropIndexNames).toEqual([legacyName]);
    expect(plan.addIndex).toBe(true);
    expect(buildAlterStatement(plan)).toBe(
      "ALTER TABLE `placement_attempts` DROP INDEX `attemptToken`, ADD UNIQUE INDEX `placement_attempts_attempt_token` (`attemptToken`)"
    );
  });

  test("refuses to merge token indexes with different definitions", () => {
    expect(() =>
      buildCleanupPlan(
        [
          createIndexRow(target, target.preferredIndexName),
          createIndexRow(target, "attemptToken_desc", { collation: "D" }),
        ],
        target
      )
    ).toThrow("have different definitions");
  });
});
