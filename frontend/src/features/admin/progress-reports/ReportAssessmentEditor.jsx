import React, { useState } from "react";
import { assessmentComment, composeAssessment } from "./reportAssessmentData";
import "./ReportAssessmentEditor.css";

function formattedText(text) {
  return String(text).split(/(\[[^\]]*\])/g).map((part, index) =>
    part.startsWith("[") && part.endsWith("]") ? (
      <span className="ph" key={`${part}-${index}`}>
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    )
  );
}

function AddAssessmentPhrase({ step, onAdd }) {
  const [value, setValue] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    onAdd(step, text);
    setValue("");
  };

  return (
    <form className="add" onSubmit={submit}>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Thêm câu của riêng bạn..."
        aria-label={`Thêm câu riêng bước ${step.number}`}
      />
      <button type="submit">Thêm</button>
    </form>
  );
}

export default function ReportAssessmentEditor({
  assessmentKey,
  item,
  assessment,
  student,
  formatText,
  onAssessmentChange,
  onCopy,
}) {
  const selectedFor = (step) => assessment.sel?.[step.number] || [];
  const phraseText = (phrase) =>
    typeof formatText === "function" ? formatText(phrase) : phrase;
  const freshComment = composeAssessment(item, assessment, formatText);
  const comment = assessmentComment(item, assessment, formatText);
  const hasOverride = typeof assessment.override === "string";
  const isStale = hasOverride && assessment.override !== freshComment;
  const customPhrases = Object.entries(assessment.custom || {});
  const optionsFor = (step) => [
    ...step.phrases,
    ...customPhrases
      .filter(([id]) => id.startsWith(`c:${step.number}:`))
      .map(([id, text]) => ({ id, text })),
  ];
  const wordCount = comment.trim() ? comment.trim().split(/\s+/).length : 0;

  const togglePhrase = (step, phrase) => {
    const selected = selectedFor(step);
    const index = selected.indexOf(phrase.id);
    const nextSelected = selected.slice();
    if (index >= 0) nextSelected.splice(index, 1);
    else nextSelected.push(phrase.id);

    onAssessmentChange(assessmentKey, {
      sel: { ...assessment.sel, [step.number]: nextSelected },
    });
  };

  const addPhrase = (step, text) => {
    const id = `c:${step.number}:${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const selected = selectedFor(step);
    onAssessmentChange(assessmentKey, {
      sel: {
        ...assessment.sel,
        [step.number]: [...selected, id],
      },
      custom: { ...assessment.custom, [id]: text },
    });
  };

  const clearComments = () => {
    onAssessmentChange(assessmentKey, {
      override: null,
      sel: { 1: [], 2: [], 3: [] },
    });
  };

  return (
    <div className="pr-assessment">
      <div className="setup pr-assessment__setup">
        <div className="field">
          <label className="lbl" htmlFor={`assessment-score-${assessmentKey}`}>
            {item.title}
          </label>
          <div className="score">
            <input
              id={`assessment-score-${assessmentKey}`}
              value={assessment.score}
              placeholder={item.scorePlaceholder || "VD: 8/10"}
              autoComplete="off"
              onChange={(event) =>
                onAssessmentChange(assessmentKey, {
                  score: event.target.value.trim(),
                })
              }
            />
          </div>
        </div>
        <p className="pr-assessment__score-hint">{item.scoreHint}</p>
      </div>

      <p className="hint pr-assessment__hint">
        Bấm câu gợi ý để thêm hoặc bỏ câu; câu đã sửa tay sẽ được giữ lại. Có
        thể thêm câu riêng và sửa nhận xét ở khung bên phải cho phù hợp với từng
        học viên.
      </p>

      <div className="bench pr-assessment__bench">
        <div className="pr-assessment__steps">
          {item.steps.map((step) => {
            const selected = selectedFor(step);
            return (
              <section className="step pr-assessment__step" key={step.field}>
                <div className="step-h">
                  <div className="step-t">
                    <span className="step-n">{step.number}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <small>{step.helper}</small>
                    </div>
                  </div>
                  <span className="pr-assessment__count">
                    {selected.length} đã chọn
                  </span>
                </div>
                <ul className="list">
                  {optionsFor(step).map((phrase) => {
                    const position = selected.indexOf(phrase.id);
                    return (
                      <li key={phrase.id}>
                        <button
                          type="button"
                          className="opt"
                          aria-pressed={position >= 0}
                          onClick={() => togglePhrase(step, phrase)}
                        >
                          <span className="box">
                            {position >= 0 ? position + 1 : ""}
                          </span>
                          <span>{formattedText(phraseText(phrase.text))}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <AddAssessmentPhrase step={step} onAdd={addPhrase} />
              </section>
            );
          })}
        </div>

        <aside className="sheet pr-assessment__sheet" aria-label="Nhận xét">
          <div className="sheet-h">
            <h2>Nhận xét {item.label.toLowerCase()}</h2>
            <span>{student || "Học viên"}</span>
          </div>
          <div className="formula">
            {item.steps.map((step) => (
              <i
                className={selectedFor(step).length ? "on" : ""}
                key={step.field}
              >
                {item.formulaLabels?.[step.number - 1] || step.fieldLabel}
              </i>
            ))}
          </div>
          <textarea
            aria-label="Đoạn nhận xét, có thể sửa trực tiếp"
            value={comment}
            placeholder="Bấm chọn câu ở bên trái, đoạn nhận xét sẽ hiện ở đây. Bạn có thể sửa trực tiếp."
            onChange={(event) =>
              onAssessmentChange(assessmentKey, {
                override: event.target.value,
              })
            }
          />
          {hasOverride ? (
            <div className="notice info">
              <span>
                {isStale
                  ? "Bạn đã sửa tay; lựa chọn mới chưa được đưa vào."
                  : "Đang dùng bản bạn sửa tay."}
              </span>
              <button
                type="button"
                onClick={() =>
                  onAssessmentChange(assessmentKey, { override: null })
                }
              >
                Tạo lại từ lựa chọn
              </button>
            </div>
          ) : null}
          <div className="sheet-f">
            <span className="meta-s">
              {wordCount ? `${wordCount} từ` : "Chưa có nội dung"}
            </span>
            <div className="sheet-f__actions">
              <button
                className="btn"
                type="button"
                onClick={clearComments}
              >
                Xóa tất cả
              </button>
              <button
                className="btn primary"
                type="button"
                onClick={() => onCopy(comment)}
                disabled={!comment.trim()}
              >
                Sao chép
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
