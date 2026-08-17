const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('report.db');

// Drop the table if it exists so running the script multiple times keeps the data clean
db.exec(`DROP TABLE IF EXISTS orders;`);

// Create the orders table
db.exec(`
  CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer TEXT NOT NULL,
    product TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT NOT NULL
  );
`);

const products = [
  'Mechanical Keyboard',
  'Wireless Mouse',
  '4K Monitor',
  'Bluetooth Headphones',
  'Gaming Chair',
  'XL Mousepad'
];

const customers = ['Jonh', 'Carl', 'Alfred', 'Diogo', 'Jonhson', 'Marta', 'Dennis', 'Daniel'];

// Prepare insert statement
const insertStmt = db.prepare(`
  INSERT INTO orders (customer, product, amount, created_at)
  VALUES (?, ?, ?, ?);
`);

const now = new Date();

// Generate exactly 200 random mock orders
for (let i = 0; i < 200; i++) {
  const customer = customers[Math.floor(Math.random() * customers.length)];
  const product = products[Math.floor(Math.random() * products.length)];
  
  // Random amount between 5.00 and 200.00
  const amount = parseFloat((Math.random() * (200 - 5) + 5).toFixed(2));
  
  // Random date within the last 30 days
  const daysAgo = Math.floor(Math.random() * 30);
  const orderDate = new Date(now);
  orderDate.setDate(now.getDate() - daysAgo);
  const createdAt = orderDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

  insertStmt.run(customer, product, amount, createdAt);
}

console.log('Database report.db created and seeded successfully!');