import { normalizeNotesCompletionParts } from "../normalizePromptHtml";

test("removes blank Quill paragraphs from Notes Completion while preserving other questions", () => {
  const unrelatedSection = {
    questionType: "fill",
    questions: [{ questionText: "Question", correctAnswer: "answer" }],
  };
  const sourceHtml = [
    "<p>Example: Name: Teenage Years</p>",
    '<p style="margin-top: 0"><br></p>',
    "<ul><li>Finishes: ___ March</li></ul>",
  ].join("");
  const parts = [{
    sections: [
      {
        questionType: "notes-completion",
        questions: [{ notesText: sourceHtml, answers: { 1: "15th" } }],
      },
      unrelatedSection,
    ],
  }];

  const normalized = normalizeNotesCompletionParts(parts);

  expect(normalized[0].sections[0].questions[0].notesText).toBe(
    "<p>Example: Name: Teenage Years</p><ul><li>Finishes: ___ March</li></ul>"
  );
  expect(normalized[0].sections[0].questions[0].answers).toEqual({ 1: "15th" });
  expect(normalized[0].sections[1]).toBe(unrelatedSection);
  expect(parts[0].sections[0].questions[0].notesText).toBe(sourceHtml);
  expect(normalizeNotesCompletionParts(normalized)).toBe(normalized);
});
