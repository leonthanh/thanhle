const adminRoutePreloaders = {
  "/select-test": () => import("../../features/admin/pages/SelectTest"),
  "/review": () => import("../../features/admin/pages/Review"),
  "/admin/create-writing": () => import("../../features/writing/pages/CreateWritingTest"),
  "/admin/create-reading": () => import("../../features/reading/pages/CreateReadingTest"),
  "/admin/create-listening": () => import("../../features/listening/pages/CreateListeningTestNew"),
  "/admin/writing-submissions": () => import("../../features/admin/pages/AdminWritingSubmissions"),
  "/admin/reading-submissions": () => import("../../features/admin/pages/AdminReadingSubmissions"),
  "/admin/listening-submissions": () => import("../../features/admin/pages/AdminListeningSubmissions"),
  "/admin/create-ket-listening": () => import("../../domains/cambridge/ket/listening/pages/CreateKETListeningTestPage"),
  "/admin/create-ket-reading": () => import("../../domains/cambridge/ket/reading/pages/CreateKETReadingTestPage"),
  "/admin/create-pet-listening": () => import("../../domains/cambridge/pet/listening/pages/CreatePETListeningTestPage"),
  "/admin/create-pet-reading": () => import("../../domains/cambridge/pet/reading/pages/CreatePETReadingTestPage"),
  "/admin/create-pet-writing": () => import("../../domains/cambridge/pet/writing/pages/CreatePetWritingTestPage"),
  "/admin/create/flyers": () => import("../../domains/cambridge/flyers/reading/teacher/pages/CreateFlyersReadingPage"),
  "/admin/create/movers": () => import("../../domains/cambridge/movers/reading/teacher/pages/CreateMoversReadingPage"),
  "/admin/create/starters": () => import("../../domains/cambridge/starters/reading/teacher/pages/CreateStartersReadingPage"),
  "/admin/create-movers-listening": () => import("../../domains/cambridge/movers/listening/pages/CreateMoversListeningTestPage"),
  "/admin/cambridge-submissions": () => import("../../features/admin/pages/CambridgeSubmissionsPage"),
  "/admin/general-submissions": () => import("../../domains/general/pages/GeneralSubmissionsPage"),
  "/admin/create-general-reading": () => import("../../domains/general/reading/pages/CreateGeneralReadingTestPage"),
  "/admin/create-general-listening": () => import("../../domains/general/listening/pages/CreateGeneralListeningTestPage"),
  "/admin/gateway-submissions": () => import("../../features/gateway/pages/GatewaySubmissionsPage"),
  "/admin/create-gateway/reading-writing": () => import("../../features/gateway/pages/GatewayCreateTestPage"),
  "/admin/create-gateway/listening": () => import("../../features/gateway/pages/GatewayCreateTestPage"),
  "/admin/prepare": () => import("../../features/admin/pages/SelectTest"),
  "/prepare/submissions": () => import("../../domains/configured-levels/pages/ExamLevelSubmissionsPage"),
  "/admin/display-settings": () => import("../../features/admin/pages/AdminDisplaySettingsPage"),
  "/admin/runtime-sync-metrics": () => import("../../features/admin/pages/AdminRuntimeSyncMetricsPage"),
  "/admin/teacher-permissions": () => import("../../features/admin/pages/TeacherPermissionsPage"),
  "/admin/users": () => import("../../features/admin/pages/AdminUserManagement"),
  "/admin/progress-reports": () => import("../../features/admin/pages/ProgressReportsPage"),
};

export const preloadAdminRoute = (path) => {
  const routePath = String(path || "").split(/[?#]/, 1)[0];
  const preloader = adminRoutePreloaders[routePath];
  if (!preloader) return;
  void preloader().catch(() => {});
};

export const preloadAdminItems = (items = []) => {
  items.forEach((item) => {
    if (item?.to) preloadAdminRoute(item.to);
  });
};
