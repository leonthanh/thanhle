import {
  ALL,
  ASSESSMENTS,
  ASSESSMENT_ORDER,
  blankAssessments,
  GEN,
  normalizeAssessment,
  PROG,
  SK,
  SIT,
} from "./starEduReportData";
import { assessmentComment } from "./reportAssessmentData";

export const STORAGE_KEY = "nhanxet-v1";
export const PARTICIPATION_CRITERIA = [
  "Tích cực phát biểu, đặt câu hỏi trong giờ học",
  "Hoàn thành bài tập về nhà đúng hạn",
  "Hợp tác tốt trong hoạt động nhóm / cặp đôi",
  "Thái độ học tập nghiêm túc, tập trung",
  "Sử dụng tiếng Anh chủ động trong giờ học",
];
export const PARTICIPATION_LEVELS = [
  "",
  "Chưa đạt",
  "Cần cải thiện",
  "Đạt",
  "Khá",
  "Xuất sắc",
];
export const ATTENDANCE_FIELDS = [
  ["tong", "Tổng số buổi học"],
  ["thamdu", "Số buổi tham dự"],
  ["cophep", "Vắng có phép"],
  ["khongphep", "Vắng không phép"],
  ["tre", "Số lần đi trễ"],
];
export const REPORT_NAMES = {
  thang: "Hàng tháng",
  giua: "Giữa khóa",
  cuoi: "Cuối khóa",
};
export const REPORT_TITLES = {
  thang: ["BÁO CÁO TÌNH HÌNH HỌC TẬP", "Cập nhật hàng tháng"],
  giua: ["BÁO CÁO GIỮA KHÓA", "Đánh giá định kỳ — giữa khóa học"],
  cuoi: ["BÁO CÁO CUỐI KHÓA", "Đánh giá tổng kết — kết thúc khóa học"],
};
export const MESSAGE_TITLE = "Lời nhắn đến học viên và phụ huynh";

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const strings = (value) =>
  Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
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

export function blankReport(keep) {
  const report = {
    lop: "",
    khoa: "",
    gv: "",
    thang: "",
    ngaykt: "",
    giaidoan: "",
    capdo: "",
    ngaylap: todayVN(),
    inc: { skills: true, att: true, part: true },
    att: { tong: "", thamdu: "", cophep: "", khongphep: "", tre: "" },
    part: [0, 0, 0, 0, 0],
    partNotes: ["", "", "", "", ""],
    texts: { uudiem: null, hanche: null, kehoach: null, loinhan: null },
  };
  if (keep) {
    ["lop", "khoa", "gv", "thang", "ngaykt", "giaidoan"].forEach((key) => {
      if (typeof keep[key] === "string") report[key] = keep[key];
    });
    if (isRecord(keep.inc)) report.inc = { ...report.inc, ...keep.inc };
  }
  return report;
}

export function blankState() {
  const skills = Object.fromEntries(
    ALL.map((key) => [
      key,
      {
        score: "",
        sit: null,
        crit: Object.keys(SK[key].crit)[0],
        g1: "good",
        g2: "weak",
        sel: { 1: [], 2: [], 3: [] },
        custom: {},
        override: null,
      },
    ])
  );
  return {
    student: "",
    pronoun: "Con",
    rtype: "thang",
    program: "",
    tab: "nghe",
    skills,
    assessments: blankAssessments(),
    gen: { sel: [], custom: {}, override: null },
    rep: blankReport(),
  };
}

export function normalizeState(saved) {
  const base = blankState();
  if (!isRecord(saved)) return base;

  const next = {
    ...base,
    ...saved,
    student: typeof saved.student === "string" ? saved.student : base.student,
    pronoun: ["Con", "Em", "Bạn", "__name"].includes(saved.pronoun)
      ? saved.pronoun
      : base.pronoun,
    rtype: Object.hasOwn(REPORT_NAMES, saved.rtype) ? saved.rtype : base.rtype,
    program: Object.hasOwn(PROG, saved.program) ? saved.program : "",
    skills: {},
    assessments: {},
    gen: {},
    rep: {},
  };

  ALL.forEach((key) => {
    const source = isRecord(saved.skills?.[key]) ? saved.skills[key] : {};
    const defaults = base.skills[key];
    const selected = isRecord(source.sel) ? source.sel : {};
    next.skills[key] = {
      ...defaults,
      ...source,
      score: source.score == null ? "" : String(source.score),
      sit: Object.hasOwn(SIT, source.sit) ? source.sit : null,
      crit: Object.hasOwn(SK[key].crit, source.crit)
        ? source.crit
        : defaults.crit,
      g1: ["good", "prog"].includes(source.g1) ? source.g1 : defaults.g1,
      g2: ["weak", "spec", "adv"].includes(source.g2)
        ? source.g2
        : defaults.g2,
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
  });

  const savedAssessments = isRecord(saved.assessments) ? saved.assessments : {};
  ASSESSMENT_ORDER.forEach((key) => {
    next.assessments[key] = normalizeAssessment(
      savedAssessments[key],
      ASSESSMENTS[key]
    );
  });

  const savedGen = isRecord(saved.gen) ? saved.gen : {};
  next.gen = {
    ...base.gen,
    ...savedGen,
    sel: strings(savedGen.sel),
    custom: stringMap(savedGen.custom),
    override:
      savedGen.override === null || typeof savedGen.override === "string"
        ? savedGen.override
        : null,
  };

  const savedRep = isRecord(saved.rep) ? saved.rep : {};
  const savedRepInc = isRecord(savedRep.inc)
    ? savedRep.inc
    : {
        skills: next.rtype !== "thang" || Boolean(savedRep.includeSkills),
        att: true,
        part: true,
      };
  const savedAtt = isRecord(savedRep.att) ? savedRep.att : {};
  const savedTexts = isRecord(savedRep.texts) ? savedRep.texts : {};
  next.rep = {
    ...blankReport(),
    ...savedRep,
    inc: {
      skills: savedRepInc.skills !== false,
      att: savedRepInc.att !== false,
      part: savedRepInc.part !== false,
    },
    att: {
      tong: savedAtt.tong == null ? "" : String(savedAtt.tong),
      thamdu: savedAtt.thamdu == null ? "" : String(savedAtt.thamdu),
      cophep: savedAtt.cophep == null ? "" : String(savedAtt.cophep),
      khongphep:
        savedAtt.khongphep == null ? "" : String(savedAtt.khongphep),
      tre: savedAtt.tre == null ? "" : String(savedAtt.tre),
      ...(isRecord(savedAtt.notes) ? { notes: savedAtt.notes } : {}),
    },
    part: Array.from({ length: 5 }, (_, index) => {
      const value = Number(savedRep.part?.[index]);
      return Number.isInteger(value) && value >= 1 && value <= 5 ? value : 0;
    }),
    partNotes: Array.from({ length: 5 }, (_, index) =>
      typeof savedRep.partNotes?.[index] === "string"
        ? savedRep.partNotes[index]
        : ""
    ),
    texts: {
      uudiem:
        savedTexts.uudiem === null || typeof savedTexts.uudiem === "string"
          ? savedTexts.uudiem
          : null,
      hanche:
        savedTexts.hanche === null || typeof savedTexts.hanche === "string"
          ? savedTexts.hanche
          : null,
      kehoach:
        savedTexts.kehoach === null || typeof savedTexts.kehoach === "string"
          ? savedTexts.kehoach
          : null,
      loinhan:
        savedTexts.loinhan === null || typeof savedTexts.loinhan === "string"
          ? savedTexts.loinhan
          : null,
    },
  };

  if (!isKnownTab(next.tab, next)) next.tab = "nghe";
  return next;
}

function isKnownTab(tab, state) {
  return (
    getOrder(state).includes(tab) ||
    ASSESSMENT_ORDER.includes(tab) ||
    ["gen", "sum", "xuat"].includes(tab)
  );
}

export function getOrder(state) {
  return PROG[state.program]?.skills || ALL;
}

export function programName(state) {
  return PROG[state.program]?.name || "";
}

export function scoreLabel(state) {
  if (state.rtype === "giua") return "Điểm thi giữa khóa";
  if (state.rtype === "cuoi") return "Điểm thi cuối khóa";
  return "Điểm";
}

export function scoreNumber(value) {
  const match = String(value ?? "").replace(",", ".").match(/\d+(\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : Number.NaN;
}

export function totalScore(state) {
  const scores = getOrder(state)
    .map((key) => scoreNumber(state.skills[key].score))
    .filter((value) => !Number.isNaN(value));
  if (!scores.length) return "";
  return String(Math.round(scores.reduce((sum, value) => sum + value, 0) * 10) / 10);
}

export function getPhraseText(state, skill, id) {
  const source = skill === "gen" ? state.gen : state.skills[skill];
  if (id.startsWith("c:")) return source.custom[id] || "";
  const parts = id.split("|");
  if (skill === "gen") {
    const item = GEN[parts[0]]?.[Number(parts[1])];
    return Array.isArray(item) ? item[1] : item || "";
  }

  const data = SK[skill];
  if (!data) return "";
  if (parts[1] === "adv") return data.adv[Number(parts[2])] || "";
  if (parts[1] === "tips") {
    const item = data.tips[Number(parts[2])];
    return Array.isArray(item) ? item[1] : item || "";
  }
  const item = data.crit[parts[0]]?.[parts[1]]?.[Number(parts[2])];
  return Array.isArray(item) ? item[1] : item || "";
}

export function phraseGroup(id) {
  if (id.startsWith("c:")) return "x";
  return id.split("|")[1];
}

const lowerFirst = (text) =>
  text ? text.charAt(0).toLocaleLowerCase("vi") + text.slice(1) : text;
const stripEnd = (text) => text.replace(/[.\s]+$/, "");
const endDot = (text) =>
  /[.!?…]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;

export function applyPronoun(text, state) {
  const name = state.student.trim();
  const replacement =
    state.pronoun === "__name" ? name || "Con" : state.pronoun;
  return text.replace(/(^|[^\p{L}])([Cc])on(?!\p{L})/gu, (...parts) => {
    const [, before, cap] = parts;
    if (state.pronoun === "__name" && name) return before + name;
    const value = cap === "C" ? replacement : replacement.toLocaleLowerCase("vi");
    return before + value;
  });
}

export function composeSkill(state, skill) {
  const current = state.skills[skill];
  const first = current.sel[1].map((id) =>
    endDot(getPhraseText(state, skill, id))
  );
  const second = current.sel[2];
  const third = current.sel[3];
  const parts = [];
  if (first.length) parts.push(first.join(" "));
  if (second.length) {
    const advancedFirst = phraseGroup(second[0]) === "adv";
    const lead = first.length
      ? advancedFirst
        ? "Bên cạnh đó, "
        : "Tuy nhiên, "
      : "";
    parts.push(
      second
        .map((id, index) => {
          const text = endDot(getPhraseText(state, skill, id));
          return index === 0 && lead ? lead + lowerFirst(text) : text;
        })
        .join(" ")
    );
  }
  if (third.length) {
    const lead =
      current.sit === "good"
        ? "Để phát huy hơn nữa, con nên "
        : "Để cải thiện, con nên ";
    parts.push(
      lead +
        third
          .map((id) => lowerFirst(stripEnd(getPhraseText(state, skill, id))))
          .join("; ") +
        "."
    );
  }
  return applyPronoun(parts.join(" "), state);
}

export function composeGeneral(state) {
  return applyPronoun(
    state.gen.sel
      .map((id) => endDot(getPhraseText(state, "gen", id)))
      .join(" "),
    state
  );
}

export function outputText(state, key) {
  const source = key === "gen" ? state.gen : state.skills[key];
  const fresh = key === "gen" ? composeGeneral(state) : composeSkill(state, key);
  return source.override ?? fresh;
}

function placeholderMap(fresh, edited) {
  const map = {};
  if (edited == null || edited === fresh) return map;
  const regex = /\[[^\]]*\]/g;
  const parts = [];
  let match;
  let last = 0;
  while ((match = regex.exec(fresh))) {
    parts.push({ lit: fresh.slice(last, match.index), ph: match[0] });
    last = match.index + match[0].length;
  }
  const tail = fresh.slice(last);
  let cursor = 0;
  parts.forEach((part, index) => {
    const before = part.lit.slice(-24);
    const next = index + 1 < parts.length ? parts[index + 1].lit : tail;
    const after = next.slice(0, 24);
    let start = before ? edited.indexOf(before, cursor) : cursor;
    if (start < 0) return;
    start += before.length;
    const end = after ? edited.indexOf(after, start) : edited.length;
    if (end < 0) return;
    const replacement = edited.slice(start, end);
    if (replacement !== part.ph && !(part.ph in map)) map[part.ph] = replacement;
    cursor = end;
  });
  return map;
}

function segmentsBy(pieces, edited) {
  if (edited == null || edited === pieces.join(" ")) return pieces.slice();
  const positions = [];
  let cursor = 0;
  for (const piece of pieces) {
    const bracket = piece.indexOf("[");
    const anchor = piece.slice(0, Math.min(14, bracket < 0 ? 14 : bracket));
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

const applyMap = (text, map) => {
  let result = text;
  Object.entries(map).forEach(([key, value]) => {
    result = result.split(key).join(value);
  });
  return result;
};
const endDot2 = (text) => {
  const value = text.trim();
  return !value || /[.!?…]$/.test(value) ? value : `${value}.`;
};
const capFirst = (text) =>
  text ? text.charAt(0).toLocaleUpperCase("vi") + text.slice(1) : text;

function skillParts(state, skill) {
  const current = state.skills[skill];
  const sentence = (id) => endDot(getPhraseText(state, skill, id));
  const raw = {
    p1: applyPronoun(current.sel[1].map(sentence).join(" "), state),
    p2: applyPronoun(
      current.sel[2]
        .filter((id) => phraseGroup(id) !== "adv")
        .map(sentence)
        .join(" "),
      state
    ),
    p2a: applyPronoun(
      current.sel[2]
        .filter((id) => phraseGroup(id) === "adv")
        .map(sentence)
        .join(" "),
      state
    ),
    p3: current.sel[3].length
      ? applyPronoun(
          `${capFirst(
            current.sel[3]
              .map((id) => lowerFirst(stripEnd(getPhraseText(state, skill, id))))
              .join("; ")
          )}.`,
          state
        )
      : "",
  };
  const fresh = composeSkill(state, skill);
  const edited = current.override;
  if (edited == null || edited === fresh) return raw;

  let text = edited.trim();
  let p3 = "";
  let valid = true;
  if (current.sel[3].length) {
    const match = [
      ...text.matchAll(/Để (?:cải thiện|phát huy hơn nữa), [^,.;]{1,40}? nên /g),
    ].pop();
    if (match) {
      p3 = endDot2(capFirst(text.slice(match.index + match[0].length)));
      text = text.slice(0, match.index).trim();
    } else {
      valid = false;
    }
  }

  let p1 = "";
  let p2 = "";
  if (valid) {
    if (current.sel[1].length && current.sel[2].length) {
      const match = text.match(/(?:^|\s)(Tuy nhiên|Bên cạnh đó), /);
      if (match) {
        p1 = text.slice(0, match.index).trim();
        p2 = capFirst(text.slice(match.index + match[0].length).trim());
      } else {
        valid = false;
      }
    } else if (current.sel[1].length) {
      p1 = text;
    } else if (current.sel[2].length) {
      p2 = capFirst(text);
    }
  }

  if (valid) {
    const advancedFirst =
      current.sel[2].length && phraseGroup(current.sel[2][0]) === "adv";
    return {
      p1: endDot2(p1),
      p2: advancedFirst ? "" : endDot2(p2),
      p2a: advancedFirst ? endDot2(p2) : "",
      p3,
    };
  }

  const map = placeholderMap(fresh, edited);
  Object.keys(raw).forEach((key) => {
    raw[key] = applyMap(raw[key], map);
  });
  return raw;
}

function autoTexts(state) {
  const result = { uu: [], han: [], ke: [] };
  const selected = state.gen.sel;
  const groupOf = (prefix) =>
    selected.filter(
      (id) => id.startsWith(`${prefix}|`) || id.startsWith(`c:${prefix}:`)
    );
  const generalPhrases = selected.map((id) =>
    applyPronoun(endDot(getPhraseText(state, "gen", id)), state)
  );
  const generalSegments = segmentsBy(generalPhrases, state.gen.override);
  const generalMap = generalSegments
    ? {}
    : placeholderMap(composeGeneral(state), state.gen.override);
  const generalText = (id) => {
    const index = selected.indexOf(id);
    return generalSegments
      ? generalSegments[index]
      : applyMap(generalPhrases[index], generalMap);
  };
  const positiveAttendance = groupOf("att").filter(
    (id) => id.startsWith("c:") || Number(id.split("|")[1]) <= 1
  );
  const negativeAttendance = groupOf("att").filter(
    (id) => !id.startsWith("c:") && Number(id.split("|")[1]) >= 2
  );
  const opening = [...groupOf("open"), ...positiveAttendance]
    .map(generalText)
    .filter(Boolean)
    .join(" ");
  if (opening) result.uu.push(opening);
  if (negativeAttendance.length) {
    result.han.push(
      negativeAttendance.map(generalText).filter(Boolean).join(" ")
    );
  }
  getOrder(state).forEach((key) => {
    const parts = skillParts(state, key);
    if (parts.p1) result.uu.push(`${SK[key].name}: ${parts.p1}`);
    if (parts.p2) result.han.push(`${SK[key].name}: ${parts.p2}`);
    const practice = [parts.p2a, parts.p3].filter(Boolean);
    if (practice.length) result.ke.push(`${SK[key].name}: ${practice.join(" ")}`);
  });
  const ending = groupOf("end").map(generalText).filter(Boolean).join(" ");
  const plan = result.ke.join("\n");
  const message =
    state.rtype === "thang"
      ? [plan ? `Gợi ý luyện tập tại nhà:\n${plan}` : "", ending]
          .filter(Boolean)
          .join("\n")
      : ending;
  return {
    uudiem: result.uu.join("\n"),
    hanche: result.han.join("\n"),
    kehoach: plan,
    loinhan: message,
  };
}

export function reportData(state) {
  const report = state.rep;
  const automatic = autoTexts(state);
  const text = (key) => report.texts[key] ?? automatic[key];
  const skills = getOrder(state);
  return {
    type: state.rtype,
    student: state.student.trim(),
    inc: report.inc,
    info: {
      lop: report.lop,
      prog: programName(state),
      gv: report.gv,
      thang: report.thang,
      ngaykt: report.ngaykt,
      giaidoan: report.giaidoan,
      capdo: report.capdo,
      ngaylap: report.ngaylap,
    },
    skills: skills.map((key) => ({
      name: SK[key].name,
      en: SK[key].en,
      score: state.skills[key].score,
      comment: outputText(state, key).trim(),
    })),
    assessments: ASSESSMENT_ORDER.map((key) => {
      const item = ASSESSMENTS[key];
      const assessment = state.assessments[key];
      return {
        name: item.title,
        score: String(assessment.score || "").trim(),
        comment: String(
          assessmentComment(item, assessment, (text) =>
            applyPronoun(text, state)
          )
        ).trim(),
      };
    }),
    total: totalScore(state),
    scoreLabel: scoreLabel(state),
    partNotes: report.partNotes,
    att: report.att,
    part: report.part,
    texts: {
      uudiem: text("uudiem"),
      hanche: text("hanche"),
      kehoach: text("kehoach"),
      loinhan: text("loinhan"),
    },
  };
}

export function tabItems(state) {
  const items = getOrder(state).map((key) => [
    key,
    SK[key].name,
    SK[key].en,
    state.skills[key].sel[1].length +
      state.skills[key].sel[2].length +
      state.skills[key].sel[3].length,
  ]);
  const writingIndex = items.findIndex(([key]) => key === "viet");
  items.splice(
    writingIndex < 0 ? items.length : writingIndex + 1,
    0,
    ...ASSESSMENT_ORDER.map((key) => {
      const selected = state.assessments[key].sel;
      const count = [1, 2, 3].reduce(
        (total, step) => total + selected[step].length,
        0
      );
      return [
        key,
        ASSESSMENTS[key].label,
        ASSESSMENTS[key].en,
        count,
      ];
    })
  );
  return [
    ...items,
    ["gen", "Nhận xét chung", "", state.gen.sel.length],
    ["sum", "Tổng hợp", "", null],
    ["xuat", "Xuất báo cáo", "", null],
  ];
}

export function blankNewReport(state) {
  const next = blankState();
  next.pronoun = state.pronoun;
  next.rtype = state.rtype;
  next.program = state.program;
  next.tab = state.tab === "xuat" ? "nghe" : state.tab;
  next.rep = blankReport(state.rep);
  return next;
}

