export const ASSESSMENT_ORDER = ["vocab", "homework"];

const STAR_EDU_COMMENT_LABELS = ["Tích cực", "Cần cải thiện", "Luyện tập"];
const STAR_EDU_FORMULA_LABELS = [
  "① Tích cực",
  "② Cần cải thiện",
  "③ Luyện tập",
];
const IELTS_COMMENT_LABELS = ["Điểm mạnh", "Cần cải thiện", "Luyện tập"];
const IELTS_FORMULA_LABELS = [
  "① Điểm mạnh",
  "② Cần cải thiện",
  "③ Luyện tập",
];

const makeStep = (number, field, title, fieldLabel, helper, phrases) => ({
  number,
  field,
  title,
  fieldLabel,
  helper,
  phrases: phrases.map((text, index) => ({
    id: `${field}-${index + 1}`,
    text,
  })),
});

const generalSteps = {
  vocab: [
    makeStep(1, "recognition", "Ghi nhận điểm tích cực", "Ghi nhận", "Chọn điều học viên làm tốt hoặc đã tiến bộ.", [
      "Con ghi nhớ tốt nghĩa và cách dùng của các từ trong bài.",
      "Con chủ động vận dụng từ mới vào câu nói hoặc bài viết.",
      "Con phát âm và viết đúng phần lớn từ vựng đã học.",
      "Con biết chọn từ phù hợp với chủ đề và ngữ cảnh.",
      "Con ngày càng giảm lặp từ và diễn đạt đa dạng hơn.",
    ]),
    makeStep(2, "improvement", "Chỉ ra điểm cần cải thiện", "Cần cải thiện", "Nêu một điểm cụ thể để học viên biết cần ôn gì.", [
      "Con cần ôn lại nghĩa và cách phát âm của từ mới sau mỗi buổi học.",
      "Con còn nhầm cách dùng một số từ trong ngữ cảnh.",
      "Con cần chú ý chính tả và dạng từ khi viết.",
      "Con nên mở rộng vốn từ theo chủ đề, tránh chỉ dùng từ quen thuộc.",
      "Con cần luyện đặt câu để ghi nhớ từ lâu và sử dụng tự nhiên hơn.",
    ]),
    makeStep(3, "suggestion", "Gợi ý học từ", "Gợi ý học từ", "Đề xuất một việc ngắn, cụ thể để luyện ở nhà.", [
      "Mỗi ngày ôn 5–8 từ bằng flashcards; cuối tuần tự kiểm tra lại.",
      "Đặt một câu của riêng mình với mỗi từ hoặc cụm từ mới.",
      "Ghi từ mới kèm loại từ, nghĩa và một câu ví dụ ngắn.",
      "Ôn lại từ theo lịch: sau 1 ngày, 3 ngày và 1 tuần.",
      "Chọn 3 từ mới trong bài đọc hoặc nghe rồi thử dùng lại khi nói hoặc viết.",
    ]),
  ],
  homework: [
    makeStep(1, "recognition", "Ghi nhận điểm tích cực", "Ghi nhận", "Chọn điều học viên làm tốt hoặc đã tiến bộ.", [
      "Con hoàn thành đầy đủ và đúng hạn bài tập được giao.",
      "Con trình bày bài cẩn thận, rõ ràng và dễ theo dõi.",
      "Con làm bài khá độc lập và biết tự kiểm tra đáp án.",
      "Con tiếp thu góp ý và chủ động sửa lỗi trong bài tập.",
      "Con duy trì thói quen ôn bài ở nhà đều đặn.",
    ]),
    makeStep(2, "improvement", "Chỉ ra điểm cần cải thiện", "Cần cải thiện", "Nêu rõ phần bài tập hoặc thói quen cần thay đổi.", [
      "Con còn nộp thiếu hoặc trễ một số bài tập.",
      "Con cần đọc kỹ yêu cầu trước khi bắt đầu làm bài.",
      "Con còn mắc lỗi do làm vội hoặc chưa kiểm tra lại.",
      "Con nên hỏi giáo viên về phần chưa hiểu thay vì bỏ trống.",
      "Con cần tự làm bài nhiều hơn trước khi xem đáp án hoặc nhờ người khác hỗ trợ.",
    ]),
    makeStep(3, "suggestion", "Gợi ý làm bài tập về nhà", "Gợi ý làm bài tập về nhà", "Ghi rõ bài cần làm và thời hạn nếu có.", [
      "Hoàn thành bài [tên bài / trang] trước buổi học tiếp theo.",
      "Dành 10–15 phút sau buổi học để ôn bài và làm phần được giao.",
      "Đánh dấu câu chưa hiểu và mang đến lớp để được giáo viên hướng dẫn.",
      "Sau khi làm bài, kiểm tra lại đáp án, chính tả và cách trình bày.",
      "Chia bài tập thành từng phần nhỏ và hoàn thành đúng hạn.",
    ]),
  ],
};

const ieltsSteps = {
  vocab: [
    makeStep(1, "recognition", "Ghi nhận điểm tích cực", "Ghi nhận", "Chọn điều học viên làm tốt trong vốn từ và cách diễn đạt IELTS.", [
      "Em sử dụng từ vựng chính xác, phù hợp với chủ đề và ngữ cảnh.",
      "Em biết paraphrase và hạn chế lặp từ trong bài nói hoặc bài viết.",
      "Em sử dụng collocations tự nhiên, phù hợp với chủ đề.",
      "Em thể hiện vốn từ học thuật đa dạng mà vẫn giữ cách diễn đạt tự nhiên.",
      "Em ghi nhớ và vận dụng được từ, cụm từ đã học vào bài luyện tập.",
    ]),
    makeStep(2, "improvement", "Chỉ ra điểm cần cải thiện", "Cần cải thiện", "Nêu một lỗi hoặc thói quen từ vựng cụ thể cần sửa.", [
      "Một số từ hoặc cụm từ chưa đúng collocation hoặc sắc thái nghĩa.",
      "Từ vựng còn lặp lại; em cần mở rộng cách diễn đạt và paraphrase.",
      "Em cần chú ý word form và spelling khi viết.",
      "Một số từ học thuật đang được dùng chưa tự nhiên hoặc chưa đúng ngữ cảnh.",
      "Em cần chủ động ghi lại và ôn tập từ mới xuất hiện trong đề.",
    ]),
    makeStep(3, "suggestion", "Gợi ý học từ", "Gợi ý học từ", "Gợi ý cách học có thể áp dụng ngay cho IELTS.", [
      "Học từ theo chủ đề IELTS; ghi kèm collocation, nghĩa, word form và câu ví dụ.",
      "Chọn 5–8 collocations mỗi tuần rồi tự đặt câu hoặc dùng trong câu trả lời Speaking.",
      "Dùng spaced repetition để ôn từ mới sau 1 ngày, 3 ngày và 1 tuần.",
      "Sau mỗi bài Reading hoặc Listening, chọn từ hữu ích và tự viết câu paraphrase.",
      "Ưu tiên dùng từ chính xác, tự nhiên thay vì cố dùng từ hiếm.",
    ]),
  ],
  homework: [
    makeStep(1, "recognition", "Ghi nhận điểm tích cực", "Ghi nhận", "Chọn điều học viên làm tốt trong quá trình tự học.", [
      "Em hoàn thành bài luyện đúng hạn và làm đủ các phần được giao.",
      "Bài làm thể hiện sự chuẩn bị nghiêm túc và có đối chiếu nhận xét.",
      "Em chủ động sửa lỗi và làm lại phần cần cải thiện.",
      "Em duy trì lịch tự học đều đặn giữa các buổi.",
      "Bài tập vận dụng tốt chiến lược đã học trên lớp.",
    ]),
    makeStep(2, "improvement", "Chỉ ra điểm cần cải thiện", "Cần cải thiện", "Nêu phần bài tập hoặc cách tự học cần tập trung hơn.", [
      "Một số bài chưa hoàn thành hoặc chưa được nộp đúng hạn.",
      "Em cần dành thêm thời gian rà soát đáp án và lý do làm sai.",
      "Bài Writing hoặc Speaking cần phát triển ý và bổ sung ví dụ cụ thể.",
      "Em nên làm bài có bấm giờ để theo dõi tốc độ và khả năng phân bổ thời gian.",
      "Sau khi nhận feedback, em cần sửa lỗi và nộp lại thay vì chỉ xem điểm.",
    ]),
    makeStep(3, "suggestion", "Gợi ý làm bài tập về nhà", "Gợi ý làm bài tập về nhà", "Ghi rõ task, kỹ năng cần luyện và hạn hoàn thành.", [
      "Hoàn thành bài [tên bài / task] trước [ngày nộp] và kiểm tra đủ yêu cầu.",
      "Sau mỗi đề Reading hoặc Listening, ghi lại câu sai, nguyên nhân và cách tránh lặp lại.",
      "Lập lịch tự học 30–45 phút mỗi ngày và luân phiên các kỹ năng.",
      "Sửa lại bài Writing hoặc Speaking theo feedback, lưu bản trước và sau để theo dõi tiến bộ.",
      "Mỗi tuần làm một phần thi có bấm giờ rồi tự tổng kết lỗi thường gặp.",
    ]),
  ],
};

export const STAR_EDU_ASSESSMENTS = {
  vocab: {
    label: "Từ vựng",
    en: "Vocabulary",
    title: "Điểm từ vựng",
    suggestionLabel: "Gợi ý học từ",
    commentLabels: STAR_EDU_COMMENT_LABELS,
    formulaLabels: STAR_EDU_FORMULA_LABELS,
    scorePlaceholder: "VD: 8/10",
    scoreHint:
      "Nhập theo thang điểm giáo viên đang dùng (ví dụ: 8/10). Điểm này được ghi riêng, không cộng vào điểm kỹ năng.",
    steps: generalSteps.vocab,
  },
  homework: {
    label: "Bài tập về nhà",
    en: "Homework",
    title: "Điểm bài tập về nhà",
    suggestionLabel: "Gợi ý làm bài tập về nhà",
    commentLabels: STAR_EDU_COMMENT_LABELS,
    formulaLabels: STAR_EDU_FORMULA_LABELS,
    scorePlaceholder: "VD: 9/10",
    scoreHint:
      "Có thể nhập điểm hoặc mức hoàn thành. Mục này được ghi riêng, không cộng vào điểm kỹ năng.",
    steps: generalSteps.homework,
  },
};

export const IELTS_ASSESSMENTS = {
  vocab: {
    ...STAR_EDU_ASSESSMENTS.vocab,
    commentLabels: IELTS_COMMENT_LABELS,
    formulaLabels: IELTS_FORMULA_LABELS,
    scoreHint:
      "Dùng cho bài kiểm tra từ vựng riêng nếu có; không thay thế Band Lexical Resource và không cộng vào Overall.",
    steps: ieltsSteps.vocab,
  },
  homework: {
    ...STAR_EDU_ASSESSMENTS.homework,
    commentLabels: IELTS_COMMENT_LABELS,
    formulaLabels: IELTS_FORMULA_LABELS,
    scoreHint:
      "Điểm bài tập được ghi riêng, không cộng vào band kỹ năng hoặc Overall IELTS.",
    steps: ieltsSteps.homework,
  },
};

export function blankAssessment() {
  return {
    score: "",
    override: null,
    sel: { 1: [], 2: [], 3: [] },
    custom: {},
  };
}

export function blankAssessments() {
  return Object.fromEntries(
    ASSESSMENT_ORDER.map((key) => [key, blankAssessment()])
  );
}

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function strings(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string")
    : [];
}

function stringMap(value) {
  return Object.fromEntries(
    Object.entries(isRecord(value) ? value : {}).filter(
      ([, item]) => typeof item === "string"
    )
  );
}

export function normalizeAssessment(saved, item) {
  const source = isRecord(saved) ? saved : {};
  const selected = isRecord(source.sel) ? source.sel : {};
  const legacyComment = (item?.steps || []).map((step) => {
    const text =
      typeof source[step.field] === "string" ? source[step.field].trim() : "";
    if (!text) return "";
    const label =
      item.commentLabels?.[step.number - 1] || step.fieldLabel;
    return `${label}:\n${text}`;
  }).filter(Boolean).join("\n\n");

  return {
    score: source.score == null ? "" : String(source.score),
    override:
      typeof source.override === "string" ? source.override : legacyComment || null,
    sel: {
      1: strings(selected[1]),
      2: strings(selected[2]),
      3: strings(selected[3]),
    },
    custom: stringMap(source.custom),
  };
}

function punctuate(text) {
  const value = String(text || "").trim();
  return value && !/[.!?…]$/.test(value) ? `${value}.` : value;
}

export function composeAssessment(item, assessment, formatText) {
  if (!item || !assessment) return "";

  const custom = stringMap(assessment.custom);
  const sections = item.steps
    .map((step) => {
      const phrases = new Map([
        ...step.phrases.map(({ id, text }) => [id, text]),
        ...Object.entries(custom)
          .filter(([id]) => id.startsWith(`c:${step.number}:`))
          .map(([id, text]) => [id, text]),
      ]);
      const selectedTexts = strings(assessment.sel?.[step.number])
        .map((id) => phrases.get(id))
        .filter((text) => typeof text === "string")
        .map(punctuate);
      if (!selectedTexts.length) return "";

      const label =
        item.commentLabels?.[step.number - 1] || step.fieldLabel;
      return `${label}:\n${selectedTexts
        .map((text) => `- ${text}`)
        .join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");

  return typeof formatText === "function" ? formatText(sections) : sections;
}

export function assessmentComment(item, assessment, formatText) {
  return assessment?.override ?? composeAssessment(item, assessment, formatText);
}
