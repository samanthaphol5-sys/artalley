// =====================================================================
// pages/auth.js — เข้าสู่ระบบ สมัครสมาชิก ลืมรหัสผ่าน ตั้งรหัสผ่านใหม่
// =====================================================================
const DEMO = [["customer@artalley.local", "customer", 2], ["ploy@artalley.local", "artist", 7], ["mali@artalley.local", "artist", 3]]; // บัญชีแอดมินยังอยู่ใน db แต่ไม่โชว์ในหน้าเข้าสู่ระบบ
const pwField = (id, name, label, extra = "") => `<div class="field"><label class="f" for="${id}">${label}</label>
  <div class="pw"><input type="password" id="${id}" name="${name}" ${extra}><button type="button" class="pw-eye" data-act="pw-eye" data-for="${id}">${t("showPw")}</button></div></div>`;
pages.login = (mode = "in") => {
  if (meU()) return redirect("#/account");
  const up = mode === "up" || mode === "artist";
  return `<div class="narrow page auth" style="max-width:470px">
  ${head("", t(up ? "joinTitle" : "loginTitle"), up ? "" : t("loginLead"))}
  ${pendingBuy && artwork(pendingBuy.id) ? `<div class="note info" role="status" style="margin-top:1rem">🔒 ${t("loginToBuyNote", { t: esc(artwork(pendingBuy.id).title) })}</div>` : ""}
  <div class="card" style="margin-top:1.5rem">
    <div id="auth-err" class="note bad hide" role="alert"></div>
    ${up ? `<form data-form="register" novalidate>
      <div class="field"><label class="f" for="rn">${t("displayName")}</label><input type="text" id="rn" name="name" autocomplete="name"></div>
      <div class="field"><label class="f" for="re">${t("email")}</label><input type="email" id="re" name="email" autocomplete="email"></div>
      ${pwField("rp", "pw", t("password"), 'autocomplete="new-password"')}<div class="hint" style="margin:-.8rem 0 1rem">${t("minPw")}</div>
      ${pwField("rp2", "pw2", t("confirmPw"), 'autocomplete="new-password"')}
      <fieldset class="role-field"><legend class="f">${t("joinAs")}</legend>
        <div class="role-choices">
          <label class="role-choice"><input type="radio" name="role" value="customer" ${mode === "artist" ? "" : "checked"}>
            <span class="role-choice-content"><span class="role-choice-heading"><svg class="role-choice-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1 13H5L6 7Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg> ${t("customer")} <span class="role-choice-check" aria-hidden="true">✓</span></span><span class="role-choice-desc">${lang === "th" ? "ซื้อผลงาน · จ้างศิลปิน" : "Buy art · Commission"}</span></span>
          </label>
          <label class="role-choice"><input type="radio" name="role" value="artist" ${mode === "artist" ? "checked" : ""}>
            <span class="role-choice-content"><span class="role-choice-heading"><svg class="role-choice-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="7.5" cy="11" r="1"/><circle cx="11" cy="7" r="1"/><circle cx="16" cy="9" r="1"/><path d="M15 16a2 2 0 0 0 2-2 2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2c0 1 .5 2 1.5 2H15Z"/></svg> ${t("artist")} <span class="role-choice-check" aria-hidden="true">✓</span></span><span class="role-choice-desc">${lang === "th" ? "ขายผลงาน · รับงานจ้าง" : "Sell art · Take commissions"}</span></span>
          </label>
        </div><p class="role-choice-note">${lang === "th" ? "เพิ่มอีกโปรไฟล์ภายหลังได้ โดยใช้อีเมลเดียวกัน" : "You can add another profile later with the same email."}</p>
      </fieldset>
      <button class="btn full">${t("createAccount")}</button>
      <p class="sm center" style="margin:1rem 0 0;text-align:center">${t("haveAccount")} <a href="#/login">${t("signIn")}</a></p></form>`
    : `<form data-form="login" novalidate>
      <div class="field"><label class="f" for="le">${t("email")}</label><input type="email" id="le" name="email" autocomplete="username"></div>
      ${pwField("lp", "pw", t("password"), 'autocomplete="current-password"')}
      <div style="margin:-.4rem 0 1rem;text-align:right"><a class="sm" href="#/forgot">${t("forgotPw")}</a></div>
      <button class="btn full">${t("signIn")}</button>
      <p class="sm" style="margin:1rem 0 0;text-align:center">${t("noAccount")} <a href="#/register">${t("join")}</a></p></form>`}
  </div>
  ${up ? "" : `<div class="card" style="margin-top:1rem"><span class="eyebrow">${t("demoTitle")}</span>
    <div class="stack" style="margin-top:.6rem">${DEMO.map(([email, role, uid]) => { const x = user(uid); if (!x) return "";
      return `<button type="button" class="demo-acc" data-act="demo-fill" data-email="${email}">${av(x, "s")}<span><b>${esc(x.name)}</b><small>${email} · ${t(role)}</small></span></button>`; }).join("")}</div>
    <p class="xs muted" style="margin:.8rem 0 0">${t("password")}: password123</p></div>`}
  </div>`;
};
pages.register = () => pages.login("up");
// ---- ลืมรหัสผ่าน (ต้นแบบ: ไม่มีอีเมลจริง จึงโชว์ "อีเมลจำลอง" พร้อมลิงก์รีเซ็ตในหน้า) ----
let forgotSent = null; // { email, token|null } — ข้อความตอบกลับเหมือนกันไม่ว่าอีเมลจะมีบัญชีหรือไม่
pages.forgot = () => {
  if (meU()) return redirect("#/account");
  const sent = forgotSent;
  return `<div class="narrow page auth" style="max-width:470px">
  ${head("", t(sent ? "fpSentTitle" : "fpTitle"), sent ? "" : t("fpLead"))}
  <div class="card" style="margin-top:1.5rem">
    ${sent ? `<p class="sm" role="status">${t("fpSentBody", { e: `<b>${esc(sent.email)}</b>` })}</p>
      ${sent.token ? `<div class="note info" style="margin-top:1rem"><div class="xs muted" style="margin-bottom:.6rem">${t("fpDemoBox")}</div><a class="btn s" href="#/reset/${sent.token}">${t("fpOpenLink")}</a></div>` : ""}
      <p class="sm" style="margin:1rem 0 0;text-align:center"><button type="button" class="btn ghost s" data-act="forgot-again">${t("fpResend")}</button> · <a href="#/login">${t("fpBack")}</a></p>`
    : `<div id="auth-err" class="note bad hide" role="alert"></div>
      <form data-form="forgot" novalidate>
        <div class="field"><label class="f" for="fe">${t("email")}</label><input type="email" id="fe" name="email" autocomplete="username"></div>
        <button class="btn full">${t("fpSend")}</button>
        <p class="sm" style="margin:1rem 0 0;text-align:center"><a href="#/login">${t("fpBack")}</a></p></form>`}
  </div></div>`;
};
pages.forgot.after = () => { const el = $("#fe"); if (el) el.focus(); };
let resetCheck = { token: null, status: "idle", email: "" }; // ผลตรวจลิงก์จากเซิร์ฟเวอร์
pages.reset = (token = "") => {
  if (meU()) return redirect("#/account");
  if (resetCheck.token !== token || resetCheck.status === "loading") return `<div class="narrow page auth" style="max-width:470px">${head("", t("fpResetTitle"), "")}<div class="card" style="margin-top:1.5rem"><p class="muted">${t("checking")}</p></div></div>`;
  if (resetCheck.status !== "ok") return `<div class="narrow page auth" style="max-width:470px">${head("", t("fpResetTitle"), "")}
    <div class="card" style="margin-top:1.5rem"><div class="note bad" role="alert">${t("fpBad")}</div><p style="margin:1rem 0 0;text-align:center"><a class="btn" href="#/forgot">${t("fpAskNew")}</a></p></div></div>`;
  return `<div class="narrow page auth" style="max-width:470px">
  ${head("", t("fpResetTitle"), t("fpResetLead", { e: esc(resetCheck.email) }))}
  <div class="card" style="margin-top:1.5rem"><div id="auth-err" class="note bad hide" role="alert"></div>
    <form data-form="reset" data-token="${esc(token)}" novalidate>
      ${pwField("np", "pw", t("newPw"), 'autocomplete="new-password"')}<div class="hint" style="margin:-.8rem 0 1rem">${t("minPw")}</div>
      ${pwField("np2", "pw2", t("confirmPw"), 'autocomplete="new-password"')}
      <button class="btn full">${t("fpSave")}</button></form></div></div>`;
};
pages.reset.after = (token = "") => {
  if (resetCheck.token === token) { const el = $("#np"); if (el) el.focus(); return; }
  resetCheck = { token, status: "loading", email: "" };
  api(`/api/auth/reset/${encodeURIComponent(token)}`)
    .then((r) => { resetCheck = { token, status: "ok", email: r.email }; })
    .catch(() => { resetCheck = { token, status: "bad", email: "" }; })
    .then(() => { if (currentHash === "#/reset/" + token) render(); });
};
pages.join = () => meU() ? redirect("#/account") : pages.login("artist");
pages.join.after = () => { const el = $("#rn"); if (el) el.focus(); };
pages.login.after = () => { const el = $("#le") || $("#rn"); if (el) el.focus(); };
pages.register.after = pages.login.after;
