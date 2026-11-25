import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ExamLevelSkillRuntimePage from "../ExamLevelSkillRuntimePage";

jest.mock("../../../../shared/utils/api", () => ({
  apiPath: (path) => path,
  authFetch: jest.fn(),
}));

jest.mock("../../../../shared/utils/placementTests", () => ({
  buildPlacementAttemptPath: (token) => `/placement-attempt/${token}`,
  readPlacementRuntimeContext: () => ({ isPlacementRuntime: false }),
}));

jest.mock("../../../exam-engine/shared/pages/ExamCoreListeningRuntimePage", () => ({
  __esModule: true,
  default: ({ hubPath }) => require("react").createElement(
    "div",
    { "data-testid": "listening-runtime", "data-hub-path": hubPath }
  ),
}));

jest.mock("../../../exam-engine/shared/pages/ExamCoreReadingRuntimePage", () => ({
  __esModule: true,
  default: ({ hubPath }) => require("react").createElement(
    "div",
    { "data-testid": "reading-runtime", "data-hub-path": hubPath }
  ),
}));

const { authFetch } = require("../../../../shared/utils/api");

beforeEach(() => {
  authFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      name: "Prepare",
      skills: ["listening", "reading-writing"],
      skillConfig: {
        listening: { templateId: "prepare-listening-v1" },
        "reading-writing": { templateId: "prepare-reading-writing-v1" },
      },
    }),
  });
});

test.each([
  ["listening", "listening-runtime"],
  ["reading-writing", "reading-runtime"],
])("returns Prepare %s to its Select Test tab", async (skill, runtimeTestId) => {
  render(
    <MemoryRouter initialEntries={[`/prepare/${skill}/42`]}>
      <Routes>
        <Route
          path="/prepare/:skill/:id"
          element={<ExamLevelSkillRuntimePage code="prepare" />}
        />
      </Routes>
    </MemoryRouter>
  );

  expect(await screen.findByTestId(runtimeTestId)).toHaveAttribute(
    "data-hub-path",
    `/select-test?platform=prepare&tab=${skill}`
  );
});
