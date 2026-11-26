import {
  ATT,
  CNAME,
  CRIT,
  DATA,
  GEN,
  GROUPS,
  LEVELS,
  LR_BANK,
  ORDER,
  PART,
  PART_BANK,
  RANGES,
  RNAME,
  SKILL,
  STEPT,
  TC_TAGS,
  TIPS,
} from "./ieltsReportData";
import {
  ASSESSMENT_ORDER,
  IELTS_ASSESSMENTS,
  assessmentComment,
  blankAssessments,
  normalizeAssessment,
} from "./reportAssessmentData";

export const STORAGE_KEY = "ielts-report-v1";
export const REPORT_TITLES = {
  dauvao: [
    "BÁO CÁO KẾT QUẢ THI ĐẦU VÀO",
    "Chương trình luyện thi IELTS · Placement Test Report",
  ],
  thang: ["BÁO CÁO KẾT QUẢ KIỂM TRA ĐỊNH KỲ", "Chương trình luyện thi IELTS"],
  giua: [
    "BÁO CÁO KẾT QUẢ THI GIỮA KHÓA",
    "Chương trình luyện thi IELTS · Mock Test Report",
  ],
  cuoi: [
    "BÁO CÁO KẾT QUẢ THI CUỐI KHÓA",
    "Chương trình luyện thi IELTS · Mock Test Report",
  ],
};

const HEADS = {
  1: "Điểm mạnh",
  2: "Cần cải thiện",
  3: "Gợi ý luyện tập",
};
const REPORT_TYPES = Object.keys(REPORT_TITLES);
const PRONOUNS = ["Em", "Bạn", "Con", "__name"];
const STRING_FIELDS = [
  "lop",
  "gv",
  "thang",
  "ngaythi",
  "giaidoan",
  "target",
  "next",
  "ngaylap",
];
const ATTENDANCE_KEYS = ATT.map(([key]) => key);
const REPORT_TEXT_KEYS = ["uudiem", "hanche", "kehoach", "loinhan"];
const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object, key);
const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const asString = (value) => (value == null ? "" : String(value));
const strings = (value) =>
  Array.isArray(value)
    ? value.filter((item) => typeof item === "string")
    : [];
const stringMap = (value) =>
  isRecord(value)
    ? Object.fromEntries(
        Object.entries(value).filter(([, item]) => typeof item === "string")
      )
    : {};

export function todayVN() {
  const date = new Date();
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

export function blankSkill(skill) {
  const base = {
    band: "",
    rng: null,
    g1: "band",
    g2: "band",
    sel: { 1: [], 2: [], 3: [] },
    custom: {},
    override: null,
  };
  if (skill === "L" || skill === "R") {
    base.parts = SKILL[skill].max.map(() => "");
    base.mode = "parts";
    base.total = "";
  }
  if (skill === "W") {
    base.crit = {
      t1: { TA: "", CC: "", LR: "", GRA: "" },
      t2: { TR: "", CC: "", LR: "", GRA: "" },
    };
    base.tb = { t1: "", t2: "" };
  }
  if (skill === "Sp") base.crit = { FC: "", LR: "", GRA: "", P: "" };
  return base;
}

export function blankReport(keep) {
  const report = {
    lop: "",
    gv: "",
    thang: "",
    ngaythi: "",
    giaidoan: "",
    target: "",
    next: "",
    ngaylap: todayVN(),
    inc: { L: true, R: true, W: true, Sp: true, att: true, part: true },
    detail: { L: null, R: null, W: null, Sp: null },
    att: { tong: "", thamdu: "", cophep: "", khongphep: "", tre: "" },
    part: Array(6).fill(0),
    partNotes: Array(6).fill(""),
    texts: { uudiem: null, hanche: null, kehoach: null, loinhan: null },
  };
  if (keep) {
    STRING_FIELDS.forEach((key) => {
      if (typeof keep[key] === "string") report[key] = keep[key];
    });
    if (isRecord(keep.inc)) report.inc = { ...report.inc, ...keep.inc };
  }
  return report;
}

export function blankState() {
  return {
    student: "",
    pronoun: "Em",
    level: "",
    rtype: "giua",
    tab: "L",
    skills: Object.fromEntries(ORDER.map((skill) => [skill, blankSkill(skill)])),
    assessments: blankAssessments(),
    gen: { sel: [], custom: {}, override: null },
    rep: blankReport(),
  };
}

function normalizeCriteria(criteria, saved) {
  return Object.fromEntries(
    criteria.map(([key]) => [
      key,
      typeof saved?.[key] === "string" || typeof saved?.[key] === "number"
        ? String(saved[key])
        : "",
    ])
  );
}

function normalizeSkill(skill, saved) {
  const base = blankSkill(skill);
  const source = isRecord(saved) ? saved : {};
  const selected = isRecord(source.sel) ? source.sel : {};
  const groups = GROUPS[skill].map(([key]) => key);
  const next = {
    ...base,
    band: asString(source.band),
    rng: typeof source.rng === "string" && hasOwn(RANGES, source.rng)
      ? source.rng
      : null,
    g1: groups.includes(source.g1) ? source.g1 : base.g1,
    g2: groups.includes(source.g2) ? source.g2 : base.g2,
    sel: {
      1: strings(selected[1]),
      2: strings(selected[2]),
      3: strings(selected[3]),
    },
    custom: stringMap(source.custom),
    override:
      source.override === null || typeof source.override === "string"
        ? source.override
        : null,
  };

  if (skill === "L" || skill === "R") {
    next.mode = source.mode === "total" ? "total" : "parts";
    next.total = asString(source.total);
    next.parts = SKILL[skill].max.map((_, index) =>
      asString(source.parts?.[index])
    );
  } else if (skill === "W") {
    const savedCriteria = isRecord(source.crit) ? source.crit : {};
    next.crit = {
      t1: normalizeCriteria(CRIT.w1, savedCriteria.t1),
      t2: normalizeCriteria(CRIT.w2, savedCriteria.t2),
    };
    next.tb = {
      t1: asString(source.tb?.t1),
      t2: asString(source.tb?.t2),
    };
  } else {
    next.crit = normalizeCriteria(CRIT.sp, source.crit);
  }

  return next;
}

function normalizeReport(saved) {
  const source = isRecord(saved) ? saved : {};
  const base = blankReport();
  const savedInclude = isRecord(source.inc) ? source.inc : {};
  const savedDetail = isRecord(source.detail) ? source.detail : {};
  const savedAttendance = isRecord(source.att) ? source.att : {};
  const savedTexts = isRecord(source.texts) ? source.texts : {};

  return {
    ...base,
    ...source,
    ...Object.fromEntries(
      STRING_FIELDS.map((key) => [
        key,
        typeof source[key] === "string" ? source[key] : base[key],
      ])
    ),
    inc: {
      ...base.inc,
      ...Object.fromEntries(
        Object.keys(base.inc).map((key) => [
          key,
          savedInclude[key] !== false,
        ])
      ),
    },
    detail: Object.fromEntries(
      ORDER.map((skill) => [
        skill,
        typeof savedDetail[skill] === "boolean" ? savedDetail[skill] : null,
      ])
    ),
    att: Object.fromEntries(
      ATTENDANCE_KEYS.map((key) => [key, asString(savedAttendance[key])])
    ),
    part: Array.from({ length: PART.length }, (_, index) => {
      const value = Number(source.part?.[index]);
      return Number.isInteger(value) && value >= 1 && value <= 5 ? value : 0;
    }),
    partNotes: Array.from({ length: PART.length }, (_, index) =>
      typeof source.partNotes?.[index] === "string"
        ? source.partNotes[index]
        : ""
    ),
    texts: Object.fromEntries(
      REPORT_TEXT_KEYS.map((key) => [
        key,
        savedTexts[key] === null || typeof savedTexts[key] === "string"
          ? savedTexts[key]
          : null,
      ])
    ),
  };
}

export function normalizeState(saved) {
  const base = blankState();
  if (!isRecord(saved)) return base;

  const savedSkills = isRecord(saved.skills) ? saved.skills : {};
  const savedGeneral = isRecord(saved.gen) ? saved.gen : {};
  const levelIds = LEVELS.map(({ id }) => id);
  const pronoun =
    typeof saved.pronoun === "string" &&
    (PRONOUNS.includes(saved.pronoun) || saved.pronoun.trim())
      ? saved.pronoun
      : base.pronoun;
  const savedAssessments = isRecord(saved.assessments)
    ? saved.assessments
    : {};
  const state = {
    ...base,
    student: typeof saved.student === "string" ? saved.student : "",
    pronoun,
    level: levelIds.includes(saved.level) ? saved.level : "",
    rtype: REPORT_TYPES.includes(saved.rtype) ? saved.rtype : base.rtype,
    tab: ["L", "R", "W", "Sp", "vocab", "homework", "gen", "xuat"].includes(
      saved.tab
    )
      ? saved.tab
      : base.tab,
    skills: Object.fromEntries(
      ORDER.map((skill) => [
        skill,
        normalizeSkill(skill, savedSkills[skill]),
      ])
    ),
    assessments: Object.fromEntries(
      ASSESSMENT_ORDER.map((key) => [
        key,
        normalizeAssessment(savedAssessments[key], IELTS_ASSESSMENTS[key]),
      ])
    ),
    gen: {
      sel: strings(savedGeneral.sel),
      custom: stringMap(savedGeneral.custom),
      override:
        savedGeneral.override === null ||
        typeof savedGeneral.override === "string"
          ? savedGeneral.override
          : null,
    },
    rep: normalizeReport(saved.rep),
  };
  return state;
}

export function sampleState() {
  const state = blankState();
  state.student = "Minh Anh";
  state.level = "565a";
  state.rtype = "giua";
  state.rep.target = "5.5";
  state.rep.next = "IELTS 5-6.5 · Khóa 2";
  state.skills.L.parts = ["9", "8", "6", "5"];
  state.skills.L.sel[1] = ["band|r665|p|0"];
  state.skills.L.sel[2] = ["part|3|n"];
  state.skills.L.sel[3] = ["tip|2"];
  state.skills.R.parts = ["10", "8", "6"];
  state.skills.W.crit = {
    t1: { TA: "6", CC: "6", LR: "6", GRA: "5" },
    t2: { TR: "6", CC: "5", LR: "6", GRA: "6" },
  };
  state.skills.Sp.crit = { FC: "6", LR: "6", GRA: "5", P: "6" };
  return state;
}

export function blankNewReport(state) {
  const next = blankState();
  next.pronoun = state.pronoun;
  next.rtype = state.rtype;
  next.level = state.level;
  next.tab = state.tab === "xuat" ? "L" : state.tab;
  next.rep = blankReport(state.rep);
  return next;
}

export function levelById(id) {
  return LEVELS.find((level) => level.id === id) || null;
}

export function levelBand(id) {
  return (levelById(id)?.name || "").replace(/\s*·\s*Khóa\s*\d+/, "");
}

export function roundBand(value) {
  const rounded = Math.round(value * 1000) / 1000;
  const floor = Math.floor(rounded);
  const fraction = rounded - floor;
  return fraction < 0.25 ? floor : fraction < 0.75 ? floor + 0.5 : floor + 1;
}

export function formatBand(value) {
  return value == null || Number.isNaN(value)
    ? ""
    : Number.isInteger(value)
      ? value.toFixed(1)
      : String(value);
}

export function parseNumber(value) {
  const parsed = Number.parseFloat(String(value ?? "").replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
}

export function bandRange(value) {
  if (value < 4.5) return "r34";
  if (value < 6) return "r455";
  if (value < 7) return "r665";
  if (value < 8) return "r775";
  return "r89";
}

export function partsTotal(state, skill) {
  const current = state.skills[skill];
  if (current.mode === "total") {
    const total = String(current.total ?? "").trim();
    return total === ""
      ? null
      : Math.min(40, Math.max(0, Number.parseInt(total, 10) || 0));
  }
  if (current.parts.every((value) => String(value).trim() === "")) return null;
  return current.parts.reduce((sum, value, index) => {
    const score = Math.min(
      SKILL[skill].max[index],
      Math.max(0, Number.parseInt(value, 10) || 0)
    );
    return sum + score;
  }, 0);
}

export function taskBand(state, task) {
  const current = state.skills.W;
  const override = parseNumber(current.tb[task]);
  if (override != null && override >= 0 && override <= 9) {
    return roundBand(override);
  }
  const values = Object.values(current.crit[task]).map(parseNumber);
  if (values.some((value) => value == null)) return null;
  return roundBand(values.reduce((sum, value) => sum + value, 0) / 4);
}

export function autoBand(state, skill) {
  if (skill === "L" || skill === "R") {
    const total = partsTotal(state, skill);
    if (total == null) return null;
    return total <= 0 ? 0 : DATA[skill][Math.min(40, total)];
  }
  if (skill === "W") {
    const task1 = taskBand(state, "t1");
    const task2 = taskBand(state, "t2");
    if (task1 != null && task2 != null) {
      return roundBand((task1 + 2 * task2) / 3);
    }
    return task2 ?? task1;
  }
  const values = Object.values(state.skills.Sp.crit).map(parseNumber);
  if (values.some((value) => value == null)) return null;
  return roundBand(values.reduce((sum, value) => sum + value, 0) / 4);
}

export function bandForSkill(state, skill) {
  const override = parseNumber(state.skills[skill].band);
  return override != null && override >= 0 && override <= 9
    ? roundBand(override)
    : autoBand(state, skill);
}

export function overallBand(state) {
  const values = ORDER.map((skill) => bandForSkill(state, skill));
  return values.some((value) => value == null)
    ? null
    : roundBand(values.reduce((sum, value) => sum + value, 0) / 4);
}

export function hasDetail(state, skill) {
  const current = state.skills[skill];
  if (skill === "L" || skill === "R") {
    return (
      current.mode !== "total" &&
      current.parts.some((value) => String(value).trim() !== "")
    );
  }
  if (skill === "W") {
    return [
      ...Object.values(current.crit.t1),
      ...Object.values(current.crit.t2),
      current.tb.t1,
      current.tb.t2,
    ].some((value) => String(value ?? "").trim() !== "");
  }
  return Object.values(current.crit).some(
    (value) => String(value).trim() !== ""
  );
}

export function showDetail(state, skill) {
  const value = state.rep.detail[skill];
  return value == null ? hasDetail(state, skill) : value;
}

export function cefr(value) {
  if (value == null) return "";
  if (value >= 8.5) return "C2";
  if (value >= 7) return "C1";
  if (value >= 5.5) return "B2";
  if (value >= 4) return "B1";
  if (value >= 3) return "A2";
  return "A1";
}

export function placement(value) {
  if (value == null) return "";
  return DATA.PLACE.find(([band]) => band === value)?.[1] || "";
}

export function rangeForSkill(state, skill) {
  const current = state.skills[skill];
  if (current.rng) return current.rng;
  const value = bandForSkill(state, skill);
  return value == null ? "r455" : bandRange(value);
}

function polarity(value) {
  return value >= 7 ? "+" : value >= 6 ? "m" : "-";
}

function isSuitable(tag, step) {
  return tag === "m" || (step === 1 ? tag === "+" : tag === "-");
}

function criterionLabel(type, key) {
  const criterion = CRIT[type].find(([id]) => id === key);
  return criterion ? criterion[2] : key;
}

export function getPhraseItems(state, skill, step, group) {
  const output = [];
  if (step === 3) {
    (TIPS[skill] || []).forEach(([criterion, text], index) => {
      output.push({
        id: `tip|${index}`,
        text,
        tag: criterion ? CNAME[criterion] : "",
      });
    });
    return output;
  }

  if (group === "band") {
    const range = rangeForSkill(state, skill);
    if (skill === "L" || skill === "R") {
      (LR_BANK[skill][range][step === 1 ? "pos" : "neg"] || []).forEach(
        (text, index) =>
          output.push({
            id: `band|${range}|${step === 1 ? "p" : "n"}|${index}`,
            text,
          })
      );
    } else {
      (DATA.TC[skill][range] || []).forEach((text, index) => {
        const tag = TC_TAGS[skill][range][index] || "m";
        if (isSuitable(tag, step)) {
          output.push({
            id: `band|${range}|${index}`,
            text,
            tag: tag === "m" ? "vừa ưu vừa hạn chế" : "",
          });
        }
      });
    }
  }

  if (group === "parts" && (skill === "L" || skill === "R")) {
    const current = state.skills[skill];
    const max = SKILL[skill].max;
    const filled = current.parts.some((value) => String(value).trim() !== "");
    const percentages = current.parts.map((value, index) =>
      String(value).trim() === ""
        ? null
        : (Number.parseInt(value, 10) || 0) / max[index]
    );
    const values = percentages.filter((value) => value != null);
    const highest = values.length ? Math.max(...values) : null;
    const lowest = values.length ? Math.min(...values) : null;
    PART_BANK[skill].forEach((pair, index) => {
      let tag = "";
      if (
        filled &&
        percentages[index] != null &&
        values.length > 1 &&
        highest !== lowest
      ) {
        if (percentages[index] === highest) tag = "phần tốt nhất";
        if (percentages[index] === lowest) tag = "phần yếu nhất";
      }
      output.push({
        id: `part|${index}|${step === 1 ? "p" : "n"}`,
        text: pair[step === 1 ? 0 : 1],
        tag: current.parts[index] !== ""
          ? `${current.parts[index]}/${max[index]}${tag ? ` · ${tag}` : ""}`
          : tag,
      });
    });
  }

  if (group === "desc" && skill === "W") {
    [["t1", "Task 1"], ["t2", "Task 2"]].forEach(([task, label]) => {
      const value = taskBand(state, task);
      if (value == null || !isSuitable(polarity(value), step)) return;
      const key = formatBand(Math.max(1, value));
      const descriptions = DATA.BD[key]?.[task];
      if (!descriptions) return;
      descriptions.forEach((text, index) =>
        output.push({
          id: `desc|${task}|${key}|${index}`,
          text,
          tag: `${label} · band ${key}`,
        })
      );
    });
  }

  if (group === "idp") {
    const sets =
      skill === "W"
        ? [["w1", "t1", "Task 1"], ["w2", "t2", "Task 2"]]
        : [["sp", null, ""]];
    sets.forEach(([type, task, label]) => {
      const criteria =
        skill === "W" ? state.skills.W.crit[task] : state.skills.Sp.crit;
      CRIT[type].forEach(([key]) => {
        const value = parseNumber(criteria[key]);
        if (value == null || !isSuitable(polarity(value), step)) return;
        (DATA.IDP[type][key][String(value)] || []).forEach((text, index) =>
          output.push({
            id: `idp|${type}|${key}|${value}|${index}`,
            text,
            tag: `${label ? `${label} · ` : ""}${criterionLabel(type, key)} · ${value}`,
          })
        );
      });
    });
  }

  return output;
}

export function getPhraseText(state, skill, id) {
  const source = skill === "gen" ? state.gen : state.skills[skill];
  if (id.startsWith("c:")) return source.custom[id] || "";
  const parts = id.split("|");

  if (skill === "gen") {
    const item = GEN[parts[0]]?.[Number(parts[1])];
    return Array.isArray(item) ? item[1] : item || "";
  }
  if (parts[0] === "tip") return TIPS[skill]?.[Number(parts[1])]?.[1] || "";
  if (parts[0] === "band") {
    if (skill === "L" || skill === "R") {
      return (
        LR_BANK[skill][parts[1]][parts[2] === "p" ? "pos" : "neg"][
          Number(parts[3])
        ] || ""
      );
    }
    return DATA.TC[skill][parts[1]]?.[Number(parts[2])] || "";
  }
  if (parts[0] === "part") {
    return PART_BANK[skill]?.[Number(parts[1])]?.[parts[2] === "p" ? 0 : 1] || "";
  }
  if (parts[0] === "desc") {
    const row = DATA.BD[parts[2]];
    const label = parts[1] === "t1" ? "Task 1" : "Task 2";
    return `${label} – ${row?.[parts[1]]?.[Number(parts[3])] || ""}`;
  }
  if (parts[0] === "idp") {
    const [, type, key, band, index] = parts;
    const text = DATA.IDP[type][key][band]?.[Number(index)] || "";
    const label = criterionLabel(type, key);
    return type === "sp"
      ? `${label}: ${text}`
      : `${type === "w1" ? "Task 1" : "Task 2"} – ${label}: ${text}`;
  }
  return "";
}

function endDot(text) {
  const value = String(text || "").trim();
  return !value || /[.!?…:]$/.test(value) ? value : `${value}.`;
}

export function applyPronoun(text, state) {
  const pronoun = state.pronoun;
  const name = state.student.trim();
  if (pronoun === "Em") return text;
  return text.replace(/(^|[^\p{L}])([Ee])m(?!\p{L})/gu, (match, before, cap) => {
    if (pronoun === "__name") return before + (name || (cap === "E" ? "Em" : "em"));
    return before + (cap === "E" ? pronoun : pronoun.toLocaleLowerCase("vi"));
  });
}

export function composeSkill(state, skill) {
  const current = state.skills[skill];
  const output = [];
  [1, 2, 3].forEach((step) => {
    if (!current.sel[step].length) return;
    output.push(`${HEADS[step]}:`);
    current.sel[step].forEach((id) =>
      output.push(`- ${endDot(getPhraseText(state, skill, id))}`)
    );
  });
  return applyPronoun(output.join("\n"), state);
}

export function composeGeneral(state) {
  return applyPronoun(
    state.gen.sel
      .map((id) => endDot(getPhraseText(state, "gen", id)))
      .join(" "),
    state
  );
}

export function outputText(state, skill) {
  const source = skill === "gen" ? state.gen : state.skills[skill];
  return source.override ?? (
    skill === "gen" ? composeGeneral(state) : composeSkill(state, skill)
  );
}

function placeholderMap(fresh, edited) {
  const map = {};
  if (edited == null || edited === fresh) return map;
  const parts = [];
  const regex = /\[[^\]]*\]/g;
  let match;
  let last = 0;
  while ((match = regex.exec(fresh))) {
    parts.push({ literal: fresh.slice(last, match.index), placeholder: match[0] });
    last = match.index + match[0].length;
  }
  const tail = fresh.slice(last);
  let cursor = 0;
  parts.forEach((part, index) => {
    const before = part.literal.slice(-24);
    const next = index + 1 < parts.length ? parts[index + 1].literal : tail;
    const after = next.slice(0, 24);
    let start = before ? edited.indexOf(before, cursor) : cursor;
    if (start < 0) return;
    start += before.length;
    const end = after ? edited.indexOf(after, start) : edited.length;
    if (end < 0) return;
    const replacement = edited.slice(start, end);
    if (replacement !== part.placeholder && !(part.placeholder in map)) {
      map[part.placeholder] = replacement;
    }
    cursor = end;
  });
  return map;
}

function segmentsBy(parts, edited) {
  if (edited == null || edited === parts.join(" ")) return parts.slice();
  const positions = [];
  let cursor = 0;
  for (const part of parts) {
    const bracket = part.indexOf("[");
    const anchor = part.slice(0, Math.min(14, bracket < 0 ? 14 : bracket));
    if (anchor.trim().length < 3) return null;
    const index = edited.indexOf(anchor, cursor);
    if (index < 0) return null;
    positions.push(index);
    cursor = index + 1;
  }
  return positions.map((start, index) =>
    edited.slice(start, positions[index + 1] ?? edited.length).trim()
  );
}

function applyMap(text, map) {
  let output = text;
  Object.entries(map).forEach(([key, value]) => {
    output = output.split(key).join(value);
  });
  return output;
}

function skillParts(state, skill) {
  const current = state.skills[skill];
  const raw = {};
  [1, 2, 3].forEach((step) => {
    raw[step] = current.sel[step].map((id) =>
      applyPronoun(endDot(getPhraseText(state, skill, id)), state)
    );
  });
  const fresh = composeSkill(state, skill);
  const edited = current.override;
  if (edited == null || edited === fresh) return raw;

  const result = { 1: [], 2: [], 3: [] };
  let activeStep = 0;
  const found = {};
  edited
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const heading = Object.entries(HEADS).find(([, title]) =>
        new RegExp(`^${title}:?$`, "i").test(line)
      );
      if (heading) {
        activeStep = Number(heading[0]);
        found[activeStep] = true;
      } else if (activeStep) {
        result[activeStep].push(endDot(line.replace(/^[-•]\s*/, "")));
      }
    });

  const sectionsMatch = [1, 2, 3].every(
    (step) => !current.sel[step].length || found[step]
  );
  if (sectionsMatch) return result;

  const replacements = placeholderMap(fresh, edited);
  [1, 2, 3].forEach((step) => {
    raw[step] = raw[step].map((text) => applyMap(text, replacements));
  });
  return raw;
}

export function autoTexts(state) {
  const selected = state.gen.sel;
  const generalOf = (prefix) =>
    selected.filter(
      (id) => id.startsWith(`${prefix}|`) || id.startsWith(`c:${prefix}:`)
    );
  const generalPhrases = selected.map((id) =>
    applyPronoun(endDot(getPhraseText(state, "gen", id)), state)
  );
  const generalSegments = segmentsBy(generalPhrases, state.gen.override);
  const generalReplacements = generalSegments
    ? {}
    : placeholderMap(composeGeneral(state), state.gen.override);
  const generalText = (id) => {
    const index = selected.indexOf(id);
    return generalSegments
      ? generalSegments[index]
      : applyMap(generalPhrases[index], generalReplacements);
  };
  const positiveAttendance = generalOf("att").filter(
    (id) => id.startsWith("c:") || Number(id.split("|")[1]) <= 1
  );
  const negativeAttendance = generalOf("att").filter(
    (id) => !id.startsWith("c:") && Number(id.split("|")[1]) >= 2
  );
  const positive = [...generalOf("open"), ...positiveAttendance]
    .map(generalText)
    .filter(Boolean)
    .join(" ");
  const strengths = positive ? [positive] : [];
  const improvements = negativeAttendance.length
    ? [negativeAttendance.map(generalText).filter(Boolean).join(" ")]
    : [];
  const practice = [];

  ORDER.forEach((skill) => {
    const parts = skillParts(state, skill);
    if (state.rep.inc[skill] && parts[1].length) {
      strengths.push(`${SKILL[skill].name}: ${parts[1].join(" ")}`);
    }
    if (state.rep.inc[skill] && parts[2].length) {
      improvements.push(`${SKILL[skill].name}: ${parts[2].join(" ")}`);
    }
    if (state.rep.inc[skill] && parts[3].length) {
      practice.push(`${SKILL[skill].name}: ${parts[3].join(" ")}`);
    }
  });

  return {
    uudiem: strengths.join("\n"),
    hanche: improvements.join("\n"),
    kehoach: practice.join("\n"),
    loinhan: generalOf("end").map(generalText).filter(Boolean).join(" "),
  };
}

function planTitle(state) {
  return {
    dauvao: "Lộ trình học đề xuất",
    thang: "Kế hoạch học tập tháng tới",
    giua: "Kế hoạch học tập nửa khóa còn lại",
    cuoi: "Kế hoạch học tập & định hướng khóa tiếp theo",
  }[state.rtype];
}

function reportPairs(state) {
  const report = state.rep;
  const level = levelBand(state.level);
  if (state.rtype === "dauvao") {
    return [
      ["Họ và tên học viên", state.student.trim()],
      ["Ngày thi", report.ngaythi],
      ["Giáo viên phụ trách", report.gv],
      ["Cấp độ đề xuất", level || placement(overallBand(state))],
      ["Mục tiêu của học viên", report.target ? `band ${report.target}` : ""],
      ["Lớp học (nếu có)", report.lop],
    ];
  }

  const base = [
    ["Họ và tên học viên", state.student.trim()],
    ["Lớp học", report.lop],
    ["Cấp độ", level],
    ["Giáo viên phụ trách", report.gv],
  ];
  if (state.rtype === "thang") {
    return [
      ...base,
      ["Tháng / Năm", report.thang],
      ["Mục tiêu đầu ra", report.target ? `band ${report.target}` : ""],
    ];
  }
  if (state.rtype === "giua") {
    return [
      ...base,
      ["Ngày thi", report.ngaythi],
      ["Tuần học / Giai đoạn", report.giaidoan],
      ["Mục tiêu đầu ra", report.target ? `band ${report.target}` : ""],
    ];
  }
  return [
    ...base,
    ["Ngày thi", report.ngaythi],
    ["Mục tiêu đầu ra", report.target ? `band ${report.target}` : ""],
    ["Khóa học tiếp theo", report.next],
  ];
}

function targetNote(state, overall) {
  const target = state.rep.target.trim();
  const numericTarget = parseNumber(target);
  if (!target) return "";
  if (overall == null || numericTarget == null) return `band ${target}`;
  const difference = roundBand(numericTarget - overall);
  return difference <= 0
    ? `band ${target} · Kết quả hiện tại: đã đạt mục tiêu${
        difference < 0
          ? ` (vượt ${formatBand(-difference).replace(/\.0$/, "")} band)`
          : ""
      }`
    : `band ${target} · Kết quả hiện tại: còn cách mục tiêu ${formatBand(
        difference
      ).replace(/\.0$/, "")} band`;
}

export function reportData(state) {
  const report = state.rep;
  const overall = overallBand(state);
  const automatic = autoTexts(state);
  const reportText = (key) => report.texts[key] ?? automatic[key];
  const data = {
    type: state.rtype,
    student: state.student.trim(),
    pairs: reportPairs(state),
    inc: { ...report.inc },
    detail: Object.fromEntries(ORDER.map((skill) => [skill, showDetail(state, skill)])),
    info: { gv: report.gv, ngaylap: report.ngaylap },
    overall: formatBand(overall),
    overallCefr: overall == null ? "" : `CEFR ${cefr(overall)}`,
    targetNote: targetNote(state, overall),
    att: report.att,
    part: report.part,
    partNotes: report.partNotes,
    partCrit: PART,
    assessments: ASSESSMENT_ORDER.map((key) => {
      const item = IELTS_ASSESSMENTS[key];
      const assessment = state.assessments[key];
      return {
        key,
        name: item.title,
        label: item.label,
        score: String(assessment.score || "").trim(),
        comment: String(
          assessmentComment(item, assessment, (text) =>
            applyPronoun(text, state)
          )
        ).trim(),
      };
    }),
    planTitle: planTitle(state),
    texts: Object.fromEntries(
      REPORT_TEXT_KEYS.map((key) => [key, reportText(key)])
    ),
  };

  ["L", "R"].forEach((skill) => {
    const current = state.skills[skill];
    const band = bandForSkill(state, skill);
    data[skill] = {
      mode: current.mode,
      parts: current.parts.map((value) => String(value).trim()),
      max: SKILL[skill].max,
      total: partsTotal(state, skill),
      band: formatBand(band),
      cefr: cefr(band),
      comment: outputText(state, skill).trim(),
    };
  });

  const writing = state.skills.W;
  const criterionName = (type, key) => {
    const criterion = CRIT[type].find(([id]) => id === key);
    return criterion ? `${criterion[1]} (${criterion[2]})` : key;
  };
  const writingBand = bandForSkill(state, "W");
  data.W = {
    rows: [
      [
        "Task Achievement / Task Response (Hoàn thành yêu cầu đề bài)",
        writing.crit.t1.TA,
        writing.crit.t2.TR,
      ],
      [
        criterionName("w1", "CC"),
        writing.crit.t1.CC,
        writing.crit.t2.CC,
      ],
      [
        criterionName("w1", "LR"),
        writing.crit.t1.LR,
        writing.crit.t2.LR,
      ],
      [
        criterionName("w1", "GRA"),
        writing.crit.t1.GRA,
        writing.crit.t2.GRA,
      ],
    ].map(([label, task1, task2]) => [
      label,
      task1 ? formatBand(parseNumber(task1)) : "",
      task2 ? formatBand(parseNumber(task2)) : "",
    ]),
    t1: formatBand(taskBand(state, "t1")),
    t2: formatBand(taskBand(state, "t2")),
    band: formatBand(writingBand),
    cefr: cefr(writingBand),
    comment: outputText(state, "W").trim(),
  };

  const speaking = state.skills.Sp;
  const speakingBand = bandForSkill(state, "Sp");
  data.Sp = {
    rows: CRIT.sp.map(([key, english, vietnamese]) => [
      `${english} (${vietnamese})`,
      speaking.crit[key] ? formatBand(parseNumber(speaking.crit[key])) : "",
    ]),
    band: formatBand(speakingBand),
    cefr: cefr(speakingBand),
    comment: outputText(state, "Sp").trim(),
  };
  return data;
}

export function tabItems(state) {
  const items = ORDER.map((skill) => {
    const score = bandForSkill(state, skill);
    return [skill, SKILL[skill].name, SKILL[skill].vn, score];
  });
  const assessments = ASSESSMENT_ORDER.map((key) => {
    const item = IELTS_ASSESSMENTS[key];
    const selected = state.assessments[key].sel;
    const count = [1, 2, 3].reduce(
      (total, step) => total + selected[step].length,
      0
    );
    return [key, item.label, item.en, count];
  });
  return [
    ...items,
    ...assessments,
    ["gen", "Nhận xét chung", "", state.gen.sel.length],
    ["xuat", "Xuất báo cáo", "", null],
  ];
}

export { ATT, CNAME, GEN, GROUPS, LEVELS, ORDER, PART, RANGES, RNAME, SKILL, STEPT };
