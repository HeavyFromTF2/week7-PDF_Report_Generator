const { getReportData } = require('./reportData');

const reportData = getReportData();
console.log(JSON.stringify(reportData, null, 2));