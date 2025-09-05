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

app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    ts: new Date().toISOString()
  });
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
/* ---------- ASSIGN: lấy theo từng cột ID (đủ tất cả cột) ---------- */

// 1) Lấy 1 bản ghi theo id_assign (đã có, ghi lại cho đầy đủ)
app.get("/api/assign/:id_assign", async (req, res) => {
  try {
    const idAssign = parseInt(req.params.id_assign, 10);
    if (Number.isNaN(idAssign)) return res.status(400).json({ error: "Invalid id_assign" });

    const q = `SELECT * FROM "Project"."Assign" WHERE id_assign = $1`;
    const result = await pool.query(q, [idAssign]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Assign not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /api/assign/:id_assign error:", err);
    res.status(500).send("DB error");
  }
});

// 2) Lấy DANH SÁCH theo id_code (array)
app.get("/api/assign/by-code/:id_code", async (req, res) => {
  try {
    const idCode = parseInt(req.params.id_code, 10);
    if (Number.isNaN(idCode)) return res.status(400).json({ error: "Invalid id_code" });

    const q = `
      SELECT * FROM "Project"."Assign"
      WHERE id_code = $1
      ORDER BY id_assign DESC
      LIMIT 200
    `;
    const result = await pool.query(q, [idCode]);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/assign/by-code/:id_code error:", err);
    res.status(500).send("DB error");
  }
});

// 3) Lấy DANH SÁCH theo idproject (array)
app.get("/api/assign/by-project/:idproject", async (req, res) => {
  try {
    const idProject = parseInt(req.params.idproject, 10);
    if (Number.isNaN(idProject)) return res.status(400).json({ error: "Invalid idproject" });

    const q = `
      SELECT * FROM "Project"."Assign"
      WHERE idproject = $1
      ORDER BY id_assign DESC
      LIMIT 200
    `;
    const result = await pool.query(q, [idProject]);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/assign/by-project/:idproject error:", err);
    res.status(500).send("DB error");
  }
});

// 4) Lấy DANH SÁCH theo id_process (array)
app.get("/api/assign/by-process/:id_process", async (req, res) => {
  try {
    const idProcess = parseInt(req.params.id_process, 10);
    if (Number.isNaN(idProcess)) return res.status(400).json({ error: "Invalid id_process" });

    const q = `
      SELECT * FROM "Project"."Assign"
      WHERE id_process = $1
      ORDER BY id_assign DESC
      LIMIT 200
    `;
    const result = await pool.query(q, [idProcess]);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/assign/by-process/:id_process error:", err);
    res.status(500).send("DB error");
  }
});

// 5) Lấy DANH SÁCH theo id_work (array)
app.get("/api/assign/by-work/:id_work", async (req, res) => {
  try {
    const idWork = parseInt(req.params.id_work, 10);
    if (Number.isNaN(idWork)) return res.status(400).json({ error: "Invalid id_work" });

    const q = `
      SELECT * FROM "Project"."Assign"
      WHERE id_work = $1
      ORDER BY id_assign DESC
      LIMIT 200
    `;
    const result = await pool.query(q, [idWork]);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/assign/by-work/:id_work error:", err);
    res.status(500).send("DB error");
  }
});

// ==================== ASSIGN: lọc theo khoảng thời gian ====================
// Query: ?from=YYYY-MM-DD HH:MM:SS&to=YYYY-MM-DD HH:MM:SS&limit=500
// - Có thể truyền chỉ from hoặc chỉ to.
// - Nếu cột time_in/time_out là TEXT, ta cast: NULLIF(col,'')::timestamp
// - Nếu là TIMESTAMP thật, xem ghi chú bên dưới để rút gọn điều kiện.

app.get("/api/assign/by-time-in", async (req, res) => {
  try {
    const { from, to } = req.query;
    const lim = Math.min(parseInt(req.query.limit, 10) || 500, 2000);

    const conds = [];
    const params = [];

    if (from) { params.push(from); conds.push(`NULLIF(time_in,'')::timestamp >= $${params.length}::timestamp`); }
    if (to)   { params.push(to);   conds.push(`NULLIF(time_in,'')::timestamp <= $${params.length}::timestamp`); }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const q = `SELECT * FROM "Project"."Assign" ${where} ORDER BY id_assign DESC LIMIT ${lim}`;
    const result = await pool.query(q, params);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/assign/by-time-in error:", err);
    res.status(500).send("DB error");
  }
});

app.get("/api/assign/by-time-out", async (req, res) => {
  try {
    const { from, to } = req.query;
    const lim = Math.min(parseInt(req.query.limit, 10) || 500, 2000);

    const conds = [];
    const params = [];

    if (from) { params.push(from); conds.push(`NULLIF(time_out,'')::timestamp >= $${params.length}::timestamp`); }
    if (to)   { params.push(to);   conds.push(`NULLIF(time_out,'')::timestamp <= $${params.length}::timestamp`); }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const q = `SELECT * FROM "Project"."Assign" ${where} ORDER BY id_assign DESC LIMIT ${lim}`;
    const result = await pool.query(q, params);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/assign/by-time-out error:", err);
    res.status(500).send("DB error");
  }
});

/* ---------- ASSIGN: lọc theo STATUS (project | work | report | daily) ---------- */

// helper nhỏ để dùng lại
function buildStatusQuery(col) {
  return async (req, res) => {
    try {
      const statusParam = String(req.params.status || "").trim();
      const valuesParam = req.query.values
        ? String(req.query.values)
            .split(",")
            .map(s => s.trim().toLowerCase())
            .filter(Boolean)
        : null;

      const limit = Math.min(parseInt(req.query.limit, 10) || 500, 2000);

      let q, params;
      if (valuesParam && valuesParam.length) {
        // so khớp theo danh sách đồng nghĩa (chính xác, không wildcard)
        q = `SELECT * FROM "Project"."Assign"
             WHERE LOWER(${col}) = ANY($1)
             ORDER BY id_assign DESC
             LIMIT $2`;
        params = [valuesParam, limit];
      } else {
        // so khớp 1 giá trị (ILIKE cho phép không phân biệt hoa thường, có thể truyền %)
        q = `SELECT * FROM "Project"."Assign"
             WHERE ${col} ILIKE $1
             ORDER BY id_assign DESC
             LIMIT $2`;
        params = [statusParam, limit];
      }

      const result = await pool.query(q, params);
      res.json(result.rows);
    } catch (err) {
      console.error(`GET by status (${col}) error:`, err);
      res.status(500).send("DB error");
    }
  };
}

// 1) project_status
app.get("/api/assign/by-project-status/:status", buildStatusQuery("project_status"));

// 2) work_status
app.get("/api/assign/by-work-status/:status", buildStatusQuery("work_status"));

// 3) report_status
app.get("/api/assign/by-report-status/:status", buildStatusQuery("report_status"));

// 4) daily_status
app.get("/api/assign/by-daily-status/:status", buildStatusQuery("daily_status"));



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
      check_in,  
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
      (check_in ?? 'pending'),
    ];

    const sql = `
      INSERT INTO "Project"."Assign"
      (id_code, idproject, id_process, id_work,
       time_in, time_out, project_status, work_status, report_status, daily_status, check_in) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)                                             
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





