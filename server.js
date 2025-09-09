// server.js (ESM) – Node 18+, Express 4, pg 8
// Hỗ trợ đầy đủ GET/POST/PUT cho:
// - "Number_of_devices" (int)
// - "Number_of_process" (int)
// - "unit" (varchar 100)

import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;
const app = express();

app.use(cors());
app.use(express.json());

// ====================== DB POOL ======================
const pool = new Pool({
  host: "raitek.cloud",
  port: 5432,
  user: "mtryha11",
  password: "Hpx21led",
  database: "IOTdev",
  ssl: false, // true nếu DB yêu cầu SSL
});

// đảm bảo dùng schema Project mặc định
pool.on("connect", (client) => {
  client.query('SET search_path TO "Project", public');
});

// helper query
async function q(sql, params = []) {
  const r = await pool.query(sql, params);
  return r.rows;
}

// utils nhỏ
const toInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
};
const normText = (s, max = 255) =>
  s == null ? null : String(s).trim().slice(0, max);

function likeify(s) {
  if (s == null) return null;
  const raw = String(s);
  return raw.includes("%") ? raw : `%${raw}%`;
}

// ====================== HEALTH ======================
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});

app.get("/", (_req, res) => {
  res.send("Backend API is running...");
});

// ====================== ACCOUNT ======================
app.get("/api/accounts", async (_req, res) => {
  try {
    const rows = await q(`SELECT * FROM account ORDER BY id_user LIMIT 200`);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

app.get("/api/accounts/:id_user", async (req, res) => {
  try {
    const id = toInt(req.params.id_user);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_user" });
    const rows = await q(`SELECT * FROM account WHERE id_user = $1`, [id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

// ====================== PROJECT ======================
app.get("/api/projects", async (_req, res) => {
  try {
    const rows = await q(`SELECT * FROM project ORDER BY id_project LIMIT 200`);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

app.get("/api/projects/:id_project", async (req, res) => {
  try {
    const id = toInt(req.params.id_project);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_project" });
    const rows = await q(`SELECT * FROM project WHERE id_project = $1`, [id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

// ====================== TASK ======================
app.get("/api/tasks", async (_req, res) => {
  try {
    const rows = await q(`SELECT * FROM task ORDER BY id_task LIMIT 500`);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

app.get("/api/tasks/:id_task", async (req, res) => {
  try {
    const id = toInt(req.params.id_task);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_task" });
    const rows = await q(`SELECT * FROM task WHERE id_task = $1`, [id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

// ====================== PROCESS ======================
app.get("/api/processes", async (_req, res) => {
  try {
    const rows = await q(`SELECT * FROM process ORDER BY id_process LIMIT 100`);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

app.get("/api/processes/:id_process", async (req, res) => {
  try {
    const id = toInt(req.params.id_process);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_process" });
    const rows = await q(`SELECT * FROM process WHERE id_process = $1`, [id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

// ====================== ASSIGN ======================
// Schema assign: id_assign, id_user, id_project, id_process, id_task,
// time_in, time_out, project_status, work_status, report_status, daily_status, time_work,
// "Number_of_devices", "Number_of_process", unit

// List cơ bản
app.get("/api/assigns", async (req, res) => {
  try {
    const limit = Math.min(toInt(req.query.limit) || 200, 2000);
    const rows = await q(
      `SELECT * FROM assign ORDER BY id_assign DESC LIMIT ${limit}`
    );
    res.json(rows);
  } catch (e) {
    console.error("GET /api/assigns", e);
    res.status(500).send("DB error");
  }
});

// Lấy 1 assign
app.get("/api/assigns/:id_assign", async (req, res) => {
  try {
    const id = toInt(req.params.id_assign);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_assign" });
    const rows = await q(`SELECT * FROM assign WHERE id_assign = $1`, [id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

// Các filter theo ID
app.get("/api/assigns/by-project/:id_project", async (req, res) => {
  try {
    const id = toInt(req.params.id_project);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_project" });
    const lim = Math.min(toInt(req.query.limit) || 500, 2000);
    const rows = await q(
      `SELECT * FROM assign WHERE id_project = $1 ORDER BY id_assign DESC LIMIT ${lim}`,
      [id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

app.get("/api/assigns/by-user/:id_user", async (req, res) => {
  try {
    const id = toInt(req.params.id_user);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_user" });
    const lim = Math.min(toInt(req.query.limit) || 500, 2000);
    const rows = await q(
      `SELECT * FROM assign WHERE id_user = $1 ORDER BY id_assign DESC LIMIT ${lim}`,
      [id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

app.get("/api/assigns/by-task/:id_task", async (req, res) => {
  try {
    const id = toInt(req.params.id_task);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_task" });
    const lim = Math.min(toInt(req.query.limit) || 500, 2000);
    const rows = await q(
      `SELECT * FROM assign WHERE id_task = $1 ORDER BY id_assign DESC LIMIT ${lim}`,
      [id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

app.get("/api/assigns/by-process/:id_process", async (req, res) => {
  try {
    const id = toInt(req.params.id_process);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_process" });
    const lim = Math.min(toInt(req.query.limit) || 500, 2000);
    const rows = await q(
      `SELECT * FROM assign WHERE id_process = $1 ORDER BY id_assign DESC LIMIT ${lim}`,
      [id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

// View join đầy đủ (rất tiện cho app)
app.get("/api/assigns/full", async (req, res) => {
  try {
    const lim = Math.min(toInt(req.query.limit) || 200, 1000);
    const rows = await q(
      `
      SELECT a.*,
             u.staff        AS user_name,
             p.project      AS project_name,
             t.task_name    AS task_name,
             pr.process     AS process_name
      FROM assign a
      LEFT JOIN account u  ON u.id_user    = a.id_user
      LEFT JOIN project p  ON p.id_project = a.id_project
      LEFT JOIN task t     ON t.id_task    = a.id_task
      LEFT JOIN process pr ON pr.id_process= a.id_process
      ORDER BY a.id_assign DESC
      LIMIT ${lim}
      `
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

// Insert assign (CÓ Number_of_devices + Number_of_process + unit)
app.post("/api/assigns", async (req, res) => {
  try {
    const {
      id_user,
      id_project,
      id_process,
      id_task,
      time_in,
      time_out,
      project_status,
      work_status,
      report_status,
      daily_status,
      time_work,
      Number_of_devices,   // optional int
      Number_of_process,   // optional int
      unit,                // optional varchar(100)
    } = req.body || {};

    // validate số bắt buộc
    const needInt = { id_user, id_project, id_process, id_task };
    for (const [k, v] of Object.entries(needInt)) {
      if (v === undefined || v === null || Number.isNaN(toInt(v)))
        return res.status(400).json({ error: `Missing/invalid number field: ${k}` });
    }

    const rows = await q(
      `
      INSERT INTO assign
        (id_user, id_project, id_process, id_task,
         time_in, time_out, project_status, work_status,
         report_status, daily_status, time_work,
         "Number_of_devices", "Number_of_process", unit)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *;
      `,
      [
        toInt(id_user),
        toInt(id_project),
        toInt(id_process),
        toInt(id_task),
        normText(time_in, 100),
        normText(time_out, 100),
        normText(project_status, 100),
        normText(work_status, 100),
        normText(report_status, 100),
        normText(daily_status, 100),
        normText(time_work, 100),
        Number.isFinite(Number(Number_of_devices)) ? toInt(Number_of_devices) : null,
        Number.isFinite(Number(Number_of_process)) ? toInt(Number_of_process) : null,
        normText(unit, 100),
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("POST /api/assigns", e);
    res.status(500).send("DB error");
  }
});

// Update nhiều trường (partial) – CÓ Number_of_devices + Number_of_process + unit
app.put("/api/assigns/:id_assign", async (req, res) => {
  try {
    const id = toInt(req.params.id_assign);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_assign" });

    const b = req.body || {};
    const payload = {
      id_user:        b.id_user != null ? toInt(b.id_user) : undefined,
      id_project:     b.id_project != null ? toInt(b.id_project) : undefined,
      id_task:        b.id_task != null ? toInt(b.id_task) : undefined,
      id_process:     b.id_process != null ? toInt(b.id_process) : undefined,
      time_in:        b.time_in != null ? normText(b.time_in ?? b.checkin_time, 100) : undefined,
      time_out:       b.time_out != null ? normText(b.time_out ?? b.checkout_time, 100) : undefined,
      time_work:      b.time_work != null ? normText(b.time_work, 100) : undefined,
      project_status: b.project_status != null ? normText(b.project_status, 100) : undefined,
      work_status:    b.work_status != null ? normText(b.work_status, 100) : undefined,
      report_status:  b.report_status != null ? normText(b.report_status, 100) : undefined,
      daily_status:   b.daily_status != null ? normText(b.daily_status, 100) : undefined,
      "Number_of_devices":
        b.Number_of_devices != null && Number.isFinite(Number(b.Number_of_devices))
          ? toInt(b.Number_of_devices)
          : (b.Number_of_devices != null ? null : undefined), // nếu gửi null/invalid -> set NULL
      "Number_of_process":
        b.Number_of_process != null && Number.isFinite(Number(b.Number_of_process))
          ? toInt(b.Number_of_process)
          : (b.Number_of_process != null ? null : undefined),
      unit:           b.unit != null ? normText(b.unit, 100) : undefined,
    };

    const sets = [];
    const params = [];
    for (const [col, val] of Object.entries(payload)) {
      if (val !== undefined && !(Number.isNaN(val) && /^id_/.test(col))) {
        params.push(val);
        sets.push(`"${col}" = $${params.length}`); // quote để an toàn cho cột PascalCase
      }
    }
    if (!sets.length) return res.status(400).json({ error: "No valid fields" });

    params.push(id);
    const rows = await q(
      `UPDATE assign SET ${sets.join(", ")} WHERE id_assign = $${params.length} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error("PUT /api/assigns/:id_assign", e);
    res.status(500).send("DB error");
  }
});

// Nút nhanh: checkin / checkout
app.post("/api/assigns/:id_assign/checkin", async (req, res) => {
  try {
    const id = toInt(req.params.id_assign);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_assign" });
    const now = new Date().toISOString();
    const rows = await q(
      `UPDATE assign SET time_in=$1 WHERE id_assign=$2 RETURNING *`,
      [now, id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

app.post("/api/assigns/:id_assign/checkout", async (req, res) => {
  try {
    const id = toInt(req.params.id_assign);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_assign" });
    const now = new Date().toISOString();
    const rows = await q(
      `UPDATE assign SET time_out=$1 WHERE id_assign=$2 RETURNING *`,
      [now, id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

// ====================== FILTER STATUS ======================
function buildStatusQuery(field) {
  return async (req, res) => {
    try {
      const status = req.params.status; // 'anything' hoặc có %...%
      const lim = Math.min(toInt(req.query.limit) || 500, 2000);
      const valuesParam = req.query.values; // "a,b,c"
      const params = [];
      let where = "";

      if (status && status.toLowerCase() !== "anything") {
        const v = likeify(status);
        params.push(v);
        where = `WHERE ${field} ILIKE $1`;
      } else if (valuesParam) {
        const arr = String(valuesParam)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (arr.length) {
          const ph = arr.map((_, i) => `$${i + 1}`).join(",");
          where = `WHERE ${field} ILIKE ANY(ARRAY[${ph}])`;
          arr.forEach((s) => params.push(likeify(s)));
        }
      }

      const rows = await q(
        `SELECT * FROM assign ${where} ORDER BY id_assign DESC LIMIT ${lim}`,
        params
      );
      res.json(rows);
    } catch (e) {
      console.error(`GET /api/assign/by-${field} error`, e);
      res.status(500).send("DB error");
    }
  };
}

app.get("/api/assign/by-project-status/:status", buildStatusQuery("project_status"));
app.get("/api/assign/by-work-status/:status",    buildStatusQuery("work_status"));
app.get("/api/assign/by-report-status/:status",  buildStatusQuery("report_status"));
app.get("/api/assign/by-daily-status/:status",   buildStatusQuery("daily_status"));

// ====================== START ======================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ API running at http://localhost:${PORT}`);
});
