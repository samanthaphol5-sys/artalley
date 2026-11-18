// =====================================================================
// pages/artwork.js — หน้าสินค้า: แกลเลอรีหลายรูป กล่องซื้อ รีวิว แท็บรายละเอียด
// =====================================================================
let pending = { opt: "", note: "" }, galleryIdx = 0, galleryFor = 0, descOpen = false, noteOpen = false, rvFilter = "all", rvSort = "suggested", rvAll = false, ptab = "about";
pages.artwork = (id) => {
  const a = artwork(+id), u = meU();
  if (!a || (!visible(a) && !(u && (u.id === a.artist || u.role === "admin")))) return notFound();
  if (galleryFor !== a.id) { galleryFor = a.id; pending = { opt: "", note: "" }; galleryIdx = 0; descOpen = false; noteOpen = false; rvFilter = "all"; rvSort = "suggested"; rvAll = false; ptab = "about"; }
  const ar = artistInfo(a.artist), mine = u && u.id === a.artist;
  const fav = u && db.favorites.some(([x, y]) => x === u.id && y === a.id);
  const favN = a.favCount;
  const sale = a.purpose === "for_sale", inCart = cart().includes(a.id);
  const gal = gallery(a), gi = Math.min(galleryIdx, gal.length - 1);
  const carts = a.inCarts;
  const od = optionDef(a), co = cartOpt(a);
  const comments = db.comments.filter((c) => c.art === a.id).sort((x, y) => y.at - x.at);

  // ---------- buy box ----------
  let action = "";
  if (mine) action = `<p class="sm muted">${t("ownArt")}</p><a class="btn big full" href="#/artwork-form/${a.id}">${t("editArtwork")}</a>`;
  else if (!sale) action = `<span class="pill">${t("portfolioNote")}</span>${ar.open && canBuy(u) && !ar.suspended ? `<p class="sm" style="margin:1rem 0 .6rem">${t("portfolioCta")}</p><a class="btn big" href="#/commission-new/${ar.id}/${a.tags.join(",")}">${t("commissionMe")}</a>` : ""}`;
  else if (!canBuy(u)) action = `<span class="pill">${t("customerOnlyShort")}</span>`;
  else if (a.avail !== "available") action = `<span class="pill warn">${t(a.avail)}</span>`;
  else action = `
    <div class="field"><label class="f" for="popt">${t(od.key)}</label>
      <select id="popt" data-act="pick-opt" data-id="${a.id}">${inCart ? "" : `<option value="">${t("selectOption")}</option>`}${od.choices.map(([v, , label]) => `<option value="${v}" ${(inCart ? co.opt : pending.opt) === v ? "selected" : ""}>${label()}</option>`).join("")}</select></div>
    ${noteOpen || co.note || pending.note ? `<div class="field"><label class="f" for="pnote">${t("addNote")} <span class="muted" style="text-transform:none">${t("optional")}</span></label><textarea id="pnote" maxlength="300" placeholder="${t("notePh")}" style="min-height:70px">${esc(inCart ? co.note : pending.note)}</textarea></div>`
      : `<button class="plink" data-act="note-open">＋ ${t("addNote")} <span class="muted" style="font-weight:400">${t("optional")}</span></button>`}
    <div class="field" style="margin-top:.8rem"><label class="f" for="pqty">${t("quantity")}</label><select id="pqty" disabled><option>1</option></select>
      <div class="hint">${a.format === "physical" ? t("oneOfAKind") : t("qtyDigital")}</div></div>
    ${inCart ? `<div class="stack"><span class="pill ok">✓ ${t("inCart")}</span><a class="btn big" href="#/cart">${t("viewCart")}</a></div>`
      : `<div class="stack"><button class="btn big" data-act="add-cart" data-id="${a.id}">${t("addToCart")}</button><button class="btn line full" data-act="buy-now" data-id="${a.id}">${t("buyNow")}</button></div>`}
    ${u ? "" : `<p class="xs muted" style="margin:.8rem 0 0">🔒 ${t("loginToBuyHint")}</p>`}`;
  const sh = shipOf(a.artist);
  const dayStr = (d) => new Date(Date.now() + d * 864e5).toLocaleDateString(locale(), { day: "numeric", month: "short" });
  const arrive = dayStr(sh.prep + sh.min) + "–" + dayStr(sh.prep + sh.max);
  const shipRows = (withArrive) => `<div><b>${t("returnsL")}</b><span>${a.format === "physical" ? (sh.returns ? t("returnsPhys", { n: sh.returns }) : t("noReturns")) : t("returnsDig")}</span></div>
      <div><b>${t("costToShip")}</b><span>${a.format === "physical" ? (sh.fee ? t("shipTH", { p: baht(sh.fee) }) : t("freeShip")) : t("noShip")}</span></div>
      ${a.format === "physical" ? `<div><b>${t("prepTime")}</b><span>${t("prepDays", { n: sh.prep })} · ${t("transit", { a: sh.min, b: sh.max })}</span></div>${withArrive ? `<div><b>${t("arrives")}</b><span>${arrive}</span></div>` : ""}<div><b>${t("shipsFromL")}</b><span>${esc(ar.city)}</span></div>` : ""}`;
  const buybox = `<aside class="buybox">
    ${sale && carts ? `<div class="hot">${carts >= 20 ? t("inCartsMany") : t("inCarts", { n: carts })}</div>` : ""}
    ${sale ? `<div class="row" style="gap:.2rem;align-items:baseline"><span class="now">${baht(eff(a))}${a.format === "physical" ? "" : ""}</span>${a.sale ? `<s>${baht(a.price)}</s>` : ""}</div>
      ${a.sale ? `<div class="deal">${t("offPct", { n: a.sale })} · ${t("limitedSale")}</div>` : ""}<div class="xs muted" style="margin-bottom:1.1rem">${t("taxIncl")}</div>` : ""}
    ${action}
    ${sale ? `<h3 style="margin:1.5rem 0 0">${t("policies")}</h3><div class="policy">
      ${shipRows(true)}</div>` : ""}
  </aside>`;

  // ---------- reviews ----------
  const all = db.artReviews.filter((r) => r.art === a.id);
  const avg = all.length ? all.reduce((x, r) => x + r.rating, 0) / all.length : 0;
  const sub = (cat) => { const l = all.filter((r) => r.cats.includes(cat)); return (l.length ? l.reduce((x, r) => x + r.rating, 0) / l.length : avg).toFixed(1); };
  const rec = all.length ? Math.round((all.filter((r) => r.rating >= 4).length / all.length) * 100) : 0;
  const cats = ["appearance", "quality", "shipping", "description", "service", "value"].map((c) => [c, all.filter((r) => r.cats.includes(c)).length]).filter(([, n]) => n);
  let list = all.filter((r) => rvFilter === "all" || r.cats.includes(rvFilter));
  list.sort((x, y) => rvSort === "newest" ? y.at - x.at : rvSort === "high" ? y.rating - x.rating || y.at - x.at : rvSort === "low" ? x.rating - y.rating : (y.photo ? 1 : 0) - (x.photo ? 1 : 0) || y.at - x.at);
  const shown = rvAll ? list : list.slice(0, 3);
  const photos = all.filter((r) => r.photo);
  const bought = u && db.orders.some((o) => o.buyer === u.id && o.status === "completed" && o.items.some((i) => i.art === a.id));
  const reviewed = u && all.some((r) => r.by === u.id);
  const reviewsSec = `<section class="sec" id="reviews"><h2>${t("reviewsFor")}</h2>
    ${all.length ? `<div class="says"><b style="font-weight:600">${t("buyersSay")}</b>${cats.slice(0, 5).map(([c]) => `<span>${t("rc_" + c)}</span>`).join("")}</div>
    <div class="rv-head">
      <div class="rv-big">${avg.toFixed(1)} <span class="stars" style="font-size:1.6rem">★</span><div class="xs muted" style="line-height:1.3"><u>${t("itemAvg")}</u><br>(${t("nReviews", { n: all.length })})</div></div>
      ${["quality", "shipping", "service"].map((c) => `<div class="score"><span class="ring">${sub(c)}</span>${t("sc_" + c)}</div>`).join("")}
      <div class="score"><span class="ring">${rec}%</span>${t("sc_recommend")}</div>
    </div>
    <div class="row between" style="gap:.8rem">
      <div class="chiprow"><button data-act="rv-filter" data-v="all" class="${rvFilter === "all" ? "on" : ""}">${t("allReviews")} (${all.length})</button>${cats.map(([c, n]) => `<button data-act="rv-filter" data-v="${c}" class="${rvFilter === c ? "on" : ""}">${t("rc_" + c)} (${n})</button>`).join("")}</div>
      <select data-act="rv-sort" style="width:auto;min-width:170px" aria-label="sort">${[["suggested", "sortSuggested"], ["newest", "sortNewest"], ["high", "sortHigh"], ["low", "sortLow"]].map(([v, k]) => `<option value="${v}" ${rvSort === v ? "selected" : ""}>${t(k)}</option>`).join("")}</select>
    </div>
    <div>${shown.map((r) => { const who = r.by ? user(r.by) : { id: r.id, name: r.name, avatar: null };
      return `<div class="rv"><div><span class="stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span> <b>${r.rating}</b><span class="badge">${t("thisItem")}</span>
        <p style="margin:.35rem 0 0">${esc(r.body)}</p>${r.photo ? `<img src="${r.photo}" alt="">` : ""}</div>
        <div class="who">${av(who, "xs")}<b>${esc(who.name)}</b><span class="muted">| ${new Date(r.at).toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" })}</span></div></div>`; }).join("")}</div>
    ${list.length > 3 ? `<div style="text-align:center;margin-top:1.2rem"><button class="btn line" data-act="rv-all">${rvAll ? t("viewLess") : t("viewAllReviews", { n: list.length })}</button></div>` : ""}
    ${photos.length ? `<h3 style="margin:2rem 0 .8rem">${t("photosFromReviews")}</h3><div class="rphotos">${photos.map((r) => `<img src="${r.photo}" alt="">`).join("")}</div>` : ""}`
    : `<p class="muted">${t("noItemReviews")}</p>`}
    ${bought && !reviewed ? `<form class="card" data-form="art-review" data-id="${a.id}" style="margin-top:1.5rem;max-width:640px"><h3>${t("writeReview")}</h3><p class="sm muted">${t("youBought")}</p>
      <div class="rate">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="rating" id="ar${n}" value="${n}"><label for="ar${n}" title="${n}">★</label>`).join("")}</div>
      <textarea name="body" placeholder="${t("reviewPh")}" style="margin:.6rem 0"></textarea>
      <div class="field"><label class="f">${t("reviewTopics")}</label><div class="chips">${["appearance", "quality", "shipping", "description", "service", "value"].map((c) => `<label class="chip"><input type="checkbox" name="cat" value="${c}">${t("rc_" + c)}</label>`).join("")}</div></div>
      <div class="field"><label class="f" for="arp">${t("addPhoto")}</label><input type="file" id="arp" name="photo" accept="image/*"></div>
      <button class="btn">${t("postReview")}</button></form>` : ""}
  </section>`;

  const more = ar.arts.filter((x) => x.id !== a.id).slice(0, 4);
  return `<div class="wrap page">
    ${a.hidden ? `<div class="note bad">${t("hiddenByAdmin")}</div>` : ""}${a.status !== "published" ? `<div class="note">${t("notPublished")}</div>` : ""}
    <div class="product">
      <div>
        <div class="gallery" ${gal.length < 2 ? 'style="grid-template-columns:1fr"' : ""}>
          <div class="thumbs" ${gal.length < 2 ? 'style="display:none"' : ""}>${gal.map(([src, k], i) => `<button data-act="gal" data-v="${i}" class="${i === gi ? "on" : ""}" aria-label="${galCap(k, i)}"><img src="${src}" alt=""></button>`).join("")}</div>
          <div class="stage">
            <img src="${gal[gi][0]}" alt="${esc(a.title)} — ${galCap(gal[gi][1], gi)}">
            ${a.best ? `<span class="best">🏅 ${t("bestseller")}</span>` : ""}
            ${canBuy(u) && !(u && u.id === a.artist) ? `<button class="heart" data-act="fav" data-id="${a.id}" aria-pressed="${!!fav}" aria-label="${t(fav ? "savedOn" : "saveIt")}">${icon("heart")}</button>` : ""}
            ${gal.length > 1 ? `<button class="nav-arrow prev" data-act="gal" data-v="${(gi - 1 + gal.length) % gal.length}" aria-label="${t("prevImg")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>` : ""}
            ${gal.length > 1 ? `<button class="nav-arrow next" data-act="gal" data-v="${(gi + 1) % gal.length}" aria-label="${t("nextImg")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></button>` : ""}
            <span class="cap">${gi + 1} / ${gal.length}${gal[gi][1] ? " · " + t(gal[gi][1]) : ""}</span>
          </div>
        </div>
        ${!mine ? `<div style="text-align:right;margin-top:.8rem"><details class="box" style="display:inline-block;text-align:left;max-width:420px"><summary class="sm">⚑ ${t("reportItem")}</summary><form data-form="report" data-id="${a.id}" style="margin-top:.8rem">
          <div class="field"><select name="reason" required aria-label="${t("reason")}"><option value="">${t("reason")}</option>${["inappropriate", "copyright", "spam", "other"].map((k) => `<option value="${k}">${t("r_" + k)}</option>`).join("")}</select></div>
          <div class="field"><textarea name="details" placeholder="${t("details")}" style="min-height:60px"></textarea></div><button class="btn bad s">${t("sendReport")}</button></form></details></div>` : ""}
      </div>
      <div class="pinfo stack">
        <div><h1 class="ptitle">${esc(a.title)}</h1>
          <div class="seller-line">${av(ar, "xs")}<a href="#/artist/${ar.id}">${esc(ar.name)}</a>${ar.rating ? `<span class="stars">${"★".repeat(Math.round(ar.rating))}</span>` : ""}
            ${!mine ? `<button class="btn line s" data-act="contact" data-id="${ar.id}" data-art="${a.id}">✉ ${t("messageArtist")}</button>` : ""}
            ${!mine && canBuy(u) ? `<button class="btn line s" data-act="follow" data-id="${ar.id}">${db.follows.some(([f, x]) => f === u?.id && x === ar.id) ? "✓ " + t("following") : "+ " + t("follow")}</button>` : ""}</div></div>
        <div><h3>${t("highlights")}</h3><ul class="hl">${a.format === "physical" ? `<li>${t("hl_handmade")}</li><li>${t("hl_original")}</li>` : `<li>${t("hl_digital")}</li><li>${t("hl_instant")}</li>`}<li>${a.tags.map(tn).join(" · ")}</li></ul></div>
        <div><h3>${t("sellerDesc")}</h3><p class="${descOpen ? "" : "clamp"}" style="white-space:pre-line">${esc(a.desc)}\n\n${esc(ar.bio)}</p>
          <button class="btn line s" data-act="desc-toggle">${descOpen ? t("viewLess") : t("viewMore")}</button></div>
        ${!mine && ar.open && canBuy(u) ? `<a href="#/commission-new/${ar.id}/${a.tags.join(",")}" class="sm">${t("commissionLike", { a: esc(ar.name) })} →</a>` : ""}
        <p class="xs muted" style="margin:0">♡ ${t("nSaved", { n: favN })}</p>
      </div>
      ${buybox}
    </div>
    ${reviewsSec}
    </div>
    <div class="ptabs"><div class="wrap">
      <div class="tabs">${[["about", "tabAbout"], ["shipping", "tabShipping"]].map(([k, l]) => `<button data-act="ptab" data-v="${k}" class="${ptab === k ? "on" : ""}">${t(l)}</button>`).join("")}</div>
      ${ptab === "about" ? `<div class="detail" style="grid-template-columns:1fr 1fr 1fr;gap:2rem">
        <img src="${a.img}" alt="" style="border-radius:16px;background:var(--surface);aspect-ratio:1;object-fit:cover;width:100%">
        <div><h2>${t("sellerDesc")}</h2><p class="sm" style="white-space:pre-line">${esc(a.desc)}\n\n${esc(ar.bio)}</p></div>
        <div><h2>${t("specs")}</h2><table class="specs"><tbody>
          <tr><td>${t("madeBy")}</td><td><a href="#/artist/${ar.id}">${esc(ar.name)}</a></td></tr><tr><td>${t("format")}</td><td>${t(a.format)}</td></tr>
          <tr><td>${t("styleTags")}</td><td>${a.tags.map(tn).join(", ")}</td></tr><tr><td>${t("listed")}</td><td>${fmtDate(a.created)}</td></tr><tr><td>${t("favoritesN")}</td><td>${favN}</td></tr>
        </tbody></table></div></div>`
      : `<div style="max-width:720px;margin:0 auto"><div class="policy" style="background:var(--surface)">
          ${shipRows(true)}</div>
          <p class="sm" style="margin-top:1rem">${a.format === "physical" ? t("shipPolicyPhys", { p: sh.prep, a: sh.min, b: sh.max }) : t("shipPolicyDig")}</p></div>`}
    </div></div>
    <div class="wrap">
      ${more.length ? `<section class="sec"><div class="sec-h"><h2>${t("moreFrom", { a: esc(ar.name) })}</h2><a href="#/artist/${ar.id}">${t("visitShop")}</a></div><div class="works">${more.map(workCard).join("")}</div></section>` : ""}
      <section class="sec" style="max-width:720px"><h2>${t("questions")} (${comments.length})</h2>
        ${u ? `<form data-form="comment" data-id="${a.id}" class="row" style="align-items:flex-end;flex-wrap:nowrap;margin-bottom:.5rem"><textarea name="body" required placeholder="${t("writeComment")}" style="min-height:52px;flex:1" aria-label="${t("writeComment")}"></textarea><button class="btn">${t("send")}</button></form>` : `<p class="sm muted"><a href="#/login">${t("signIn")}</a> — ${t("signInTo")}</p>`}
        ${comments.map((c) => { const cu = user(c.by), del = u && (u.id === c.by || u.id === a.artist || u.role === "admin");
          return `<div class="li">${av(cu, "s")}<div style="flex:1"><b class="sm">${esc(cu.name)}</b> <span class="xs muted">${when(c.at)}</span><div>${esc(c.body)}</div></div>${del ? `<button class="btn ghost s" data-act="del-comment" data-id="${c.id}">${t("delete")}</button>` : ""}</div>`; }).join("") || `<p class="muted">${t("noComments")}</p>`}
      </section>
    </div>`;
};
