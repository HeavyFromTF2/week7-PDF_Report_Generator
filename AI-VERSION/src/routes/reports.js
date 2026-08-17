const express = require('express');
const router = express.Router();

const reportService = require('../services/reportService');
const pdfService = require('../services/pdfService');

// POST /api/reports/generate -> builds report data, renders PDF with Playwright, saves to disk
router.post('/generate', async (req, res) => {
  try {
    const reportData = reportService.getReportData();

    if (reportData.sales.length === 0) {
      return res.status(400).json({
        error: 'No sales data found. Run "npm run seed" first.',
      });
    }

    const { filename } = await pdfService.generatePdfReport(reportData);

    return res.status(201).json({
      message: 'Report generated successfully',
      filename,
      downloadUrl: `/api/reports/${filename}/download`,
    });
  } catch (err) {
    console.error('Error generating report:', err);
    return res.status(500).json({ error: 'Failed to generate report', details: err.message });
  }
});

// GET /api/reports -> list all previously generated PDF reports
router.get('/', (req, res) => {
  try {
    const reports = pdfService.listReports().map((r) => ({
      ...r,
      downloadUrl: `/api/reports/${r.filename}/download`,
    }));
    return res.json({ count: reports.length, reports });
  } catch (err) {
    console.error('Error listing reports:', err);
    return res.status(500).json({ error: 'Failed to list reports' });
  }
});

// GET /api/reports/summary -> quick JSON preview of the data that would go into the PDF
router.get('/summary', (req, res) => {
  try {
    const data = reportService.getReportData();
    return res.json(data);
  } catch (err) {
    console.error('Error building summary:', err);
    return res.status(500).json({ error: 'Failed to build summary' });
  }
});

// GET /api/reports/:filename/download -> download a specific generated PDF
router.get('/:filename/download', (req, res) => {
  const { filename } = req.params;
  const filepath = pdfService.getReportPath(filename);

  if (!filepath) {
    return res.status(404).json({ error: 'Report not found' });
  }

  return res.download(filepath, filename, (err) => {
    if (err) {
      console.error('Error downloading report:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download report' });
      }
    }
  });
});

module.exports = router;
