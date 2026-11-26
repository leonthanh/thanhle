import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProgressReportsPage from "../ProgressReportsPage";

jest.mock("../../../../shared/components/AdminNavbar", () => () => null);

describe("ProgressReportsPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  test("renders the general Star Edu editor in React without a legacy iframe", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/progress-reports"]}>
        <ProgressReportsPage />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole("heading", {
        name: "Star Edu Progress Report System",
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.queryByTitle("Star Edu Progress Report")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Progress Reports" })).not.toBeInTheDocument();
  });

  test("loads existing localStorage scores and saves edits with the same schema", async () => {
    window.localStorage.setItem(
      "nhanxet-v1",
      JSON.stringify({
        student: "Lan",
        pronoun: "Con",
        rtype: "thang",
        program: "pr",
        tab: "nghe",
        skills: { nghe: { score: "18", sel: { 1: [], 2: [], 3: [] } } },
        assessments: {
          vocab: {
            score: "8/10",
            recognition: "Ghi nhớ tốt từ mới.",
            improvement: "",
            suggestion: "",
          },
          homework: { score: "9/10" },
        },
      })
    );

    render(
      <MemoryRouter initialEntries={["/admin/progress-reports"]}>
        <ProgressReportsPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Tên học viên")).toHaveValue("Lan");
    fireEvent.click(screen.getByRole("tab", { name: /Từ vựng/ }));
    const scoreInput = screen.getByLabelText("Điểm từ vựng");
    expect(scoreInput).toHaveValue("8/10");
    expect(
      screen.getByLabelText("Đoạn nhận xét, có thể sửa trực tiếp")
    ).toHaveValue("Tích cực:\nGhi nhớ tốt từ mới.");

    fireEvent.change(scoreInput, { target: { value: "9/10" } });
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem("nhanxet-v1"));
      expect(saved.assessments.vocab.score).toBe("9/10");
    });
    const savedAfterScoreEdit = JSON.parse(
      window.localStorage.getItem("nhanxet-v1")
    );
    expect(savedAfterScoreEdit.assessments.vocab.override).toBe(
      "Tích cực:\nGhi nhớ tốt từ mới."
    );
  });

  test("reorders selected general comments by drag-and-drop and persists the order", async () => {
    const firstId = "c:open:first";
    const secondId = "c:open:second";
    window.localStorage.setItem(
      "nhanxet-v1",
      JSON.stringify({
        student: "Lan",
        tab: "gen",
        gen: {
          sel: [firstId, secondId],
          custom: {
            [firstId]: "Câu nhận xét thứ nhất.",
            [secondId]: "Câu nhận xét thứ hai.",
          },
        },
      })
    );

    render(
      <MemoryRouter initialEntries={["/admin/progress-reports"]}>
        <ProgressReportsPage />
      </MemoryRouter>
    );

    const commentSheet = within(
      screen.getByRole("complementary", { name: "Nhận xét" })
    );
    const items = commentSheet.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    const dataTransfer = { setData: jest.fn(), effectAllowed: "" };
    fireEvent.dragStart(items[1], { dataTransfer });
    expect(items[1]).toHaveClass("dragging");
    fireEvent.drop(items[0], { dataTransfer, clientY: 0 });

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem("nhanxet-v1"));
      expect(saved.gen.sel).toEqual([secondId, firstId]);
    });
    expect(
      commentSheet
        .getAllByRole("listitem")
        .map((item) => within(item).getByText(/Câu nhận xét thứ/).textContent)
    ).toEqual(["Câu nhận xét thứ hai.", "Câu nhận xét thứ nhất."]);
  });

  test("renders the IELTS editor in React without an HTML iframe", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/progress-reports?report=ielts"]}>
        <ProgressReportsPage />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole("heading", {
        name: "Star Edu IELTS Progress Report System",
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Listening/ })).toBeInTheDocument();
    expect(screen.queryByTitle("Star Edu IELTS Progress Report")).not.toBeInTheDocument();
  });

  test("loads and saves IELTS drafts with the existing localStorage key", async () => {
    window.localStorage.setItem(
      "ielts-report-v1",
      JSON.stringify({
        student: "Lan",
        pronoun: "Em",
        level: "565a",
        rtype: "giua",
        tab: "L",
        skills: {
          L: {
            mode: "parts",
            parts: ["8", "7", "6", "5"],
            sel: { 1: [], 2: [], 3: [] },
          },
        },
      })
    );
    window.localStorage.setItem("ielts-report-v1-seen", "1");

    render(
      <MemoryRouter initialEntries={["/admin/progress-reports?report=ielts"]}>
        <ProgressReportsPage />
      </MemoryRouter>
    );

    expect(await screen.findByLabelText("Tên học viên")).toHaveValue("Lan");
    const partOne = screen.getByLabelText(/Part 1/);
    fireEvent.change(partOne, { target: { value: "9" } });

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem("ielts-report-v1"));
      expect(saved.skills.L.parts[0]).toBe("9");
    });
  });

  test("lets teachers select and edit vocabulary feedback in both report editors", async () => {
    window.localStorage.setItem("ielts-report-v1-seen", "1");

    const { unmount } = render(
      <MemoryRouter initialEntries={["/admin/progress-reports"]}>
        <ProgressReportsPage />
      </MemoryRouter>
    );

    await screen.findByRole("heading", {
      name: "Star Edu Progress Report System",
    });
    fireEvent.click(screen.getByRole("tab", { name: /Từ vựng/ }));
    fireEvent.change(screen.getByLabelText("Điểm từ vựng"), {
      target: { value: "9/10" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: /ghi nhớ tốt nghĩa và cách dùng/,
      })
    );
    const generalNote = screen.getByLabelText(
      "Đoạn nhận xét, có thể sửa trực tiếp"
    );
    expect(generalNote).toHaveValue(
      "Tích cực:\n- Con ghi nhớ tốt nghĩa và cách dùng của các từ trong bài."
    );
    fireEvent.change(generalNote, {
      target: { value: "Con đã ghi nhớ và vận dụng từ mới." },
    });

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem("nhanxet-v1"));
      expect(saved.assessments.vocab.override).toBe(
        "Con đã ghi nhớ và vận dụng từ mới."
      );
    });
    const generalSaved = JSON.parse(window.localStorage.getItem("nhanxet-v1"));
    expect(generalSaved.assessments.vocab.score).toBe("9/10");
    expect(generalSaved.assessments.vocab.sel[1]).toHaveLength(1);

    unmount();
    window.localStorage.setItem("ielts-report-v1-seen", "1");
    render(
      <MemoryRouter
        initialEntries={["/admin/progress-reports?report=ielts"]}
      >
        <ProgressReportsPage />
      </MemoryRouter>
    );
    await screen.findByRole("heading", {
      name: "Star Edu IELTS Progress Report System",
    });
    fireEvent.click(screen.getByRole("tab", { name: /Vocabulary/ }));
    fireEvent.change(screen.getByLabelText("Điểm từ vựng"), {
      target: { value: "18/20" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: /paraphrase và hạn chế lặp từ/,
      })
    );
    const ieltsNote = screen.getByLabelText(
      "Đoạn nhận xét, có thể sửa trực tiếp"
    );
    expect(ieltsNote).toHaveValue(
      "Điểm mạnh:\n- Em biết paraphrase và hạn chế lặp từ trong bài nói hoặc bài viết."
    );
    fireEvent.change(
      ieltsNote,
      {
      target: { value: "Em đã paraphrase tự nhiên hơn." },
      }
    );

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem("ielts-report-v1"));
      expect(saved.assessments.vocab.override).toBe(
        "Em đã paraphrase tự nhiên hơn."
      );
    });
    const ieltsSaved = JSON.parse(window.localStorage.getItem("ielts-report-v1"));
    expect(ieltsSaved.assessments.vocab.score).toBe("18/20");
    expect(ieltsSaved.assessments.vocab.sel[1]).toHaveLength(1);
  });
});
