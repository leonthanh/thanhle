import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import NotesCompletionEditor from "../NotesCompletionEditor";

jest.mock("react-quill", () => {
  const React = require("react");
  return function MockReactQuill({ value, onChange }) {
    return React.createElement("textarea", {
      value: value || "",
      onChange: (event) => onChange(event.target.value),
    });
  };
});

test("supports a word limit allowing up to three words or a number", () => {
  const onChange = jest.fn();
  render(<NotesCompletionEditor question={{}} onChange={onChange} />);

  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "NO MORE THAN THREE WORDS OR A NUMBER" },
  });

  expect(onChange).toHaveBeenCalledWith(
    "wordLimit",
    "NO MORE THAN THREE WORDS OR A NUMBER"
  );
});

test("lets Prepare Listening enter and preview a score note", () => {
  const onChange = jest.fn();
  const question = {
    notesText: "The answer is ___.",
    scoreNote: "",
  };
  const { rerender } = render(
    <NotesCompletionEditor
      question={question}
      onChange={onChange}
      testType="exam-listening-v1"
    />
  );

  const scoreNoteInput = screen.getByLabelText("Ghi chú điểm (footer)");
  fireEvent.change(scoreNoteInput, {
    target: { value: "____/5 (1 mark per answer)" },
  });

  expect(onChange).toHaveBeenCalledWith(
    "scoreNote",
    "____/5 (1 mark per answer)"
  );
  rerender(
    <NotesCompletionEditor
      question={{ ...question, scoreNote: "____/5 (1 mark per answer)" }}
      onChange={onChange}
      testType="exam-listening-v1"
    />
  );
  expect(screen.getByText("____/5 (1 mark per answer)")).toBeInTheDocument();
});
