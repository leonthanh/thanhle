import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  PrepareListeningSectionScoreNoteFooter,
  PrepareListeningSectionScoreNoteInput,
  PrepareListeningSectionScoreNotePreview,
} from "../PrepareListeningSectionScoreNote";

describe("PrepareListeningSectionScoreNote", () => {
  test("previews numbered multiple-choice questions with A/B/C labels", () => {
    const section = {
      sectionTitle: "Choose the correct answer: A, B or C.",
      scoreNote: "____/5 (1 mark per answer)",
      questions: [
        {
          questionText: "When does the interview begin?",
          options: ["A. Monday", "B. Tuesday", "C. Friday"],
          correctAnswer: "B",
        },
      ],
    };

    render(
      <PrepareListeningSectionScoreNotePreview
        section={section}
        startingNumber={6}
      />
    );

    expect(screen.getByText("Preview (như học sinh nhìn thấy)")).toBeInTheDocument();
    expect(screen.getByText("6.")).toBeInTheDocument();
    expect(screen.getByText("When does the interview begin?")).toBeInTheDocument();
    expect(screen.getByText("A.")).toBeInTheDocument();
    expect(screen.getByText("B.")).toBeInTheDocument();
    expect(screen.getByText("C.")).toBeInTheDocument();
    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getByText("Tuesday")).toBeInTheDocument();
    expect(screen.getByText("____/5 (1 mark per answer)")).toBeInTheDocument();
  });

  test("edits the score footer", () => {
    const onChange = jest.fn();

    render(
      <PrepareListeningSectionScoreNoteInput
        scoreNote="____/5 (1 mark per answer)"
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText("Ghi chú điểm (footer)"), {
      target: { value: "____/5" },
    });
    expect(onChange).toHaveBeenCalledWith("____/5");
  });

  test("does not render a student footer when the note is blank", () => {
    const { container } = render(<PrepareListeningSectionScoreNoteFooter scoreNote="" />);

    expect(container).toBeEmptyDOMElement();
  });
});
