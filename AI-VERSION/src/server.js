const express = require('express');
const reportsRouter = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'Sales Report API',
    endpoints: {
      'GET /api/reports/summary': 'Preview report data as JSON (no PDF)',
      'POST /api/reports/generate': 'Generate a new PDF report',
      'GET /api/reports': 'List all generated PDF reports',
      'GET /api/reports/:filename/download': 'Download a generated PDF report',
    },
  });
});

app.use('/api/reports', reportsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Sales Report API running on http://localhost:${PORT}`);
});
