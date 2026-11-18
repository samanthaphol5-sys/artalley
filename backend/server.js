// =====================================================================
// Art Alley backend (Node.js + Express + MySQL)
// รัน: npm install แล้ว npm start -> เปิด http://localhost:3000
// =====================================================================
require("dotenv").config();
const express = require("express");
const path = require("path");
const multer = require("multer");
const pool = require("./config/db");

const app = express();
app.use(express.json({ limit: "1mb" }));

// ---------- API ----------
app.use("/api", require("./routes/auth"));          // /api/state, /api/auth/*
app.use("/api/me", require("./routes/me"));
app.use("/api/artworks", require("./routes/artworks"));
app.use("/api/artists", require("./routes/artists"));
app.use("/api", require("./routes/shop"));          // /api/cart, /api/checkout, /api/orders
app.use("/api/commissions", require("./routes/commissions"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/admin", require("./routes/admin"));
app.get("/api/health", async (req, res) => {
  try { await pool.query("SELECT 1"); res.json({ ok: true }); } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.use("/api", (req, res) => res.status(404).json({ error: "ไม่พบ API นี้" }));

// ---------- ไฟล์สาธารณะ ----------
// รูปอ้างอิงและสเก็ตช์งานจ้างเป็นไฟล์ส่วนตัว โหลดผ่าน API เท่านั้น
for (const dir of ["artworks", "avatars", "covers", "reviews"]) {
  app.use(`/uploads/${dir}`, express.static(path.join(__dirname, "uploads", dir)));
}
// ---------- หน้าเว็บ ----------
app.use(express.static(path.join(__dirname, "..", "frontend")));

// ---------- error ----------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: err.code === "LIMIT_FILE_SIZE" ? "ไฟล์ใหญ่เกิน 10 MB" : err.message });
  if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "ข้อมูลนี้มีอยู่แล้ว" });
  if (err.code === "ER_CHECK_CONSTRAINT_VIOLATED") return res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง" });
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json(status === 500 ? { error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" } : { error: err.message, code: err.code, reason: err.reason });
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, async () => {
  console.log(`Art Alley กำลังทำงานที่ http://localhost:${PORT}`);
  try {
    await pool.query("SELECT 1");
    console.log("เชื่อมต่อ MySQL สำเร็จ");
  } catch (e) {
    console.error("เชื่อมต่อ MySQL ไม่ได้:", e.message);
    console.error("ตรวจไฟล์ backend/.env และรัน db/schema.sql กับ db/seed.sql ใน MySQL Workbench ก่อน");
  }
});
