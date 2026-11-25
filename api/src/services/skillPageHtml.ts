import type { SkillRecord } from "../types";

function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function barColor(status: string): string {
  if (status === "correct") return "#1f8a70";
  if (status === "partial") return "#c5940a";
  if (status === "wrong") return "#c24832";
  return "#cdd5cf";
}

function formatDate(iso: string, language: string): string {
  const locale = language === "hi" ? "hi-IN" : language === "kn" ? "kn-IN" : "en-IN";
  try { return new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" }); }
  catch { return iso.slice(0, 10); }
}

export function generateSkillPageHtml(record: SkillRecord, apiBase: string): string {
  const lang = record.language === "hi" ? "hi" : record.language === "kn" ? "kn" : "en";
  const date = formatDate(record.issuedAt, record.language);
  const name = esc(record.name ?? "Anonymous candidate");
  const skill = esc(record.skill);
  const level = esc(record.overallLevel);
  const basis = esc(record.basisNote ?? "");
  const version = esc(record.rubricVersion);

  const rows = record.scores.map((s) => `
      <div class="c">
        <div class="ch"><span>${esc(s.label)}</span><span>${s.score}</span></div>
        <div class="bt"><div class="bf" style="width:${s.score}%;background:${barColor(s.status)}"></div></div>
      </div>`).join("");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prooffolio Skill Passport \u2013 ${skill}</title>
<style>
*{box-sizing:border-box;margin:0}
body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;color:#16221c;background:#f6f7f5;min-width:320px}
main{width:min(100%,460px);margin:0 auto;padding:24px 20px 44px}
.ey{color:#1f8a70;font-size:.8rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
h1{margin:8px 0 0;font-size:clamp(2.1rem,10vw,3rem);letter-spacing:-.055em;line-height:1.02;color:#14251d}
.nm{margin:6px 0 0;color:#536159;font-size:1rem}
.tot{margin:8px 0 0;color:#1f8a70;font-size:clamp(3.5rem,16vw,5rem);font-weight:900;letter-spacing:-.04em;line-height:1}
.lv{margin:4px 0 0;color:#536159;font-size:1.05rem}
.dt{margin:4px 0 16px;color:#64736a;font-size:.84rem}
.badge{display:inline-block;margin:0 0 20px;padding:8px 10px;border:1px solid #b9c9bf;border-radius:999px;font-size:.85rem;font-weight:800;color:#64736a;background:#f6f7f5}
.badge-valid{border-color:#1f8a70;color:#176f5a;background:#f3fbf8}
.badge-invalid{border-color:#c24832;color:#a13d28;background:#fff2ee}
.badge-warn{border-color:#c5940a;color:#96681e;background:#fff9e9}
.sc{margin-top:20px;padding:17px;border:1px solid #dbe3dd;border-radius:18px;background:#fff}
.sc h2{margin:0 0 12px;font-size:1rem}
.c{padding:10px 0;border-top:1px solid #e1e8e3}
.c:first-of-type{border-top:0}
.ch{display:flex;justify-content:space-between;gap:12px}
.ch span:first-child{font-weight:700;font-size:.95rem}
.ch span:last-child{color:#1f8a70;font-weight:800}
.bt{height:8px;margin:8px 0 0;overflow:hidden;border-radius:99px;background:#e6ece8}
.bf{height:100%;border-radius:inherit}
.meta{margin:20px 0 4px;color:#64736a;font-size:.82rem}
.basis{color:#64736a;font-size:.84rem;line-height:1.45}
@media(min-width:768px){main{width:min(100%,860px);padding:36px 32px 64px}h1{font-size:clamp(2.1rem,4vw,2.85rem)}.tot{font-size:clamp(3.25rem,6vw,4.5rem)}}
</style>
</head>
<body>
<main>
  <p class="ey">Prooffolio Skill Passport</p>
  <h1>${skill}</h1>
  <p class="nm">${name}</p>
  <div class="tot">${record.total}</div>
  <p class="lv">${level}</p>
  <p class="dt">${date}</p>
  <div id="badge" class="badge">Checking record\u2026</div>
  <noscript><div class="badge badge-warn">Could not check right now</div></noscript>
  <section class="sc">
    <h2>Rubric scores</h2>${rows}
  </section>
  <p class="meta">Rubric v${version}</p>
  <p class="basis">${basis}</p>
</main>
<script>
(function(){var b=document.getElementById("badge");
fetch("${apiBase}/api/verify/${record.id}")
.then(function(r){return r.ok?r.json():Promise.reject()})
.then(function(d){b.textContent=d.valid?"Record matches our database":"Record could not be verified";b.className="badge "+(d.valid?"badge-valid":"badge-invalid")})
.catch(function(){b.textContent="Could not check right now";b.className="badge badge-warn"})})();
</script>
</body>
</html>`;
}
