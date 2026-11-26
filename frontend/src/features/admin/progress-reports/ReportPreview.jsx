import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { paginatePreview, buildPreviewHTML } from "./previewUtils";
import letterheadUrl from "./assets/star-edu-letterhead.jpeg";

export default function ReportPreview({
  data,
  onClose,
  onDownload,
  buildHTML = buildPreviewHTML,
  countPlaceholders,
}) {
  const hostRef = useRef(null);
  const closeRef = useRef(null);
  const [pageCount, setPageCount] = useState(0);
  const html = useMemo(() => buildHTML(data), [buildHTML, data]);
  const placeholderCount = countPlaceholders
    ? countPlaceholders(data, html)
    : [
        ...(data.inc.skills ? data.skills.map((skill) => skill.comment) : []),
        ...Object.values(data.texts || {}),
      ]
        .join(" ")
        .match(/\[[^\]]*\]/g)?.length;

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    host.replaceChildren();
    const pages = paginatePreview(html, host, letterheadUrl);
    setPageCount(pages);

    const fit = () => {
      const width = host.clientWidth;
      host.style.setProperty("--pvz", String(Math.min(1, (width - 8) / 794)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [html]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="starEduReport starEduReport__preview-root">
      <div
        className="ovl"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <section
          className="dlg wide"
          role="dialog"
          aria-modal="true"
          aria-labelledby="progress-report-preview-title"
        >
          <div className="dlg-h">
            <h2 id="progress-report-preview-title">Xem trước báo cáo</h2>
            <button
              ref={closeRef}
              type="button"
              className="x"
              aria-label="Đóng"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <div className="dlg-b">
            <div className="pv-pages" ref={hostRef} />
          </div>
          <div className="dlg-f">
            <span className="dlg-note">
              <b>{pageCount} trang A4.</b> Bấm “In / lưu PDF” rồi chọn lưu dưới
              dạng PDF.
              {placeholderCount ? (
                <span className="warnt">
                  {" "}
                  Còn {placeholderCount} chỗ [...] chưa điền (tô vàng).
                </span>
              ) : null}
            </span>
            <button className="btn" type="button" onClick={() => window.print()}>
              In / lưu PDF
            </button>
            <button className="btn" type="button" onClick={onClose}>
              Đóng
            </button>
            <button
              className="btn primary"
              type="button"
              onClick={() => {
                onClose();
                onDownload();
              }}
            >
              Tải báo cáo .docx
            </button>
          </div>
        </section>
      </div>
    </div>,
    document.body
  );
}
