import { buildPreviewHTML } from "../previewUtils";
import { normalizeState, reportData, tabItems } from "../reportUtils";

describe("progress report migration", () => {
  test("preserves existing scores and feedback in the saved report schema", () => {
    const state = normalizeState({
      student: "Linh",
      pronoun: "Con",
      rtype: "giua",
      program: "pr",
      tab: "vocab",
      skills: {
        nghe: { score: "17", sel: { 1: ["chung|good|0"], 2: [], 3: [] } },
      },
      assessments: {
        vocab: {
          score: "8/10",
          recognition: "Ghi nhớ tốt.",
          improvement: "Cần ôn thêm.",
          suggestion: "Ôn Unit 3.",
        },
        homework: { score: "9/10" },
      },
      rep: {
        lop: "PR2-A",
        gv: "Cô An",
        inc: { skills: true, att: false, part: false },
      },
    });

    const data = reportData(state);

    expect(data.student).toBe("Linh");
    expect(data.skills[0].score).toBe("17");
    expect(data.skills[0].comment).toContain("Con nghe hiểu tốt");
    expect(data.assessments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Điểm từ vựng",
          score: "8/10",
          comment:
            "Tích cực:\nGhi nhớ tốt.\n\nCần cải thiện:\nCần ôn thêm.\n\nLuyện tập:\nÔn Unit 3.",
        }),
        expect.objectContaining({
          name: "Điểm bài tập về nhà",
          score: "9/10",
        }),
      ])
    );
    expect(data.inc).toEqual({ skills: true, att: false, part: false });
    expect(state.assessments.vocab.sel).toEqual({ 1: [], 2: [], 3: [] });
    expect(state.assessments.vocab.custom).toEqual({});
  });

  test("normalizes selected assessment suggestions and shows their tab count", () => {
    const state = normalizeState({
      tab: "vocab",
      assessments: {
        vocab: {
          score: 8,
          recognition: "Con dùng từ mới trong câu.",
          sel: { 1: ["recognition-1"], 2: ["improvement-2"] },
          custom: { "c:3:homework": "Ôn lại từ theo chủ đề." },
        },
      },
    });

    expect(state.assessments.vocab.score).toBe("8");
    expect(state.assessments.vocab.override).toBe(
      "Tích cực:\nCon dùng từ mới trong câu."
    );
    expect(state.assessments.vocab.sel).toEqual({
      1: ["recognition-1"],
      2: ["improvement-2"],
      3: [],
    });
    expect(state.assessments.vocab.custom).toEqual({
      "c:3:homework": "Ôn lại từ theo chủ đề.",
    });
    expect(tabItems(state).find(([key]) => key === "vocab")[3]).toBe(2);
  });

  test("renders assessment preview tables and escapes teacher-entered text", () => {
    const state = normalizeState({
      student: "<Linh>",
      rtype: "thang",
      skills: {},
      assessments: {
        vocab: {
          score: "8/10",
          recognition: "<script>alert(1)</script>",
        },
      },
    });
    const html = buildPreviewHTML(reportData(state));

    expect(html).toContain('class="tb assessment-report-table"');
    expect(html).toContain("8/10");
    expect(html).toContain("&lt;Linh&gt;");
    expect(html).toContain(
      "&lt;script&gt;alert(1)&lt;/script&gt;"
    );
    expect(html).not.toContain("<script>");
  });
});
