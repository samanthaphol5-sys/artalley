// เชื่อมต่อ MySQL ด้วย connection pool
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "artalley",
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: ["DATE"], // คอลัมน์ DATE เป็นข้อความ "2026-12-01" ส่วน DATETIME เป็น Date
  decimalNumbers: true,
  charset: "utf8mb4",
});

module.exports = pool;
