import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReportPreview from "./ReportPreview";
import {
  ATT,
  GEN,
  GROUPS,
  LEVELS,
  ORDER,
  PART,
  RANGES,
  RNAME,
  SKILL,
  STEPT,
} from "./ieltsReportData";
import {
  ASSESSMENT_ORDER,
  IELTS_ASSESSMENTS,
} from "./reportAssessmentData";
import {
  STORAGE_KEY,
  applyPronoun,
  autoTexts,
  bandForSkill,
  bandRange,
  blankNewReport,
  blankState,
  composeGeneral,
  composeSkill,
  formatBand,
  getPhraseItems,
  getPhraseText,
  hasDetail,
  levelById,
  normalizeState,
  outputText,
  overallBand,
  parseNumber,
  partsTotal,
  placement,
  rangeForSkill,
  reportData,
  sampleState,
  showDetail,
  taskBand,
} from "./ieltsReportUtils";
import ReportAssessmentEditor from "./ReportAssessmentEditor";
import {
  buildIeltsPreviewHTML,
  countIeltsPreviewPlaceholders,
} from "./ieltsPreviewUtils";
import logoUrl from "./assets/star-edu-logo.png";
import "./StarEduReport.css";
import "./IeltsReport.css";

function readInitialState() {
  let state = blankState();
  let error = "";
  let seen = false;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        state = normalizeState(JSON.parse(saved));
      } catch {
        error = "Không thể đọc dữ liệu báo cáo đã lưu; đang mở báo cáo trống.";
      }
    }
    seen = Boolean(window.localStorage.getItem(`${STORAGE_KEY}-seen`));
    window.localStorage.setItem(`${STORAGE_KEY}-seen`, "1");
  } catch {
    error =
      "Trình duyệt không cho phép truy cập bộ nhớ cục bộ; dữ liệu có thể không được lưu.";
  }

  if (!seen && !state.student) state = sampleState();
  return { state, error };
}

function updatePhraseSelection(state, skill, step, update) {
  if (skill === "gen") {
    const selected = state.gen.sel.slice();
    if (!update(selected)) return state;
    return { ...state, gen: { ...state.gen, sel: selected } };
  }

  const selected = state.skills[skill].sel[String(step)].slice();
  if (!update(selected)) return state;
  return {
    ...state,
    skills: {
      ...state.skills,
      [skill]: {
        ...state.skills[skill],
        sel: { ...state.skills[skill].sel, [String(step)]: selected },
      },
    },
  };
}

function FormattedPhrase({ text }) {
  return String(text || "")
    .split(/(\[[^\]]*\])/g)
    .map((part, index) =>
      part.startsWith("[") && part.endsWith("]") ? (
        <span className="ph" key={`${part}-${index}`}>
          {part}
        </span>
      ) : (
        <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
      )
    );
}

function PhraseOption({
  state,
  skill,
  step,
  id,
  text,
  label,
  tag,
  selected,
  position,
  onToggle,
}) {
  return (
    <li>
      <button
        type="button"
        className="opt"
        data-skill={skill}
        data-step={step}
        data-id={id}
        aria-pressed={selected}
        onClick={() => onToggle(skill, step, id)}
      >
        <span className="box">{selected ? position + 1 : ""}</span>
        <span>
          {label ? (
            <>
              <b>{label}:</b>{" "}
              <FormattedPhrase text={applyPronoun(text, state)} />
            </>
          ) : (
            <FormattedPhrase text={applyPronoun(text, state)} />
          )}
          {tag ? <span className="tag">{tag}</span> : null}
        </span>
      </button>
    </li>
  );
}

function AddPhrase({ skill, step, onAdd }) {
  const [value, setValue] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    onAdd(skill, step, text);
    setValue("");
  };

  return (
    <form className="add" data-skill={skill} data-step={step} onSubmit={submit}>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Thêm câu của riêng bạn..."
        aria-label={
          skill === "gen"
            ? `Thêm câu riêng ${step}`
            : `Thêm câu riêng bước ${step}`
        }
      />
      <button type="submit">Thêm</button>
    </form>
  );
}

function StepEditor({
  state,
  skill,
  step,
  onToggle,
  onAdd,
  onGroupChange,
  onRangeChange,
  onRangeReset,
}) {
  const current = state.skills[skill];
  const group = step === 1 ? current.g1 : step === 2 ? current.g2 : "tips";
  const selected = current.sel[step];
  const options = getPhraseItems(state, skill, step, group);
  const custom = Object.keys(current.custom)
    .filter((id) => id.startsWith(`c:${step}:`))
    .map((id) => ({ id, text: current.custom[id], tag: "câu riêng" }));
  const availableGroups = step < 3 ? GROUPS[skill] : [];
  const currentBand = bandForSkill(state, skill);
  const automaticRange = currentBand == null ? null : bandRange(currentBand);
  const emptyMessage = {
    idp: "Chọn band cho các tiêu chí ở bảng chấm điểm phía trên để hiện mô tả IDP tương ứng.",
    desc: "Chấm đủ 4 tiêu chí của Task 1 hoặc Task 2 để hiện mô tả band của bài.",
    parts: "",
    band: "Không có câu phù hợp ở khoảng band này.",
    tips: "",
  }[group];

  return (
    <section className="step">
      <div className="step-h">
        <div className="step-t">
          <span className="step-n">{step}</span>
          <div>
            <h3>{STEPT[step][0]}</h3>
            <small>{STEPT[step][1]}</small>
          </div>
        </div>
        {availableGroups.length ? (
          <div className="groups" role="group" aria-label="Nhóm câu">
            {availableGroups.map(([key, label]) => (
              <button
                type="button"
                key={key}
                data-g={key}
                aria-pressed={group === key}
                onClick={() => onGroupChange(skill, step, key)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {step < 3 && group === "band" ? (
        <div className="rng">
          <span className="lbl">Khoảng band</span>
          {Object.entries(RANGES).map(([key, label]) => (
            <button
              type="button"
              key={key}
              data-rng={key}
              aria-pressed={rangeForSkill(state, skill) === key}
              onClick={() => onRangeChange(skill, key)}
            >
              {label.replace("Band ", "")}
              {automaticRange === key ? " •" : ""}
            </button>
          ))}
          {current.rng ? (
            <button
              type="button"
              className="link"
              onClick={() => onRangeReset(skill)}
            >
              Theo điểm
            </button>
          ) : null}
        </div>
      ) : null}
      {options.length || custom.length ? (
        <ul className="list">
          {options.map((option) => {
            const position = selected.indexOf(option.id);
            return (
              <PhraseOption
                key={option.id}
                state={state}
                skill={skill}
                step={step}
                {...option}
                selected={position >= 0}
                position={position}
                onToggle={onToggle}
              />
            );
          })}
          {custom.map((option) => {
            const position = selected.indexOf(option.id);
            return (
              <PhraseOption
                key={option.id}
                state={state}
                skill={skill}
                step={step}
                {...option}
                selected={position >= 0}
                position={position}
                onToggle={onToggle}
              />
            );
          })}
        </ul>
      ) : (
        <p className="empty">{emptyMessage || "Chưa có câu phù hợp."}</p>
      )}
      <AddPhrase skill={skill} step={step} onAdd={onAdd} />
    </section>
  );
}

function CommentSheet({
  state,
  skill,
  title,
  onTextChange,
  onToggle,
  onMove,
  onReorder,
  onClear,
  onRegenerate,
  onCopy,
}) {
  const isGeneral = skill === "gen";
  const source = isGeneral ? state.gen : state.skills[skill];
  const fresh = isGeneral ? composeGeneral(state) : composeSkill(state, skill);
  const displayedText = outputText(state, skill);
  const [text, setText] = useState(displayedText);
  const textAreaRef = useRef(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const selectedItems = isGeneral
    ? source.sel.map((id) => [0, id])
    : [1, 2, 3].flatMap((step) =>
        source.sel[step].map((id) => [step, id])
      );
  const placeholders = (text.match(/\[[^\]]*\]/g) || []).length;
  const stale = source.override !== null && source.override !== fresh;
  const pickedGroup = (step) =>
    isGeneral ? source.sel : source.sel[step];

  useEffect(() => setText(displayedText), [displayedText]);

  return (
    <aside className="sheet" aria-label="Nhận xét">
      <div className="sheet-h">
        <h2>{title}</h2>
        <span>
          {state.student || "Học viên"}
          {!isGeneral && bandForSkill(state, skill) != null
            ? ` · Band ${formatBand(bandForSkill(state, skill))}`
            : ""}
        </span>
      </div>
      {!isGeneral ? (
        <div className="formula">
          {[1, 2, 3].map((step) => (
            <i
              className={source.sel[step].length ? "on" : ""}
              key={step}
            >
              {["", "① Điểm mạnh", "② Cần cải thiện", "③ Luyện tập"][step]}
            </i>
          ))}
        </div>
      ) : null}
      <textarea
        ref={textAreaRef}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          onTextChange(skill, event.target.value);
        }}
        aria-label="Đoạn nhận xét, có thể sửa trực tiếp"
        placeholder="Bấm chọn câu ở bên trái, đoạn nhận xét sẽ hiện ở đây. Bạn có thể sửa trực tiếp."
      />
      {placeholders ? (
        <div className="notice warn">
          <span>Còn {placeholders} chỗ [...] cần điền thông tin cụ thể.</span>
        </div>
      ) : null}
      {source.override !== null ? (
        <div className="notice info">
          <span>
            {stale
              ? "Bạn đã sửa tay; lựa chọn mới chưa được đưa vào."
              : "Đang dùng bản bạn sửa tay."}
            {isGeneral
              ? ""
              : " Giữ nguyên các dòng tiêu đề (Điểm mạnh: / Cần cải thiện: / Gợi ý luyện tập:) để phần sửa tự chuyển sang tab Xuất báo cáo."}
          </span>
          <button type="button" onClick={() => onRegenerate(skill)}>
            Tạo lại từ lựa chọn
          </button>
        </div>
      ) : null}
      {selectedItems.length ? (
        <div className="sel">
          <div className="sel-h">
            Thứ tự câu{" "}
            <small>
              kéo thả hoặc dùng nút ↑↓
              {isGeneral ? "" : " trong từng bước"}
            </small>
          </div>
          <ul className="picked">
            {selectedItems.map(([step, id]) => {
              const selected = pickedGroup(step);
              const position = selected.indexOf(id);
              const isDragging =
                draggedItem?.id === id && draggedItem.step === step;
              const marker =
                dropTarget?.id === id && dropTarget.step === step
                  ? dropTarget.position
                  : "";
              return (
                <li
                  key={`${step}-${id}`}
                  draggable="true"
                  data-did={id}
                  data-dstep={step}
                  className={[
                    isDragging ? "dragging" : "",
                    marker === "top" ? "over-top" : "",
                    marker === "bottom" ? "over-bot" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onDragStart={(event) => {
                    setDraggedItem({ step, id });
                    setDropTarget(null);
                    if (event.dataTransfer) {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", id);
                    }
                  }}
                  onDragOver={(event) => {
                    if (
                      !draggedItem ||
                      (!isGeneral && draggedItem.step !== step)
                    ) {
                      return;
                    }
                    event.preventDefault();
                    if (event.dataTransfer) {
                      event.dataTransfer.dropEffect = "move";
                    }
                    const rect = event.currentTarget.getBoundingClientRect();
                    const position =
                      event.clientY < rect.top + rect.height / 2
                        ? "top"
                        : "bottom";
                    setDropTarget((current) =>
                      current?.id === id &&
                      current.step === step &&
                      current.position === position
                        ? current
                        : { step, id, position }
                    );
                  }}
                  onDrop={(event) => {
                    if (
                      !draggedItem ||
                      (!isGeneral && draggedItem.step !== step)
                    ) {
                      return;
                    }
                    event.preventDefault();
                    const rect = event.currentTarget.getBoundingClientRect();
                    onReorder(
                      skill,
                      step,
                      draggedItem.id,
                      id,
                      event.clientY >= rect.top + rect.height / 2
                    );
                    setDraggedItem(null);
                    setDropTarget(null);
                  }}
                  onDragEnd={() => {
                    setDraggedItem(null);
                    setDropTarget(null);
                  }}
                >
                  <span className="grip" aria-hidden="true">
                    ⋮⋮
                  </span>
                  <span className="k">{step || "•"}</span>
                  <span className="tx2">
                    <FormattedPhrase
                      text={applyPronoun(
                        getPhraseText(state, skill, id),
                        state
                      )}
                    />
                  </span>
                  <span className="mv">
                    <button
                      type="button"
                      title="Lên"
                      aria-label="Chuyển lên"
                      disabled={position === 0}
                      onClick={() => onMove(skill, step, id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      title="Xuống"
                      aria-label="Chuyển xuống"
                      disabled={position === selected.length - 1}
                      onClick={() => onMove(skill, step, id, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      title="Bỏ câu này"
                      aria-label="Bỏ câu này"
                      onClick={() => onToggle(skill, step, id)}
                    >
                      ×
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <div className="sheet-f">
        <span className="meta-s">
          {text.trim()
            ? `${text.trim().split(/\s+/).length} từ`
            : "Chưa có nội dung"}
        </span>
        <div className="sheet-f__actions">
          <button className="btn" type="button" onClick={() => onClear(skill)}>
            Xóa tất cả
          </button>
          <button
            className="btn primary"
            type="button"
            onClick={() => onCopy(text, textAreaRef.current)}
          >
            Sao chép
          </button>
        </div>
      </div>
    </aside>
  );
}

function BandBox({ state, skill }) {
  const score = bandForSkill(state, skill);
  const adjusted = parseNumber(state.skills[skill].band) != null;
  const bandDescription =
    score == null
      ? "chưa đủ dữ liệu"
      : `${RANGES[bandRange(score)]}${adjusted ? " · đã điều chỉnh" : ""}`;
  return (
    <div className="bandbox">
      <span className="lbl">Band {SKILL[skill].name}</span>
      <b>{score == null ? "–" : formatBand(score)}</b>
      <small>{bandDescription}</small>
    </div>
  );
}

function BandOverride({ state, skill, onChange }) {
  return (
    <label className="ff ovr" htmlFor={`band-${skill}`}>
      <span className="lbl">
        Điều chỉnh band <i>(không bắt buộc)</i>
      </span>
      <input
        id={`band-${skill}`}
        inputMode="decimal"
        placeholder="Tự tính"
        value={state.skills[skill].band}
        onChange={(event) => onChange(skill, { band: event.target.value })}
      />
    </label>
  );
}

function BandSelect({ value, label, onChange }) {
  return (
    <select
      value={value}
      aria-label={label}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">–</option>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((score) => (
        <option value={score} key={score}>
          {score}
        </option>
      ))}
    </select>
  );
}

function ScorePanel({ state, skill, onSkillChange, onCriterionChange }) {
  const current = state.skills[skill];
  if (skill === "L" || skill === "R") {
    const total = partsTotal(state, skill);
    const totalMode = current.mode === "total";
    return (
      <section className="scard">
        <div className="sc-h sc-hx">
          <div>
            <h3>Số câu đúng · {SKILL[skill].name}</h3>
            <small>Band quy đổi theo bảng Score Convert (40 câu)</small>
          </div>
          <div className="seg mode" role="group" aria-label="Cách nhập điểm">
            <button
              type="button"
              aria-pressed={!totalMode}
              onClick={() => onSkillChange(skill, { mode: "parts" })}
            >
              Nhập từng {SKILL[skill].pn.toLowerCase()}
            </button>
            <button
              type="button"
              aria-pressed={totalMode}
              onClick={() => onSkillChange(skill, { mode: "total" })}
            >
              Nhập tổng số câu
            </button>
          </div>
        </div>
        <div className="sc-b">
          <div className="parts-in">
            {totalMode ? (
              <label className="ff tin" htmlFor={`total-${skill}`}>
                <span className="lbl">
                  Tổng số câu đúng <i>/40</i>
                </span>
                <input
                  id={`total-${skill}`}
                  inputMode="numeric"
                  placeholder="0"
                  value={current.total}
                  onChange={(event) =>
                    onSkillChange(skill, {
                      total: event.target.value.replace(/[^\d]/g, "").slice(0, 2),
                    })
                  }
                />
              </label>
            ) : (
              <>
                {SKILL[skill].max.map((max, index) => (
                  <label
                    className="ff"
                    htmlFor={`part-${skill}-${index}`}
                    key={index}
                  >
                    <span className="lbl">
                      {SKILL[skill].pn} {index + 1} <i>/{max}</i>
                    </span>
                    <input
                      id={`part-${skill}-${index}`}
                      inputMode="numeric"
                      placeholder="0"
                      value={current.parts[index]}
                      onChange={(event) => {
                        const parts = current.parts.slice();
                        parts[index] = event.target.value
                          .replace(/[^\d]/g, "")
                          .slice(0, 2);
                        onSkillChange(skill, { parts });
                      }}
                    />
                  </label>
                ))}
                <div className="ff tot">
                  <span className="lbl">Tổng</span>
                  <b>{total == null ? "–" : `${total}/40`}</b>
                </div>
              </>
            )}
          </div>
          <BandBox state={state} skill={skill} />
          <BandOverride
            state={state}
            skill={skill}
            onChange={onSkillChange}
          />
        </div>
      </section>
    );
  }

  if (skill === "W") {
    const rows = CRIT_ROWS_WRITING;
    return (
      <section className="scard">
        <div className="sc-h">
          <h3>Chấm Writing theo tiêu chí IDP</h3>
          <small>
            Band từng bài = trung bình 4 tiêu chí (có thể điều chỉnh thủ công);
            band Writing = (Task 1 + 2 × Task 2) ÷ 3, làm tròn theo IELTS
          </small>
        </div>
        <div className="sc-b">
          <div className="ctb-wrap">
            <table className="ctb">
              <thead>
                <tr>
                  <th></th>
                  <th>Task 1</th>
                  <th>Task 2</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ task1, task2, label, vietnamese }) => (
                  <tr key={task1}>
                    <th>
                      <b>{label}</b>
                      <small>{vietnamese}</small>
                    </th>
                    <td>
                      <BandSelect
                        value={current.crit.t1[task1]}
                        label={`Task 1 ${label}`}
                        onChange={(value) =>
                          onCriterionChange("W", "t1", task1, value)
                        }
                      />
                    </td>
                    <td>
                      <BandSelect
                        value={current.crit.t2[task2]}
                        label={`Task 2 ${label}`}
                        onChange={(value) =>
                          onCriterionChange("W", "t2", task2, value)
                        }
                      />
                    </td>
                  </tr>
                ))}
                <tr className="tb-tot">
                  <th>Band từng bài</th>
                  {["t1", "t2"].map((task) => (
                    <td key={task}>
                      {formatBand(taskBand(state, task)) || "–"}
                      {parseNumber(current.tb[task]) != null ? (
                        <small className="adj">đã điều chỉnh</small>
                      ) : null}
                    </td>
                  ))}
                </tr>
                <tr className="tb-adj">
                  <th>
                    <b>Điều chỉnh band từng bài</b>
                    <small>không bắt buộc; để trống = tự tính</small>
                  </th>
                  {["t1", "t2"].map((task) => (
                    <td key={task}>
                      <input
                        inputMode="decimal"
                        placeholder="Tự tính"
                        aria-label={`Điều chỉnh band ${
                          task === "t1" ? "Task 1" : "Task 2"
                        }`}
                        value={current.tb[task]}
                        onChange={(event) =>
                          onCriterionChange(
                            "W",
                            task,
                            "tb",
                            event.target.value
                              .replace(",", ".")
                              .replace(/[^\d.]/g, "")
                              .slice(0, 3)
                          )
                        }
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <BandBox state={state} skill={skill} />
          <BandOverride
            state={state}
            skill={skill}
            onChange={onSkillChange}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="scard">
      <div className="sc-h">
        <h3>Chấm Speaking theo tiêu chí IDP</h3>
        <small>Band Speaking = trung bình 4 tiêu chí, làm tròn theo IELTS</small>
      </div>
      <div className="sc-b">
        <div className="ctb-wrap">
          <table className="ctb">
            <tbody>
              {CRIT_ROWS_SPEAKING.map(([key, english, vietnamese]) => (
                <tr key={key}>
                  <th>
                    <b>{english}</b>
                    <small>{vietnamese}</small>
                  </th>
                  <td>
                    <BandSelect
                      value={current.crit[key]}
                      label={english}
                      onChange={(value) =>
                        onCriterionChange("Sp", "", key, value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <BandBox state={state} skill={skill} />
        <BandOverride
          state={state}
          skill={skill}
          onChange={onSkillChange}
        />
      </div>
    </section>
  );
}

const CRIT_ROWS_WRITING = [
  {
    task1: "TA",
    task2: "TR",
    label: "Task Achievement / Task Response",
    vietnamese: "Hoàn thành yêu cầu đề bài",
  },
  {
    task1: "CC",
    task2: "CC",
    label: "Coherence & Cohesion",
    vietnamese: "Mạch lạc và liên kết",
  },
  {
    task1: "LR",
    task2: "LR",
    label: "Lexical Resource",
    vietnamese: "Vốn từ vựng",
  },
  {
    task1: "GRA",
    task2: "GRA",
    label: "Grammatical Range & Accuracy",
    vietnamese: "Ngữ pháp",
  },
];
const CRIT_ROWS_SPEAKING = [
  ["FC", "Fluency & Coherence", "Lưu loát và mạch lạc"],
  ["LR", "Lexical Resource", "Vốn từ vựng"],
  ["GRA", "Grammatical Range & Accuracy", "Ngữ pháp"],
  ["P", "Pronunciation", "Phát âm"],
];

function SkillEditor({
  state,
  skill,
  onSkillChange,
  onCriterionChange,
  onToggle,
  onAdd,
  onGroupChange,
  onRangeChange,
  onRangeReset,
  onTextChange,
  onMove,
  onReorder,
  onClear,
  onRegenerate,
  onCopy,
}) {
  return (
    <>
      <ScorePanel
        state={state}
        skill={skill}
        onSkillChange={onSkillChange}
        onCriterionChange={onCriterionChange}
      />
      <div className="bench">
        <div>
          {[1, 2, 3].map((step) => (
            <StepEditor
              key={step}
              state={state}
              skill={skill}
              step={step}
              onToggle={onToggle}
              onAdd={onAdd}
              onGroupChange={onGroupChange}
              onRangeChange={onRangeChange}
              onRangeReset={onRangeReset}
            />
          ))}
        </div>
        <CommentSheet
          state={state}
          skill={skill}
          title={`Nhận xét ${SKILL[skill].name}`}
          onTextChange={onTextChange}
          onToggle={onToggle}
          onMove={onMove}
          onReorder={onReorder}
          onClear={onClear}
          onRegenerate={onRegenerate}
          onCopy={onCopy}
        />
      </div>
    </>
  );
}

function GeneralSection({
  state,
  category,
  title,
  subtitle,
  items,
  onToggle,
  onAdd,
}) {
  const selected = state.gen.sel;
  const custom = Object.keys(state.gen.custom)
    .filter((id) => id.startsWith(`c:${category}:`))
    .map((id) => ({
      id,
      text: state.gen.custom[id],
      tag: "câu riêng",
    }));

  return (
    <section className="step">
      <div className="step-h">
        <div className="step-t">
          <div>
            <h3>{title}</h3>
            {subtitle ? <small>{subtitle}</small> : null}
          </div>
        </div>
      </div>
      <ul className="list">
        {[...items, ...custom].map((item) => {
          const id = item.id || `${category}|${item.index}`;
          const position = selected.indexOf(id);
          return (
            <PhraseOption
              key={id}
              state={state}
              skill="gen"
              step={category}
              id={id}
              text={item.text}
              label={item.label}
              tag={item.tag}
              selected={position >= 0}
              position={position}
              onToggle={onToggle}
            />
          );
        })}
      </ul>
      <AddPhrase skill="gen" step={category} onAdd={onAdd} />
    </section>
  );
}

function GeneralEditor({
  state,
  onToggle,
  onAdd,
  onTextChange,
  onMove,
  onReorder,
  onClear,
  onRegenerate,
  onCopy,
}) {
  const endings = GEN.end
    .map(([type, text], index) => ({
      index,
      text,
      type,
      tag:
        type === "*"
          ? ""
          : { dauvao: "đầu vào", giua: "giữa khóa", cuoi: "cuối khóa" }[type] ||
            "định kỳ",
    }))
    .filter((item) => item.type === "*" || item.type === state.rtype);

  return (
    <>
      <p className="hint">
        Dùng cho các mục Điểm mạnh, Cần cải thiện và Lời nhắn của báo cáo. Câu
        kết đang lọc theo loại báo cáo: <b>{RNAME[state.rtype]}</b>.
      </p>
      <div className="bench">
        <div>
          <GeneralSection
            state={state}
            category="open"
            title="Câu mở đầu"
            subtitle="đặt ở đầu phần nhận xét"
            items={GEN.open.map((text, index) => ({ index, text }))}
            onToggle={onToggle}
            onAdd={onAdd}
          />
          <GeneralSection
            state={state}
            category="att"
            title="Thái độ học tập"
            subtitle="chuyên cần, bài tập, tự học"
            items={GEN.att.map(([label, text], index) => ({
              index,
              label,
              text,
            }))}
            onToggle={onToggle}
            onAdd={onAdd}
          />
          <GeneralSection
            state={state}
            category="end"
            title="Câu kết và lời nhắn"
            items={endings}
            onToggle={onToggle}
            onAdd={onAdd}
          />
        </div>
        <CommentSheet
          state={state}
          skill="gen"
          title="Nhận xét chung"
          onTextChange={onTextChange}
          onToggle={onToggle}
          onMove={onMove}
          onReorder={onReorder}
          onClear={onClear}
          onRegenerate={onRegenerate}
          onCopy={onCopy}
        />
      </div>
    </>
  );
}

function InputField({ id, label, value, placeholder, onChange, inputMode }) {
  return (
    <label className="ff" htmlFor={id}>
      <span className="lbl">{label}</span>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ExportEditor({
  state,
  onReportChange,
  onLevelChange,
  onParticipationChange,
  onPreview,
  onExport,
  exporting,
  exportStatus,
}) {
  const report = state.rep;
  const type = state.rtype;
  const overall = overallBand(state);
  const data = reportData(state);
  const automatic = autoTexts(state);
  const includeBox = (key, label) => (
    <label className="chk">
      <input
        type="checkbox"
        checked={report.inc[key]}
        onChange={(event) =>
          onReportChange(`inc.${key}`, event.target.checked)
        }
      />{" "}
      {label || "Đưa vào báo cáo"}
    </label>
  );
  const reportTextField = (key, label, placeholder) => {
    const edited = report.texts[key] !== null;
    return (
      <div className="tx" key={key}>
        <div className="tx-h">
          <label className="lbl" htmlFor={`report-text-${key}`}>
            {label}
          </label>
          {edited ? (
            <button
              type="button"
              className="link"
              onClick={() => onReportChange(`texts.${key}`, null)}
            >
              Lấy lại từ nhận xét
            </button>
          ) : (
            <span className="auto">Tự cập nhật theo nhận xét các kỹ năng</span>
          )}
        </div>
        <textarea
          id={`report-text-${key}`}
          rows="4"
          value={report.texts[key] ?? automatic[key]}
          placeholder={placeholder}
          onChange={(event) =>
            onReportChange(`texts.${key}`, event.target.value)
          }
        />
      </div>
    );
  };

  const missing = [];
  if (!state.student.trim()) missing.push("tên học viên");
  if (!state.level) missing.push("cấp độ");
  ORDER.forEach((skill) => {
    if (report.inc[skill] && bandForSkill(state, skill) == null) {
      missing.push(`band ${SKILL[skill].name}`);
    }
  });
  if (type !== "dauvao") {
    if (report.inc.att && !report.att.tong) missing.push("số buổi học");
    if (report.inc.part && !report.part.some(Boolean)) {
      missing.push("mức độ tham gia");
    }
  }
  const placeholderCount = [
    ...ORDER.filter((skill) => report.inc[skill]).map(
      (skill) => data[skill].comment
    ),
    ...Object.values(data.texts),
  ]
    .join(" ")
    .match(/\[[^\]]*\]/g)?.length;
  if (placeholderCount) {
    missing.push(`${placeholderCount} chỗ [...] chưa thay bằng thông tin cụ thể`);
  }
  const recommendedLevel = placement(overall);
  const typeTitle = {
    dauvao: "Thi đầu vào",
    thang: "Kiểm tra định kỳ",
    giua: "Thi giữa khóa",
    cuoi: "Thi cuối khóa",
  }[type];
  const levelField = (
    <label className="ff" htmlFor="report-level">
      <span className="lbl">
        {type === "dauvao" ? "Cấp độ đề xuất" : "Cấp độ"}
      </span>
      <select
        id="report-level"
        value={state.level}
        onChange={(event) => onLevelChange(event.target.value)}
      >
        <option value="">Chọn cấp độ</option>
        {LEVELS.map((level) => (
          <option value={level.id} key={level.id}>
            {level.name}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <>
      <p className="hint">
        Kiểm tra kết quả, điền thông tin còn lại rồi tải file Word trên giấy
        tiêu đề Star Edu. Bốn ô nhận xét cuối tự cập nhật theo nhận xét ở các
        tab kỹ năng và Nhận xét chung.
      </p>
      <div className="bench">
        <div className="exp">
          <section className="step">
            <div className="step-h">
              <div className="step-t">
                <div>
                  <h3>Thông tin chung · {typeTitle}</h3>
                  <small>Thông tin lớp được giữ lại khi tạo báo cáo mới</small>
                </div>
              </div>
            </div>
            <div className="grid">
              <InputField
                id="report-class"
                label={type === "dauvao" ? "Lớp học (nếu có)" : "Lớp học"}
                value={report.lop}
                placeholder="VD: IELTS 5-6.5"
                onChange={(value) => onReportChange("lop", value)}
              />
              {levelField}
              <InputField
                id="report-teacher"
                label="Giáo viên phụ trách"
                value={report.gv}
                placeholder="Tên giáo viên"
                onChange={(value) => onReportChange("gv", value)}
              />
              {type === "thang" ? (
                <InputField
                  id="report-month"
                  label="Tháng / Năm"
                  value={report.thang}
                  placeholder="VD: 10/2026"
                  onChange={(value) => onReportChange("thang", value)}
                />
              ) : (
                <InputField
                  id="report-test-date"
                  label="Ngày thi"
                  value={report.ngaythi}
                  placeholder="dd/mm/yyyy"
                  onChange={(value) => onReportChange("ngaythi", value)}
                />
              )}
              {type === "giua" ? (
                <InputField
                  id="report-stage"
                  label="Tuần học / Giai đoạn"
                  value={report.giaidoan}
                  placeholder="VD: Tuần 6/12"
                  onChange={(value) => onReportChange("giaidoan", value)}
                />
              ) : null}
              <InputField
                id="report-target"
                label={
                  type === "dauvao"
                    ? "Mục tiêu của học viên (band)"
                    : "Mục tiêu đầu ra (band)"
                }
                value={report.target}
                placeholder="VD: 6.5"
                inputMode="decimal"
                onChange={(value) => onReportChange("target", value)}
              />
              {type === "cuoi" ? (
                <InputField
                  id="report-next"
                  label="Khóa học tiếp theo"
                  value={report.next}
                  placeholder="VD: IELTS 6.5+ · Khóa 1"
                  onChange={(value) => onReportChange("next", value)}
                />
              ) : null}
              <InputField
                id="report-date"
                label="Ngày lập báo cáo"
                value={report.ngaylap}
                placeholder="dd/mm/yyyy"
                onChange={(value) => onReportChange("ngaylap", value)}
              />
            </div>
          </section>

          <section className="step">
            <div className="step-h">
              <div className="step-t">
                <div>
                  <h3>Kết quả tổng quát</h3>
                  <small>
                    Bỏ chọn kỹ năng không thi; bỏ “Hiện điểm chi tiết” để chỉ
                    hiện band ở báo cáo
                  </small>
                </div>
              </div>
            </div>
            <div className="res-wrap">
              <table className="res">
                <thead>
                  <tr>
                    {ORDER.map((skill) => (
                      <th key={skill}>{SKILL[skill].name}</th>
                    ))}
                    <th className="ovc">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {ORDER.map((skill) => {
                      const score = bandForSkill(state, skill);
                      return (
                        <td
                          className={report.inc[skill] ? "" : "off"}
                          key={skill}
                        >
                          <b>{score == null ? "–" : formatBand(score)}</b>
                          <small>
                            {score == null ? "" : RANGES[bandRange(score)]}
                          </small>
                        </td>
                      );
                    })}
                    <td className="ovc">
                      <b>
                        {overall == null ? "–" : formatBand(overall)}
                      </b>
                      <small>
                        {overall == null ? "cần đủ 4 band" : "trung bình 4 kỹ năng"}
                      </small>
                    </td>
                  </tr>
                  <tr className="incs">
                    {ORDER.map((skill) => (
                      <td key={skill}>{includeBox(skill)}</td>
                    ))}
                    <td></td>
                  </tr>
                  <tr className="incs">
                    {ORDER.map((skill) => (
                      <td
                        className={report.inc[skill] ? "" : "off"}
                        key={skill}
                      >
                        <label className="chk">
                          <input
                            type="checkbox"
                            checked={showDetail(state, skill)}
                            aria-label={`Hiện điểm chi tiết ${SKILL[skill].name}`}
                            onChange={(event) =>
                              onReportChange(
                                `detail.${skill}`,
                                event.target.checked
                              )
                            }
                          />{" "}
                          Hiện điểm chi tiết
                        </label>
                        {!hasDetail(state, skill) ? (
                          <small className="nodet">chưa nhập chi tiết</small>
                        ) : null}
                      </td>
                    ))}
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            {recommendedLevel ? (
              <p className="res-note">
                Theo bảng xếp lớp, Overall {formatBand(overall)} tương ứng cấp
                độ <b>{recommendedLevel}</b>.
              </p>
            ) : null}
          </section>

          {type !== "dauvao" ? (
            <>
              <section className="step">
                <div className="step-h">
                  <div className="step-t">
                    <div>
                      <h3>Tình hình chuyên cần</h3>
                      <small>
                        {type === "thang"
                          ? "trong tháng"
                          : type === "giua"
                            ? "tính đến giữa khóa"
                            : "cả khóa học"}
                      </small>
                    </div>
                  </div>
                  {includeBox("att")}
                </div>
                <div className={`grid att${report.inc.att ? "" : " off"}`}>
                  {ATT.map(([key, label]) => (
                    <InputField
                      key={key}
                      id={`report-attendance-${key}`}
                      label={label}
                      value={report.att[key]}
                      placeholder="0"
                      inputMode="numeric"
                      onChange={(value) =>
                        onReportChange(`att.${key}`, value)
                      }
                    />
                  ))}
                </div>
              </section>
              <section className="step">
                <div className="step-h">
                  <div className="step-t">
                    <div>
                      <h3>Mức độ tham gia học tập</h3>
                      <small>1 = Chưa đạt · 3 = Đạt · 5 = Xuất sắc</small>
                    </div>
                  </div>
                  {includeBox("part")}
                </div>
                <div className={`parts${report.inc.part ? "" : " off"}`}>
                  {PART.map((criterion, index) => (
                    <div className="prow" key={criterion}>
                      <span>{criterion}</span>
                      <div
                        className="seg"
                        role="group"
                        aria-label={criterion}
                      >
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            type="button"
                            key={score}
                            aria-pressed={report.part[index] === score}
                            onClick={() =>
                              onParticipationChange(index, score)
                            }
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                      <input
                        className="pnote"
                        value={report.partNotes[index] || ""}
                        placeholder="Ghi chú (không bắt buộc)"
                        aria-label={`Ghi chú: ${criterion}`}
                        onChange={(event) =>
                          onReportChange(
                            `partNotes.${index}`,
                            event.target.value
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          <section className="step">
            <div className="step-h">
              <div className="step-t">
                <div>
                  <h3>Nhận xét chung và lời nhắn của giáo viên</h3>
                  <small>
                    Các mục dưới đây tự lấy nhận xét đã chọn; có thể sửa riêng
                    cho báo cáo
                  </small>
                </div>
              </div>
            </div>
            <div className="txs">
              {reportTextField("uudiem", "Điểm mạnh nổi bật", "Nhận xét điểm mạnh…")}
              {reportTextField("hanche", "Điểm cần cải thiện", "Nhận xét cần cải thiện…")}
              {reportTextField("kehoach", data.planTitle, "Kế hoạch luyện tập…")}
              {reportTextField(
                "loinhan",
                type === "dauvao"
                  ? "Nhận xét & tư vấn của giáo viên"
                  : "Lời nhắn đến học viên / phụ huynh",
                "Lời nhắn riêng của giáo viên…"
              )}
            </div>
          </section>
        </div>

        <aside className="sheet" aria-label="Xuất file">
          <div className="sheet-h">
            <h2>
              {REPORT_TITLE_LABELS[type]}
            </h2>
            <span>{state.student || "Học viên"}</span>
          </div>
          <div className="exp-body">
            <div className="ov-big">
              <span>Overall</span>
              <b>{overall == null ? "–" : formatBand(overall)}</b>
              <small>{overall == null ? "Chưa đủ 4 kỹ năng" : ""}</small>
            </div>
            <p className="exp-note">
              File Word (.docx) trên giấy tiêu đề Star Edu, khổ A4, chỉnh sửa
              được trong Word. Mở xem trước để in hoặc lưu PDF.
            </p>
            {missing.length ? (
              <div className="notice warn">
                <span>
                  Chưa có: {missing.join(", ")}. Vẫn tải được; các ô trống để
                  điền trong Word.
                </span>
              </div>
            ) : (
              <div className="notice info">
                <span>Đã đủ thông tin chính.</span>
              </div>
            )}
            <div className="exp-actions">
              <button className="btn big" type="button" onClick={onPreview}>
                Xem trước / lưu PDF
              </button>
              <button
                className="btn primary big"
                type="button"
                disabled={exporting}
                onClick={onExport}
              >
                {exporting ? "Đang tạo file…" : "Tải báo cáo .docx"}
              </button>
            </div>
            <p
              className={`exp-status${exportStatus.error ? " warn" : ""}`}
              role="status"
            >
              {exportStatus.message}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

const REPORT_TITLE_LABELS = {
  dauvao: "Báo cáo kết quả thi đầu vào",
  thang: "Báo cáo kết quả kiểm tra định kỳ",
  giua: "Báo cáo kết quả thi giữa khóa",
  cuoi: "Báo cáo kết quả thi cuối khóa",
};

function ConfirmDialog({ config, onCancel, onConfirm }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="ovl"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="dlg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ielts-report-confirm-title"
      >
        <div className="dlg-h">
          <h2 id="ielts-report-confirm-title">{config.title}</h2>
        </div>
        <div className="dlg-b">
          <p>{config.body}</p>
        </div>
        <div className="dlg-f">
          <button
            ref={cancelRef}
            className="btn"
            type="button"
            onClick={onCancel}
          >
            Hủy
          </button>
          <button
            className={`btn ${config.danger ? "danger" : "primary"}`}
            type="button"
            onClick={onConfirm}
          >
            {config.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function reportFilename(state) {
  const reportName = {
    dauvao: "Thi dau vao",
    thang: "Kiem tra dinh ky",
    giua: "Thi giua khoa",
    cuoi: "Thi cuoi khoa",
  }[state.rtype];
  const student = state.student
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `IELTS - ${reportName}${student ? ` - ${student}` : ""}.docx`;
}

export default function IeltsReport() {
  const [initialState] = useState(readInitialState);
  const [state, setState] = useState(initialState.state);
  const [storageError, setStorageError] = useState(initialState.error);
  const [notification, setNotification] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState({ message: "", error: false });
  const [tabScroll, setTabScroll] = useState({ left: false, right: false });
  const tabTrackRef = useRef(null);
  const notificationTimeoutRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageError((current) =>
        current.startsWith("Không thể lưu") ? "" : current
      );
    } catch {
      setStorageError(
        "Không thể lưu dữ liệu trên thiết bị này. Hãy sao chép nội dung để tránh mất dữ liệu."
      );
    }
  }, [state]);

  useEffect(
    () => () => window.clearTimeout(notificationTimeoutRef.current),
    []
  );

  const notify = useCallback((message) => {
    setNotification(message);
    window.clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = window.setTimeout(
      () => setNotification(""),
      2400
    );
  }, []);

  const updateTabScroll = useCallback(() => {
    const track = tabTrackRef.current;
    if (!track) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    setTabScroll({
      left: track.scrollLeft > 1,
      right: maxScroll > 1 && track.scrollLeft < maxScroll - 1,
    });
  }, []);

  useEffect(() => {
    updateTabScroll();
    window.addEventListener("resize", updateTabScroll);
    return () => window.removeEventListener("resize", updateTabScroll);
  }, [state.assessments, state.skills, state.tab, updateTabScroll]);

  const previewData = useMemo(() => reportData(state), [state]);
  const tabs = useMemo(() => {
    const scores = ORDER.map((skill) => {
      const score = bandForSkill(state, skill);
      return {
        key: skill,
        label: SKILL[skill].name,
        english: SKILL[skill].vn,
        badge: score == null ? "–" : formatBand(score),
        zero: score == null,
      };
    });
    const assessments = ASSESSMENT_ORDER.map((key) => {
      const current = state.assessments[key];
      const count = [1, 2, 3].reduce(
        (total, step) => total + current.sel[step].length,
        0
      );
      return {
        key,
        label: IELTS_ASSESSMENTS[key].label,
        english: IELTS_ASSESSMENTS[key].en,
        badge: String(count),
        zero: count === 0,
      };
    });
    const overall = overallBand(state);
    return [
      ...scores,
      ...assessments,
      {
        key: "gen",
        label: "Nhận xét chung",
        english: "",
        badge: String(state.gen.sel.length),
        zero: state.gen.sel.length === 0,
      },
      {
        key: "xuat",
        label: "Xuất báo cáo",
        english: "",
        badge: overall == null ? "Overall –" : `Overall ${formatBand(overall)}`,
        zero: overall == null,
        overall: true,
      },
    ];
  }, [state]);

  const changeSkill = useCallback((skill, patch) => {
    setState((current) => ({
      ...current,
      skills: {
        ...current.skills,
        [skill]: { ...current.skills[skill], ...patch },
      },
    }));
  }, []);

  const changeAssessment = useCallback((key, patch) => {
    setState((current) => ({
      ...current,
      assessments: {
        ...current.assessments,
        [key]: {
          ...current.assessments[key],
          ...patch,
        },
      },
    }));
  }, []);

  const changeCriterion = useCallback((skill, task, key, value) => {
    setState((current) => {
      const currentSkill = current.skills[skill];
      if (skill === "W" && key === "tb") {
        return {
          ...current,
          skills: {
            ...current.skills,
            W: {
              ...currentSkill,
              tb: { ...currentSkill.tb, [task]: value },
            },
          },
        };
      }
      if (skill === "W") {
        return {
          ...current,
          skills: {
            ...current.skills,
            W: {
              ...currentSkill,
              crit: {
                ...currentSkill.crit,
                [task]: { ...currentSkill.crit[task], [key]: value },
              },
            },
          },
        };
      }
      return {
        ...current,
        skills: {
          ...current.skills,
          Sp: {
            ...currentSkill,
            crit: { ...currentSkill.crit, [key]: value },
          },
        },
      };
    });
  }, []);

  const changeReport = useCallback((path, value) => {
    setState((current) => {
      const report = { ...current.rep };
      const [group, key] = path.split(".");
      if (group === "inc" || group === "detail" || group === "att") {
        report[group] = { ...report[group], [key]: value };
      } else if (group === "partNotes") {
        report.partNotes = report.partNotes.slice();
        report.partNotes[Number(key)] = value;
      } else if (group === "texts") {
        report.texts = { ...report.texts, [key]: value };
      } else {
        report[path] = value;
      }
      return { ...current, rep: report };
    });
  }, []);

  const changeLevel = useCallback((id) => {
    setState((current) => {
      const previous = levelById(current.level);
      const next = levelById(id);
      const report = { ...current.rep };
      if (next) {
        if (!report.target || (previous && report.target === previous.target)) {
          report.target = next.target;
        }
        if (!report.next || (previous && report.next === previous.next)) {
          report.next = next.next;
        }
      }
      return { ...current, level: id, rep: report };
    });
  }, []);

  const changeParticipation = useCallback((index, value) => {
    setState((current) => {
      const part = current.rep.part.slice();
      part[index] = part[index] === value ? 0 : value;
      return { ...current, rep: { ...current.rep, part } };
    });
  }, []);

  const togglePhrase = useCallback((skill, step, id) => {
    setState((current) =>
      updatePhraseSelection(current, skill, step, (selected) => {
        const index = selected.indexOf(id);
        if (index >= 0) selected.splice(index, 1);
        else selected.push(id);
        return true;
      })
    );
  }, []);

  const addPhrase = useCallback(
    (skill, step, text) => {
      setState((current) => {
        const source = skill === "gen" ? current.gen : current.skills[skill];
        const base = `c:${step}:${Date.now()}`;
        let id = base;
        let suffix = 1;
        while (Object.prototype.hasOwnProperty.call(source.custom, id)) {
          id = `${base}-${suffix}`;
          suffix += 1;
        }
        if (skill === "gen") {
          return {
            ...current,
            gen: {
              ...current.gen,
              custom: { ...current.gen.custom, [id]: text },
              sel: [...current.gen.sel, id],
            },
          };
        }
        return {
          ...current,
          skills: {
            ...current.skills,
            [skill]: {
              ...current.skills[skill],
              custom: { ...current.skills[skill].custom, [id]: text },
              sel: {
                ...current.skills[skill].sel,
                [String(step)]: [
                  ...current.skills[skill].sel[String(step)],
                  id,
                ],
              },
            },
          },
        };
      });
      notify("Đã thêm câu riêng");
    },
    [notify]
  );

  const changeGroup = useCallback((skill, step, group) => {
    changeSkill(skill, { [`g${step}`]: group });
  }, [changeSkill]);

  const changeRange = useCallback((skill, range) => {
    changeSkill(skill, { rng: range });
  }, [changeSkill]);

  const resetRange = useCallback((skill) => {
    changeSkill(skill, { rng: null });
  }, [changeSkill]);

  const changeComment = useCallback((skill, value) => {
    setState((current) => {
      if (skill === "gen") {
        return {
          ...current,
          gen: { ...current.gen, override: value },
        };
      }
      return {
        ...current,
        skills: {
          ...current.skills,
          [skill]: { ...current.skills[skill], override: value },
        },
      };
    });
  }, []);

  const movePhrase = useCallback((skill, step, id, direction) => {
    setState((current) =>
      updatePhraseSelection(current, skill, step, (selected) => {
        const from = selected.indexOf(id);
        const to = from + direction;
        if (from < 0 || to < 0 || to >= selected.length) return false;
        [selected[from], selected[to]] = [selected[to], selected[from]];
        return true;
      })
    );
  }, []);

  const reorderPhrase = useCallback(
    (skill, step, draggedId, targetId, after) => {
      setState((current) =>
        updatePhraseSelection(current, skill, step, (selected) => {
          const from = selected.indexOf(draggedId);
          const targetIndex = selected.indexOf(targetId);
          if (from < 0 || targetIndex < 0 || from === targetIndex) return false;
          selected.splice(from, 1);
          const target = selected.indexOf(targetId);
          selected.splice(target + Number(after), 0, draggedId);
          return true;
        })
      );
    },
    []
  );

  const clearPhrases = useCallback(
    (skill) => {
      setState((current) => {
        if (skill === "gen") {
          return {
            ...current,
            gen: { ...current.gen, sel: [], override: null },
          };
        }
        return {
          ...current,
          skills: {
            ...current.skills,
            [skill]: {
              ...current.skills[skill],
              sel: { 1: [], 2: [], 3: [] },
              override: null,
            },
          },
        };
      });
      notify("Đã xóa các câu đã chọn");
    },
    [notify]
  );

  const regenerateComment = useCallback((skill) => {
    setState((current) => {
      if (skill === "gen") {
        return { ...current, gen: { ...current.gen, override: null } };
      }
      return {
        ...current,
        skills: {
          ...current.skills,
          [skill]: { ...current.skills[skill], override: null },
        },
      };
    });
  }, []);

  const copyText = useCallback(
    async (text, textArea) => {
      try {
        await navigator.clipboard.writeText(text);
        notify("Đã sao chép");
      } catch {
        if (textArea) {
          textArea.focus();
          textArea.select();
        }
        notify("Đã chọn sẵn đoạn văn, nhấn Ctrl/⌘ + C để sao chép");
      }
    },
    [notify]
  );

  const exportReport = useCallback(async () => {
    setExporting(true);
    setExportStatus({ message: "Đang tạo file…", error: false });
    try {
      const { generateIeltsReport } = await import("./ieltsDocxReportGenerator");
      const blob = await generateIeltsReport(reportData(state));
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = reportFilename(state);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      setExportStatus({
        message:
          "Đã tải file. Mở bằng Word để kiểm tra và chỉnh sửa trước khi gửi học viên.",
        error: false,
      });
      notify("Đã tạo báo cáo");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Lỗi không xác định.";
      setExportStatus({
        message: `Không tạo được file: ${message}`,
        error: true,
      });
    } finally {
      setExporting(false);
    }
  }, [notify, state]);

  const resetReport = useCallback(() => {
    setState((current) => blankNewReport(current));
    setConfirmation(null);
    setExportStatus({ message: "", error: false });
    notify("Đã tạo báo cáo mới");
  }, [notify]);

  const wipeReport = useCallback(() => {
    setState(blankState());
    setConfirmation(null);
    setExportStatus({ message: "", error: false });
    notify("Đã xóa toàn bộ nội dung");
  }, [notify]);

  const handlePreview = useCallback(() => setPreviewOpen(true), []);
  const closePreview = useCallback(() => setPreviewOpen(false), []);
  const closeConfirmation = useCallback(() => setConfirmation(null), []);

  return (
    <div className="starEduReport ieltsReport">
      <header className="band">
        <div className="wrap">
          <div className="brand">
            <div className="org">
              HỆ THỐNG TRUNG TÂM ANH NGỮ QUỐC TẾ STAR EDU
            </div>
            <h1>Star Edu IELTS Progress Report System</h1>
            <p>Hệ thống Báo cáo kết quả luyện thi IELTS</p>
          </div>
          <img
            className="logo"
            src={logoUrl}
            alt="Star Edu – Bringing Success to you"
          />
          <div className="meta">
            <label htmlFor="student">
              Tên học viên
              <input
                id="student"
                value={state.student}
                placeholder="VD: Minh Anh"
                autoComplete="off"
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    student: event.target.value,
                  }))
                }
              />
            </label>
            <label htmlFor="pronoun">
              Xưng hô
              <select
                id="pronoun"
                value={state.pronoun}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    pronoun: event.target.value,
                  }))
                }
              >
                <option value="Em">Em</option>
                <option value="Bạn">Bạn</option>
                <option value="Con">Con (gửi phụ huynh)</option>
                <option value="__name">Tên học viên</option>
              </select>
            </label>
            <label htmlFor="level">
              Cấp độ
              <select
                id="level"
                value={state.level}
                onChange={(event) => changeLevel(event.target.value)}
              >
                <option value="">Chọn cấp độ</option>
                {LEVELS.map((level) => (
                  <option value={level.id} key={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="rtype">
              Loại báo cáo
              <select
                id="rtype"
                value={state.rtype}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    rtype: event.target.value,
                  }))
                }
              >
                <option value="dauvao">Thi đầu vào</option>
                <option value="thang">Kiểm tra định kỳ</option>
                <option value="giua">Thi giữa khóa</option>
                <option value="cuoi">Thi cuối khóa</option>
              </select>
            </label>
            <button className="btn-ghost" type="button" onClick={handlePreview}>
              Xem trước báo cáo
            </button>
            <button
              className="btn-ghost"
              type="button"
              onClick={() =>
                setConfirmation({
                  title: "Tạo báo cáo mới?",
                  body: "Thông tin lớp được giữ lại khi tạo báo cáo mới.",
                  confirmLabel: "Tạo báo cáo mới",
                  action: resetReport,
                })
              }
            >
              Tạo báo cáo mới
            </button>
            <button
              className="btn-ghost danger"
              type="button"
              onClick={() =>
                setConfirmation({
                  title: "Xóa toàn bộ nội dung?",
                  body: "Toàn bộ nội dung đã nhập sẽ bị xóa, kể cả thông tin lớp, cấp độ và giáo viên. Thao tác này không khôi phục được.",
                  confirmLabel: "Xóa hết",
                  danger: true,
                  action: wipeReport,
                })
              }
            >
              Xóa hết
            </button>
          </div>
        </div>
      </header>

      <nav
        className={`tabs${tabScroll.left ? " tabs--can-scroll-left" : ""}${
          tabScroll.right ? " tabs--can-scroll-right" : ""
        }`}
        aria-label="Kỹ năng IELTS"
      >
        <div
          className="wrap"
          id="tabs"
          role="tablist"
          ref={tabTrackRef}
          onScroll={updateTabScroll}
        >
          {tabs.map((tab) => (
            <button
              type="button"
              role="tab"
              key={tab.key}
              aria-selected={state.tab === tab.key}
              onClick={() =>
                setState((current) => ({ ...current, tab: tab.key }))
              }
            >
              {tab.label}
              {tab.english ? <span className="en">{tab.english}</span> : null}
              <span className={`dot${tab.zero ? " zero" : ""}${tab.overall ? " ov" : ""}`}>
                {tab.badge}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <main>
        <div className="wrap">
          {storageError ? (
            <p className="notice warn storage-notice" role="alert">
              {storageError}
            </p>
          ) : null}
          {state.tab === "xuat" ? (
            <ExportEditor
              state={state}
              onReportChange={changeReport}
              onLevelChange={changeLevel}
              onParticipationChange={changeParticipation}
              onPreview={handlePreview}
              onExport={exportReport}
              exporting={exporting}
              exportStatus={exportStatus}
            />
          ) : state.tab === "gen" ? (
            <GeneralEditor
              state={state}
              onToggle={togglePhrase}
              onAdd={addPhrase}
              onTextChange={changeComment}
              onMove={movePhrase}
              onReorder={reorderPhrase}
              onClear={clearPhrases}
              onRegenerate={regenerateComment}
              onCopy={copyText}
            />
          ) : ASSESSMENT_ORDER.includes(state.tab) ? (
            <ReportAssessmentEditor
              assessmentKey={state.tab}
              item={IELTS_ASSESSMENTS[state.tab]}
              assessment={state.assessments[state.tab]}
              student={state.student}
              formatText={(text) => applyPronoun(text, state)}
              onAssessmentChange={changeAssessment}
              onCopy={copyText}
            />
          ) : (
            <SkillEditor
              state={state}
              skill={state.tab}
              onSkillChange={changeSkill}
              onCriterionChange={changeCriterion}
              onToggle={togglePhrase}
              onAdd={addPhrase}
              onGroupChange={changeGroup}
              onRangeChange={changeRange}
              onRangeReset={resetRange}
              onTextChange={changeComment}
              onMove={movePhrase}
              onReorder={reorderPhrase}
              onClear={clearPhrases}
              onRegenerate={regenerateComment}
              onCopy={copyText}
            />
          )}
        </div>
      </main>

      <div className={`toast${notification ? " show" : ""}`} role="status">
        {notification}
      </div>
      {confirmation ? (
        <ConfirmDialog
          config={confirmation}
          onCancel={closeConfirmation}
          onConfirm={confirmation.action}
        />
      ) : null}
      {previewOpen ? (
        <ReportPreview
          data={previewData}
          onClose={closePreview}
          onDownload={exportReport}
          buildHTML={buildIeltsPreviewHTML}
          countPlaceholders={countIeltsPreviewPlaceholders}
        />
      ) : null}
    </div>
  );
}
