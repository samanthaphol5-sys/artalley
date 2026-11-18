// =====================================================================
// pages/shop.js — ตะกร้า ชำระเงิน คำสั่งซื้อ
// =====================================================================
pages.cart = () => {
  if (!meU()) return needLogin();
  if (!canBuy(meU())) return `<div class="narrow page"><div class="empty">${t("customerOnly")}<p>${lang === "th" ? "สลับหรือสร้างบัญชีลูกค้าเพื่อซื้อหรือจ้างศิลปิน" : "Switch to or create a Customer profile to buy or commission."}</p><a class="btn" href="#/account">${lang === "th" ? "จัดการบัญชี" : "Manage accounts"}</a></div></div>`;
  const items = cart().map(artwork).filter(Boolean);
  if (!items.length) return `<div class="narrow page">${head("", t("cartTitle"))}<div class="empty">${t("cartEmpty")}<br><br><a class="btn" href="#/explore">${t("explore")}</a></div></div>`;
  const ok = items.filter(buyable);
  const groups = [...new Set(ok.map((a) => a.artist))];
  const sub = ok.reduce((s, a) => s + linePrice(a), 0);
  const ship = groups.filter((g) => ok.some((a) => a.artist === g && a.format === "physical")).reduce((x, g) => x + shipOf(g).fee, 0);
  return `<div class="narrow page">${head("", t("cartTitle"))}
    <div class="detail comm" style="margin-top:1.5rem">
      <div class="card" style="padding-block:.3rem">${items.map((a) => `<div class="li" style="align-items:center">
        <img class="thumb" src="${a.img}" alt=""><div style="flex:1;min-width:160px"><a href="#/artwork/${a.id}" style="color:var(--ink)">${esc(a.title)}</a>
        <div class="xs muted">${t("fromArtist", { a: esc(user(a.artist).name) })} · ${t(a.format)} · ${t(optionDef(a).key)}: ${optLabel(a, cartOpt(a).opt)}</div>${cartOpt(a).note ? `<div class="xs muted">“${esc(cartOpt(a).note)}”</div>` : ""}${buyable(a) ? "" : `<span class="pill bad">${t("unavailableItem")}</span>`}</div>
        <b>${baht(linePrice(a))}</b><button class="btn ghost s" data-act="rm-cart" data-id="${a.id}">${t("remove")}</button></div>`).join("")}</div>
      <div class="card stack" style="align-self:start"><div class="sum">
        <span>${t("subtotal")}</span><span>${baht(sub)}</span><span>${t("shipping")}</span><span>${baht(ship)}</span>
        <span class="total">${t("total")}</span><span class="total">${baht(sub + ship)}</span></div>
        <p class="xs muted" style="margin:0">${t("platformFee")}</p>
        <a class="btn full" href="#/checkout" ${ok.length ? "" : 'aria-disabled="true" style="pointer-events:none;opacity:.45"'}>${t("checkout")}</a></div>
    </div></div>`;
};

pages.checkout = () => {
  const u = meU();
  if (!u) return needLogin();
  if (!canBuy(u)) return redirect("#/cart");
  const ok = cart().map(artwork).filter(buyable);
  if (!ok.length) { setTimeout(() => go("#/cart")); return ""; }
  const groups = [...new Set(ok.map((a) => a.artist))];
  const hasPhys = ok.some((a) => a.format === "physical");
  const sub = ok.reduce((s, a) => s + linePrice(a), 0);
  const ship = groups.filter((g) => ok.some((a) => a.artist === g && a.format === "physical")).reduce((x, g) => x + shipOf(g).fee, 0);
  return `<div class="narrow page">${head("", t("checkoutTitle"))}
    <form data-form="checkout" class="detail comm" style="margin-top:1.5rem">
      <div class="stack">
        <div class="card"><h3>${t("shipTo")}</h3>${hasPhys ? `
          <div class="two"><div class="field"><label class="f" for="cn">${t("fullName")}</label><input type="text" id="cn" name="name" required value="${esc(u.name)}"></div>
          <div class="field"><label class="f" for="cp">${t("phone")}</label><input type="tel" id="cp" name="phone" required value="081-234-5678"></div></div>
          <div class="field"><label class="f" for="ca">${t("address")}</label><textarea id="ca" name="addr" required>99/1 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110</textarea></div>` : `<p class="sm muted" style="margin:0">${t("digitalOnlyNote")}</p>`}</div>
        <div class="card"><h3>${t("payMethod")}</h3><div class="chips"><label class="chip"><input type="radio" name="pay" value="promptpay" checked>${t("promptpay")}</label><label class="chip"><input type="radio" name="pay" value="card">${t("card")}</label></div>
          <p class="xs muted" style="margin:.8rem 0 0">${t("demoPay")}</p></div>
      </div>
      <div class="card stack" style="align-self:start">
        ${groups.map((g) => `<div><span class="eyebrow nm">${esc(user(g).name)}</span>${ok.filter((a) => a.artist === g).map((a) => `<div class="row between sm"><span>${esc(a.title)} <span class="muted xs">· ${optLabel(a, cartOpt(a).opt)}</span></span><span>${baht(linePrice(a))}</span></div>`).join("")}</div>`).join("")}
        <div class="sum"><span>${t("subtotal")}</span><span>${baht(sub)}</span><span>${t("shipping")}</span><span>${baht(ship)}</span><span class="total">${t("total")}</span><span class="total">${baht(sub + ship)}</span></div>
        ${groups.length > 1 ? `<p class="xs muted" style="margin:0">${t("splitNote")}</p>` : ""}
        <button class="btn full">${t("placeOrder")}</button></div>
    </form></div>`;
};

function orderTotal(o) { return o.items.reduce((s, i) => s + i.price, 0) + o.shipping; }
const ORDER_CLS = { paid: "warn", shipped: "wine", completed: "ok" };
pages.orders = () => {
  const u = meU();
  if (!u) return needLogin();
  if (!canBuy(u)) return onlyFor(t("customerOrArtist"));
  const list = db.orders.filter((o) => o.buyer === u.id).sort((a, b) => b.at - a.at);
  return `<div class="narrow page">${head("", t("ordersTitle"))}${u.role === "artist" ? `<p class="sm" style="margin:.8rem 0 0"><a href="#/dashboard/orders">${t("mySales")} →</a></p>` : ""}
    ${list.map((o) => `<div class="card" style="margin-top:1rem">
      <div class="row between"><div><b>${t("order")} #${o.id}</b> <span class="xs muted">· ${esc(user(o.artist).name)} · ${when(o.at)}</span></div><span class="pill ${ORDER_CLS[o.status]}">${t("o_" + o.status)}</span></div>
      ${o.items.map((i) => { const a = artwork(i.art); return `<div class="li" style="align-items:center"><img class="thumb" src="${a.img}" alt=""><div style="flex:1"><a href="#/artwork/${a.id}" style="color:var(--ink)">${esc(a.title)}</a><div class="xs muted">${t(i.format)} · ${optLabel(a, i.opt)}</div>${i.note ? `<div class="xs muted">${t("noteFromBuyer")}: “${esc(i.note)}”</div>` : ""}</div><span>${baht(i.price)}</span>
        ${i.format === "digital" ? `<button class="btn line s" data-act="dl" data-id="${a.id}" data-order="${o.id}">${t("download")}</button>` : ""}</div>`; }).join("")}
      <div class="row between sm" style="margin-top:.6rem"><span class="muted">${o.shipping ? `${t("shipping")} ${baht(o.shipping)} · ` : ""}${t("total")} <b style="color:var(--ink)">${baht(orderTotal(o))}</b></span>
        ${o.status === "paid" && o.address ? `<span class="muted">${t("waitShip")}</span>` : ""}
        ${o.status === "shipped" ? `<span>${t("tracking")} <b>${esc(o.tracking)}</b></span><button class="btn ok s" data-act="received" data-id="${o.id}">${t("confirmReceived")}</button>` : ""}</div>
    </div>`).join("") || `<div class="empty" style="margin-top:1.5rem">${t("noOrders")}<br><br><a class="btn" href="#/explore">${t("explore")}</a></div>`}</div>`;
};
