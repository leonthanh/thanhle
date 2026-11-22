import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminNavbar from "../../../shared/components/AdminNavbar";
import { apiPath, authFetch } from "../../../shared/utils/api";
import { useTheme } from "../../../shared/contexts/ThemeContext";
import { useDisplaySettings } from "../../../shared/contexts/DisplaySettingsContext";

const formatCount = (value, available, loading) => {
  if (!available) return loading ? "..." : "-";
  return Number(value || 0).toLocaleString();
};

const AdminDisplaySettingsPage = () => {
  const { isDarkMode } = useTheme();
  const { displayLabels } = useDisplaySettings();

  const [usageOverview, setUsageOverview] = useState(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageError, setUsageError] = useState("");
  const [period, setPeriod] = useState("today");

  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);

  const fetchUsageOverview = useCallback(async () => {
    try {
      setUsageLoading(true);
      const response = await authFetch(apiPath("admin/usage-overview"));
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Could not load test activity.");
      }

      setUsageOverview(payload);
      setUsageError("");
    } catch (error) {
      setUsageError(error?.message || "Could not load test activity.");
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsageOverview();
  }, [fetchUsageOverview]);

  const selectedPeriod = period === "month" ? usageOverview?.month : usageOverview?.today;
  const live = usageOverview?.live || {};
  const sessionsByType = live.sessionsByType || {};
  const usersByType = selectedPeriod?.usersByType || {};
  const submissionsByType = selectedPeriod?.submissionsByType || {};
  const periodAvailable = Boolean(selectedPeriod);
  const liveAvailable = Boolean(usageOverview?.live);
  const liveWindowMinutes = Number(live.activityWindowMinutes || 15);
  const ixLabel = String(displayLabels?.ixDisplayName || "IX");
  const orangeLabel = String(displayLabels?.orangeDisplayName || "Orange");
  const generalLabel = String(displayLabels?.generalDisplayName || "General");

  const activityRows = [
    { key: "writing", label: `${ixLabel} Writing`, active: sessionsByType.writingDrafts },
    { key: "reading", label: `${ixLabel} Reading`, active: sessionsByType.reading },
    { key: "listening", label: `${ixLabel} Listening`, active: sessionsByType.listening },
    { key: "cambridge", label: orangeLabel, active: sessionsByType.cambridge },
    { key: "gateway", label: "Gateway", active: sessionsByType.gateway },
    { key: "prepare", label: "Prepare", active: sessionsByType.prepare },
    { key: "general", label: generalLabel, active: sessionsByType.general },
  ];

  const metrics = [
    {
      label: "Active learners now",
      value: live.activeUsersInTests,
      hint: `Test activity in the last ${liveWindowMinutes} minutes`,
      available: liveAvailable,
    },
    {
      label: "Attempts in progress",
      value: live.activeTestSessions,
      hint: "Current unfinished test attempts",
      available: liveAvailable,
    },
    {
      label: "Learners with activity",
      value: selectedPeriod?.usersInTests,
      hint: period === "today" ? "Unique learners today" : "Unique learners this month",
      available: periodAvailable,
    },
    {
      label: "Learners who submitted",
      value: selectedPeriod?.submitters,
      hint: "Unique learners with a submission",
      available: periodAvailable,
    },
    {
      label: "Submissions received",
      value: selectedPeriod?.submissions,
      hint: "Total submitted attempts",
      available: periodAvailable,
    },
  ];

  const generatedAt = usageOverview?.generatedAt
    ? new Date(usageOverview.generatedAt)
    : null;
  const lastUpdated = generatedAt && !Number.isNaN(generatedAt.getTime())
    ? generatedAt.toLocaleTimeString()
    : "";
  const periodDate = selectedPeriod?.date;

  return (
    <>
      <AdminNavbar />
      <div className="admin-page admin-submission-page" style={styles.page}>
        <header style={styles.pageHeader}>
          <p style={styles.pageEyebrow}>Admin dashboard</p>
          <h1 style={styles.pageTitle}>Test Activity</h1>
          <p style={styles.pageDescription}>
            See how many learners are working, how many tests are in progress, and what has been submitted.
          </p>
        </header>

          <section style={styles.overviewPanel}>
            <div style={styles.overviewHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Activity overview</h2>
                <p style={styles.sectionHint}>
                  Counts use Vietnam time. Current activity is based on the last {liveWindowMinutes} minutes.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchUsageOverview}
                disabled={usageLoading}
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                {usageLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div style={styles.periodToolbar}>
              <div style={styles.periodToggle} role="group" aria-label="Activity period">
                <button
                  type="button"
                  aria-pressed={period === "today"}
                  onClick={() => setPeriod("today")}
                  style={{
                    ...styles.periodButton,
                    ...(period === "today" ? styles.periodButtonActive : null),
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  aria-pressed={period === "month"}
                  onClick={() => setPeriod("month")}
                  style={{
                    ...styles.periodButton,
                    ...(period === "month" ? styles.periodButtonActive : null),
                  }}
                >
                  This month
                </button>
              </div>
              <span style={styles.periodDate}>
                {period === "today" ? "Today" : "Month to date"}
                {periodDate ? ` · ${periodDate}` : ""}
              </span>
            </div>

            {usageError ? (
              <div role="alert" style={styles.errorMessage}>
                <span>{usageError}</span>
                <button
                  type="button"
                  onClick={fetchUsageOverview}
                  disabled={usageLoading}
                  style={{ ...styles.button, ...styles.errorButton }}
                >
                  Try again
                </button>
              </div>
            ) : null}

            {usageOverview && !periodAvailable ? (
              <div role="alert" style={styles.errorMessage}>
                Monthly activity data is unavailable. Make sure the updated backend is deployed.
              </div>
            ) : null}

            <div style={styles.metricGrid}>
              {metrics.map((metric) => (
                <article
                  key={metric.label}
                  aria-label={metric.label}
                  style={styles.metricCard}
                >
                  <p style={styles.metricLabel}>{metric.label}</p>
                  <p style={styles.metricValue}>
                    {formatCount(metric.value, metric.available, usageLoading)}
                  </p>
                  <p style={styles.metricHint}>{metric.hint}</p>
                </article>
              ))}
            </div>

            <div style={styles.breakdownPanel}>
              <div style={styles.breakdownHeader}>
                <div>
                  <h3 style={styles.sectionTitle}>By test type</h3>
                  <p style={styles.sectionHint}>
                    Learners are unique; submissions count individual attempts.
                  </p>
                </div>
                {lastUpdated ? (
                  <span style={styles.updatedAt}>Updated {lastUpdated}</span>
                ) : null}
              </div>

              <div style={styles.tableScroller}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col" style={styles.tableHeading}>Test type</th>
                      <th scope="col" style={styles.tableHeading}>Learners with activity</th>
                      <th scope="col" style={styles.tableHeading}>Submitted attempts</th>
                      <th scope="col" style={styles.tableHeading}>In progress now</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityRows.map((row) => (
                      <tr key={row.key}>
                        <th scope="row" style={styles.tableRowHeading}>{row.label}</th>
                        <td style={styles.tableCell}>
                          {formatCount(usersByType[row.key], periodAvailable, usageLoading)}
                        </td>
                        <td style={styles.tableCell}>
                          {formatCount(submissionsByType[row.key], periodAvailable, usageLoading)}
                        </td>
                        <td style={styles.tableCell}>
                          {formatCount(row.active, liveAvailable, usageLoading)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p style={styles.definitionNote}>
              “Learners with activity” and “learners who submitted” count unique learners for the selected period.
              Submissions count attempts, so one learner may submit more than once.
            </p>
          </section>

      </div>
    </>
  );
};

const getStyles = (isDarkMode) => {
  const colors = {
    text: isDarkMode ? "#f8fafc" : "#0f172a",
    muted: isDarkMode ? "#94a3b8" : "#64748b",
    border: isDarkMode ? "#334155" : "#dbe4f0",
    surface: isDarkMode ? "rgba(15, 23, 42, 0.92)" : "#ffffff",
    subtle: isDarkMode ? "#0f172a" : "#f8fafc",
  };

  return {
    page: {
      display: "grid",
      gap: 14,
      maxWidth: "100%",
      padding: "0 12px 28px",
      background: isDarkMode ? "linear-gradient(180deg, #06101d 0%, #0b1628 100%)" : "#f8fafc",
      color: colors.text,
    },
    pageHeader: {
      display: "grid",
      gap: 4,
      padding: "4px 2px 0",
    },
    pageEyebrow: {
      margin: 0,
      color: colors.muted,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
    pageTitle: {
      margin: 0,
      color: colors.text,
      fontSize: "1.5rem",
      lineHeight: 1.2,
    },
    pageDescription: {
      maxWidth: 720,
      margin: 0,
      color: colors.muted,
      fontSize: 12,
      lineHeight: 1.5,
    },
    overviewPanel: {
      display: "grid",
      gap: 18,
      border: `1px solid ${colors.border}`,
      borderRadius: 18,
      padding: "clamp(14px, 2.5vw, 22px)",
      background: colors.surface,
      boxShadow: isDarkMode ? "0 12px 28px rgba(2, 6, 23, 0.28)" : "0 8px 24px rgba(15, 23, 42, 0.05)",
    },
    overviewHeader: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12,
    },
    sectionTitle: {
      margin: 0,
      color: colors.text,
      fontSize: "1.05rem",
      lineHeight: 1.3,
    },
    sectionHint: {
      margin: "5px 0 0",
      color: colors.muted,
      fontSize: 12,
      lineHeight: 1.5,
    },
    button: {
      borderRadius: 9,
      padding: "8px 12px",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
    },
    secondaryButton: {
      border: `1px solid ${colors.border}`,
      background: colors.subtle,
      color: colors.text,
    },
    periodToolbar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 10,
    },
    periodToggle: {
      display: "inline-flex",
      gap: 4,
      padding: 4,
      border: `1px solid ${colors.border}`,
      borderRadius: 11,
      background: colors.subtle,
    },
    periodButton: {
      border: "1px solid transparent",
      borderRadius: 8,
      padding: "7px 12px",
      background: "transparent",
      color: colors.muted,
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
    },
    periodButtonActive: {
      border: `1px solid ${isDarkMode ? "#1d4ed8" : "#bfdbfe"}`,
      background: isDarkMode ? "rgba(37, 99, 235, 0.22)" : "#ffffff",
      color: isDarkMode ? "#dbeafe" : "#1d4ed8",
      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
    },
    periodDate: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: 600,
    },
    errorMessage: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 10,
      border: `1px solid ${isDarkMode ? "rgba(239, 68, 68, 0.36)" : "#fecaca"}`,
      borderRadius: 10,
      padding: "10px 12px",
      background: isDarkMode ? "rgba(239, 68, 68, 0.12)" : "#fef2f2",
      color: isDarkMode ? "#fecaca" : "#991b1b",
      fontSize: 12,
    },
    errorButton: {
      border: `1px solid ${isDarkMode ? "#7f1d1d" : "#fecaca"}`,
      background: isDarkMode ? "#450a0a" : "#ffffff",
      color: isDarkMode ? "#fecaca" : "#991b1b",
    },
    metricGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 165px), 1fr))",
      gap: 10,
    },
    metricCard: {
      minWidth: 0,
      border: `1px solid ${colors.border}`,
      borderRadius: 12,
      padding: "13px 14px",
      background: colors.subtle,
    },
    metricLabel: {
      margin: 0,
      color: colors.muted,
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1.4,
    },
    metricValue: {
      margin: "7px 0 3px",
      color: colors.text,
      fontSize: "1.55rem",
      fontWeight: 800,
      lineHeight: 1.1,
      fontVariantNumeric: "tabular-nums",
    },
    metricHint: {
      margin: 0,
      color: colors.muted,
      fontSize: 10.5,
      lineHeight: 1.4,
    },
    breakdownPanel: {
      display: "grid",
      gap: 12,
    },
    breakdownHeader: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 8,
    },
    updatedAt: {
      color: colors.muted,
      fontSize: 10.5,
    },
    tableScroller: {
      width: "100%",
      overflowX: "auto",
      border: `1px solid ${colors.border}`,
      borderRadius: 12,
    },
    table: {
      width: "100%",
      minWidth: 560,
      borderCollapse: "collapse",
      textAlign: "left",
    },
    tableHeading: {
      padding: "10px 12px",
      borderBottom: `1px solid ${colors.border}`,
      background: colors.subtle,
      color: colors.muted,
      fontSize: 10.5,
      fontWeight: 700,
      whiteSpace: "nowrap",
    },
    tableRowHeading: {
      padding: "10px 12px",
      borderBottom: `1px solid ${colors.border}`,
      color: colors.text,
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: "nowrap",
    },
    tableCell: {
      padding: "10px 12px",
      borderBottom: `1px solid ${colors.border}`,
      color: colors.text,
      fontSize: 12,
      fontVariantNumeric: "tabular-nums",
    },
    definitionNote: {
      margin: 0,
      color: colors.muted,
      fontSize: 11,
      lineHeight: 1.5,
    },
  };
};

export default AdminDisplaySettingsPage;
