// =====================================================================
// pages/explore.js — สำรวจผลงาน (ค้นหา + ตัวกรอง)
// =====================================================================
pages.explore = () => {
  const styles = TAGS.filter((x) => x.cat === "style"), subjects = TAGS.filter((x) => x.cat === "subject");
  return `<div class="wrap page">${head("", t("exploreTitle"), t("exploreLead"))}
    <div class="side" style="margin-top:2.2rem">
      <details id="fwrap"><summary class="fsum btn line full">${t("filters")}</summary><form id="filters" style="margin-top:1rem">
        <div class="field"><label class="f" for="fq">${t("search")}</label><input type="search" id="fq" name="q" placeholder="${t("titleOrArtist")}"></div>
        <div class="field"><label class="f">${t("styleTags")}</label><div class="chips">${chips(styles, "tag")}</div></div>
        <div class="field"><label class="f" for="ff">${t("artType")}</label><select id="ff" name="format"><option value="">${t("allArtTypes")}</option><option value="physical">${t("physical")}</option><option value="digital">${t("digital")}</option></select></div>
        <div class="field"><label class="f" for="fs">${t("subject")}</label><select id="fs" name="subject"><option value="">${t("allSubjects")}</option>${subjects.map((x) => `<option value="${x.id}">${x[lang]}</option>`).join("")}</select></div>
        <div class="field"><label class="f">${t("budget")}</label><div class="two" style="gap:.5rem"><input type="number" name="min" min="0" placeholder="${t("min")}" aria-label="${t("min")}"><input type="number" name="max" min="0" placeholder="${t("max")}" aria-label="${t("max")}"></div></div>
        <div class="field"><label class="check"><input type="checkbox" name="sale"> ${t("forSaleOnly")}</label></div>
        <button type="reset" class="btn line full">${t("resetFilters")}</button>
      </form></details>
      <div>
        <div class="row between" style="margin-bottom:1.2rem"><span class="muted" id="count"></span>
          <select id="sort" style="width:auto;min-width:200px" aria-label="sort"><option value="new">${t("newest")}</option><option value="lo">${t("priceLow")}</option><option value="hi">${t("priceHigh")}</option></select></div>
        <div id="results"></div>
      </div>
    </div></div>`;
};
pages.explore.after = () => {
  if (innerWidth > 860) $("#fwrap").open = true;
  const f = $("#filters");
  const run = () => {
    const q = f.q.value.trim().toLowerCase(), need = checked(f, "tag"), subj = +f.subject.value;
    const min = f.min.value === "" ? null : +f.min.value, max = f.max.value === "" ? null : +f.max.value;
    const all = db.artworks.filter(visible);
    const list = all.filter((a) => (!q || (a.title + user(a.artist).name).toLowerCase().includes(q)) && need.every((x) => a.tags.includes(x)) && (!subj || a.tags.includes(subj))
      && (!f.format.value || a.format === f.format.value) && (min == null || eff(a) >= min) && (max == null || eff(a) <= max) && (!f.sale.checked || a.purpose === "for_sale"));
    const s = $("#sort").value;
    list.sort((a, b) => (s === "lo" ? eff(a) - eff(b) : s === "hi" ? eff(b) - eff(a) : b.created - a.created));
    $("#count").textContent = t("nArtworks", { n: list.length, t: all.length });
    $("#results").innerHTML = list.length ? `<div class="works">${list.map(workCard).join("")}</div>` : `<div class="empty">${t("noMatch")}</div>`;
  };
  f.addEventListener("input", run);
  f.addEventListener("reset", () => setTimeout(run));
  f.addEventListener("submit", (e) => e.preventDefault());
  $("#sort").addEventListener("change", run);
  run();
};
