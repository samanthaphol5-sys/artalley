// ฟังก์ชันช่วยที่ใช้ร่วมกันทุก route

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ห่อ async route ให้ส่ง error ไปที่ error handler อัตโนมัติ
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const toInt = (v) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

const toNumber = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const str = (v, max) => {
  const s = typeof v === "string" ? v.trim() : "";
  return max ? s.slice(0, max) : s;
};

// รับ tagIds ได้ทั้งแบบ array, "1,2,3" หรือ JSON string
const parseIdList = (v) => {
  if (v === undefined || v === null || v === "") return [];
  let arr = v;
  if (typeof v === "string") {
    try {
      arr = v.trim().startsWith("[") ? JSON.parse(v) : v.split(",");
    } catch {
      arr = v.split(",");
    }
  }
  if (!Array.isArray(arr)) arr = [arr];
  return [...new Set(arr.map(toInt).filter((n) => n !== null && n > 0))];
};

const isDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

const bool = (v) => v === true || v === 1 || v === "1" || v === "true" || v === "on";

module.exports = { HttpError, asyncHandler, toInt, toNumber, str, parseIdList, isDate, bool };
