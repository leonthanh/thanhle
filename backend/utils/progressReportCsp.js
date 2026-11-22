const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const REPORT_TEMPLATE_PATHS = [
  path.join(__dirname, '..', 'private', 'progress-reports', 'progress-report.html'),
  path.join(__dirname, '..', 'private', 'progress-reports', 'ielts-progress-report.html'),
];

const getInlineScriptHashesFromHtml = (html) => {
  const hashes = new Set();
  const scriptTags = html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi);

  for (const [, attributes, script] of scriptTags) {
    if (/\bsrc\s*=/i.test(attributes) || !script.trim()) continue;

    const browserNormalizedScript = script.replace(/\r\n?/g, '\n');
    const digest = crypto
      .createHash('sha256')
      .update(browserNormalizedScript, 'utf8')
      .digest('base64');
    hashes.add(`'sha256-${digest}'`);
  }

  return [...hashes];
};

const getProgressReportCspHashes = () => {
  const hashes = new Set();

  for (const templatePath of REPORT_TEMPLATE_PATHS) {
    const html = fs.readFileSync(templatePath, 'utf8');
    for (const hash of getInlineScriptHashesFromHtml(html)) {
      hashes.add(hash);
    }
  }

  return [...hashes];
};

module.exports = { getInlineScriptHashesFromHtml, getProgressReportCspHashes };
