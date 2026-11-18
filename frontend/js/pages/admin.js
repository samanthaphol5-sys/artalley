// =====================================================================
// pages/admin.js — ผู้ดูแลระบบ
// =====================================================================
pages.admin = (tab = "reports") => {
  const u = meU();
  if (!u) return needLogin();
  if (u.role !== "admin") return onlyFor(t("role_admin"));
  const RS = { open: "warn", resolved: "ok", dismissed: "" };
  let body = "";
  if (tab === "reports") body = `<div class="card tw"><table><thead><tr><th>${t("artworkH")}</th><th>${t("reason")}</th><th>${t("reporter")}</th><th>${t("status")}</th><th></th></tr></thead><tbody>
    ${db.reports.map((r) => { const a = artwork(r.art); return a ? `<tr><td><div class="row" style="flex-wrap:nowrap"><img class="thumb" src="${a.img}" alt=""><a href="#/artwork/${a.id}">${esc(a.title)}</a></div></td><td><b>${t("r_" + r.reason)}</b><div class="xs muted">${esc(r.details)}</div></td>
      <td class="sm">${esc(user(r.by).name)}<div class="xs muted">${when(r.at)}</div></td><td><span class="pill ${RS[r.status]}">${t("rs_" + r.status)}</span>${a.hidden ? ` <span class="pill bad">${t("adminHidden")}</span>` : ""}</td>
      <td><div class="row" style="gap:.3rem;flex-wrap:nowrap"><button class="btn s ${a.hidden ? "line" : "bad"}" data-act="hide" data-id="${a.id}">${t(a.hidden ? "showIt" : "hideIt")}</button>
      ${r.status === "open" ? `<button class="btn ok s" data-act="report" data-id="${r.id}" data-v="resolved">${t("resolved")}</button><button class="btn line s" data-act="report" data-id="${r.id}" data-v="dismissed">${t("dismiss")}</button>` : ""}</div></td></tr>` : ""; }).join("") || `<tr><td colspan="5" class="muted">${t("noReports")}</td></tr>`}</tbody></table></div>`;
  if (tab === "artworks") body = `<div class="card tw"><table><thead><tr><th></th><th>${t("artworkH")}</th><th>${t("artist")}</th><th>${t("format")}</th><th>${t("price")}</th><th></th></tr></thead><tbody>
    ${db.artworks.map((a) => `<tr><td><img class="thumb" src="${a.img}" alt=""></td><td><a href="#/artwork/${a.id}">${esc(a.title)}</a>${a.hidden ? ` <span class="pill bad">${t("adminHidden")}</span>` : ""}</td><td>${esc(user(a.artist).name)}</td><td class="sm">${t(a.format)}</td><td>${baht(a.price)}</td>
      <td><button class="btn s ${a.hidden ? "line" : "bad"}" data-act="hide" data-id="${a.id}">${t(a.hidden ? "showIt" : "hideIt")}</button></td></tr>`).join("")}</tbody></table></div>`;
  if (tab === "users") body = `<div class="searchbar"><input type="search" id="uq" placeholder="${t("searchUsers")}" aria-label="${t("searchUsers")}"></div><div class="card tw"><table><thead><tr><th>${t("name")}</th><th>${t("email")}</th><th>${t("type")}</th><th>${t("status")}</th><th>${t("actions")}</th></tr></thead><tbody id="utbody">
    ${db.users.map((x) => `<tr><td><div class="row" style="flex-wrap:nowrap">${av(x, "s")}${esc(x.name)}</div></td><td class="sm">${esc(x.email)}</td>
      <td>${x.id === u.id ? `<span class="pill">${t("role_admin")} (${t("you")})</span>` : `<select data-act="role" data-id="${x.id}" style="width:auto" aria-label="${t("type")}">${["customer", "artist", "admin"].map((r) => `<option value="${r}" ${r === x.role ? "selected" : ""}>${t("role_" + r)}</option>`).join("")}</select>`}</td>
      <td>${x.suspended ? `<span class="pill bad" title="${esc(x.suspended.reason)}">${t("suspendedL")}</span><div class="xs muted" style="max-width:200px">${esc(x.suspended.reason)}</div>` : `<span class="pill ok">${t("active")}</span>`}</td>
      <td>${x.id === u.id || x.role === "admin" ? "" : `<div class="row" style="gap:.3rem;flex-wrap:nowrap"><button class="btn line s" data-act="act-as" data-id="${x.id}">${t("actAs")}</button>
        ${x.suspended ? `<button class="btn ok s" data-act="unsuspend" data-id="${x.id}">${t("unsuspend")}</button>` : `<button class="btn bad s" data-act="suspend" data-id="${x.id}">${t("suspend")}</button>`}</div>`}</td></tr>`).join("")}</tbody></table></div>`;
  return `<div class="wrap page">${head("", t("adminTitle"))}
    <div class="stats"><div class="stat"><b>${db.users.length}</b><span class="sm muted">${t("users")}</span></div><div class="stat"><b>${db.users.filter((x) => x.role === "artist").length}</b><span class="sm muted">${t("artists")}</span></div>
      <div class="stat"><b>${db.artworks.filter(visible).length}</b><span class="sm muted">${t("visibleWorks")}</span></div><div class="stat"><b>${db.stats?.orders ?? 0}</b><span class="sm muted">${t("ordersN")}</span></div>
      <div class="stat"><b>${db.stats?.commissions ?? 0}</b><span class="sm muted">${t("commissions")}</span></div><div class="stat"><b>${db.reports.filter((r) => r.status === "open").length}</b><span class="sm muted">${t("openReports")}</span></div><a class="stat" href="#/admin/users"><b>${db.users.filter((x) => x.suspended).length}</b><span class="sm muted">${t("suspendedN")}</span></a></div>
    <div class="tabs">${[["reports", "reports"], ["artworks", "allArtworks"], ["users", "users"]].map(([k, l]) => `<button data-go="#/admin/${k}" class="${tab === k ? "on" : ""}">${t(l)}</button>`).join("")}</div>${body}</div>`;
};

pages.admin.after = () => {
  const q = $("#uq");
  q && q.addEventListener("input", () => { const v = q.value.trim().toLowerCase(); $$("#utbody tr").forEach((tr) => tr.classList.toggle("hide", !!v && !tr.textContent.toLowerCase().includes(v))); });
};
const suspendedPage = (u) => `<div class="narrow page"><div class="empty" style="border-style:solid;border-color:var(--bad)">
  <h2 style="color:var(--bad)">${t("accountSuspended")}</h2><p>${t("suspendedMsg", { r: esc(u.suspended.reason) })}</p>
  ${db.impersonator ? `<button class="btn" data-act="stop-act">${t("backToAdmin")}</button>` : `<button class="btn line" data-act="logout">${t("signOut")}</button>`}</div></div>`;
