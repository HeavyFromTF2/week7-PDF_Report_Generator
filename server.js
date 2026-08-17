const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const { renderPdf } = require('./generatePdf');

const app = express();
const PORT = 3000;
const db = new DatabaseSync('report.db');

app.use(express.json());

// Auto-create the reports history table if it does not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

// Healthcheck endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// POST /reports - Generates PDF with idempotency check
app.post('/reports', async (req, res) => {
  const force = req.body && req.body.force === true;
  const todayDateStr = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  // Check if a report was already generated today
  if (!force) {
    const existingReport = db.prepare(`
      SELECT * FROM reports 
      WHERE created_at LIKE ? 
      ORDER BY id DESC LIMIT 1
    `).get(`${todayDateStr}%`);

    if (existingReport) {
      // Return existing report if already created today
      return res.status(200).json({
        id: existingReport.id,
        file: `/reports/${existingReport.id}/file`,
        reused: true
      });
    }
  }

  // If no report exists for today (or force === true), generate a new one
  const now = new Date();
  const timeStr = now.toISOString().replace(/T/, '-').replace(/:/g, '').split('.')[0];
  const filePath = `reports/report-${timeStr}.pdf`;

  await renderPdf(filePath);

  const createdAt = now.toISOString();
  const stmt = db.prepare('INSERT INTO reports (path, created_at) VALUES (?, ?)');
  const result = stmt.run(filePath, createdAt);
  const newId = result.lastInsertRowid;

  res.status(201).json({
    id: newId,
    file: `/reports/${newId}/file`,
    reused: false
  });
});

// GET /reports/:id - Fetch report metadata by ID
app.get('/reports/:id', (req, res) => {
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  res.json({
    id: report.id,
    created_at: report.created_at,
    file: `/reports/${report.id}/file`
  });
});

// GET /reports/:id/file - Serve the physical PDF file from disk
app.get('/reports/:id/file', (req, res) => {
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const absolutePath = path.resolve(report.path);

  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ error: 'File missing on disk' });
  }

  res.sendFile(absolutePath);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});