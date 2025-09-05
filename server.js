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

// ==================== ASSIGN: lọc theo time_work (ngày cụ thể) ====================
// :date dạng YYYY-MM-DD
app.get("/api/assign/by-time-work/:date", async (req, res) => {
  try {
    const date = req.params.date;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format, dùng YYYY-MM-DD" });
    }

    const q = `
      SELECT * FROM "Project"."Assign"
      WHERE time_work = $1
      ORDER BY id_assign DESC
    `;
    const result = await pool.query(q, [date]);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/assign/by-time-work/:date error:", err);
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
      time_work,   
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
      time_work ?? null,   // ✅ thêm vào cuối
    ];

    const sql = `
      INSERT INTO "Project"."Assign"
      (id_code, idproject, id_process, id_work,
       time_in, time_out, project_status, work_status,
       report_status, daily_status, time_work)
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

/* ====================== ASSIGN: UPDATE STATUS ====================== */

/** Helper: chuẩn hoá text ngắn (tránh rác) */
const normText = (v, max = 100) =>
  (v == null ? null : String(v).trim().slice(0, max));

/** Helper: update đúng 1 cột status */
function buildStatusUpdateEndpoint(col, pathSuffix) {
  // PATCH body: { value: "assigned" }  hoặc  query: ?value=assigned  hoặc  /:value
  app.patch(`/api/assign/:id_assign/${pathSuffix}`, async (req, res) => {
    try {
      const idAssign = parseInt(req.params.id_assign, 10);
      if (Number.isNaN(idAssign)) return res.status(400).json({ error: "Invalid id_assign" });

      const valueFromPath = req.params.value; // (nếu có ở route biến thể)
      const value =
        normText(req.body?.value) ||
        normText(req.query?.value) ||
        normText(valueFromPath);

      if (!value) return res.status(400).json({ error: "Missing status value" });

      const sql = `UPDATE "Project"."Assign"
                   SET ${col} = $1
                   WHERE id_assign = $2
                   RETURNING *;`;
      const result = await pool.query(sql, [value, idAssign]);
      if (result.rows.length === 0) return res.status(404).json({ error: "Assign not found" });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(`PATCH /api/assign/:id_assign/${pathSuffix} error:`, err);
      res.status(500).send("DB error");
    }
  });

  // Biến thể có giá trị trong path:  /api/assign/123/<suffix>/done
  app.patch(`/api/assign/:id_assign/${pathSuffix}/:value`, async (req, res) => {
    req.params.value = req.params.value; // để dùng chung logic trên
    return app._router.handle(req, res); // chuyển cho handler ở trên
  });
}

/* ---- 4 endpoint đổi 4 cột trạng thái ---- */
buildStatusUpdateEndpoint("project_status", "project-status");
buildStatusUpdateEndpoint("work_status",    "work-status");
buildStatusUpdateEndpoint("report_status",  "report-status");
buildStatusUpdateEndpoint("daily_status",   "daily-status");


/* ======= ASSIGN: UPDATE NHIỀU TRƯỜNG (khớp app gọi PUT /assigns/:id) ======= */
/* Hỗ trợ cập nhật các trường sau (nếu có trong body):
   - project_status, work_status, report_status, daily_status
   - time_in, time_out, time_work
   - alias: checkin_time -> time_in,  checkout_time -> time_out
*/
async function updateAssignManyFields(req, res) {
  try {
    const idAssign = parseInt(req.params.id_assign, 10);
    if (Number.isNaN(idAssign)) return res.status(400).json({ error: "Invalid id_assign" });

    const body = req.body || {};

    // alias để app cũ không phải sửa code
    const payload = {
      project_status: normText(body.project_status),
      work_status:    normText(body.work_status),
      report_status:  normText(body.report_status),
      daily_status:   normText(body.daily_status),
      time_in:        normText(body.time_in ?? body.checkin_time,  100),
      time_out:       normText(body.time_out ?? body.checkout_time, 100),
      time_work:      normText(body.time_work, 100),
    };

    const sets = [];
    const params = [];
    for (const [k, v] of Object.entries(payload)) {
      if (v !== null && v !== undefined) {
        params.push(v);
        // cột có dấu gạch dưới nên không cần quote tên cột
        sets.push(`${k} = $${params.length}`);
      }
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: "No updatable fields in body" });
    }

    params.push(idAssign);
    const sql = `UPDATE "Project"."Assign"
                 SET ${sets.join(", ")}
                 WHERE id_assign = $${params.length}
                 RETURNING *;`;

    const result = await pool.query(sql, params);
    if (result.rows.length === 0) return res.status(404).json({ error: "Assign not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE many fields error:", err);
    res.status(500).send("DB error");
  }
}

// Cho phép cả PUT lẫn PATCH để tránh 404 từ app cũ
app.put(  "/api/assigns/:id_assign", updateAssignManyFields);
app.patch("/api/assigns/:id_assign", updateAssignManyFields);








/* ========== ASSIGN: UPDATE ==========
   - PUT /api/assign/:id_assign  (generic patch)
   - POST /api/assign/:id_assign/checkin       → work: IN_PROGRESS, project: SUCCESS, time_work=today
   - POST /api/assign/:id_assign/report-wait   → report: WAIT, project: SUCCESS, work: WAIT
==================================== */

const ALLOWED_ASSIGN_COLUMNS = new Set([
  "project_status","work_status","report_status","daily_status",
  "time_in","time_out","time_work","id_process","id_work","note"
]);

app.put("/api/assign/:id_assign", async (req, res) => {
  try {
    const idAssign = parseInt(req.params.id_assign, 10);
    if (Number.isNaN(idAssign)) return res.status(400).json({ error: "Invalid id_assign" });

    const patch = req.body || {};
    const cols = [];
    const vals = [];

    for (const [k, v] of Object.entries(patch)) {
      if (!ALLOWED_ASSIGN_COLUMNS.has(k)) continue;      // tránh SQL injection
      cols.push(`"${k}"=$${cols.length + 1}`);
      vals.push(v);
    }
    if (!cols.length) return res.status(400).json({ error: "No allowed fields" });

    vals.push(idAssign);
    const sql = `UPDATE "Project"."Assign" SET ${cols.join(", ")} WHERE id_assign=$${vals.length}`;
    await pool.query(sql, vals);

    const row = await pool.query(`SELECT * FROM "Project"."Assign" WHERE id_assign=$1`, [idAssign]);
    res.json(row.rows?.[0] ?? {});
  } catch (err) {
    console.error("PUT /api/assign/:id_assign error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Check-in: set trạng thái khi user bấm vào công việc ở màn Work
app.post("/api/assign/:id_assign/checkin", async (req, res) => {
  try {
    const idAssign = parseInt(req.params.id_assign, 10);
    if (Number.isNaN(idAssign)) return res.status(400).json({ error: "Invalid id_assign" });

    // time_work lưu kiểu varchar → set Y-m-d
    const sql = `
      UPDATE "Project"."Assign"
      SET work_status='IN_PROGRESS',
          project_status='SUCCESS',
          time_work = COALESCE(time_work, TO_CHAR(CURRENT_DATE,'YYYY-MM-DD'))
      WHERE id_assign=$1
      RETURNING *;
    `;
    const result = await pool.query(sql, [idAssign]);
    res.json(result.rows?.[0] ?? {});
  } catch (err) {
    console.error("POST /api/assign/:id_assign/checkin error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Sau khi Save ở ShortcutReport → set WAIT
app.post("/api/assign/:id_assign/report-wait", async (req, res) => {
  try {
    const idAssign = parseInt(req.params.id_assign, 10);
    if (Number.isNaN(idAssign)) return res.status(400).json({ error: "Invalid id_assign" });

    const sql = `
      UPDATE "Project"."Assign"
      SET report_status='WAIT',
          project_status='SUCCESS',
          work_status='WAIT'
      WHERE id_assign=$1
      RETURNING *;
    `;
    const result = await pool.query(sql, [idAssign]);
    res.json(result.rows?.[0] ?? {});
  } catch (err) {

    console.error("POST /api/assign/:id_assign/report-wait error:", err);
    res.status(500).json({ error: err.message });
  }
});






/* ---------------------- START SERVER ---------------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ API chạy tại http://localhost:${PORT}`);
});







