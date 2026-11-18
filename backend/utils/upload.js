// อัปโหลดรูปภาพ เก็บใน backend/uploads/<โฟลเดอร์>
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const { HttpError } = require("./helpers");

const UPLOAD_ROOT = path.join(__dirname, "..", "uploads");
const ALLOWED = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };

// folder: artworks | avatars | covers | references | sketches | reviews
function imageUpload(folder) {
  const dir = path.join(UPLOAD_ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ALLOWED[file.mimetype]}`),
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => (ALLOWED[file.mimetype] ? cb(null, true) : cb(new HttpError(400, "รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ GIF"))),
  });
}

const storedPath = (folder, file) => (file ? `${folder}/${file.filename}` : null);
const absolutePath = (stored) => path.join(UPLOAD_ROOT, stored);
const isDemoFile = (stored) => /\/demo-/.test(stored || "");
function removeFile(stored) {
  if (!stored || isDemoFile(stored)) return; // ไม่ลบไฟล์ตัวอย่าง
  fs.promises.unlink(absolutePath(stored)).catch(() => {});
}

module.exports = { imageUpload, storedPath, absolutePath, removeFile, UPLOAD_ROOT };
