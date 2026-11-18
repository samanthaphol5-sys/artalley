// =====================================================================
// pages/inbox.js — ที่บันทึก ข้อความ การแจ้งเตือน
// =====================================================================
pages.saved = () => {
  const u = meU();
  if (!u) return needLogin();
  if (!canBuy(u)) return onlyFor(t("customerOrArtist"));
  const favs = db.favorites.filter(([x]) => x === u.id).map(([, y]) => artwork(y)).filter(visible);
  const fol = db.follows.filter(([f]) => f === u.id).map(([, a]) => artistInfo(a)).filter(Boolean);
  return `<div class="wrap page">${head("", t("savedTitle"))}
    <section class="sec" style="margin-top:2rem"><h2>${t("savedWorks")}</h2>${favs.length ? `<div class="works">${favs.map(workCard).join("")}</div>` : `<div class="empty">${t("savedEmpty")}</div>`}</section>
    <section class="sec"><h2>${t("followingArtists")}</h2>${fol.length ? fol.map((a) => `<div class="card row" style="align-items:flex-start;gap:1rem">${av(a)}<div style="flex:1;min-width:200px"><a href="#/artist/${a.id}" style="color:var(--ink);font-size:1.15rem">${esc(a.name)}</a><div class="xs muted" style="margin-bottom:.5rem">${esc(a.city)} · ${t("works", { n: a.arts.length })}</div>${socialLinks(a.social)}</div>
      <button class="btn line s" data-act="follow" data-id="${a.id}">✓ ${t("following")}</button></div>`).join("") : `<div class="empty">${t("followEmpty")}</div>`}</section></div>`;
};

pages.messages = (tid) => {
  const u = meU();
  if (!u) return needLogin();
  const mine = db.threads.filter((th) => th.a === u.id || th.b === u.id).sort((x, y) => y.msgs.at(-1).at - x.msgs.at(-1).at);
  const th = mine.find((x) => x.id === +tid);
  if (th && threadUnread(th, u.id)) { th.read[u.id] = Date.now(); api(`/api/messages/${th.id}/read`, { method: "POST" }).catch(() => {}); }
  const other = (x) => user(x.a === u.id ? x.b : x.a);
  return `<div class="wrap page">${head("", t("inbox"))}
    <div class="inbox ${th ? "has-thread" : ""}" style="margin-top:1.5rem">
      <div class="tlist">${mine.map((x) => { const o = other(x), last = x.msgs.at(-1), un = x === th ? 0 : threadUnread(x, u.id);
        return `<a href="#/messages/${x.id}" class="${x === th ? "on" : ""} ${un ? "unread" : ""}">${av(o)}<div style="flex:1;min-width:0"><div class="row between"><b>${esc(o.name)}</b><span class="xs muted">${when(last.at)}</span></div>
          ${x.about && artwork(x.about) ? `<div class="xs muted">${t("aboutArt", { t: esc(artwork(x.about).title) })}</div>` : ""}
          <div class="sm muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${last.by === u.id ? t("you_") + ": " : ""}${esc(last.body)}</div></div>${un ? `<span class="nb">${un}</span>` : ""}</a>`; }).join("") || `<div class="empty" style="border:0">${t("noThreads")}</div>`}</div>
      <div class="thread">${th ? `<div class="thead"><a href="#/messages" class="btn ghost s menu-back" aria-label="${t("back")}">←</a>${av(other(th))}<div style="flex:1"><a href="${other(th).role === "artist" ? `#/artist/${other(th).id}` : "#/messages/" + th.id}" style="color:var(--ink);font-weight:600">${esc(other(th).name)}</a>
          ${th.about && artwork(th.about) ? `<div class="xs"><a href="#/artwork/${th.about}">${t("aboutArt", { t: esc(artwork(th.about).title) })}</a></div>` : ""}</div></div>
        <div class="chat" id="chat">${th.msgs.map((m) => `<div class="bub ${m.by === u.id ? "me" : ""}"><i>${esc(user(m.by).name)} · ${when(m.at)}</i>${esc(m.body)}</div>`).join("")}</div>
        <form data-form="dm" data-id="${th.id}" class="row" style="flex-wrap:nowrap;align-items:flex-end"><textarea name="body" required placeholder="${t("typeMsg")}" style="min-height:48px;flex:1" aria-label="${t("typeMsg")}"></textarea><button class="btn">${t("send")}</button></form>`
        : `<div class="empty" style="border:0;margin:auto">${t("pickThread")}</div>`}</div>
    </div></div>`;
};
pages.messages.after = () => { const ch = $("#chat"); if (ch) ch.scrollTop = ch.scrollHeight; };

pages.notifications = () => {
  const u = meU();
  if (!u) return needLogin();
  const list = db.notifications.filter((n) => n.to === u.id).sort((a, b) => b.at - a.at);
  return `<div class="narrow page" style="max-width:760px"><div class="row between">${head("", t("notifications"))}${list.some((n) => !n.read) ? `<button class="btn line s" data-act="read-all">${t("markAllRead")}</button>` : ""}</div>
    <div class="card" style="padding:.4rem;margin-top:1rem">${list.map((n) => `<a class="notif ${n.read ? "" : "new"}" href="${n.link}" data-act="read" data-id="${n.id}"><span class="dot"></span><span style="font-size:1.15rem">${n.kind}</span>
      <div style="flex:1"><b class="sm" style="font-weight:600">${esc(notifText(n))}</b>${n.body ? `<div class="sm muted">${esc(n.body)}</div>` : ""}<div class="xs muted">${when(n.at)}</div></div></a>`).join("") || `<div class="empty" style="border:0">${t("noNotifs")}</div>`}</div></div>`;
};
