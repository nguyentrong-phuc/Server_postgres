// server.js — Backend API (Express + pg)
// ESM: "type":"module" trong package.json
import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;
const app = express();

/* ================== CONFIG ================== */
const DB_HOST = process.env.PGHOST     || "raitek.cloud";
const DB_PORT = Number(process.env.PGPORT || 5432);
const DB_USER = process.env.PGUSER     || "mtryha11";
const DB_PASS = process.env.PGPASSWORD || "Hpx21led";
const DB_NAME = process.env.PGDATABASE || "IOTdev";
const DB_SSL  = (/^true$/i).test(process.env.PGSSL || "false");

app.use(cors());
app.use(express.json());

/* ================== DB POOL ================== */
const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  ssl: DB_SSL ? { rejectUnauthorized: false } : false,
});

pool.on("connect", (client) => {
  client.query('SET search_path TO "Project", public');
});

async function q(sql, params = []) { const r = await pool.query(sql, params); return r.rows; }

/* ============ UTILS / VALIDATION ============ */
const toInt = (v) => { const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : NaN; };
const normText = (s, max = 255) => (s == null ? null : String(s).trim().slice(0, max));
const hasText  = (s) => s != null && String(s).trim() !== "";
const likeify  = (s) => (s == null ? null : (String(s).includes("%") ? String(s) : `%${String(s)}%`));

function sendDbErr(res, where, e) {
  console.error(where, e?.message || e);
  return res.status(500).json({ error: "DB error", message: e?.message || String(e) });
}

/* ===== helpers: id_process theo tên ===== */
async function getProcessIdByName(name) {
  const r = await q(`SELECT id_process FROM process WHERE process=$1 LIMIT 1`, [name]);
  return r?.[0]?.id_process ?? null;
}
async function getProcessIds() {
  const pm    = await getProcessIdByName("Bảo dưỡng phòng ngừa");
  const corr  = await getProcessIdByName("Bảo dưỡng khắc phục");
  const other = await getProcessIdByName("Công việc khác");
  return { PM: pm ?? 80001, CORR: corr ?? 80002, OTHER: other ?? 80003 };
}

/* ================ HEALTH ================= */
app.get("/health", (_req, res) => res.status(200).json({ ok: true, ts: new Date().toISOString() }));
app.get("/", (_req, res) => res.send("Backend API is running..."));

/* ================ ACCOUNTS ================ */
app.get("/api/accounts", async (_req, res) => {
  try { res.json(await q(`SELECT * FROM account ORDER BY id_user LIMIT 200`)); }
  catch (e) { sendDbErr(res, "GET /api/accounts", e); }
});
app.get("/api/accounts/:id_user", async (req, res) => {
  try {
    const id = toInt(req.params.id_user);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_user" });
    const rows = await q(`SELECT * FROM account WHERE id_user=$1`, [id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { sendDbErr(res, "GET /api/accounts/:id", e); }
});

/* ================ PROJECTS ================ */
app.get("/api/projects", async (_req, res) => {
  try { res.json(await q(`SELECT * FROM project ORDER BY id_project LIMIT 200`)); }
  catch (e) { sendDbErr(res, "GET /api/projects", e); }
});
app.get("/api/projects/:id_project", async (req, res) => {
  try {
    const id = toInt(req.params.id_project);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_project" });
    const rows = await q(`SELECT * FROM project WHERE id_project=$1`, [id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { sendDbErr(res, "GET /api/projects/:id", e); }
});

/* ================= TASKS ================== */
app.get("/api/tasks", async (_req, res) => {
  try { res.json(await q(`SELECT * FROM task ORDER BY id_task LIMIT 500`)); }
  catch (e) { sendDbErr(res, "GET /api/tasks", e); }
});
app.get("/api/tasks/:id_task", async (req, res) => {
  try {
    const id = toInt(req.params.id_task);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_task" });
    const rows = await q(`SELECT * FROM task WHERE id_task=$1`, [id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { sendDbErr(res, "GET /api/tasks/:id", e); }
});

/* =============== PROCESSES ================ */
app.get("/api/processes", async (_req, res) => {
  try { res.json(await q(`SELECT * FROM process ORDER BY id_process LIMIT 100`)); }
  catch (e) { sendDbErr(res, "GET /api/processes", e); }
});
app.get("/api/processes/:id_process", async (req, res) => {
  try {
    const id = toInt(req.params.id_process);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_process" });
    const rows = await q(`SELECT * FROM process WHERE id_process=$1`, [id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { sendDbErr(res, "GET /api/processes/:id", e); }
});

/* ========= WORKING PROCESSES (WP) ========= */
// working_process(id_working_process, working_process_name)
app.get("/api/working-processes", async (_req, res) => {
  try { res.json(await q(`SELECT * FROM working_process ORDER BY id_working_process LIMIT 200`)); }
  catch (e) { sendDbErr(res, "GET /api/working-processes", e); }
});
app.get("/api/working-processes/:id_working_process", async (req, res) => {
  try {
    const id = toInt(req.params.id_working_process);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_working_process" });
    const rows = await q(`SELECT * FROM working_process WHERE id_working_process=$1`, [id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { sendDbErr(res, "GET /api/working-processes/:id", e); }
});
app.post("/api/working-processes", async (req, res) => {
  try {
    const b = req.body || {};
    const name = normText(b.working_process_name ?? b.name, 200);
    if (!hasText(name)) return res.status(400).json({ error: "Missing working_process_name" });
    let rows;
    if (b.id_working_process != null && !Number.isNaN(toInt(b.id_working_process))) {
      rows = await q(
        `INSERT INTO working_process (id_working_process, working_process_name) VALUES ($1,$2) RETURNING *`,
        [toInt(b.id_working_process), name]
      );
    } else {
      rows = await q(
        `INSERT INTO working_process (working_process_name) VALUES ($1) RETURNING *`,
        [name]
      );
    }
    res.status(201).json(rows[0]);
  } catch (e) { sendDbErr(res, "POST /api/working-processes", e); }
});
app.put("/api/working-processes/:id_working_process", async (req, res) => {
  try {
    const id = toInt(req.params.id_working_process);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_working_process" });
    const name = req.body?.working_process_name ?? req.body?.name;
    const val  = name !== undefined ? normText(name, 200) : undefined;
    if (val === undefined) return res.status(400).json({ error: "No valid fields" });
    const rows = await q(
      `UPDATE working_process SET working_process_name=$1 WHERE id_working_process=$2 RETURNING *`,
      [val, id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { sendDbErr(res, "PUT /api/working-processes/:id", e); }
});

/* ================= ASSIGNS ================= */

// List / detail
app.get("/api/assigns", async (req, res) => {
  try {
    const limit = Math.min(toInt(req.query.limit) || 200, 2000);
    const rows  = await q(`SELECT * FROM assign ORDER BY id_assign DESC LIMIT ${limit}`);
    res.json(rows);
  } catch (e) { sendDbErr(res, "GET /api/assigns", e); }
});
app.get("/api/assigns/:id_assign", async (req, res) => {
  try {
    const id = toInt(req.params.id_assign);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_assign" });
    const rows = await q(`SELECT * FROM assign WHERE id_assign=$1`, [id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { sendDbErr(res, "GET /api/assigns/:id", e); }
});

// By foreign key
function listAssignBy(col) {
  return async (req, res) => {
    try {
      const id = toInt(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ error: `Invalid ${col}` });
      const lim = Math.min(toInt(req.query.limit) || 500, 2000);
      const rows = await q(`SELECT * FROM assign WHERE ${col}=$1 ORDER BY id_assign DESC LIMIT ${lim}`, [id]);
      res.json(rows);
    } catch (e) { sendDbErr(res, `GET /api/assigns/by-${col}/:id`, e); }
  };
}
app.get("/api/assigns/by-project/:id",         listAssignBy("id_project"));
app.get("/api/assigns/by-user/:id",            listAssignBy("id_user"));
app.get("/api/assigns/by-task/:id",            listAssignBy("id_task"));
app.get("/api/assigns/by-process/:id",         listAssignBy("id_process"));
app.get("/api/assigns/by-working-process/:id", listAssignBy("id_working_process"));

// Full join (kéo cả working_process_name)
app.get("/api/assigns/full", async (req, res) => {
  try {
    const lim = Math.min(toInt(req.query.limit) || 200, 1000);
    const rows = await q(
      `
      SELECT a.*,
             u.staff                 AS user_name,
             p.project               AS project_name,
             t.task_name             AS task_name,
             pr.process              AS process_name,
             wp.working_process_name AS working_process_name
      FROM assign a
      LEFT JOIN account         u  ON u.id_user             = a.id_user
      LEFT JOIN project         p  ON p.id_project          = a.id_project
      LEFT JOIN task            t  ON t.id_task             = a.id_task
      LEFT JOIN process         pr ON pr.id_process         = a.id_process
      LEFT JOIN working_process wp ON wp.id_working_process = a.id_working_process
      ORDER BY a.id_assign DESC
      LIMIT ${lim}
      `
    );
    res.json(rows);
  } catch (e) { sendDbErr(res, "GET /api/assigns/full", e); }
});

/* ===== POST: create assign =====
   - Tự suy ra id_process theo loại công việc
   - PM: id_task bắt buộc (từ bảng task)
   - Corrective: nếu có id_task thì >= 91001
   - Other     : nếu có id_task thì >= 92001
   - BỎ id_note; dùng message (varchar 100)
*/
app.post("/api/assigns", async (req, res) => {
  try {
    const b = req.body || {};
    const { PM, CORR, OTHER } = await getProcessIds();

    const corrective = normText(b.corrective_maintenance, 100);
    const otherWork  = normText(b.other_work, 100);
    const message    = normText(b.message, 100);

    // quyết định id_process
    let id_process = Number.isFinite(Number(b.id_process)) ? toInt(b.id_process) : null;
    if (hasText(corrective)) id_process = CORR;
    else if (hasText(otherWork)) id_process = OTHER;
    else if (!id_process) id_process = PM;

    // bắt buộc
    const needInt = { id_user: b.id_user, id_project: b.id_project, id_process };
    for (const [k, v] of Object.entries(needInt)) {
      if (v === undefined || v === null || Number.isNaN(toInt(v))) {
        return res.status(400).json({ error: `Missing/invalid number field: ${k}` });
      }
    }

    let id_task = Number.isFinite(Number(b.id_task)) ? toInt(b.id_task) : null;
    if (id_process === PM && !Number.isFinite(Number(id_task))) {
      return res.status(400).json({ error: "PM requires a valid id_task" });
    }
    if (id_process === CORR && id_task != null && id_task < 91001) {
      return res.status(400).json({ error: "Corrective id_task must be >= 91001" });
    }
    if (id_process === OTHER && id_task != null && id_task < 92001) {
      return res.status(400).json({ error: "Other-work id_task must be >= 92001" });
    }

    // working process (chấp nhận alias Number_of_process)
    const wp = (b.id_working_process != null && !Number.isNaN(toInt(b.id_working_process)))
      ? toInt(b.id_working_process)
      : (b.Number_of_process != null && !Number.isNaN(toInt(b.Number_of_process))
          ? toInt(b.Number_of_process)
          : null);

    const rows = await q(
      `
      INSERT INTO assign
        (id_user, id_project, id_process, id_task,
         time_in, time_out, project_status, work_status,
         report_status, daily_status, time_work,
         "Number_of_devices", unit,
         id_working_process, corrective_maintenance, other_work, message)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *;
      `,
      [
        toInt(b.id_user),
        toInt(b.id_project),
        id_process,
        id_task,
        normText(b.time_in, 100),
        normText(b.time_out, 100),
        normText(b.project_status, 100),
        normText(b.work_status, 100),
        normText(b.report_status, 100),
        normText(b.daily_status, 100),
        normText(b.time_work, 100),
        Number.isFinite(Number(b.Number_of_devices)) ? toInt(b.Number_of_devices) : null,
        normText(b.unit, 100),
        wp,
        corrective,
        otherWork,
        message,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (e) { sendDbErr(res, "POST /api/assigns", e); }
});

/* ===== PUT: update assign =====
   - Tự tính id_process theo corrective/other nếu có
   - BỎ id_note; cho phép cập nhật message
*/
app.put("/api/assigns/:id_assign", async (req, res) => {
  try {
    const id = toInt(req.params.id_assign);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_assign" });

    const curRows = await q(`SELECT * FROM assign WHERE id_assign=$1`, [id]);
    if (!curRows.length) return res.status(404).json({ error: "Not found" });
    const cur = curRows[0];

    const b = req.body || {};
    const { PM, CORR, OTHER } = await getProcessIds();

    // chuẩn hoá
    const wp =
      (b.id_working_process != null && !Number.isNaN(toInt(b.id_working_process)))
        ? toInt(b.id_working_process)
        : (b.Number_of_process != null && !Number.isNaN(toInt(b.Number_of_process))
            ? toInt(b.Number_of_process)
            : undefined);

    const patch = {
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
          : (b.Number_of_devices != null ? null : undefined),
      unit:                   b.unit != null ? normText(b.unit, 100) : undefined,
      id_working_process:     wp,
      corrective_maintenance: b.corrective_maintenance !== undefined ? normText(b.corrective_maintenance, 100) : undefined,
      other_work:             b.other_work !== undefined ? normText(b.other_work, 100) : undefined,
      message:                b.message !== undefined ? normText(b.message, 100) : undefined,
    };

    // snapshot sau update
    const next = { ...cur, ...Object.fromEntries(Object.entries(patch).filter(([,v]) => v !== undefined)) };

    // quyết định id_process theo nội dung
    let targetProcess = next.id_process;
    if (hasText(next.corrective_maintenance)) targetProcess = CORR;
    else if (hasText(next.other_work))        targetProcess = OTHER;
    else if (!targetProcess)                  targetProcess = PM;

    // rule id_task theo loại
    if (targetProcess === PM && (next.id_task == null || Number.isNaN(toInt(next.id_task)))) {
      return res.status(400).json({ error: "PM requires a valid id_task" });
    }
    if (targetProcess === CORR && next.id_task != null && toInt(next.id_task) < 91001) {
      return res.status(400).json({ error: "Corrective id_task must be >= 91001" });
    }
    if (targetProcess === OTHER && next.id_task != null && toInt(next.id_task) < 92001) {
      return res.status(400).json({ error: "Other-work id_task must be >= 92001" });
    }

    // UPDATE
    const sets = [];
    const params = [];
    for (const [col, val] of Object.entries(patch)) {
      if (val !== undefined && !(Number.isNaN(val) && /^id_/.test(col))) {
        params.push(val);
        sets.push(`"${col}" = $${params.length}`);
      }
    }
    // luôn cập nhật id_process theo quyết định cuối
    params.push(targetProcess);
    sets.push(`"id_process" = $${params.length}`);

    params.push(id);
    const rows = await q(
      `UPDATE assign SET ${sets.join(", ")} WHERE id_assign=$${params.length} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { sendDbErr(res, "PUT /api/assigns/:id_assign", e); }
});

// Quick actions
app.post("/api/assigns/:id_assign/checkin", async (req, res) => {
  try {
    const id = toInt(req.params.id_assign);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_assign" });
    const now = new Date().toISOString();
    const rows = await q(`UPDATE assign SET time_in=$1 WHERE id_assign=$2 RETURNING *`, [now, id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { sendDbErr(res, "POST /api/assigns/:id/checkin", e); }
});
app.post("/api/assigns/:id_assign/checkout", async (req, res) => {
  try {
    const id = toInt(req.params.id_assign);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id_assign" });
    const now = new Date().toISOString();
    const rows = await q(`UPDATE assign SET time_out=$1 WHERE id_assign=$2 RETURNING *`, [now, id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { sendDbErr(res, "POST /api/assigns/:id/checkout", e); }
});

// Filters by status
function buildStatusQuery(field) {
  return async (req, res) => {
    try {
      const status = req.params.status;
      const lim = Math.min(toInt(req.query.limit) || 500, 2000);
      const valuesParam = req.query.values;
      const params = [];
      let where = "";

      if (status && status.toLowerCase() !== "anything") {
        params.push(likeify(status));
        where = `WHERE ${field} ILIKE $1`;
      } else if (valuesParam) {
        const arr = String(valuesParam).split(",").map((s) => s.trim()).filter(Boolean);
        if (arr.length) {
          const ph = arr.map((_, i) => `$${i + 1}`).join(",");
          where = `WHERE ${field} ILIKE ANY(ARRAY[${ph}])`;
          arr.forEach((s) => params.push(likeify(s)));
        }
      }

      const rows = await q(`SELECT * FROM assign ${where} ORDER BY id_assign DESC LIMIT ${lim}`, params);
      res.json(rows);
    } catch (e) { sendDbErr(res, `GET /api/assign/by-${field}/:status`, e); }
  };
}
app.get("/api/assign/by-project-status/:status", buildStatusQuery("project_status"));
app.get("/api/assign/by-work-status/:status",    buildStatusQuery("work_status"));
app.get("/api/assign/by-report-status/:status",  buildStatusQuery("report_status"));
app.get("/api/assign/by-daily-status/:status",   buildStatusQuery("daily_status"));

/* ================ START ================= */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ API running at http://localhost:${PORT}`));
