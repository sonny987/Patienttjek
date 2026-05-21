// ═══════════════════════════════════════════════════════════════
// vagtopgaver.js — Patienttjek v2
// Vagtopgave-tjekliste med sektioner, progress og interval-opgaver
// Tilføj til index.html: <script src="vagtopgaver.js"></script>
// ═══════════════════════════════════════════════════════════════

// ── DATA ─────────────────────────────────────────────────────────
let _vtTasks = [
  { id:1,  txt:'Tjek alle patienters TOKS inden kl. 09:00', sub:'Dokumentér i EPJ',          time:'09:00', done:false, sec:'Morgen' },
  { id:2,  txt:'Gennemgå medicin med sygeplejerske',        sub:'',                          time:'09:30', done:false, sec:'Morgen' },
  { id:3,  txt:'Sondepumpe-hastighed kontrolleret (<400 ml/t)', sub:'Jf. nyhedsbrev uge 17', time:'10:00', done:true,  sec:'Morgen' },
  { id:4,  txt:'Flyt brikker på lager',                     sub:'Husk inden du forlader afdelingen', time:'', done:false, sec:'Formiddag' },
  { id:5,  txt:'FVC-målinger dokumenteret for alle patienter', sub:'',                       time:'11:00', done:false, sec:'Formiddag' },
  { id:6,  txt:'EPJ opdateret for alle patienter',          sub:'',                          time:'14:45', done:false, sec:'Afslutning' },
  { id:7,  txt:'Vagtoverdragelse forberedt',                 sub:'Notér alle afvigelser',    time:'14:30', done:false, sec:'Afslutning' },
];
let _nextVtId = 20;
const _VT_SEKTIONER = ['Morgen','Formiddag','Eftermiddag','Afslutning'];

// ── RENDER ────────────────────────────────────────────────────────
function _renderVt() {
  const body = document.getElementById('vtBody');
  const bar  = document.getElementById('vtProgressBar');
  const pct  = document.getElementById('vtProgressPct');
  const badge = document.getElementById('vtNavBadge');
  if (!body) return;

  const done  = _vtTasks.filter(t => t.done).length;
  const total = _vtTasks.length;
  const p     = total > 0 ? Math.round(done / total * 100) : 0;

  if (bar)  bar.style.width  = p + '%';
  if (pct)  { pct.textContent = p + '%'; pct.style.color = p === 100 ? 'var(--green)' : p > 50 ? 'var(--yellow)' : 'var(--muted2)'; }
  if (badge) {
    const rem = total - done;
    if (rem > 0) { badge.style.display = 'flex'; badge.textContent = rem; }
    else badge.style.display = 'none';
  }

  const sektioner = _VT_SEKTIONER.filter(s => _vtTasks.some(t => t.sec === s));
  let html = '';
  sektioner.forEach(sec => {
    const items = _vtTasks.filter(t => t.sec === sec);
    const sDone = items.filter(t => t.done).length;
    html += `
      <div class="vt-sec-header">
        <span>${sec}</span>
        <span style="font-size:11px;color:var(--muted)">${sDone}/${items.length}</span>
      </div>`;
    items.forEach(t => {
      html += `
        <div class="vt-item${t.done ? ' done' : ''}" onclick="_toggleVt(${t.id})">
          <div class="vt-check${t.done ? ' done' : ''}">${t.done ? '✓' : ''}</div>
          <div class="vt-item-body">
            <div class="vt-item-txt">${t.txt}</div>
            ${t.sub ? `<div class="vt-item-sub">${t.sub}</div>` : ''}
          </div>
          ${t.time ? `<div class="vt-item-time">${t.time}</div>` : ''}
        </div>`;
    });
  });

  body.innerHTML = html;
}

function _toggleVt(id) {
  const t = _vtTasks.find(t => t.id === id);
  if (t) { t.done = !t.done; _renderVt(); }
}

function _addVtTask() {
  const inp = document.getElementById('vtAddInput');
  if (!inp) return;
  const val = inp.value.trim();
  if (!val) return;
  const secSel = document.getElementById('vtAddSec');
  const sec = secSel ? secSel.value : 'Formiddag';
  _vtTasks.push({ id: _nextVtId++, txt: val, sub: '', time: '', done: false, sec });
  inp.value = '';
  _renderVt();
}

function _nulstilVt() {
  if (!confirm('Nulstil alle vagtopgaver?')) return;
  _vtTasks.forEach(t => t.done = false);
  _renderVt();
}

// ── INJEKTION ─────────────────────────────────────────────────────
function _injectVagtopgaverTab() {
  // Fane-knap
  const viewTabs = document.querySelector('.view-tabs');
  if (viewTabs && !document.getElementById('vtabVagtopgaver')) {
    const btn = document.createElement('div');
    btn.className = 'view-tab';
    btn.id = 'vtabVagtopgaver';
    btn.style.position = 'relative';
    btn.innerHTML = `✅ Vagtopgaver <span id="vtNavBadge" style="display:none;position:absolute;top:4px;right:4px;background:var(--red);color:#fff;font-size:9px;font-weight:700;min-width:14px;height:14px;border-radius:7px;align-items:center;justify-content:center;padding:0 3px">0</span>`;
    btn.onclick = () => switchView('vagtopgaver');

    // Indsæt FØR nyheder-fanen hvis den findes
    const nyTab = document.getElementById('vtabNyheder');
    if (nyTab) viewTabs.insertBefore(btn, nyTab);
    else viewTabs.appendChild(btn);
  }

  // View-container
  const mainContent = document.querySelector('.main-content');
  if (mainContent && !document.getElementById('vagtopgaverView')) {
    const div = document.createElement('div');
    div.id = 'vagtopgaverView';
    div.style.cssText = 'max-width:720px;margin:0 auto;display:none';
    div.innerHTML = `
      <!-- Header -->
      <div class="vt-view-header">
        <div>
          <div style="font-size:18px;font-weight:700;margin-bottom:2px">Vagtopgaver</div>
          <div style="font-size:12px;color:var(--muted)" id="vtDatoLbl"></div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="_nulstilVt()" title="Nulstil alle">↺ Nulstil</button>
      </div>

      <!-- Progress -->
      <div class="vt-progress-wrap">
        <div class="vt-progress-track">
          <div class="vt-progress-fill" id="vtProgressBar" style="width:0%"></div>
        </div>
        <div class="vt-progress-pct" id="vtProgressPct">0%</div>
      </div>

      <!-- Opgaveliste -->
      <div id="vtBody"></div>

      <!-- Tilføj opgave -->
      <div class="vt-add-row">
        <input id="vtAddInput" placeholder="Tilføj vagtopgave…"
          style="flex:1;padding:9px 12px;border-radius:8px;border:1px solid var(--border);background:var(--s2);font-size:13px;font-family:inherit;outline:none;color:var(--text)"
          onfocus="this.style.borderColor='var(--blue)'" onblur="this.style.borderColor='var(--border)'"
          onkeydown="if(event.key==='Enter')_addVtTask()">
        <select id="vtAddSec" style="padding:9px 10px;border-radius:8px;border:1px solid var(--border);background:var(--s2);font-size:12px;font-family:inherit;color:var(--text);outline:none">
          ${_VT_SEKTIONER.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" onclick="_addVtTask()">+ Tilføj</button>
      </div>`;
    mainContent.appendChild(div);
  }
}

// ── HOOK IND I switchView ─────────────────────────────────────────
(function() {
  // Vent til nyheder.js evt. allerede har wrappet switchView
  const _hookVt = () => {
    const _prev = window.switchView;
    window.switchView = function(view) {
      if (typeof _prev === 'function') _prev(view);
      const vtView = document.getElementById('vagtopgaverView');
      if (vtView) vtView.style.display = view === 'vagtopgaver' ? 'block' : 'none';
      if (view === 'vagtopgaver') {
        const lbl = document.getElementById('vtDatoLbl');
        if (lbl) lbl.textContent = new Date().toLocaleDateString('da-DK', { weekday:'long', day:'numeric', month:'long' });
        _renderVt();
      }
    };
  };
  // Kør efter DOM + andre scripts
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _hookVt);
  else setTimeout(_hookVt, 0);
})();

// ── INIT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  _injectVagtopgaverTab();
  _renderVt();
});
