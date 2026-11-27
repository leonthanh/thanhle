import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ASSESSMENTS,
  ASSESSMENT_ORDER,
  ALL,
  PROG,
  SK,
} from "./starEduReportData";
import {
  AssessmentEditor,
  ExportEditor,
  GeneralEditor,
  SkillEditor,
  SummaryEditor,
} from "./ReportEditors";
import ReportPreview from "./ReportPreview";
import {
  applyPronoun,
  blankNewReport,
  blankState,
  getOrder,
  normalizeState,
  outputText,
  programName,
  REPORT_NAMES,
  reportData,
  STORAGE_KEY,
  tabItems,
  totalScore,
} from "./reportUtils";
import { assessmentComment } from "./reportAssessmentData";
import logoUrl from "./assets/star-edu-logo.png";
import "./StarEduReport.css";

function updatePhraseSelection(state, skill, step, update) {
  const selected = (
    skill === "gen" ? state.gen.sel : state.skills[skill].sel[String(step)]
  ).slice();
  if (!update(selected)) return state;
  if (skill === "gen") {
    return { ...state, gen: { ...state.gen, sel: selected } };
  }
  return {
    ...state,
    skills: {
      ...state.skills,
      [skill]: {
        ...state.skills[skill],
        sel: {
          ...state.skills[skill].sel,
          [String(step)]: selected,
        },
      },
    },
  };
}

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

  const speaking = state.skills.noi;
  const speakingSelectionCount =
    speaking.sel[1].length + speaking.sel[2].length + speaking.sel[3].length;
  if (!speakingSelectionCount && !state.student && !seen) {
    state.student = "Minh Anh";
    state.tab = "noi";
    speaking.sit = "prog";
    speaking.g1 = "prog";
    speaking.g2 = "weak";
    speaking.crit = "phatam";
    speaking.score = "7.5";
    speaking.sel[1] = ["phanxa|prog|0"];
    speaking.sel[2] = ["phatam|weak|0"];
    speaking.sel[3] = ["t|tips|1"];
  }
  return { state, error };
}

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
        aria-labelledby="report-confirm-title"
      >
        <div className="dlg-h">
          <h2 id="report-confirm-title">{config.title}</h2>
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

function fullReportText(state) {
  const header = `BÁO CÁO ${REPORT_NAMES[state.rtype].toUpperCase()}${
    state.student ? ` – ${state.student}` : ""
  }${programName(state) ? ` – ${programName(state)}` : ""}`;
  const body = getOrder(state)
    .map((key) => {
      const current = state.skills[key];
      const text = outputText(state, key).trim();
      return text
        ? `${SK[key].name} (${SK[key].en})${
            current.score ? ` – ${current.score}` : ""
          }\n${text}`
        : null;
    })
    .filter(Boolean);
  const total = totalScore(state);
  if (total) body.push(`Tổng điểm: ${total}/100`);
  body.push(
    ...ASSESSMENT_ORDER.map((key) => {
      const item = ASSESSMENTS[key];
      const assessment = state.assessments[key];
      const comment = String(
        assessmentComment(item, assessment, (text) =>
          applyPronoun(text, state)
        )
      ).trim();
      const lines = [
        `${item.title}${assessment.score ? ` – ${assessment.score}` : ""}`,
        comment,
      ].filter(Boolean);
      return assessment.score || comment ? lines.join("\n") : null;
    }).filter(Boolean)
  );
  const general = outputText(state, "gen").trim();
  if (general) body.push(`Nhận xét chung\n${general}`);
  return [header, ...body].join("\n\n");
}

function reportFilename(state) {
  const reportName = {
    thang: "Bao cao thang",
    giua: "Bao cao giua khoa",
    cuoi: "Bao cao cuoi khoa",
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
  return `${reportName}${student ? ` - ${student}` : ""}.docx`;
}

export default function StarEduReport() {
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
  }, [updateTabScroll, state.program, state.tab]);

  const tabs = useMemo(() => tabItems(state), [state]);
  const previewData = useMemo(() => reportData(state), [state]);

  const changeProgram = useCallback((program) => {
    setState((current) => {
      const next = { ...current, program };
      if (ALL.includes(next.tab) && !getOrder(next).includes(next.tab)) {
        next.tab = getOrder(next)[0];
      }
      return next;
    });
  }, []);

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

  const changeReport = useCallback((path, value) => {
    setState((current) => {
      const report = { ...current.rep };
      if (path.startsWith("inc.")) {
        const key = path.slice(4);
        report.inc = { ...report.inc, [key]: value };
      } else if (path.startsWith("att.")) {
        const key = path.slice(4);
        report.att = { ...report.att, [key]: value };
      } else if (path.startsWith("partNotes.")) {
        const index = Number(path.slice("partNotes.".length));
        report.partNotes = report.partNotes.slice();
        report.partNotes[index] = value;
      } else if (path.startsWith("texts.")) {
        const key = path.slice(6);
        report.texts = { ...report.texts, [key]: value };
      } else {
        report[path] = value;
      }
      return { ...current, rep: report };
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
    setState((current) => {
      if (skill === "gen") {
        const selected = current.gen.sel.slice();
        const index = selected.indexOf(id);
        if (index >= 0) selected.splice(index, 1);
        else selected.push(id);
        return { ...current, gen: { ...current.gen, sel: selected } };
      }
      const selected = current.skills[skill].sel[String(step)].slice();
      const index = selected.indexOf(id);
      if (index >= 0) selected.splice(index, 1);
      else selected.push(id);
      return {
        ...current,
        skills: {
          ...current.skills,
          [skill]: {
            ...current.skills[skill],
            sel: {
              ...current.skills[skill].sel,
              [String(step)]: selected,
            },
          },
        },
      };
    });
  }, []);

  const addPhrase = useCallback((skill, step, text) => {
    setState((current) => {
      const id = `c:${step}:${Date.now()}`;
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
      const selected = current.skills[skill].sel[String(step)].slice();
      selected.push(id);
      return {
        ...current,
        skills: {
          ...current.skills,
          [skill]: {
            ...current.skills[skill],
            custom: { ...current.skills[skill].custom, [id]: text },
            sel: {
              ...current.skills[skill].sel,
              [String(step)]: selected,
            },
          },
        },
      };
    });
    notify("Đã thêm câu riêng");
  }, [notify]);

  const changeGroup = useCallback((skill, step, group) => {
    changeSkill(skill, { [`g${step}`]: group });
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
    setState((current) => {
      return updatePhraseSelection(current, skill, step, (selected) => {
        const from = selected.indexOf(id);
        const to = from + direction;
        if (from < 0 || to < 0 || to >= selected.length) return false;
        [selected[from], selected[to]] = [selected[to], selected[from]];
        return true;
      });
    });
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
      const value = text === undefined ? fullReportText(state) : text;
      try {
        await navigator.clipboard.writeText(value);
        notify("Đã sao chép");
      } catch {
        if (textArea) {
          textArea.focus();
          textArea.select();
        }
        notify("Đã chọn sẵn đoạn văn, nhấn Ctrl/⌘ + C để sao chép");
      }
    },
    [notify, state]
  );

  const exportReport = useCallback(async () => {
    setExporting(true);
    setExportStatus({ message: "Đang tạo file…", error: false });
    try {
      const { generateProgressReport } = await import("./docxReportGenerator");
      const blob = await generateProgressReport(reportData(state));
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
          "Đã tải file. Mở bằng Word để kiểm tra và chỉnh sửa trước khi gửi phụ huynh.",
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
    setState((current) => {
      const next = blankNewReport(current);
      if (ALL.includes(next.tab) && !getOrder(next).includes(next.tab)) {
        next.tab = getOrder(next)[0];
      }
      return next;
    });
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

  const handleStudentChange = (value) => {
    setState((current) => ({ ...current, student: value }));
  };

  const handleTabClick = (tab) => {
    setState((current) => ({ ...current, tab }));
  };

  const handlePreview = useCallback(() => setPreviewOpen(true), []);
  const closePreview = useCallback(() => setPreviewOpen(false), []);
  const closeConfirmation = useCallback(() => setConfirmation(null), []);

  return (
    <div className="starEduReport">
      <header className="band">
        <div className="wrap">
          <div className="brand">
            <div className="org">
              HỆ THỐNG TRUNG TÂM ANH NGỮ QUỐC TẾ STAR EDU
            </div>
            <h1>Star Edu Progress Report System</h1>
            <p>Hệ thống Báo cáo tình hình học tập</p>
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
                onChange={(event) => handleStudentChange(event.target.value)}
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
                <option value="Con">Con (gửi phụ huynh)</option>
                <option value="Em">Em</option>
                <option value="Bạn">Bạn</option>
                <option value="__name">Tên học viên</option>
              </select>
            </label>
            <label htmlFor="program">
              Chương trình
              <select
                id="program"
                value={state.program}
                onChange={(event) => changeProgram(event.target.value)}
              >
                <option value="">Chọn chương trình</option>
                {Object.entries(PROG).map(([key, program]) => (
                  <option value={key} key={key}>
                    {program.name}
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
                <option value="thang">Hàng tháng</option>
                <option value="giua">Giữa khóa</option>
                <option value="cuoi">Cuối khóa</option>
              </select>
            </label>
            <button
              className="btn-ghost"
              type="button"
              onClick={handlePreview}
            >
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
                  body: "Toàn bộ nội dung đã nhập sẽ bị xóa, kể cả thông tin lớp, chương trình và giáo viên. Thao tác này không khôi phục được.",
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
        aria-label="Kỹ năng"
      >
        <div
          className="wrap"
          id="tabs"
          role="tablist"
          ref={tabTrackRef}
          onScroll={updateTabScroll}
        >
          {tabs.map(([key, label, english, count]) => (
            <button
              type="button"
              role="tab"
              key={key}
              data-tab={key}
              aria-selected={state.tab === key}
              onClick={() => handleTabClick(key)}
            >
              {label}
              {english ? <span className="en">{english}</span> : null}
              {count !== null ? (
                <span className={`dot${count ? "" : " zero"}`}>{count}</span>
              ) : null}
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
              onProgramChange={changeProgram}
              onParticipationChange={changeParticipation}
              onPreview={handlePreview}
              onExport={exportReport}
              exporting={exporting}
              exportStatus={exportStatus}
            />
          ) : state.tab === "sum" ? (
            <SummaryEditor state={state} onCopy={copyText} />
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
          ) : ASSESSMENTS[state.tab] ? (
            <AssessmentEditor
              state={state}
              assessmentKey={state.tab}
              onAssessmentChange={changeAssessment}
              onCopy={copyText}
            />
          ) : (
            <SkillEditor
              state={state}
              skill={state.tab}
              onSkillChange={changeSkill}
              onToggle={togglePhrase}
              onAdd={addPhrase}
              onGroupChange={changeGroup}
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
        />
      ) : null}
    </div>
  );
}

