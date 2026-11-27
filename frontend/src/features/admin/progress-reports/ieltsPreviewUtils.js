import { REPORT_TITLES } from "./ieltsReportUtils";

const escapeHTML = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const escapeAndMark = (value) =>
  escapeHTML(value).replace(/\[[^\]]*\]/g, (match) => `<mark>${match}</mark>`);

function paragraphs(value) {
  return String(value || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (
        /^(Điểm mạnh|Ghi nhận|Cần cải thiện|Gợi ý luyện tập|Gợi ý học từ|Gợi ý làm bài tập về nhà):?$/.test(
          line
        )
      ) {
        return `<p class="hl">${escapeAndMark(line)}</p>`;
      }
      if (/^[-•]/.test(line)) {
        return `<p class="bl">• ${escapeAndMark(
          line.replace(/^[-•]\s*/, "")
        )}</p>`;
      }
      return `<p>${escapeAndMark(line)}</p>`;
    })
    .join("");
}

export function buildIeltsPreviewHTML(data) {
  const include = data.inc || {};
  const title = REPORT_TITLES[data.type] || REPORT_TITLES.giua;
  const pairs = data.pairs || [];
  let infoRows = "";
  for (let index = 0; index < pairs.length; index += 2) {
    const first = pairs[index];
    const second = pairs[index + 1] || ["", ""];
    infoRows += `<tr><th>${escapeHTML(first[0])}</th><td>${escapeHTML(
      first[1] || ""
    )}</td><th>${escapeHTML(second[0])}</th><td>${escapeHTML(
      second[1] || ""
    )}</td></tr>`;
  }

  let html = `<h1>${escapeHTML(title[0])}</h1><div class="sub">${escapeHTML(
    title[1]
  )}</div><table class="info">${infoRows}</table>`;
  let section = 0;
  const heading = (text) =>
    `<h2><span>${++section}.</span> ${escapeHTML(text)}</h2>`;
  const skills = [
    ["L", "Listening"],
    ["R", "Reading"],
    ["W", "Writing"],
    ["Sp", "Speaking"],
  ];

  html +=
    heading("Kết quả tổng quát") +
    `<table class="tb ovt"><tr class="hd"><td></td>${skills
      .map(([, name]) => `<td class="c">${name}</td>`)
      .join("")}<td class="c ovh">OVERALL</td></tr><tr><td><b>Band điểm</b></td>${skills
      .map(
        ([key]) =>
          `<td class="c big">${
            include[key] ? escapeHTML(data[key].band || "—") : "—"
          }</td>`
      )
      .join("")}<td class="c big red">${escapeHTML(
      data.overall || "—"
    )}</td></tr></table><p class="note">Band Overall là trung bình 4 kỹ năng, làm tròn theo quy tắc của IELTS (.25 → .5; .75 → điểm nguyên kế tiếp).</p>`;

  if (include.L || include.R) {
    html += heading(
      include.L && include.R
        ? "Listening & Reading"
        : include.L
          ? "Listening"
          : "Reading"
    );
    if (["L", "R"].some((key) => include[key] && data.detail[key])) {
      html += `<table class="tb"><tr class="hd"><td style="width:20%">Kỹ năng</td><td class="c">Phần 1</td><td class="c">Phần 2</td><td class="c">Phần 3</td><td class="c">Phần 4</td><td class="c">Số câu đúng</td><td class="c">Band</td></tr>${[
        ["L", "Listening"],
        ["R", "Reading"],
      ]
        .filter(([key]) => include[key] && data.detail[key])
        .map(([key, name]) => {
          const score = data[key];
          return `<tr><td><b>${name}</b></td>${[0, 1, 2, 3]
            .map(
              (index) =>
                `<td class="c">${
                  index < score.max.length && score.mode !== "total"
                    ? `${
                        score.parts[index] === ""
                          ? "…"
                          : escapeHTML(score.parts[index])
                      }/${score.max[index]}`
                    : "—"
                }</td>`
            )
            .join("")}<td class="c sc">${
              score.total != null ? score.total : "…"
            }/40</td><td class="c big red">${escapeHTML(
            score.band
          )}</td></tr>`;
        })
        .join("")}</table>`;
    }

    html += `<table class="tb" style="margin-top:8px"><tr class="hd"><td style="width:20%">Kỹ năng</td><td>Nhận xét của giáo viên</td></tr>${[
      ["L", "Listening"],
      ["R", "Reading"],
    ]
      .filter(([key]) => include[key])
      .map(
        ([key, name]) =>
          `<tr><td style="vertical-align:top"><b>${name}</b></td><td>${
            paragraphs(data[key].comment) || "…"
          }</td></tr>`
      )
      .join("")}</table>`;
  }

  const textBox = (value, placeholder) =>
    `<div class="tbox">${
      String(value || "").trim()
        ? paragraphs(value)
        : `<p class="phd">${escapeHTML(placeholder)}</p>`
    }</div>`;

  if (include.W) {
    const writing = data.W;
    html +=
      heading("Writing") +
      (data.detail.W
        ? `<table class="tb"><tr class="hd"><td>Tiêu chí chấm (IDP)</td><td class="c" style="width:22%">Task 1</td><td class="c" style="width:22%">Task 2</td></tr>${writing.rows
            .map(
              (row) =>
                `<tr><td>${escapeHTML(row[0])}</td><td class="c sc">${escapeHTML(
                  row[1]
                )}</td><td class="c sc">${escapeHTML(row[2])}</td></tr>`
            )
            .join("")}<tr class="tot"><td><b>Band từng bài</b></td><td class="c sc">${escapeHTML(
            writing.t1
          )}</td><td class="c sc">${escapeHTML(
            writing.t2
          )}</td></tr><tr class="tot"><td><b style="color:#D7242E">Band Writing</b> <i>(Task 2 tính hệ số 2)</i></td><td colspan="2" class="c big red">${escapeHTML(
            writing.band
          )}</td></tr></table>`
        : "") +
      `<p class="cap">Nhận xét của giáo viên</p>${textBox(
        writing.comment,
        "Nhận xét bài viết…"
      )}`;
  }

  if (include.Sp) {
    const speaking = data.Sp;
    html +=
      heading("Speaking") +
      (data.detail.Sp
        ? `<table class="tb"><tr class="hd"><td>Tiêu chí chấm (IDP)</td><td class="c" style="width:30%">Band</td></tr>${speaking.rows
            .map(
              (row) =>
                `<tr><td>${escapeHTML(row[0])}</td><td class="c sc">${escapeHTML(
                  row[1]
                )}</td></tr>`
            )
            .join("")}<tr class="tot"><td><b style="color:#D7242E">Band Speaking</b></td><td class="c big red">${escapeHTML(
            speaking.band
          )}</td></tr></table>`
        : "") +
      `<p class="cap">Nhận xét của giáo viên</p>${textBox(
        speaking.comment,
        "Nhận xét phần thi nói…"
      )}`;
  }

  const assessments = (data.assessments || []).filter((assessment) =>
    [assessment.score, assessment.comment].some((value) =>
      String(value || "").trim()
    )
  );
  if (assessments.length) {
    html += heading("Từ vựng và bài tập về nhà");
    assessments.forEach((assessment) => {
      html += `<p class="cap">${escapeHTML(assessment.name || assessment.label)}${
        assessment.score
          ? ` · ${escapeHTML(assessment.score)}`
          : ""
      }</p>`;
      if (String(assessment.comment || "").trim()) {
        html += `<div class="tbox">${paragraphs(assessment.comment)}</div>`;
      }
    });
  }

  if (include.att && data.type !== "dauvao") {
    const attendanceRows = [
      [
        data.type === "thang"
          ? "Tổng số buổi học trong tháng"
          : data.type === "giua"
            ? "Tổng số buổi học đến giữa khóa"
            : "Tổng số buổi học của cả khóa",
        "tong",
      ],
      ["Số buổi học viên tham dự", "thamdu"],
      ["Vắng có phép", "cophep"],
      ["Vắng không phép", "khongphep"],
      ["Số lần đi trễ", "tre"],
    ];
    html +=
      heading(
        data.type === "thang"
          ? "Tình hình chuyên cần"
          : data.type === "giua"
            ? "Tình hình chuyên cần (tính đến giữa khóa)"
            : "Tình hình chuyên cần (cả khóa học)"
      ) +
      `<table class="tb"><tr class="hd"><td>Hạng mục chuyên cần</td><td class="c" style="width:17%">Số buổi / lần</td><td style="width:34%">Ghi chú</td></tr>${attendanceRows
        .map(
          ([label, key]) =>
            `<tr><td>${label}</td><td class="c sc">${escapeHTML(
              data.att?.[key] ?? ""
            )}</td><td></td></tr>`
        )
        .join("")}</table>`;
  }

  if (include.part && data.type !== "dauvao") {
    html +=
      heading("Đánh giá mức độ tham gia học tập") +
      `<table class="tb"><tr class="hd"><td>Tiêu chí đánh giá</td>${[
        1, 2, 3, 4, 5,
      ]
        .map((score) => `<td class="c" style="width:5%">${score}</td>`)
        .join("")}<td style="width:30%">Ghi chú</td></tr>${data.partCrit
        .map(
          (criterion, index) =>
            `<tr><td>${escapeHTML(criterion)}</td>${[1, 2, 3, 4, 5]
              .map(
                (score) =>
                  `<td class="c box">${
                    (data.part || [])[index] === score ? "☒" : "☐"
                  }</td>`
              )
              .join("")}<td>${escapeHTML(data.partNotes?.[index] || "")}</td></tr>`
        )
        .join("")}<tr class="tot"><td colspan="7"><i><b>Mức đánh giá:</b> 1 = Chưa đạt · 2 = Cần cải thiện · 3 = Đạt · 4 = Khá · 5 = Xuất sắc</i></td></tr></table>`;
  }

  const texts = data.texts || {};
  const blocks = [
    ["Điểm mạnh nổi bật", texts.uudiem],
    ["Điểm cần cải thiện", texts.hanche],
    [data.planTitle, texts.kehoach],
    [
      data.type === "dauvao"
        ? "Nhận xét & tư vấn"
        : "Lời nhắn đến học viên / phụ huynh",
      texts.loinhan,
    ],
  ].filter(([, value]) => String(value || "").trim());
  html +=
    heading("Nhận xét chung và lời nhắn của giáo viên") +
    `<div class="tbox">${
      blocks.length
        ? blocks
            .map(
              ([label, value]) =>
                `<p class="hl">${escapeHTML(label)}:</p>${paragraphs(value)}`
            )
            .join("")
        : '<p class="phd">Nhận xét chung và lời nhắn của giáo viên…</p>'
    }</div>`;
  html += `<table class="sign"><tr><td><b>Xác nhận của phụ huynh / học viên</b><br><i>(Ký và ghi rõ họ tên)</i></td><td><i>Ngày lập báo cáo: ${escapeHTML(
    data.info?.ngaylap || "……/……/………"
  )}</i><br><b>Giáo viên phụ trách</b><br><i>(Ký và ghi rõ họ tên)</i><div class="sgap"></div><b>${escapeHTML(
    data.info?.gv || ""
  )}</b></td></tr></table>`;
  return html;
}

export function countIeltsPreviewPlaceholders(data, html) {
  const preview = html || buildIeltsPreviewHTML(data);
  return (preview.match(/<mark>/g) || []).length;
}
