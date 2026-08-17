const db = require('./database');

const PRODUCTS = [
  { name: 'Wireless Mouse', category: 'Electronics', price: 25.99, cost: 12.5 },
  { name: 'Mechanical Keyboard', category: 'Electronics', price: 79.99, cost: 38.0 },
  { name: 'USB-C Hub', category: 'Electronics', price: 34.5, cost: 15.75 },
  { name: '27" 4K Monitor', category: 'Electronics', price: 349.99, cost: 210.0 },
  { name: 'HD Webcam', category: 'Electronics', price: 49.99, cost: 22.0 },
  { name: 'Noise Cancelling Headphones', category: 'Electronics', price: 129.99, cost: 65.0 },
  { name: 'Ergonomic Office Chair', category: 'Furniture', price: 219.0, cost: 110.0 },
  { name: 'Standing Desk', category: 'Furniture', price: 399.0, cost: 220.0 },
  { name: 'Desk Lamp LED', category: 'Furniture', price: 29.99, cost: 11.0 },
  { name: 'Bookshelf 5-Tier', category: 'Furniture', price: 89.99, cost: 45.0 },
  { name: 'Stainless Water Bottle', category: 'Lifestyle', price: 19.99, cost: 6.5 },
  { name: 'Yoga Mat Premium', category: 'Lifestyle', price: 39.99, cost: 15.0 },
  { name: 'Backpack Travel Pro', category: 'Lifestyle', price: 69.99, cost: 30.0 },
  { name: 'Bluetooth Speaker', category: 'Electronics', price: 59.99, cost: 26.0 },
  { name: 'Smartwatch Fit 2', category: 'Electronics', price: 149.0, cost: 78.0 },
];

const NUM_SALES = 200;
const DAYS_RANGE = 30;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateWithinLastDays(days) {
  const now = Date.now();
  const past = now - days * 24 * 60 * 60 * 1000;
  const randomTime = past + Math.random() * (now - past);
  return new Date(randomTime).toISOString();
}

function seed() {
  console.log('Seeding database...');

  const clearSales = db.prepare('DELETE FROM sales');
  const clearProducts = db.prepare('DELETE FROM products');
  const resetSeq = db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('sales','products')");

  const insertProduct = db.prepare(
    'INSERT INTO products (name, category, price, cost) VALUES (?, ?, ?, ?)'
  );
  const insertSale = db.prepare(
    'INSERT INTO sales (product_id, quantity, unit_price, unit_cost, sale_date) VALUES (?, ?, ?, ?, ?)'
  );

  const runSeed = db.transaction(() => {
    clearSales.run();
    clearProducts.run();
    resetSeq.run();

    const productIds = PRODUCTS.map((p) => {
      const info = insertProduct.run(p.name, p.category, p.price, p.cost);
      return { id: info.lastInsertRowid, ...p };
    });

    for (let i = 0; i < NUM_SALES; i++) {
      const product = productIds[randomInt(0, productIds.length - 1)];
      const quantity = randomInt(1, 10);
      // Small random price variance to simulate discounts/promotions (+/- 10%)
      const variance = 1 + (Math.random() * 0.2 - 0.1);
      const unitPrice = Math.round(product.price * variance * 100) / 100;
      const saleDate = randomDateWithinLastDays(DAYS_RANGE);

      insertSale.run(product.id, quantity, unitPrice, product.cost, saleDate);
    }
  });

  runSeed();

  const productCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  const salesCount = db.prepare('SELECT COUNT(*) AS c FROM sales').get().c;

  console.log(`Done. Products: ${productCount}, Sales: ${salesCount}`);
}

seed();
