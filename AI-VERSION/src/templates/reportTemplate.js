function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value || 0);
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function formatDateTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildTopProductsRows(topProducts) {
  return topProducts
    .map(
      (p, idx) => `
      <tr>
        <td class="rank">#${idx + 1}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.category)}</td>
        <td class="num">${p.unitsSold}</td>
        <td class="num">${formatCurrency(p.revenue)}</td>
        <td class="num gain">${formatCurrency(p.gain)}</td>
      </tr>`
    )
    .join('');
}

function buildSalesRows(sales) {
  return sales
    .map(
      (s) => `
      <tr>
        <td>${s.id}</td>
        <td>${escapeHtml(s.productName)}</td>
        <td>${escapeHtml(s.category)}</td>
        <td class="num">${s.quantity}</td>
        <td class="num">${formatCurrency(s.unitPrice)}</td>
        <td class="num">${formatCurrency(s.total)}</td>
        <td class="num gain">${formatCurrency(s.gain)}</td>
        <td>${formatDate(s.saleDate)}</td>
      </tr>`
    )
    .join('');
}

function generateReportHTML(data) {
  const { generatedAt, summary, topProducts, sales } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Sales Report</title>
<style>
  @page {
    size: A4;
    margin: 18mm 14mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #1f2937;
    margin: 0;
    font-size: 11px;
  }
  h1 {
    font-size: 22px;
    margin: 0 0 4px 0;
    color: #111827;
  }
  .subtitle {
    color: #6b7280;
    font-size: 11px;
    margin-bottom: 20px;
  }
  .summary-grid {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
  }
  .summary-card {
    flex: 1;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px 14px;
  }
  .summary-card .label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #6b7280;
    margin-bottom: 6px;
  }
  .summary-card .value {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
  }
  .summary-card.gains .value { color: #059669; }
  .summary-card.sales .value { color: #2563eb; }

  h2 {
    font-size: 14px;
    margin: 22px 0 10px 0;
    color: #111827;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 6px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
  }
  thead {
    display: table-header-group;
  }
  tr {
    page-break-inside: avoid;
  }
  th {
    text-align: left;
    background: #111827;
    color: #ffffff;
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 7px 8px;
  }
  td {
    padding: 5px 8px;
    border-bottom: 1px solid #eef0f2;
    font-size: 10px;
  }
  tbody tr:nth-child(even) { background: #fafbfc; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.gain { color: #059669; font-weight: 600; }
  td.rank { font-weight: 700; color: #6b7280; }

  .top-products-table th:nth-child(1) { width: 8%; }
  .sales-table th:nth-child(1) { width: 6%; }

  .footer-note {
    margin-top: 6px;
    font-size: 9px;
    color: #9ca3af;
  }
</style>
</head>
<body>
  <h1>Sales Report</h1>
  <div class="subtitle">Generated on ${formatDateTime(generatedAt)} &middot; Period: last 30 days</div>

  <div class="summary-grid">
    <div class="summary-card sales">
      <div class="label">Total Sales</div>
      <div class="value">${formatCurrency(summary.totalSales)}</div>
    </div>
    <div class="summary-card gains">
      <div class="label">Total Gains</div>
      <div class="value">${formatCurrency(summary.totalGains)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Total Orders</div>
      <div class="value">${summary.totalOrders}</div>
    </div>
    <div class="summary-card">
      <div class="label">Units Sold</div>
      <div class="value">${summary.totalUnits}</div>
    </div>
  </div>

  <h2>Top 5 Products</h2>
  <table class="top-products-table">
    <thead>
      <tr>
        <th>Rank</th>
        <th>Product</th>
        <th>Category</th>
        <th>Units Sold</th>
        <th>Revenue</th>
        <th>Gain</th>
      </tr>
    </thead>
    <tbody>
      ${buildTopProductsRows(topProducts)}
    </tbody>
  </table>

  <h2>All Sales (${sales.length})</h2>
  <table class="sales-table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Product</th>
        <th>Category</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Total</th>
        <th>Gain</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${buildSalesRows(sales)}
    </tbody>
  </table>
  <div class="footer-note">End of report.</div>
</body>
</html>`;
}

module.exports = { generateReportHTML };
