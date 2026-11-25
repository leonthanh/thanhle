import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminNavbar from "../../../shared/components/AdminNavbar";
import { apiPath, authFetch } from "../../../shared/utils/api";
import "./ProgressReportsPage.css";

const REPORT_TOOLS = [
  {
    id: "general",
    label: "Star Edu",
    title: "Star Edu Progress Report",
  },
  {
    id: "ielts",
    label: "IELTS",
    title: "Star Edu IELTS Progress Report",
  },
];

const ProgressReportsPage = () => {
  const [searchParams] = useSearchParams();
  const [reportHtml, setReportHtml] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reportError, setReportError] = useState("");
  const frameResizeObserverRef = useRef(null);
  const selectedReportId = searchParams.get("report");
  const activeReport =
    REPORT_TOOLS.find((report) => report.id === selectedReportId) || REPORT_TOOLS[0];

  const resizeReportFrame = useCallback((event) => {
    frameResizeObserverRef.current?.disconnect();

    const frame = event.currentTarget;
    const frameDocument = frame.contentDocument;
    if (!frameDocument?.documentElement || !frameDocument.body) {
      setReportError("Không thể hiển thị đầy đủ mẫu báo cáo.");
      return;
    }

    const updateHeight = () => {
      const { body, documentElement } = frameDocument;
      const height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        documentElement.scrollHeight,
        documentElement.offsetHeight
      );
      if (height > 0) frame.style.height = `${height}px`;
    };

    updateHeight();

    const ResizeObserverConstructor = frame.contentWindow?.ResizeObserver;
    if (ResizeObserverConstructor) {
      const observer = new ResizeObserverConstructor(updateHeight);
      observer.observe(frameDocument.documentElement);
      observer.observe(frameDocument.body);
      frameResizeObserverRef.current = observer;
    }
  }, []);

  useEffect(
    () => () => {
      frameResizeObserverRef.current?.disconnect();
    },
    []
  );

  useEffect(() => {
    frameResizeObserverRef.current?.disconnect();
    frameResizeObserverRef.current = null;
    let isCurrent = true;

    setReportHtml("");
    setReportError("");
    setIsLoading(true);

    const loadReport = async () => {
      try {
        const response = await authFetch(apiPath(`progress-reports/${activeReport.id}`));
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
          }
          if (response.status === 403) {
            throw new Error("Tài khoản của bạn không có quyền xem báo cáo.");
          }
          throw new Error(`Không thể tải mẫu báo cáo (HTTP ${response.status}).`);
        }

        const html = await response.text();
        if (!html.trim()) throw new Error("Mẫu báo cáo không có nội dung.");
        if (isCurrent) setReportHtml(html);
      } catch (error) {
        if (isCurrent) {
          setReportError(error instanceof Error ? error.message : "Không thể tải mẫu báo cáo.");
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    void loadReport();
    return () => {
      isCurrent = false;
      frameResizeObserverRef.current?.disconnect();
      frameResizeObserverRef.current = null;
    };
  }, [activeReport.id]);

  return (
    <>
      <AdminNavbar />
      <main className="progressReportsPage">
        <section
          id="progress-report-panel"
          className="progressReportsPage__panel"
          aria-label={`${activeReport.label} progress report`}
        >
          {isLoading && (
            <p className="progressReportsPage__status" role="status">
              Đang tải mẫu báo cáo...
            </p>
          )}
          {reportError && (
            <p className="progressReportsPage__status progressReportsPage__status--error" role="alert">
              {reportError}
            </p>
          )}
          {!isLoading && !reportError && (
            <iframe
              key={activeReport.id}
              className="progressReportsPage__frame"
              srcDoc={reportHtml}
              title={activeReport.title}
              onLoad={resizeReportFrame}
            />
          )}
        </section>
      </main>
    </>
  );
};

export default ProgressReportsPage;
