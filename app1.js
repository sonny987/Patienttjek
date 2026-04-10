

// Generer tidspunkter fordelt jævnt over 24 timer fra et givent starttidspunkt
function generateTimesFromNow(count, startHHMM){
  if(count <= 0) return [];
  const intervalMin = Math.round(24 * 60 / count);

  // Parse starttidspunkt
  let startMin;
  if(startHHMM){
    const [h,m] = startHHMM.split(':').map(Number);
    startMin = h*60 + m;
  } else {
    // Standard fra nu — rund op til nærmeste hele kvarter
    const now = new Date();
    const nowMin = now.getHours()*60 + now.getMinutes();
    startMin = Math.ceil(nowMin/15)*15; // rund op til kvarter
  }

  const times = [];
  for(let i = 0; i < count; i++){
    const totalMin = (startMin + i * intervalMin) % (24 * 60);
    const h = String(Math.floor(totalMin / 60)).padStart(2,'0');
    const m = String(totalMin % 60).padStart(2,'0');
    times.push(`${h}:${m}`);
  }
  return times;
}

// Statiske TIME_SUGGESTIONS bruges stadig som fallback/reference
function generateTimeSuggestions(count){
  return generateTimesFromNow(count, null);
}

const TIME_SUGGESTIONS = {};
for(let n = 1; n <= 48; n++){
  TIME_SUGGESTIONS[n] = generateTimeSuggestions(n);
}
TIME_SUGGESTIONS[24] = Array.from({length:24},(_,i)=>`${String(i).padStart(2,'0')}:00`);
TIME_SUGGESTIONS[48] = Array.from({length:48},(_,i)=>{
  const h = String(Math.floor(i/2)).padStart(2,'0');
  const m = i%2===0 ? '00' : '30';
  return `${h}:${m}`;
});

const ROOMS = [
  { stue:'1',  senge:['1','2'] },
  { stue:'2',  senge:['1'] },
  { stue:'3',  senge:['1'] },
  { stue:'4',  senge:['1','2'] },
  { stue:'5',  senge:['1','2','3'] },
  { stue:'6',  senge:['1','2'] },
  { stue:'8',  senge:['1'] },
  { stue:'9',  senge:['1','2'] },
  { stue:'10', senge:['1','2','3'] },
  { stue:'11', senge:['2','3','4'] },
  { stue:'41', senge:['1','2'] },
  { stue:'42', senge:['1'] },
  { stue:'43', senge:['1'] },
  { stue:'44', senge:['1','2'] },
  { stue:'46', senge:['1','2'] },
  { stue:'47', senge:['1'] },
  { stue:'48', senge:['1'] },
  { stue:'49', senge:['1','2'] },
];

const MED_TIMES = ['06:00','12:00','17:00','22:00'];

const ICH_FIELDS = [
  {id:'gcs',label:'GCS',max:2,opts:['2 — GCS 13–15','1 — GCS 5–12','0 — GCS 3–4']},
];

const SSS_ITEMS = [
  {id:'bev',label:'Bevidsthed',opts:['6 Fuldt vågen','4 Somnolent','2 Reagerer','0 Ingen reaktion']},
  {id:'ori',label:'Orientering',opts:['6 Korrekt','4 Delvist','0 Ingen']},
  {id:'tal',label:'Tale',opts:['10 Normal','6 Lettere afasi','3 Svær afasi','0 Ingen tale']},
  {id:'ans',label:'Ansigtsparese',opts:['2 Ingen','1 Let','0 Udtalt']},
  {id:'arm',label:'Arm motorik',opts:['6 Normal','5 Let nedsæt','4 Modstår','2 Løfter ikke','0 Lammelse']},
  {id:'han',label:'Hånd motorik',opts:['6 Normal','4 Let nedsæt','2 Griber','0 Lammelse']},
  {id:'ben',label:'Ben motorik',opts:['6 Normal','5 Let nedsæt','4 Modstår','2 Løfter ikke','0 Lammelse']},
  {id:'ori2',label:'Orientering gang',opts:['12 Normal','9 Hjælpemiddel','6 Støtte','3 Siddende','0 Liggende']},
];

function defaultSections() {
  return {
    vaske: {
      title:'Personlig hygiejne', icon:'🚿', color:'blue', open:true, enabled:true,
      tasks:[
        {id:uid(),label:'Vask af hoved',done:false,status:'pending',count:null,times:[],enabled:true},
        {id:uid(),label:'Vask af overkrop',done:false,status:'pending',count:null,times:[],enabled:true},
        {id:uid(),label:'Vask af nedre',done:false,status:'pending',count:null,times:[],enabled:true},
        {id:uid(),label:'Fuld vask',done:false,status:'pending',count:null,times:[],enabled:true},
        {id:uid(),label:'Mundpleje',done:false,status:'pending',count:null,times:[],enabled:true},
        {id:uid(),label:'Positionering / lejeskifte',done:false,status:'pending',count:3,times:['06:00','12:00','18:00'],enabled:true},
        {id:uid(),label:'Tryk-sår inspektion',done:false,status:'pending',count:2,times:['08:00','20:00'],enabled:true},
      ]
    },
    kost: {
      title:'Ernæring', icon:'🍽️', color:'orange', open:false, enabled:true,
      kostType: '',
      sonde: false,
      sondeFreq: '',
      sondeMl: '',
      sondeType: '',
      tasks:[
        {id:uid(),label:'Morgenmad',done:false,status:'pending',time:'07:30',enabled:true},
        {id:uid(),label:'Frokost',done:false,status:'pending',time:'12:00',enabled:true},
        {id:uid(),label:'Aftensmad',done:false,status:'pending',time:'17:30',enabled:true},
        {id:uid(),label:'Mellemmåltid',done:false,status:'pending',time:'10:00',enabled:true},
        {id:uid(),label:'Mellemmåltid aften',done:false,status:'pending',time:'20:00',enabled:true},
        {id:uid(),label:'Drikkeprotokol (ml/dag)',done:false,status:'pending',count:null,times:[],enabled:true},
      ]
    },
    medicin: {
      title:'Medicin', icon:'💊', color:'green', open:false, enabled:true,
      items:[]
    },
    sss: {
      title:'Skandinavisk Stroke Skala (SSS)', icon:'🧠', color:'orange', open:false, enabled:true,
      scores:{bev:6,ori:6,tal:10,ans:2,arm:6,han:6,ben:6,ori2:12},
      history:[], freq:2, times:['08:00','20:00']
    },
    ich: {
      title:'ICH Målinger (BP/GCS)', icon:'🩻', color:'teal', open:false, enabled:true,
      scores:{gcs:2},
      history:[], interval:'60', times:['08:00']
    },
    tromb: {
      title:'Trombolyse / EVT', icon:'🩺', color:'purple', open:false, enabled:true,
      given:false,
      time:'',
      alteplase:'',
      notes:'',
      observations:[]
    },
    ekstra: {
      title:'Øvrige opgaver', icon:'📋', color:'blue', open:false, enabled:true,
      tasks:[]
    },
    bleskift: {
      title:'Bleskift', icon:'🔄', color:'yellow', open:false, enabled:true,
      entries:[] // [{time, done, doneAt, type:'ble'|'tørre', note}]
    },
    sik: {
      title:'SIK — Subkutan Infusion / Kateter', icon:'💉', color:'teal', open:false, enabled:true,
      entries:[] // [{site, insertedAt, changedAt, note, done}]
    },
    td: {
      title:'Time Diurese (TD)', icon:'🧪', color:'blue', open:false, enabled:true,
      interval: '60', // minutter
      entries:[] // [{time, ml, done, recordedAt}]
    },
    plejeplan: {
      title:'Plejeforløbsplan', icon:'📝', color:'purple', open:false, enabled:true,
      tasks:[
        {id:uid(),label:'Indlæggelsessamtale gennemført',done:false,status:'pending',count:null,times:[],enabled:true},
        {id:uid(),label:'Plejebehov vurderet (ADL)',done:false,status:'pending',count:null,times:[],enabled:true},
        {id:uid(),label:'Ernæringsscreening (NRS 2002)',done:false,status:'pending',count:null,times:[],enabled:true},
        {id:uid(),label:'Tryksårsvurdering (Braden)',done:false,status:'pending',count:null,times:[],enabled:true},
        {id:uid(),label:'Faldrisiko vurderet',done:false,status:'pending',count:null,times:[],enabled:true},
        {id:uid(),label:'Smerteregistrering (VAS/NRS)',done:false,status:'pending',count:null,times:[],enabled:true},
        {id:uid(),label:'Pårørende kontaktet / informeret',done:false,status:'pending',count:null,times:[],enabled:true},
        {id:uid(),label:'Rehabiliteringsmål aftalt',done:false,status:'pending',count:null,times:[],enabled:true},
        {id:uid(),label:'Udskrivningsplan påbegyndt',done:false,status:'pending',count:null,times:[],enabled:true},
        {id:uid(),label:'Tværfaglig konference',done:false,status:'pending',count:null,times:[],enabled:true},
      ]
    },
    ankomst: {
      title:'Ankomststatus', icon:'🏥', color:'red', open:false, enabled:true,
      items:[
        {id:uid(),label:'TOKS',done:false,priority:'red',note:'',createdAt:'',completedAt:''},
        {id:uid(),label:'SSS (Skandinavisk Stroke Skala)',done:false,priority:'red',note:'',createdAt:'',completedAt:''},
        {id:uid(),label:'Neurologisk sygplejeobservationer',done:false,priority:'red',note:'',createdAt:'',completedAt:''},
        {id:uid(),label:'GUSS (Synketest)',done:false,priority:'yellow',note:'',createdAt:'',completedAt:''},
        {id:uid(),label:'Ernæringsopsporing (højde og vægt)',done:false,priority:'yellow',note:'',createdAt:'',completedAt:''},
        {id:uid(),label:'Tidlig mobilisering',done:false,priority:'yellow',note:'',createdAt:'',completedAt:''},
        {id:uid(),label:'Tryksårsscreening',done:false,priority:'yellow',note:'',createdAt:'',completedAt:''},
        {id:uid(),label:'Socialt (pårørende/netværk)',done:false,priority:'green',note:'',createdAt:'',completedAt:''},
        {id:uid(),label:'MRSA og CPO screening',done:false,priority:'green',note:'',createdAt:'',completedAt:''},
      ]
    },
    prioritering: {
      title:'Prioriteringsliste', icon:'⚡', color:'red', open:false, enabled:true,
      items:[] // [{id, label, priority:'red'|'yellow'|'green', note, createdAt, completedAt, done}]
    }
  };
}

let patients = JSON.parse(localStorage.getItem('kp2_pts') || '[]');

const SYNC_CONFIG = {
  apiKey:      'AIzaSyDBKvfijAUyH6EtRTyHhvQRKi4-SMatNww',
  databaseURL: 'https://patientertjek-default-rtdb.europe-west1.firebasedatabase.app',
  projectId:   'patientertjek',
};
if(localStorage.getItem('sync_fb_apiKey'))   SYNC_CONFIG.apiKey      = localStorage.getItem('sync_fb_apiKey');
if(localStorage.getItem('sync_fb_dbURL'))    SYNC_CONFIG.databaseURL = localStorage.getItem('sync_fb_dbURL');
if(localStorage.getItem('sync_fb_projId'))   SYNC_CONFIG.projectId   = localStorage.getItem('sync_fb_projId');

let _fbApp      = null;
let _fbDb       = null;
let _fbListener = null;
let _syncPaused = false;
let _isSaving   = false;
let _pushTimer  = null;
let _ignoreNext = false; // ignore own push coming back as remote update

const _bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('kp2_sync') : null;
if(_bc){
  _bc.onmessage = e => {
    if(e.data && e.data.type === 'update'){
      patients = e.data.patients;
      localStorage.setItem('kp2_pts', JSON.stringify(patients));
      applyMigrations();
      render();
    }
  };
}

let _lastSaveTime = 0;

function save(){
  localStorage.setItem('kp2_pts', JSON.stringify(patients));
  localStorage.setItem('kp2_pts_ts', Date.now().toString()); // timestamp for conflict detection
  _lastSaveTime = Date.now();
  if(_bc) _bc.postMessage({type:'update', patients: JSON.parse(JSON.stringify(patients))});
  if(_pushTimer) clearTimeout(_pushTimer);
  if(_syncMode === 'sheets') pushToSheets();
  else if(_fbDb && !_isSaving) pushToCloud();
  updateSyncStatus('saving');
}

async function saveNow(){
  localStorage.setItem('kp2_pts', JSON.stringify(patients));
  localStorage.setItem('kp2_pts_ts', Date.now().toString());
  const btn = document.getElementById('saveNowBtn');
  if(btn){ btn.textContent = '⏳ Gemmer...'; btn.disabled = true; }
  try {
    if(_fbDb){
      _isSaving = false; // reset så vi kan pushe selvom _isSaving er true
      await pushToCloud();
    }
    if(btn){ btn.textContent = '✓ Gemt!'; btn.style.background='var(--green)'; btn.style.color='#fff'; }
    setTimeout(()=>{
      if(btn){ btn.textContent='💾 Gem nu'; btn.style.background=''; btn.style.color=''; btn.disabled=false; }
    }, 2000);
  } catch(e){
    if(btn){ btn.textContent='✗ Fejl'; btn.disabled=false; }
  }
}

async function initFirebase(){
  if(!SYNC_CONFIG.apiKey || !SYNC_CONFIG.databaseURL || !SYNC_CONFIG.projectId){
    updateSyncStatus('local');
    return;
  }
  updateSyncStatus('saving');

  _fbDb = {
    _base: SYNC_CONFIG.databaseURL.replace(/\/$/, ''),
    _auth: ''
  };

  _fbDb.url = function(path, params){
    let url = `${this._base}${path}.json`;
    const p = new URLSearchParams(params || {});
    if(this._auth) p.set('auth', this._auth);
    const q = p.toString();
    return q ? `${url}?${q}` : url;
  }.bind(_fbDb);

  try {
    const res = await fetch(_fbDb.url('/kp2/ping'), {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ts: Date.now(), ok: true})
    });
    if(!res.ok){
      const txt = await res.text();
      throw new Error(`HTTP ${res.status}: ${txt.slice(0,80)}`);
    }
  } catch(e){
    console.error('Firebase REST test fejl:', e.message);
    updateSyncStatus('offline');
    const dot = document.getElementById('syncDot');
    const lbl = document.getElementById('syncStatusTxt');
    if(dot) dot.title = e.message;
    if(lbl){ lbl.textContent = '⚠ Offline'; lbl.title = e.message; }
    _fbDb = null;
    setTimeout(initFirebase, 15000);
    return;
  }

  try {
    const res = await fetch(_fbDb.url('/kp2/patients'), {cache:'no-store'});
    if(res.ok){
      const remote = await res.json();
      if(Array.isArray(remote) && remote.length > 0){
        const remoteStr = JSON.stringify(remote);
        const localStr  = JSON.stringify(patients);

        const localTs = parseInt(localStorage.getItem('kp2_pts_ts')||'0');
        const timeSinceLocalSave = Date.now() - localTs;

        if(localStr === '[]' || patients.length === 0){
          patients = remote;
          applyMigrations();
          localStorage.setItem('kp2_pts', JSON.stringify(patients));
          if(_bc) _bc.postMessage({type:'update', patients: JSON.parse(JSON.stringify(patients))});
          render();
        } else if(timeSinceLocalSave > 10000 && remoteStr !== localStr){
          patients = remote;
          applyMigrations();
          localStorage.setItem('kp2_pts', JSON.stringify(patients));
          if(_bc) _bc.postMessage({type:'update', patients: JSON.parse(JSON.stringify(patients))});
          render();
        } else if(remoteStr !== localStr){
          await pushToCloud();
        }
        _lastSyncStr = JSON.stringify(patients);
      } else if(patients.length > 0){
        await pushToCloud();
      }
    }
  } catch(e){ console.warn('Initial sync fejl:', e.message); }

  startFirebaseListener();
  startAutoBackup();
  updateSyncStatus('synced');

  window.addEventListener('beforeunload', ()=>{
    if(_fbDb && patients.length > 0){
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', _fbDb.url('/kp2/patients'), false);
        xhr.setRequestHeader('Content-Type','application/json');
        xhr.send(JSON.stringify(patients));
      } catch(e){}
    }
  });
}

async function pushToCloud(){
  if(!_fbDb){ updateSyncStatus('local'); return; }
  if(_isSaving) return;
  _isSaving = true;
  try {
    _ignoreNext = true;
    const res = await fetch(_fbDb.url('/kp2/patients'), {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(patients)
    });
    if(!res.ok){
      const txt = await res.text().catch(()=>'');
      throw new Error('HTTP ' + res.status + ': ' + txt.slice(0,60));
    }
    _lastSyncStr = JSON.stringify(patients);
    updateSyncStatus('synced');
  } catch(e){
    _ignoreNext = false;
    console.warn('Push fejl:', e.message);
    updateSyncStatus('error');
    const lbl = document.getElementById('syncStatusTxt');
    if(lbl) lbl.title = e.message;
    setTimeout(()=>{ if(_fbDb && !_isSaving) pushToCloud(); }, 2000);
  } finally {
    _isSaving = false;
  }
}

function startFirebaseListener(){
  if(_fbListener) clearInterval(_fbListener);
  _fbListener = setInterval(async () => {
    if(_isSaving || _syncPaused) return;
    if(Date.now() - _lastSaveTime < 3000) return;
    try {
      const res = await fetch(_fbDb.url('/kp2/patients'), { cache: 'no-store' });
      if(!res.ok){ updateSyncStatus('error'); return; }
      const remote = await res.json();

      if(!Array.isArray(remote)){
        if(patients.length > 0) pushToCloud();
        return;
      }

      const remoteStr = JSON.stringify(remote);
      const localStr  = JSON.stringify(patients);
      if(remoteStr !== _lastSyncStr && remoteStr !== localStr){
        _lastSyncStr = remoteStr;
        patients = remote;
        applyMigrations();
        localStorage.setItem('kp2_pts', JSON.stringify(patients));
        localStorage.setItem('kp2_pts_ts', Date.now().toString());
        if(_bc) _bc.postMessage({type:'update', patients: JSON.parse(JSON.stringify(patients))});
        render();
      }
      updateSyncStatus('synced');
    } catch(e){
      updateSyncStatus('offline');
    }
  }, 1500);
}

async function saveBackupToFirebase(){
  if(!_fbDb || patients.length === 0) return;
  try {
    const key = Date.now();
    const snap = { ts: key, dt: fmtDT(key), count: patients.length, patients: JSON.parse(JSON.stringify(patients)) };
    await fetch(_fbDb.url(`/kp2/backups/${key}`), {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(snap)
    });
  } catch(e){ console.warn('Backup fejl:', e.message); }
}

async function logActivity(action, detail, pid){
  if(!_fbDb) return;
  const entry = { ts: Date.now(), dt: fmtDT(Date.now()), actor: _actorName||'Ukendt', action, detail, pid: pid||'' };
  try {
    await fetch(_fbDb.url(`/kp2/log/${Date.now()}_${Math.random().toString(36).slice(2,6)}`), {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(entry)
    });
  } catch(e){}
}

async function loadActivityLog(){
  const content = document.getElementById('logContent');
  if(!content) return;
  content.innerHTML = '<div style="color:var(--muted);padding:20px;text-align:center">⏳ Henter log...</div>';
  if(!_fbDb){ content.innerHTML = '<div style="color:var(--muted);padding:20px">Firebase ikke forbundet</div>'; return; }
  try {
    const res = await fetch(_fbDb.url('/kp2/log', {orderBy:'"ts"', limitToLast:100}));
    if(!res.ok){ content.innerHTML = '<div style="color:var(--red)">Fejl ved hentning</div>'; return; }
    const data = await res.json();
    if(!data){ content.innerHTML = '<div style="color:var(--muted);padding:20px;text-align:center">Ingen aktiviteter endnu</div>'; return; }
    const entries = Object.values(data).sort((a,b)=>b.ts-a.ts);
    content.innerHTML = entries.map(e=>`
      <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--muted);flex-shrink:0;margin-top:2px">${e.dt||''}</span>
        <div style="flex:1">
          <span style="font-size:12px;font-weight:600;color:var(--text)">${e.actor||'?'}</span>
          <span style="font-size:12px;color:var(--muted2)"> ${e.action||''}</span>
          ${e.detail?`<span style="font-size:11px;color:var(--muted)"> — ${e.detail}</span>`:''}
        </div>
      </div>`).join('');
  } catch(e){ content.innerHTML = `<div style="color:var(--red);padding:20px">Fejl: ${e.message}</div>`; }
}

async function loadBackupList(){
  const content = document.getElementById('backupContent');
  if(!content) return;
  content.innerHTML = '<div style="color:var(--muted);padding:10px">⏳ Henter snapshots...</div>';
  if(!_fbDb){ content.innerHTML = '<div style="color:var(--muted);padding:10px">Kræver Firebase</div>'; return; }
  try {
    const res = await fetch(_fbDb.url('/kp2/backups'));
    const data = await res.json();
    if(!data){ content.innerHTML = '<div style="color:var(--muted);padding:10px">Ingen backups endnu</div>'; return; }
    const backups = Object.entries(data).map(([k,v])=>({key:k,...v})).sort((a,b)=>b.ts-a.ts);
    content.innerHTML = backups.map(b=>`
      <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--muted);flex:1">${b.dt||b.key} — ${b.count||0} patienter</span>
        <button class="btn btn-ghost btn-sm" style="font-size:10px" onclick="restoreBackup('${b.key}')">↩ Gendan</button>
      </div>`).join('');
  } catch(e){ content.innerHTML = `<div style="color:var(--red);padding:10px">Fejl: ${e.message}</div>`; }
}

async function restoreBackup(key){
  if(!confirm('Gendan dette snapshot? Det overskriver alle nuværende data!')) return;
  try {
    const res = await fetch(_fbDb.url(`/kp2/backups/${key}`));
    const b = await res.json();
    if(!b || !Array.isArray(b.patients)){ alert('Backup ikke fundet'); return; }
    snapshotForUndo();
    patients = b.patients;
    applyMigrations();
    save(); render();
    alert('✓ Data gendannet fra ' + (b.dt||key));
    closeLogView();
  } catch(e){ alert('Fejl: '+e.message); }
}

async function loadArchive(){
  const content = document.getElementById('archiveContent');
  if(!content) return;
  content.innerHTML = '<div style="color:var(--muted);padding:10px">⏳ Henter arkiv...</div>';
  if(!_fbDb){ content.innerHTML = '<div style="color:var(--muted);padding:10px">Kræver Firebase</div>'; return; }
  try {
    const res = await fetch(_fbDb.url('/kp2/archive'));
    const data = await res.json();
    if(!data){ content.innerHTML = '<div style="color:var(--muted);padding:10px">Ingen arkiverede patienter</div>'; return; }
    const archived = Object.entries(data).map(([k,v])=>({key:k,...v}));
    content.innerHTML = archived.map(p=>`
      <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
        <div style="flex:1">
          <div style="font-size:12px;font-weight:600">${p.name||'?'}</div>
          <div style="font-size:10px;color:var(--muted)">${p.room||''} — Arkiveret: ${p.archivedAt||''} af ${p.archivedBy||'?'}</div>
        </div>
        <button class="btn btn-ghost btn-sm" style="font-size:10px" onclick="restoreArchivedPatient('${p.key}')">↩ Genopret</button>
      </div>`).join('');
  } catch(e){ content.innerHTML = `<div style="color:var(--red);padding:10px">Fejl: ${e.message}</div>`; }
}

async function restoreArchivedPatient(key){
  if(!_fbDb) return;
  const res = await fetch(_fbDb.url(`/kp2/archive/${key}`));
  const p = await res.json();
  if(!p){ alert('Patient ikke fundet i arkiv'); return; }
  snapshotForUndo();
  const {archivedAt, archivedBy, ...patientData} = p;
  patients.push(patientData);
  applyMigrations();
  save(); render();
  alert('✓ ' + (p.name||'Patient') + ' er genoprettet');
}

function loadScript(){  }
function waitForGlobal(){ return Promise.resolve(); }

function startSync(){
  initFirebase();
}

const MAX_UNDO = 20;           // lokale undo-trin
const MAX_BACKUPS = 48;        // antal automatiske snapshots i Firebase (ca. 2 dage ved 30 min interval)
const BACKUP_INTERVAL = 30*60*1000; // automatisk backup hvert 30 min
let _undoStack = [];
let _undoTimer = null;
let _backupTimer = null;
let _actorName = localStorage.getItem('kp2_actor') || '';

function getActor(){
  if(!_actorName){
    _actorName = prompt('Dit navn (vises i loggen):', '') || 'Ukendt';
    localStorage.setItem('kp2_actor', _actorName);
  }
  return _actorName;
}

function snapshotForUndo(){
  _undoStack.push(JSON.parse(JSON.stringify(patients)));
  if(_undoStack.length > MAX_UNDO) _undoStack.shift();
}

function logActivity(action, detail, pid){
  if(!_fbDb) return;
  const entry = {
    ts: Date.now(),
    dt: fmtDT(Date.now()),
    actor: _actorName || 'Ukendt',
    action,
    detail,
    pid: pid||'',
  };
  fetch(_fbDb.url(`/kp2/log/${Date.now()}_${Math.random().toString(36).slice(2,6)}`), {
    method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(entry)
  }).catch(()=>{});
}

function startAutoBackup(){
  if(_backupTimer) clearInterval(_backupTimer);
  _backupTimer = setInterval(()=>{ saveBackupToFirebase(); }, BACKUP_INTERVAL);
  setTimeout(()=>{ saveBackupToFirebase(); }, 5000);
}

function startSync(){
  initFirebase();
}

function setFVCFreq(pid, count){
  if(!count) return;
  const p = patients.find(x=>x.id===pid); if(!p) return;
  const times = generateTimesFromNow(parseInt(count), null);
  p.sections.medicin.fvcTimes = times.map(t=>({time:t, status:'pending', dt:''}));
  save(); render();
}

function addFVCManualTime(pid){
  const time = prompt('Tidspunkt (HH:MM):', nowHHMM());
  if(!time) return;
  const p = patients.find(x=>x.id===pid); if(!p) return;
  if(!p.sections.medicin.fvcTimes) p.sections.medicin.fvcTimes = [];
  p.sections.medicin.fvcTimes.push({time, status:'pending', dt:''});
  save(); render();
}

function setFVCSlotStatus(pid, idx, status){
  const p = patients.find(x=>x.id===pid); if(!p) return;
  const ts = p.sections.medicin.fvcTimes[idx]; if(!ts) return;
  ts.status = status;
  ts.dt = status==='done' ? fmtDT(Date.now()) : '';
  document.querySelectorAll('.nudge-popup').forEach(el=>el.style.display='none');
  save(); render();
}

function nudgeFVCTime(pid, idx, deltaMin){
  const p = patients.find(x=>x.id===pid); if(!p) return;
  const ts = p.sections.medicin.fvcTimes[idx]; if(!ts) return;
  const [h,m] = ts.time.split(':').map(Number);
  const total = (h*60+m+deltaMin+1440)%1440;
  ts.time = String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0');
  document.querySelectorAll('.nudge-popup').forEach(el=>el.style.display='none');
  save(); render();
}

function removeFVCTime(pid, idx){
  const p = patients.find(x=>x.id===pid); if(!p) return;
  p.sections.medicin.fvcTimes.splice(idx,1);
  document.querySelectorAll('.nudge-popup').forEach(el=>el.style.display='none');
  save(); render();
}

function editFVCTime(pid, idx, spanEl){
  const p = patients.find(x=>x.id===pid); if(!p) return;
  const ts = p.sections.medicin.fvcTimes[idx]; if(!ts) return;
  const dtVal = dtToInput(ts.dt||'');
  const inp = document.createElement('input');
  inp.type='datetime-local'; inp.value=dtVal;
  inp.style.cssText='font-size:9px;padding:2px 4px;background:var(--s3);border:1px solid var(--border2);border-radius:4px;color:var(--text);font-family:inherit;width:150px';
  inp.onchange = ()=>{ ts.dt = inputToDT ? inputToDT(inp.value) : inp.value; save(); render(); };
  inp.onblur = ()=>render();
  spanEl.replaceWith(inp); inp.focus();
}

function addFVC(pid){
  document.getElementById('fvcPid').value = pid;
  ['fvcVal','fev1Val','fvcRatio','fvcPef','fvcNote'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('fvcOverlay').style.display = 'flex';
}

function closeFVCModal(){
  document.getElementById('fvcOverlay').style.display = 'none';
}

function saveFVC(){
  const pid   = document.getElementById('fvcPid').value;
  const fvc   = parseFloat(document.getElementById('fvcVal').value);
  const fev1  = parseFloat(document.getElementById('fev1Val').value);
  let ratio   = parseFloat(document.getElementById('fvcRatio').value);
  const pef   = document.getElementById('fvcPef').value.trim();
  const note  = document.getElementById('fvcNote').value.trim();
  if(!ratio && fvc>0 && fev1>0) ratio = Math.round((fev1/fvc)*100);
  const p = patients.find(x=>x.id===pid); if(!p) return;
  if(!p.sections.medicin.fvc) p.sections.medicin.fvc = [];
  p.sections.medicin.fvc.push({
    dt: fmtDT(Date.now()), fvc:fvc||null, fev1:fev1||null, ratio:ratio||null, pef:pef||null, note
  });
  closeFVCModal();
  save(); render();
}

function removeFVC(pid, idx){
  const p = patients.find(x=>x.id===pid); if(!p) return;
  if(p.sections.medicin.fvc) p.sections.medicin.fvc.splice(idx,1);
  save(); render();
}

document.addEventListener('input', e=>{
  if(e.target.id==='fvcVal'||e.target.id==='fev1Val'){
    const fvc  = parseFloat(document.getElementById('fvcVal').value);
    const fev1 = parseFloat(document.getElementById('fev1Val').value);
    const ratioEl = document.getElementById('fvcRatio');
    if(fvc>0 && fev1>0 && ratioEl && !ratioEl.value)
      ratioEl.value = Math.round((fev1/fvc)*100);
  }
});


document.addEventListener('contextmenu', e=>{
  const btn = e.target.closest('.add-prio-btn');
  if(!btn) return;
  e.preventDefault();
  const onclick = btn.getAttribute('onclick')||'';
  const m = onclick.match(/openAddPrioMenu\(event,'([^']+)','([^']+)'\)/);
  if(!m) return;
  const pid = m[1], label = m[2];
  addToPriorityList(pid, label, 'red');
  const orig = btn.innerHTML;
  btn.innerHTML = '🔴';
  btn.style.background = 'var(--rbg)';
  btn.style.color = 'var(--red)';
  btn.style.borderColor = 'var(--rbrd)';
  setTimeout(()=>{ btn.innerHTML=orig; btn.style.background=''; btn.style.color=''; btn.style.borderColor=''; }, 1500);
});

function toggleTheme(){
  const isLight = document.body.classList.toggle('light-mode');
  localStorage.setItem('kp2_theme', isLight ? 'light' : 'dark');
  const btn = document.getElementById('themeBtn');
  if(btn) btn.textContent = isLight ? '☀️' : '🌙';
}

function toggleSidebarSide(){
  const layout = document.querySelector('.app-layout');
  if(!layout) return;
  const isRight = layout.classList.toggle('sidebar-right');
  localStorage.setItem('kp2_sidebar', isRight ? 'right' : 'left');
  const btn = document.getElementById('sidebarSideBtn');
  if(btn) btn.textContent = isRight ? '▶' : '◀';
}

(function(){
  if(localStorage.getItem('kp2_theme')==='light'){
    document.body.classList.add('light-mode');
    document.addEventListener('DOMContentLoaded',()=>{
      const btn = document.getElementById('themeBtn');
      if(btn) btn.textContent = '☀️';
    });
  }
  if(localStorage.getItem('kp2_sidebar')==='right'){
    document.addEventListener('DOMContentLoaded',()=>{
      const layout = document.querySelector('.app-layout');
      if(layout) layout.classList.add('sidebar-right');
      const btn = document.getElementById('sidebarSideBtn');
      if(btn) btn.textContent = '▶';
    });
  }
})();

function updateSyncStatus(state){
  const dot = document.getElementById('syncDot');
  const txt = document.getElementById('syncStatusTxt');
  const retry = document.getElementById('syncRetryBtn');
  if(!dot || !txt) return;
  const states = {
    local:    {color:'#f59e0b', text:'Lokal'},
    saving:   {color:'#3b82f6', text:'Gemmer...'},
    synced:   {color:'#10b981', text:'● Live'},
    error:    {color:'#ef4444', text:'⚠ Fejl'},
    offline:  {color:'#f59e0b', text:'⚠ Offline'},
    authfail: {color:'#ef4444', text:'⚠ Adgang nægtet'},
  };
  const s = states[state] || states.local;
  dot.style.background = s.color;
  txt.textContent = s.text;
  if(retry){
    retry.style.display = (state==='offline'||state==='error'||state==='authfail') ? '' : 'none';
  }
}

function retrySync(){
  const btn = document.getElementById('syncRetryBtn');
  if(btn) btn.style.display = 'none';
  updateSyncStatus('saving');
  if(_fbDb){ if(_fbListener) clearInterval(_fbListener); _fbDb=null; }
  initFirebase();
}

function openSyncSettings(){
  const panel = document.getElementById('syncSettingsPanel');
  if(!panel) return;
  const el1 = document.getElementById('syncFbApiKey');
  const el2 = document.getElementById('syncFbDbURL');
  const el3 = document.getElementById('syncFbProjId');
  const el4 = document.getElementById('syncOdClientId');
  if(el1) el1.value = SYNC_CONFIG.apiKey;
  if(el2) el2.value = SYNC_CONFIG.databaseURL;
  if(el3) el3.value = SYNC_CONFIG.projectId;
  if(el4) el4.value = OD_CONFIG.clientId;
  setSyncMode(_syncMode); // restore correct tab
  panel.classList.toggle('open');
}

function saveSyncSettings(){
  const apiKey = document.getElementById('syncFbApiKey').value.trim();
  const dbURL  = document.getElementById('syncFbDbURL').value.trim();
  const projId = document.getElementById('syncFbProjId').value.trim();
  SYNC_CONFIG.apiKey      = apiKey;
  SYNC_CONFIG.databaseURL = dbURL;
  SYNC_CONFIG.projectId   = projId;
  localStorage.setItem('sync_fb_apiKey',  apiKey);
  localStorage.setItem('sync_fb_dbURL',   dbURL);
  localStorage.setItem('sync_fb_projId',  projId);
  document.getElementById('syncSettingsPanel').classList.remove('open');
  if(_fbListener) clearInterval(_fbListener);
  _fbApp = null; _fbDb = null;
  initFirebase();
}

async function testSyncConnection(){
  const apiKey = document.getElementById('syncFbApiKey').value.trim();
  const dbURL  = document.getElementById('syncFbDbURL').value.trim();
  const projId = document.getElementById('syncFbProjId').value.trim();
  const msgEl  = document.getElementById('syncTestMsg');
  if(!apiKey || !dbURL || !projId){
    if(msgEl){ msgEl.textContent='⚠ Udfyld alle tre felter'; msgEl.style.color='var(--yellow)'; }
    return;
  }
  if(msgEl){ msgEl.textContent='⏳ Tester forbindelse...'; msgEl.style.color='var(--muted)'; }
  const base = dbURL.replace(/\/$/, '');
  try {
    const putRes = await fetch(`${base}/kp2/ping.json`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ts: Date.now(), ok: true})
    });
    if(putRes.status===401||putRes.status===403){
      if(msgEl){ msgEl.textContent='✗ Adgang nægtet — gå til Firebase → Rules og sæt .read/.write: true → Publish'; msgEl.style.color='var(--red)'; }
      return;
    }
    if(!putRes.ok){
      if(msgEl){ msgEl.textContent=`✗ HTTP ${putRes.status} — tjek Database URL`; msgEl.style.color='var(--red)'; }
      return;
    }
    const getRes = await fetch(`${base}/kp2/ping.json`, {cache:'no-store'});
    const data = await getRes.json();
    if(data && data.ok){
      if(msgEl){ msgEl.textContent='✓ Læs og skriv virker! Klik Gem og aktiver.'; msgEl.style.color='var(--green)'; }
    } else {
      if(msgEl){ msgEl.textContent='⚠ Skrivning OK, men læsning fejlede — tjek Rules'; msgEl.style.color='var(--yellow)'; }
    }
  } catch(e){
    if(msgEl){ msgEl.textContent=`✗ Netværksfejl: ${e.message.slice(0,60)}`; msgEl.style.color='var(--red)'; }
  }
}

function pauseSync(){ _syncPaused = true; }
function resumeSync(){ _syncPaused = false; }

let _syncMode = localStorage.getItem('sync_mode') || 'firebase'; // 'firebase' | 'sheets'

function setSyncMode(mode){
  _syncMode = mode;
  localStorage.setItem('sync_mode', mode);
  const fbBtn  = document.getElementById('syncModeFirebase');
  const shBtn  = document.getElementById('syncModeSheets');
  const fbPan  = document.getElementById('syncPanelFirebase');
  const shPan  = document.getElementById('syncPanelSheets');
  if(mode === 'firebase'){
    if(fbBtn){ fbBtn.style.borderColor='#f97316'; fbBtn.style.background='#f9731622'; fbBtn.style.color='#f97316'; }
    if(shBtn){ shBtn.style.borderColor='var(--border)'; shBtn.style.background='var(--s2)'; shBtn.style.color='var(--muted2)'; }
    if(fbPan) fbPan.style.display='';
    if(shPan) shPan.style.display='none';
  } else {
    if(shBtn){ shBtn.style.borderColor='#10b981'; shBtn.style.background='#10b98122'; shBtn.style.color='#10b981'; }
    if(fbBtn){ fbBtn.style.borderColor='var(--border)'; fbBtn.style.background='var(--s2)'; fbBtn.style.color='var(--muted2)'; }
    if(fbPan) fbPan.style.display='none';
    if(shPan) shPan.style.display='';
  }
}

const OD_CONFIG = {
  clientId: localStorage.getItem('sync_od_clientId') || '',
  interval: 5000,
  filename: 'plejeplan-data.json',
  scope: 'User.Read Files.ReadWrite',
};

let _odToken      = null;
let _odFileId     = null;
let _odTimer      = null;
let _odSaving     = false;
let _odLast       = '';

function saveOneDriveSettings(){
  const clientId = document.getElementById('syncOdClientId').value.trim();
  OD_CONFIG.clientId = clientId;
  localStorage.setItem('sync_od_clientId', clientId);
  localStorage.setItem('sync_mode', 'sheets');
  _syncMode = 'sheets';
  document.getElementById('syncSettingsPanel').classList.remove('open');
  startOneDriveLogin();
}

async function testOneDriveConnection(){
  const clientId = document.getElementById('syncOdClientId').value.trim();
  const msgEl = document.getElementById('syncSheetTestMsg');
  if(!clientId){ if(msgEl){ msgEl.textContent='⚠ Indsæt Client ID fra Azure'; msgEl.style.color='var(--yellow)'; } return; }
  if(msgEl){ msgEl.textContent='⏳ Åbner login...'; msgEl.style.color='var(--muted)'; }
  OD_CONFIG.clientId = clientId;
  try {
    const token = await getODToken();
    if(token){
      if(msgEl){ msgEl.textContent='✓ Logget ind! Klik Gem og log ind.'; msgEl.style.color='var(--green)'; }
    }
  } catch(e){
    if(msgEl){ msgEl.textContent=`✗ ${e.message.slice(0,70)}`; msgEl.style.color='var(--red)'; }
  }
}

function getODToken(){
  return new Promise((resolve, reject) => {
    if(!OD_CONFIG.clientId){ reject(new Error('Ingen Client ID')); return; }
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
      + `?client_id=${OD_CONFIG.clientId}`
      + `&response_type=token`
      + `&redirect_uri=${encodeURIComponent(location.href.split('?')[0])}`
      + `&scope=${encodeURIComponent(OD_CONFIG.scope)}`
      + `&response_mode=fragment`
      + `&prompt=select_account`;

    const popup = window.open(authUrl, 'odauth', 'width=500,height=600,left=200,top=100');
    if(!popup){ reject(new Error('Popup blokeret — tillad popups for denne side')); return; }

    const timer = setInterval(()=>{
      try {
        if(popup.closed){ clearInterval(timer); reject(new Error('Login annulleret')); return; }
        const hash = popup.location.hash;
        if(hash && hash.includes('access_token')){
          clearInterval(timer);
          popup.close();
          const params = new URLSearchParams(hash.slice(1));
          const token = params.get('access_token');
          if(token){ _odToken = token; resolve(token); }
          else reject(new Error('Ingen token i svar'));
        }
      } catch(e){  }
    }, 300);

    setTimeout(()=>{ clearInterval(timer); if(!popup.closed) popup.close(); reject(new Error('Login timeout')); }, 120000);
  });
}

async function getOrCreateODFile(){
  if(!_odToken) throw new Error('Ikke logget ind');
  const headers = {'Authorization':'Bearer '+_odToken, 'Content-Type':'application/json'};

  const search = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=name eq '${OD_CONFIG.filename}'`,
    {headers}
  );
  if(!search.ok){
    if(search.status===401){ _odToken=null; throw new Error('Token udløbet — log ind igen'); }
    throw new Error(`Graph fejl: ${search.status}`);
  }
  const data = await search.json();
  if(data.value && data.value.length > 0){
    _odFileId = data.value[0].id;
    return _odFileId;
  }
  const create = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:/${OD_CONFIG.filename}:/content`,
    {method:'PUT', headers:{...headers,'Content-Type':'application/json'}, body:'[]'}
  );
  if(!create.ok) throw new Error(`Kan ikke oprette fil: ${create.status}`);
  const file = await create.json();
  _odFileId = file.id;
  return _odFileId;
}

async function pushToSheets(){
  if(!_odToken || _odSaving) return;
  _odSaving = true;
  try {
    if(!_odFileId) await getOrCreateODFile();
    const headers = {'Authorization':'Bearer '+_odToken,'Content-Type':'application/json'};
    const body = JSON.stringify(patients);
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${_odFileId}/content`,
      {method:'PUT', headers, body}
    );
    if(res.status===401){ _odToken=null; updateSyncStatus('authfail'); return; }
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    _odLast = body;
    updateSyncStatus('synced');
  } catch(e){
    console.warn('OneDrive push fejl:', e.message);
    updateSyncStatus('offline');
  } finally { _odSaving = false; }
}

async function pullFromSheets(){
  if(!_odToken || _odSaving) return;
  try {
    if(!_odFileId) await getOrCreateODFile();
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${_odFileId}/content`,
      {headers:{'Authorization':'Bearer '+_odToken}, cache:'no-store'}
    );
    if(res.status===401){ _odToken=null; updateSyncStatus('authfail'); return; }
    if(!res.ok){ updateSyncStatus('offline'); return; }
    const raw = await res.text();
    if(!raw || raw.trim()==='[]' || raw.trim()==='null') return;
    const remote = JSON.parse(raw);
    if(!Array.isArray(remote)) return;
    const remoteStr = JSON.stringify(remote);
    if(remoteStr !== _odLast && remoteStr !== JSON.stringify(patients)){
      patients = remote;
      applyMigrations();
      localStorage.setItem('kp2_pts', JSON.stringify(patients));
      if(_bc) _bc.postMessage({type:'update', patients: JSON.parse(JSON.stringify(patients))});
      render();
      _odLast = remoteStr;
    }
    updateSyncStatus('synced');
  } catch(e){ updateSyncStatus('offline'); }
}

async function startOneDriveLogin(){
  const statusEl = document.getElementById('syncOdLoginStatus');
  if(statusEl) statusEl.textContent = '⏳ Åbner Microsoft login...';
  try {
    await getODToken();
    await getOrCreateODFile();
    if(statusEl) statusEl.textContent = '✓ Logget ind og klar!';
    updateSyncStatus('synced');
    startSheetsSync();
  } catch(e){
    if(statusEl){ statusEl.textContent = `✗ ${e.message}`; statusEl.style.color='var(--red)'; }
    updateSyncStatus('error');
  }
}

function startSheetsSync(){
  if(_odTimer) clearInterval(_odTimer);
  if(!_odToken){ updateSyncStatus('local'); return; }
  pullFromSheets();
  _odTimer = setInterval(()=>{ if(!_syncPaused) pullFromSheets(); }, OD_CONFIG.interval);
}

function startSync(){
  if(_syncMode === 'sheets' && OD_CONFIG.clientId){
    updateSyncStatus('authfail');
    const lbl = document.getElementById('syncStatusTxt');
    if(lbl) lbl.textContent = '🪟 Log ind';
    const dot = document.getElementById('syncDot');
    if(dot){ dot.style.cursor='pointer'; dot.title='Klik for at logge ind med OUH-konto'; }
  } else {
    initFirebase();
  }
}

function applyMigrations(){
  patients = patients.map(p => {
  const def = defaultSections();
  ['plejeplan','bleskift','sik','td','ankomst','prioritering'].forEach(key => {
    if(!p.sections[key]) p.sections[key] = def[key];
  });

  const vaske = p.sections.vaske;
  if(vaske && vaske.tasks) {
    vaske.tasks = vaske.tasks.filter(t => t.label !== 'Negleklip');
    vaske.tasks.forEach(t => {
      if(t.label === 'Mundhygiejne') t.label = 'Mundpleje';
    });
    if(!vaske.tasks.find(t => t.label === 'Fuld vask')) {
      const idx = vaske.tasks.findIndex(t => t.label === 'Vask af nedre');
      const newTask = {id:uid(),label:'Fuld vask',done:false,status:'pending',count:null,times:[],enabled:true};
      if(idx >= 0) vaske.tasks.splice(idx + 1, 0, newTask);
      else vaske.tasks.push(newTask);
    }
    if(!vaske.tasks.find(t => t.label === 'Mundpleje')) {
      const newTask = {id:uid(),label:'Mundpleje',done:false,status:'pending',count:null,times:[],enabled:true};
      const posIdx = vaske.tasks.findIndex(t => t.label === 'Fuld vask');
      if(posIdx >= 0) vaske.tasks.splice(posIdx + 1, 0, newTask);
      else vaske.tasks.push(newTask);
    }
  }

  const ich = p.sections.ich;
  if(ich && ich.gcsEye === undefined) {
    const oldGcs = ich.scores?.gcs ?? 2;
    ich.gcsEye    = oldGcs === 2 ? 4 : oldGcs === 1 ? 3 : 1;
    ich.gcsVerbal = oldGcs === 2 ? 5 : oldGcs === 1 ? 3 : 1;
    ich.gcsMotor  = oldGcs === 2 ? 6 : oldGcs === 1 ? 4 : 2;
    ich.manualTimes = ich.manualTimes || [];
  }

  Object.values(p.sections).forEach(sec => {
    if(sec.tasks) sec.tasks.forEach(t => {
      if(t.times) {
        t.times = t.times.map(ts =>
          typeof ts === 'string' ? {time: ts, status: 'pending', dt: ''} : ts
        );
      }
    });
  });

  const taskSections = ['vaske','kost','ekstra','plejeplan'];
  taskSections.forEach(key => {
    if(p.sections[key] && !p.sections[key].tasks) p.sections[key].tasks = [];
  });
  if(p.sections.medicin && !p.sections.medicin.items) p.sections.medicin.items = [];
  if(p.sections.sik && !p.sections.sik.entries) p.sections.sik.entries = [];
  if(p.sections.td && !p.sections.td.entries) p.sections.td.entries = [];
  if(p.sections.bleskift && !p.sections.bleskift.entries) p.sections.bleskift.entries = [];
  if(p.sections.prioritering && !p.sections.prioritering.items) p.sections.prioritering.items = [];
  if(p.sections.ankomst && !p.sections.ankomst.items) p.sections.ankomst.items = [];
  if(p.sections.sss && !p.sections.sss.times) p.sections.sss.times = [];
  if(p.sections.sss && !p.sections.sss.observations) p.sections.sss.observations = [];
  if(p.sections.ich && !p.sections.ich.observations) p.sections.ich.observations = [];
  if(p.sections.tromb && !p.sections.tromb.observations) p.sections.tromb.observations = [];

  if(p.sections.medicin && !p.sections.medicin.items) p.sections.medicin.items = [];
  if(p.sections.sik && !p.sections.sik.entries) p.sections.sik.entries = [];
  if(p.sections.td && !p.sections.td.entries) p.sections.td.entries = [];
  if(p.sections.bleskift && !p.sections.bleskift.entries) p.sections.bleskift.entries = [];

  if(p.sections.sss && !p.sections.sss.observations) p.sections.sss.observations = [];

  Object.values(p.sections).forEach(sec => {
    if(sec.tasks) sec.tasks.forEach(t => { if(t.enabled===undefined) t.enabled=true; });
  });

  // Auto-tildel team for eksisterende patienter på stue 10 og 5
  if(p.room) {
    const autoTeam = getAutoTeamForRoom(p.room);
    if(autoTeam && p.team !== autoTeam) p.team = autoTeam;
  }

  return p;
  });
}
applyMigrations();

function save(){ localStorage.setItem('kp2_pts', JSON.stringify(patients)); }
function uid(){ return Math.random().toString(36).slice(2,9); }
function initials(n){ return n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?'; }
function now(){ return new Date(); }
function nowHHMM(){
  const d=new Date();
  return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}

let activePatientId = null;
let activeTeams = new Set(['all']); // 'all' means show all teams
let selectedPatients = new Set();
let selectMode = false;
let modalTeam = null; // team selected in add-patient modal

let currentView = 'patienter'; // 'patienter' | 'prioritering'
let activePrioTeams = new Set(['all']); // which teams to show in priority view

const TEAM_LABELS = {
  A:'Team A', B:'Team B', C:'Team C',
  Obs10:'Observation 10', Obs5:'Observation 5',
  null:'Uden team'
};

function switchView(view){
  currentView = view;
  const pv  = document.getElementById('patientView');
  const prv = document.getElementById('priorityView');
  const sbv = document.getElementById('sandboxView');
  const vtP  = document.getElementById('vtabPatienter');
  const vtPr = document.getElementById('vtabPrioritering');
  const vtSb = document.getElementById('vtabSandbox');
  const teamBar  = document.getElementById('teamBar');
  const ptNav    = document.getElementById('ptNav');
  const selectBar= document.getElementById('selectBar');

  if(pv)  pv.style.display  = 'none';
  if(prv) prv.style.display = 'none';
  if(sbv) sbv.style.display = 'none';
  [vtP,vtPr,vtSb].forEach(el=>{ if(el) el.className='view-tab'; });
  if(teamBar)   teamBar.style.display   = 'none';
  if(ptNav)     ptNav.style.display     = 'none';
  if(selectBar) selectBar.className     = 'select-bar';

  if(view === 'patienter'){
    if(pv) pv.style.display = '';
    vtP.className = 'view-tab active';
    if(patients.length){ if(teamBar) teamBar.style.display='flex'; if(ptNav) ptNav.style.display='flex'; }
  } else if(view === 'prioritering'){
    if(prv) prv.style.display = 'block';
    vtPr.className = 'view-tab active';
    renderPriorityView();
  } else if(view === 'sandbox'){
    if(sbv) sbv.style.display = 'block';
    vtSb.className = 'view-tab active';
    renderSandbox();
  }
}

const SANDBOX_KEY = 'kp2_sandbox';
let sbPatients = JSON.parse(localStorage.getItem(SANDBOX_KEY) || 'null');
let sbActiveTeam = 'all';
let sbModalTeam  = null;

if(!sbPatients) sbPatients = createDemoPatients();

function saveSandbox(){
  localStorage.setItem(SANDBOX_KEY, JSON.stringify(sbPatients));
}

function resetSandbox(){
  if(!confirm('Nulstil uddannelsesområdet til demo-patienter? Alle øvelses-ændringer slettes.')) return;
  sbPatients = createDemoPatients();
  saveSandbox();
  renderSandbox();
}

function createDemoPatients(){
  const mkPt = (name, room, diag, team) => ({
    id: 'sb_'+uid(), name, room, diag: diag||'', team,
    sections: defaultSections(),
    createdAt: fmtDT(Date.now()),
  });
  const pts = [
    mkPt('Demo Hansen, Ole', '5s1', 'Apopleksi', 'A'),
    mkPt('Demo Nielsen, Mette', '3s1', 'TCI', 'A'),
    mkPt('Demo Andersen, Lars', '9s2', 'ICH', 'B'),
    mkPt('Demo Pedersen, Inge', '11s3', 'Stroke (iskæmisk)', 'B'),
    mkPt('Demo Christensen, Bo', '44s1', 'SAH', 'C'),
  ];
  return pts;
}

function renderSandbox(){
  const list = document.getElementById('sbPatientList');
  if(!list) return;

  const visible = sbActiveTeam==='all'
    ? sbPatients
    : sbPatients.filter(p=>p.team===sbActiveTeam);

  ['all','A','B','C','Obs10','Obs5'].forEach(t => {
    const el = document.getElementById(t==='all'?'sbTeamAll':'sbTeam'+t);
    if(!el) return;
    const isActive = sbActiveTeam===t;
    el.className = 'team-tab' + (isActive ? (t==='all' ? ' active-all' : ' active-'+t.toLowerCase()) : '');
  });

  if(visible.length === 0){
    list.innerHTML = `<div class="empty"><div class="empty-ico">🎓</div>Ingen øvelses-patienter. Klik "+ Øvelses-patient".</div>`;
    return;
  }

  list.innerHTML = visible.map(p => renderSbCard(p)).join('');
}

function renderSbCard(p){
  const secs = p.sections||{};
  const allTasks = [];
  Object.values(secs).forEach(s=>{ if(s.tasks) s.tasks.filter(t=>t.enabled!==false).forEach(t=>allTasks.push(t)); });
  const done = allTasks.filter(t=>t.done).length;
  const total = allTasks.length;

  return `<div style="background:var(--s2);border:1px solid #ca8a0440;border-radius:14px;padding:14px 16px;margin-bottom:12px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <div style="background:#854d0e33;color:#ca8a04;border-radius:8px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;flex-shrink:0">${initials(p.name)}</div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:700">${p.name}</div>
        <div style="font-size:11px;color:var(--muted)">${p.room||''}${p.diag?' · '+p.diag:''}</div>
      </div>
      <span style="background:#854d0e22;color:#ca8a04;border:1px solid #ca8a04;border-radius:6px;font-size:10px;font-weight:700;padding:2px 8px">Team ${p.team||'?'}</span>
      <span style="font-size:11px;color:var(--muted)">${done}/${total}</span>
      <button class="btn btn-ghost btn-sm" style="font-size:11px;color:var(--red)" onclick="removeSbPatient('${p.id}')">✕</button>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${Object.entries(secs).filter(([k,s])=>s.enabled!==false && s.tasks && s.tasks.length>0).map(([k,s])=>{
        const sDone = s.tasks.filter(t=>t.enabled!==false&&t.done).length;
        const sTotal= s.tasks.filter(t=>t.enabled!==false).length;
        return `<div style="background:var(--s3);border:1px solid var(--border);border-radius:8px;padding:5px 9px;font-size:11px;cursor:pointer"
          onclick="toggleSbSection('${p.id}','${k}')">
          ${s.icon||''} ${s.title} <span style="color:${sDone===sTotal&&sTotal>0?'var(--green)':'var(--muted)'}">${sDone}/${sTotal}</span>
        </div>`;
      }).join('')}
    </div>
    <!-- Expanded section tasks -->
    <div id="sb-sec-${p.id}" style="display:none;margin-top:10px;border-top:1px solid var(--border);padding-top:10px">
      <div id="sb-sec-body-${p.id}"></div>
    </div>
  </div>`;
}

let _sbOpenSection = {}; // {pid: secKey}

function toggleSbSection(pid, secKey){
  const p = sbPatients.find(x=>x.id===pid); if(!p) return;
  const wrap = document.getElementById('sb-sec-'+pid);
  const body = document.getElementById('sb-sec-body-'+pid);
  if(!wrap||!body) return;

  if(_sbOpenSection[pid]===secKey && wrap.style.display!=='none'){
    wrap.style.display='none'; _sbOpenSection[pid]=null; return;
  }
  _sbOpenSection[pid]=secKey;
  wrap.style.display='block';

  const s = p.sections[secKey];
  if(!s||!s.tasks){ body.innerHTML='<div style="color:var(--muted);font-size:12px">Ingen opgaver</div>'; return; }

  body.innerHTML = `<div style="font-size:12px;font-weight:700;color:var(--muted2);margin-bottom:8px">${s.icon||''} ${s.title}</div>` +
    s.tasks.filter(t=>t.enabled!==false).map(t=>`
    <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">
      <div class="tcheck ${t.done?'done':''}" onclick="toggleSbTask('${pid}','${secKey}','${t.id}')"></div>
      <div class="tlabel ${t.done?'done':''}" style="flex:1">${t.label}</div>
      ${t.done?`<span style="font-size:9px;color:var(--green);font-family:'IBM Plex Mono',monospace">${t.doneAt||''}</span>`:''}
    </div>`).join('');
}

function toggleSbTask(pid, secKey, tid){
  const p = sbPatients.find(x=>x.id===pid); if(!p) return;
  const t = p.sections[secKey].tasks.find(x=>x.id===tid); if(!t) return;
  t.done = !t.done;
  t.status = t.done ? 'done' : 'pending';
  t.doneAt = t.done ? fmtDT(Date.now()) : '';
  if(secKey==='vaske' && t.label==='Fuld vask'){
    ['Vask af hoved','Vask af overkrop','Vask af nedre'].forEach(lbl=>{
      const st = p.sections.vaske.tasks.find(x=>x.label===lbl);
      if(st){ st.done=t.done; st.status=t.done?'done':'pending'; st.doneAt=t.done?fmtDT(Date.now()):''; }
    });
  }
  saveSandbox();
  toggleSbSection(pid, secKey); // re-render section
  renderSandbox();
}

function removeSbPatient(pid){
  if(!confirm('Fjern øvelses-patient?')) return;
  sbPatients = sbPatients.filter(p=>p.id!==pid);
  saveSandbox(); renderSandbox();
}

function setSbTeam(team){
  sbActiveTeam = team; renderSandbox();
}

function openSbModal(){
  document.getElementById('sbOverlay').style.display='flex';
  document.getElementById('sbName').value='';
  document.getElementById('sbDiag').value='';
  sbModalTeam=null;
  ['A','B','C','Obs10','Obs5'].forEach(t=>{
    const el=document.getElementById('sbBtn'+t);
    if(el) el.style.background='';
  });
}
function closeSbModal(){
  document.getElementById('sbOverlay').style.display='none';
}
function setSbModalTeam(t){
  sbModalTeam=t;
  ['A','B','C','Obs10','Obs5'].forEach(x=>{
    const el=document.getElementById('sbBtn'+x);
    if(el) el.style.background = x===t ? 'var(--blue)' : '';
    if(el) el.style.color = x===t ? '#fff' : '';
  });
}
function addSbPatient(){
  const name = document.getElementById('sbName').value.trim();
  if(!name){ alert('Skriv et navn'); return; }
  const diag = document.getElementById('sbDiag').value.trim();
  sbPatients.push({
    id:'sb_'+uid(), name, diag, team:sbModalTeam||'A',
    room:'', sections:defaultSections(), createdAt:fmtDT(Date.now())
  });
  saveSandbox(); closeSbModal(); renderSandbox();
}

function setPrioTeamFilter(team){
  if(team === 'all'){
    activePrioTeams = new Set(['all']);
  } else {
    activePrioTeams.delete('all');
    if(activePrioTeams.has(team)) activePrioTeams.delete(team);
    else activePrioTeams.add(team);
    if(activePrioTeams.size === 0) activePrioTeams = new Set(['all']);
  }
  const isAll = activePrioTeams.has('all');
  const allEl = document.getElementById('prioTeamAll');
  if(allEl) allEl.className = 'team-tab' + (isAll ? ' active-all' : '');
  ['A','B','C','Obs10','Obs5'].forEach(t => {
    const el = document.getElementById('prioTeam'+t);
    if(el) el.className = 'team-tab' + (!isAll && activePrioTeams.has(t) ? ' active-'+t.toLowerCase() : '');
  });
  renderPriorityView();
}

let _selectedPrioItems = new Set(); // "pid|idx" keys for selected items

function renderPriorityView(){
  const container = document.getElementById('prioViewContent');
  if(!container) return;

  const groupByTeam = document.getElementById('prioGroupByTeam')?.checked || false;

  const allItems = [];
  patients.forEach(p => {
    const team = p.team || null;
    if(!activePrioTeams.has('all') && !activePrioTeams.has(team)) return;
    (p.sections.prioritering?.items||[]).forEach((item,i) => {
      allItems.push({
        pid: p.id, ptName: p.name, ptRoom: p.room, team,
        label: item.label, priority: item.priority,
        done: item.done, note: item.note||'',
        createdAt: item.createdAt||'', completedAt: item.completedAt||'',
        idx: i, type: 'prioritering',
        key: `${p.id}|${i}`
      });
    });
  });

  const allPrioItems = [];
  patients.forEach(p => (p.sections.prioritering?.items||[]).forEach(x=>allPrioItems.push({...x,team:p.team})));
  const urgentCount = allPrioItems.filter(x=>!x.done && x.priority==='red').length;
  const countEl = document.getElementById('vtabPrioCount');
  if(countEl){
    const openCount = allPrioItems.filter(x=>!x.done).length;
    countEl.style.display = openCount > 0 ? '' : 'none';
    countEl.textContent = openCount;
    countEl.className = 'vtab-count' + (urgentCount>0 ? '' : ' yellow');
  }

  ['A','B','C','Obs10','Obs5'].forEach(t => {
    const el = document.getElementById('prioTeam'+t);
    if(!el) return;
    const cnt = allPrioItems.filter(x=>x.team===t && !x.done).length;
    el.innerHTML = cnt > 0 ? `${TEAM_LABELS[t]||t} <span class="team-badge badge-${t.toLowerCase()}">${cnt}</span>` : (TEAM_LABELS[t]||t);
  });

  _selectedPrioItems = new Set([..._selectedPrioItems].filter(k => allItems.find(x=>x.key===k)));

  const openItems = allItems.filter(x=>!x.done);
  const allSelected = openItems.length > 0 && openItems.every(x=>_selectedPrioItems.has(x.key));
  const someSelected = _selectedPrioItems.size > 0;

  if(allItems.length === 0){
    container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--muted)">
      <div style="font-size:48px;margin-bottom:12px">⚡</div>
      <div style="font-size:16px;font-weight:600;margin-bottom:6px">Ingen prioriterede opgaver</div>
      <div style="font-size:13px">Klik ⚡ på en opgave og vælg prioritet for at tilføje</div>
    </div>`;
    return;
  }

  const PRIO_GROUPS = [
    { priority:'red',    label:'Prioritet 1 — Haster',  color:'var(--red)',    bg:'var(--rbg)',    brd:'var(--rbrd)', num:'P1' },
    { priority:'yellow', label:'Prioritet 2 — Vigtigt', color:'var(--yellow)', bg:'var(--ybg)',    brd:'var(--ybrd)', num:'P2' },
  ];

  const TEAMS = [
    {key:'A',     label:'Team A',          color:'#3b82f6', bg:'rgba(59,130,246,.13)',  brd:'rgba(59,130,246,.3)'},
    {key:'B',     label:'Team B',          color:'#a855f7', bg:'rgba(168,85,247,.13)',  brd:'rgba(168,85,247,.3)'},
    {key:'C',     label:'Team C',          color:'#f97316', bg:'rgba(249,115,22,.13)',  brd:'rgba(249,115,22,.3)'},
    {key:'Obs10', label:'Observation 10',  color:'#ef4444', bg:'rgba(239,68,68,.13)',  brd:'rgba(239,68,68,.3)'},
    {key:'Obs5',  label:'Observation 5',   color:'#6366f1', bg:'rgba(99,102,241,.13)',  brd:'rgba(99,102,241,.3)'},
    {key:null,    label:'Uden team',       color:'var(--muted)', bg:'var(--s2)', brd:'var(--border)'},
  ];

  const renderItem = (item) => {
    const ptTag = `${item.ptName}${item.ptRoom?' · '+item.ptRoom:''}`;
    const teamBadge = item.team
      ? `<span class="team-badge badge-${item.team.toLowerCase()}" style="font-size:9px">${TEAM_LABELS[item.team]||item.team}</span>` : '';
    const isSelected = _selectedPrioItems.has(item.key);
    const prioColor = item.priority==='red' ? 'var(--red)' : 'var(--yellow)';
    const prioBg    = item.priority==='red' ? 'var(--rbg)' : 'var(--ybg)';
    const prioNum   = item.priority==='red' ? 'P1' : 'P2';

    return `<div class="prio-view-item ${item.done?'done-item':''}" style="${isSelected?'border-color:var(--blue);background:var(--bbg);':''}">
      <!-- Checkbox -->
      <div style="flex-shrink:0;display:flex;align-items:center">
        <input type="checkbox" ${isSelected?'checked':''} ${item.done?'disabled':''}
          onchange="togglePrioSelect('${item.key}',this.checked)"
          style="width:16px;height:16px;accent-color:var(--blue);cursor:pointer;margin-right:6px"/>
      </div>
      <!-- Priority badge -->
      <div style="flex-shrink:0;background:${prioBg};color:${prioColor};border-radius:6px;font-size:10px;font-weight:800;padding:2px 6px;min-width:28px;text-align:center">${prioNum}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:flex-start;gap:6px;flex-wrap:wrap">
          <div class="prio-view-lbl ${item.done?'done':''}">${item.label}</div>
          <span class="prio-pt-tag">${ptTag}</span>
          ${teamBadge}
        </div>
        <div class="prio-view-src">${item.createdAt?'Oprettet: '+item.createdAt:''}${item.done&&item.completedAt?' · ✓ Udført: '+item.completedAt:''}</div>
        ${item.note?`<div class="prio-note" style="margin-top:3px">📝 ${item.note}</div>`:''}
        <!-- Skift prioritet -->
        ${!item.done?`<div style="display:flex;gap:4px;margin-top:5px;align-items:center">
          <span style="font-size:10px;color:var(--muted)">Prioritet:</span>
          <button onclick="setPrioViewPrio('${item.pid}','prioritering',${item.idx},'red')"
            style="font-size:10px;padding:1px 7px;border-radius:5px;cursor:pointer;font-family:inherit;font-weight:700;border:1.5px solid var(--rbrd);background:${item.priority==='red'?'var(--red)':'var(--rbg)'};color:${item.priority==='red'?'#fff':'var(--red)'}">P1 Haster</button>
          <button onclick="setPrioViewPrio('${item.pid}','prioritering',${item.idx},'yellow')"
            style="font-size:10px;padding:1px 7px;border-radius:5px;cursor:pointer;font-family:inherit;font-weight:700;border:1.5px solid var(--ybrd);background:${item.priority==='yellow'?'var(--yellow)':'var(--ybg)'};color:${item.priority==='yellow'?'#fff':'var(--yellow)'}">P2 Vigtigt</button>
        </div>`:``}
      </div>
      <!-- Action buttons -->
      <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">
        ${!item.done
          ? `<button class="prio-btn done-btn" style="font-size:11px" title="Marker udført" onclick="markPrioViewDone('${item.pid}','prioritering',${item.idx},true)">✓</button>
             <button class="prio-btn" style="font-size:10px;background:var(--s3);color:var(--muted);border:1px solid var(--border)" title="Ikke nødvendigt" onclick="markPrioNotNeeded('${item.pid}',${item.idx})">✗ Ej nødv.</button>`
          : `<button class="prio-btn" style="font-size:11px" onclick="markPrioViewDone('${item.pid}','prioritering',${item.idx},false)">↩</button>`}
      </div>
    </div>`;
  };

  const bulkBar = someSelected ? `
    <div style="background:var(--bbg);border:1px solid var(--bbrd);border-radius:10px;padding:8px 12px;margin-bottom:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <span style="font-size:12px;font-weight:600;color:var(--blue)">${_selectedPrioItems.size} valgt</span>
      <button class="btn btn-sm" style="font-size:11px;background:var(--gbg);color:var(--green);border:1px solid var(--gbrd)" onclick="bulkPrioAction('done')">✓ Marker alle udført</button>
      <button class="btn btn-sm" style="font-size:11px;background:var(--s3);color:var(--muted);border:1px solid var(--border)" onclick="bulkPrioAction('notneeded')">✗ Ikke nødvendigt</button>
      <button class="btn btn-sm" style="font-size:11px;background:var(--rbg);color:var(--red);border:1px solid var(--rbrd)" onclick="bulkPrioAction('delete')">🗑 Slet valgte</button>
      <button class="btn btn-ghost btn-sm" style="font-size:11px;margin-left:auto" onclick="clearPrioSelection()">✕ Fravælg</button>
    </div>` : '';

  const selectAllRow = `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 2px;margin-bottom:8px;border-bottom:1px solid var(--border)">
      <input type="checkbox" ${allSelected?'checked':''} onchange="toggleSelectAllPrio(this.checked)"
        style="width:16px;height:16px;accent-color:var(--blue);cursor:pointer"/>
      <span style="font-size:12px;color:var(--muted2);font-weight:600">${allSelected?'Fravælg alle':'Vælg alle åbne'} (${openItems.length})</span>
    </div>`;

  let html = bulkBar + selectAllRow;

  if(groupByTeam){
    TEAMS.forEach(teamDef => {
      const teamItems = allItems.filter(x=>(x.team||null)===teamDef.key);
      if(teamItems.length === 0) return;
      const openCount = teamItems.filter(x=>!x.done).length;
      html += `<div style="background:${teamDef.bg};border:1.5px solid ${teamDef.brd};border-radius:12px;padding:12px 14px;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <div style="font-size:14px;font-weight:800;color:${teamDef.color}">${teamDef.label}</div>
          <span style="background:${teamDef.bg};color:${teamDef.color};border:1px solid ${teamDef.brd};border-radius:8px;font-size:11px;font-weight:700;padding:1px 8px">${openCount} åbne</span>
        </div>`;
      PRIO_GROUPS.forEach(g => {
        const items = teamItems.filter(x=>x.priority===g.priority);
        if(items.length === 0) return;
        const openG = items.filter(x=>!x.done).length;
        html += `<div style="font-size:11px;font-weight:800;color:${g.color};margin:8px 0 4px;display:flex;align-items:center;gap:6px">
          ${g.label} <span style="background:${g.bg};color:${g.color};border-radius:6px;padding:0 6px;font-size:10px">${openG}/${items.length}</span>
        </div>`;
        items.forEach(item => { html += renderItem(item); });
      });
      html += `</div>`;
    });
  } else {
    PRIO_GROUPS.forEach(g => {
      const items = allItems.filter(x=>x.priority===g.priority);
      if(items.length === 0) return;
      const open = items.filter(x=>!x.done).length;
      html += `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;margin-top:12px;border-bottom:2px solid ${g.brd}">
        <div style="font-size:13px;font-weight:800;color:${g.color}">${g.label}</div>
        <span style="background:${g.bg};color:${g.color};border-radius:8px;font-size:11px;font-weight:700;padding:1px 8px">${open}/${items.length}</span>
      </div>`;
      items.forEach(item => { html += renderItem(item); });
    });
    const doneItems = allItems.filter(x=>x.done);
    if(doneItems.length > 0){
      html += `<details style="margin-top:16px">
        <summary style="font-size:11px;color:var(--muted);cursor:pointer;padding:6px 0">✓ Afsluttede (${doneItems.length})</summary>
        <div style="margin-top:6px">${doneItems.map(item=>renderItem(item)).join('')}</div>
      </details>`;
    }
  }

  container.innerHTML = html;
}

function togglePrioSelect(key, checked){
  if(checked) _selectedPrioItems.add(key);
  else _selectedPrioItems.delete(key);
  renderPriorityView();
}

function toggleSelectAllPrio(checked){
  if(checked){
    patients.forEach(p=>{
      (p.sections.prioritering?.items||[]).forEach((item,i)=>{
        if(!item.done) _selectedPrioItems.add(`${p.id}|${i}`);
      });
    });
  } else {
    _selectedPrioItems.clear();
  }
  renderPriorityView();
}

function clearPrioSelection(){
  _selectedPrioItems.clear();
  renderPriorityView();
}

function bulkPrioAction(action){
  if(_selectedPrioItems.size === 0) return;
  if(action==='delete' && !confirm(`Slet ${_selectedPrioItems.size} prioritering(er)?`)) return;
  const keys = [..._selectedPrioItems];
  const byPid = {};
  keys.forEach(k=>{
    const [pid,idx] = k.split('|');
    if(!byPid[pid]) byPid[pid]=[];
    byPid[pid].push(parseInt(idx));
  });
  Object.entries(byPid).forEach(([pid,idxs])=>{
    const p = patients.find(x=>x.id===pid); if(!p) return;
    idxs.sort((a,b)=>b-a); // reverse order
    idxs.forEach(idx=>{
      const item = p.sections.prioritering.items[idx]; if(!item) return;
      if(action==='done'){
        item.done=true; item.completedAt=fmtDT(Date.now());
      } else if(action==='notneeded'){
        item.done=true; item.completedAt=fmtDT(Date.now()); item.notNeeded=true;
      } else if(action==='delete'){
        p.sections.prioritering.items.splice(idx,1);
      }
    });
  });
  _selectedPrioItems.clear();
  save(); renderPriorityView();
}

function markPrioNotNeeded(pid, idx){
  const p=patients.find(x=>x.id===pid); if(!p) return;
  const item = p.sections.prioritering.items[idx]; if(!item) return;
  item.done=true; item.notNeeded=true; item.completedAt=fmtDT(Date.now());
  save(); renderPriorityView();
}

function setPrioViewPrio(pid, type, idx, prio){
  const p=patients.find(x=>x.id===pid); if(!p) return;
  if(type==='prioritering') p.sections.prioritering.items[idx].priority=prio;
  save(); renderPriorityView();
}
function markPrioViewDone(pid, type, idx, done){
  const p=patients.find(x=>x.id===pid); if(!p) return;
  const dt = done ? fmtDT(Date.now()) : '';
  if(type==='prioritering'){
    p.sections.prioritering.items[idx].done=done;
    p.sections.prioritering.items[idx].completedAt=dt;
    if(!done) p.sections.prioritering.items[idx].notNeeded=false;
  }
  save(); renderPriorityView();
}
function removePrioViewItem(pid, idx){
  const p=patients.find(x=>x.id===pid); if(!p) return;
  p.sections.prioritering.items.splice(idx,1);
  save(); renderPriorityView();
}
function clearDonePriorities(){
  if(!confirm('Fjern alle afsluttede prioriteringer?')) return;
  patients.forEach(p => {
    if(p.sections.prioritering?.items)
      p.sections.prioritering.items = p.sections.prioritering.items.filter(x=>!x.done);
  });
  save(); renderPriorityView();
}

function addToPriorityList(pid, label, defaultPrio){
  const p = patients.find(x=>x.id===pid); if(!p) return;
  if(!p.sections.prioritering.items) p.sections.prioritering.items=[];
  p.sections.prioritering.items.push({
    id:uid(), label, done:false,
    priority: defaultPrio||'yellow',
    note:'', createdAt:fmtDT(Date.now()), completedAt:''
  });
  _lastSyncStr = JSON.stringify(patients);
  _lastSaveTime = Date.now();
  save();
  showPrioToast(label, defaultPrio||'yellow');
  updatePrioTabBadge();
  if(currentView==='prioritering') renderPriorityView();
}

function showPrioToast(label, prio){
  const colors = {red:'var(--red)',yellow:'var(--yellow)',green:'var(--green)'};
  const names  = {red:'🔴 Haster',yellow:'🟡 Vigtigt',green:'🟢 Rutine'};
  let toast = document.getElementById('prioToast');
  if(!toast){
    toast = document.createElement('div');
    toast.id = 'prioToast';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:999;background:var(--s1);border:1px solid var(--border2);border-radius:10px;padding:10px 16px;font-size:12px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.5);display:flex;align-items:center;gap:8px;max-width:320px;transition:opacity .3s';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span style="color:${colors[prio]}">${names[prio]}</span> <span style="color:var(--muted2)">"${label.slice(0,40)}"</span> <span style="color:var(--muted)">→ Prioritering</span>`;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>{ toast.style.opacity='0'; }, 2500);
}

function updatePrioTabBadge(){
  const total = patients.reduce((n,p)=>{
    return n + (p.sections.prioritering?.items||[]).filter(x=>!x.done).length;
  },0);
  const urgent = patients.reduce((n,p)=>{
    return n + (p.sections.prioritering?.items||[]).filter(x=>!x.done&&x.priority==='red').length;
  },0);
  const el = document.getElementById('vtabPrioCount');
  if(!el) return;
  if(total > 0){
    el.style.display = '';
    el.textContent = total;
    el.className = 'vtab-count' + (urgent>0 ? '' : ' yellow');
  } else {
    el.style.display = 'none';
  }
}

function toggleTeamFilter(team){
  if(team === 'all'){
    activeTeams = new Set(['all']);
  } else {
    activeTeams.delete('all');
    if(activeTeams.has(team)) {
      activeTeams.delete(team);
      if(activeTeams.size === 0) activeTeams = new Set(['all']);
    } else {
      activeTeams.add(team);
    }
  }
  activePatientId = null;
  render();
}

function getFilteredPatients(){
  if(activeTeams.has('all')) return patients;
  return patients.filter(p => activeTeams.has(p.team || 'none') || 
    (activeTeams.has('none') && !p.team));
}

function renderTeamBar(){
  const bar = document.getElementById('teamBar');
  if(!bar) return;
  if(patients.length === 0){ bar.style.display='none'; return; }
  bar.style.display = 'flex';

  const teams = ['A','B','C','Obs10','Obs5'];
  const teamDisplayNames = {A:'Team A',B:'Team B',C:'Team C',Obs10:'Obs. 10',Obs5:'Obs. 5'};
  const isAll = activeTeams.has('all');

  document.getElementById('teamAll').className = 'team-tab' + (isAll ? ' active-all' : '');

  teams.forEach(t => {
    const el = document.getElementById('teamTab'+t);
    if(!el) return;
    const count = patients.filter(p=>(p.team||'')===t).length;
    const isActive = !isAll && activeTeams.has(t);
    el.className = 'team-tab' + (isActive ? ' active-'+t.toLowerCase() : '');
    el.innerHTML = `${teamDisplayNames[t]||t} <span class="team-badge badge-${t.toLowerCase()}">${count}</span>`;
  });

  if(selectMode){
    const vis = getFilteredPatients();
    document.getElementById('selectCount').textContent = selectedPatients.size + ' / ' + vis.length + ' valgt';
  }
}

function toggleSelectBar(){
  selectMode = !selectMode;
  selectedPatients.clear();
  document.getElementById('selectBar').className = 'select-bar' + (selectMode ? ' open' : '');
  render();
}

function selectAllVisible(){
  getFilteredPatients().forEach(p => selectedPatients.add(p.id));
  render();
}

function selectNone(){
  selectedPatients.clear();
  render();
}

function toggleSelectPatient(pid){
  if(selectedPatients.has(pid)) selectedPatients.delete(pid);
  else selectedPatients.add(pid);
  render();
}

function deleteSelected(){
  if(selectedPatients.size === 0){ alert('Vælg mindst én patient.'); return; }
  if(!confirm(`Slet ${selectedPatients.size} patient(er)? De arkiveres og kan gendannes.`)) return;
  snapshotForUndo();
  const toDelete = patients.filter(p=>selectedPatients.has(p.id));
  toDelete.forEach(p => {
    if(_fbDb) fetch(_fbDb.url(`/kp2/archive/${p.id}`), {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...p,archivedAt:fmtDT(Date.now()),archivedBy:_actorName||'Ukendt'})}).catch(()=>{});
    logActivity('masse-slettet patient', p.name, p.id);
  });
  patients = patients.filter(p => !selectedPatients.has(p.id));
  selectedPatients.clear();
  save();
  selectMode = false;
  document.getElementById('selectBar').className = 'select-bar';
  render();
  showUndoToast(`${toDelete.length} patient(er) fjernet`);
}

function selectModalTeam(team){
  modalTeam = team;
  ['none','A','B','C'].forEach(t => {
    const el = document.getElementById('mteam-'+t);
    if(!el) return;
    const key = t === 'none' ? null : t;
    el.className = 'team-tab' + (modalTeam === key ? ' active-'+(t==='none'?'all':t.toLowerCase()) : '');
  });
}

function setActivePatient(id){
  activePatientId = id;
  render();
}

function renderNavBar(){
  const nav = document.getElementById('ptNav');
  const chips = document.getElementById('navChips');
  const navAll = document.getElementById('navAll');
  const filtered = getFilteredPatients();
  if(patients.length === 0){ if(nav) nav.style.display='none'; renderTeamBar(); return; }
  if(nav) nav.style.display = 'flex';
  if(navAll) navAll.className = 'pt-nav-all' + (activePatientId===null?' active':'');

  if(chips) chips.innerHTML = filtered.map(p => {
    const allTasks = getAllTasks(p);
    const hasUrgent = allTasks.some(t=>t.status==='urgent'&&!t.done);
    const allDone = allTasks.length>0 && allTasks.every(t=>t.done||t.enabled===false);
    const dotCls = hasUrgent ? 'has-urgent' : allDone ? 'has-done' : '';
    const isActive = activePatientId === p.id;
    const _tLabels = {A:'A',B:'B',C:'C',Obs10:'Obs.10',Obs5:'Obs.5'};
    const teamBadge = p.team ? `<span class="team-badge badge-${p.team.toLowerCase()}">${_tLabels[p.team]||p.team}</span>` : '';
    return `<div class="pt-nav-chip ${isActive?'active':''}" onclick="setActivePatient('${p.id}')">
      <div class="nav-dot ${dotCls}"></div>
      <span>${p.room ? p.room : p.name}</span>${teamBadge}
    </div>`;
  }).join('');
  renderTeamBar();
}
function timeToMin(t){ const [h,m]=t.split(':').map(Number); return h*60+m; }
function slotStatus(timeStr){
  const cur = timeToMin(nowHHMM());
  const slotMin = timeToMin(timeStr);
  const diff = slotMin - cur;
  if(diff < -5) return 'overdue';
  if(diff <= 60) return 'upcoming';
  return 'pending';
}

function getStatusBadge(t){
  if(t.done)           return {cls:'st-done',     txt:'✓ Udført'};
  if(t.status==='urgent')    return {cls:'st-urgent',   txt:'🚨 Haster'};
  if(t.status==='inprogress')return {cls:'st-inprog',   txt:'▶ I gang'};
  if(t.status==='upcoming')  return {cls:'st-soon',     txt:'⏰ Snart'};
  if(t.status==='overdue')   return {cls:'st-over',     txt:'✗ Ikke gjort'};
  return {cls:'st-pend', txt:'— Afventer'};
}
function getPillCls(t){
  if(t.done)                  return 'done';
  if(t.status==='urgent')     return 'over';   // red pill for urgent
  if(t.status==='inprogress') return 'soon';   // yellow pill for in-progress
  if(t.status==='upcoming')   return 'soon';
  if(t.status==='overdue')    return 'over';
  return '';
}

const COLORS = {
  blue:{bg:'var(--bbg)',brd:'var(--bbrd)',txt:'var(--blue)'},
  green:{bg:'var(--gbg)',brd:'var(--gbrd)',txt:'var(--green)'},
  orange:{bg:'var(--obg)',brd:'var(--obrd)',txt:'var(--orange)'},
  purple:{bg:'var(--pbg)',brd:'var(--pbrd)',txt:'var(--purple)'},
  teal:{bg:'var(--tbg)',brd:'var(--tbrd)',txt:'var(--teal)'},
  red:{bg:'var(--rbg)',brd:'var(--rbrd)',txt:'var(--red)'},
  yellow:{bg:'var(--ybg)',brd:'var(--ybrd)',txt:'var(--yellow)'},
};

function render(){
  const list = document.getElementById('ptList');
  if(!list) return;

  const filtered = activePatientId
    ? patients.filter(p=>p.id===activePatientId)
    : getFilteredPatients();

  document.getElementById('emptyEl').style.display = patients.length ? 'none':'block';
  [...list.querySelectorAll('.pt-card')].forEach(e=>e.remove());

  filtered.forEach(p => {
    const forceOpen = activePatientId !== null;
    const card = document.createElement('div');
    const isSelected = selectedPatients.has(p.id);
    card.className = 'pt-card' + ((forceOpen || p.open)?' open':'');
    card.id = 'ptcard-'+p.id;
    if(isSelected) card.style.outline = '2px solid var(--blue)';

    const allTasks = getAllTasks(p);
    const pills = allTasks.slice(0,12).map(t=>`<div class="ppill ${getPillCls(t)}"></div>`).join('');
    const done = allTasks.filter(t=>t.done).length;
    const _tLabels2 = {A:'Team A',B:'Team B',C:'Team C',Obs10:'Observation 10',Obs5:'Observation 5'};
    const teamBadge = p.team ? `<span class="team-badge badge-${p.team.toLowerCase()}" style="font-size:10px;margin-left:4px">${_tLabels2[p.team]||p.team}</span>` : '';

    let bodyHtml = '';
    try { bodyHtml = renderCustomizePanel(p) + renderSections(p); }
    catch(e) {
      console.error('renderSections error for', p.name, e);
      bodyHtml = `<div style="color:var(--red);padding:12px;font-size:12px">⚠ Fejl ved visning: ${e.message}</div>`;
    }

    const selectCb = selectMode ? `<div style="flex-shrink:0;margin-right:6px">
      <input type="checkbox" ${isSelected?'checked':''} style="width:18px;height:18px;cursor:pointer;accent-color:var(--blue)"
        onchange="toggleSelectPatient(event,'${p.id}')"/>
    </div>` : '';

    const teamBtns = ['A','B','C','Obs10','Obs5'].map(t=>{
      const active = (p.team||'')==t;
      const colors = {A:'#3b82f6',B:'#a855f7',C:'#f97316',Obs10:'#ef4444',Obs5:'#6366f1'};
      const labels = {A:'A',B:'B',C:'C',Obs10:'Obs.10',Obs5:'Obs.5'};
      return `<button style="padding:4px 10px;font-size:11px;font-weight:700;border-radius:8px;cursor:pointer;font-family:inherit;
        border:2px solid ${active?colors[t]:'var(--border2)'};
        background:${active?colors[t]:'var(--s3)'};
        color:${active?'#fff':'var(--muted2)'};
        transition:all .15s"
        onclick="setPatientTeam('${p.id}','${t}')">${labels[t]||t}</button>`;
    }).join('');

    card.innerHTML = `
      <div class="pt-header" onclick="${selectMode?'toggleSelectPatient(event,\''+p.id+'\')':'togglePt(\''+p.id+'\''}" style="${selectMode?'cursor:pointer':''}">
        <div class="pt-left">
          ${selectCb}
          <div class="pt-avatar">${initials(p.name)}</div>
          <div>
            <div class="pt-name">${p.name}${teamBadge}</div>
            <div class="pt-meta">${p.room||'Ingen stue'}${p.diag?' · '+p.diag:''}</div>
          </div>
        </div>
        <div class="pt-right">
          <div class="pt-counter">${done}/${allTasks.length}</div>
          <div class="pt-prog">${pills}</div>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>
      <div class="pt-body" id="body-${p.id}">
        ${bodyHtml}
        <div class="divider"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <button class="btn btn-danger btn-sm" onclick="removePt('${p.id}')">🗑 Fjern patient</button>
          <div style="display:flex;gap:4px;align-items:center">
            <span style="font-size:11px;color:var(--muted);font-weight:600">Skift team:</span>
            ${teamBtns}
            <button style="padding:4px 10px;font-size:12px;font-weight:700;border-radius:8px;cursor:pointer;font-family:inherit;
              border:2px solid ${!p.team?'var(--muted)':'var(--border2)'};
              background:${!p.team?'var(--s2)':'var(--s3)'};
              color:${!p.team?'var(--text)':'var(--muted)'}"
              onclick="setPatientTeam('${p.id}',null)" title="Fjern team">–</button>
          </div>
        </div>
      </div>
    `;
    list.appendChild(card);
  });

  renderNavBar();
  renderSidebar();
  renderSummary();
  updatePrioTabBadge();
  updateDate();
}

function getAllTasks(p){
  const s = p.sections;
  if(!s) return [];
  return [
    ...(s.vaske?.tasks||[]),
    ...(s.kost?.tasks||[]),
    ...(s.ekstra?.tasks||[]),
    ...(s.plejeplan?.tasks||[]),
  ];
}

function renderCustomizePanel(p){
  const s = p.sections;
  const isOpen = p.customizeOpen;
  const secDefs = [
    {key:'vaske', icon:'🚿', title:'Personlig hygiejne'},
    {key:'kost',  icon:'🍽️', title:'Ernæring'},
    {key:'medicin',icon:'💊', title:'Medicin'},
    {key:'bleskift',icon:'🔄', title:'Bleskift'},
    {key:'td',    icon:'🧪', title:'Time Diurese (TD)'},
    {key:'sik',   icon:'💉', title:'SIK'},
    {key:'sss',   icon:'🧠', title:'SSS'},
    {key:'ich',   icon:'🩻', title:'ICH Målinger'},
    {key:'tromb', icon:'🩺', title:'Trombolyse / EVT'},
    {key:'ekstra',icon:'📋', title:'Øvrige opgaver'},
    {key:'plejeplan',icon:'📝', title:'Plejeforløbsplan'},
  ];
  return `
  <div style="margin-bottom:10px">
    <button class="btn btn-ghost btn-sm" style="width:100%;justify-content:space-between;margin-bottom:${isOpen?'10px':'0'}"
      onclick="toggleCustomize('${p.id}')">
      <span>⚙️ Tilpas sektioner &amp; opgaver</span>
      <span style="font-size:11px;color:var(--muted)">${isOpen?'▲ Luk':'▼ Åbn'}</span>
    </button>
    ${isOpen ? `
    <div style="background:var(--s2);border:1px solid var(--border);border-radius:11px;padding:12px;display:flex;flex-direction:column;gap:10px">
      ${secDefs.map(sd=>{
        const sec = s[sd.key];
        const enabled = sec.enabled !== false;
        const hasTasks = sec.tasks && sec.tasks.length > 0;
        return `
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${hasTasks&&enabled?'7px':'0'}">
            <div style="display:flex;align-items:center;gap:7px">
              <span>${sd.icon}</span>
              <span style="font-size:13px;font-weight:600;${!enabled?'color:var(--muted);text-decoration:line-through;':''}">${sd.title}</span>
            </div>
            <label class="tog-wrap">
              <input type="checkbox" ${enabled?'checked':''} onchange="toggleSection('${p.id}','${sd.key}',this.checked)" class="tog-inp"/>
              <span class="tog-slider"></span>
            </label>
          </div>
          ${hasTasks && enabled ? `
          <div style="display:flex;flex-direction:column;gap:4px;padding-left:20px">
            ${sec.tasks.map(t=>`
            <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px;background:var(--s3);border-radius:6px;">
              <span style="font-size:12px;${t.enabled===false?'color:var(--muted);text-decoration:line-through;':''}">${t.label}</span>
              <label class="tog-wrap tog-sm">
                <input type="checkbox" ${t.enabled!==false?'checked':''} onchange="toggleTask2('${p.id}','${sd.key}','${t.id}',this.checked)" class="tog-inp"/>
                <span class="tog-slider"></span>
              </label>
            </div>`).join('')}
          </div>` : ''}
        </div>`;
      }).join('')}
    </div>` : ''}
  </div>`;
}

function renderSections(p){
  const s = p.sections;
  if(!s) return '';
  const safe = (fn) => { try { return fn(); } catch(e) { return `<div style="color:var(--red);font-size:11px;padding:6px 0">⚠ Fejl ved visning: ${e.message}</div>`; } };
  return `
    ${s.ankomst?.enabled!==false ? safe(()=>renderAnkomstSection(p)) : ''}
    ${s.prioritering?.enabled!==false ? safe(()=>renderPrioritSection(p)) : ''}
    ${s.vaske?.enabled!==false ? safe(()=>renderVaskeSection(p)) : ''}
    ${s.kost?.enabled!==false ? safe(()=>renderKostSection(p)) : ''}
    ${s.medicin?.enabled!==false ? safe(()=>renderMedicinSection(p)) : ''}
    ${s.bleskift?.enabled!==false ? safe(()=>renderBleskiftSection(p)) : ''}
    ${s.td?.enabled!==false ? safe(()=>renderTDSection(p)) : ''}
    ${s.sik?.enabled!==false ? safe(()=>renderSIKSection(p)) : ''}
    ${s.sss?.enabled!==false ? safe(()=>renderSSSSection(p)) : ''}
    ${s.ich?.enabled!==false ? safe(()=>renderICHSection(p)) : ''}
    ${s.tromb?.enabled!==false ? safe(()=>renderTrombSection(p)) : ''}
    ${s.ekstra?.enabled!==false ? safe(()=>renderEkstraSection(p)) : ''}
    ${s.plejeplan?.enabled!==false ? safe(()=>renderPlejeplanSection(p)) : ''}
  `;
}

function renderSidebar(){
  const sb = document.getElementById('sidebar');
  const content = document.getElementById('sidebarContent');
  if(!sb || !content) return;
  if(patients.length === 0){ sb.style.display='none'; return; }
  sb.style.display = 'block';

  const TEAM_ORDER = ['A','B','C','Obs10','Obs5',null];
  const TEAM_LABELS = {A:'Team A',B:'Team B',C:'Team C',Obs10:'Observation 10',Obs5:'Observation 5',null:'Uden team'};
  const TEAM_COLORS = {A:'#3b82f6',B:'#a855f7',C:'#f97316',Obs10:'#ef4444',Obs5:'#6366f1',null:'var(--muted)'};

  let html = '';
  TEAM_ORDER.forEach(team => {
    const pts = patients.filter(p=>(p.team||null)===team);
    if(pts.length === 0) return;
    const color = TEAM_COLORS[team];
    html += `<div class="sidebar-team" style="color:${color}">${TEAM_LABELS[team]}<span style="font-size:10px;opacity:.7">${pts.length}</span></div>`;
    pts.forEach(p => {
      const isActive = activePatientId === p.id;
      const editId = `sbedit-${p.id}`;
      const allTasks = getAllTasks(p);
      const urgentCount = allTasks.filter(t=>t.status==='urgent'&&!t.done).length;
      const urgentBadge = urgentCount>0 ? `<span style="background:var(--rbg);color:var(--red);border-radius:4px;padding:1px 5px;font-size:9px;font-weight:700">🚨${urgentCount}</span>` : '';
      html += `
        <div class="sidebar-pt ${isActive?'active':''}" onclick="setActivePatient('${p.id}')">
          <div style="flex:1;min-width:0">
            <div class="sidebar-pt-name">${p.name} ${urgentBadge}</div>
            <span class="sidebar-pt-room">${p.room||'Ingen stue'}</span>
          </div>
          <button class="sidebar-edit-btn" onclick="toggleSidebarEdit(event,'${p.id}')">✎</button>
        </div>
        <div class="pt-edit-inline" id="${editId}">
          <div style="display:flex;flex-direction:column;gap:5px">
            <input class="ifield" style="font-size:11px;padding:5px 8px"
              id="sbedit-name-${p.id}" value="${p.name}" placeholder="Navn"
              onkeydown="if(event.key==='Enter')saveSidebarEdit('${p.id}')"/>
            <input class="ifield" style="font-size:11px;padding:5px 8px"
              id="sbedit-room-${p.id}" value="${p.room||''}" placeholder="Stue / Seng"
              onkeydown="if(event.key==='Enter')saveSidebarEdit('${p.id}')"
              oninput="(function(v){const hint=document.getElementById('roomteamhint-${p.id}');if(!hint)return;const at=getAutoTeamForRoom(v);hint.textContent=at?'→ Tildeles '+{Obs10:'Observation 10',Obs5:'Observation 5'}[at]:'';hint.style.color='var(--muted)';})(this.value)"/>
            <div id="roomteamhint-${p.id}" style="font-size:10px;height:14px"></div>
            <div id="roomconf-${p.id}" style="display:none"></div>
            <input class="ifield" style="font-size:11px;padding:5px 8px"
              id="sbedit-diag-${p.id}" value="${p.diag||''}" placeholder="Diagnose"
              onkeydown="if(event.key==='Enter')saveSidebarEdit('${p.id}')"/>
            <div style="display:flex;gap:4px">
              ${['A','B','C','Obs10','Obs5'].map(t=>{
                const labels={A:'A',B:'B',C:'C',Obs10:'Obs.10',Obs5:'Obs.5'};
                return `<button class="team-tab${(p.team||'')==t?' active-'+t.toLowerCase():''}" style="padding:3px 8px;font-size:11px;flex:1" onclick="setSidebarTeam('${p.id}','${t}',this)">${labels[t]||t}</button>`;
              }).join('')}
              <button class="team-tab${!p.team?' active-all':''}" style="padding:3px 6px;font-size:11px" onclick="setSidebarTeam('${p.id}',null,this)">–</button>
            </div>
            <div style="display:flex;gap:5px;margin-top:2px">
              <button class="btn btn-primary btn-sm" style="flex:1;font-size:11px" onclick="saveSidebarEdit('${p.id}')">✓ Gem</button>
              <button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="cancelSidebarEdit('${p.id}')">✕ Annuller</button>
            </div>
            <button class="btn btn-danger btn-sm" style="font-size:11px" onclick="removePt('${p.id}')">🗑 Slet patient</button>
          </div>
        </div>`;
    });
  });
  content.innerHTML = html;
}

function toggleSidebarEdit(e, pid){
  e.stopPropagation();
  const el = document.getElementById('sbedit-'+pid);
  if(!el) return;
  document.querySelectorAll('.pt-edit-inline.open').forEach(x=>{
    if(x.id !== 'sbedit-'+pid) x.classList.remove('open');
  });
  el.classList.toggle('open');
  _syncPaused = el.classList.contains('open');
}

function getAutoTeamForRoom(room){
  if(!room) return null;
  const m = room.match(/(\d+)/);
  if(!m) return null;
  const stuenr = parseInt(m[1]);
  if(stuenr === 10) return 'Obs10';
  if(stuenr === 5)  return 'Obs5';
  return null;
}

function saveSidebarEdit(pid){
  const p = patients.find(x=>x.id===pid); if(!p) return;
  const nameEl = document.getElementById('sbedit-name-'+pid);
  const roomEl = document.getElementById('sbedit-room-'+pid);
  const diagEl = document.getElementById('sbedit-diag-'+pid);
  if(nameEl) p.name = nameEl.value.trim() || p.name;
  if(roomEl) p.room = roomEl.value.trim();
  if(diagEl) p.diag = diagEl.value.trim();
  // Auto-tildel team hvis stue 10 eller 5
  const autoTeam = getAutoTeamForRoom(p.room);
  if(autoTeam) p.team = autoTeam;
  const el = document.getElementById('sbedit-'+pid);
  if(el) el.classList.remove('open');
  _syncPaused = false;
  save();
  renderNavBar();
  renderSidebar();
}

function cancelSidebarEdit(pid){
  const el = document.getElementById('sbedit-'+pid);
  if(el) el.classList.remove('open');
  _syncPaused = false;
  renderSidebar(); // restore original values
}

function setSidebarTeam(pid, team, btn){
  const p = patients.find(x=>x.id===pid); if(!p) return;
  p.team = team;
  const container = btn.closest('.pt-edit-inline');
  if(container){
    container.querySelectorAll('.team-tab').forEach(b => b.className = 'team-tab');
    if(team) btn.className = 'team-tab active-'+team.toLowerCase();
    else btn.className = 'team-tab active-all';
  }
}

function updatePatientField(pid, field, val){
  const p = patients.find(x=>x.id===pid); if(!p) return;
  p[field] = val;
  localStorage.setItem('kp2_pts', JSON.stringify(patients));
}

const PRIO_COLORS = {red:'var(--red)',yellow:'var(--yellow)',green:'var(--green)'};
const PRIO_LABELS = {red:'🔴 Haster',yellow:'🟡 Vigtigt',green:'🟢 Rutine'};

function renderAnkomstSection(p){
  const sec = p.sections.ankomst;
  if(!sec) return '';
  const c = COLORS.red;
  const done = (sec.items||[]).filter(x=>x.done).length;
  const total = (sec.items||[]).length;
  return `
  <div class="sec ${sec.open?'open':''}" id="sec-${p.id}-ankomst">
    <div class="sec-header" onclick="toggleSec('${p.id}','ankomst')"
      style="border-color:${sec.open?c.brd:'var(--border)'}">
      <span class="sec-icon">🏥</span>
      <span class="sec-title">Ankomststatus</span>
      <span class="sec-badge" style="background:${c.bg};color:${c.txt}">${done}/${total} udført</span>
      <button class="add-prio-btn" style="margin-right:4px;flex-shrink:0" title="Tilføj til prioritering" onclick="openAddPrioMenu(event,'${p.id}','Ankomststatus')">&#9889;</button>
      <svg class="sec-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="sec-body">
      ${(sec.items||[]).map((item,i)=>{
        const prioCls = 'prio-'+item.priority;
        const editId = `ankomst-edit-${p.id}-${i}`;
        return `<div class="prio-item ${item.done?'done-item':''}">
          <div class="prio-dot ${prioCls}"></div>
          <div style="flex:1;min-width:0">
            <div class="prio-label ${item.done?'done-lbl':''}">${item.label}${item.time?`<span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--muted);margin-left:8px">⏰ ${item.time}</span>`:''}</div>
            <div class="prio-meta">
              ${item.createdAt?`Oprettet: <span class="edt-ts" data-dt="${item.createdAt}" data-fn="setAnkomstDT('${p.id}',${i},'createdAt',v)" onclick="openDTE(this)">✎ ${item.createdAt}</span>`:'<span style="color:var(--muted)">Ikke startet</span>'}
              ${item.completedAt?` · Afsluttet: <span class="edt-ts" data-dt="${item.completedAt}" data-fn="setAnkomstDT('${p.id}',${i},'completedAt',v)" onclick="openDTE(this)">✎ ${item.completedAt}</span>`:''}
            </div>
            ${item.note?`<div class="prio-note">📝 ${item.note}</div>`:''}
            <div class="prio-priority-sel" style="margin-top:5px">
              <div class="prio-psel prio-red ${item.priority==='red'?'active':''}" style="background:#ef4444" title="Haster" onclick="setAnkomstPrio('${p.id}',${i},'red')"></div>
              <div class="prio-psel prio-yellow ${item.priority==='yellow'?'active':''}" style="background:#f59e0b" title="Vigtigt" onclick="setAnkomstPrio('${p.id}',${i},'yellow')"></div>
              <div class="prio-psel prio-green ${item.priority==='green'?'active':''}" style="background:#10b981" title="Rutine" onclick="setAnkomstPrio('${p.id}',${i},'green')"></div>
              <button class="prio-btn" style="font-size:10px;padding:1px 6px;margin-left:4px" onclick="toggleAnkomstNote('${editId}')">📝</button>
            </div>
            <div id="${editId}" style="display:none;margin-top:5px">
              <input class="ifield" style="font-size:11px;padding:4px 8px" placeholder="Notat..."
                value="${item.note||''}" oninput="setAnkomstNote('${p.id}',${i},this.value)"/>
            </div>
          </div>
          <div class="prio-actions">
            ${!item.done
              ? `<button class="prio-btn done-btn" onclick="markAnkomst('${p.id}',${i},true)">✓</button>`
              : `<button class="prio-btn" onclick="markAnkomst('${p.id}',${i},false)">↩</button>`}
            <button class="add-prio-btn" style="font-size:11px;margin-top:3px" title="Tilføj til prioritering" onclick="openAddPrioMenu(event,'${p.id}','${item.label.replace(/'/g,"\\'").replace(/"/g,'\\"')}')">⚡</button>
          </div>
        </div>`;
      }).join('')}
      <div style="margin-top:8px">
        <button class="mark-all-btn" style="background:var(--rbg);color:var(--red);border-color:var(--rbrd)" onclick="resetSection('${p.id}','ankomst')" title="Nulstil alle afkrydsninger i ankomststatus">↺ Nulstil alt</button>
      </div>
    </div>
  </div>`;
}

function renderPrioritSection(p){
  const sec = p.sections.prioritering;
  if(!sec) return '';
  const c = COLORS.red;
  const items = sec.items||[];
  // Auto-åbn sektionen hvis der er åbne opgaver
  if(items.filter(x=>!x.done).length > 0) sec.open = true;
  const sorted = [...items].sort((a,b)=>{
    const order={red:0,yellow:1,green:2};
    return (order[a.priority]||1)-(order[b.priority]||1);
  });
  const open = items.filter(x=>!x.done).length;
  return `
  <div class="sec ${sec.open?'open':''}" id="sec-${p.id}-prioritering">
    <div class="sec-header" onclick="toggleSec('${p.id}','prioritering')"
      style="border-color:${sec.open?c.brd:'var(--border)'}">
      <span class="sec-icon">⚡</span>
      <span class="sec-title">Prioriteringsliste</span>
      <div style="display:flex;gap:5px">
        ${['red','yellow','green'].map(pr=>{
          const cnt=items.filter(x=>x.priority===pr&&!x.done).length;
          return cnt>0?`<span class="sec-badge" style="background:var(--${pr==='red'?'rbg':pr==='yellow'?'ybg':'gbg'});color:var(--${pr==='red'?'red':pr==='yellow'?'yellow':'green'})">${cnt}</span>`:'';
        }).join('')}
      </div>
      <svg class="sec-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="sec-body">
      ${sorted.length===0?'<div style="font-size:12px;color:var(--muted);padding:4px 0">Ingen prioriterede opgaver endnu.</div>':''}
      ${sorted.map((item,_)=>{
        const i=items.indexOf(item);
        const prioCls='prio-'+item.priority;
        const editId=`prio-edit-${p.id}-${i}`;
        return `<div class="prio-item ${item.done?'done-item':''}">
          <div class="prio-dot ${prioCls}"></div>
          <div style="flex:1;min-width:0">
            <div class="prio-label ${item.done?'done-lbl':''}">${item.label}</div>
            <div class="prio-meta">
              ${item.createdAt?`<span class="edt-ts" data-dt="${item.createdAt}" data-fn="setPrioritDT('${p.id}',${i},'createdAt',v)" onclick="openDTE(this)">✎ ${item.createdAt}</span>`:''}
              ${item.completedAt?` · ✓ <span class="edt-ts" data-dt="${item.completedAt}" data-fn="setPrioritDT('${p.id}',${i},'completedAt',v)" onclick="openDTE(this)">✎ ${item.completedAt}</span>`:''}
              <span class="sec-badge" style="font-size:9px;padding:1px 5px;background:var(--${item.priority==='red'?'rbg':item.priority==='yellow'?'ybg':'gbg'});color:var(--${item.priority==='red'?'red':item.priority==='yellow'?'yellow':'green'})">${PRIO_LABELS[item.priority]}</span>
            </div>
            ${item.note?`<div class="prio-note">📝 ${item.note}</div>`:''}
            <div style="display:flex;gap:4px;margin-top:5px;flex-wrap:wrap">
              <div class="prio-psel" style="background:#ef4444;width:12px;height:12px;border-radius:50%;cursor:pointer;border:2px solid ${item.priority==='red'?'#fff':'transparent'}" onclick="setPrioritPrio('${p.id}',${i},'red')"></div>
              <div class="prio-psel" style="background:#f59e0b;width:12px;height:12px;border-radius:50%;cursor:pointer;border:2px solid ${item.priority==='yellow'?'#fff':'transparent'}" onclick="setPrioritPrio('${p.id}',${i},'yellow')"></div>
              <div class="prio-psel" style="background:#10b981;width:12px;height:12px;border-radius:50%;cursor:pointer;border:2px solid ${item.priority==='green'?'#fff':'transparent'}" onclick="setPrioritPrio('${p.id}',${i},'green')"></div>
              <button class="prio-btn" style="font-size:10px;padding:1px 6px" onclick="toggleAnkomstNote('${editId}')">📝</button>
              <button class="prio-btn del-btn" style="font-size:10px;padding:1px 6px" onclick="removePrioritItem('${p.id}',${i})">✕</button>
            </div>
            <div id="${editId}" style="display:none;margin-top:5px">
              <input class="ifield" style="font-size:11px;padding:4px 8px" placeholder="Notat..."
                value="${item.note||''}" oninput="setPrioritNote('${p.id}',${i},this.value)"/>
            </div>
          </div>
          <div class="prio-actions">
            ${!item.done
              ? `<button class="prio-btn done-btn" onclick="markPrioritDone('${p.id}',${i},true)">✓</button>`
              : `<button class="prio-btn" onclick="markPrioritDone('${p.id}',${i},false)">↩</button>`}
          </div>
        </div>`;
      }).join('')}
      <!-- Add new -->
      <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;align-items:flex-end">
        <div style="flex:1;min-width:160px">
          <div style="font-size:10px;color:var(--muted);margin-bottom:3px">Opgave</div>
          <input class="ifield" id="pnew-${p.id}" placeholder="Beskriv opgaven..."
            style="width:100%;font-size:12px"
            onfocus="_syncPaused=true"
            onblur="_syncPaused=false"
            onkeydown="if(event.key==='Enter'){addPrioritItem('${p.id}');_syncPaused=false;}"/>
        </div>
        <div>
          <div style="font-size:10px;color:var(--muted);margin-bottom:3px">Tid (valgfri)</div>
          <input type="time" class="ifield" id="pnewtime-${p.id}" style="width:100px;font-size:12px"
            onfocus="_syncPaused=true" onblur="_syncPaused=false"/>
        </div>
        <div>
          <div style="font-size:10px;color:var(--muted);margin-bottom:3px">Prioritet</div>
          <select class="ifield" id="pnewprio-${p.id}" style="width:120px;font-size:11px">
            <option value="red">P1 — Haster</option>
            <option value="yellow" selected>P2 — Vigtigt</option>
          </select>
        </div>
        <button class="btn btn-primary btn-sm" style="height:36px" onclick="_syncPaused=false;addPrioritItem('${p.id}')">+ Tilføj</button>
        <button class="mark-all-btn" style="background:var(--rbg);color:var(--red);border-color:var(--rbrd);height:36px" onclick="resetPrioritSection('${p.id}')" title="Fjern alle udførte opgaver">↺ Nulstil</button>
      </div>
    </div>
  </div>`;
}

function renderVaskeSection(p){
  const sec = p.sections.vaske;
  if(!sec || !sec.tasks) return '';
  const c = COLORS.blue;
  return `
  <div class="sec ${sec.open?'open':''}" id="sec-${p.id}-vaske">
    <div class="sec-header" onclick="toggleSec('${p.id}','vaske')"
      style="border-color:${sec.open?c.brd:'var(--border)'}">
      <span class="sec-icon">🚿</span>
      <span class="sec-title">${sec.title}</span>
      <span class="sec-badge" style="background:${c.bg};color:${c.txt}">${sec.tasks.filter(t=>t.enabled!==false&&t.done).length}/${sec.tasks.filter(t=>t.enabled!==false).length}</span>
      <button class="add-prio-btn" style="margin-right:4px;flex-shrink:0" title="Tilføj Personlig hygiejne til prioritering" onclick="openAddPrioMenu(event,'${p.id}','Personlig hygiejne')">⚡</button>
      <svg class="sec-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="sec-body">
      ${sec.tasks.filter(t=>t.enabled!==false).map(t=>renderTask(p.id,'vaske',t)).join('')}
      <div class="add-row">
        <input class="ifield" id="at-${p.id}-vaske" placeholder="Tilføj opgave..." onkeydown="if(event.key==='Enter')addTask('${p.id}','vaske')"/>
        <select class="ifield" id="ats-${p.id}-vaske" style="flex:0 0 auto;width:120px">
          <option value="pending">Afventer</option>
          <option value="upcoming">Snart</option>
          <option value="overdue">Ikke gjort</option>
        </select>
        <select style="flex:0 0 auto;width:80px;font-size:11px;padding:4px 6px;border-radius:7px;border:1px solid var(--border2);background:var(--s3);color:var(--muted2);font-family:inherit" id="atf-${p.id}-vaske" title="Frekvens per dag">
          <option value="0">Ingen</option>
          <option value="1">1×/dag (1 gang)</option>
          <option value="2">2×/dag (hver 12. t)</option>
          <option value="3">3×/dag (hver 8. t)</option>
          <option value="4">4×/dag (hver 6. t)</option>
          <option value="6">6×/dag (hver 4. t)</option>
          <option value="8">8×/dag (hver 3. t)</option>
          <option value="12">12×/dag (hver 2. t)</option>
          <option value="24">24×/dag (hver time)</option>
          <option value="48">48×/dag (hver ½ time)</option>
        </select>
        <button class="btn btn-primary btn-sm" onclick="addTask('${p.id}','vaske')">+ Tilføj</button>
      </div>
      ${markAllBtn(p.id,'vaske')}
    </div>
  </div>`;
}

function renderKostSection(p){
  const sec = p.sections.kost;
  if(!sec || !sec.tasks) return '';
  const c = COLORS.orange;
  const kostTypes = ['Fuldkost','Cremet kost','Gratin kost','Flydende','Pureret'];
  return `
  <div class="sec ${sec.open?'open':''}" id="sec-${p.id}-kost">
    <div class="sec-header" onclick="toggleSec('${p.id}','kost')"
      style="border-color:${sec.open?c.brd:'var(--border)'}">
      <span class="sec-icon">🍽️</span>
      <span class="sec-title">${sec.title}</span>
      <span class="sec-badge" style="background:${c.bg};color:${c.txt}">${sec.kostType||'Ikke valgt'}</span>
      <button class="add-prio-btn" style="margin-right:4px;flex-shrink:0" title="Tilføj Ernæring til prioritering" onclick="openAddPrioMenu(event,'${p.id}','Ernæring')">⚡</button>
      <svg class="sec-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="sec-body">
      <div class="sec-lbl">Kosttype</div>
      <div class="kost-row">
        ${kostTypes.map(k=>`<button class="kost-btn ${sec.kostType===k?'active':''}" onclick="setKost('${p.id}','${k}')">${k}</button>`).join('')}
      </div>
      <div class="sec-lbl" style="margin-top:10px">Sonde</div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
          <input type="checkbox" ${sec.sonde?'checked':''} onchange="toggleSonde('${p.id}',this.checked)" style="cursor:pointer"/>
          Sondeernæring
        </label>
        ${sec.sonde ? `
        <div class="sonde-info">
          <div class="sonde-field">
            <div class="sfield-label">Type</div>
            <input class="sfield-val" value="${sec.sondeType||''}" placeholder="F.eks. Nutrison" style="width:110px"
              oninput="setSondeField('${p.id}','sondeType',this.value)"/>
          </div>
          <div class="sonde-field">
            <div class="sfield-label">ml/dosis</div>
            <input class="sfield-val" value="${sec.sondeMl||''}" placeholder="300" type="number"
              oninput="setSondeField('${p.id}','sondeMl',this.value)"/>
          </div>
          <div class="sonde-field">
            <div class="sfield-label">Gange/dag</div>
            <input class="sfield-val" value="${sec.sondeFreq||''}" placeholder="4" type="number"
              oninput="setSondeField('${p.id}','sondeFreq',this.value)"/>
          </div>
        </div>
        ${sec.sondeFreq ? `
          <div class="sec-lbl" style="margin-top:8px">Tidspunkter for sondeernæring</div>
          <div class="time-slots" style="flex-wrap:wrap;align-items:flex-start">
            ${(sec.sondeTimes && sec.sondeTimes.length
              ? sec.sondeTimes
              : TIME_SUGGESTIONS[Math.min(parseInt(sec.sondeFreq)||1,6)]||['08:00']
            ).map((t,i)=>renderSondeTimeSlot(p.id,t,i)).join('')}
            <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:4px 9px;align-self:center"
              onclick="addSondeTime('${p.id}')">+ Tid</button>
          </div>` : ''}
        ` : ''}
      </div>
      <div class="sec-lbl">Måltider</div>
      ${sec.tasks.map(t=>renderKostTask(p.id,t)).join('')}
      ${markAllBtn(p.id,'kost')}
    </div>
  </div>`;
}

function renderKostTask(pid, t){
  const bd = getStatusBadge(t);
  const pickerId = `sp-${pid}-kost-${t.id}`;
  return `
  <div class="task-row">
    <div class="tcheck ${t.done?'done':''}" onclick="toggleKostTask('${pid}','${t.id}')"></div>
    <div class="tlabel ${t.done?'done':''}">${t.label}</div>
    ${t.time?`<span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--muted2)">${t.time}</span>`:''}
    ${t.count!==null&&t.count!==undefined?`<div class="tcounter"><button class="cbtn" onclick="changeKostCount('${pid}','${t.id}',-1)">−</button><span>${t.count}</span><button class="cbtn" onclick="changeKostCount('${pid}','${t.id}',1)">+</button></div>`:''}
    <div style="position:relative;flex-shrink:0">
      <span class="tstatus ${bd.cls}" onclick="toggleStatusPicker('${pickerId}')">${bd.txt} ▾</span>
      <div id="${pickerId}" class="status-picker">
        <button class="sp-opt sp-done"  onclick="setTaskStatus('${pid}','kost','${t.id}','done',true)"      >✓ Udført</button>
        <button class="sp-opt sp-inp"   onclick="setTaskStatus('${pid}','kost','${t.id}','inprogress',false)">▶ I gang</button>
        <button class="sp-opt sp-urg"   onclick="setTaskStatus('${pid}','kost','${t.id}','urgent',false)"   >🚨 Haster</button>
        <button class="sp-opt sp-soon"  onclick="setTaskStatus('${pid}','kost','${t.id}','upcoming',false)"  >⏰ Snart</button>
        <button class="sp-opt sp-over"  onclick="setTaskStatus('${pid}','kost','${t.id}','overdue',false)"   >✗ Ikke gjort</button>
        <button class="sp-opt sp-pend"  onclick="setTaskStatus('${pid}','kost','${t.id}','pending',false)"   >— Afventer</button>
      </div>
    </div>
  </div>`;
}

const MED_FREQ_PRESETS = [
  {label:'1×/dag',          count:1},
  {label:'2×/dag',          count:2},
  {label:'3×/dag',          count:3},
  {label:'4×/dag',          count:4},
  {label:'6×/dag',          count:6},
  {label:'8×/dag',          count:8},
  {label:'12×/dag',         count:12},
  {label:'Hver time (24×)', count:24},
  {label:'Hver ½t (48×)',   count:48},
  {label:'PN',              count:0},
];

function fmtDT(ts){
  if(!ts) return '';
  const d=new Date(ts);
  return d.toLocaleDateString('da-DK',{day:'2-digit',month:'2-digit'})+' '+
         d.toLocaleTimeString('da-DK',{hour:'2-digit',minute:'2-digit'});
}

function dtToInput(dtStr){
  if(!dtStr) return '';
  try {
    const m = dtStr.match(/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/);
    if(m){
      const year = new Date().getFullYear();
      return `${year}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}T${m[3]}:${m[4]}`;
    }
    const d=new Date(dtStr);
    if(!isNaN(d)) return d.toISOString().slice(0,16);
  } catch(e){}
  return '';
}

function inputToDT(val){
  if(!val) return '';
  const d=new Date(val);
  if(isNaN(d)) return val;
  return fmtDT(d.getTime());
}

function editableDT(dtStr, onSaveExpr, color='var(--muted)'){
  if(!dtStr) return `<span class="edt-empty" style="font-size:9px;color:var(--muted);cursor:pointer" onclick="${onSaveExpr.replace(/"/g,"'")}">✎ Sæt tid</span>`;
  return `<span class="edt-ts" style="font-size:9px;color:${color};font-family:'IBM Plex Mono',monospace;cursor:pointer;text-decoration:underline dotted;text-underline-offset:2px"
    title="Klik for at redigere tidspunkt"
    onclick="openDTEditor(this,'${dtStr.replace(/'/g,"\\'")}',function(v){${onSaveExpr}})">✎ ${dtStr}</span>`;
}

function renderMedicinSection(p){
  const sec = p.sections.medicin;
  if(!sec) return '';
  if(!sec.items) sec.items = [];
  const c = COLORS.green;
  const allSlots = sec.items.flatMap(m=>m.times||[]);
  const total = allSlots.length;
  const given = allSlots.filter(ts=>ts.status==='given').length;
  const sep   = sec.items.filter(m=>m.seponeret).length;
  const badgeTxt = sep>0
    ? `${given}/${total} · ${sep} sep.`
    : `${given}/${total} givet`;
  return `
  <div class="sec ${sec.open?'open':''}" id="sec-${p.id}-medicin">
    <div class="sec-header" onclick="toggleSec('${p.id}','medicin')"
      style="border-color:${sec.open?c.brd:'var(--border)'}">
      <span class="sec-icon">💊</span>
      <span class="sec-title">${sec.title}</span>
      <span class="sec-badge" style="background:${c.bg};color:${c.txt}">${badgeTxt}</span>
      <button class="add-prio-btn" style="margin-right:4px" title="Tilføj Medicin til prioritering" onclick="openAddPrioMenu(event,'${p.id}','Medicin')">⚡</button>
      <svg class="sec-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="sec-body">
      ${sec.items.map(med=>renderMed(p.id,med)).join('')}
      <div style="margin-top:8px">
        <button class="btn btn-primary btn-sm" style="width:100%" onclick="addMed('${p.id}')">+ Tilføj medicin</button>
      </div>
      ${sec.items.length>0 ? `<div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="mark-all-btn" onclick="markAllMedGiven('${p.id}')">✓ Alle givet nu</button>
        <button class="mark-all-btn" style="background:var(--rbg);color:var(--red);border-color:var(--rbrd)" onclick="resetSection('${p.id}','medicin')" title="Nulstil alle medicin-tider">↺ Nulstil alt</button>
      </div>` : ''}

      <!-- FVC Lungefunktionsmåling -->
      <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="font-size:12px;font-weight:700;color:var(--muted2)">🫁 FVC Lungefunktion</div>
            ${(sec.fvcTimes||[]).filter(t=>t.status==='done').length > 0
              ? `<span style="font-size:10px;background:var(--gbg);color:var(--green);border-radius:5px;padding:1px 6px">${(sec.fvcTimes||[]).filter(t=>t.status==='done').length}/${(sec.fvcTimes||[]).length} udført</span>`
              : ''}
          </div>
          <div style="display:flex;gap:5px;align-items:center">
            <!-- Frekvens presets -->
            <select class="ifield" style="font-size:11px;padding:3px 6px;height:28px" onchange="setFVCFreq('${p.id}',this.value);this.value=''">
              <option value="">+ Frekvens</option>
              <option value="1">1×/dag</option>
              <option value="2">2×/dag (hver 12. t)</option>
              <option value="3">3×/dag (hver 8. t)</option>
              <option value="4">4×/dag (hver 6. t)</option>
              <option value="6">6×/dag (hver 4. t)</option>
              <option value="8">8×/dag (hver 3. t)</option>
              <option value="12">12×/dag (hver 2. t)</option>
              <option value="24">24×/dag (hver time)</option>
              <option value="48">48×/dag (hver ½ time)</option>
            </select>
            <button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="addFVCManualTime('${p.id}')">+ Tid</button>
          </div>
        </div>
        <!-- Tidspunkter -->
        ${(sec.fvcTimes||[]).length > 0
          ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">
              ${(sec.fvcTimes||[]).map((ts,i)=>{
                const done = ts.status==='done';
                const notdone = ts.status==='notdone';
                const pickerId = `fvcp-${p.id}-${i}`;
                return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
                  <div class="tslot ${done?'given':notdone?'overdue':'pending'}"
                    onclick="toggleNudge('${pickerId}')"
                    style="flex-direction:column;padding:5px 7px;min-width:52px;align-items:center;${done?'background:rgba(16,185,129,.22);border-color:var(--green);':notdone?'background:rgba(239,68,68,.18);border-color:var(--red);':''}">
                    <span style="font-size:11px">${ts.time}</span>
                    <span style="font-size:9px;font-weight:700;color:${done?'var(--green)':notdone?'var(--red)':'var(--muted)'}">${done?'✓':notdone?'✗':'▾'}</span>
                  </div>
                  ${done&&ts.dt?`<span style="font-size:8px;color:var(--green);font-family:'IBM Plex Mono',monospace;cursor:pointer;text-decoration:underline dotted" onclick="editFVCTime('${p.id}',${i},this)">${ts.dt}</span>`:''}
                  <div id="${pickerId}" class="nudge-popup" style="display:none">
                    <div class="nudge-label">🫁 FVC kl. ${ts.time}</div>
                    <button class="sp-opt sp-done" style="font-size:11px;width:100%" onclick="setFVCSlotStatus('${p.id}',${i},'done')">✓ Udført</button>
                    <button class="sp-opt sp-over" style="font-size:11px;width:100%" onclick="setFVCSlotStatus('${p.id}',${i},'notdone')">✗ Ikke udført</button>
                    <button class="sp-opt sp-pend" style="font-size:11px;width:100%" onclick="setFVCSlotStatus('${p.id}',${i},'pending')">— Nulstil</button>
                    <div class="nudge-label" style="margin-top:4px">Ryk tidspunkt</div>
                    <div class="nudge-btns">
                      <button class="nudge-btn nudge-back" onclick="nudgeFVCTime('${p.id}',${i},-60)">−1t</button>
                      <button class="nudge-btn nudge-back" onclick="nudgeFVCTime('${p.id}',${i},-30)">−30</button>
                      <button class="nudge-btn nudge-fwd"  onclick="nudgeFVCTime('${p.id}',${i},30)">+30</button>
                      <button class="nudge-btn nudge-fwd"  onclick="nudgeFVCTime('${p.id}',${i},60)">+1t</button>
                    </div>
                    <button class="nudge-del" onclick="removeFVCTime('${p.id}',${i})">🗑 Fjern</button>
                    <button class="add-prio-btn" style="margin-top:4px;width:100%;justify-content:center" onclick="openAddPrioMenu(event,'${p.id}','FVC måling kl. ${ts.time}')">⚡ Prioritér</button>
                  </div>
                </div>`;
              }).join('')}
            </div>`
          : `<div style="font-size:11px;color:var(--muted);padding:2px 0 8px">Vælg frekvens eller tilføj tider manuelt</div>`}
        <!-- Seneste måleværdier -->
        ${(sec.fvc||[]).length > 0
          ? `<div style="display:flex;flex-direction:column;gap:5px">
              <div style="font-size:10px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.4px">Seneste målinger</div>
              ${(sec.fvc||[]).slice(-3).reverse().map((f,i,arr)=>`
              <div style="background:var(--s3);border:1px solid var(--border);border-radius:7px;padding:6px 10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span style="font-size:10px;color:var(--muted);font-family:'IBM Plex Mono',monospace;flex-shrink:0">${f.dt||''}</span>
                <div style="display:flex;gap:6px;flex-wrap:wrap;flex:1">
                  ${f.fvc?`<span style="font-size:11px;font-weight:600">FVC:<span style="color:var(--blue)"> ${f.fvc}L</span></span>`:''}
                  ${f.fev1?`<span style="font-size:11px;font-weight:600">FEV1:<span style="color:var(--green)"> ${f.fev1}L</span></span>`:''}
                  ${f.ratio?`<span style="font-size:11px;font-weight:600">FEV1%:<span style="color:${f.ratio<70?'var(--red)':'var(--green)'}"> ${f.ratio}%</span></span>`:''}
                  ${f.pef?`<span style="font-size:11px;font-weight:600">PEF:<span style="color:var(--muted2)"> ${f.pef}</span></span>`:''}
                </div>
                <button class="tremove" onclick="removeFVC('${p.id}',${(sec.fvc||[]).length-1-(arr.length-1-i)})">✕</button>
              </div>`).join('')}
            </div>`
          : ''}
        <div style="margin-top:6px">
          <button class="btn btn-ghost btn-sm" style="font-size:11px;width:100%" onclick="addFVC('${p.id}')">📋 Registrér måleresultat (FVC/FEV1)</button>
        </div>
      </div>
    </div>
  </div>`;
}

function renderMed(pid, med){
  const sepStyle = med.seponeret ? 'opacity:.5;' : '';
  const sepBorder = med.seponeret ? 'border-color:var(--red);' : '';
  const p = patients.find(x=>x.id===pid);
  const idx = p ? p.sections.medicin.items.indexOf(med) : 0;
  const displayName = med.fromEPJ && med.name ? med.name : `Medicin ${idx+1}`;
  const freqLabel = med.freqLabel || '';
  return `
  <div style="background:var(--s3);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:8px;${sepStyle}${sepBorder}">
    <!-- Header row -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:14px;font-weight:700;${med.seponeret?'text-decoration:line-through;color:var(--muted)':''}">${displayName}</span>
          ${freqLabel?`<span style="font-size:11px;background:var(--bbg);color:var(--blue);border:1px solid var(--bbrd);border-radius:5px;padding:2px 7px;font-weight:600">${freqLabel}</span>`:''}
          ${med.fromEPJ?`<span style="font-size:10px;background:var(--tbg);color:var(--teal);border:1px solid var(--tbrd);border-radius:4px;padding:1px 6px">EPJ</span>`:''}
        </div>
        ${med.note?`<div style="font-size:11px;color:var(--muted);margin-top:3px">📝 ${med.note}</div>`:''}
        ${med.seponeret?`<div style="font-size:10px;color:var(--red);margin-top:2px;font-weight:600">⛔ SEPONERET <span class="edt-ts" style="font-size:9px;color:var(--red);font-family:'IBM Plex Mono',monospace;cursor:pointer;text-decoration:underline dotted" data-dt="${med.seponeretatDT||''}" data-fn="setMedSeponDT(${JSON.stringify(pid)},${JSON.stringify(med.id)},v)" onclick="openDTE(this)">${med.seponeretatDT?'✎ '+med.seponeretatDT:'✎ Sæt tid'}</span></div>`:''}
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end">
        ${!med.seponeret?`<button class="btn btn-ghost btn-sm" onclick="openMedFreqPicker('${pid}','${med.id}')" style="font-size:11px">⏱ Frekvens</button>`:''}
        ${!med.seponeret?`<button class="btn btn-ghost btn-sm" onclick="addMedTimeManual('${pid}','${med.id}')" style="font-size:11px">+ Tid</button>`:''}
        <button class="btn btn-ghost btn-sm" onclick="toggleMedNote('${pid}','${med.id}')" style="font-size:11px">📝</button>
        ${!med.seponeret
          ? `<button class="btn btn-sm" style="background:var(--rbg);color:var(--red);border:1px solid var(--rbrd);font-size:11px" onclick="seponerMed('${pid}','${med.id}')">Seponér</button>`
          : `<button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="genaktiverMed('${pid}','${med.id}')">Genaktivér</button>`
        }
        <button class="tremove" onclick="removeMed('${pid}','${med.id}')">✕</button>
        <button class="add-prio-btn" title="Tilføj til prioritering" onclick="openAddPrioMenu(event,'${pid}','Medicin: '+${JSON.stringify(displayName)})">⚡</button>
      </div>
    </div>

    <!-- Frekvens-vælger (inline, skjult) -->
    <div id="mfp-${pid}-${med.id}" style="display:none;background:var(--s2);border-radius:8px;padding:8px 10px;margin-bottom:8px">
      <div class="sec-lbl" style="margin-bottom:6px">Vælg frekvens</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap">
        ${MED_FREQ_PRESETS.map((pr,i)=>`
          <button class="kost-btn ${med.freqLabel===pr.label?'active':''}"
            onclick="applyMedFreqByIndex('${pid}','${med.id}',${i})">${pr.label}</button>
        `).join('')}
      </div>
    </div>

    <!-- Note-felt (inline, skjult) -->
    <div id="mnote-${pid}-${med.id}" style="display:none;margin-bottom:8px">
      <input class="ifield" placeholder="Notat (f.eks. ordineret af, indikation...)" style="width:100%"
        value="${(med.note||'').replace(/"/g,'&quot;')}"
        oninput="setMedNote('${pid}','${med.id}',this.value)"/>
    </div>

    <!-- Tidspunkter -->
    ${med.times.length===0 && !med.seponeret
      ? renderMedSuggest(pid,med)
      : med.times.length===0 ? ''
      : `<div style="display:flex;flex-wrap:wrap;gap:5px;align-items:flex-start">
          ${med.times.map((ts,i)=>renderMedSlot(pid,med,ts,i)).join('')}
        </div>`
    }

    <!-- Log -->
    ${med.log && med.log.length>0 ? `
    <div style="margin-top:8px;border-top:1px solid var(--border);padding-top:6px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:4px">Hændelseslog</div>
      <div style="display:flex;flex-direction:column;gap:2px;max-height:80px;overflow-y:auto">
        ${med.log.slice().reverse().map(l=>`
          <div style="font-size:11px;font-family:'IBM Plex Mono',monospace;color:${logColor(l.type)}">
            [${l.dt}] ${logLabel(l)}
          </div>`).join('')}
      </div>
    </div>` : ''}
  </div>`;
}

function logColor(type){
  if(type==='given') return 'var(--green)';
  if(type==='notgiven') return 'var(--red)';
  if(type==='delayed') return 'var(--yellow)';
  if(type==='sep') return 'var(--red)';
  if(type==='note') return 'var(--muted2)';
  return 'var(--muted)';
}
function logLabel(l){
  if(l.type==='given')    return `✓ Givet (${l.time})`;
  if(l.type==='notgiven') return `✗ Ikke givet (${l.time})`;
  if(l.type==='delayed')  return `⏰ Udsat → ${l.newTime} (fra ${l.time})`;
  if(l.type==='sep')      return `⛔ Seponeret`;
  if(l.type==='note')     return `📝 ${l.text}`;
  return l.type;
}

function renderMedSlot(pid, med, ts, idx){
  const pickerId = `msp-${pid}-${med.id}-${idx}`;
  let slotCls = 'pending';
  let icon = '';
  let labelExtra = '';

  if(ts.status==='given'){
    slotCls='given'; icon='✓';
    labelExtra = `<div style="font-size:9px;margin-top:2px"><span class="edt-ts" style="font-size:9px;color:var(--green);font-family:'IBM Plex Mono',monospace;cursor:pointer;text-decoration:underline dotted" data-dt="${ts.givenDT||''}" data-fn="setMedSlotDT(${JSON.stringify(pid)},${JSON.stringify(med.id)},${idx},'givenDT',v)" onclick="openDTE(this)">${ts.givenDT?'✎ '+ts.givenDT:'✎ Sæt tid'}</span></div>`;
  } else if(ts.status==='notgiven'){
    slotCls='overdue'; icon='✗';
    labelExtra = `<div style="font-size:9px;margin-top:2px"><span class="edt-ts" style="font-size:9px;color:var(--red);font-family:'IBM Plex Mono',monospace;cursor:pointer;text-decoration:underline dotted" data-dt="${ts.notgivenDT||''}" data-fn="setMedSlotDT(${JSON.stringify(pid)},${JSON.stringify(med.id)},${idx},'notgivenDT',v)" onclick="openDTE(this)">${ts.notgivenDT?'✎ '+ts.notgivenDT:'✎ Sæt tid'}</span></div>`;
  } else if(ts.status==='delayed'){
    slotCls='upcoming'; icon='⏰';
    labelExtra = `<div style="font-size:9px;color:var(--yellow);margin-top:2px">→ ${ts.time}</div>`;
  } else {
    slotCls = slotStatus(ts.time);
  }

  return `
  <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
    <div class="tslot ${slotCls}" onclick="toggleMedPicker('${pickerId}')"
      style="flex-direction:column;align-items:center;gap:1px;padding:5px 8px;min-width:52px">
      <span class="ts-time" style="font-size:12px">${ts.time}</span>
      ${icon?`<span style="font-size:10px">${icon}</span>`:'<span style="font-size:9px;color:var(--muted)">▾</span>'}
    </div>
    ${labelExtra}
    <div id="${pickerId}" class="med-slot-picker" style="display:none">
      <div class="nudge-label">Administration</div>
      <button class="sp-opt sp-done"  style="font-size:11px" onclick="setMedSlotStatus('${pid}','${med.id}',${idx},'given')">✓ Givet nu</button>
      <button class="sp-opt sp-over"  style="font-size:11px" onclick="setMedSlotStatus('${pid}','${med.id}',${idx},'notgiven')">✗ Ikke givet</button>
      <div class="nudge-label" style="margin-top:4px">Ryk/Udsæt</div>
      <div class="nudge-btns">
        <button class="nudge-btn nudge-back" onclick="nudgeMedSlot('${pid}','${med.id}',${idx},-60)">−1t</button>
        <button class="nudge-btn nudge-back" onclick="nudgeMedSlot('${pid}','${med.id}',${idx},-30)">−30</button>
        <button class="nudge-btn nudge-back" onclick="nudgeMedSlot('${pid}','${med.id}',${idx},-15)">−15</button>
        <button class="nudge-btn nudge-now"  onclick="nudgeMedSlotToNow('${pid}','${med.id}',${idx})">Nu</button>
        <button class="nudge-btn nudge-fwd"  onclick="nudgeMedSlot('${pid}','${med.id}',${idx},15)">+15</button>
        <button class="nudge-btn nudge-fwd"  onclick="nudgeMedSlot('${pid}','${med.id}',${idx},30)">+30</button>
        <button class="nudge-btn nudge-fwd"  onclick="nudgeMedSlot('${pid}','${med.id}',${idx},60)">+1t</button>
      </div>
      <button class="nudge-del" onclick="removeMedSlot('${pid}','${med.id}',${idx})" style="margin-top:4px">🗑 Fjern tidspunkt</button>
    </div>
  </div>`;
}
