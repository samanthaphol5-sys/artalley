// =====================================================================
// pages/home.js — หน้าแรก และ วิธีใช้งาน
// =====================================================================
pages.home = () => {
  const latest = db.artworks.filter(visible).sort((a, b) => b.created - a.created);
  const open = artists().filter((a) => a.open).slice(0, 3);
  return `<div class="wrap page">
    <section class="hero">
      <div>${head(t("heroEyebrow"), t("heroTitle"), t("heroLead"))}
        <div class="row" style="margin-top:1.5rem"><a class="btn" href="#/match">${t("findYourArtist")}</a><a class="btn line" href="#/explore">${t("explore")}</a></div></div>
      <div class="hero-art">${latest.slice(0, 2).map(workCard).join("")}</div>
    </section>
    <section class="sec"><div class="sec-h"><h2>${t("latest")}</h2><a href="#/explore">${t("seeAll")}</a></div>
      <div class="works">${latest.slice(0, 8).map(workCard).join("")}</div></section>
    <section class="sec"><div class="sec-h"><h2>${t("openArtists")}</h2><a href="#/artists">${t("artistSearch")}</a></div>
      ${open.map((a) => artistRow(a)).join("")}</section>
    <section class="sec"><div class="sec-h"><h2>${t("howItWorks")}</h2></div>${howBox()}</section>
    ${artistBand()}
  </div>`;
};

pages.about = () => `<div class="narrow page">${head("", t("howItWorks"), t("aboutLead"))}
  <section class="sec" style="margin-top:2rem">${howBox()}</section>
  <section class="sec" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;margin-top:2rem">
    <div class="card"><h3>${t("buyH")}</h3><p class="sm">${t("buyText")}</p><a class="btn line s" href="#/explore">${t("explore")}</a></div>
    <div class="card" style="margin:0"><h3>${t("comH")}</h3><p class="sm">${t("comText")}</p><a class="btn line s" href="#/match">${t("findYourArtist")}</a></div>
    <div class="card" style="margin:0"><h3>${t("followH")}</h3><p class="sm">${t("followText")}</p><a class="btn line s" href="#/artists">${t("artistSearch")}</a></div>
  </section>${artistBand()}</div>`;
