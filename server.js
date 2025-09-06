/**
 * OM Backend API (PostgreSQL - schema "Project")
 * ----------------------------------------------
 * - Đồng bộ với schema đã chuẩn hóa (id_user, id_project, id_task, id_process…)
 * - Sử dụng SET search_path TO "Project" để không phải ghi schema ở mọi câu SQL
 * - Tất cả query đều parameterized để tránh SQL injection
 *
 * Cấu trúc API (rút gọn):
 *   GET    /health
 *   GET    /
 *
 *   GET    /api/accounts?limit=50
 *   GET    /api/projects?limit=50
 *   GET    /api/tasks?limit=50
 *   GET    /api/processes?limit=50
 *
 *   GET    /api/assigns?limit=100&join=1
 *   GET    /api/assigns/:id
 *   POST   /api/assigns
 *   PUT    /api/assigns/:id
 *   DELETE /api/assigns/:id
 *
 *   // Lọc theo status (hỗ trợ pattern/values)
 *   GET /api/assign/by-project-status/:status
 *   GET /api/assign/by-work-status/:status
 *   GET /api/assign/by-report-status/:status
 *   GET /api/assign/by-daily-status/:status
 *
 * Ví dụ chạy nhanh:
 *   node server.js
 *
 * Ví dụ gọi API (PowerShell/cURL):
 *   curl http://localhost:3000/health
 *   curl "http://localhost:3000/api/assigns?join=1&limit=20"
 *   curl -H "Content-Type: application/json" -d "{\"id_user\":1001,\"id_project\":70001,\"id_process\":80001,\"id_task\":90001,\"time_in\":\"2025-09-01 00:00:00\",\"time_out\":\"2025-09-30 23:59:59\",\"project_status\":\"SUCCESS\",\"work_status\":\"IN_PROGRESS\",\"report_status\":\"APPROVED\",\"daily_status\":\"SUCCESS\",\"time_work\":\"2025-09-05\"}" http://localhost:3000/api/assigns
 */

import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

/* -----------------------------------------------------------------------------
 * 1) Cấu hình Database (dùng ENV khi có, có default để chạy nhanh)
 * ---------------------------------------------------------------------------*/
const DB_CFG = {
  host: process.env.PGHOST || "raitek.cloud",
  port: +(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "mtryha11",
  password: process.env.PGPASSWORD || "Hpx21led",
  database: process.env.PGDATABASE || "IOTdev",
  ssl: /^(1|true|require)$/i.test(process.env.PGSSL || "false") ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(DB_CFG);

/** Đặt search_path cho mọi kết nối → ưu tiên schema "Project" */
pool.on("connect", async (client) => {
  await client.query('SET search_path TO "Project", public');
});

/** Helper chạy query + đóng gói lỗi gọn */
async function q(text, params = []) {
  const t0 = Date.now();
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error("SQL ERR:", err?.message, { text, params });
    throw err;
  } finally {
    const ms = Date.now() - t0;
    if (ms > 500) console.log(`⏱️ Slow query ${ms}ms ::`, text.replace(/\s+/g, " ").slice(0, 200));
  }
}

/** Tiện ích ép limit hợp lệ */
function parseLimit(v, def = 50, max = 500) {
  const n = Number(v);
  if (Number.isFinite(n) && n > 0) return Math.min(n, max);
  return def;
}

/* -----------------------------------------------------------------------------
 * 2) System endpoints
 * ---------------------------------------------------------------------------*/
app.get("/", (_req, res) => {
  res.send("Backend API is running… (schema: Project)");
});

app.get("/health", async (_req, res) => {
  try {
    const r = await q("SELECT now() as ts");
    res.status(200).json({ ok: true, ts: r.rows?.[0]?.ts });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

/* -----------------------------------------------------------------------------
 * 3) Master data: accounts / projects / tasks / processes
 * ---------------------------------------------------------------------------*/
app.get("/api/accounts", async (req, res) => {
  const limit = parseLimit(req.query.limit, 50);
  try {
    const sql = `
      SELECT id_user, staff, gender, team, pos, "number", account, access
      FROM account
      ORDER BY id_user
      LIMIT $1
    `;
    const r = await q(sql, [limit]);
    res.json({ ok: true, rows: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/projects", async (req, res) => {
  const limit = parseLimit(req.query.limit, 50);
  try {
    const r = await q(`SELECT id_project, project FROM project ORDER BY id_project LIMIT $1`, [limit]);
    res.json({ ok: true, rows: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/tasks", async (req, res) => {
  const limit = parseLimit(req.query.limit, 100);
  try {
    const r = await q(`SELECT id_task, task_name FROM task ORDER BY id_task LIMIT $1`, [limit]);
    res.json({ ok: true, rows: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/processes", async (req, res) => {
  const limit = parseLimit(req.query.limit, 100);
  try {
    const r = await q(`SELECT id_process, process FROM process ORDER BY id_process LIMIT $1`, [limit]);
    res.json({ ok: true, rows: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* -----------------------------------------------------------------------------
 * 4) Assigns: CRUD + join
 * ---------------------------------------------------------------------------*/

/**
 * GET /api/assigns?limit=100&join=1
 * - join=1 → trả thêm tên staff/project/task/process
 */
app.get("/api/assigns", async (req, res) => {
  const limit = parseLimit(req.query.limit, 100);
  const withJoin = String(req.query.join || "") === "1";
  try {
    const baseCols = `
      a.id_assign, a.id_user, a.id_project, a.id_process, a.id_task,
      a.time_in, a.time_out, a.project_status, a.work_status,
      a.report_status, a.daily_status, a.time_work
    `;
    const joinCols = withJoin
      ? `, u.staff AS user_name, p.project AS project_name, t.task_name, pr.process AS process_name`
      : ``;

    const fromJoin = withJoin
      ? `
        FROM assign a
        LEFT JOIN account  u  ON u.id_user   = a.id_user
        LEFT JOIN project  p  ON p.id_project= a.id_project
        LEFT JOIN task     t  ON t.id_task   = a.id_task
        LEFT JOIN process  pr ON pr.id_process = a.id_process
      `
      : `FROM assign a`;

    const sql = `
      SELECT ${baseCols} ${joinCols}
      ${fromJoin}
      ORDER BY a.id_assign DESC
      LIMIT $1
    `;
    const r = await q(sql, [limit]);
    res.json({ ok: true, rows: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/** GET /api/assigns/:id */
app.get("/api/assigns/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: "Invalid id" });
  try {
    const r = await q(
      `SELECT a.*
       FROM assign a
       WHERE a.id_assign = $1`,
      [id]
    );
    if (!r.rowCount) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, row: r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * POST /api/assigns
 * Body mẫu:
 * {
 *   "id_user":1001, "id_project":70001, "id_process":80001, "id_task":90001,
 *   "time_in":"2025-09-01 00:00:00", "time_out":"2025-09-30 23:59:59",
 *   "project_status":"SUCCESS", "work_status":"IN_PROGRESS",
 *   "report_status":"APPROVED", "daily_status":"SUCCESS",
 *   "time_work":"2025-09-05"
 * }
 */
app.post("/api/assigns", async (req, res) => {
  const b = req.body || {};
  // Validate bắt buộc tối thiểu
  const needed = ["id_user", "id_project", "id_process", "id_task"];
  for (const k of needed) {
    if (typeof b[k] === "undefined" || b[k] === null)
      return res.status(400).json({ ok: false, error: `Missing field: ${k}` });
  }

  const defaults = {
    time_in: b.time_in ?? "",
    time_out: b.time_out ?? "",
    project_status: b.project_status ?? "pending",
    work_status: b.work_status ?? "pending",
    report_status: b.report_status ?? "pending",
    daily_status: b.daily_status ?? "pending",
    time_work: b.time_work ?? "",
  };

  try {
    const sql = `
      INSERT INTO assign
        (id_user, id_project, id_process, id_task,
         time_in, time_out, project_status, work_status,
         report_status, daily_status, time_work)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `;
    const params = [
      b.id_user,
      b.id_project,
      b.id_process,
      b.id_task,
      defaults.time_in,
      defaults.time_out,
      defaults.project_status,
      defaults.work_status,
      defaults.report_status,
      defaults.daily_status,
      defaults.time_work,
    ];
    const r = await q(sql, params);
    res.status(201).json({ ok: true, row: r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * PUT /api/assigns/:id
 * - Update mềm: chỉ cập nhật các field được phép nếu có trong body
 * Body ví dụ (đổi trạng thái làm việc):
 *   { "work_status": "IN_PROGRESS", "time_work": "2025-09-05" }
 */
app.put("/api/assigns/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: "Invalid id" });

  // Chỉ cho phép các cột này được update
  const allowed = new Set([
    "id_user",
    "id_project",
    "id_process",
    "id_task",
    "time_in",
    "time_out",
    "project_status",
    "work_status",
    "report_status",
    "daily_status",
    "time_work",
  ]);

  const b = req.body || {};
  const sets = [];
  const params = [];
  let i = 1;
  for (const [k, v] of Object.entries(b)) {
    if (!allowed.has(k)) continue;
    sets.push(`${k} = $${i++}`);
    params.push(v);
  }
  if (!sets.length) return res.status(400).json({ ok: false, error: "No valid fields to update" });

  try {
    const sql = `UPDATE assign SET ${sets.join(", ")} WHERE id_assign = $${i} RETURNING *`;
    params.push(id);
    const r = await q(sql, params);
    if (!r.rowCount) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, row: r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/** DELETE /api/assigns/:id  (cẩn trọng khi dùng ở prod) */
app.delete("/api/assigns/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: "Invalid id" });
  try {
    const r = await q(`DELETE FROM assign WHERE id_assign = $1`, [id]);
    res.json({ ok: true, deleted: r.rowCount });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* -----------------------------------------------------------------------------
 * 5) Endpoints lọc theo status (pattern & nhiều giá trị)
 * ---------------------------------------------------------------------------*/

/**
 * Helper build status filter:
 *   - :status có thể là 'SUCCESS' hoặc pattern '%done%' (ILIKE)
 *   - hoặc dùng query ?values=completed,done,finished (so khớp ILIKE ANY)
 *   - ?limit=100  giới hạn kết quả
 *   - ?join=1     trả thêm tên staff/project/task/process
 *
 * Ví dụ:
 *   /api/assign/by-work-status/%done%?limit=100
 *   /api/assign/by-report-status/anything?values=completed,done,finished,hoan thanh
 */
function buildStatusQuery(column) {
  return async (req, res) => {
    const limit = parseLimit(req.query.limit, 100);
    const withJoin = String(req.query.join || "") === "1";
    const statusParam = String(req.params.status || "").trim();

    let whereSql = "";
    const params = [];

    // Nếu có ?values=a,b,c → ILIKE ANY
    if (req.query.values) {
      const list = String(req.query.values)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!list.length) return res.status(400).json({ ok: false, error: "values is empty" });
      whereSql = `LOWER(${column}) = ANY($1)`;
      params.push(list.map((x) => x.toLowerCase()));
    } else if (statusParam) {
      // Có thể là pattern chứa % → dùng ILIKE
      if (statusParam.includes("%") || statusParam.includes("_")) {
        whereSql = `${column} ILIKE $1`;
        params.push(statusParam);
      } else if (statusParam.toLowerCase() === "anything") {
        whereSql = `TRUE`; // match all (khi phối hợp với ?values)
      } else {
        whereSql = `LOWER(${column}) = $1`;
        params.push(statusParam.toLowerCase());
      }
    } else {
      return res.status(400).json({ ok: false, error: "Missing status" });
    }

    const baseCols = `
      a.id_assign, a.id_user, a.id_project, a.id_process, a.id_task,
      a.time_in, a.time_out, a.project_status, a.work_status,
      a.report_status, a.daily_status, a.time_work
    `;
    const joinCols = withJoin
      ? `, u.staff AS user_name, p.project AS project_name, t.task_name, pr.process AS process_name`
      : ``;
    const fromJoin = withJoin
      ? `
        FROM assign a
        LEFT JOIN account  u  ON u.id_user     = a.id_user
        LEFT JOIN project  p  ON p.id_project  = a.id_project
        LEFT JOIN task     t  ON t.id_task     = a.id_task
        LEFT JOIN process  pr ON pr.id_process = a.id_process
      `
      : `FROM assign a`;

    const sql = `
      SELECT ${baseCols} ${joinCols}
      ${fromJoin}
      WHERE ${whereSql}
      ORDER BY a.id_assign DESC
      LIMIT $${params.length + 1}
    `;
    params.push(limit);

    try {
      const r = await q(sql, params);
      res.json({ ok: true, rows: r.rows });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  };
}

app.get("/api/assign/by-project-status/:status", buildStatusQuery("a.project_status"));
app.get("/api/assign/by-work-status/:status", buildStatusQuery("a.work_status"));
app.get("/api/assign/by-report-status/:status", buildStatusQuery("a.report_status"));
app.get("/api/assign/by-daily-status/:status", buildStatusQuery("a.daily_status"));

/* -----------------------------------------------------------------------------
 * 6) Start server
 * ---------------------------------------------------------------------------*/
const PORT = +(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`✅ OM Backend listening on http://localhost:${PORT}`);
});
