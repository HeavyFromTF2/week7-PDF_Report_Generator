# PDF Report Generator API

A Node.js API that generates multi-page PDF sales reports from an SQLite database using Playwright. It includes an idempotent endpoint to prevent redundant file generation.

## Dataset

**Option A - The little shop**

The database is seeded with exactly 200 random orders (products, customers, amounts, and dates from the last 30 days).

## Setup & Installation

1. **Initialize the project and install dependencies:**

   ```bash
   npm init -y
   npm install express playwright
   npx playwright install chromium
   ```

2. **Seed the database** (creates **`report.db`** and inserts 200 orders):

   ```bash
   node seed.js
   ```

3. **Start the API server:**

   ```bash
   node server.js
   ```

## API Usage

### 1. Generate a Report (Idempotent)

Generates a PDF report for today. If called multiple times on the same day, it returns the existing file link to save resources.

```bash
curl -i -X POST http://localhost:3000/reports
```

To force a new generation, send `{"force": true}` in the JSON body:

```bash
curl -i -X POST http://localhost:3000/reports \
  -H "Content-Type: application/json" \
  -d "{\"force\": true}"
```

### 2. Download the Report

Replace `1` with your report ID:

```bash
curl -o my-report.pdf http://localhost:3000/reports/1/file
```

## SQL Aggregation Queries

The report relies on the following 4 queries to aggregate data.

### 1. Total Orders

```sql
SELECT COUNT(*) as count FROM orders;
```

### 2. Total Revenue

```sql
SELECT ROUND(SUM(amount), 2) as total FROM orders;
```

### 3. Top 5 Products by Revenue

```sql
SELECT product, ROUND(SUM(amount), 2) as revenue
FROM orders
GROUP BY product
ORDER BY revenue DESC
LIMIT 5;
```

### 4. Orders Per Day (Last 7 Days)

```sql
SELECT created_at as date, COUNT(*) as count
FROM orders
GROUP BY created_at
ORDER BY created_at DESC
LIMIT 7;
```

## Reflections

### 1. If generating a PDF takes 10 seconds, why must we move that task to the background?

Launching a headless browser and rendering complex HTML to PDF is CPU and memory intensive. If this takes 10 seconds synchronously within an HTTP request, it blocks the server thread/worker, leads to poor user experience, and risks network timeouts.

Moving the generation to a background task (e.g., using a job queue) allows the API to immediately respond with `202 Accepted` and process the PDF asynchronously without blocking the request.

### 2. What does idempotency prevent in this specific project?

Idempotency prevents the API from redundantly launching Chromium via Playwright and writing duplicate PDF files to disk when multiple requests are sent for the same day's report.

It saves significant CPU, memory, and disk space while keeping response times fast for repeated calls.

## Preview

<img width="1200" height="750" alt="image" src="https://github.com/user-attachments/assets/9c12bb50-1e14-4a21-bfe6-801eedd7e6d3" />





## AI VS me

### Initial Prompt Used
> "I need a API in nodejs with express and sqllite to generate reports using Playwright(pdfs). The seed script must populate the DB with 200 random sales from the last 30 days, and the pdf has to show the total sales, the total gains, the top 5 products and a table wth all 200 sales. I want endpoints to create the pdf and how to download it. Send it zipped and ready to run."

### Code Review & Comparison (`git diff --no-index . ai-version/`)

#### 1. What did the AI do better — and do you understand it?
- **Modular Project Architecture:** The AI structured the project into clear layers (`src/db`, `src/services`, `src/templates`, `src/routes`), separating business logic, queries, and HTTP routing cleanly. I understand this pattern as it improves codebase maintainability and testability.
- **Data Modeling & Metrics:** It implemented a richer relational schema with separate `products` and `sales` tables, calculating additional financial metrics such as `totalGains` (profit margins) and total units sold alongside basic revenue.
- **Developer Experience:** It included extra helpful endpoints like `GET /` (API info) and `GET /api/reports/summary` (JSON preview without invoking Chromium), plus convenient npm scripts (`npm run dev`, `npm run seed`).

#### 2. What did it get wrong or silently ignore?
- **Missing Daily Idempotency Check:** The API does not check if a report was already generated for the current date before running Chromium. It executes a full Playwright generation on every `POST` request, ignoring resource optimization.

#### 3. What did your prompt forget to specify — and what did the AI silently decide for you?
- **Idempotency Rule:** The prompt did not specify the once-per-day idempotency requirement or the `{"force": true}` override flag. The AI silently decided to create a new unique PDF on every `POST /api/reports/generate` call using ISO timestamps (`sales-report-2026-08-17T23-10-47-406Z.pdf`).
- **REST Route Naming:** The prompt didn't specify exact URL patterns, so the AI chose `/api/reports/generate` and `/api/reports/:filename/download` instead of standard RESTful resource paths like `POST /reports` and `GET /reports/:id/file`.
- **SQLite Engine:** The prompt only mentioned "sqllite", so the AI silently decided to use Node's native `node:sqlite` module to avoid native compilation issues on Windows.

---

### Rematch
- **Improved Prompt:** Added this to the prompt: *"Add an idempotency check on POST /reports: query the database first to see if a report was already generated today. If so, return 200 OK with the existing PDF link and set "reused": true. Only render a new PDF if no report exists for today or if the request body contains {"force": true}."*
- **What Changed:** The regenerated AI version added an existence check in the database before rendering via Playwright, returning `200 OK` with the existing PDF link when invoked multiple times on the same date unless forced.



## AI Usage

I've used AI in this project to:

- Generate the initial project structure.
- Write SQL queries for data aggregation (totals, top products, orders per day).
- Set up the project to create reports with readable names.
- Implement the Express API endpoints with idempotency logic.
- Assist with debugging, code formatting, and project documentation.
- Making this README.
