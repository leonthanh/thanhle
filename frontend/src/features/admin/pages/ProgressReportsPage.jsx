import React, { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import AdminNavbar from "../../../shared/components/AdminNavbar";
import StarEduReport from "../progress-reports/StarEduReport";
import "./ProgressReportsPage.css";

const IeltsReport = lazy(() => import("../progress-reports/IeltsReport"));

const REPORT_TOOLS = [
  {
    id: "general",
    label: "Star Edu",
  },
  {
    id: "ielts",
    label: "IELTS",
  },
];

const ProgressReportsPage = () => {
  const [searchParams] = useSearchParams();
  const selectedReportId = searchParams.get("report");
  const activeReport =
    REPORT_TOOLS.find((report) => report.id === selectedReportId) || REPORT_TOOLS[0];

  return (
    <>
      <AdminNavbar />
      <main className="progressReportsPage">
        <section
          id="progress-report-panel"
          className="progressReportsPage__panel"
          aria-label={`${activeReport.label} progress report`}
        >
          {activeReport.id === "general" ? (
            <StarEduReport />
          ) : (
            <Suspense
              fallback={
                <p className="progressReportsPage__status" role="status">
                  Đang tải mẫu báo cáo...
                </p>
              }
            >
              <IeltsReport />
            </Suspense>
          )}
        </section>
      </main>
    </>
  );
};

export default ProgressReportsPage;
