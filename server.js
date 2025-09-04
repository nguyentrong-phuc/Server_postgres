//server.js
import express from "express";
import pkg from "pg";
import cors from "cors";

const { Pool } = pkg;
const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: "raitek.cloud",
  port: 5432,
  user: "mtryha11",
  password: "Hpx21led",
  database: "IOTdev",
  ssl: false  // ✅ buộc không dùng SSL
//   ssl: { rejectUnauthorized: false }
});

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

// Lấy danh sách project
app.get("/api/projects", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "Project".project LIMIT 20`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

// Lấy danh sách task
app.get("/api/tasks", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "Project".task LIMIT 20`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

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

app.get("/", (req, res) => {
  res.send("Backend API is running...");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API chạy tại http://localhost:${PORT}`);
});


