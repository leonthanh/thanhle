const fs = require('fs');
const path = require('path');
const {
  getInlineScriptHashesFromHtml,
  getProgressReportCspHashes,
} = require('../utils/progressReportCsp');

const reportTemplatePaths = [
  path.join(__dirname, '..', 'private', 'progress-reports', 'progress-report.html'),
  path.join(__dirname, '..', 'private', 'progress-reports', 'ielts-progress-report.html'),
];

describe('progress report CSP hashes', () => {
  test('hashes inline scripts with browser-normalized line endings and ignores external scripts', () => {
    const html = [
      '<script src="/external.js"></script>',
      '<script>\r\nwindow.runReport();\r\n</script>',
      '<script>\nwindow.runReport();\n</script>',
    ].join('');
    const hashes = getInlineScriptHashesFromHtml(html);

    expect(hashes).toHaveLength(1);
    expect(hashes[0]).toMatch(/^'sha256-[A-Za-z0-9+/]+={0,2}'$/);
  });

  test('includes hashes for inline scripts in both report templates', () => {
    const expectedHashes = new Set();

    for (const templatePath of reportTemplatePaths) {
      const html = fs.readFileSync(templatePath, 'utf8');
      getInlineScriptHashesFromHtml(html).forEach((hash) => expectedHashes.add(hash));
    }

    expect(getProgressReportCspHashes().sort()).toEqual([...expectedHashes].sort());
    expect([...expectedHashes]).not.toContain("'unsafe-inline'");
  });
});
