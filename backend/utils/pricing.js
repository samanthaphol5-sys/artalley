// คำนวณราคาให้ตรงกับหน้าเว็บ (ฝั่งเซิร์ฟเวอร์คำนวณเองเสมอ ไม่เชื่อราคาจากเบราว์เซอร์)
const FRAME_FEE = 450;

const effectivePrice = (a) => Math.round(Number(a.price) * (1 - (a.sale_percent || 0) / 100));

// ตัวเลือกของแต่ละผลงาน: งานวาดมือ = กรอบรูป, งานดิจิทัล = สิทธิ์การใช้งาน
function optionsFor(a) {
  const eff = effectivePrice(a);
  return a.format === "physical"
    ? { none: 0, oak: FRAME_FEE, black: FRAME_FEE }
    : { personal: 0, commercial: Math.round(eff * 1.5) };
}

function linePrice(a, optionKey) {
  const opts = optionsFor(a);
  if (!(optionKey in opts)) return null;
  return effectivePrice(a) + opts[optionKey];
}

module.exports = { effectivePrice, optionsFor, linePrice, FRAME_FEE };
