import React, { useEffect, useRef, useState } from "react";
import {
  ASSESSMENTS,
  ASSESSMENT_ORDER,
  DEF,
  GNAME,
  GEN,
  PROG,
  SK,
  SIT,
} from "./starEduReportData";
import {
  ATTENDANCE_FIELDS,
  PARTICIPATION_CRITERIA,
  PARTICIPATION_LEVELS,
  REPORT_NAMES,
  applyPronoun,
  composeGeneral,
  composeSkill,
  getOrder,
  getPhraseText,
  outputText,
  programName,
  reportData,
  scoreLabel,
} from "./reportUtils";
import ReportAssessmentEditor from "./ReportAssessmentEditor";
import { assessmentComment } from "./reportAssessmentData";

const PLACEHOLDER_PATTERN = /(\[[^\]]*\])/g;

function FormattedPhrase({ text }) {
  return String(text)
    .split(PLACEHOLDER_PATTERN)
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
        aria-label={`Thêm câu riêng bước ${step}`}
      />
      <button type="submit">Thêm</button>
    </form>
  );
}

function StepEditor({ state, skill, step, onToggle, onAdd, onGroupChange }) {
  const current = state.skills[skill];
  const data = SK[skill];
  const multipleCriteria = Object.keys(data.crit).length > 1;
  const groups =
    step === 1 ? ["good", "prog"] : step === 2 ? ["weak", "spec", "adv"] : null;
  const group = step === 1 ? current.g1 : step === 2 ? current.g2 : "tips";
  const selectedIds = current.sel[step];
  const options = [];

  if (step === 3) {
    data.tips.forEach((item, index) => {
      const criterion = Array.isArray(item) ? item[0] : "*";
      if (
        multipleCriteria &&
        criterion !== "*" &&
        criterion !== current.crit &&
        current.crit !== "__all"
      ) {
        return;
      }
      const id = `t|tips|${index}`;
      options.push({
        id,
        text: Array.isArray(item) ? item[1] : item,
        tag:
          multipleCriteria && criterion !== "*"
            ? data.crit[criterion]?.name || ""
            : "",
      });
    });
  } else if (group === "adv") {
    data.adv.forEach((text, index) => {
      options.push({ id: `a|adv|${index}`, text });
    });
  } else {
    (data.crit[current.crit]?.[group] || []).forEach((item, index) => {
      options.push({
        id: `${current.crit}|${group}|${index}`,
        text: Array.isArray(item) ? item[1] : item,
        label: Array.isArray(item) ? item[0] : "",
      });
    });
  }

  Object.keys(current.custom)
    .filter((id) => id.startsWith(`c:${step}:`))
    .forEach((id) => options.push({ id, text: current.custom[id], tag: "câu riêng" }));

  const title =
    step === 1
      ? "Ghi nhận điểm tích cực"
      : step === 2
        ? "Chỉ ra điểm cần cải thiện"
        : "Gợi ý cách luyện tập";
  const subtitle =
    step === 1
      ? "luôn mở đầu bằng một điểm tốt"
      : step === 2
        ? current.sit === "good"
          ? "không bắt buộc với học viên học tốt"
          : "chọn 1 điểm cụ thể"
        : "hành động cụ thể tại nhà";

  return (
    <section className="step">
      <div className="step-h">
        <div className="step-t">
          <span className="step-n">{step}</span>
          <div>
            <h3>{title}</h3>
            <small>{subtitle}</small>
          </div>
        </div>
        {groups ? (
          <div className="groups" role="group" aria-label="Nhóm câu">
            {groups.map((item) => (
              <button
                type="button"
                key={item}
                data-g={item}
                aria-pressed={group === item}
                onClick={() => onGroupChange(skill, step, item)}
              >
                {GNAME[item]}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {options.length ? (
        <ul className="list">
          {options.map((option) => {
            const position = selectedIds.indexOf(option.id);
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
        <p className="empty">
          Tiêu chí này chưa có câu ở nhóm «{GNAME[group] || ""}». Chọn nhóm khác
          hoặc tự thêm câu bên dưới.
        </p>
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
  const timeoutRef = useRef(null);
  const dirtyRef = useRef(false);
  const textAreaRef = useRef(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const selectedItems = isGeneral
    ? source.sel.map((id) => [0, id])
    : [1, 2, 3].flatMap((step) =>
        source.sel[step].map((id) => [step, id])
      );
  const placeholders = (text.match(/\[[^\]]*\]/g) || []).length;
  const isStale = source.override !== null && source.override !== fresh;

  useEffect(() => {
    setText(displayedText);
  }, [displayedText]);

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
    },
    []
  );

  const saveText = (value) => {
    if (!dirtyRef.current) return;
    window.clearTimeout(timeoutRef.current);
    onTextChange(skill, value);
    dirtyRef.current = false;
  };

  const changeText = (value) => {
    dirtyRef.current = true;
    setText(value);
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      onTextChange(skill, value);
      dirtyRef.current = false;
    }, 500);
  };

  const pickedGroup = (step) =>
    isGeneral ? source.sel : source.sel[step];

  return (
    <aside className="sheet" aria-label="Nhận xét">
      <div className="sheet-h">
        <h2>{title}</h2>
        <span>
          {state.student || "Học viên"}
          {!isGeneral && state.skills[skill].score
            ? ` · Điểm ${state.skills[skill].score}`
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
              {["", "① Tích cực", "② Cần cải thiện", "③ Luyện tập"][step]}
            </i>
          ))}
        </div>
      ) : null}
      <textarea
        ref={textAreaRef}
        value={text}
        onChange={(event) => changeText(event.target.value)}
        onBlur={() => saveText(text)}
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
            {isStale
              ? "Bạn đã sửa tay; lựa chọn mới chưa được đưa vào."
              : "Đang dùng bản bạn sửa tay."}
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
              kéo thả hoặc dùng nút ↑↓ để sắp xếp
              {isGeneral ? "" : " trong từng bước"}
            </small>
          </div>
          <ul className="picked">
            {selectedItems.map(([step, id]) => {
              const group = pickedGroup(step);
              const position = group.indexOf(id);
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
                      disabled={position === group.length - 1}
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
          <button
            className="btn"
            type="button"
            onClick={() => onClear(skill)}
          >
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

export function SkillEditor({
  state,
  skill,
  onSkillChange,
  onToggle,
  onAdd,
  onGroupChange,
  onTextChange,
  onMove,
  onReorder,
  onClear,
  onRegenerate,
  onCopy,
}) {
  const current = state.skills[skill];
  const data = SK[skill];
  const criteria = Object.keys(data.crit);

  return (
    <>
      <div className="setup">
        <div className="field">
          <span className="lbl">Tình huống của học viên ở kỹ năng {data.name}</span>
          <div className="seg sit" role="group">
            {Object.entries(SIT).map(([key, label]) => (
              <button
                type="button"
                key={key}
                data-s={key}
                aria-pressed={current.sit === key}
                onClick={() =>
                  onSkillChange(skill, {
                    sit: key,
                    g1: DEF[key].g1,
                    g2: DEF[key].g2,
                  })
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label className="lbl" htmlFor={`score-${skill}`}>
            {scoreLabel(state)}
          </label>
          <div className="score">
            <input
              id={`score-${skill}`}
              value={current.score}
              placeholder="VD: 20"
              autoComplete="off"
              onChange={(event) =>
                onSkillChange(skill, { score: event.target.value })
              }
            />
          </div>
        </div>
      </div>
      {!current.sit ? (
        <p className="hint">
          Chọn tình huống để ứng dụng mở sẵn nhóm câu phù hợp ở từng bước. Bạn
          vẫn có thể đổi nhóm bất cứ lúc nào.
        </p>
      ) : null}
      <div className="bench">
        <div>
          {criteria.length > 1 ? (
            <div className="setup criteria-setup">
              <div className="field">
                <span className="lbl">Tiêu chí</span>
                <div className="seg" role="group">
                  {criteria.map((criterion) => (
                    <button
                      type="button"
                      key={criterion}
                      aria-pressed={current.crit === criterion}
                      onClick={() =>
                        onSkillChange(skill, { crit: criterion })
                      }
                    >
                      {data.crit[criterion].name}
                    </button>
                  ))}
                </div>
              </div>
              <span className="hint criteria-setup__hint">
                Câu đã chọn được giữ lại khi chuyển tiêu chí, nên có thể nhận
                xét cả {criteria.map((key) => data.crit[key].name.toLowerCase()).join(", ")}{" "}
                trong cùng một đoạn.
              </span>
            </div>
          ) : null}
          {[1, 2, 3].map((step) => (
            <StepEditor
              key={step}
              state={state}
              skill={skill}
              step={step}
              onToggle={onToggle}
              onAdd={onAdd}
              onGroupChange={onGroupChange}
            />
          ))}
        </div>
        <CommentSheet
          state={state}
          skill={skill}
          title={`Nhận xét kỹ năng ${data.name}`}
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

function AssessmentFields({ state, keyName, onAssessmentChange, onCopy }) {
  return (
    <ReportAssessmentEditor
      assessmentKey={keyName}
      item={ASSESSMENTS[keyName]}
      assessment={state.assessments[keyName]}
      student={state.student}
      formatText={(text) => applyPronoun(text, state)}
      onAssessmentChange={onAssessmentChange}
      onCopy={onCopy}
    />
  );
}

function GeneralSection({ state, category, title, subtitle, items, onToggle, onAdd }) {
  const selected = state.gen.sel;
  const options = items.map((item) => {
    const id = `${category}|${item.index}`;
    const phrase = getPhraseText(state, "gen", id);
    return (
      <PhraseOption
        key={id}
        state={state}
        skill="gen"
        step={category}
        id={id}
        text={phrase}
        label={item.label}
        tag={item.tag}
        selected={selected.includes(id)}
        position={selected.indexOf(id)}
        onToggle={onToggle}
      />
    );
  });
  const customs = Object.keys(state.gen.custom)
    .filter((id) => id.startsWith(`c:${category}:`))
    .map((id) => (
      <PhraseOption
        key={id}
        state={state}
        skill="gen"
        step={category}
        id={id}
        text={state.gen.custom[id]}
        tag="câu riêng"
        selected={selected.includes(id)}
        position={selected.indexOf(id)}
        onToggle={onToggle}
      />
    ));

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
        {options}
        {customs}
      </ul>
      <AddPhrase skill="gen" step={category} onAdd={onAdd} />
    </section>
  );
}

export function GeneralEditor({
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
      tag: type === "*" ? "" : type === "giua" ? "giữa khóa" : "cuối khóa",
      type,
    }))
    .filter((item) => item.type === "*" || item.type === state.rtype);

  return (
    <>
      <p className="hint">
        Dùng cho các mục Ưu điểm, Hạn chế và Lời nhắn đến phụ huynh. Câu kết
        đang lọc theo loại báo cáo: <b>{REPORT_NAMES[state.rtype]}</b>.
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
            subtitle="chuyên cần, tham gia, bài tập"
            items={GEN.att.map((item, index) => ({
              index,
              label: item[0],
              text: item[1],
            }))}
            onToggle={onToggle}
            onAdd={onAdd}
          />
          <GeneralSection
            state={state}
            category="end"
            title="Câu kết và lời nhắn phụ huynh"
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

export function SummaryEditor({ state, onCopy }) {
  const rows = getOrder(state).map((key) => {
    const current = state.skills[key];
    const text = outputText(state, key).trim();
    return (
      <div className="sum-card" key={key}>
        <h3>
          {SK[key].name}{" "}
          <span className="en sum-card__english">{SK[key].en}</span>
          {current.score ? (
            <span className="grade">{current.score}</span>
          ) : null}
          {current.sit ? <span className="grade">{SIT[current.sit]}</span> : null}
          <span className="sum-card__spacer" />
          {text ? (
            <button
              className="btn"
              type="button"
              onClick={() => onCopy(text)}
            >
              Sao chép
            </button>
          ) : null}
        </h3>
        {text ? (
          <p>{text}</p>
        ) : (
          <p className="none">
            Chưa có nhận xét. Mở tab {SK[key].name} để chọn câu.
          </p>
        )}
      </div>
    );
  });
  const assessmentRows = ASSESSMENT_ORDER.map((key) => {
    const item = ASSESSMENTS[key];
    const assessment = state.assessments[key];
    const comment = String(
      assessmentComment(item, assessment, (text) => applyPronoun(text, state))
    ).trim();
    return (
      <div className="sum-card" key={key}>
        <h3>
          {item.title}
          {assessment.score ? (
            <span className="grade">{assessment.score}</span>
          ) : null}
        </h3>
        {comment ? (
          <p className="assessment-comment">{comment}</p>
        ) : (
          <p className="none">
            Chưa có nội dung. Mở tab {item.label} để nhập điểm và nhận xét.
          </p>
        )}
      </div>
    );
  });
  const generalText = outputText(state, "gen").trim();

  return (
    <div className="summary">
      <div className="sum-top">
        <h2>
          Báo cáo {REPORT_NAMES[state.rtype].toLowerCase()} ·{" "}
          {state.student || "Học viên"}
        </h2>
        <button className="btn primary" type="button" onClick={() => onCopy()}>
          Sao chép tất cả
        </button>
      </div>
      <p className="hint summary__hint">
        Dán nhận xét vào báo cáo; điểm từ vựng và bài tập về nhà được ghi riêng,
        không cộng vào tổng điểm kỹ năng.
      </p>
      {rows}
      {assessmentRows}
      <div className="sum-card">
        <h3>
          Nhận xét chung<span className="sum-card__spacer" />
          {generalText ? (
            <button
              className="btn"
              type="button"
              onClick={() => onCopy(generalText)}
            >
              Sao chép
            </button>
          ) : null}
        </h3>
        {generalText ? (
          <p>{generalText}</p>
        ) : (
          <p className="none">
            Chưa có. Mở tab Nhận xét chung để chọn câu mở đầu, thái độ và câu
            kết.
          </p>
        )}
      </div>
    </div>
  );
}

function TextInput({ id, label, value, placeholder, onChange, inputMode }) {
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

export function ExportEditor({
  state,
  onReportChange,
  onProgramChange,
  onParticipationChange,
  onPreview,
  onExport,
  exporting,
  exportStatus,
}) {
  const report = state.rep;
  const type = state.rtype;
  const showSkills = report.inc.skills;
  const data = reportData(state);
  const automatic = data.texts;
  const fields = [
    <TextInput
      key="lop"
      id="rep-lop"
      label="Lớp học"
      value={report.lop}
      placeholder="VD: EW3-A"
      onChange={(value) => onReportChange("lop", value)}
    />,
    <label className="ff" htmlFor="rep-prog" key="prog">
      <span className="lbl">Chương trình</span>
      <select
        id="rep-prog"
        value={state.program}
        onChange={(event) => onProgramChange(event.target.value)}
      >
        <option value="">Chọn chương trình</option>
        {Object.entries(PROG).map(([key, item]) => (
          <option value={key} key={key}>
            {item.name}
          </option>
        ))}
      </select>
    </label>,
  ];
  if (type === "thang") {
    fields.push(
      <TextInput
        key="thang"
        id="rep-thang"
        label="Tháng / Năm"
        value={report.thang}
        placeholder="VD: 10/2026"
        onChange={(value) => onReportChange("thang", value)}
      />
    );
  }
  fields.push(
    <TextInput
      key="gv"
      id="rep-gv"
      label="Giáo viên phụ trách"
      value={report.gv}
      placeholder="Tên giáo viên"
      onChange={(value) => onReportChange("gv", value)}
    />
  );
  if (type !== "thang") {
    fields.push(
      <TextInput
        key="ngaykt"
        id="rep-ngaykt"
        label={type === "giua" ? "Ngày kiểm tra" : "Ngày kiểm tra cuối khóa"}
        value={report.ngaykt}
        placeholder="dd/mm/yyyy"
        onChange={(value) => onReportChange("ngaykt", value)}
      />
    );
  }
  if (type === "giua") {
    fields.push(
      <TextInput
        key="giaidoan"
        id="rep-giaidoan"
        label="Tuần học / Giai đoạn"
        value={report.giaidoan}
        placeholder="VD: Tuần 8/16"
        onChange={(value) => onReportChange("giaidoan", value)}
      />
    );
  }
  if (type === "cuoi") {
    fields.push(
      <TextInput
        key="capdo"
        id="rep-capdo"
        label="Khóa học tiếp theo"
        value={report.capdo}
        placeholder="VD: Everybody Up 3"
        onChange={(value) => onReportChange("capdo", value)}
      />
    );
  }
  fields.push(
    <TextInput
      key="ngaylap"
      id="rep-ngaylap"
      label="Ngày lập báo cáo"
      value={report.ngaylap}
      placeholder="dd/mm/yyyy"
      onChange={(value) => onReportChange("ngaylap", value)}
    />
  );

  const missing = [];
  if (!state.student.trim()) missing.push("tên học viên");
  if (!state.program) missing.push("chương trình");
  if (showSkills && !getOrder(state).some((key) => state.skills[key].score)) {
    missing.push("điểm các kỹ năng");
  }
  if (report.inc.att && !report.att.tong) missing.push("số buổi học");
  if (report.inc.part && !report.part.some(Boolean)) {
    missing.push("mức độ tham gia");
  }
  const placeholders = [
    ...(report.inc.skills ? data.skills.map((skill) => skill.comment) : []),
    ...Object.values(data.texts),
  ]
    .join(" ")
    .match(/\[[^\]]*\]/g);
  if (placeholders) {
    missing.push(`${placeholders.length} chỗ [...] chưa thay bằng thông tin cụ thể`);
  }

  const skillRows = getOrder(state).map((key) => {
    const current = state.skills[key];
    const text = outputText(state, key).trim();
    return (
      <li key={key}>
        <b>{SK[key].name}</b>
        <span>{current.score || "chưa có điểm"}</span>
        <span>
          {text ? `${text.split(/\s+/).length} từ nhận xét` : "chưa có nhận xét"}
        </span>
      </li>
    );
  });

  const includeToggle = (key) => (
    <label className="chk" key={key}>
      <input
        type="checkbox"
        checked={report.inc[key]}
        onChange={(event) =>
          onReportChange(`inc.${key}`, event.target.checked)
        }
      />{" "}
      Đưa vào báo cáo
    </label>
  );
  const textEditor = (key, label, hint) => {
    const edited = report.texts[key] !== null;
    return (
      <div className="tx" key={key}>
        <div className="tx-h">
          <span className="lbl">{label}</span>
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
          id={`rep-t-${key}`}
          rows="4"
          value={report.texts[key] ?? automatic[key]}
          placeholder={hint}
          onChange={(event) =>
            onReportChange(`texts.${key}`, event.target.value)
          }
        />
      </div>
    );
  };

  return (
    <>
      <p className="hint">
        Điền phần còn lại của báo cáo rồi tải file Word theo giấy tiêu đề Star
        Edu. Ưu điểm, hạn chế, kế hoạch và lời nhắn tự cập nhật theo đoạn nhận
        xét ở các tab kỹ năng và Nhận xét chung; điểm Từ vựng và Bài tập về nhà
        được đưa vào báo cáo khi có nội dung. File tải về vẫn chỉnh sửa được
        trong Word.
      </p>
      <div className="bench">
        <div className="exp">
          <section className="step">
            <div className="step-h">
              <div className="step-t">
                <div>
                  <h3>Thông tin chung · {REPORT_NAMES[type]}</h3>
                  <small>Thông tin lớp được giữ lại khi tạo báo cáo mới</small>
                </div>
              </div>
            </div>
            <div className="grid">{fields}</div>
          </section>
          <section className="step">
            <div className="step-h">
              <div className="step-t">
                <div>
                  <h3>Kết quả các kỹ năng</h3>
                  <small>
                    {state.program
                      ? `${programName(state)}: ${getOrder(state)
                          .map((key) => SK[key].name)
                          .join(", ")}`
                      : "Chọn chương trình để lọc kỹ năng"}{" "}
                    · lấy từ các tab kỹ năng
                  </small>
                </div>
              </div>
              {includeToggle("skills")}
            </div>
            <ul className={`sk-sum ${showSkills ? "" : "off"}`}>
              {skillRows}
              <li className="avg">
                <b>Tổng điểm</b>
                <span>{data.total ? `${data.total}/100` : "—"}</span>
                <span className={Number(data.total) > 100 ? "over" : ""}>
                  {Number(data.total) > 100
                    ? "Tổng vượt quá 100, kiểm tra lại điểm"
                    : "thang 100"}
                </span>
              </li>
            </ul>
          </section>
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
              {includeToggle("att")}
            </div>
            <div className={`grid att ${report.inc.att ? "" : "off"}`}>
              {ATTENDANCE_FIELDS.map(([key, label]) => (
                <TextInput
                  key={key}
                  id={`rep-att-${key}`}
                  label={label}
                  value={report.att[key]}
                  placeholder="0"
                  inputMode="numeric"
                  onChange={(value) => onReportChange(`att.${key}`, value)}
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
              {includeToggle("part")}
            </div>
            <div className={`parts ${report.inc.part ? "" : "off"}`}>
              {PARTICIPATION_CRITERIA.map((criterion, index) => (
                <div className="prow" key={criterion}>
                  <span>{criterion}</span>
                  <div className="seg" role="group" aria-label={criterion}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        type="button"
                        key={value}
                        title={PARTICIPATION_LEVELS[value]}
                        aria-pressed={report.part[index] === value}
                        onClick={() =>
                          onParticipationChange(index, value)
                        }
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  <input
                    className="pnote"
                    id={`rep-pn-${index}`}
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
          <section className="step">
            <div className="step-h">
              <div className="step-t">
                <div>
                  <h3>Nội dung nhận xét</h3>
                  <small>Mỗi dòng là một đoạn trong báo cáo</small>
                </div>
              </div>
            </div>
            <div className="txs">
              {textEditor(
                "uudiem",
                type === "thang" ? "Ưu điểm trong tháng" : "Ưu điểm nổi bật",
                "Chọn câu ở bước ① các kỹ năng, hoặc viết trực tiếp…"
              )}
              {textEditor(
                "hanche",
                type === "thang"
                  ? "Hạn chế cần khắc phục"
                  : "Hạn chế cần cải thiện",
                "Chọn câu ở bước ② các kỹ năng, hoặc viết trực tiếp…"
              )}
              {type !== "thang"
                ? textEditor(
                    "kehoach",
                    type === "giua"
                      ? "Lời nhắn · Kế hoạch học tập (nửa khóa còn lại)"
                      : "Lời nhắn · Kế hoạch & định hướng khóa tiếp theo",
                    "Chọn câu ở bước ③ các kỹ năng, hoặc viết trực tiếp…"
                  )
                : null}
              {textEditor(
                "loinhan",
                type === "thang"
                  ? "Lời nhắn đến học viên và phụ huynh"
                  : "Lời nhắn · Lời nhắn & nhắc nhở",
                "Chọn câu kết ở tab Nhận xét chung, hoặc viết trực tiếp…"
              )}
            </div>
          </section>
        </div>
        <aside className="sheet" aria-label="Xuất file">
          <div className="sheet-h">
            <h2>
              {
                {
                  thang: "Báo cáo tình hình học tập",
                  giua: "Báo cáo giữa khóa",
                  cuoi: "Báo cáo cuối khóa",
                }[type]
              }
            </h2>
            <span>{state.student || "Học viên"}</span>
          </div>
          <div className="exp-body">
            <div className="paper" aria-hidden="true">
              <div className="paper-top" />
              <div className="paper-l w60" />
              <div className="paper-l w40" />
              <div className="paper-t" />
              <div className="paper-t s" />
              <div className="paper-t" />
              <div className="paper-red" />
            </div>
            <p className="exp-note">
              File Word (.docx) trên giấy tiêu đề Star Edu, khổ A4. Mở xem
              trước để in hoặc lưu PDF.
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
              <button
                className="btn big"
                type="button"
                onClick={onPreview}
                disabled={exporting}
              >
                Xem trước / lưu PDF
              </button>
              <button
                className="btn primary big"
                type="button"
                onClick={onExport}
                disabled={exporting}
              >
                {exporting ? "Đang tạo file…" : "Tải báo cáo .docx"}
              </button>
            </div>
            <p
              className={`exp-status ${exportStatus.error ? "warn" : ""}`}
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

export function AssessmentEditor({
  state,
  assessmentKey,
  onAssessmentChange,
  onCopy,
}) {
  return (
    <AssessmentFields
      state={state}
      keyName={assessmentKey}
      onAssessmentChange={onAssessmentChange}
      onCopy={onCopy}
    />
  );
}

