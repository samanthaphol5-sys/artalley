// =====================================================================
// pages/artists.js — ค้นหาศิลปิน โปรไฟล์ศิลปิน (รูปปก) หาศิลปินที่ใช่
// =====================================================================
pages.artists = () => `<div class="narrow page">${head("", t("artistSearchTitle"), t("artistSearchLead"))}
  <div class="row" style="margin:1.5rem 0"><input type="search" id="aq" placeholder="${t("searchArtists")}" style="max-width:360px" aria-label="${t("searchArtists")}"><label class="check sm"><input type="checkbox" id="aopen"> ${t("openOnly")}</label></div>
  <div id="alist"></div></div>`;
pages.artists.after = () => {
  const run = () => {
    const q = $("#aq").value.trim().toLowerCase();
    const list = artists().filter((a) => (!q || (a.name + a.city + a.bio + a.tags.map((x) => tagById(x).th + tagById(x).en).join(" ")).toLowerCase().includes(q)) && (!$("#aopen").checked || a.open));
    $("#alist").innerHTML = list.map((a) => artistRow(a)).join("") || `<div class="empty">${t("noArtists")}</div>`;
  };
  $("#aq").oninput = run; $("#aopen").onchange = run; run();
};

pages.artist = (id) => {
  const a = artistInfo(+id);
  if (!a) return notFound();
  if (a.suspended && meU()?.role !== "admin") return `<div class="narrow page"><div class="empty">${t("artistSuspendedPage")}</div></div>`;
  const u = meU(), mine = u && u.id === a.id;
  const following = u && db.follows.some(([f, x]) => f === u.id && x === a.id);
  const arts = mine ? db.artworks.filter((x) => x.artist === a.id) : a.arts;
  const c = [...a.arts, ...a.arts, ...a.arts].slice(0, 3);
  return `<div class="wrap page">
    <div class="cover-wrap"><div class="cover ${a.cover ? "one" : ""}">${a.cover ? `<img src="${a.cover}" alt="">` : c.map((x) => `<img src="${x.img}" alt="">`).join("")}</div>
      ${mine ? `<div class="cover-edit"><label class="btn s" for="cover-file" style="cursor:pointer">${t(a.cover ? "changeCover" : "uploadCover")}</label>${a.cover ? `<button class="btn line s" data-act="cover-remove">${t("removeCover")}</button>` : ""}</div><input type="file" id="cover-file" accept="image/*" class="hide">` : ""}</div>
    <div class="prof-head">${av(a, "l")}
      <div style="flex:1;min-width:220px"><h1 style="font-size:2.3rem;margin:0">${esc(a.name)}</h1>
        <div class="sm muted">${esc(a.city)} · ${t("followers", { n: a.followers })} · ${t("works", { n: a.arts.length })}${a.rating ? ` · ${stars(a.rating)} ${a.rating}` : ""}</div></div>
      <div class="row">${mine ? `<a class="btn line" href="#/account">${t("editProfile")}</a><a class="btn" href="#/artwork-form/new">${t("uploadArt")}</a>`
        : `<button class="btn line" data-act="contact" data-id="${a.id}">✉ ${t("contactArtist")}</button>${!canBuy(u) ? "" : `<button class="btn line" data-act="follow" data-id="${a.id}" aria-pressed="${!!following}">${following ? "✓ " + t("following") : "+ " + t("follow")}</button>${a.open ? `<a class="btn" href="#/commission-new/${a.id}">${t("commissionMe")}</a>` : `<span class="pill">${t("closed")}</span>`}`}`}</div>
    </div>
    <div class="side" style="margin-top:2.2rem">
      <aside class="card stack">
        <div><h3>${t("about")}</h3><p class="sm">${esc(a.bio)}</p></div>
        <div><h3>${t("socialLinks")}</h3>${socialLinks(a.social)}</div>
        <div><h3>${t("commissions")}</h3><p class="sm" style="margin:0"><span class="pill ${a.open ? "ok" : ""}">${a.open ? t("open") : t("closed")}</span> ${t("fromPrice", { p: baht(a.min) })}<br>${t("offers", { t: a.types.map((x) => t(x)).join(t("and")) })}</p></div>
        <div><h3>${t("specialties")}</h3><div class="chips">${a.tags.map((x) => `<span class="tag">${tn(x)}</span>`).join("")}</div></div>
      </aside>
      <div><div class="row between"><h2 style="margin:0">${t("artworksH")}</h2><span class="sm muted" id="aw-count"></span></div>
        ${arts.length ? `<div class="searchbar" role="search"><input type="search" id="aw-q" placeholder="${t("searchWorksPh")}" aria-label="${t("searchWorks")}">
          <select id="aw-fmt" aria-label="${t("format")}"><option value="">${t("allFormats")}</option><option value="physical">${t("physical")}</option><option value="digital">${t("digital")}</option></select>
          <select id="aw-sort" aria-label="sort"><option value="new">${t("newest")}</option><option value="lo">${t("priceLow")}</option><option value="hi">${t("priceHigh")}</option></select>
          <button class="btn" id="aw-go" type="button">${icon("search").replace("<svg", '<svg width="16" height="16"')} ${t("search")}</button></div>
          <div id="aw-grid"></div>` : `<div class="empty">${t("noWorks")}</div>`}
        <h2 style="margin-top:2.5rem">${t("reviews")}</h2>
        ${a.reviews.map((r) => `<div class="card"><div class="row between"><b>${esc(r.customerName)}</b>${stars(r.rating)}</div><p style="margin:.3rem 0 0">${esc(r.body)}</p><span class="xs muted">${when(r.at)}</span></div>`).join("") || `<p class="muted">${t("noReviews")}</p>`}</div>
    </div></div>`;
};

pages.artist.after = (id) => {
  const q = $("#aw-q");
  if (!q) return;
  const a = artistInfo(+id), mine = meU()?.id === a.id;
  const arts = mine ? db.artworks.filter((x) => x.artist === a.id) : a.arts;
  const run = () => {
    const term = q.value.trim().toLowerCase(), fmt = $("#aw-fmt").value, sort = $("#aw-sort").value;
    const list = arts.filter((x) => (!term || (x.title + " " + x.desc + " " + x.tags.map((k) => tagById(k).th + " " + tagById(k).en).join(" ")).toLowerCase().includes(term)) && (!fmt || x.format === fmt))
      .sort((x, y) => (sort === "lo" ? eff(x) - eff(y) : sort === "hi" ? eff(y) - eff(x) : y.created - x.created));
    $("#aw-count").textContent = t("showingN", { n: list.length, t: arts.length });
    $("#aw-grid").innerHTML = list.length ? `<div class="works">${list.map(workCard).join("")}</div>` : `<div class="empty">${t("noWorksMatch")}<br><br><button class="btn line s" data-act="aw-clear">${t("clearSearch")}</button></div>`;
  };
  q.addEventListener("input", run); $("#aw-go").addEventListener("click", () => { run(); $("#aw-grid").scrollIntoView({ block: "nearest" }); });
  q.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); }); $("#aw-fmt").addEventListener("change", run); $("#aw-sort").addEventListener("change", run);
  window.__awClear = () => { q.value = ""; $("#aw-fmt").value = ""; run(); q.focus(); };
  run();
};

pages.match = () => `<div class="narrow page">${head(t("matchEyebrow"), t("findYourArtist"), t("matchLead"))}
  <p class="sm">${t("alreadyKnow")} <a href="#/artists">${t("artistSearch")}</a></p>
  <form class="filters" id="mf" style="margin-top:2rem">
    <div class="field"><label class="f">${t("artworkType")}</label><div class="chips"><label class="chip"><input type="radio" name="at" value="" checked>${t("any")}</label><label class="chip"><input type="radio" name="at" value="physical">${t("physical")}</label><label class="chip"><input type="radio" name="at" value="digital">${t("digital")}</label></div></div>
    <div class="field"><label class="f">${t("prefStyles")}</label><div class="chips">${chips(TAGS.filter((x) => x.cat === "style"), "tag")}</div></div>
    <div class="field"><label class="f">${t("subjectTags")}</label><div class="chips">${chips(TAGS.filter((x) => x.cat === "subject"), "tag")}</div></div>
    <div class="field" style="margin:0"><label class="f">${t("budget")}</label><div class="row" style="flex-wrap:nowrap"><input type="number" name="bmin" min="0" placeholder="${t("min")}" style="max-width:130px" aria-label="${t("min")}"><input type="number" name="bmax" min="0" placeholder="${t("max")}" style="max-width:130px" aria-label="${t("max")}"><button type="reset" class="btn line">${t("clear")}</button></div></div>
  </form>
  <p class="sm muted" id="msum" style="margin:2rem 0 1rem"></p><div id="mres"></div></div>`;
pages.match.after = () => {
  const f = $("#mf");
  const run = () => {
    const sel = checked(f, "tag"), at = f.querySelector("input[name=at]:checked").value, b = f.bmax.value === "" ? null : +f.bmax.value;
    const res = artists().filter((a) => a.open).map((a) => ({ a, hits: a.tags.filter((x) => sel.includes(x)) }))
      .filter((m) => (!at || m.a.types.includes(at)) && (b == null || m.a.min <= b) && (!sel.length || m.hits.length))
      .sort((x, y) => y.hits.length - x.hits.length || x.a.name.localeCompare(y.a.name));
    $("#msum").textContent = t("nMatching", { n: res.length });
    $("#mres").innerHTML = res.map((m) => artistRow(m.a, { hits: m.hits, selTags: sel, showMatch: true })).join("") || `<div class="empty">${t("noMatchArtist")}</div>`;
  };
  f.addEventListener("input", run); f.addEventListener("reset", () => setTimeout(run)); f.addEventListener("submit", (e) => e.preventDefault()); run();
};
