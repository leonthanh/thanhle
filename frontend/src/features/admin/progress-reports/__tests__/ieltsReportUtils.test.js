import {
  buildIeltsPreviewHTML,
  countIeltsPreviewPlaceholders,
} from "../ieltsPreviewUtils";
import {
  autoBand,
  bandForSkill,
  blankState,
  normalizeState,
  overallBand,
  reportData,
  roundBand,
  taskBand,
} from "../ieltsReportUtils";

describe("IELTS progress report helpers", () => {
  test("rounds IELTS bands at the .25 and .75 boundaries", () => {
    expect(roundBand(6.24)).toBe(6);
    expect(roundBand(6.25)).toBe(6.5);
    expect(roundBand(6.74)).toBe(6.5);
    expect(roundBand(6.75)).toBe(7);
  });

  test("converts listening scores and applies the Writing task weighting", () => {
    const state = blankState();
    state.skills.L.parts = ["9", "8", "6", "5"];
    expect(autoBand(state, "L")).toBe(6.5);

    state.skills.W.crit = {
      t1: { TA: "6", CC: "6", LR: "6", GRA: "6" },
      t2: { TR: "7", CC: "7", LR: "7", GRA: "7" },
    };
    expect(taskBand(state, "t1")).toBe(6);
    expect(taskBand(state, "t2")).toBe(7);
    expect(autoBand(state, "W")).toBe(6.5);
  });

  test("normalizes an existing IELTS draft without dropping its answers or comments", () => {
    const state = normalizeState({
      student: "Lan",
      pronoun: "Con",
      level: "565a",
      rtype: "giua",
      tab: "W",
      skills: {
        L: {
          mode: "parts",
          parts: [8, 7],
          sel: { 1: ["band|r665|p|0"], 2: [], 3: [] },
          override: "Điểm mạnh:\n- Nhập học viên đã nghe rõ.",
        },
        W: {
          crit: {
            t1: { TA: "6", CC: "5", LR: "6", GRA: "5" },
            t2: { TR: "7", CC: "6", LR: "6", GRA: "6" },
          },
          tb: { t1: "", t2: "" },
        },
      },
      gen: { sel: ["open|0"], custom: {}, override: null },
      rep: {
        lop: "IELTS 5-6.5",
        inc: { L: false },
        detail: { L: true },
        att: { tong: 12 },
        texts: { uudiem: "Ghi nhận tiến bộ." },
      },
    });

    expect(state.student).toBe("Lan");
    expect(state.pronoun).toBe("Con");
    expect(state.skills.L.parts).toEqual(["8", "7", "", ""]);
    expect(state.skills.L.sel[1]).toEqual(["band|r665|p|0"]);
    expect(state.skills.L.override).toContain("đã nghe rõ");
    expect(state.skills.W.crit.t2.TR).toBe("7");
    expect(state.rep.inc.L).toBe(false);
    expect(state.rep.detail.L).toBe(true);
    expect(state.rep.att.tong).toBe("12");
    expect(state.rep.texts.uudiem).toBe("Ghi nhận tiến bộ.");
  });

  test("rounds the overall band and escapes report content in the preview", () => {
    const state = blankState();
    state.student = "<script>alert(1)</script>";
    state.skills.L.band = "6";
    state.skills.R.band = "6.5";
    state.skills.W.band = "7";
    state.skills.Sp.band = "7.5";
    state.skills.L.override = "<img src=x onerror=alert(1)>";

    expect(overallBand(state)).toBe(7);
    expect(bandForSkill(state, "W")).toBe(7);

    const html = buildIeltsPreviewHTML(reportData(state));
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
  });

  test("normalizes and includes vocabulary and homework assessments in the IELTS report", () => {
    const state = normalizeState({
      student: "Lan",
      assessments: {
        vocab: {
          score: "18/20",
          recognition: "<script>Em dùng collocations tự nhiên.</script>",
          sel: { 1: ["recognition-3"] },
        },
        homework: {
          suggestion: "Hoàn thành bài [Task 2] trước [Thứ Sáu].",
        },
      },
    });

    const data = reportData(state);
    const html = buildIeltsPreviewHTML(data);

    expect(state.assessments.vocab.sel).toEqual({
      1: ["recognition-3"],
      2: [],
      3: [],
    });
    expect(data.assessments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Điểm từ vựng",
          score: "18/20",
          comment:
            "Điểm mạnh:\n<script>Em dùng collocations tự nhiên.</script>",
        }),
        expect.objectContaining({
          name: "Điểm bài tập về nhà",
          comment:
            "Luyện tập:\nHoàn thành bài [Task 2] trước [Thứ Sáu].",
        }),
      ])
    );
    expect(html).toContain("Từ vựng và bài tập về nhà");
    expect(html).toContain(
      "&lt;script&gt;Em dùng collocations tự nhiên.&lt;/script&gt;"
    );
    expect(html).not.toContain("<script>");
    expect(countIeltsPreviewPlaceholders(data, html)).toBe(2);
  });
});
