import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminDisplaySettingsPage from "../AdminDisplaySettingsPage";

jest.mock("../../../../shared/components/AdminNavbar", () => () => null);
jest.mock("../../../../shared/utils/permissions", () => ({
  getCurrentUser: () => ({ role: "teacher" }),
  isAdmin: (user) => user?.role === "admin",
}));
jest.mock("../../../../shared/utils/api", () => ({
  apiPath: (path) => path,
  authFetch: jest.fn(),
}));
jest.mock("../../../../shared/contexts/DisplaySettingsContext", () => ({
  useDisplaySettings: jest.fn(),
}));
const { authFetch } = require("../../../../shared/utils/api");
const { useDisplaySettings } = require("../../../../shared/contexts/DisplaySettingsContext");

const usageOverview = {
  generatedAt: "2026-03-19T10:00:00.000Z",
  live: {
    activeUsersInTests: 2,
    activeTestSessions: 4,
    activityWindowMinutes: 15,
    sessionsByType: {
      writingDrafts: 1,
      reading: 1,
      listening: 0,
      cambridge: 1,
      gateway: 1,
      prepare: 0,
      general: 0,
    },
    cambridgeSessionsByLevel: { ket: 1, pet: 0, flyers: 0, movers: 0, starters: 0 },
  },
  today: {
    date: "2026-03-19",
    usersInTests: 5,
    usersByType: { writing: 2, reading: 1, listening: 0, cambridge: 1, gateway: 0, prepare: 0, general: 1 },
    cambridgeUsersByLevel: { ket: 1, pet: 0, flyers: 0, movers: 0, starters: 0 },
    submitters: 2,
    submissions: 4,
    submissionsByType: { writing: 2, reading: 1, listening: 0, cambridge: 1, gateway: 0, prepare: 0, general: 0 },
    cambridgeSubmissionsByLevel: { ket: 1, pet: 0, flyers: 0, movers: 0, starters: 0 },
  },
  month: {
    date: "2026-03",
    usersInTests: 12,
    usersByType: { writing: 7, reading: 3, listening: 2, cambridge: 4, gateway: 1, prepare: 1, general: 2 },
    cambridgeUsersByLevel: { ket: 4, pet: 0, flyers: 0, movers: 0, starters: 0 },
    submitters: 8,
    submissions: 20,
    submissionsByType: { writing: 11, reading: 4, listening: 2, cambridge: 1, gateway: 1, prepare: 1, general: 0 },
    cambridgeSubmissionsByLevel: { ket: 1, pet: 0, flyers: 0, movers: 0, starters: 0 },
  },
};

describe("AdminDisplaySettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDisplaySettings.mockReturnValue({
      displayLabels: {
        ixDisplayName: "IX",
        orangeDisplayName: "Orange",
        generalDisplayName: "General",
      },
    });
    authFetch.mockResolvedValue({
      ok: true,
      json: async () => usageOverview,
    });
  });

  test("switches between daily and monthly learner and submission counts", async () => {
    render(
      <MemoryRouter>
        <AdminDisplaySettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText("IX core skills")).toBeInTheDocument();
    expect(screen.getByText("Programs & learning tracks")).toBeInTheDocument();
    const accessPages = screen.getByRole("navigation", { name: "Admin workspace pages" });
    expect(within(accessPages).getByRole("button", { name: /Test Activity/ })).toBeInTheDocument();
    expect(within(accessPages).queryByRole("button", { name: /Runtime sync/ })).not.toBeInTheDocument();

    const ketRow = screen.getByRole("row", { name: /^KET/ });
    expect(await within(ketRow).findAllByText("1")).toHaveLength(3);

    const todayCard = screen.getByRole("article", { name: "Learners with activity" });
    expect(await within(todayCard).findByText("5")).toBeInTheDocument();
    const writingRow = screen.getByRole("row", { name: /^IX Writing/ });
    expect(await within(writingRow).findAllByText("2")).toHaveLength(2);
    expect(screen.queryByText("Advanced: Display labels")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "This month" }));

    const monthCard = screen.getByRole("article", { name: "Learners with activity" });
    expect(await within(monthCard).findByText("12")).toBeInTheDocument();
    expect(
      await within(screen.getByRole("article", { name: "Learners who submitted" })).findByText("8")
    ).toBeInTheDocument();
    expect(
      await within(screen.getByRole("article", { name: "Submissions received" })).findByText("20")
    ).toBeInTheDocument();
    const monthWritingRow = screen.getByRole("row", { name: /^IX Writing/ });
    expect(await within(monthWritingRow).findByText("7")).toBeInTheDocument();
    expect(await within(monthWritingRow).findByText("11")).toBeInTheDocument();
  });
});
