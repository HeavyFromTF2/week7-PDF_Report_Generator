const { chromium } = require('playwright');
const { DatabaseSync } = require('node:sqlite');
const { getReportData } = require('./reportData');
const fs = require('node:fs');

// Fetch all orders from the database for the long detail table
function getAllOrders() {
  const db = new DatabaseSync('report.db');
  return db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
}

async function renderPdf(outputPath = 'reports/test.pdf') {
  // Ensure the output directory exists
  if (!fs.existsSync('reports')) fs.mkdirSync('reports');

  const data = getReportData();
  const orders = getAllOrders();

  // HTML template with print CSS rules for clean page breaks
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
        
        /* Prevents table rows from breaking across pages */
        tr { break-inside: avoid; }
        
        /* Repeats table header on every new page */
        thead { display: table-header-group; }
      </style>
    </head>
    <body>
      <h1>Sales Report</h1>
      <p>Total Orders: ${data.totalOrders} | Revenue: $${data.totalRevenue}</p>

      <h2>Top Products</h2>
      <table>
        <thead><tr><th>Product</th><th>Revenue</th></tr></thead>
        <tbody>
          ${data.topProducts.map(p => `<tr><td>${p.product}</td><td>$${p.revenue}</td></tr>`).join('')}
        </tbody>
      </table>

      <h2>All Orders (${orders.length})</h2>
      <table>
        <thead><tr><th>ID</th><th>Customer</th><th>Product</th><th>Amount</th><th>Date</th></tr></thead>
        <tbody>
          ${orders.map(o => `<tr><td>${o.id}</td><td>${o.customer}</td><td>${o.product}</td><td>$${o.amount}</td><td>${o.created_at}</td></tr>`).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Launch headless browser, render HTML content, and print to PDF
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
  await browser.close();

  console.log(`PDF created: ${outputPath}`);
}

if (require.main === module) renderPdf();

module.exports = { renderPdf };