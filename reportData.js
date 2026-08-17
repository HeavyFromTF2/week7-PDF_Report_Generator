const { DatabaseSync } = require('node:sqlite');

function getReportData() {
  const db = new DatabaseSync('report.db');

  // 1. Total Orders
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;

  // 2. Total Revenue
  const totalRevenue = db.prepare('SELECT ROUND(SUM(amount), 2) as total FROM orders').get().total;

  // 3. Top 5 Products by Revenue
  const topProducts = db.prepare(`
    SELECT product, ROUND(SUM(amount), 2) as revenue
    FROM orders
    GROUP BY product
    ORDER BY revenue DESC
    LIMIT 5
  `).all();

  // 4. Orders Per Day (Last 7 Days)
  const ordersPerDay = db.prepare(`
    SELECT created_at as date, COUNT(*) as count
    FROM orders
    GROUP BY created_at
    ORDER BY created_at DESC
    LIMIT 7
  `).all();

  return {
    totalOrders,
    totalRevenue,
    topProducts,
    ordersPerDay
  };
}

module.exports = { getReportData };