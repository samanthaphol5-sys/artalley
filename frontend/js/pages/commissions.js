// =====================================================================
// pages/commissions.js — งานจ้างวาด: ส่งคำขอ รายการ รายละเอียด
// =====================================================================
pages["commission-new"] = (artistId, tagStr) => {
  const u = meU();
  if (!u) return needLogin();
  const a = artistInfo(+artistId);
  if (!a) return notFound();
  if (a.id === u.id) return `<div class="narrow page"><div class="empty">${t("selfCommission")}</div></div>`;
  if (!canBuy(u)) return `<div class="narrow page"><div class="empty">${t("customerOnly")}</div></div>`;
  if (a.suspended) return `<div class="narrow page"><div class="empty">${t("artistClosed")}</div></div>`;
  const pre = (tagStr || "").split(",").map(Number).filter(Boolean);
  return `<div class="narrow page" style="max-width:760px">${head("", t("newCommission"))}
    <div class="card row" style="margin:1.5rem 0 1rem">${av(a)}<div style="flex:1"><b>${esc(a.name)}</b><div class="xs muted">${t("fromPrice", { p: baht(a.min) })} · ${typesText(a.types)}</div></div><a class="btn line s" href="#/artist/${a.id}">${t("viewProfile")}</a></div>
    ${a.open ? `<form class="card" data-form="new-commission" data-id="${a.id}">
      <div class="field"><label class="f" for="cd">${t("whatYouWant")}</label><textarea id="cd" name="desc" required minlength="20" placeholder="${t("descPh")}"></textarea><div class="hint">${t("min20")}</div></div>
      <div class="two"><div class="field"><label class="f" for="cb">${t("budget")}</label><input type="number" id="cb" name="budget" required min="1" value="${a.min}"></div><div class="field"><label class="f" for="cl">${t("wantBy")}</label><input type="date" id="cl" name="deadline"></div></div>
      <div class="two"><div class="field"><label class="f" for="ca">${t("artType")}</label><select id="ca" name="artType"><option value="">${t("notSet")}</option>${a.types.map((x) => `<option value="${x}">${t(x)}</option>`).join("")}</select></div>
        <div class="field"><label class="f" for="cm">${t("deliveryMethod")}</label><select id="cm" name="delivery"><option value="">${t("notSet")}</option>${["digital_file", "physical_shipping", "pickup"].map((k) => `<option value="${k}">${t("d_" + k)}</option>`).join("")}</select></div></div>
      ${tagFields(pre)}
      <div class="field"><label class="f" for="cr">${t("refImg")}</label><input type="file" id="cr" name="ref" accept="image/*"><div class="hint">${t("refHint")}</div></div>
      <button class="btn">${t("sendRequest")}</button></form>` : `<div class="empty">${t("artistClosed")}</div>`}</div>`;
};

function nextStep(c, id) {
  const isA = c.artist === id, s = db.sketches[c.id];
  if (c.status === "pending") return isA ? (c.quoteStatus === "none" ? "t_quote" : c.quoteStatus === "agreed" ? "t_accept" : "") : c.quoteStatus === "proposed" ? "t_agree" : "";
  if (c.status === "accepted") return isA ? (!s || s.status === "revision_requested" ? "t_sketch" : s.status === "approved" ? "t_ready" : "") : s?.status === "submitted" ? "t_review" : "";
  if (c.status === "delivered" && !isA) return "t_receive";
  if (c.status === "completed" && !isA && !db.reviews[c.id]) return "t_rate";
  return "";
}

function comRow(c, asArtist) {
  const me_ = meU(), o = user(asArtist ? c.customer : c.artist), todo = nextStep(c, me_.id);
  return `<a class="li" href="#/commission/${c.id}">${av(o)}<div style="flex:1;min-width:220px"><div class="row" style="gap:.4rem"><b>${esc(o.name)}</b>${pillStatus(c.status)}${todo ? `<span class="pill warn">${t(todo)}</span>` : ""}</div>
    <div class="sm" style="margin-top:.15rem">${esc(c.desc.slice(0, 90))}${c.desc.length > 90 ? "…" : ""}</div><div class="xs muted">${t("job", { n: c.id })} · ${t("updated", { w: when(c.updated) })}</div></div>
    <div class="sm" style="text-align:right">${c.quote ? `<b>${baht(c.quote)}</b><div class="xs muted">${t("quoted")}</div>` : `${baht(c.budget)}<div class="xs muted">${t("customerBudget")}</div>`}</div></a>`;
}
pages.commissions = () => {
  const u = meU();
  if (!u) return needLogin();
  if (!canBuy(u)) return onlyFor(t("customerOrArtist"));
  const list = db.commissions.filter((c) => c.customer === u.id).sort((a, b) => b.updated - a.updated);
  return `<div class="narrow page">${head("", t("myCommissions"))}${u.role === "artist" ? `<p class="sm" style="margin:.8rem 0 0"><a href="#/dashboard/commissions">${t("myRequests")} →</a></p>` : ""}
    <div class="card" style="padding-block:.3rem;margin-top:1.5rem">${list.map((c) => comRow(c, false)).join("") || `<div class="empty" style="border:0">${t("noCommissions")} · <a href="#/match">${t("findYourArtist")}</a></div>`}</div></div>`;
};

pages.commission = (id) => {
  const u = meU();
  if (!u) return needLogin();
  const c = db.commissions.find((x) => x.id === +id);
  if (!c || (c.customer !== u.id && c.artist !== u.id)) return `<div class="narrow page"><div class="empty">${t("notInJob")}</div></div>`;
  const isA = c.artist === u.id, s = db.sketches[c.id], r = db.reviews[c.id], msgs = db.messages.filter((m) => m.req === c.id);
  const closed = ["declined", "cancelled"].includes(c.status);
  const step = c.status === "completed" ? 6 : c.status === "delivered" ? 5 : c.status === "accepted" ? (s?.status === "approved" ? 4 : 3) : c.quoteStatus === "agreed" ? 2 : 1;
  const st = (v, cls, label, needConfirm, dis) => `<button class="btn ${cls}" data-act="status" data-id="${c.id}" data-v="${v}" ${needConfirm ? `data-confirm="${t("c_" + v)}"` : ""} ${dis ? "disabled" : ""}>${label}</button>`;
  const side = [];
  if (c.status === "pending") side.push(`<div class="card"><h3>${t("price")}</h3>
    ${c.quoteStatus === "none" ? `<p class="sm muted">${t("noQuote")}</p>` : `<div class="price-big">${baht(c.quote)}</div><div class="sm">${t("deliverBy", { d: fmtDate(c.quoteDeadline) })}</div><span class="pill ${c.quoteStatus === "agreed" ? "ok" : "warn"}" style="margin:.5rem 0 1rem">${t(c.quoteStatus === "agreed" ? "agreed" : "waitAgree")}</span>`}
    ${isA ? `<form data-form="quote" data-id="${c.id}"><div class="two" style="gap:.5rem"><div><label class="f" for="qp">${t("price")}</label><input type="number" id="qp" name="price" min="1" required value="${c.quote ?? c.budget}"></div>
        <div><label class="f" for="qd">${t("deliverBy", { d: "" }).trim()}</label><input type="date" id="qd" name="deadline" value="${c.quoteDeadline ?? c.deadline ?? ""}"></div></div>
        <button class="btn line s" style="margin-top:.7rem">${t(c.quoteStatus === "none" ? "sendQuote" : "reQuote")}</button>${c.quoteStatus !== "none" ? `<p class="hint">${t("reQuoteHint")}</p>` : ""}</form>
      <div class="row" style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--line)">${st("accepted", "ok", t("accept"), false, c.quoteStatus !== "agreed")}${st("declined", "line", t("decline"), true)}</div>
      ${c.quoteStatus !== "agreed" ? `<p class="hint">${t("acceptHint")}</p>` : ""}`
    : `<div class="row">${c.quoteStatus === "proposed" ? `<button class="btn ok" data-act="agree" data-id="${c.id}">${t("agreeQuote")}</button>` : ""}${st("cancelled", "line", t("cancelReq"), true)}</div>${c.quoteStatus === "agreed" ? `<p class="hint">${t("waitAccept")}</p>` : ""}`}</div>`);
  if (["accepted", "delivered", "completed"].includes(c.status)) {
    side.push(`<div class="card"><h3>${t("agreedPrice")}</h3><div class="price-big">${baht(c.quote)}</div><div class="sm">${t("dueBy", { d: fmtDate(c.quoteDeadline) })}</div></div>`);
    const SK = { submitted: "warn", revision_requested: "bad", approved: "ok" };
    side.push(`<div class="card"><h3>${t("sketch")}</h3>
      ${s ? `<div class="row between"><span class="pill ${SK[s.status]}">${t("sk_" + s.status)}</span><span class="xs muted">${t("round", { n: s.v })} · ${when(s.at)}</span></div>${privImg(s.img + "?v=" + s.at, `class="sketch" alt="${t("sketch")}"`)}
        ${s.note ? `<p class="sm"><b>${t("artist")}:</b> ${esc(s.note)}</p>` : ""}${s.feedback ? `<p class="sm"><b>${t("customer")}:</b> ${esc(s.feedback)}</p>` : ""}` : `<p class="sm muted">${t(isA ? "skArtistHint" : "skWait")}</p>`}
      ${c.status === "accepted" && isA && (!s || s.status === "revision_requested") ? `<form data-form="sketch" data-id="${c.id}"><div class="field"><label class="f" for="sf">${t("skFile")}</label><input type="file" id="sf" name="file" accept="image/*"><div class="hint">${t("skFileHint")}</div></div>
        <div class="field"><label class="f" for="sn">${t("noteToCustomer")}</label><textarea id="sn" name="note" style="min-height:60px"></textarea></div><button class="btn s">${t("sendSketch")}</button></form>` : ""}
      ${c.status === "accepted" && !isA && s?.status === "submitted" ? `<form data-form="sketch-review" data-id="${c.id}"><div class="field"><label class="f" for="fb">${t("feedback")}</label><textarea id="fb" name="fb" placeholder="${t("feedbackPh")}" style="min-height:60px"></textarea></div>
        <div class="row"><button class="btn ok s" value="approved">${t("approve")}</button><button class="btn line s" value="revision_requested">${t("requestChanges")}</button></div></form>` : ""}</div>`);
  }
  if (c.status === "accepted" && isA) { const ok = s?.status === "approved"; side.push(`<div class="card"><h3>${t("deliverH")}</h3><p class="sm muted">${t(ok ? "deliverReady" : "deliverWait")}</p>${st("delivered", "", t("markDelivered"), true, !ok)}</div>`); }
  if (c.status === "delivered") side.push(isA ? `<div class="card"><h3>${t("waitConfirm")}</h3></div>` : `<div class="card"><h3>${t("gotIt")}</h3>${st("completed", "ok", t("confirmDelivery"), true)}</div>`);
  if (c.status === "completed") side.push(isA ? `<div class="card"><h3>${t("reviewFromCustomer")}</h3>${r ? `${stars(r.rating)}<p>${esc(r.body)}</p>` : `<p class="sm muted">${t("notReviewed")}</p>`}</div>`
    : `<div class="card"><h3>${t(r ? "yourReview" : "rateArtist")}</h3><form data-form="review" data-id="${c.id}"><div class="rate">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="rating" id="st${n}" value="${n}" ${r?.rating === n ? "checked" : ""} required><label for="st${n}" title="${n}">★</label>`).join("")}</div>
        <textarea name="body" placeholder="${t("reviewPh")}" style="min-height:70px;margin:.5rem 0">${esc(r?.body || "")}</textarea><button class="btn s">${t("saveReview")}</button></form></div>`);
  if (closed) side.push(`<div class="card"><p class="muted" style="margin:0">${t("jobClosed")}</p></div>`);
  const steps = ["st_req", "st_price", "st_acc", "st_sk", "st_del", "st_done"];
  return `<div class="narrow page"><a class="sm" href="${isA ? "#/dashboard/commissions" : "#/commissions"}">← ${t(isA ? "tabCommissions" : "allCommissions")}</a>
    <div class="row between" style="margin-top:.5rem"><h1 style="font-size:2.3rem;margin:0">${t("job", { n: c.id })}</h1>${pillStatus(c.status)}</div>
    <p class="sm muted" style="margin:.3rem 0 0">${t("customer")} <b>${esc(user(c.customer).name)}</b> · ${t("artist")} <a href="#/artist/${c.artist}">${esc(user(c.artist).name)}</a> · ${t("youAre", { r: t(isA ? "artist" : "customer").toLowerCase() })}</p>
    ${closed ? "" : `<div class="steps">${steps.map((k, i) => `<span class="${i < step ? "done" : i === step ? "now" : ""}">${t(k)}</span>`).join("")}</div>`}
    <div class="detail comm" style="margin-top:${closed ? "1.5rem" : 0}">
      <div class="stack">
        <div class="card"><h3>${t("details_")}</h3><p>${esc(c.desc)}</p>
          <dl class="facts"><dt>${t("budgetL")}</dt><dd>${baht(c.budget)}</dd><dt>${t("wantBy")}</dt><dd>${fmtDate(c.deadline)}</dd><dt>${t("artType")}</dt><dd>${c.artType ? t(c.artType) : t("notSet")}</dd><dt>${t("deliveryMethod")}</dt><dd>${c.delivery ? t("d_" + c.delivery) : t("notSet")}</dd></dl>
          <div class="chips" style="margin-top:.8rem">${c.tags.map((x) => `<span class="tag">${tn(x)}</span>`).join("")}</div>
          ${c.ref ? `<p class="xs muted" style="margin:1rem 0 .3rem">${t("refPrivate")}</p>${privImg(c.ref, `class="sketch" style="margin:0" alt="${t("refImg")}"`)}` : ""}</div>
        <div class="card"><h3>${t("chat")}</h3><div class="chat" id="chat">${msgs.map((m) => `<div class="bub ${m.by === u.id ? "me" : ""}"><i>${esc(user(m.by).name)} · ${when(m.at)}</i>${esc(m.body)}</div>`).join("") || `<p class="sm muted">${t("chatEmpty")}</p>`}</div>
          ${closed || c.status === "completed" ? `<p class="xs muted" style="margin-top:.6rem">${t("chatClosed")}</p>` : `<form data-form="chat" data-id="${c.id}" class="row" style="margin-top:.8rem;flex-wrap:nowrap;align-items:flex-end"><textarea name="body" required placeholder="${t("typeMsg")}" style="min-height:48px;flex:1" aria-label="${t("typeMsg")}"></textarea><button class="btn">${t("send")}</button></form>`}</div>
      </div>
      <div class="stack">${side.join("")}</div>
    </div></div>`;
};
pages.commission.after = () => { const ch = $("#chat"); if (ch) ch.scrollTop = ch.scrollHeight; };

// ฟอร์มเดียวสำหรับศิลปิน: ชื่อ + ข้อมูลสตูดิโอ + จัดส่ง + โซเชียล (ใช้ในหน้า "บัญชีของฉัน" ที่เดียว)
const studioForm = (u) => { const p = db.profiles[u.id]; return `<form class="card" data-form="settings">
    <div class="row" style="margin-bottom:1rem"><div><b>${esc(u.name)}</b><div class="sm muted">${esc(u.email)}</div></div><span class="pill">${t("role_" + u.role)}</span></div>
    <div class="field"><label class="f" for="pn">${t("displayName")}</label><input type="text" id="pn" name="name" required value="${esc(u.name)}"></div>
    <label class="check" style="margin-bottom:1.2rem"><input type="checkbox" name="open" ${p.open ? "checked" : ""}> ${t("openForCom")}</label>
    <div class="two"><div class="field"><label class="f" for="sm">${t("startPrice")}</label><input type="number" id="sm" name="min" value="${p.min}" min="0"></div><div class="field"><label class="f" for="sc">${t("city")}</label><input type="text" id="sc" name="city" value="${esc(p.city)}"></div></div>
    <div class="field"><label class="f">${t("offersL")}</label><div class="row"><label class="check"><input type="checkbox" name="physical" ${p.physical ? "checked" : ""}> ${t("physical")}</label><label class="check"><input type="checkbox" name="digital" ${p.digital ? "checked" : ""}> ${t("digital")}</label></div></div>
    <div class="field"><label class="f" for="sb">${t("bio")}</label><textarea id="sb" name="bio">${esc(p.bio)}</textarea></div>
    <div style="margin-bottom:1.15rem"><label class="f">${t("specialties")}</label><div class="hint" style="margin:-.2rem 0 .8rem">${t("specialtiesHint")}</div>${tagFields(p.tags)}</div>
    <fieldset class="card" style="background:var(--bg);margin:0 0 1.2rem;border-color:var(--line)"><legend class="f" style="padding:0 .4rem">${t("shipSettings")}</legend>
      <p class="hint" style="margin:0 0 .8rem">${t("shipSettingsHint")}</p>
      ${(() => { const sh = shipOf(u.id); return `<div class="two">
        <div class="field"><label class="f" for="sp">${t("prepL")}</label><input type="number" id="sp" name="sh_prep" min="1" max="60" required value="${sh.prep}"></div>
        <div class="field"><label class="f" for="sf">${t("shipFeeL")}</label><input type="number" id="sf" name="sh_fee" min="0" required value="${sh.fee}"></div>
        <div class="field"><label class="f" for="st1">${t("transitMin")}</label><input type="number" id="st1" name="sh_min" min="1" max="30" required value="${sh.min}"></div>
        <div class="field"><label class="f" for="st2">${t("transitMax")}</label><input type="number" id="st2" name="sh_max" min="1" max="30" required value="${sh.max}"></div>
        <div class="field" style="margin:0"><label class="f" for="sr">${t("returnDaysL")}</label><input type="number" id="sr" name="sh_ret" min="0" max="60" required value="${sh.returns}"></div></div>`; })()}
    </fieldset>
    <div class="field"><label class="f">${t("socialLinks")}</label><div class="two">${SOCIALS.map(([k, l]) => `<input type="text" name="s_${k}" value="${esc(p.social?.[k] || "")}" placeholder="${l}" aria-label="${l}">`).join("")}</div><div class="hint">${t("socialHint")}</div></div>
    <button class="btn">${t("saveProfile")}</button></form>`; };
const coverCard = (u) => { const c = db.profiles[u.id]?.cover; return `<div class="card"><h3>${t("coverPic")}</h3><div class="cover-prev">${c ? `<img src="${c}" alt="">` : ""}</div>
    <div class="row" style="margin-top:.8rem"><label class="btn s" for="cover-file" style="cursor:pointer">${t(c ? "changeCover" : "uploadCover")}</label>${c ? `<button class="btn line s" data-act="cover-remove">${t("removeCover")}</button>` : ""}</div>
    <input type="file" id="cover-file" accept="image/*" class="hide"><p class="hint" style="margin:.6rem 0 0">${t("coverHint")}</p></div>`; };
