import React from "react";

const SCORE_NOTE_PLACEHOLDER = "____/5 (1 mark per answer)";

export const PrepareListeningSectionScoreNoteFooter = ({
  scoreNote,
  isDarkMode = false,
}) => {
  const value = String(scoreNote || "").trim();
  if (!value) return null;

  return (
    <div
      style={{
        marginTop: "12px",
        textAlign: "right",
        fontSize: "13px",
        fontWeight: 600,
        color: isDarkMode ? "#fbbf24" : "#92400e",
      }}
    >
      {value}
    </div>
  );
};

const getOptionText = (option, label) =>
  String(option || "").replace(new RegExp(`^${label}\\.\\s*`, "i"), "");

export const PrepareListeningSectionScoreNotePreview = ({
  section,
  startingNumber,
}) => {
  const questions = Array.isArray(section.questions) ? section.questions : [];
  const firstQuestionNumber = Number(startingNumber) || 1;

  return (
    <div
      aria-label="Preview (như học sinh nhìn thấy)"
      style={{
        marginTop: "16px",
        padding: "16px",
        backgroundColor: "#fffbeb",
        border: "1px solid #fcd34d",
        borderRadius: "8px",
      }}
    >
      <h4 style={{ margin: "0 0 12px", color: "#92400e", fontSize: "14px" }}>
        Preview (như học sinh nhìn thấy)
      </h4>
      {section.sectionTitle && (
        <p style={{ margin: "0 0 12px", lineHeight: 1.6 }}>
          {section.sectionTitle}
        </p>
      )}
      {questions.length > 0 ? (
        questions.map((question, questionIndex) => (
          <div
            key={questionIndex}
            style={{
              padding: "12px 0",
              borderBottom:
                questionIndex < questions.length - 1
                  ? "1px solid #fde68a"
                  : "none",
            }}
          >
            <div style={{ marginBottom: "8px", lineHeight: 1.6 }}>
              <strong>{firstQuestionNumber + questionIndex}.</strong>{" "}
              {question.questionText || "Chưa nhập câu hỏi."}
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              {(Array.isArray(question.options) ? question.options : []).map(
                (option, optionIndex) => {
                  const label = String.fromCharCode(65 + optionIndex);
                  return (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: "20px",
                          height: "20px",
                          flexShrink: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid #9ca3af",
                          borderRadius: "50%",
                          fontSize: "11px",
                        }}
                      />
                      <strong style={{ minWidth: "18px", fontSize: "12px" }}>
                        {label}.
                      </strong>
                      <span>{getOptionText(option, label)}</span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        ))
      ) : (
        <p style={{ margin: 0, color: "#6b7280" }}>Chưa có câu hỏi để xem trước.</p>
      )}
      <PrepareListeningSectionScoreNoteFooter scoreNote={section.scoreNote} />
    </div>
  );
};

export const PrepareListeningSectionScoreNoteInput = ({
  scoreNote,
  onChange,
}) => (
  <div style={{ marginTop: "16px" }}>
    <label
      htmlFor="prepare-listening-section-score-note"
      style={{
        display: "block",
        marginBottom: "6px",
        fontWeight: 600,
        fontSize: "12px",
        color: "#6b7280",
      }}
    >
      Ghi chú điểm (footer)
    </label>
    <input
      id="prepare-listening-section-score-note"
      type="text"
      value={scoreNote || ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={SCORE_NOTE_PLACEHOLDER}
      style={{
        width: "100%",
        padding: "8px 12px",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        fontSize: "13px",
        boxSizing: "border-box",
      }}
    />
  </div>
);
