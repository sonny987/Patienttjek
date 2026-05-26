// ═══════════════════════════════════════════════════════════════
// nyheder.js — Patienttjek v2
// Nyhedsbrev-modul: læst/ulæst per bruger, admin-panel, SSO-kode
// Tilføj til index.html: <script src="nyheder.js"></script>
// ═══════════════════════════════════════════════════════════════

// ── FIREBASE STRUKTUR (produktion) ──────────────────────────────
// Firestore collections:
//   /nyheder/{newsId}            → nyhedsbrev-dokument (kun leder kan slette)
//   /brugere/{uid}/laestNyheder/{newsId} → { laestDen: Timestamp }
// Firestore rules sikrer at brugere kun ser egen afd. (se SSO-modal)
// ─────────────────────────────────────────────────────────────────

// ── DEMO DATA (erstattes af Firestore i produktion) ──────────────
let _nyhedsBrugere = [
  { uid:'u1', navn:'Jens Hansen',  email:'jh@ouh.dk', afd:'N', rolle:'plejepersonale', initialer:'JH' },
  { uid:'u2', navn:'Lone Madsen',  email:'lm@ouh.dk', afd:'N', rolle:'leder',          initialer:'LM' },
  { uid:'u3', navn:'Ali Karimi',   email:'ak@ouh.dk', afd:'N', rolle:'plejepersonale', initialer:'AK' },
  { uid:'u4', navn:'Sara Bjerg',   email:'sb@ouh.dk', afd:'U', rolle:'leder',          initialer:'SB' },
];

let _laestStatus = {
  'u1': { 2: true },
  'u2': { 1: true, 2: true, 3: true },
  'u3': {},
  'u4': { 4: true },
};

let _aktivBruger = _nyhedsBrugere[0];

let _newsItems = [
  { id:1, afd:'N', titel:'N Sengeafsnit Nyhedsbrev', uge:'Uge 17 – 2026',
    dato: new Date(2026,3,25), expanded: false,
    slides:[
      { title:'Nyt i afsnittet', text:'Sondepumpe-hastighed: Vi har erfaret at hastigheden på sondepumperne er justeret til et hurtigere indløb end de 400 ml/t som anbefales. Der må ikke justeres i hastighed, så det løber hurtigere end 400 ml/t, da vi risikerer at belaste mave og tarm.' },
      { title:'Sengekapacitet NR', text:'NR har i perioden 1/4–28/6 igen åbnet op til 34 sengepladser. Vi henstiller til at man som minimum husker at flytte brikken, hvis beholdningen er ved at være lav.' },
      { title:'Vagtplan', text:'Gældende for spl: kom gerne ud forbi kontoret eller send en mail i løbet af den næste uge og giv besked om, hvilken weekendmulighed du ønsker at arbejde fremadrettet. Deadline d. 8/5.' },
      { title:'Nyt i personalegruppen', text:'Monica (ssa) er sygemeldt på ubestemt tid. Ilyas (ssa-elev) er sygemeldt på ubestemt tid. Maja (spl) starter op igen d. 5/5. Maria (logopæd) har haft sidste arbejdsdag.' },
    ]},
  { id:2, afd:'N', titel:'N Sengeafsnit Nyhedsbrev', uge:'Uge 14 – 2026',
    dato: new Date(2026,3,4), expanded: false,
    slides:[
      { title:'Nyt udstyr', text:'Vi har modtaget to nye trykaflastningsmadrasser til senge 3 og 8. Husk at dokumentere i EPJ når madrassen er i brug.' },
      { title:'Kursus om apopleksi', text:'Der afholdes obligatorisk kursus for alle plejepersonale d. 22/4 kl. 08:00–12:00. Tilmelding via intranet inden d. 15/4.' },
    ]},
  { id:3, afd:'N', titel:'N Sengeafsnit Nyhedsbrev', uge:'Uge 10 – 2026',
    dato: new Date(2026,2,7), expanded: false,
    slides:[
      { title:'Ny dokumentationspraksis', text:'Fra d. 1/3 skal NIHSS-score dokumenteres ved alle apopleksi-patienter inden for 24 timer efter indlæggelse. Skema findes i EPJ under neurologiske scores.' },
    ]},
  { id:4, afd:'U', titel:'Urologisk Afdeling Nyhedsbrev', uge:'Uge 16 – 2026',
    dato: new Date(2026,3,18), expanded: false,
    slides:[{ title:'Nyt fra Afd. U', text:'Nyt kateter-protokol er implementeret fra uge 16. Se intranet for detaljer.' }]},
];
let _nextNewsId = 20;

// ── HJÆLPEFUNKTIONER ─────────────────────────────────────────────
function _erLaest(newsId) {
  return !!(_laestStatus[_aktivBruger.uid] && _laestStatus[_aktivBruger.uid][newsId]);
}

function _markerLaest(newsId) {
  if (!_laestStatus[_aktivBruger.uid]) _laestStatus[_aktivBruger.uid] = {};
  _laestStatus[_aktivBruger.uid][newsId] = true;
  // Produktion: await setDoc(doc(db, `brugere/${uid}/laestNyheder/${newsId}`), { laestDen: serverTimestamp() })
  _updateNewsBadge();
  _renderNews();
}

function _antalUlaeste() {
  const afd = _aktivBruger.afd;
  return _newsItems.filter(n => n.afd === afd && !_erLaest(n.id)).length;
}

function _highlightText(text, query) {
  if (!query) return text;
  const re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
  return text.replace(re, '<mark style="background:#fef08a;border-radius:2px;padding:0 1px">$1</mark>');
}

function _updateNewsBadge() {
  const count = _antalUlaeste();
  const badge = document.getElementById('nyhedBadge');
  if (!badge) return;
  if (count > 0) { badge.style.display = 'flex'; badge.textContent = count; }
  else badge.style.display = 'none';
}

// ── RENDER NYHEDSLISTE ────────────────────────────────────────────
function _renderNews() {
  const container = document.getElementById('nyhedListContainer');
  if (!container) return;

  const query = (document.getElementById('nyhedSearch')?.value || '').trim().toLowerCase();
  const afd = _aktivBruger.afd;

  // Kun egen afdeling — altid
  let filtered = _newsItems.filter(n => {
    if (n.afd !== afd) return false;
    if (query) {
      const txt = (n.titel + n.uge + n.slides.map(s => s.title + s.text).join(' ')).toLowerCase();
      return txt.includes(query);
    }
    return true;
  });

  filtered.sort((a, b) => b.dato - a.dato);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:48px 20px;color:var(--muted)">
        <div style="font-size:32px;margin-bottom:8px">📭</div>
        <div style="font-size:14px">${query ? `Ingen resultater for "${query}"` : 'Ingen nyhedsbreve endnu'}</div>
      </div>
      <div class="ny-upload-btn" onclick="openNyhedModal()">
        <span>📎</span> Tilføj nyhedsbrev
      </div>`;
    return;
  }

  const years = [...new Set(filtered.map(n => n.dato.getFullYear()))];
  let html = '';

  years.forEach(yr => {
    html += `<div class="ny-year-lbl">${yr}</div>`;
    filtered.filter(n => n.dato.getFullYear() === yr).forEach(n => {
      const laest = _erLaest(n.id);
      const dateStr = n.dato.toLocaleDateString('da-DK', { day: 'numeric', month: 'long' });
      html += `
        <div class="ny-card${n.expanded ? ' open' : ''}${!laest ? ' ulaest' : ''}" id="nyc-${n.id}">
          <div class="ny-card-hdr" onclick="toggleNyhed(${n.id})">
            <div class="ny-unread-dot" style="opacity:${!laest ? 1 : 0}"></div>
            <div class="ny-card-meta">
              <div class="ny-card-title">${_highlightText(n.titel, query)}</div>
              <div class="ny-card-sub">
                ${_highlightText(n.uge, query)}
                <span class="ny-status-pill ${laest ? 'laest' : 'ulaest'}">${laest ? 'Læst' : 'Ulæst'}</span>
              </div>
            </div>
            <div class="ny-card-date">${dateStr}</div>
            <svg class="ny-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="ny-card-body">`;

      n.slides.forEach(s => {
        html += `
            <div class="ny-slide">
              <div class="ny-slide-title">${_highlightText(s.title, query)}</div>
              <div class="ny-slide-text">${_highlightText(s.text, query)}</div>
            </div>`;
      });

      html += `
          </div>
        </div>`;
    });
  });

  html += `<div class="ny-upload-btn" onclick="openNyhedModal()"><span>📎</span> Tilføj nyhedsbrev</div>`;
  container.innerHTML = html;
}

// ── TOGGLE NYHED (åbn + marker læst) ─────────────────────────────
function toggleNyhed(id) {
  const n = _newsItems.find(n => n.id === id);
  if (!n) return;
  n.expanded = !n.expanded;
  if (n.expanded && !_erLaest(id)) {
    _markerLaest(id);
  } else {
    _renderNews();
  }
}

// ── TILFØJ / GEM NYHEDSBREV ────────────────────────────────────────
function openNyhedModal() {
  document.getElementById('nyhedModal').style.display = 'flex';
}
function closeNyhedModal() {
  document.getElementById('nyhedModal').style.display = 'none';
}
function gemNyhedsbrev() {
  const titel  = document.getElementById('ny-titel').value.trim() || 'Nyhedsbrev';
  const afd    = document.getElementById('ny-afd').value;
  const uge    = document.getElementById('ny-uge').value.trim();
  const tekst  = document.getElementById('ny-tekst').value.trim();
  if (!tekst) { alert('Indsæt indhold'); return; }
  _newsItems.push({
    id: _nextNewsId++, afd, titel, uge,
    dato: new Date(), expanded: false,
    slides: [{ title: 'Indhold', text: tekst }]
  });
  // Produktion: await addDoc(collection(db, 'nyheder'), { afd, titel, uge, dato: serverTimestamp(), slides })
  closeNyhedModal();
  ['ny-titel','ny-uge','ny-tekst'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  _updateNewsBadge();
  _renderNews();
}

// ── ADMIN: SLET / REDIGER ─────────────────────────────────────────
function adminSletNyhed(id) {
  if (!confirm('Slet dette nyhedsbrev for alle brugere?')) return;
  const idx = _newsItems.findIndex(n => n.id === id);
  if (idx > -1) _newsItems.splice(idx, 1);
  // Produktion: await deleteDoc(doc(db, 'nyheder', id))
  // Brugernes laestNyheder-dokumenter berøres IKKE — de lever i brugerprofiler
  _updateNewsBadge();
  _renderNewsAdminPanel();
  _renderNews();
}

function _renderNewsAdminPanel() {
  const panel = document.getElementById('nyhedAdminListe');
  if (!panel) return;
  const mine = _newsItems.filter(n => n.afd === _aktivBruger.afd);
  if (mine.length === 0) {
    panel.innerHTML = '<div style="font-size:12px;color:var(--muted)">Ingen nyhedsbreve endnu</div>';
    return;
  }
  panel.innerHTML = mine.map(n => `
    <div class="ny-admin-row">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:var(--text)">${n.uge}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:1px">${n.dato.toLocaleDateString('da-DK',{day:'numeric',month:'long',year:'numeric'})}</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="adminRedigerNyhed(${n.id})">Redigér</button>
      <button class="btn btn-sm" style="background:var(--rbg);color:var(--red);border:1px solid var(--rbrd)" onclick="adminSletNyhed(${n.id})">Slet</button>
    </div>`).join('');
}

function adminRedigerNyhed(id) {
  const n = _newsItems.find(n => n.id === id);
  if (!n) return;
  document.getElementById('ny-titel').value = n.titel;
  document.getElementById('ny-afd').value   = n.afd;
  document.getElementById('ny-uge').value   = n.uge;
  document.getElementById('ny-tekst').value = n.slides.map(s => s.title + '\n' + s.text).join('\n\n');
  openNyhedModal();
}

// ── SKIFT BRUGER (demo — erstattes af AD-login i produktion) ──────
function nyhedSkiftBruger(uid) {
  _aktivBruger = _nyhedsBrugere.find(b => b.uid === uid) || _aktivBruger;
  _updateNewsBadge();
  _renderNews();
  _renderNyhedBrugerPanel();
  const isLeder = _aktivBruger.rolle === 'leder';
  const adminSek = document.getElementById('nyhedAdminSektion');
  if (adminSek) adminSek.style.display = isLeder ? 'block' : 'none';
  if (isLeder) _renderNewsAdminPanel();
}

function _renderNyhedBrugerPanel() {
  const panel = document.getElementById('nyhedBrugerPanel');
  if (!panel) return;
  const brugere = _nyhedsBrugere.filter(b => b.afd === _aktivBruger.afd);
  panel.innerHTML = brugere.map(b => `
    <div onclick="nyhedSkiftBruger('${b.uid}')" class="ny-bruger-row${b.uid === _aktivBruger.uid ? ' aktiv' : ''}">
      <div class="ny-bruger-avatar${b.uid === _aktivBruger.uid ? ' aktiv' : ''}">${b.initialer}</div>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:600;color:var(--text)">${b.navn}</div>
        <div style="font-size:11px;color:var(--muted)">${b.rolle}</div>
      </div>
    </div>`).join('');
}

// ── NYHEDER-FANE HTML INJICERING ─────────────────────────────────
function _injectNyhederTab() {
  // Tilføj fane-knap i view-tabs
  const viewTabs = document.querySelector('.view-tabs');
  if (viewTabs && !document.getElementById('vtabNyheder')) {
    const btn = document.createElement('div');
    btn.className = 'view-tab';
    btn.id = 'vtabNyheder';
    btn.style.position = 'relative';
    btn.innerHTML = `📰 Nyheder <span id="nyhedBadge" style="display:none;position:absolute;top:4px;right:4px;background:var(--red);color:#fff;font-size:9px;font-weight:700;min-width:14px;height:14px;border-radius:7px;align-items:center;justify-content:center;padding:0 3px">0</span>`;
    btn.onclick = () => switchView('nyheder');
    viewTabs.appendChild(btn);
  }

  // Injicér nyheder-view i main-content hvis det ikke findes
  const mainContent = document.querySelector('.main-content');
  if (mainContent && !document.getElementById('nyhedView')) {
    const div = document.createElement('div');
    div.id = 'nyhedView';
    div.style.cssText = 'max-width:720px;margin:0 auto;display:none';
    div.innerHTML = `
      <!-- Søgebar -->
      <div class="ny-searchbar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;color:var(--muted)"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input id="nyhedSearch" placeholder="Søg i nyhedsbreve…" oninput="_renderNews()"
          style="flex:1;border:none;background:transparent;font-size:14px;font-family:inherit;outline:none;color:var(--text)">
      </div>
      <div class="ny-afd-chip" id="nyhedAfdChip"></div>

      <!-- Liste -->
      <div id="nyhedListContainer"></div>

      <!-- Admin-sektion (kun leder) -->
      <div id="nyhedAdminSektion" style="display:none;margin-top:24px;border-top:1px solid var(--border);padding-top:18px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div>
            <div style="font-size:13px;font-weight:700;color:var(--text)">🔐 Admin — Nyhedsstyring</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">Kun leder kan redigere og slette</div>
          </div>
          <span style="font-size:10px;padding:2px 8px;border-radius:20px;background:var(--rbg);color:var(--red);border:1px solid var(--rbrd)">Kun leder</span>
        </div>
        <div id="nyhedAdminListe" style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px"></div>
        <button class="btn btn-primary btn-sm" style="width:100%;justify-content:center" onclick="openNyhedModal()">+ Tilføj nyhedsbrev</button>

        <!-- SSO-knap -->
        <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:14px">
          <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px">Active Directory SSO integration</div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Implementeringskode til OUH AD via SAML/OAuth — kræver aftale med Regional IT</div>
          <button class="btn btn-ghost btn-sm" style="width:100%;justify-content:center;border-color:var(--blue);color:var(--blue)" onclick="document.getElementById('ssoModal').style.display='flex'">
            🏥 Vis SSO-integrationskode (AD/SAML)
          </button>
        </div>
      </div>

      <!-- Demo: brugerskift -->
      <div style="margin-top:24px;border-top:1px solid var(--border);padding-top:16px">
        <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Demo — skift bruger (erstattes af AD-login)</div>
        <div id="nyhedBrugerPanel"></div>
      </div>`;
    mainContent.appendChild(div);
  }

  // Tilføj nyhedsbrev-modal
  if (!document.getElementById('nyhedModal')) {
    const m = document.createElement('div');
    m.id = 'nyhedModal';
    m.className = 'overlay';
    m.style.display = 'none';
    m.innerHTML = `
      <div class="modal" style="max-width:500px;max-height:85vh;overflow-y:auto">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div class="modal-title" style="margin:0">Tilføj nyhedsbrev</div>
          <button class="btn btn-ghost btn-sm" onclick="closeNyhedModal()">✕</button>
        </div>
        <div class="form-group"><label class="flabel">Titel</label>
          <input class="ifield" id="ny-titel" placeholder="fx N Sengeafsnit Nyhedsbrev" style="width:100%"></div>
        <div class="form-group"><label class="flabel">Afdeling</label>
          <select class="ifield" id="ny-afd" style="width:100%">
            <option value="N">Afd. N – Neurologi</option>
            <option value="U">Afd. U – Urologi</option>
            <option value="K">Afd. K – Kardiologi</option>
            <option value="O">Afd. O – Ortopædi</option>
            <option value="P">Afd. P – Psykiatri</option>
          </select></div>
        <div class="form-group"><label class="flabel">Uge / dato</label>
          <input class="ifield" id="ny-uge" placeholder="fx Uge 17 – 2026" style="width:100%"></div>
        <div class="form-group"><label class="flabel">Indhold</label>
          <textarea class="ifield" id="ny-tekst" rows="6" placeholder="Indsæt tekst fra nyhedsbrev…" style="width:100%;resize:vertical"></textarea></div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:12px">I produktion: upload .pptx eller .pdf direkte via Firebase Storage</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" style="flex:1" onclick="gemNyhedsbrev()">Gem nyhedsbrev</button>
          <button class="btn btn-ghost" onclick="closeNyhedModal()">Annuller</button>
        </div>
      </div>`;
    document.body.appendChild(m);
  }

  // SSO-modal
  if (!document.getElementById('ssoModal')) {
    const s = document.createElement('div');
    s.id = 'ssoModal';
    s.className = 'overlay';
    s.style.display = 'none';
    s.innerHTML = `
      <div class="modal" style="max-width:600px;max-height:90vh;overflow-y:auto">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div class="modal-title" style="margin:0">SSO — Active Directory integration</div>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('ssoModal').style.display='none'">✕</button>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:12px">Indsæt i <code style="background:var(--s2);padding:1px 5px;border-radius:4px">firebase/auth.js</code> — kræver Regional IT godkendelse</div>
        <div id="ssoCodeBlock" style="background:#0d1117;border-radius:10px;padding:14px;overflow-x:auto;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#e6edf3;line-height:1.7;max-height:52vh;overflow-y:auto">
<pre style="margin:0;white-space:pre-wrap"><span style="color:#8b949e">// ── OUH Active Directory SSO via SAML 2.0 ──────────────
// Kræver: Firebase Auth + AD FS opsætning hos Regional IT
// ─────────────────────────────────────────────────────────</span>

<span style="color:#ff7b72">import</span> { getAuth, SAMLAuthProvider, signInWithPopup } <span style="color:#ff7b72">from</span> <span style="color:#a5d6ff">"firebase/auth"</span>;
<span style="color:#ff7b72">import</span> { getFirestore, doc, setDoc, getDoc, getDocs,
         collection, query, where } <span style="color:#ff7b72">from</span> <span style="color:#a5d6ff">"firebase/firestore"</span>;

<span style="color:#8b949e">// 1. Konfigurér SAML-provider med OUH's AD FS</span>
<span style="color:#ff7b72">const</span> provider = <span style="color:#ff7b72">new</span> SAMLAuthProvider(
  <span style="color:#a5d6ff">"saml.ouh-active-directory"</span>
  <span style="color:#8b949e">// Provider-ID aftales med Regional IT</span>
  <span style="color:#8b949e">// AD FS metadata: https://adfs.ouh.dk/FederationMetadata/...</span>
);

<span style="color:#8b949e">// 2. Login — åbner OUH Windows-login popup</span>
<span style="color:#ff7b72">async function</span> <span style="color:#d2a8ff">loginMedAD</span>() {
  <span style="color:#ff7b72">const</span> auth = getAuth();
  <span style="color:#ff7b72">try</span> {
    <span style="color:#ff7b72">const</span> result = <span style="color:#ff7b72">await</span> signInWithPopup(auth, provider);
    <span style="color:#ff7b72">const</span> bruger = result.user;
    <span style="color:#8b949e">// Hent AD-attributter: afdeling og rolle fra AD-grupper</span>
    <span style="color:#ff7b72">const</span> afdeling = <span style="color:#8b949e">/* fx "N" fra AD-gruppe "Neurologi-N" */</span>;
    <span style="color:#ff7b72">const</span> rolle = bruger.email.includes(<span style="color:#a5d6ff">"leder"</span>) ? <span style="color:#a5d6ff">"leder"</span> : <span style="color:#a5d6ff">"plejepersonale"</span>;

    <span style="color:#8b949e">// 3. Gem bruger i Firestore</span>
    <span style="color:#ff7b72">await</span> setDoc(doc(db, <span style="color:#a5d6ff">"brugere"</span>, bruger.uid), {
      navn: bruger.displayName,
      email: bruger.email,
      afdeling,
      rolle,
      sidstLogin: <span style="color:#ff7b72">new</span> Date()
    }, { merge: <span style="color:#ff7b72">true</span> });

    <span style="color:#ff7b72">return</span> { bruger, afdeling, rolle };
  } <span style="color:#ff7b72">catch</span>(err) { console.error(<span style="color:#a5d6ff">"AD login fejl:"</span>, err); }
}

<span style="color:#8b949e">// 4. Firestore sikkerhedsregler (firestore.rules)</span>
<span style="color:#ffa657">rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /nyheder/{newsId} {
      // Læs: kun egen afdeling
      allow read: if request.auth != null
        &amp;&amp; get(/brugere/$(request.auth.uid)).data.afdeling
           == resource.data.afd;
      // Slet/rediger: kun leder på egen afd.
      allow write, delete: if request.auth != null
        &amp;&amp; get(/brugere/$(request.auth.uid)).data.rolle == "leder"
        &amp;&amp; get(/brugere/$(request.auth.uid)).data.afdeling
           == resource.data.afd;
    }
    match /brugere/{uid}/laestNyheder/{newsId} {
      // Kun brugeren selv
      allow read, write: if request.auth.uid == uid;
    }
  }
}</span>

<span style="color:#8b949e">// 5. Marker nyhed som læst (per bruger)</span>
<span style="color:#ff7b72">async function</span> <span style="color:#d2a8ff">markerLaest</span>(brugerUid, newsId) {
  <span style="color:#ff7b72">await</span> setDoc(
    doc(db, <span style="color:#a5d6ff">`brugere/\${brugerUid}/laestNyheder/\${newsId}`</span>),
    { laestDen: serverTimestamp() }
  );
}

<span style="color:#8b949e">// 6. Hent ulæste nyheder for bruger</span>
<span style="color:#ff7b72">async function</span> <span style="color:#d2a8ff">hentUlaeste</span>(brugerUid, afdeling) {
  <span style="color:#ff7b72">const</span> nyheder = <span style="color:#ff7b72">await</span> getDocs(
    query(collection(db, <span style="color:#a5d6ff">"nyheder"</span>), where(<span style="color:#a5d6ff">"afd"</span>, <span style="color:#a5d6ff">"=="</span>, afdeling))
  );
  <span style="color:#ff7b72">const</span> laest = <span style="color:#ff7b72">await</span> getDocs(
    collection(db, <span style="color:#a5d6ff">`brugere/\${brugerUid}/laestNyheder`</span>)
  );
  <span style="color:#ff7b72">const</span> laestIds = <span style="color:#ff7b72">new</span> Set(laest.docs.map(d => d.id));
  <span style="color:#ff7b72">return</span> nyheder.docs.filter(d => !laestIds.has(d.id));
}</pre>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-ghost" style="flex:1" onclick="document.getElementById('ssoModal').style.display='none'">Luk</button>
          <button class="btn btn-primary btn-sm" onclick="navigator.clipboard?.writeText(document.querySelector('#ssoCodeBlock pre').textContent);alert('Kode kopieret!')">Kopiér kode</button>
        </div>
      </div>`;
    document.body.appendChild(s);
  }
}

// ── HOOK IND I EKSISTERENDE switchView ───────────────────────────
(function() {
  const _origSwitchView = window.switchView;
  window.switchView = function(view) {
    if (typeof _origSwitchView === 'function') _origSwitchView(view);

    const nyhedView = document.getElementById('nyhedView');
    const vtabNyheder = document.getElementById('vtabNyheder');

    // Skjul/vis nyheder-view
    if (nyhedView) nyhedView.style.display = view === 'nyheder' ? 'block' : 'none';

    // Opdatér aktiv tab-klasse
    document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
    if (view === 'nyheder' && vtabNyheder) {
      vtabNyheder.classList.add('active');
      _renderNews();
      _renderNyhedBrugerPanel();
      const isLeder = _aktivBruger.rolle === 'leder';
      const adminSek = document.getElementById('nyhedAdminSektion');
      if (adminSek) adminSek.style.display = isLeder ? 'block' : 'none';
      if (isLeder) _renderNewsAdminPanel();
      // Opdatér afd-chip
      const chip = document.getElementById('nyhedAfdChip');
      if (chip) chip.innerHTML = `<span style="font-size:11px;padding:3px 10px;border-radius:20px;background:var(--gbg);color:var(--green);border:1px solid var(--gbrd);font-weight:600">Afd. ${_aktivBruger.afd} – kun egne nyheder</span>`;
    } else {
      const tabId = 'vtab' + view.charAt(0).toUpperCase() + view.slice(1);
      const tab = document.getElementById(tabId);
      if (tab) tab.classList.add('active');
    }
  };
})();

// ── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  _injectNyhederTab();
  _updateNewsBadge();
});
