import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  user: process.env.PGUSER || "hkuser",
  host: process.env.PGHOST || "db",
  database: process.env.PGDATABASE || "hkdemo",
  password: process.env.PGPASSWORD || "hkpass123",
  port: Number(process.env.PGPORT) || 5432,
});

app.get("/api/health", async (_req, res) => {
  try {
    const r = await pool.query("SELECT 1 AS ok");
    res.json({ ok: r.rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(port, () => console.log(`Backend listening on :${port}`));
