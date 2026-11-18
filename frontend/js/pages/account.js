// =====================================================================
// pages/account.js — บัญชีของฉัน: สลับโปรไฟล์ รูปโปรไฟล์ รูปปก ข้อมูลสตูดิโอ รหัสผ่าน
// =====================================================================
pages.account = () => {
  const u = meU();
  if (!u) return needLogin();
  return `<div class="narrow page" style="max-width:${u.role === "artist" ? 760 : 640}px">${head("", t("accountTitle"))}${accountRoleCard(u)}
    <div class="card" style="margin-top:1.5rem"><h3>${t("profilePic")}</h3>
      <div class="avatar-edit">${av(u, "l")}
        <div class="stack" style="flex:1;min-width:200px">
          <div class="row"><label class="btn s" for="avatar-file" style="cursor:pointer">${t(u.avatar ? "changePic" : "uploadPic")}</label>
            ${u.avatar ? `<button class="btn line s" data-act="avatar-remove">${t("removePic")}</button>` : ""}</div>
          <input type="file" id="avatar-file" accept="image/*" class="hide">
          <p class="hint" style="margin:0">${t("picHint")}</p></div></div></div>
    ${u.role === "artist" ? coverCard(u) + studioForm(u) : `    <form class="card" data-form="profile"><div class="row" style="margin-bottom:1rem"><div><b>${esc(u.name)}</b><div class="sm muted">${esc(u.email)}</div></div><span class="pill">${t("role_" + u.role)}</span></div>
      <div class="field"><label class="f" for="pn">${t("displayName")}</label><input type="text" id="pn" name="name" required value="${esc(u.name)}"></div><button class="btn">${t("save")}</button></form>`}
    <form class="card" data-form="password" novalidate><h3>${t("changePw")}</h3>
      ${pwField("p1", "cur", t("currentPw"), 'autocomplete="current-password"')}${pwField("p2", "next", t("newPw"), 'autocomplete="new-password"')}
      <button class="btn">${t("changePw")}</button></form>
    <button class="btn line full" data-act="logout" style="margin-top:1rem">${t("signOut")}</button></div>`;
};
// อัปโหลดรูปโปรไฟล์: ครอปตรงกลางเป็นสี่เหลี่ยม ย่อเหลือ 256px
pages.account.after = () => {
  const inp = $("#avatar-file");
  if (!inp) return;
  inp.addEventListener("change", () => {
    const file = inp.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast(t("notImage"), true);
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height), c = document.createElement("canvas");
        c.width = c.height = 256;
        c.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256);
        c.toBlob((blob) => uploadImage("/api/me/avatar", "avatar", blob, t("picSaved")), "image/jpeg", 0.88);
      };
      img.onerror = () => toast(t("notImage"), true);
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  });
};

// อัปโหลดรูปปกโปรไฟล์ศิลปิน: ครอปกลางภาพเป็นแถบกว้าง 1600×330 (ใช้ได้ทั้งหน้าโปรไฟล์สาธารณะและหน้าบัญชี)
document.addEventListener("change", (e) => {
  if (e.target.id !== "cover-file") return;
  const u = meU(), file = e.target.files[0];
  if (!file || !u || !db.profiles[u.id]) return;
  if (!file.type.startsWith("image/")) return toast(t("notImage"), true);
  const rd = new FileReader();
  rd.onload = () => {
    const img = new Image();
    img.onload = () => {
      const W = 1600, H = 330, c = document.createElement("canvas"); c.width = W; c.height = H;
      const k = Math.max(W / img.width, H / img.height), w = img.width * k, h = img.height * k;
      c.getContext("2d").drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      c.toBlob((blob) => uploadImage("/api/me/cover", "cover", blob, t("coverSaved")), "image/jpeg", 0.85);
    };
    img.onerror = () => toast(t("notImage"), true);
    img.src = rd.result;
  };
  rd.readAsDataURL(file);
});
