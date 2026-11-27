import {
  MESSAGE_TITLE,
  PARTICIPATION_CRITERIA,
  REPORT_TITLES,
} from "./reportUtils";

const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const planTitle = (type) =>
  type === "giua"
    ? "Kế hoạch học tập để khắc phục hạn chế (nửa khóa còn lại)"
    : "Kế hoạch học tập & định hướng cho khóa tiếp theo";
const PAGE = Object.freeze({ width: 794, height: 1123, top: 113, bottom: 95, side: 57 });

export function buildPreviewHTML(data) {
  const info = data.info || {};
  const include = data.inc || { skills: true, att: true, part: true };
  const titles = REPORT_TITLES[data.type];
  const pairsByType = {
    thang: [
      ["Họ và tên học viên", data.student],
      ["Lớp học", info.lop],
      ["Chương trình", info.prog],
      ["Tháng / Năm", info.thang],
      ["Giáo viên phụ trách", info.gv],
    ],
    giua: [
      ["Họ và tên học viên", data.student],
      ["Lớp học", info.lop],
      ["Chương trình", info.prog],
      ["Giáo viên phụ trách", info.gv],
      ["Ngày kiểm tra", info.ngaykt],
      ["Tuần học / Giai đoạn", info.giaidoan],
    ],
    cuoi: [
      ["Họ và tên học viên", data.student],
      ["Lớp học", info.lop],
      ["Chương trình", info.prog],
      ["Giáo viên phụ trách", info.gv],
      ["Ngày kiểm tra cuối khóa", info.ngaykt],
      ["Khóa học tiếp theo", info.capdo],
    ],
  };
  const escapeAndMark = (text) =>
    esc(text || "").replace(/\[[^\]]*\]/g, (match) => `<mark>${match}</mark>`);
  const paragraphs = (text) =>
    String(text || "")
      .split(/\n+/)
      .filter(Boolean)
      .map((line) => `<p>${escapeAndMark(line)}</p>`)
      .join("");
  const pairs = pairsByType[data.type] || pairsByType.thang;
  let infoRows = "";
  for (let index = 0; index < pairs.length; index += 2) {
    const first = pairs[index];
    const second = pairs[index + 1] || ["", ""];
    infoRows += `<tr><th>${esc(first[0])}</th><td>${esc(
      first[1] || ""
    )}</td><th>${esc(second[0])}</th><td>${esc(second[1] || "")}</td></tr>`;
  }

  let html = `<h1>${titles[0]}</h1><div class="sub">${titles[1]}</div><table class="info">${infoRows}</table>`;
  let section = 0;
  const heading = (title) =>
    `<h2><span>${++section}.</span> ${title}</h2>`;

  if (include.skills) {
    html +=
      heading("Kết quả kiểm tra các kỹ năng") +
      `<table class="tb"><tr class="hd"><td style="width:18%">Kỹ năng</td><td style="width:14%;text-align:center">${esc(
        data.scoreLabel || "Điểm"
      )}</td><td>Nhận xét của giáo viên</td></tr>${(data.skills || [])
        .map(
          (skill) =>
            `<tr><td><b>${esc(skill.name)}</b><br><i>${esc(
              skill.en
            )}</i></td><td class="c sc">${esc(
              skill.score || ""
            )}</td><td>${paragraphs(skill.comment)}</td></tr>`
        )
        .join("")}<tr class="tot"><td><b>Tổng điểm</b></td><td class="c red">${
          data.total ? `${esc(data.total)}/100` : ""
        }</td><td><i>Cộng điểm các kỹ năng (thang 100)</i></td></tr></table>`;
  }

  (data.assessments || []).forEach((assessment) => {
    const score = String(assessment.score || "").trim();
    const comment = String(assessment.comment || "").trim();
    if (!score && !comment) return;
    html += heading(esc(assessment.name));
    const rows = [
      '<tr class="hd"><td style="width:25%">Hạng mục</td><td>Nội dung</td></tr>',
    ];
    if (score) {
      rows.push(
        `<tr><td><b>Điểm</b></td><td class="c sc">${esc(score)}</td></tr>`
      );
    }
    if (comment) {
      rows.push(
        `<tr><td><b>Nhận xét</b></td><td>${paragraphs(comment)}</td></tr>`
      );
    }
    html += `<table class="tb assessment-report-table">${rows.join("")}</table>`;
  });

  if (include.att) {
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
      `<table class="tb keep"><tr class="hd"><td>Hạng mục chuyên cần</td><td style="width:17%;text-align:center">Số buổi / lần</td><td style="width:34%">Ghi chú</td></tr>${attendanceRows
        .map(
          ([label, key]) =>
            `<tr><td>${label}</td><td class="c sc">${esc(
              data.att?.[key] ?? ""
            )}</td><td></td></tr>`
        )
        .join("")}</table>`;
  }

  if (include.part) {
    html +=
      heading("Đánh giá mức độ tham gia học tập") +
      `<table class="tb keep"><tr class="hd"><td>Tiêu chí đánh giá</td>${[
        1, 2, 3, 4, 5,
      ]
        .map((value) => `<td class="c" style="width:5%">${value}</td>`)
        .join("")}<td style="width:30%">Ghi chú</td></tr>${PARTICIPATION_CRITERIA.map(
        (criterion, index) =>
          `<tr><td>${criterion}</td>${[1, 2, 3, 4, 5]
            .map(
              (value) =>
                `<td class="c box">${
                  data.part?.[index] === value ? "☒" : "☐"
                }</td>`
            )
            .join("")}<td>${esc(data.partNotes?.[index] || "")}</td></tr>`
      ).join("")}<tr class="tot"><td colspan="7"><i><b>Mức đánh giá:</b> 1 = Chưa đạt · 2 = Cần cải thiện · 3 = Đạt · 4 = Khá · 5 = Xuất sắc</i></td></tr></table>`;
  }

  const text = data.texts || {};
  const textBox = (value, placeholder) =>
    `<div class="tbox">${
      value && value.trim()
        ? paragraphs(value)
        : `<p class="phd">${esc(placeholder)}</p>`
    }</div>`;
  const multiBox = (parts, placeholder) => {
    const values = parts.filter(([, value]) => String(value || "").trim());
    return values.length
      ? `<div class="tbox">${values
          .map(
            ([label, value], index) =>
              `<p class="cap"${index ? "" : ' style="margin-top:0"'}>${esc(
                label
              )}</p>${paragraphs(value)}`
          )
          .join("")}</div>`
      : textBox("", placeholder);
  };

  if (data.type === "thang") {
    html +=
      heading("Ưu điểm trong tháng") +
      textBox(text.uudiem, "Ghi nhận những tiến bộ…") +
      heading("Hạn chế cần khắc phục") +
      textBox(text.hanche, "Nêu rõ những điểm học viên còn yếu…") +
      heading(esc(MESSAGE_TITLE)) +
      textBox(text.loinhan, "Nhắn nhủ riêng của giáo viên…");
  } else {
    html +=
      heading("Ưu điểm nổi bật") +
      textBox(text.uudiem, "Ghi nhận những tiến bộ…") +
      heading("Hạn chế cần cải thiện") +
      textBox(text.hanche, "Nêu cụ thể những điểm yếu…") +
      heading(esc(MESSAGE_TITLE)) +
      multiBox(
        [
          [planTitle(data.type), text.kehoach],
          ["Lời nhắn & nhắc nhở", text.loinhan],
        ],
        "Kế hoạch học tập và lời nhắn riêng của giáo viên…"
      );
  }

  html += `<table class="sign"><tr><td><b>Xác nhận của phụ huynh</b><br><i>(Ký và ghi rõ họ tên)</i></td><td><i>Ngày lập báo cáo: ${esc(
    info.ngaylap || "……/……/………"
  )}</i><br><b>Giáo viên phụ trách</b><br><i>(Ký và ghi rõ họ tên)</i><div class="sgap"></div><b>${esc(
    info.gv || ""
  )}</b></td></tr></table>`;
  return html;
}

export function paginatePreview(html, host, letterheadUrl) {
  const limit = PAGE.height - PAGE.top - PAGE.bottom;
  const measure = document.createElement("div");
  measure.className = "pv-body pv-measure";
  measure.style.width = `${PAGE.width - 2 * PAGE.side}px`;
  measure.innerHTML = html;
  host.appendChild(measure);

  const elementHeight = (element) => {
    const style = getComputedStyle(element);
    return (
      element.getBoundingClientRect().height +
      Number.parseFloat(style.marginTop) +
      Number.parseFloat(style.marginBottom)
    );
  };
  const pages = [[]];
  let used = 0;
  const nextPage = () => {
    pages.push([]);
    used = 0;
  };
  const children = [...measure.children];
  children.forEach((element, index) => {
    const height = elementHeight(element);
    if (element.tagName === "H2" && children[index + 1]) {
      const next = children[index + 1];
      const nextHeight = next.classList.contains("keep")
        ? elementHeight(next)
        : Math.min(elementHeight(next), 120);
      if (used + height + nextHeight > limit && used > 0) nextPage();
    }
    if (used + height <= limit || (used === 0 && height <= limit)) {
      pages[pages.length - 1].push(element);
      used += height;
      return;
    }
    if (
      element.tagName === "TABLE" &&
      element.rows.length > 2 &&
      !element.classList.contains("keep")
    ) {
      const rows = [...element.rows];
      const header = rows[0].classList.contains("hd") ? rows[0] : null;
      const body = header ? rows.slice(1) : rows;
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      let chunk = [];
      let chunkHeight = headerHeight + 4;
      const flush = () => {
        if (!chunk.length) return;
        const table = element.cloneNode(false);
        if (header) table.appendChild(header.cloneNode(true));
        chunk.forEach((row) => table.appendChild(row.cloneNode(true)));
        pages[pages.length - 1].push(table);
        used += chunkHeight;
        chunk = [];
        chunkHeight = headerHeight + 4;
      };
      body.forEach((row) => {
        const rowHeight = row.getBoundingClientRect().height;
        if (used + chunkHeight + rowHeight > limit && (chunk.length || used > 0)) {
          flush();
          nextPage();
        }
        chunk.push(row);
        chunkHeight += rowHeight;
      });
      flush();
      return;
    }
    nextPage();
    pages[pages.length - 1].push(element);
    used += height;
  });

  const nonEmptyPages = pages.filter((page) => page.length);
  const output = nonEmptyPages.map(() => {
    const page = document.createElement("div");
    page.className = "pv-page";
    page.style.backgroundImage = `url("${letterheadUrl}")`;
    const body = document.createElement("div");
    body.className = "pv-body pv-in";
    page.appendChild(body);
    return page;
  });
  nonEmptyPages.forEach((page, index) =>
    page.forEach((element) => output[index].firstChild.appendChild(element))
  );
  measure.remove();
  output.forEach((page, index) => {
    const number = document.createElement("span");
    number.className = "pv-num";
    number.textContent = `Trang ${index + 1}/${output.length}`;
    page.appendChild(number);
    host.appendChild(page);
  });
  return output.length;
}
