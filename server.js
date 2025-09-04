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
  ssl: false,
});

// ✅ Route test
app.get("/", (req, res) => {
  res.send("Backend API is running...");
});

/* ---------------------- ACCOUNT ---------------------- */
app.get("/api/accounts", async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "Project".account LIMIT 20`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

app.get("/api/accounts/:account", async (req, res) => {
  const { account } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM "Project".account WHERE account = $1`,
      [account]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Account not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

/* ---------------------- PROJECT ---------------------- */
app.get("/api/projects", async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "Project".project LIMIT 100`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

app.get("/api/projects/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM "Project".project WHERE idproject = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Project not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

/* ---------------------- TASK ---------------------- */
app.get("/api/tasks", async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "Project".task LIMIT 40`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

app.get("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM "Project".task WHERE id_work = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Task not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

/* ---------------------- TYPEOFWORKS ---------------------- */
app.get("/api/typeofworks", async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "Project"."typeofWorks" LIMIT 20`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

app.get("/api/typeofworks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM "Project"."typeofWorks" WHERE id_process = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "TypeofWork not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

/* ====================== ASSIGN (mới) ====================== */
// Cột trong ảnh: id_assign (PK), id_code, idproject, id_process, id_work,
// time_in, time_out, project_status, work_status, report_status, daily_status.

// List (optional)
app.get("/api/assigns", async (_req, res) => {
  try {
    const q = `SELECT * FROM "Project"."Assign" ORDER BY id_assign DESC LIMIT 100`;
    const result = await pool.query(q);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/assigns error:", err);
    res.status(500).send("DB error");
  }
});

// Lấy 1 bản ghi theo id_assign (optional)
// ✅ Trả danh sách assigns theo id_code (array)
app.get("/api/assigns/:id_code", async (req, res) => {
  try {
    const idCode = parseInt(req.params.id_code, 10);
    if (Number.isNaN(idCode)) return res.json([]);

    const q = `
      SELECT *
      FROM "Project"."Assign"
      WHERE id_code = $1
      ORDER BY id_assign DESC
      LIMIT 200
    `;
    const result = await pool.query(q, [idCode]);
    console.log(`[GET /api/assigns/${idCode}] rows=`, result.rowCount);
    res.json(result.rows); // <-- TRẢ VỀ MẢNG
  } catch (err) {
    console.error("GET /api/assigns/:id_code error:", err);
    res.status(500).send("DB error");
  }
});


// ➕ INSERT từ app (quan trọng)
app.post("/api/assigns", async (req, res) => {
  try {
    const {
      id_code,
      idproject,
      id_process,
      id_work,
      time_in,
      time_out,
      project_status,
      work_status,
      report_status,
      daily_status,
    } = req.body || {};

    // Yêu cầu tối thiểu
    const mustNumbers = { id_code, idproject, id_process, id_work };
    for (const [k, v] of Object.entries(mustNumbers)) {
      if (v === undefined || v === null || Number.isNaN(Number(v))) {
        return res.status(400).json({ error: `Missing/invalid number field: ${k}` });
      }
    }

    const values = [
      Number(id_code),
      Number(idproject),
      Number(id_process),
      Number(id_work),
      time_in ?? null,
      time_out ?? null,
      project_status ?? null,
      work_status ?? null,
      report_status ?? null,
      daily_status ?? null,
    ];

    const sql = `
      INSERT INTO "Project"."Assign"
      (id_code, idproject, id_process, id_work,
       time_in, time_out, project_status, work_status, report_status, daily_status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *;
    `;

    const result = await pool.query(sql, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/assigns error:", err);
    res.status(500).send("DB error");
  }
});

/* ---------------------- START SERVER ---------------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ API chạy tại http://localhost:${PORT}`);
});


