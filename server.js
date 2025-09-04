import express from "express";
import pkg from "pg";
import cors from "cors";

const { Pool } = pkg;
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Cấu hình DB
const pool = new Pool({
  host: "raitek.cloud",
  port: 5432,
  user: "mtryha11",
  password: "Hpx21led",
  database: "IOTdev",
  ssl: false
});

// ✅ Route test
app.get("/", (req, res) => {
  res.send("Backend API is running...");
});


// ====================== ACCOUNT ======================

// Lấy danh sách account
app.get("/api/accounts", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "Project".account LIMIT 20`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

// Lấy account theo "account"
app.get("/api/accounts/:account", async (req, res) => {
  const { account } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM "Project".account WHERE account = $1`,
      [account]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});


// ====================== PROJECT ======================

// Lấy danh sách project
app.get("/api/projects", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "Project".project LIMIT 100`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

// Lấy project theo "idproject"
app.get("/api/projects/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM "Project".project WHERE idproject = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});


// ====================== TASK ======================

// Lấy danh sách task
app.get("/api/tasks", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "Project".task LIMIT 40`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

// Lấy task theo "id_work"
app.get("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM "Project".task WHERE id_work = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});


// ====================== TYPEOFWORKS ======================

// Lấy danh sách typeofWorks
app.get("/api/typeofworks", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "Project"."typeofWorks" LIMIT 20`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

// Lấy typeofWork theo "id_process"
app.get("/api/typeofworks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM "Project"."typeofWorks" WHERE id_process = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "TypeofWork not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});


// ====================== START SERVER ======================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ API chạy tại http://localhost:${PORT}`);
});
