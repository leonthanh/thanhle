import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminNavbar from "../../../shared/components/AdminNavbar";
import { apiPath, authFetch } from "../../../shared/utils/api";
import { useTheme } from "../../../shared/contexts/ThemeContext";
import { useDisplaySettings } from "../../../shared/contexts/DisplaySettingsContext";
import { ORANGE_LEVELS } from "../../../domains/cambridge/config/levels";

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
  const cambridgeSessionsByLevel = live.cambridgeSessionsByLevel || {};
  const usersByType = selectedPeriod?.usersByType || {};
  const submissionsByType = selectedPeriod?.submissionsByType || {};
  const cambridgeUsersByLevel = selectedPeriod?.cambridgeUsersByLevel || {};
  const cambridgeSubmissionsByLevel = selectedPeriod?.cambridgeSubmissionsByLevel || {};
  const periodAvailable = Boolean(selectedPeriod);
  const liveAvailable = Boolean(usageOverview?.live);
  const cambridgeUsersByLevelAvailable = Boolean(selectedPeriod?.cambridgeUsersByLevel);
  const cambridgeSubmissionsByLevelAvailable = Boolean(selectedPeriod?.cambridgeSubmissionsByLevel);
  const cambridgeSessionsByLevelAvailable = Boolean(live.cambridgeSessionsByLevel);
  const liveWindowMinutes = Number(live.activityWindowMinutes || 15);
  const ixLabel = String(displayLabels?.ixDisplayName || "IX");
  const orangeLabel = String(displayLabels?.orangeDisplayName || "Orange");
  const generalLabel = String(displayLabels?.generalDisplayName || "General");

  const cambridgeLevelRows = ORANGE_LEVELS.map(({ id, shortLabel }) => ({
    key: `cambridge-${id}`,
    label: shortLabel,
    active: cambridgeSessionsByLevel[id],
    group: "programs",
    tone: "orange",
    levelKey: id,
    isSublevel: true,
  }));

  const activityRows = [
    { key: "writing", label: `${ixLabel} Writing`, active: sessionsByType.writingDrafts, group: "core", tone: "blue" },
    { key: "reading", label: `${ixLabel} Reading`, active: sessionsByType.reading, group: "core", tone: "teal" },
    { key: "listening", label: `${ixLabel} Listening`, active: sessionsByType.listening, group: "core", tone: "violet" },
    { key: "cambridge", label: orangeLabel, active: sessionsByType.cambridge, group: "programs", tone: "orange", isSummary: true },
    ...cambridgeLevelRows,
    { key: "gateway", label: "Gateway", active: sessionsByType.gateway, group: "programs", tone: "sky" },
    { key: "prepare", label: "Prepare", active: sessionsByType.prepare, group: "programs", tone: "emerald" },
    { key: "general", label: generalLabel, active: sessionsByType.general, group: "programs", tone: "rose" },
  ];

  const activityGroups = [
    {
      key: "core",
      label: `${ixLabel} core skills`,
      description: `${ixLabel} Writing, Reading, and Listening`,
      tone: "blue",
      rows: activityRows.filter((row) => row.group === "core"),
    },
    {
      key: "programs",
      label: "Programs & learning tracks",
      description: `${orangeLabel}, Gateway, Prepare, and ${generalLabel}`,
      tone: "violet",
      rows: activityRows.filter((row) => row.group === "programs"),
    },
  ];

  const liveMetrics = [
    {
      label: "Active learners now",
      value: live.activeUsersInTests,
      hint: `Test activity in the last ${liveWindowMinutes} minutes`,
      available: liveAvailable,
      tone: "blue",
      tag: "LIVE",
    },
    {
      label: "Attempts in progress",
      value: live.activeTestSessions,
      hint: "Current unfinished test attempts",
      available: liveAvailable,
      tone: "teal",
      tag: "LIVE",
    },
  ];

  const periodMetrics = [
    {
      label: "Learners with activity",
      value: selectedPeriod?.usersInTests,
      hint: period === "today" ? "Unique learners today" : "Unique learners this month",
      available: periodAvailable,
      tone: "blue",
      tag: period === "today" ? "TODAY" : "MONTH",
    },
    {
      label: "Learners who submitted",
      value: selectedPeriod?.submitters,
      hint: "Unique learners with a submission",
      available: periodAvailable,
      tone: "emerald",
      tag: period === "today" ? "TODAY" : "MONTH",
    },
    {
      label: "Submissions received",
      value: selectedPeriod?.submissions,
      hint: "Total submitted attempts",
      available: periodAvailable,
      tone: "orange",
      tag: period === "today" ? "TODAY" : "MONTH",
    },
  ];

  const metricGroups = [
    {
      key: "live",
      title: "Live activity",
      description: "Current test activity",
      badge: `LAST ${liveWindowMinutes} MIN`,
      tone: "blue",
      metrics: liveMetrics,
    },
    {
      key: "period",
      title: "Period summary",
      description: "Learners and submissions for the selected period",
      badge: period === "today" ? "TODAY" : "THIS MONTH",
      tone: "violet",
      metrics: periodMetrics,
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
          <div style={styles.heroCopy}>
            <div style={styles.eyebrowRow}>
              <span aria-hidden="true" style={styles.eyebrowMark} />
              <p style={styles.pageEyebrow}>ADMIN ANALYTICS</p>
            </div>
            <h1 style={styles.pageTitle}>Test activity</h1>
            <p style={styles.pageDescription}>
              Monitor active learners, test attempts, and submissions across your learning programs.
            </p>
          </div>
          <div style={styles.headerActions}>
            <span style={styles.windowBadge}>
              <span aria-hidden="true" style={styles.windowBadgeDot} />
              Activity window · {liveWindowMinutes} min
            </span>
            <button
              type="button"
              onClick={fetchUsageOverview}
              disabled={usageLoading}
              style={{ ...styles.button, ...styles.refreshButton, ...(usageLoading ? styles.disabledButton : null) }}
            >
              {usageLoading ? "Refreshing…" : "Refresh data"}
            </button>
          </div>
        </header>

        <section style={styles.overviewPanel}>
          <div style={styles.overviewHeader}>
            <div>
              <p style={styles.sectionEyebrow}>ACTIVITY OVERVIEW</p>
              <h2 style={styles.sectionTitle}>At a glance</h2>
              <p style={styles.sectionHint}>
                Period totals use Vietnam time. Live counts use the recent activity window.
              </p>
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
                <span>{period === "today" ? "Today" : "Month to date"}</span>
                {periodDate ? <strong>{periodDate}</strong> : null}
              </span>
            </div>
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

          <div style={styles.metricGroups}>
            {metricGroups.map((group) => {
              const groupTone = styles.tones[group.tone];

              return (
                <section key={group.key} style={styles.metricGroup} aria-labelledby={`${group.key}-metrics-heading`}>
                  <div style={styles.metricGroupHeader}>
                    <div>
                      <div style={styles.metricGroupTitleRow}>
                        <span
                          aria-hidden="true"
                          style={{ ...styles.metricGroupMarker, background: groupTone.accent }}
                        />
                        <h3 id={`${group.key}-metrics-heading`} style={styles.metricGroupTitle}>
                          {group.title}
                        </h3>
                      </div>
                      <p style={styles.metricGroupDescription}>{group.description}</p>
                    </div>
                    <span
                      style={{
                        ...styles.metricGroupBadge,
                        color: groupTone.text,
                        background: groupTone.soft,
                        borderColor: groupTone.border,
                      }}
                    >
                      {group.badge}
                    </span>
                  </div>

                  <div style={styles.metricGrid}>
                    {group.metrics.map((metric) => {
                      const metricTone = styles.tones[metric.tone];

                      return (
                        <article
                          key={metric.label}
                          aria-label={metric.label}
                          style={{
                            ...styles.metricCard,
                            borderColor: metricTone.border,
                            borderLeft: `4px solid ${metricTone.accent}`,
                            background: metricTone.surface,
                          }}
                        >
                          <div style={styles.metricCardTop}>
                            <p style={styles.metricLabel}>{metric.label}</p>
                            <span
                              style={{
                                ...styles.metricTag,
                                color: metricTone.text,
                                background: metricTone.soft,
                              }}
                            >
                              {metric.tag}
                            </span>
                          </div>
                          <p style={styles.metricValue}>
                            {formatCount(metric.value, metric.available, usageLoading)}
                          </p>
                          <p style={styles.metricHint}>{metric.hint}</p>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <div style={styles.breakdownPanel}>
            <div style={styles.breakdownHeader}>
              <div>
                <p style={styles.sectionEyebrow}>DETAILED BREAKDOWN</p>
                <h3 style={styles.sectionTitle}>Activity by test type</h3>
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
                    <th scope="col" style={{ ...styles.tableHeading, color: styles.tones.blue.text }}>
                      Learners with activity
                    </th>
                    <th scope="col" style={{ ...styles.tableHeading, color: styles.tones.emerald.text }}>
                      Submitted attempts
                    </th>
                    <th scope="col" style={{ ...styles.tableHeading, color: styles.tones.violet.text }}>
                      In progress now
                    </th>
                  </tr>
                </thead>
                {activityGroups.map((group) => {
                  const groupTone = styles.tones[group.tone];

                  return (
                    <tbody key={group.key}>
                      <tr>
                        <th
                          scope="rowgroup"
                          colSpan={4}
                          style={{
                            ...styles.groupHeading,
                            color: groupTone.text,
                            background: groupTone.surface,
                            borderBottomColor: groupTone.border,
                          }}
                        >
                          <span style={{ ...styles.groupHeadingMarker, background: groupTone.accent }} />
                          <span>{group.label}</span>
                          <span style={styles.groupDescription}>{group.description}</span>
                        </th>
                      </tr>
                      {group.rows.map((row) => {
                        const rowTone = styles.tones[row.tone];
                        const rowUsers = row.levelKey
                          ? cambridgeUsersByLevel[row.levelKey]
                          : usersByType[row.key];
                        const rowSubmissions = row.levelKey
                          ? cambridgeSubmissionsByLevel[row.levelKey]
                          : submissionsByType[row.key];
                        const rowActiveSessions = row.levelKey
                          ? cambridgeSessionsByLevel[row.levelKey]
                          : row.active;
                        const rowUsersAvailable = row.levelKey
                          ? cambridgeUsersByLevelAvailable
                          : periodAvailable;
                        const rowSubmissionsAvailable = row.levelKey
                          ? cambridgeSubmissionsByLevelAvailable
                          : periodAvailable;
                        const rowActiveSessionsAvailable = row.levelKey
                          ? cambridgeSessionsByLevelAvailable
                          : liveAvailable;

                        return (
                          <tr key={row.key}>
                            <th scope="row" style={styles.tableRowHeading}>
                              <span
                                style={{
                                  ...styles.testTypeBadge,
                                  color: rowTone.text,
                                  background: rowTone.soft,
                                  borderColor: rowTone.border,
                                  ...(row.isSublevel ? styles.sublevelBadge : null),
                                }}
                              >
                                {row.isSublevel ? (
                                  <span
                                    aria-hidden="true"
                                    style={{ ...styles.sublevelConnector, borderColor: rowTone.border }}
                                  />
                                ) : (
                                  <span
                                    aria-hidden="true"
                                    style={{ ...styles.testTypeDot, background: rowTone.accent }}
                                  />
                                )}
                                {row.label}
                                {row.isSummary ? <span style={styles.allLevelsTag}>ALL LEVELS</span> : null}
                              </span>
                            </th>
                            <td style={{ ...styles.tableCell, ...styles.numberCell }}>
                              <span style={{ ...styles.countBadge, ...styles.countBadgeTones.learners }}>
                                {formatCount(rowUsers, rowUsersAvailable, usageLoading)}
                              </span>
                            </td>
                            <td style={{ ...styles.tableCell, ...styles.numberCell }}>
                              <span style={{ ...styles.countBadge, ...styles.countBadgeTones.submissions }}>
                                {formatCount(rowSubmissions, rowSubmissionsAvailable, usageLoading)}
                              </span>
                            </td>
                            <td style={{ ...styles.tableCell, ...styles.numberCell }}>
                              <span style={{ ...styles.countBadge, ...styles.countBadgeTones.active }}>
                                {formatCount(rowActiveSessions, rowActiveSessionsAvailable, usageLoading)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  );
                })}
              </table>
            </div>

            <p style={styles.definitionNote}>
              “Learners with activity” and “learners who submitted” count unique learners for the selected period.
              Submissions count attempts, so one learner may submit more than once.
              {" "}{orangeLabel} totals include all levels; a learner taking multiple levels can appear in more than one child row.
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

const getStyles = (isDarkMode) => {
  const colors = {
    text: isDarkMode ? "#f8fafc" : "#0f172a",
    muted: isDarkMode ? "#a7b5c9" : "#64748b",
    border: isDarkMode ? "rgba(148, 163, 184, 0.22)" : "#dbe4f0",
    surface: isDarkMode ? "#0f172a" : "#ffffff",
    subtle: isDarkMode ? "rgba(30, 41, 59, 0.56)" : "#f8fafc",
  };
  const tones = {
    blue: {
      accent: isDarkMode ? "#60a5fa" : "#2563eb",
      text: isDarkMode ? "#bfdbfe" : "#1d4ed8",
      soft: isDarkMode ? "rgba(37, 99, 235, 0.18)" : "#eff6ff",
      surface: isDarkMode ? "rgba(30, 58, 138, 0.18)" : "#fbfdff",
      border: isDarkMode ? "rgba(96, 165, 250, 0.34)" : "#bfdbfe",
    },
    teal: {
      accent: isDarkMode ? "#2dd4bf" : "#0f766e",
      text: isDarkMode ? "#99f6e4" : "#0f766e",
      soft: isDarkMode ? "rgba(13, 148, 136, 0.18)" : "#f0fdfa",
      surface: isDarkMode ? "rgba(19, 78, 74, 0.2)" : "#fbfffe",
      border: isDarkMode ? "rgba(45, 212, 191, 0.3)" : "#99f6e4",
    },
    violet: {
      accent: isDarkMode ? "#a78bfa" : "#7c3aed",
      text: isDarkMode ? "#ddd6fe" : "#6d28d9",
      soft: isDarkMode ? "rgba(124, 58, 237, 0.18)" : "#f5f3ff",
      surface: isDarkMode ? "rgba(76, 29, 149, 0.18)" : "#fdfcff",
      border: isDarkMode ? "rgba(167, 139, 250, 0.32)" : "#ddd6fe",
    },
    orange: {
      accent: isDarkMode ? "#fb923c" : "#ea580c",
      text: isDarkMode ? "#fed7aa" : "#c2410c",
      soft: isDarkMode ? "rgba(234, 88, 12, 0.18)" : "#fff7ed",
      surface: isDarkMode ? "rgba(124, 45, 18, 0.2)" : "#fffdfb",
      border: isDarkMode ? "rgba(251, 146, 60, 0.32)" : "#fed7aa",
    },
    sky: {
      accent: isDarkMode ? "#38bdf8" : "#0284c7",
      text: isDarkMode ? "#bae6fd" : "#0369a1",
      soft: isDarkMode ? "rgba(2, 132, 199, 0.18)" : "#f0f9ff",
      surface: isDarkMode ? "rgba(12, 74, 110, 0.2)" : "#fbfeff",
      border: isDarkMode ? "rgba(56, 189, 248, 0.32)" : "#bae6fd",
    },
    emerald: {
      accent: isDarkMode ? "#34d399" : "#059669",
      text: isDarkMode ? "#a7f3d0" : "#047857",
      soft: isDarkMode ? "rgba(5, 150, 105, 0.18)" : "#ecfdf5",
      surface: isDarkMode ? "rgba(6, 78, 59, 0.2)" : "#fbfffd",
      border: isDarkMode ? "rgba(52, 211, 153, 0.32)" : "#a7f3d0",
    },
    rose: {
      accent: isDarkMode ? "#fb7185" : "#e11d48",
      text: isDarkMode ? "#fecdd3" : "#be123c",
      soft: isDarkMode ? "rgba(225, 29, 72, 0.18)" : "#fff1f2",
      surface: isDarkMode ? "rgba(136, 19, 55, 0.2)" : "#fffdfd",
      border: isDarkMode ? "rgba(251, 113, 133, 0.32)" : "#fecdd3",
    },
  };

  return {
    tones,
    page: {
      display: "grid",
      gap: 18,
      maxWidth: "100%",
      width: "100%",
      padding: "0 14px 32px",
      background: isDarkMode ? "linear-gradient(180deg, #08111f 0%, #0b1628 100%)" : "#f5f8fc",
      color: colors.text,
    },
    pageHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 20,
      padding: "clamp(20px, 3vw, 32px)",
      border: `1px solid ${colors.border}`,
      borderRadius: 22,
      background: isDarkMode
        ? "linear-gradient(125deg, rgba(15, 23, 42, 0.98) 0%, rgba(17, 40, 70, 0.96) 100%)"
        : "linear-gradient(125deg, #ffffff 0%, #eff6ff 100%)",
      boxShadow: isDarkMode
        ? "0 16px 36px rgba(2, 6, 23, 0.3)"
        : "0 12px 30px rgba(15, 23, 42, 0.06)",
    },
    heroCopy: {
      display: "grid",
      gap: 8,
      minWidth: 0,
      flex: "1 1 420px",
    },
    eyebrowRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    eyebrowMark: {
      width: 8,
      height: 8,
      flexShrink: 0,
      borderRadius: 999,
      background: isDarkMode ? "#60a5fa" : "#2563eb",
    },
    pageEyebrow: {
      margin: 0,
      color: colors.muted,
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
    },
    pageTitle: {
      margin: 0,
      color: colors.text,
      fontSize: "clamp(1.75rem, 3vw, 2.3rem)",
      fontWeight: 800,
      letterSpacing: "-0.035em",
      lineHeight: 1.1,
    },
    pageDescription: {
      maxWidth: 680,
      margin: 0,
      color: colors.muted,
      fontSize: 14,
      lineHeight: 1.65,
    },
    headerActions: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      flexWrap: "wrap",
      gap: 10,
      flex: "0 1 auto",
    },
    windowBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      minHeight: 38,
      padding: "0 12px",
      border: `1px solid ${tones.blue.border}`,
      borderRadius: 999,
      background: tones.blue.soft,
      color: tones.blue.text,
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: "nowrap",
    },
    windowBadgeDot: {
      width: 8,
      height: 8,
      flexShrink: 0,
      borderRadius: 999,
      background: tones.blue.accent,
    },
    overviewPanel: {
      display: "grid",
      gap: 22,
      border: `1px solid ${colors.border}`,
      borderRadius: 22,
      padding: "clamp(16px, 2.8vw, 28px)",
      background: colors.surface,
      boxShadow: isDarkMode ? "0 14px 34px rgba(2, 6, 23, 0.28)" : "0 12px 28px rgba(15, 23, 42, 0.045)",
    },
    overviewHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 16,
    },
    sectionEyebrow: {
      margin: "0 0 5px",
      color: colors.muted,
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
    },
    sectionTitle: {
      margin: 0,
      color: colors.text,
      fontSize: "1.2rem",
      fontWeight: 750,
      lineHeight: 1.3,
    },
    sectionHint: {
      margin: "5px 0 0",
      color: colors.muted,
      fontSize: 13,
      lineHeight: 1.55,
    },
    button: {
      minHeight: 40,
      borderRadius: 11,
      padding: "0 15px",
      fontSize: 13,
      fontWeight: 750,
      cursor: "pointer",
      transition: "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
    },
    refreshButton: {
      border: `1px solid ${isDarkMode ? "#2563eb" : "#1d4ed8"}`,
      background: isDarkMode ? "#1d4ed8" : "#2563eb",
      color: "#ffffff",
      boxShadow: isDarkMode
        ? "0 5px 14px rgba(37, 99, 235, 0.2)"
        : "0 5px 14px rgba(37, 99, 235, 0.16)",
    },
    disabledButton: {
      cursor: "wait",
      opacity: 0.72,
    },
    periodToolbar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      flexWrap: "wrap",
      gap: 12,
    },
    periodToggle: {
      display: "inline-flex",
      gap: 3,
      padding: 4,
      border: `1px solid ${colors.border}`,
      borderRadius: 12,
      background: colors.subtle,
    },
    periodButton: {
      border: "1px solid transparent",
      borderRadius: 9,
      padding: "8px 14px",
      background: "transparent",
      color: colors.muted,
      fontSize: 13,
      fontWeight: 750,
      cursor: "pointer",
    },
    periodButtonActive: {
      border: `1px solid ${tones.blue.border}`,
      background: isDarkMode ? tones.blue.soft : "#ffffff",
      color: tones.blue.text,
      boxShadow: "0 2px 5px rgba(15, 23, 42, 0.08)",
    },
    periodDate: {
      display: "grid",
      gap: 2,
      color: colors.muted,
      fontSize: 11,
      fontWeight: 600,
      textAlign: "right",
      whiteSpace: "nowrap",
    },
    metricGroups: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
      gap: 14,
    },
    metricGroup: {
      display: "grid",
      alignContent: "start",
      gap: 15,
      minWidth: 0,
      padding: "clamp(14px, 2vw, 20px)",
      border: `1px solid ${colors.border}`,
      borderRadius: 18,
      background: colors.subtle,
    },
    metricGroupHeader: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    metricGroupTitleRow: {
      display: "flex",
      alignItems: "center",
      gap: 9,
    },
    metricGroupMarker: {
      width: 9,
      height: 9,
      flexShrink: 0,
      borderRadius: 3,
      transform: "rotate(45deg)",
    },
    metricGroupTitle: {
      margin: 0,
      color: colors.text,
      fontSize: 15,
      fontWeight: 800,
      lineHeight: 1.3,
    },
    metricGroupDescription: {
      margin: "5px 0 0",
      color: colors.muted,
      fontSize: 12,
      lineHeight: 1.45,
    },
    metricGroupBadge: {
      display: "inline-flex",
      alignItems: "center",
      minHeight: 25,
      padding: "0 9px",
      border: "1px solid transparent",
      borderRadius: 999,
      fontSize: 9,
      fontWeight: 850,
      letterSpacing: "0.06em",
      whiteSpace: "nowrap",
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
      fontSize: 13,
    },
    errorButton: {
      border: `1px solid ${isDarkMode ? "#7f1d1d" : "#fecaca"}`,
      background: isDarkMode ? "#450a0a" : "#ffffff",
      color: isDarkMode ? "#fecaca" : "#991b1b",
    },
    metricGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
      gap: 11,
    },
    metricCard: {
      minWidth: 0,
      border: "1px solid transparent",
      borderRadius: 14,
      padding: "14px 15px",
      boxShadow: isDarkMode ? "0 5px 16px rgba(2, 6, 23, 0.12)" : "0 5px 14px rgba(15, 23, 42, 0.035)",
    },
    metricCardTop: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 8,
    },
    metricLabel: {
      margin: 0,
      color: colors.text,
      fontSize: 12,
      fontWeight: 750,
      lineHeight: 1.45,
    },
    metricTag: {
      flexShrink: 0,
      padding: "3px 6px",
      borderRadius: 6,
      fontSize: 8,
      fontWeight: 850,
      letterSpacing: "0.06em",
    },
    metricValue: {
      margin: "12px 0 4px",
      color: colors.text,
      fontSize: "clamp(1.75rem, 2vw, 2rem)",
      fontWeight: 850,
      lineHeight: 1.05,
      fontVariantNumeric: "tabular-nums",
    },
    metricHint: {
      margin: 0,
      color: colors.muted,
      fontSize: 11,
      lineHeight: 1.45,
    },
    breakdownPanel: {
      display: "grid",
      gap: 14,
      paddingTop: 6,
    },
    breakdownHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 8,
    },
    updatedAt: {
      display: "inline-flex",
      alignItems: "center",
      minHeight: 30,
      padding: "0 10px",
      border: `1px solid ${colors.border}`,
      borderRadius: 999,
      background: colors.subtle,
      color: colors.muted,
      fontSize: 11,
      fontWeight: 650,
    },
    tableScroller: {
      width: "100%",
      overflowX: "auto",
      border: `1px solid ${colors.border}`,
      borderRadius: 15,
      background: colors.surface,
    },
    table: {
      width: "100%",
      minWidth: 700,
      borderCollapse: "collapse",
      textAlign: "left",
    },
    tableHeading: {
      padding: "13px 14px",
      borderBottom: `1px solid ${colors.border}`,
      background: isDarkMode ? "#172337" : "#f1f5f9",
      color: colors.muted,
      fontSize: 11,
      fontWeight: 800,
      lineHeight: 1.4,
      whiteSpace: "nowrap",
    },
    groupHeading: {
      padding: "11px 14px",
      borderBottom: `1px solid ${colors.border}`,
      textAlign: "left",
      fontSize: 12,
      fontWeight: 850,
      whiteSpace: "nowrap",
    },
    groupHeadingMarker: {
      display: "inline-block",
      width: 8,
      height: 8,
      marginRight: 9,
      borderRadius: 3,
      verticalAlign: "1px",
    },
    groupDescription: {
      marginLeft: 10,
      color: colors.muted,
      fontSize: 11,
      fontWeight: 550,
    },
    tableRowHeading: {
      padding: "12px 14px",
      borderBottom: `1px solid ${colors.border}`,
      color: colors.text,
      fontSize: 13,
      fontWeight: 700,
      whiteSpace: "nowrap",
    },
    testTypeBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      minHeight: 28,
      padding: "0 9px",
      border: "1px solid transparent",
      borderRadius: 8,
      fontSize: 11,
      fontWeight: 750,
    },
    sublevelBadge: {
      marginLeft: 22,
      minHeight: 26,
      fontSize: 10.5,
      fontWeight: 700,
    },
    sublevelConnector: {
      width: 10,
      height: 8,
      flexShrink: 0,
      borderLeft: "1px solid",
      borderBottom: "1px solid",
      borderBottomLeftRadius: 3,
    },
    allLevelsTag: {
      marginLeft: 1,
      padding: "2px 5px",
      borderRadius: 5,
      background: isDarkMode ? "rgba(251, 146, 60, 0.18)" : "#ffedd5",
      color: isDarkMode ? "#fed7aa" : "#c2410c",
      fontSize: 8,
      fontWeight: 850,
      letterSpacing: "0.04em",
    },
    testTypeDot: {
      width: 7,
      height: 7,
      flexShrink: 0,
      borderRadius: 999,
    },
    tableCell: {
      padding: "11px 14px",
      borderBottom: `1px solid ${colors.border}`,
      color: colors.text,
      fontSize: 12,
      fontVariantNumeric: "tabular-nums",
    },
    numberCell: {
      textAlign: "right",
    },
    countBadge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 42,
      minHeight: 27,
      padding: "0 9px",
      border: "1px solid transparent",
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 800,
      fontVariantNumeric: "tabular-nums",
    },
    countBadgeTones: {
      learners: {
        color: tones.blue.text,
        background: tones.blue.soft,
        borderColor: tones.blue.border,
      },
      submissions: {
        color: tones.emerald.text,
        background: tones.emerald.soft,
        borderColor: tones.emerald.border,
      },
      active: {
        color: tones.violet.text,
        background: tones.violet.soft,
        borderColor: tones.violet.border,
      },
    },
    definitionNote: {
      margin: 0,
      color: colors.muted,
      padding: "11px 13px",
      border: `1px solid ${colors.border}`,
      borderRadius: 11,
      background: colors.subtle,
      fontSize: 11.5,
      lineHeight: 1.55,
    },
  };
};

export default AdminDisplaySettingsPage;
