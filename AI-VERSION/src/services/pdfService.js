const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { generateReportHTML } = require('../templates/reportTemplate');

const REPORTS_DIR = path.join(__dirname, '..', '..', 'reports');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

const HEADER_TEMPLATE = `
  <div style="font-size:8px; width:100%; padding:0 14mm; color:#9ca3af; text-align:right;">
    Sales Report
  </div>`;

const FOOTER_TEMPLATE = `
  <div style="font-size:8px; width:100%; padding:0 14mm; color:#9ca3af; display:flex; justify-content:space-between;">
    <span>Generated automatically</span>
    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
  </div>`;

async function generatePdfReport(reportData) {
  const html = generateReportHTML(reportData);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `sales-report-${timestamp}.pdf`;
  const filepath = path.join(REPORTS_DIR, filename);

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.pdf({
      path: filepath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: HEADER_TEMPLATE,
      footerTemplate: FOOTER_TEMPLATE,
      margin: { top: '20mm', bottom: '16mm', left: '14mm', right: '14mm' },
    });
  } finally {
    await browser.close();
  }

  return { filename, filepath };
}

function listReports() {
  return fs
    .readdirSync(REPORTS_DIR)
    .filter((f) => f.endsWith('.pdf'))
    .map((f) => {
      const stats = fs.statSync(path.join(REPORTS_DIR, f));
      return {
        filename: f,
        sizeBytes: stats.size,
        createdAt: stats.birthtime,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getReportPath(filename) {
  // Prevent path traversal - only allow the exact generated filename pattern
  const safeName = path.basename(filename);
  const filepath = path.join(REPORTS_DIR, safeName);
  if (!filepath.startsWith(REPORTS_DIR)) {
    return null;
  }
  if (!fs.existsSync(filepath)) {
    return null;
  }
  return filepath;
}

module.exports = {
  generatePdfReport,
  listReports,
  getReportPath,
  REPORTS_DIR,
};
