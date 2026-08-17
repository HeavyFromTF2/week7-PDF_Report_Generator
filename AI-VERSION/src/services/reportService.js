const db = require('../db/database');

function getSummary() {
  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(quantity * unit_price), 0) AS totalSales,
         COALESCE(SUM(quantity * (unit_price - unit_cost)), 0) AS totalGains,
         COALESCE(SUM(quantity), 0) AS totalUnits,
         COUNT(*) AS totalOrders
       FROM sales`
    )
    .get();

  return row;
}

function getTopProducts(limit = 5) {
  return db
    .prepare(
      `SELECT
         p.name AS name,
         p.category AS category,
         SUM(s.quantity) AS unitsSold,
         SUM(s.quantity * s.unit_price) AS revenue,
         SUM(s.quantity * (s.unit_price - s.unit_cost)) AS gain
       FROM sales s
       JOIN products p ON p.id = s.product_id
       GROUP BY p.id
       ORDER BY revenue DESC
       LIMIT ?`
    )
    .all(limit);
}

function getAllSales() {
  return db
    .prepare(
      `SELECT
         s.id AS id,
         p.name AS productName,
         p.category AS category,
         s.quantity AS quantity,
         s.unit_price AS unitPrice,
         s.unit_cost AS unitCost,
         (s.quantity * s.unit_price) AS total,
         (s.quantity * (s.unit_price - s.unit_cost)) AS gain,
         s.sale_date AS saleDate
       FROM sales s
       JOIN products p ON p.id = s.product_id
       ORDER BY s.sale_date DESC`
    )
    .all();
}

function getReportData() {
  return {
    generatedAt: new Date().toISOString(),
    summary: getSummary(),
    topProducts: getTopProducts(5),
    sales: getAllSales(),
  };
}

module.exports = {
  getSummary,
  getTopProducts,
  getAllSales,
  getReportData,
};
