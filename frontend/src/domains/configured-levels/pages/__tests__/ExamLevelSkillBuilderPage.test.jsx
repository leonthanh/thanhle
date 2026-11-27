import React from "react";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { getExamLevelSkillBuilderSuccessPath } from "../ExamLevelSkillBuilderPage";
import ExamLevelSkillBuilderPage from "../ExamLevelSkillBuilderPage";
import ExamCoreTestBuilder from "../../../exam-engine/shared/components/ExamCoreTestBuilder";
import { authFetch } from "../../../../shared/utils/api";

jest.mock("../../../exam-engine/shared/components/ExamCoreTestBuilder", () => jest.fn(() => null));
jest.mock("../../../../shared/utils/api", () => ({
  apiPath: jest.fn((path) => path),
  authFetch: jest.fn(),
}));

describe("getExamLevelSkillBuilderSuccessPath", () => {
  test("returns Prepare builders to the matching Test List skill", () => {
    expect(getExamLevelSkillBuilderSuccessPath("prepare", "reading-writing")).toBe(
      "/select-test?platform=prepare&tab=reading-writing"
    );
    expect(getExamLevelSkillBuilderSuccessPath("prepare", "listening")).toBe(
      "/select-test?platform=prepare&tab=listening"
    );
  });

  test("keeps other exam levels on their existing hub route", () => {
    expect(getExamLevelSkillBuilderSuccessPath("gateway", "reading-writing")).toBe(
      "/exam-levels/gateway"
    );
  });

  test("enables section naming for Prepare Listening", async () => {
    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        name: "Prepare",
        skills: ["listening"],
        skillConfig: {
          listening: { templateId: "exam-listening-v1", durationMinutes: 30 },
        },
      }),
    });

    render(
      <MemoryRouter initialEntries={["/prepare/listening"]}>
        <Routes>
          <Route path="/:code/:skill" element={<ExamLevelSkillBuilderPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(ExamCoreTestBuilder).toHaveBeenCalled());
    expect(ExamCoreTestBuilder.mock.calls[0][0]).toMatchObject({
      prepareListening: true,
      durationMinutes: 15,
    });
  });
});
