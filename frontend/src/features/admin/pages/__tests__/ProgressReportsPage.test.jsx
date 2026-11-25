import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProgressReportsPage from "../ProgressReportsPage";

jest.mock("../../../../shared/components/AdminNavbar", () => () => null);
jest.mock("../../../../shared/utils/api", () => ({
  apiPath: jest.fn((path) => `/api/${path}`),
  authFetch: jest.fn(),
}));

const { apiPath, authFetch } = require("../../../../shared/utils/api");

describe("ProgressReportsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authFetch.mockImplementation(async (url) => ({
      ok: true,
      text: async () => `<p>${url}</p>`,
    }));
  });

  test("loads Star Edu by default without a duplicate page-level selector", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/progress-reports"]}>
        <ProgressReportsPage />
      </MemoryRouter>
    );

    const starEduFrame = await screen.findByTitle("Star Edu Progress Report");
    await waitFor(() => {
      expect(starEduFrame).toHaveAttribute("srcdoc", "<p>/api/progress-reports/general</p>");
    });
    expect(screen.queryByRole("heading", { name: "Progress Reports" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist", { name: "Report type" })).not.toBeInTheDocument();
    expect(apiPath).toHaveBeenCalledWith("progress-reports/general");
    expect(authFetch).toHaveBeenCalledWith("/api/progress-reports/general");
  });

  test("loads IELTS when selected in the navbar URL", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/progress-reports?report=ielts"]}>
        <ProgressReportsPage />
      </MemoryRouter>
    );

    const ieltsFrame = await screen.findByTitle("Star Edu IELTS Progress Report");
    await waitFor(() => {
      expect(ieltsFrame).toHaveAttribute("srcdoc", "<p>/api/progress-reports/ielts</p>");
    });
    expect(apiPath).toHaveBeenCalledWith("progress-reports/ielts");
    expect(authFetch).toHaveBeenCalledWith("/api/progress-reports/ielts");
  });

  test("sizes the iframe to the report document on load", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/progress-reports"]}>
        <ProgressReportsPage />
      </MemoryRouter>
    );

    const frame = await screen.findByTitle("Star Edu Progress Report");
    const reportDocument = frame.contentDocument;
    Object.defineProperty(reportDocument.documentElement, "scrollHeight", {
      configurable: true,
      value: 1400,
    });
    Object.defineProperty(reportDocument.body, "scrollHeight", {
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(frame.contentWindow, "ResizeObserver", {
      configurable: true,
      value: undefined,
    });

    fireEvent.load(frame);

    expect(frame.style.height).toBe("1400px");
  });

  test("shows a server permission error instead of rendering an unavailable report", async () => {
    authFetch.mockResolvedValue({ ok: false, status: 403 });

    render(
      <MemoryRouter initialEntries={["/admin/progress-reports"]}>
        <ProgressReportsPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Tài khoản của bạn không có quyền xem báo cáo."
    );
    expect(screen.queryByTitle("Star Edu Progress Report")).not.toBeInTheDocument();
  });
});
