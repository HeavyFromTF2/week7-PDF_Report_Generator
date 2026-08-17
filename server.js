const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// Endpoint de verificação de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK!!' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});