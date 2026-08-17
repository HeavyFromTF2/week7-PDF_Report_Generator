# Sales Report API

Node.js + Express + SQLite API that generates PDF sales reports using **Playwright** (HTML → PDF rendering).

## Stack

- **Express** — HTTP API
- **node:sqlite** (built into Node.js, no install/compile step) — embedded SQLite database (file-based, no server needed)
- **Playwright (Chromium)** — renders an HTML report to PDF

> Requires **Node.js 22.13+** (or 23.4+). This project uses Node's built-in `node:sqlite` module instead of `better-sqlite3` specifically to avoid native-compilation issues (Visual Studio Build Tools on Windows, `node-gyp` failures, etc.). You'll see a one-line `ExperimentalWarning: SQLite is an experimental feature` in the console — that's expected and harmless; the API is a Release Candidate as of Node 24.

## What it does

- Stores `products` and `sales` in a local SQLite file (`data/sales.db`).
- A seed script populates the DB with ~15 products and **200 random sales** spread across the **last 30 days**.
- `POST /api/reports/generate` builds a report (total sales, total gains, top 5 products, full table of all sales) and renders it to a PDF with Playwright, saved in `reports/`.
- Download endpoints let you fetch any previously generated PDF.

## 1. Install

```bash
npm install
```

## 2. Install the Playwright browser (required, one-time)

Playwright needs its own Chromium binary — this is **not** installed by `npm install` alone:

```bash
npm run playwright:install
```

> If this machine has no internet access or you're on a restricted CI runner, see the "Troubleshooting" section below.

## 3. Seed the database

Creates `data/sales.db`, wipes any existing data, inserts 15 products, and generates 200 random sales dated within the last 30 days:

```bash
npm run seed
```

You can re-run this any time to reset/regenerate the data.

## 4. Run the API

```bash
npm start
```

The API listens on `http://localhost:3000` (override with `PORT=xxxx npm start`).

For auto-restart during development:

```bash
npm run dev
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | API info / list of endpoints |
| GET | `/api/reports/summary` | JSON preview of the report data (totals, top 5, all sales) without generating a PDF |
| POST | `/api/reports/generate` | Generates a new PDF report and saves it to `reports/` |
| GET | `/api/reports` | Lists all previously generated PDF reports |
| GET | `/api/reports/:filename/download` | Downloads a specific PDF report |

### Generate a report

```bash
curl -X POST http://localhost:3000/api/reports/generate
```

Response:

```json
{
  "message": "Report generated successfully",
  "filename": "sales-report-2026-08-17T12-34-56-789Z.pdf",
  "downloadUrl": "/api/reports/sales-report-2026-08-17T12-34-56-789Z.pdf/download"
}
```

### Download it

```bash
curl -OJ http://localhost:3000/api/reports/sales-report-2026-08-17T12-34-56-789Z.pdf/download
```

Or just open the `downloadUrl` returned above directly in a browser — it will trigger a file download.

### List generated reports

```bash
curl http://localhost:3000/api/reports
```

### Preview the raw data (no PDF)

```bash
curl http://localhost:3000/api/reports/summary
```

## Report contents

The generated PDF includes:

1. **Header** — generation timestamp and reporting period.
2. **Summary cards** — Total Sales (revenue), Total Gains (profit = revenue − cost), Total Orders, Units Sold.
3. **Top 5 Products** — ranked by revenue, with units sold, revenue, and gain per product.
4. **Full sales table** — all 200 sales rows (product, category, quantity, unit price, total, gain, date), with a repeating header row and automatic pagination across PDF pages.

## Project structure

```
sales-report-api/
├── package.json
├── data/                      # SQLite DB file lives here (generated)
├── reports/                   # Generated PDF reports (generated)
└── src/
    ├── server.js              # Express app entry point
    ├── db/
    │   ├── database.js        # SQLite connection + schema
    │   └── seed.js            # Seed script (200 random sales)
    ├── services/
    │   ├── reportService.js   # SQL queries / aggregations
    │   └── pdfService.js      # Playwright HTML -> PDF rendering
    ├── templates/
    │   └── reportTemplate.js  # HTML/CSS template for the report
    └── routes/
        └── reports.js         # /api/reports endpoints
```

## Data model

**products**: `id, name, category, price, cost`

**sales**: `id, product_id, quantity, unit_price, unit_cost, sale_date`

- `total` per sale = `quantity * unit_price`
- `gain` per sale = `quantity * (unit_price - unit_cost)`

## Troubleshooting

**`npm install` fails trying to compile a native module / asks for Visual Studio Build Tools**
That means you're on an older Node.js version and something in your lockfile pulled in a native SQLite driver. Make sure you're on **Node 22.13+** and reinstall (`rm -rf node_modules package-lock.json && npm install`) — this project intentionally uses the built-in `node:sqlite` module, which needs zero compilation.

**"Executable doesn't exist" / browser not found error when generating a PDF**
Run `npm run playwright:install` (or `npx playwright install chromium`). This downloads the Chromium binary Playwright needs; it's separate from the npm package install.

**Running as root / in Docker and Chromium fails to launch**
The launch args already include `--no-sandbox --disable-setuid-sandbox` for containerized environments. If you still hit issues, install the OS-level dependencies with `npx playwright install-deps chromium`.

**No sales data / empty report**
Run `npm run seed` before calling `POST /api/reports/generate`.

**Reset everything**
Delete `data/sales.db*` and `reports/*.pdf`, then re-run `npm run seed`.
