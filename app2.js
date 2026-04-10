
function renderMedSuggest(pid, med){
  return `
  <div style="margin-top:4px">
    <div class="tsug-title">Hurtigvalg frekvens:</div>
    <div class="tsug-chips">
      ${MED_FREQ_PRESETS.filter(p=>p.count>0).map((pr,i)=>`
        <div class="tsug-chip" onclick="applyMedFreqByIndex('${pid}','${med.id}',${i})">${pr.label}</div>
      `).join('')}
      <div class="tsug-chip" onclick="addMedTimeManual('${pid}','${med.id}')">+ Manuel tid</div>
    </div>
  </div>`;
}

function renderSSSSection(p){
  const sec = p.sections.sss;
  if(!sec) return '';
  if(!sec.times) sec.times = [];
  if(!sec.observations) sec.observations = [];
  const c = COLORS.orange;
  const total = Object.values(sec.scores).reduce((a,b)=>a+Number(b),0);
  const doneObs = (sec.observations||[]).filter(o=>o.done).length;
  return `
  <div class="sec ${sec.open?'open':''}" id="sec-${p.id}-sss">
    <div class="sec-header" onclick="toggleSec('${p.id}','sss')"
      style="border-color:${sec.open?c.brd:'var(--border)'}">
      <span class="sec-icon">🧠</span>
      <span class="sec-title">${sec.title}</span>
      <div style="display:flex;gap:5px">
        <span class="sec-badge" style="background:${c.bg};color:${c.txt}">SSS: ${total}</span>
        <span class="sec-badge" style="background:var(--s2);color:var(--muted)">${doneObs} målt</span>
      </div>
      <button class="add-prio-btn" style="margin-right:4px" title="Tilføj SSS til prioritering" onclick="openAddPrioMenu(event,'${p.id}','SSS')">⚡</button>
      <svg class="sec-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="sec-body">
      <div class="sec-lbl">Antal målinger pr. dag</div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap">
        ${[1,2,3,4,6,8,12].map(n=>`<button class="kost-btn ${sec.freq===n?'active':''}"
          onclick="setSSSFreq('${p.id}',${n})">${n}x/dag</button>`).join('')}
      </div>
      <div class="sec-lbl">Tidspunkter for SSS-score</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;align-items:flex-start">
        ${(sec.times||[]).map((t,i)=>{
          const obs=(sec.observations||[]).find(o=>o.time===t);
          const done=obs&&obs.done;
          const pickerId=`sssp-${p.id}-${i}`;
          return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
            <div class="tslot ${done?'given':slotStatus(t)}"
              onclick="toggleSSSPicker('${p.id}','${t}','${pickerId}')"
              style="flex-direction:column;padding:5px 7px;min-width:50px;align-items:center">
              <span class="ts-time" style="font-size:11px">${t}</span>
              ${done?`<span style="font-size:9px;color:var(--green)">✓</span>`:`<span style="font-size:9px;color:var(--muted)">▾</span>`}
            </div>
            ${done?`<div style="font-size:8px;text-align:center"><span class="edt-ts" style="font-size:9px;color:var(--green);font-family:'IBM Plex Mono',monospace;cursor:pointer;text-decoration:underline dotted" data-dt="${obs&&obs.dt||''}" data-fn="setSSSObsDT('${p.id}','${t}',v)" onclick="openDTE(this)">${obs&&obs.dt?'✎ '+obs.dt:'✎ Sæt tid'}</span></div>`:''}
            <div id="${pickerId}" class="nudge-popup" style="display:none">
              <div class="nudge-label">SSS måling</div>
              <button class="sp-opt sp-done" style="font-size:11px;width:100%" onclick="setSSSObsStatus('${p.id}','${t}','done')">✓ Udført</button>
              <button class="sp-opt sp-over" style="font-size:11px;width:100%" onclick="setSSSObsStatus('${p.id}','${t}','notdone')">✗ Ikke udført</button>
              <button class="sp-opt sp-pend" style="font-size:11px;width:100%" onclick="setSSSObsStatus('${p.id}','${t}','pending')">— Nulstil</button>
              <div class="nudge-label" style="margin-top:4px">Ryk tid</div>
              <div class="nudge-btns">
                <button class="nudge-btn nudge-back" onclick="nudgeSSSTime('${p.id}',${i},-60)">−1t</button>
                <button class="nudge-btn nudge-back" onclick="nudgeSSSTime('${p.id}',${i},-30)">−30</button>
                <button class="nudge-btn nudge-fwd"  onclick="nudgeSSSTime('${p.id}',${i},30)">+30</button>
                <button class="nudge-btn nudge-fwd"  onclick="nudgeSSSTime('${p.id}',${i},60)">+1t</button>
              </div>
              <button class="nudge-del" onclick="removeSSSTime('${p.id}',${i})">🗑 Fjern</button>
              <button class="add-prio-btn" style="margin-top:4px;width:100%;justify-content:center" onclick="openAddPrioMenu(event,'${p.id}','SSS måling kl. ${t}')">⚡ Prioritér</button>
            </div>
          </div>`;
        }).join('')}
        <!-- Add time -->
        <div style="display:flex;flex-direction:column;align-items:center">
          <button class="tslot" style="border-style:dashed;padding:5px 7px;min-width:50px;flex-direction:column;align-items:center"
            onclick="addSSSManualTime('${p.id}')">
            <span style="font-size:14px;color:var(--muted)">+</span>
            <span style="font-size:9px;color:var(--muted)">Tid</span>
          </button>
        </div>
      </div>
      <div class="sss-grid">
        ${SSS_ITEMS.map(item=>{
          return `<div class="sss-item">
            <div class="sss-lbl">${item.label}</div>
            <select class="sss-sel" onchange="setSSSScore('${p.id}','${item.id}',this.value)">
              ${item.opts.map(o=>`<option value="${parseInt(o)}" ${parseInt(o)===sec.scores[item.id]?'selected':''}>${o}</option>`).join('')}
            </select>
          </div>`;
        }).join('')}
        <div class="sss-total-box">
          <span class="sss-total-lbl">SSS Total score</span>
          <span class="sss-total-val">${total} / 58</span>
        </div>
      </div>
      <div style="margin-top:8px;font-size:11px;color:var(--muted)">
        ${total>=45?'🟢 Let stroke':total>=30?'🟡 Moderat stroke':'🔴 Svær stroke'}
      </div>
      ${renderSSSHistory(p)}
    </div>
  </div>`;
}

function renderSSSHistory(p){
  const h = p.sections.sss.history;
  if(!h||h.length===0) return `<div style="margin-top:10px"><button class="btn btn-ghost btn-sm" onclick="saveSSSSnapshot('${p.id}')">📊 Gem nuværende score</button></div>`;
  return `
  <div style="margin-top:10px">
    <button class="btn btn-ghost btn-sm" onclick="saveSSSSnapshot('${p.id}')">📊 Gem nuværende score</button>
    <div class="sec-lbl" style="margin-top:8px">Historik</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${h.map(e=>`<div style="background:var(--s1);border:1px solid var(--border);border-radius:7px;padding:5px 10px;font-size:12px">
        <span style="color:var(--muted);font-family:'IBM Plex Mono',monospace">${e.time}</span>
        <span style="color:var(--orange);font-weight:600;margin-left:6px">${e.score}</span>
      </div>`).join('')}
    </div>
  </div>`;
}

const ICH_INTERVALS = [
  {label:'15 min', val:'15'},
  {label:'30 min', val:'30'},
  {label:'1 time',  val:'60'},
  {label:'2 timer', val:'120'},
  {label:'4 timer', val:'240'},
  {label:'6 timer', val:'360'},
  {label:'8 timer', val:'480'},
];

function genICHTimes(intervalMin){
  const times = [];
  const start = 6*60; // 06:00
  const end = 6*60 + 24*60; // 06:00 next day = 30:00 as minutes
  for(let m=start; m<end; m+=Number(intervalMin)){
    const h=String(Math.floor((m%1440)/60)).padStart(2,'0');
    const mm=String(m%60).padStart(2,'0');
    times.push(h+':'+mm);
  }
  return times;
}

const GCS_EYE = [
  {v:4, l:'4 — Spontant'},
  {v:3, l:'3 — På tiltale'},
  {v:2, l:'2 — På smerte'},
  {v:1, l:'1 — Ingen reaktion'},
];
const GCS_VERBAL = [
  {v:5, l:'5 — Orienteret'},
  {v:4, l:'4 — Forvirret'},
  {v:3, l:'3 — Upassende ord'},
  {v:2, l:'2 — Lyde'},
  {v:1, l:'1 — Ingen'},
];
const GCS_MOTOR = [
  {v:6, l:'6 — Efter ordre'},
  {v:5, l:'5 — Lokaliserer'},
  {v:4, l:'4 — Bøjer (normal)'},
  {v:3, l:'3 — Bøjer (abnorm)'},
  {v:2, l:'2 — Strækker'},
  {v:1, l:'1 — Ingen'},
];

function renderICHSection(p){
  const sec = p.sections.ich;
  if(!sec) return '';
  if(!sec.observations) sec.observations = [];
  const c = COLORS.teal;
  const eye    = Number(sec.gcsEye    ?? 4);
  const verbal = Number(sec.gcsVerbal ?? 5);
  const motor  = Number(sec.gcsMotor  ?? 6);
  const gcsTotal = eye + verbal + motor;
  const gcsSev = gcsTotal >= 13 ? '🟢 Let' : gcsTotal >= 9 ? '🟡 Moderat' : '🔴 Svær';

  const autoTimes = genICHTimes(sec.interval||'60');
  const manualTimes = (sec.manualTimes||[]);
  const allTimes = [...new Set([...autoTimes, ...manualTimes])].sort();

  const intLabel = ICH_INTERVALS.find(i=>i.val===(sec.interval||'60'))?.label||'1 time';
  const doneCount = (sec.observations||[]).filter(o=>o.done).length;

  return `
  <div class="sec ${sec.open?'open':''}" id="sec-${p.id}-ich">
    <div class="sec-header" onclick="toggleSec('${p.id}','ich')"
      style="border-color:${sec.open?c.brd:'var(--border)'}">
      <span class="sec-icon">🩻</span>
      <span class="sec-title">${sec.title}</span>
      <div style="display:flex;gap:6px;align-items:center">
        <span class="sec-badge" style="background:${c.bg};color:${c.txt}">GCS ${gcsTotal}</span>
        <span class="sec-badge" style="background:var(--s2);color:var(--muted)">${doneCount} målt</span>
      </div>
      <button class="add-prio-btn" style="margin-right:4px" title="Tilføj ICH Målinger til prioritering" onclick="openAddPrioMenu(event,'${p.id}','ICH Målinger')">⚡</button>
      <svg class="sec-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="sec-body">

      <!-- GCS CHECKLIST -->
      <div style="margin-bottom:12px">
        <div class="sec-lbl" style="margin-bottom:6px">GCS — Glasgow Coma Scale</div>
        <div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:10px">

          <!-- Eye -->
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--muted2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">
              👁 Øjenåbning (E) — valgt: <span style="color:var(--teal)">${eye}</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:4px">
              ${GCS_EYE.map(o=>`<button class="kost-btn ${eye===o.v?'active':''}"
                style="font-size:11px;padding:4px 9px" onclick="setGCS('${p.id}','eye',${o.v})">${o.l}</button>`).join('')}
            </div>
          </div>

          <!-- Verbal -->
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--muted2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">
              💬 Verbalt (V) — valgt: <span style="color:var(--teal)">${verbal}</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:4px">
              ${GCS_VERBAL.map(o=>`<button class="kost-btn ${verbal===o.v?'active':''}"
                style="font-size:11px;padding:4px 9px" onclick="setGCS('${p.id}','verbal',${o.v})">${o.l}</button>`).join('')}
            </div>
          </div>

          <!-- Motor -->
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--muted2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">
              ✋ Motorik (M) — valgt: <span style="color:var(--teal)">${motor}</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:4px">
              ${GCS_MOTOR.map(o=>`<button class="kost-btn ${motor===o.v?'active':''}"
                style="font-size:11px;padding:4px 9px" onclick="setGCS('${p.id}','motor',${o.v})">${o.l}</button>`).join('')}
            </div>
          </div>

          <!-- Total -->
          <div style="display:flex;align-items:center;justify-content:space-between;background:var(--tbg);border:1px solid var(--tbrd);border-radius:8px;padding:8px 12px">
            <span style="font-size:13px;font-weight:700;color:var(--teal)">GCS Total: E${eye}+V${verbal}+M${motor} = ${gcsTotal}/15</span>
            <span style="font-size:12px">${gcsSev}</span>
          </div>

          <!-- Save snapshot -->
          <button class="btn btn-ghost btn-sm" onclick="saveICHSnapshot('${p.id}')" style="align-self:flex-start">
            📊 Gem GCS-score med tidsstempel
          </button>
        </div>

        <!-- History -->
        ${sec.history&&sec.history.length?`
        <div style="margin-top:8px">
          <div class="sec-lbl">GCS Historik</div>
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px">
            ${sec.history.slice().reverse().slice(0,8).map(e=>`
            <div style="background:var(--s1);border:1px solid var(--border);border-radius:7px;padding:4px 9px;font-size:11px">
              <span style="color:var(--muted);font-family:'IBM Plex Mono',monospace">${e.time}</span>
              <span style="color:var(--teal);font-weight:700;margin-left:5px">${e.score}</span>
            </div>`).join('')}
          </div>
        </div>`:''}
      </div>

      <!-- BP/PULS MÅLINGER -->
      <div class="divider"></div>
      <div class="sec-lbl" style="margin-bottom:6px">Blodtryk &amp; Puls — Måleinterval</div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;flex-wrap:wrap">
        ${ICH_INTERVALS.map(iv=>`<button class="kost-btn ${(sec.interval||'60')===iv.val?'active':''}"
          onclick="setICHInterval('${p.id}','${iv.val}')">${iv.label}</button>`).join('')}
      </div>

      <div class="sec-lbl">Tidspunkter (${intLabel}, 06:00–22:00) — ${doneCount}/${allTimes.length} målt</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;align-items:flex-start">
        ${allTimes.map((t,i)=>{
          const obs=(sec.observations||[]).find(o=>o.time===t);
          const done=obs&&obs.done;
          const st=done?'given':(slotStatus(t));
          const isManual = manualTimes.includes(t);
          const nudgeId=`ich-nudge-${p.id}-${i}`;
          return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
            <div class="tslot ${st}" style="flex-direction:column;padding:5px 7px;min-width:50px;position:relative"
              onclick="toggleICHObsWithDT('${p.id}','${t}')">
              <span class="ts-time" style="font-size:11px">${t}</span>
              ${done
                ? `<span style="font-size:9px;color:var(--green)">✓</span>`
                : `<span style="font-size:9px;color:var(--muted)">▾</span>`}
              ${isManual?`<span style="font-size:8px;color:var(--purple);position:absolute;top:2px;right:3px">+</span>`:''}
            </div>
            ${done?`<div style="font-size:8px;text-align:center"><span class="edt-ts" style="font-size:9px;color:var(--green);font-family:'IBM Plex Mono',monospace;cursor:pointer;text-decoration:underline dotted" data-dt="${obs&&obs.dt||''}" data-fn="setICHObsDT('${p.id}','${t}',v)" onclick="openDTE(this)">${obs&&obs.dt?'✎ '+obs.dt:'✎ Sæt tid'}</span></div>`:''}
            ${isManual?`<button style="font-size:9px;background:none;border:none;color:var(--muted);cursor:pointer;font-family:inherit"
              onclick="removeICHManualTime('${p.id}','${t}')">🗑</button>`:''}
            <button class="add-prio-btn" style="font-size:9px;padding:1px 4px" title="Prioritér" onclick="openAddPrioMenu(event,'${p.id}','ICH/BP måling kl. ${t}')">⚡</button>
          </div>`;
        }).join('')}
        <!-- Add time button -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
          <button class="tslot" style="border-style:dashed;padding:5px 7px;min-width:50px;flex-direction:column"
            onclick="addICHManualTime('${p.id}')">
            <span style="font-size:14px;color:var(--muted)">+</span>
            <span style="font-size:9px;color:var(--muted)">Tid</span>
          </button>
        </div>
      </div>
      <div style="font-size:11px;color:var(--muted)">Klik tidspunkt → markér måling udført med dato/tid · <span style="color:var(--purple)">+</span> = manuelt tilføjet</div>
    </div>
  </div>`;
}

function renderTrombSection(p){
  const sec = p.sections.tromb;
  if(!sec) return '';
  if(!sec.observations) sec.observations = [];
  const c = COLORS.purple;
  return `
  <div class="sec ${sec.open?'open':''}" id="sec-${p.id}-tromb">
    <div class="sec-header" onclick="toggleSec('${p.id}','tromb')"
      style="border-color:${sec.open?c.brd:'var(--border)'}">
      <span class="sec-icon">🩺</span>
      <span class="sec-title">${sec.title}</span>
      <span class="sec-badge" style="background:${sec.given?c.bg:'var(--s2)'};color:${sec.given?c.txt:'var(--muted)'}">${sec.given?'✓ Givet':'Ikke givet'}</span>
      <button class="add-prio-btn" style="margin-right:4px" title="Tilføj Trombolyse/EVT til prioritering" onclick="openAddPrioMenu(event,'${p.id}','Trombolyse/EVT')">⚡</button>
      <svg class="sec-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="sec-body">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
          <input type="checkbox" ${sec.given?'checked':''} onchange="setTromb('${p.id}','given',this.checked)" style="cursor:pointer"/>
          Trombolyse givet
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
          <input type="checkbox" ${sec.evt?'checked':''} onchange="setTromb('${p.id}','evt',this.checked)" style="cursor:pointer"/>
          EVT (trombektomi)
        </label>
      </div>
      ${sec.given||sec.evt ? `
      <div class="tromb-row">
        <div class="tromb-field">
          <div class="flabel">Tidspunkt givet</div>
          <input class="tromb-input" type="time" value="${sec.time||''}"
            oninput="setTromb('${p.id}','time',this.value)"/>
        </div>
        <div class="tromb-field">
          <div class="flabel">Alteplase mg (0,9mg/kg)</div>
          <input class="tromb-input" placeholder="F.eks. 72 mg" value="${sec.alteplase||''}"
            oninput="setTromb('${p.id}','alteplase',this.value)"/>
        </div>
        <div class="tromb-field" style="flex:1">
          <div class="flabel">Observationsnotat</div>
          <input class="tromb-input" placeholder="Notat..." value="${sec.notes||''}" style="width:100%"
            oninput="setTromb('${p.id}','notes',this.value)"/>
        </div>
      </div>
      <div class="sec-lbl" style="margin-top:10px">Observationsplan post-trombolyse</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;align-items:flex-start">
        ${['0:00','0:15','0:30','1:00','1:30','2:00','4:00','6:00','12:00','24:00'].map(t=>{
          const obs = (sec.observations||[]).find(o=>o.time===t);
          const done = obs&&obs.done;
          const pickerId = `trombp-${p.id}-${t.replace(':','-')}`;
          return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
            <div class="tslot ${done?'given':'pending'}" onclick="toggleNudge('${pickerId}')"
              style="flex-direction:column;padding:5px 7px;min-width:44px;align-items:center;${done?'background:rgba(16,185,129,.22);border-color:var(--green);':''}">
              <span class="ts-time" style="font-size:11px">+${t}t</span>
              <span style="font-size:9px;color:${done?'var(--green)':'var(--muted)'}">${done?'✓':'▾'}</span>
            </div>
            <div id="${pickerId}" class="nudge-popup" style="display:none">
              <div class="nudge-label">+${t}t observation</div>
              <button class="sp-opt sp-done" style="font-size:11px;width:100%" onclick="setTrombObsStatus('${p.id}','${t}',true)">✓ Udført</button>
              <button class="sp-opt sp-over" style="font-size:11px;width:100%" onclick="setTrombObsStatus('${p.id}','${t}',false)">— Nulstil</button>
              <button class="add-prio-btn" style="margin-top:4px;width:100%;justify-content:center" onclick="openAddPrioMenu(event,'${p.id}','Trombolyse obs +${t}t')">⚡ Prioritér</button>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:6px">
        Klik tidspunkt for at markere observation
      </div>
      ` : '<div style="font-size:13px;color:var(--muted);padding:8px 0">Marker trombolyse som givet for at se observationsplan.</div>'}
    </div>
  </div>`;
}

function renderEkstraSection(p){
  const sec = p.sections.ekstra;
  if(!sec || !sec.tasks) return '';
  const c = COLORS.blue;
  return `
  <div class="sec ${sec.open?'open':''}" id="sec-${p.id}-ekstra">
    <div class="sec-header" onclick="toggleSec('${p.id}','ekstra')"
      style="border-color:${sec.open?c.brd:'var(--border)'}">
      <span class="sec-icon">📋</span>
      <span class="sec-title">${sec.title}</span>
      <span class="sec-badge" style="background:${c.bg};color:${c.txt}">${sec.tasks.filter(t=>t.done).length}/${sec.tasks.length}</span>
      <button class="add-prio-btn" style="margin-right:4px" title="Tilføj Øvrige opgaver til prioritering" onclick="openAddPrioMenu(event,'${p.id}','Øvrige opgaver')">⚡</button>
      <svg class="sec-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="sec-body">
      ${sec.tasks.map(t=>renderTask(p.id,'ekstra',t)).join('')}
      <div class="add-row">
        <input class="ifield" id="at-${p.id}-ekstra" placeholder="F.eks. EKG, blodprøver, CT..." 
          onkeydown="if(event.key==='Enter')addTask('${p.id}','ekstra')"/>
        <select class="ifield" id="ats-${p.id}-ekstra" style="flex:0 0 auto;width:120px">
          <option value="pending">Afventer</option>
          <option value="upcoming">Snart</option>
          <option value="overdue">Ikke gjort</option>
        </select>
        <select style="flex:0 0 auto;width:80px;font-size:11px;padding:4px 6px;border-radius:7px;border:1px solid var(--border2);background:var(--s3);color:var(--muted2);font-family:inherit" id="atf-${p.id}-ekstra" title="Frekvens per dag">
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
        <button class="btn btn-primary btn-sm" onclick="addTask('${p.id}','ekstra')">+ Tilføj</button>
      </div>
      ${markAllBtn(p.id,'ekstra')}
    </div>
  </div>`;
}

function renderBleskiftSection(p){
  const sec = p.sections.bleskift;
  if(!sec) return '';
  const c = COLORS.yellow;
  const entries = sec.entries||[];
  const done = entries.filter(e=>e.done).length;
  return `
  <div class="sec ${sec.open?'open':''}" id="sec-${p.id}-bleskift">
    <div class="sec-header" onclick="toggleSec('${p.id}','bleskift')"
      style="border-color:${sec.open?c.brd:'var(--border)'}">
      <span class="sec-icon">🔄</span>
      <span class="sec-title">${sec.title}</span>
      <span class="sec-badge" style="background:${c.bg};color:${c.txt}">${done}/${entries.length} udført</span>
      <button class="add-prio-btn" style="margin-right:4px" title="Tilføj Bleskift til prioritering" onclick="openAddPrioMenu(event,'${p.id}','Bleskift')">⚡</button>
      <svg class="sec-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="sec-body">
      ${entries.map((e,i)=>`
      <div class="task-row" style="flex-wrap:wrap">
        <div class="tcheck ${e.done?'done':''}" onclick="toggleBleskift('${p.id}',${i})"></div>
        <div class="tlabel ${e.done?'done':''}">
          ${e.type==='ble'?'🔄 Bleskift':'🧻 Afvask/tørre'}
          ${e.time?`<span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--muted);margin-left:6px">${e.time}</span>`:''}
        </div>
        <span class="edt-ts" style="font-size:9px;color:var(--green);font-family:'IBM Plex Mono',monospace;cursor:pointer;text-decoration:underline dotted" data-dt="${e.doneAt||''}" data-fn="setBleskiftDT('${p.id}',${i},v)" onclick="openDTE(this)">${e.doneAt?'✎ '+e.doneAt:'✎ Sæt tid'}</span>
        ${e.note?`<span style="font-size:11px;color:var(--muted)">📝 ${e.note}</span>`:''}
        <button class="tremove" onclick="removeBleskift('${p.id}',${i})">✕</button>
        <button class="add-prio-btn" title="Tilføj til prioritering" onclick="openAddPrioMenu(event,'${p.id}','Bleskift '+${JSON.stringify(e.time||'')})">⚡</button>
      </div>`).join('')}
      <div class="add-row" style="margin-top:8px;flex-wrap:wrap">
        <select class="ifield" id="btype-${p.id}" style="flex:0 0 auto;width:140px">
          <option value="ble">Bleskift</option>
          <option value="torre">Afvask/tørre</option>
        </select>
        <input class="ifield" id="btime-${p.id}" type="time" value="${nowHHMM()}" style="flex:0 0 auto;width:100px"/>
        <input class="ifield" id="bnote-${p.id}" placeholder="Notat (valgfri)" style="flex:1"/>
        <button class="btn btn-primary btn-sm" onclick="addBleskift('${p.id}')">+ Tilføj</button>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="mark-all-btn" onclick="markAllBleskift('${p.id}')">✓ Alle bleskift udført</button>
        <button class="mark-all-btn" style="background:var(--rbg);color:var(--red);border-color:var(--rbrd)" onclick="resetSection('${p.id}','bleskift')" title="Nulstil bleskift">↺ Nulstil alt</button>
      </div>
    </div>
  </div>`;
}

const TD_INTERVALS = [
  {label:'30 min',val:'30'},
  {label:'1 time',val:'60'},
  {label:'2 timer',val:'120'},
  {label:'4 timer',val:'240'},
];

function renderTDSection(p){
  const sec = p.sections.td;
  if(!sec) return '';
  const c = COLORS.blue;
  const entries = sec.entries||[];
  const totalMl = entries.reduce((a,e)=>a+(Number(e.ml)||0),0);
  const interval = sec.interval||'60';
  const intLabel = TD_INTERVALS.find(iv=>iv.val===interval)?.label||'1 time';
  const times = genICHTimes(interval); // reuse ICH time generator
  return `
  <div class="sec ${sec.open?'open':''}" id="sec-${p.id}-td">
    <div class="sec-header" onclick="toggleSec('${p.id}','td')"
      style="border-color:${sec.open?c.brd:'var(--border)'}">
      <span class="sec-icon">🧪</span>
      <span class="sec-title">${sec.title}</span>
      <span class="sec-badge" style="background:${c.bg};color:${c.txt}">${totalMl} ml · ${intLabel}</span>
      <button class="add-prio-btn" style="margin-right:4px" title="Tilføj Time Diurese til prioritering" onclick="openAddPrioMenu(event,'${p.id}','Time Diurese')">⚡</button>
      <svg class="sec-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="sec-body">
      <div class="sec-lbl">Måleinterval</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
        ${TD_INTERVALS.map(iv=>`<button class="kost-btn ${interval===iv.val?'active':''}"
          onclick="setTDInterval('${p.id}','${iv.val}')">${iv.label}</button>`).join('')}
      </div>
      <div class="sec-lbl">Tidspunkter (06:00–22:00)</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">
        ${times.map(t=>{
          const entry = entries.find(e=>e.time===t);
          const done = entry?.done;
          const ml = entry?.ml||'';
          return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
            <div class="tslot ${done?'given':slotStatus(t)}" onclick="openTDEntry('${p.id}','${t}')"
              style="flex-direction:column;padding:5px 7px;min-width:52px">
              <span class="ts-time" style="font-size:11px">${t}</span>
              ${done?`<span style="font-size:10px;color:var(--green)">${ml} ml</span>`:'<span style="font-size:9px;color:var(--muted)">▾</span>'}
            </div>
          </div>`;
        }).join('')}
      </div>
      <!-- TD Entry Panel -->
      <div id="tdpanel-${p.id}" style="display:none;background:var(--s2);border:1px solid var(--border);border-radius:9px;padding:10px;margin-bottom:8px">
        <div class="sec-lbl" id="tdpanel-lbl-${p.id}">Registrer diurese</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px">
          <input class="ifield" type="number" id="tdml-${p.id}" placeholder="ml" style="width:80px"/>
          <select class="ifield" id="tdqual-${p.id}" style="flex:0 0 auto;width:130px">
            <option value="">Ingen bemærkning</option>
            <option value="klar">Klar</option>
            <option value="uklar">Uklar</option>
            <option value="blodig">Blodig</option>
            <option value="ingen">Ingen diurese</option>
          </select>
          <button class="btn btn-primary btn-sm" onclick="saveTDEntry('${p.id}')">Gem</button>
          <button class="btn btn-ghost btn-sm" onclick="closeTDPanel('${p.id}')">Annuller</button>
        </div>
      </div>
      <!-- TD log -->
      ${entries.length>0?`
      <div style="margin-top:6px">
        <div class="sec-lbl">Log — Total: <b>${totalMl} ml</b></div>
        <div style="display:flex;flex-direction:column;gap:3px;max-height:120px;overflow-y:auto">
          ${entries.slice().reverse().map(e=>`
          <div style="display:flex;align-items:center;gap:8px;font-size:11px;padding:3px 0;border-bottom:1px solid var(--border)">
            <span style="font-family:'IBM Plex Mono',monospace;color:var(--muted);flex-shrink:0">${e.time}</span>
            <span style="font-weight:600;color:var(--teal)">${e.ml} ml</span>
            ${e.qual?`<span style="color:var(--muted)">${e.qual}</span>`:''}
            <span class="edt-ts" style="font-size:9px;color:var(--muted);font-family:'IBM Plex Mono',monospace;cursor:pointer;text-decoration:underline dotted" data-dt="${e.recordedAt||''}" data-fn="setTDEntryDT('${p.id}','${e.time}',v)" onclick="openDTE(this)">${e.recordedAt?'✎ '+e.recordedAt:'✎ Sæt tid'}</span>
          </div>`).join('')}
        </div>
      </div>`:''}
    </div>
  </div>`;
}

function renderSIKSection(p){
  const sec = p.sections.sik;
  if(!sec) return '';
  const c = COLORS.teal;
  const entries = sec.entries||[];
  const active = entries.filter(e=>!e.removed);
  return `
  <div class="sec ${sec.open?'open':''}" id="sec-${p.id}-sik">
    <div class="sec-header" onclick="toggleSec('${p.id}','sik')"
      style="border-color:${sec.open?c.brd:'var(--border)'}">
      <span class="sec-icon">💉</span>
      <span class="sec-title">${sec.title}</span>
      <span class="sec-badge" style="background:${c.bg};color:${c.txt}">${active.length} aktiv${active.length!==1?'e':''}</span>
      <button class="add-prio-btn" style="margin-right:4px" title="Tilføj SIK til prioritering" onclick="openAddPrioMenu(event,'${p.id}','SIK')">⚡</button>
      <svg class="sec-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="sec-body">
      ${entries.map((e,i)=>`
      <div style="background:var(--s3);border:1px solid var(--border);border-radius:9px;padding:10px 12px;margin-bottom:6px;${e.removed?'opacity:.45':''}">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
          <div>
            <div style="font-size:13px;font-weight:600;${e.removed?'text-decoration:line-through;color:var(--muted)':''}">
              💉 ${e.site||'Lokalisation ikke angivet'}
            </div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">
              Indsat: <span class="edt-ts" style="font-size:9px;color:var(--muted);font-family:'IBM Plex Mono',monospace;cursor:pointer;text-decoration:underline dotted" data-dt="${e.insertedAt||''}" data-fn="setSIKDT('${p.id}',${i},'insertedAt',v)" onclick="openDTE(this)">${e.insertedAt?'✎ '+e.insertedAt:'✎ Sæt tid'}</span>
              ${e.changedAt?` · Skiftet: <span class="edt-ts" style="font-size:9px;color:var(--muted);font-family:'IBM Plex Mono',monospace;cursor:pointer;text-decoration:underline dotted" data-dt="${e.changedAt||''}" data-fn="setSIKDT('${p.id}',${i},'changedAt',v)" onclick="openDTE(this)">${e.changedAt?'✎ '+e.changedAt:'✎ Sæt tid'}</span>`:''}
              ${e.note?` · 📝 ${e.note}`:''}
            </div>
          </div>
          <div style="display:flex;gap:5px">
            ${!e.removed?`
              <button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="changeSIK('${p.id}',${i})">🔄 Skift</button>
              <button class="btn btn-sm" style="background:var(--rbg);color:var(--red);border:1px solid var(--rbrd);font-size:11px" onclick="removeSIK('${p.id}',${i})">Fjernet</button>
              <button class="add-prio-btn" title="Tilføj til prioritering" onclick="openAddPrioMenu(event,'${p.id}','SIK: '+${JSON.stringify(e.site||'Ukendt')})">⚡</button>
            `:`<span style="font-size:11px;color:var(--muted)">Fjernet ${e.removedAt||''}</span>`}
          </div>
        </div>
        ${!e.removed?`
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${['06:00','08:00','12:00','16:00','20:00'].map(t=>{
            const obs=(e.observations||[]).find(o=>o.time===t);
            return `<div class="tslot ${obs?.done?'given':slotStatus(t)}" onclick="toggleSIKObs('${p.id}',${i},'${t}')"
              style="flex-direction:column;padding:4px 7px;min-width:46px">
              <span class="ts-time" style="font-size:10px">${t}</span>
              ${obs?.done?`<span style="font-size:9px;color:var(--green)">✓</span>`:'<span style="font-size:8px;color:var(--muted)">▾</span>'}
            </div>`;
          }).join('')}
          <div style="font-size:9px;color:var(--muted);align-self:center">Inspektion</div>
        </div>`:''}
      </div>`).join('')}
      <div class="add-row" style="flex-wrap:wrap">
        <input class="ifield" id="siksite-${p.id}" placeholder="Lokalisation (f.eks. v.underarm)" style="flex:2"/>
        <input class="ifield" id="siknote-${p.id}" placeholder="Notat" style="flex:1"/>
        <button class="btn btn-primary btn-sm" onclick="addSIK('${p.id}')">+ Anlæg SIK</button>
      </div>
    </div>
  </div>`;
}
function renderPlejeplanSection(p){
  const sec = p.sections.plejeplan;
  if(!sec) return '';
  const c = COLORS.purple;
  const active = sec.tasks.filter(t=>t.enabled!==false);
  const urgent = active.filter(t=>t.status==='urgent'&&!t.done).length;
  const inprog = active.filter(t=>t.status==='inprogress'&&!t.done).length;
  const badge = urgent>0
    ? `<span class="sec-badge" style="background:var(--rbg);color:var(--red)">🚨 ${urgent} haster</span>`
    : inprog>0
    ? `<span class="sec-badge" style="background:var(--ybg);color:var(--yellow)">▶ ${inprog} i gang</span>`
    : `<span class="sec-badge" style="background:${c.bg};color:${c.txt}">${active.filter(t=>t.done).length}/${active.length}</span>`;
  return `
  <div class="sec ${sec.open?'open':''}" id="sec-${p.id}-plejeplan">
    <div class="sec-header" onclick="toggleSec('${p.id}','plejeplan')"
      style="border-color:${sec.open?c.brd:'var(--border)'}">
      <span class="sec-icon">📝</span>
      <span class="sec-title">${sec.title}</span>
      ${badge}
      <button class="add-prio-btn" style="margin-right:4px;flex-shrink:0" title="Tilføj Plejeforløbsplan til prioritering" onclick="openAddPrioMenu(event,'${p.id}','Plejeforløbsplan')">⚡</button>
      <svg class="sec-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="sec-body">
      ${active.map(t=>renderTask(p.id,'plejeplan',t)).join('')}
      <div class="add-row">
        <input class="ifield" id="at-${p.id}-plejeplan" placeholder="Tilføj punkt til plejeforløbsplan..."
          onkeydown="if(event.key==='Enter')addTask('${p.id}','plejeplan')"/>
        <select style="flex:0 0 auto;width:80px;font-size:11px;padding:4px 6px;border-radius:7px;border:1px solid var(--border2);background:var(--s3);color:var(--muted2);font-family:inherit" id="atf-${p.id}-plejeplan" title="Frekvens per dag">
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
        <button class="btn btn-primary btn-sm" onclick="addTask('${p.id}','plejeplan')">+ Tilføj</button>
      </div>
      ${markAllBtn(p.id,'plejeplan')}
    </div>
  </div>`;
}

function renderTask(pid, secKey, t){
  const bd = getStatusBadge(t);
  const pickerId = `sp-${pid}-${secKey}-${t.id}`;
  const countHtml = t.count!==null&&t.count!==undefined
    ? `<div class="tcounter"><button class="cbtn" onclick="changeCount('${pid}','${secKey}','${t.id}',-1)">−</button><span>${t.count}</span><button class="cbtn" onclick="changeCount('${pid}','${secKey}','${t.id}',1)">+</button></div>`
    : `<button class="btn btn-ghost btn-sm" onclick="enableCount('${pid}','${secKey}','${t.id}')" style="font-size:11px;padding:3px 7px">+Antal</button>`;

  const hasTimes = t.times && t.times.length > 0;

  const suggestedTimes = t.count>0 ? (TIME_SUGGESTIONS[Math.min(t.count,12)]||[]) : [];
  const existingTimeStrs = (t.times||[]).map(ts=>typeof ts==='object'?ts.time:ts);
  const newSuggestions = suggestedTimes.filter(ts=>!existingTimeStrs.includes(ts));

  const suggestHtml = newSuggestions.length>0
    ? `<div style="display:flex;flex-wrap:wrap;gap:4px;width:100%;margin-top:4px;align-items:center">
        <span style="font-size:10px;color:var(--muted)">Forslag:</span>
        ${newSuggestions.map((ts,si)=>{
          const inputId = `sugg-${pid}-${secKey}-${t.id}-${si}`;
          return `
          <div style="display:flex;align-items:center;gap:2px;flex-direction:column">
            <div class="tslot pending" style="cursor:pointer;padding:4px 7px;min-width:48px;flex-direction:column;align-items:center"
              onclick="toggleSuggestEdit('${inputId}','${ts}')">
              <span style="font-size:11px">✦ ${ts}</span>
              <span style="font-size:9px;color:var(--muted)">✎</span>
            </div>
            <div id="${inputId}" style="display:none;flex-direction:column;gap:3px;background:var(--s2);border:1px solid var(--border2);border-radius:7px;padding:5px 7px;align-items:center">
              <input type="time" value="${ts}" style="width:88px;font-size:11px;padding:3px 5px;background:var(--s3);border:1px solid var(--border2);border-radius:5px;color:var(--text);font-family:inherit" id="${inputId}-val"/>
              <div style="display:flex;gap:3px">
                <button class="btn btn-primary" style="font-size:10px;padding:3px 8px" onclick="acceptTimeSuggestEdited('${pid}','${secKey}','${t.id}','${inputId}')">✓</button>
                <button class="btn btn-ghost" style="font-size:10px;padding:3px 6px" onclick="document.getElementById('${inputId}').style.display='none'">✕</button>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>` : '';

  const doneAtHtml = t.done
    ? `<span style="font-size:9px;color:var(--green);font-family:'IBM Plex Mono',monospace;margin-left:4px;cursor:pointer;text-decoration:underline dotted"
        title="Klik for at redigere tidspunkt"
        onclick="editTaskDoneAt('${pid}','${secKey}','${t.id}',this)">✓ ${t.doneAt||'Sæt tid'}</span>`
    : '';

  const tcheckCls = t.done ? 'done' :
    (t.status==='overdue' || t.status==='notdone') ? 'notdone' : '';

  const timesHtml = hasTimes
    ? `<div class="time-slots" style="margin-top:6px;margin-bottom:2px;width:100%;align-items:flex-start;flex-wrap:wrap">
        ${t.times.map((ts,i)=>renderTimeSlotWithNudge(pid,secKey,t.id,ts,i)).join('')}
        ${renderAddTimeBtn(pid,secKey,t.id)}
      </div>`
    : `<div class="time-slots" style="margin-top:4px;width:100%">
        ${renderAddTimeBtn(pid,secKey,t.id)}
      </div>`;

  return `
  <div class="task-row" style="flex-wrap:wrap">
    <div class="tcheck ${tcheckCls}" onclick="toggleTask('${pid}','${secKey}','${t.id}')"></div>
    <div class="tlabel ${t.done?'done':''}" style="min-width:100px">${t.label}${doneAtHtml}</div>
    ${countHtml}
    <div style="position:relative;flex-shrink:0">
      <span class="tstatus ${bd.cls}" onclick="toggleStatusPicker('${pickerId}')">${bd.txt} ▾</span>
      <div id="${pickerId}" class="status-picker">
        <button class="sp-opt sp-done"  onclick="setTaskStatus('${pid}','${secKey}','${t.id}','done',true)"     >✓ Udført</button>
        <button class="sp-opt sp-inp"   onclick="setTaskStatus('${pid}','${secKey}','${t.id}','inprogress',false)">▶ I gang</button>
        <button class="sp-opt sp-urg"   onclick="setTaskStatus('${pid}','${secKey}','${t.id}','urgent',false)"  >🚨 Haster</button>
        <button class="sp-opt sp-soon"  onclick="setTaskStatus('${pid}','${secKey}','${t.id}','upcoming',false)" >⏰ Snart</button>
        <button class="sp-opt sp-over"  onclick="setTaskStatus('${pid}','${secKey}','${t.id}','overdue',false)"  >✗ Ikke gjort</button>
        <button class="sp-opt sp-pend"  onclick="setTaskStatus('${pid}','${secKey}','${t.id}','pending',false)"  >— Afventer</button>
      </div>
    </div>
    <button class="tremove" onclick="removeTask('${pid}','${secKey}','${t.id}')">✕</button>
    <button class="add-prio-btn" title="Tilføj til prioriteringsliste" onclick="openAddPrioMenu(event,'${pid}','${t.label}')">⚡</button>
    ${timesHtml}
    ${suggestHtml}
  </div>`;
}

function renderTimeSlotWithNudge(pid, secKey, tid, ts, idx){
  const timeStr = typeof ts === 'object' ? ts.time : ts;
  const slotStatus2 = typeof ts === 'object' ? ts.status : null;
  const slotDT = typeof ts === 'object' ? ts.dt : null;

  let cls, icon, dtLine;
  if(slotStatus2==='done'){
    cls='given'; icon='✓';
    dtLine = `<div style="font-size:8px;text-align:center"><span class="edt-ts" style="font-size:9px;color:var(--green);font-family:'IBM Plex Mono',monospace;cursor:pointer;text-decoration:underline dotted" data-dt="${slotDT||''}" data-fn="setTaskSlotDT('${pid}','${secKey}','${tid}',${idx},v)" onclick="openDTE(this)">${slotDT?'✎ '+slotDT:'✎ Sæt tid'}</span></div>`;
  } else if(slotStatus2==='notdone'){
    cls='overdue'; icon='✗';
    dtLine = `<div style="font-size:8px;text-align:center"><span class="edt-ts" style="font-size:9px;color:var(--red);font-family:'IBM Plex Mono',monospace;cursor:pointer;text-decoration:underline dotted" data-dt="${slotDT||''}" data-fn="setTaskSlotDT('${pid}','${secKey}','${tid}',${idx},v)" onclick="openDTE(this)">${slotDT?'✎ '+slotDT:'✎ Sæt tid'}</span></div>`;
  } else {
    cls = slotStatus(timeStr); icon=''; dtLine='';
  }

  const pickerId = `tsp-${pid}-${secKey}-${tid}-${idx}`;
  const nudgeId  = `nudge-${pid}-${secKey}-${tid}-${idx}`;
  return `
  <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
    <div class="tslot ${cls}" onclick="toggleTimeSlotPicker('${pickerId}')"
      style="flex-direction:column;padding:5px 7px;min-width:48px;align-items:center;gap:1px;${cls==='given'?'background:rgba(16,185,129,.22);border-color:var(--green);':cls==='overdue'?'background:rgba(239,68,68,.18);border-color:var(--red);':''}">
      <span class="ts-time" style="font-size:11px">${timeStr}</span>
      ${icon
        ? `<span style="font-size:10px;font-weight:700;color:${cls==='given'?'var(--green)':'var(--red)'}">${icon}</span>`
        : `<span style="font-size:9px;color:var(--muted)">▾</span>`}
    </div>
    ${dtLine}
    <div id="${pickerId}" class="nudge-popup" style="display:none">
      <div class="nudge-label">Status for ${timeStr}</div>
      <button class="sp-opt sp-done" style="font-size:11px;width:100%" onclick="setSlotStatus('${pid}','${secKey}','${tid}',${idx},'done')">✓ Udført</button>
      <button class="sp-opt sp-over" style="font-size:11px;width:100%" onclick="setSlotStatus('${pid}','${secKey}','${tid}',${idx},'notdone')">✗ Ikke udført</button>
      <button class="sp-opt sp-pend" style="font-size:11px;width:100%" onclick="setSlotStatus('${pid}','${secKey}','${tid}',${idx},'pending')">— Nulstil</button>
      <div class="nudge-label" style="margin-top:4px">Ryk tidspunkt</div>
      <div class="nudge-btns">
        <button class="nudge-btn nudge-back" onclick="nudgeTime('${pid}','${secKey}','${tid}',${idx},-60)">−1t</button>
        <button class="nudge-btn nudge-back" onclick="nudgeTime('${pid}','${secKey}','${tid}',${idx},-30)">−30</button>
        <button class="nudge-btn nudge-back" onclick="nudgeTime('${pid}','${secKey}','${tid}',${idx},-15)">−15</button>
        <button class="nudge-btn nudge-now"  onclick="nudgeToNow('${pid}','${secKey}','${tid}',${idx})">Nu</button>
        <button class="nudge-btn nudge-fwd"  onclick="nudgeTime('${pid}','${secKey}','${tid}',${idx},15)">+15</button>
        <button class="nudge-btn nudge-fwd"  onclick="nudgeTime('${pid}','${secKey}','${tid}',${idx},30)">+30</button>
        <button class="nudge-btn nudge-fwd"  onclick="nudgeTime('${pid}','${secKey}','${tid}',${idx},60)">+1t</button>
      </div>
      <button class="nudge-del" onclick="removeTimeSlot('${pid}','${secKey}','${tid}',${idx})">🗑 Fjern tidspunkt</button>
    </div>
  </div>`;
}

function renderAddTimeBtn(pid, secKey, tid){
  const inputId = `addtime-${pid}-${secKey}-${tid}`;
  const freqId  = `addfreq-${pid}-${secKey}-${tid}`;
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
    <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
      <button class="tslot" style="border-style:dashed;padding:5px 7px;min-width:48px;flex-direction:column;align-items:center"
        onclick="toggleAddTimeInput('${inputId}')">
        <span style="font-size:14px;color:var(--muted)">+</span>
        <span style="font-size:9px;color:var(--muted)">Tid</span>
      </button>
      <div id="${inputId}" style="display:none;flex-direction:column;align-items:center;gap:5px;background:var(--s2);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;min-width:160px">
        <!-- Frekvens presets -->
        <div style="width:100%">
          <div style="font-size:9px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px">Frekvens</div>
          <div style="display:flex;flex-wrap:wrap;gap:3px">
            ${[1,2,3,4,6,8,12,24,48].map(n=>`
              <button onclick="applyFreqToTask('${pid}','${secKey}','${tid}',${n},'${inputId}')"
                style="font-size:10px;padding:2px 6px;border-radius:5px;cursor:pointer;font-family:inherit;font-weight:600;
                  border:1px solid var(--border2);background:var(--s3);color:var(--muted2);transition:all .12s"
                onmouseover="this.style.background='var(--bbg)';this.style.color='var(--blue)';this.style.borderColor='var(--bbrd)'"
                onmouseout="this.style.background='var(--s3)';this.style.color='var(--muted2)';this.style.borderColor='var(--border2)'"
                title="${n===48?'Hver 30 min':n===24?'Hver time':n+'× dagligt'}"
                >${n===48?'½t':n===24?'1t':n+'×'}</button>`).join('')}
          </div>
        </div>
        <!-- Enkelt tid -->
        <div style="width:100%;border-top:1px solid var(--border);padding-top:5px">
          <div style="font-size:9px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px">Specifik tid</div>
          <div style="display:flex;gap:4px;align-items:center">
            <input type="time" class="dt-editor-input" style="flex:1;font-size:12px;padding:4px 6px" 
              id="${inputId}-val" value="${nowHHMM()}" />
            <button class="btn btn-primary" style="font-size:11px;padding:4px 8px" 
              onclick="confirmAddTaskTime('${pid}','${secKey}','${tid}','${inputId}')">✓</button>
            <button class="btn btn-ghost" style="font-size:11px;padding:4px 6px"
              onclick="document.getElementById('${inputId}').style.display='none'">✕</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function applyFreqToTask(pid, secKey, tid, count, inputId){
  const p = patients.find(x=>x.id===pid); if(!p) return;
  const t = p.sections[secKey]?.tasks?.find(x=>x.id===tid); if(!t) return;
  // Generer tider fra nu
  const times = generateTimesFromNow(count, null);
  let added = 0;
  t.times = t.times.map(ts => typeof ts==='string' ? {time:ts,status:'pending',dt:''} : ts);
  times.forEach(time=>{
    if(!t.times.find(ts=>ts.time===time)){
      t.times.push({time, status:'pending', dt:''});
      added++;
    }
  });
  t.times.sort((a,b)=>a.time.localeCompare(b.time));
  document.getElementById(inputId).style.display='none';
  save(); render();
  showPrioToast(`${count}× dagligt fra ${nowHHMM()} (${added} tider tilføjet)`, 'yellow');
}

function toggleAddTimeInput(inputId){
  const el = document.getElementById(inputId);
  if(!el) return;
  const isOpen = el.style.display !== 'none';
  el.style.display = isOpen ? 'none' : 'flex';
  if(!isOpen) {
    const inp = document.getElementById(inputId+'-val');
    if(inp){ inp.value = nowHHMM(); setTimeout(()=>inp.focus(), 50); }
  }
}

function confirmAddTaskTime(pid, secKey, tid, inputId){
  const inp = document.getElementById(inputId+'-val');
  if(!inp) return;
  const t2 = inp.value;
  if(!t2 || !/^\d{2}:\d{2}$/.test(t2)) return;
  const p=patients.find(x=>x.id===pid);
  const t=p.sections[secKey].tasks.find(x=>x.id===tid);
  if(!t) return;
  t.times = t.times.map(ts => typeof ts==='string' ? {time:ts,status:'pending',dt:''} : ts);
  if(!t.times.find(ts=>ts.time===t2)){
    t.times.push({time:t2, status:'pending', dt:''});
    t.times.sort((a,b)=>a.time.localeCompare(b.time));
  }
  document.getElementById(inputId).style.display='none';
  save();render();
}

function addTaskTime(pid, secKey, tid){
  const inputId = `addtime-${pid}-${secKey}-${tid}`;
  toggleAddTimeInput(inputId);
}

function toggleNudge(id){
  const el = document.getElementById(id);
  if(!el) return;
  const isOpen = el.style.display !== 'none';
  document.querySelectorAll('.nudge-popup').forEach(p=>p.style.display='none');
  el.style.display = isOpen ? 'none' : 'flex';
}

function toggleTimeSlotPicker(id){
  toggleNudge(id);
}

function setSlotStatus(pid, secKey, tid, idx, status){
  const p=patients.find(x=>x.id===pid);
  const t=p.sections[secKey].tasks.find(x=>x.id===tid);
  if(!t) return;
  if(typeof t.times[idx] === 'string'){
    t.times[idx] = {time: t.times[idx], status: 'pending', dt:''};
  }
  const dt = status !== 'pending' ? fmtDT(Date.now()) : '';
  t.times[idx].status = status;
  t.times[idx].dt = dt;
  document.querySelectorAll('.nudge-popup').forEach(p=>p.style.display='none');
  save();render();
}

document.addEventListener('click', e=>{
  if(!e.target.closest('.nudge-popup') && !e.target.closest('.tslot')){
    document.querySelectorAll('.nudge-popup').forEach(p=>p.style.display='none');
  }
  if(!e.target.closest('.status-picker') && !e.target.closest('.tstatus')){
    document.querySelectorAll('.status-picker').forEach(p=>p.classList.remove('open'));
  }
  if(!e.target.closest('.med-slot-picker') && !e.target.closest('.tslot')){
    document.querySelectorAll('.med-slot-picker').forEach(p=>p.style.display='none');
  }
});

function markAllBtn(pid, secKey){
  return `
  <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
    <button class="mark-all-btn" onclick="markAllDone('${pid}','${secKey}')">
      ✓ Marker alle som udført
    </button>
    <button class="mark-all-btn" style="background:var(--rbg);color:var(--red);border-color:var(--rbrd)"
      onclick="resetSection('${pid}','${secKey}')"
      title="Nulstiller alle afkrydsninger og tider i denne sektion">
      ↺ Nulstil alt
    </button>
  </div>`;
}

function resetSection(pid, secKey){
  const p = patients.find(x=>x.id===pid); if(!p) return;
  const sec = p.sections[secKey]; if(!sec) return;
  if(!confirm('Nulstil hele sektionen? Alle afkrydsninger og tidsstempler fjernes.')) return;

  // Nulstil tasks
  if(sec.tasks){
    sec.tasks.forEach(t=>{
      t.done = false;
      t.status = 'pending';
      t.doneAt = '';
      // Nulstil alle tidsslots
      if(t.times){
        t.times = t.times.map(ts=>{
          const time = typeof ts==='object' ? ts.time : ts;
          return {time, status:'pending', dt:''};
        });
      }
    });
  }

  // Nulstil ankomst items
  if(sec.items){
    sec.items.forEach(item=>{
      item.done = false;
      item.completedAt = '';
    });
  }

  // Sektion-specifikke nulstillinger
  if(secKey==='medicin'){
    // Nulstil medicin tider
    if(sec.items){
      sec.items.forEach(med=>{
        med.times = (med.times||[]).map(ts=>{
          const time = typeof ts==='object' ? ts.time : ts;
          return {time, status:'pending', givetAt:'', givetAf:''};
        });
        med.seponeret = false;
      });
    }
    // Nulstil FVC tider
    if(sec.fvcTimes){
      sec.fvcTimes = sec.fvcTimes.map(ts=>({...ts, status:'pending', dt:''}));
    }
  }

  if(secKey==='bleskift'){
    if(sec.entries) sec.entries = sec.entries.map(e=>({...e, done:false, doneAt:''}));
  }

  if(secKey==='sik'){
    if(sec.entries) sec.entries = sec.entries.map(e=>({...e, active:true, fjernet:false, fjernedtAt:''}));
  }

  if(secKey==='td'){
    if(confirm('Vil du også slette alle Time Diurese målinger?')){
      sec.entries = [];
      sec.total = 0;
    }
  }

  if(secKey==='sss'){
    if(confirm('Vil du også slette alle SSS målinger?')){
      sec.readings = [];
    }
  }

  if(secKey==='ich'){
    if(confirm('Vil du også slette alle ICH/BP målinger?')){
      sec.readings = [];
    }
  }

  save(); render();
}

function markAllDone(pid, secKey){
  const p=patients.find(x=>x.id===pid);
  const tasks = p.sections[secKey].tasks;
  const activeTasks = tasks.filter(t=>t.enabled!==false);
  const allDone = activeTasks.every(t=>t.done);
  activeTasks.forEach(t=>{ t.done=!allDone; if(!allDone) t.status='done'; else t.status='pending'; });
  save();render();
}

function toggleSec(pid,sec){ const p=patients.find(x=>x.id===pid); p.sections[sec].open=!p.sections[sec].open; save();render(); }
function toggleCustomize(pid){ const p=patients.find(x=>x.id===pid); p.customizeOpen=!p.customizeOpen; save();render(); }
function toggleSection(pid,secKey,val){ const p=patients.find(x=>x.id===pid); p.sections[secKey].enabled=val; save();render(); }
function toggleTask2(pid,secKey,tid,val){
  const p=patients.find(x=>x.id===pid);
  const t=p.sections[secKey].tasks.find(x=>x.id===tid);
  if(t) t.enabled=val; save();render();
}

function toggleTask(pid,secKey,tid){
  const p=patients.find(x=>x.id===pid);
  const t=p.sections[secKey].tasks.find(x=>x.id===tid);
  t.done=!t.done;
  t.status = t.done ? 'done' : 'pending';
  t.doneAt = t.done ? fmtDT(Date.now()) : '';

  if(secKey==='vaske' && t.label==='Fuld vask'){
    const autoLabels = ['Vask af hoved','Vask af overkrop','Vask af nedre'];
    p.sections.vaske.tasks.forEach(task=>{
      if(autoLabels.includes(task.label)){
        task.done = t.done;
        task.status = t.done ? 'done' : 'pending';
        task.doneAt = t.done ? fmtDT(Date.now()) : '';
      }
    });
  }
  save();render();
}
function toggleStatusPicker(id){
  const el=document.getElementById(id); if(!el) return;
  const isOpen=el.classList.contains('open');
  document.querySelectorAll('.status-picker').forEach(p=>p.classList.remove('open'));
  if(!isOpen) el.classList.add('open');
}
function setTaskStatus(pid,secKey,tid,status,done){
  const p=patients.find(x=>x.id===pid);
  const t=p.sections[secKey].tasks.find(x=>x.id===tid);
  t.status=status; t.done=done;
  if(done) t.doneAt = fmtDT(Date.now());
  else if(status==='pending') t.doneAt = '';
  document.querySelectorAll('.status-picker').forEach(p=>p.classList.remove('open'));
  save();render();
}
function cycleTask(pid,secKey,tid){ // kept for kost compat
  const p=patients.find(x=>x.id===pid);
  const t=p.sections[secKey].tasks.find(x=>x.id===tid);
  if(t.done){t.done=false;t.status='pending';}
  else{const c=['pending','inprogress','urgent','upcoming','overdue'];t.status=c[(c.indexOf(t.status)+1)%c.length];}
  save();render();
}
function changeCount(pid,secKey,tid,d){
  const p=patients.find(x=>x.id===pid);
  const t=p.sections[secKey].tasks.find(x=>x.id===tid);
  t.count=Math.max(0,(t.count||0)+d); save();render();
}
function enableCount(pid,secKey,tid){
  const p=patients.find(x=>x.id===pid);
  const t=p.sections[secKey].tasks.find(x=>x.id===tid);
  t.count=1; save();render();
}
function addTask(pid, secKey){
  const inp = document.getElementById(`at-${pid}-${secKey}`);
  const sel = document.getElementById(`ats-${pid}-${secKey}`);
  const freq = document.getElementById(`atf-${pid}-${secKey}`);
  const lbl = inp.value.trim(); if(!lbl) return;
  const p = patients.find(x=>x.id===pid);
  const freqCount = freq ? parseInt(freq.value)||0 : 0;
  const times = freqCount > 0
    ? generateTimesFromNow(freqCount, null).map(t=>({time:t,status:'pending',dt:''}))
    : [];
  p.sections[secKey].tasks.push({
    id:uid(), label:lbl, done:false,
    status: sel ? sel.value : 'pending',
    count: null, times
  });
  inp.value='';
  if(freq) freq.value='0';
  p.sections[secKey].open=true;
  save(); render();
}
function removeTask(pid,secKey,tid){
  const p=patients.find(x=>x.id===pid);
  p.sections[secKey].tasks=p.sections[secKey].tasks.filter(t=>t.id!==tid);
  save();render();
}
function acceptTimeSuggest(pid,secKey,tid,time){
  const p=patients.find(x=>x.id===pid);
  const t=p.sections[secKey].tasks.find(x=>x.id===tid);
  if(!t.times)t.times=[];
  t.times = t.times.map(ts=>typeof ts==='string'?{time:ts,status:'pending',dt:''}:ts);
  if(!t.times.find(ts=>ts.time===time)) t.times.push({time,status:'pending',dt:''});
  save();render();
}
function toggleSuggestEdit(inputId, defaultTime){
  const el = document.getElementById(inputId);
  if(!el) return;
  const isVisible = el.style.display === 'flex';
  el.style.display = isVisible ? 'none' : 'flex';
  if(!isVisible){
    const inp = document.getElementById(inputId+'-val');
    if(inp){ inp.value = defaultTime; inp.focus(); }
  }
}

function acceptTimeSuggestEdited(pid, secKey, tid, inputId){
  const inp = document.getElementById(inputId+'-val');
  const time = inp ? inp.value : null;
  if(!time) return;
  const p = patients.find(x=>x.id===pid); if(!p) return;
  const t = p.sections[secKey]?.tasks?.find(x=>x.id===tid); if(!t) return;
  if(!t.times) t.times = [];
  if(!t.times.find(ts=>(typeof ts==='object'?ts.time:ts)===time))
    t.times.push({time, status:'pending', dt:''});
  document.getElementById(inputId).style.display = 'none';
  save(); render();
}

function editTaskDoneAt(pid, secKey, tid, spanEl){
  const p = patients.find(x=>x.id===pid); if(!p) return;
  const t = p.sections[secKey]?.tasks?.find(x=>x.id===tid); if(!t) return;
  const current = t.doneAt || '';
  const dtVal = dtToInput ? dtToInput(current) : '';
  const wrap = document.createElement('span');
  wrap.innerHTML = `<input type="datetime-local" value="${dtVal}"
    style="font-size:10px;padding:2px 4px;background:var(--s3);border:1px solid var(--border2);border-radius:5px;color:var(--text);font-family:inherit"
    onchange="saveTaskDoneAt('${pid}','${secKey}','${tid}',this.value,this)"
    onblur="this.parentNode.replaceWith(document.createTextNode('')); render()"/>`;
  spanEl.replaceWith(wrap);
  wrap.querySelector('input').focus();
}

function saveTaskDoneAt(pid, secKey, tid, val, inputEl){
  const p = patients.find(x=>x.id===pid); if(!p) return;
  const t = p.sections[secKey]?.tasks?.find(x=>x.id===tid); if(!t) return;
  t.doneAt = val ? inputToDT(val) : '';
  save(); render();
}

function nudgeTime(pid,secKey,tid,idx,deltaMin){
  const p=patients.find(x=>x.id===pid);
  const t=p.sections[secKey].tasks.find(x=>x.id===tid);
  if(!t) return;
  const cur = typeof t.times[idx]==='string' ? t.times[idx] : t.times[idx].time;
  const [h,m]=cur.split(':').map(Number);
  const total=(h*60+m+deltaMin+1440)%1440;
  const newTime=String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0');
  if(typeof t.times[idx]==='string') t.times[idx]=newTime;
  else t.times[idx].time=newTime;
  document.querySelectorAll('.nudge-popup').forEach(p=>p.style.display='none');
  save();render();
}
function nudgeToNow(pid,secKey,tid,idx){
  const p=patients.find(x=>x.id===pid);
  const t=p.sections[secKey].tasks.find(x=>x.id===tid);
  if(!t) return;
  if(typeof t.times[idx]==='string') t.times[idx]=nowHHMM();
  else t.times[idx].time=nowHHMM();
  document.querySelectorAll('.nudge-popup').forEach(p=>p.style.display='none');
  save();render();
}
function removeTimeSlot(pid,secKey,tid,idx){
  const p=patients.find(x=>x.id===pid);
  const t=p.sections[secKey].tasks.find(x=>x.id===tid);
  if(!t) return;
  t.times.splice(idx,1);
  document.querySelectorAll('.nudge-popup').forEach(p=>p.style.display='none');
  save();render();
}

function setKost(pid,type){
  const p=patients.find(x=>x.id===pid); p.sections.kost.kostType=type; save();render();
}
function toggleSonde(pid,val){
  const p=patients.find(x=>x.id===pid); p.sections.kost.sonde=val; save();render();
}
function setSondeField(pid,field,val){
  const p=patients.find(x=>x.id===pid);
  p.sections.kost[field]=val;
  if(field==='sondeFreq'){
    p.sections.kost.sondeTimes = [...(TIME_SUGGESTIONS[Math.min(parseInt(val)||1,6)]||['08:00'])];
  }
  save(); render();
}

function renderSondeTimeSlot(pid, ts, idx){
  const st = slotStatus(ts);
  const nudgeId = `snudge-${pid}-${idx}`;
  return `
  <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
    <div class="tslot ${st}" onclick="toggleNudge('${nudgeId}')">
      <div class="ts-dot"></div>
      <span class="ts-time">${ts}</span>
      <span style="font-size:9px;color:var(--muted);margin-left:2px">↕</span>
    </div>
    <div id="${nudgeId}" class="nudge-popup" style="display:none">
      <div class="nudge-label">Ryk tidspunkt</div>
      <div class="nudge-btns">
        <button class="nudge-btn nudge-back" onclick="nudgeSondeTime('${pid}',${idx},-60)">−1t</button>
        <button class="nudge-btn nudge-back" onclick="nudgeSondeTime('${pid}',${idx},-30)">−30</button>
        <button class="nudge-btn nudge-back" onclick="nudgeSondeTime('${pid}',${idx},-15)">−15</button>
        <button class="nudge-btn nudge-now" onclick="nudgeSondeToNow('${pid}',${idx})">Nu</button>
        <button class="nudge-btn nudge-fwd" onclick="nudgeSondeTime('${pid}',${idx},15)">+15</button>
        <button class="nudge-btn nudge-fwd" onclick="nudgeSondeTime('${pid}',${idx},30)">+30</button>
        <button class="nudge-btn nudge-fwd" onclick="nudgeSondeTime('${pid}',${idx},60)">+1t</button>
      </div>
      <button class="nudge-del" onclick="removeSondeTime('${pid}',${idx})">🗑 Fjern tidspunkt</button>
    </div>
  </div>`;
}

function getSondeTimes(p){
  const kost = p.sections.kost;
  if(kost.sondeTimes && kost.sondeTimes.length) return kost.sondeTimes;
  return TIME_SUGGESTIONS[Math.min(parseInt(kost.sondeFreq)||1,6)]||['08:00'];
}

function nudgeSondeTime(pid,idx,deltaMin){
  const p=patients.find(x=>x.id===pid);
  const times = getSondeTimes(p);
  const [h,m]=times[idx].split(':').map(Number);
  const total=(h*60+m+deltaMin+1440)%1440;
  times[idx]=String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0');
  p.sections.kost.sondeTimes=[...times];
  save();render();
}
function nudgeSondeToNow(pid,idx){
  const p=patients.find(x=>x.id===pid);
  const times=[...getSondeTimes(p)];
  times[idx]=nowHHMM();
  p.sections.kost.sondeTimes=times;
  save();render();
}
function removeSondeTime(pid,idx){
  const p=patients.find(x=>x.id===pid);
  const times=[...getSondeTimes(p)];
  times.splice(idx,1);
  p.sections.kost.sondeTimes=times;
  save();render();
}
function addSondeTime(pid){
  const p=patients.find(x=>x.id===pid);
  const times=[...getSondeTimes(p)];
  times.push(nowHHMM());
  p.sections.kost.sondeTimes=times;
  save();render();
}
function toggleKostTask(pid,tid){
  const p=patients.find(x=>x.id===pid);
  const t=p.sections.kost.tasks.find(x=>x.id===tid);
  t.done=!t.done; if(t.done)t.status='done'; else t.status='pending'; save();render();
}
function cycleKostTask(pid,tid){
  const p=patients.find(x=>x.id===pid);
  const t=p.sections.kost.tasks.find(x=>x.id===tid);
  if(t.done){t.done=false;t.status='pending';}
  else{const c=['pending','upcoming','overdue'];t.status=c[(c.indexOf(t.status)+1)%c.length];}
  save();render();
}
function changeKostCount(pid,tid,d){
  const p=patients.find(x=>x.id===pid);
  const t=p.sections.kost.tasks.find(x=>x.id===tid);
  if(t.count===null)t.count=0;
  t.count=Math.max(0,t.count+d); save();render();
}

function addBleskift(pid){
  const p=patients.find(x=>x.id===pid);
  if(!p.sections.bleskift.entries) p.sections.bleskift.entries=[];
  const type = document.getElementById('btype-'+pid)?.value||'ble';
  const time = document.getElementById('btime-'+pid)?.value||nowHHMM();
  const note = document.getElementById('bnote-'+pid)?.value.trim()||'';
  p.sections.bleskift.entries.push({type,time,done:false,doneAt:'',note});
  save();render();
}
function toggleBleskift(pid,idx){
  const p=patients.find(x=>x.id===pid);
  const e=p.sections.bleskift.entries[idx];
  e.done=!e.done; e.doneAt=e.done?fmtDT(Date.now()):'';
  save();render();
}
function removeBleskift(pid,idx){
  const p=patients.find(x=>x.id===pid);
  p.sections.bleskift.entries.splice(idx,1);
  save();render();
}
function markAllBleskift(pid){
  const p=patients.find(x=>x.id===pid);
  const dt=fmtDT(Date.now());
  (p.sections.bleskift.entries||[]).forEach(e=>{if(!e.done){e.done=true;e.doneAt=dt;}});
  save();render();
}

let tdActiveTime={};
function setTDInterval(pid,val){
  const p=patients.find(x=>x.id===pid);
  p.sections.td.interval=val; save();render();
}
function openTDEntry(pid,time){
  tdActiveTime[pid]=time;
  const panel=document.getElementById('tdpanel-'+pid);
  const lbl=document.getElementById('tdpanel-lbl-'+pid);
  if(!panel) return;
  if(lbl) lbl.textContent='Registrer diurese — '+time;
  panel.style.display='block';
  document.getElementById('tdml-'+pid)?.focus();
}
function closeTDPanel(pid){
  const el=document.getElementById('tdpanel-'+pid);
  if(el) el.style.display='none';
  delete tdActiveTime[pid];
}
function saveTDEntry(pid){
  const p=patients.find(x=>x.id===pid);
  const time=tdActiveTime[pid]; if(!time) return;
  const ml=parseInt(document.getElementById('tdml-'+pid)?.value||0);
  const qual=document.getElementById('tdqual-'+pid)?.value||'';
  if(!p.sections.td.entries) p.sections.td.entries=[];
  const idx=p.sections.td.entries.findIndex(e=>e.time===time);
  const entry={time,ml,qual,done:true,recordedAt:fmtDT(Date.now())};
  if(idx>=0) p.sections.td.entries[idx]=entry;
  else p.sections.td.entries.push(entry);
  closeTDPanel(pid); save();render();
}

function addSIK(pid){
  const p=patients.find(x=>x.id===pid);
  if(!p.sections.sik.entries) p.sections.sik.entries=[];
  const site=document.getElementById('siksite-'+pid)?.value.trim()||'Ukendt lokalisation';
  const note=document.getElementById('siknote-'+pid)?.value.trim()||'';
  p.sections.sik.entries.push({site,note,insertedAt:fmtDT(Date.now()),changedAt:'',removed:false,observations:[]});
  save();render();
}
function changeSIK(pid,idx){
  const p=patients.find(x=>x.id===pid);
  p.sections.sik.entries[idx].changedAt=fmtDT(Date.now());
  save();render();
}
function removeSIK(pid,idx){
  const p=patients.find(x=>x.id===pid);
  p.sections.sik.entries[idx].removed=true;
  p.sections.sik.entries[idx].removedAt=fmtDT(Date.now());
  save();render();
}
function toggleSIKObs(pid,idx,time){
  const p=patients.find(x=>x.id===pid);
  const entry=p.sections.sik.entries[idx];
  if(!entry.observations) entry.observations=[];
  const oi=entry.observations.findIndex(o=>o.time===time);
  if(oi>=0) entry.observations[oi].done=!entry.observations[oi].done;
  else entry.observations.push({time,done:true,recordedAt:fmtDT(Date.now())});
  save();render();
}

function addMed(pid){
  const p=patients.find(x=>x.id===pid);
  p.sections.medicin.items.push({id:uid(),name:'',fromEPJ:false,times:[],log:[],note:'',seponeret:false,freqLabel:''});
  p.sections.medicin.open=true; save();render();
}
function removeMed(pid,mid){
  if(!confirm('Fjern dette præparat?')) return;
  const p=patients.find(x=>x.id===pid);
  p.sections.medicin.items=p.sections.medicin.items.filter(m=>m.id!==mid);
  save();render();
}
function applyMedFreqByIndex(pid,mid,idx){
  const pr = MED_FREQ_PRESETS[idx];
  if(!pr) return;
  // Generer tider fra nu dynamisk
  const times = pr.count > 0 ? generateTimesFromNow(pr.count, null) : [];
  applyMedFreq(pid,mid,times,pr.label);
}
function applyMedFreq(pid,mid,times,label){
  const p=patients.find(x=>x.id===pid);
  const med=p.sections.medicin.items.find(m=>m.id===mid);
  const newTimes = times.map(t=>{
    const existing = med.times.find(ts=>ts.time===t);
    return existing || {time:t, status:'pending'};
  });
  med.times=newTimes;
  med.freqLabel=label||'';
  const el=document.getElementById(`mfp-${pid}-${mid}`);
  if(el) el.style.display='none';
  save();render();
}
function addMedTimeManual(pid,mid){
  openTimePicker(function(t){
    const p=patients.find(x=>x.id===pid);
    const med=p.sections.medicin.items.find(m=>m.id===mid);
    if(med && !med.times.find(ts=>ts.time===t)) med.times.push({time:t,status:'pending'});
    save();render();
  });
}
function openMedFreqPicker(pid,mid){
  const el=document.getElementById(`mfp-${pid}-${mid}`);
  if(!el) return;
  el.style.display = el.style.display==='none' ? 'block' : 'none';
}
function toggleMedNote(pid,mid){
  const el=document.getElementById(`mnote-${pid}-${mid}`);
  if(!el) return;
  el.style.display = el.style.display==='none' ? 'block' : 'none';
  if(el.style.display==='block') el.querySelector('input')?.focus();
}
function setMedNote(pid,mid,val){
  const p=patients.find(x=>x.id===pid);
  const med=p.sections.medicin.items.find(m=>m.id===mid);
  med.note=val;
  medLog(med,'note',{text:val});
  save();
}
function toggleMedPicker(id){
  const el=document.getElementById(id); if(!el) return;
  const isOpen=el.style.display!=='none';
  document.querySelectorAll('.med-slot-picker').forEach(e=>e.style.display='none');
  document.querySelectorAll('.nudge-popup').forEach(e=>e.style.display='none');
  el.style.display=isOpen?'none':'flex';
}
function setMedSlotStatus(pid,mid,idx,status){
  const p=patients.find(x=>x.id===pid);
  const med=p.sections.medicin.items.find(m=>m.id===mid);
  const ts=med.times[idx];
  const dt=fmtDT(Date.now());
  ts.status=status;
  if(status==='given'){ts.givenDT=dt; medLog(med,'given',{time:ts.time,dt});}
  else if(status==='notgiven'){ts.notgivenDT=dt; medLog(med,'notgiven',{time:ts.time,dt});}
  document.querySelectorAll('.med-slot-picker').forEach(e=>e.style.display='none');
  save();render();
}
function nudgeMedSlot(pid,mid,idx,deltaMin){
  const p=patients.find(x=>x.id===pid);
  const med=p.sections.medicin.items.find(m=>m.id===mid);
  const ts=med.times[idx];
  const origTime=ts.time;
  const [h,m]=ts.time.split(':').map(Number);
  const total=(h*60+m+deltaMin+1440)%1440;
  ts.time=String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0');
  ts.status='delayed';
  medLog(med,'delayed',{time:origTime,newTime:ts.time,dt:fmtDT(Date.now())});
  document.querySelectorAll('.med-slot-picker').forEach(e=>e.style.display='none');
  save();render();
}
function nudgeMedSlotToNow(pid,mid,idx){
  const p=patients.find(x=>x.id===pid);
  const med=p.sections.medicin.items.find(m=>m.id===mid);
  const ts=med.times[idx];
  const origTime=ts.time;
  ts.time=nowHHMM(); ts.status='delayed';
  medLog(med,'delayed',{time:origTime,newTime:ts.time,dt:fmtDT(Date.now())});
  document.querySelectorAll('.med-slot-picker').forEach(e=>e.style.display='none');
  save();render();
}
function removeMedSlot(pid,mid,idx){
  const p=patients.find(x=>x.id===pid);
  const med=p.sections.medicin.items.find(m=>m.id===mid);
  med.times.splice(idx,1);
  document.querySelectorAll('.med-slot-picker').forEach(e=>e.style.display='none');
  save();render();
}
function seponerMed(pid,mid){
  const p=patients.find(x=>x.id===pid);
  const med=p.sections.medicin.items.find(m=>m.id===mid);
  med.seponeret=true; med.seponeretatDT=fmtDT(Date.now());
  medLog(med,'sep',{dt:med.seponeretatDT});
  save();render();
}
function genaktiverMed(pid,mid){
  const p=patients.find(x=>x.id===pid);
  const med=p.sections.medicin.items.find(m=>m.id===mid);
  med.seponeret=false; med.seponeretatDT=null;
  save();render();
}
function medLog(med,type,data){
  if(!med.log) med.log=[];
  med.log.push({type,dt:fmtDT(Date.now()),...data});
}
function markAllMedGiven(pid){
  const p=patients.find(x=>x.id===pid);
  const dt=fmtDT(Date.now());
  p.sections.medicin.items.forEach(med=>{
    if(med.seponeret) return;
    med.times.forEach(ts=>{
      if(ts.status!=='given'){ts.status='given';ts.givenDT=dt;medLog(med,'given',{time:ts.time,dt});}
    });
  });
  save();render();
}
function quickAddMedTime(pid,mid,t){ addMedTimeManual(pid,mid); }
function toggleMedTime(pid,mid,idx){ setMedSlotStatus(pid,mid,idx,'given'); }

function setSSSFreq(pid,n){
  const p=patients.find(x=>x.id===pid);
  p.sections.sss.freq=n;
  const times=[];
  const interval=Math.round(24*60/n);
  for(let i=0;i<n;i++){
    const mins=6*60+i*interval;
    times.push(String(Math.floor((mins%1440)/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0'));
  }
  p.sections.sss.times=times;
  if(!p.sections.sss.observations) p.sections.sss.observations=[];
  save();render();
}
function toggleSSSPicker(pid,time,pickerId){
  const el=document.getElementById(pickerId);
  if(!el) return;
  const isOpen=el.style.display!=='none';
  document.querySelectorAll('.nudge-popup').forEach(p=>p.style.display='none');
  el.style.display=isOpen?'none':'flex';
}
function setSSSObsStatus(pid,time,status){
  const p=patients.find(x=>x.id===pid);
  if(!p.sections.sss.observations) p.sections.sss.observations=[];
  const obs=p.sections.sss.observations;
  const idx=obs.findIndex(o=>o.time===time);
  const dt=status!=='pending'?fmtDT(Date.now()):'';
  if(idx>=0){obs[idx].done=(status==='done');obs[idx].status=status;obs[idx].dt=dt;}
  else obs.push({time,done:(status==='done'),status,dt});
  document.querySelectorAll('.nudge-popup').forEach(p=>p.style.display='none');
  save();render();
}
function nudgeSSSTime(pid,idx,deltaMin){
  const p=patients.find(x=>x.id===pid);
  const [h,m]=p.sections.sss.times[idx].split(':').map(Number);
  const total=(h*60+m+deltaMin+1440)%1440;
  p.sections.sss.times[idx]=String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0');
  document.querySelectorAll('.nudge-popup').forEach(p=>p.style.display='none');
  save();render();
}
function removeSSSTime(pid,idx){
  const p=patients.find(x=>x.id===pid);
  p.sections.sss.times.splice(idx,1);
  document.querySelectorAll('.nudge-popup').forEach(p=>p.style.display='none');
  save();render();
}
function addSSSManualTime(pid){
  openTimePicker(function(t){
    const p=patients.find(x=>x.id===pid);
    if(!p.sections.sss.times.includes(t)){
      p.sections.sss.times.push(t);
      p.sections.sss.times.sort();
    }
    save();render();
  });
}
function setSSSScore(pid,field,val){
  const p=patients.find(x=>x.id===pid);
  p.sections.sss.scores[field]=Number(val); save();render();
}
function saveSSSSnapshot(pid){
  const p=patients.find(x=>x.id===pid);
  const total=Object.values(p.sections.sss.scores).reduce((a,b)=>a+Number(b),0);
  if(!p.sections.sss.history)p.sections.sss.history=[];
  const now=new Date();
  p.sections.sss.history.push({time:now.getHours()+':'+String(now.getMinutes()).padStart(2,'0'),score:total});
  save();render();
}

function setICHInterval(pid,interval){
  const p=patients.find(x=>x.id===pid);
  p.sections.ich.interval=interval;
  save();render();
}
function setGCS(pid, component, val){
  const p=patients.find(x=>x.id===pid);
  if(component==='eye')    p.sections.ich.gcsEye    = val;
  if(component==='verbal') p.sections.ich.gcsVerbal = val;
  if(component==='motor')  p.sections.ich.gcsMotor  = val;
  save();render();
}
function setICHScore(pid,field,val){
  const p=patients.find(x=>x.id===pid);
  p.sections.ich.scores = p.sections.ich.scores||{};
  p.sections.ich.scores[field]=Number(val); save();render();
}
function toggleICHObs(pid,time){
  const p=patients.find(x=>x.id===pid);
  if(!p.sections.ich.observations)p.sections.ich.observations=[];
  const obs=p.sections.ich.observations;
  const idx=obs.findIndex(o=>o.time===time);
  if(idx>=0)obs[idx].done=!obs[idx].done;
  else obs.push({time,done:true});
  save();render();
}
function toggleICHObsWithDT(pid,time){
  const p=patients.find(x=>x.id===pid);
  if(!p.sections.ich.observations)p.sections.ich.observations=[];
  const obs=p.sections.ich.observations;
  const idx=obs.findIndex(o=>o.time===time);
  const dt=fmtDT(Date.now());
  if(idx>=0){
    obs[idx].done=!obs[idx].done;
    if(obs[idx].done) obs[idx].dt=dt; else obs[idx].dt='';
  } else {
    obs.push({time,done:true,dt});
  }
  save();render();
}
function addICHManualTime(pid){
  openTimePicker(function(t){
    const p=patients.find(x=>x.id===pid);
    if(!p.sections.ich.manualTimes) p.sections.ich.manualTimes=[];
    if(!p.sections.ich.manualTimes.includes(t)) p.sections.ich.manualTimes.push(t);
    save();render();
  });
}
function removeICHManualTime(pid,time){
  const p=patients.find(x=>x.id===pid);
  p.sections.ich.manualTimes=(p.sections.ich.manualTimes||[]).filter(t=>t!==time);
  p.sections.ich.observations=(p.sections.ich.observations||[]).filter(o=>o.time!==time);
  save();render();
}
function saveICHSnapshot(pid){
  const p=patients.find(x=>x.id===pid);
  const eye=Number(p.sections.ich.gcsEye??4);
  const verbal=Number(p.sections.ich.gcsVerbal??5);
  const motor=Number(p.sections.ich.gcsMotor??6);
  const total=eye+verbal+motor;
  if(!p.sections.ich.history)p.sections.ich.history=[];
  const d=new Date();
  const timeStr=d.toLocaleDateString('da-DK',{day:'2-digit',month:'2-digit'})+' '+
    d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
  p.sections.ich.history.push({time:timeStr,score:`E${eye}+V${verbal}+M${motor}=${total}`});
  save();render();
}

function setTromb(pid,field,val){
  const p=patients.find(x=>x.id===pid); p.sections.tromb[field]=val; save();render();
}
function setTrombObsStatus(pid,time,done){
  const p=patients.find(x=>x.id===pid);
  if(!p.sections.tromb.observations)p.sections.tromb.observations=[];
  const obs=p.sections.tromb.observations;
  const idx=obs.findIndex(o=>o.time===time);
  if(idx>=0)obs[idx].done=done;
  else obs.push({time,done});
  document.querySelectorAll('.nudge-popup').forEach(el=>el.style.display='none');
  save();render();
}

function toggleTrombObs(pid,time){
  const p=patients.find(x=>x.id===pid);
  if(!p.sections.tromb.observations)p.sections.tromb.observations=[];
  const obs=p.sections.tromb.observations;
  const idx=obs.findIndex(o=>o.time===time);
  if(idx>=0)obs[idx].done=!obs[idx].done;
  else obs.push({time,done:true});
  save();render();
}

function getAutoTeamForRoom(room){
  if(!room) return null;
  // Normaliser: tag kun stue-nummeret ud
  const m = room.match(/(\d+)/);
  if(!m) return null;
  const stuenr = parseInt(m[1]);
  if(stuenr === 10) return 'Obs10';
  if(stuenr === 5)  return 'Obs5';
  return null;
}

function addPatient(){
  const name=document.getElementById('mName').value.trim();
  const room=document.getElementById('mRoom').value.trim();
  const diag=document.getElementById('mDiag').value.trim();

  if(!name && !room){
    const nameField = document.getElementById('mName');
    nameField.style.borderColor = 'var(--red)';
    nameField.placeholder = '⚠ Navn eller stue skal udfyldes';
    nameField.focus();
    setTimeout(()=>{ nameField.style.borderColor=''; nameField.placeholder='F.eks. Per Jensen'; }, 3000);
    return;
  }

  const displayName = name || (room ? 'Patient · '+room : 'Unavngivet patient');

  if(room){
    const existing = checkRoomConflict(room, null);
    if(existing.length > 0){
      if(!confirm(`⚠ ${existing.map(o=>o.name).join(', ')} er allerede registreret på ${room}.\n\nVil du fortsætte med at tilføje denne patient alligevel?`)){
        return;
      }
    }
  }

  // Auto-tildel team baseret på stue
  const autoTeam = getAutoTeamForRoom(room);
  const team = autoTeam || modalTeam;

  try {
    const secs = defaultSections();
    MODAL_SEC_DEFS.forEach(sd=>{
      const st = modalSecState[sd.key];
      if(!st) return;
      if(secs[sd.key]) secs[sd.key].enabled = st.enabled;
      if(secs[sd.key] && secs[sd.key].tasks){
        secs[sd.key].tasks.forEach(t=>{
          if(st.tasks && st.tasks.hasOwnProperty(t.label)) t.enabled = st.tasks[t.label];
        });
      }
    });
    patients.push({id:uid(),name:displayName,room,diag,team,open:true,customizeOpen:false,sections:secs});
    save();
  } catch(e) {
    console.error('addPatient error:', e);
    alert('Fejl ved oprettelse: ' + e.message);
    return;
  }

  closeModal();
  try {
    render();
  } catch(e) {
    console.error('render error after addPatient:', e);
    window.location.reload();
  }
}
function setPatientTeam(pid, team){
  const p = patients.find(x=>x.id===pid);
  if(p){ p.team = team; save(); render(); }
}

function toggleSelectPatient(e, pid){
  if(e) e.stopPropagation();
  if(selectedPatients.has(pid)) selectedPatients.delete(pid);
  else selectedPatients.add(pid);
  const cnt = document.getElementById('selectCount');
  if(cnt) cnt.textContent = selectedPatients.size + ' / ' + getFilteredPatients().length + ' valgt';
  render();
}

function markAnkomst(pid,idx,done){
  const p=patients.find(x=>x.id===pid);
  const item=p.sections.ankomst.items[idx];
  item.done=done;
  if(done && !item.createdAt) item.createdAt=fmtDT(Date.now());
  if(done) item.completedAt=fmtDT(Date.now());
  else item.completedAt='';
  save();render();
}
function setAnkomstPrio(pid,idx,prio){
  const p=patients.find(x=>x.id===pid);
  p.sections.ankomst.items[idx].priority=prio;
  if(!p.sections.ankomst.items[idx].createdAt) p.sections.ankomst.items[idx].createdAt=fmtDT(Date.now());
  save();render();
}
function setAnkomstNote(pid,idx,val){
  const p=patients.find(x=>x.id===pid);
  p.sections.ankomst.items[idx].note=val;
  save();
}
function setAnkomstDT(pid,idx,field,val){
  const p=patients.find(x=>x.id===pid);
  if(p.sections.ankomst.items[idx]) p.sections.ankomst.items[idx][field]=val;
  save();render();
}
function toggleAnkomstNote(id){
  const el=document.getElementById(id);
  if(el){ el.style.display=el.style.display==='none'?'block':'none'; }
}

function addPrioritItem(pid){
  const inp  = document.getElementById('pnew-'+pid);
  const sel  = document.getElementById('pnewprio-'+pid);
  const time = document.getElementById('pnewtime-'+pid);
  if(!inp || !inp.value.trim()) return;
  const p = patients.find(x=>x.id===pid); if(!p) return;
  if(!p.sections.prioritering.items) p.sections.prioritering.items=[];
  p.sections.prioritering.items.push({
    id:uid(), label:inp.value.trim(), done:false,
    priority: sel ? sel.value : 'yellow',
    time: time ? time.value : '',
    note:'', createdAt:fmtDT(Date.now()), completedAt:''
  });
  inp.value='';
  if(time) time.value='';
  _lastSyncStr = JSON.stringify(patients);
  _lastSaveTime = Date.now();
  save(); render();
}
function resetPrioritSection(pid){
  const p = patients.find(x=>x.id===pid); if(!p) return;
  if(!confirm('Nulstil prioriteringslisten? Alle udførte opgaver fjernes.')) return;
  p.sections.prioritering.items = (p.sections.prioritering.items||[]).filter(x=>!x.done);
  save(); render();
}

function removePrioritItem(pid,idx){
  const p=patients.find(x=>x.id===pid);
  p.sections.prioritering.items.splice(idx,1);
  save();render();
}
function markPrioritDone(pid,idx,done){
  const p=patients.find(x=>x.id===pid);
  const item=p.sections.prioritering.items[idx];
  item.done=done;
  item.completedAt=done?fmtDT(Date.now()):'';
  save();render();
}
function setPrioritPrio(pid,idx,prio){
  const p=patients.find(x=>x.id===pid);
  p.sections.prioritering.items[idx].priority=prio;
  save();render();
}
function setPrioritNote(pid,idx,val){
  const p=patients.find(x=>x.id===pid);
  p.sections.prioritering.items[idx].note=val;
  save();
}
function setPrioritDT(pid,idx,field,val){
  const p=patients.find(x=>x.id===pid);
  if(p.sections.prioritering.items[idx]) p.sections.prioritering.items[idx][field]=val;
  save();render();
}

function checkRoomConflict(room, excludePid){
  if(!room) return [];
  return patients.filter(p=>p.id!==excludePid && p.room===room);
}

function updatePatientField(pid, field, val){
  const p = patients.find(x=>x.id===pid);
  if(!p) return;
  p[field] = val;
  if(field === 'room' && val){
    const conf = document.getElementById('roomconf-'+pid);
    const others = checkRoomConflict(val, pid);
    if(conf){
      if(others.length>0){
        conf.style.display='block';
        conf.innerHTML = `<div class="room-conflict">⚠ ${others.map(o=>o.name).join(', ')} er allerede på denne stue</div>`;
      } else { conf.style.display='none'; }
    }
  }
  save(); renderNavBar(); renderSidebar();
}

function showUndoToast(msg){
  let toast = document.getElementById('undoToast');
  if(!toast){
    toast = document.createElement('div');
    toast.id = 'undoToast';
    toast.style.cssText = 'position:fixed;bottom:24px;right:16px;z-index:999;background:var(--s1);border:1px solid var(--border2);border-radius:10px;padding:12px 14px;font-size:12px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.5);display:flex;align-items:center;gap:10px;max-width:320px;transition:opacity .3s';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span style="color:var(--muted2)">${msg}</span>
    <button onclick="undoLastAction()" style="background:var(--blue);color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0">↩ Fortryd</button>
    <button onclick="document.getElementById('undoToast').style.opacity='0'" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;padding:0 2px">✕</button>`;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>{ toast.style.opacity='0'; }, 10*60*1000); // 10 minutter
}

function undoLastAction(){
  if(_undoStack.length === 0){ alert('Ingen undo tilgængeligt'); return; }
  patients = _undoStack.pop();
  save(); render();
  const toast = document.getElementById('undoToast');
  if(toast) toast.style.opacity = '0';
  showPrioToast('Handling fortrudt ✓', 'green');
}

function showLogTab(n){
  [1,2,3].forEach(i=>{
    const panel = document.getElementById('logPanel'+i);
    const tab   = document.getElementById('logTab'+i);
    if(panel) panel.style.display = i===n ? 'block' : 'none';
    if(tab) tab.style.cssText = tab.style.cssText.replace(
      /border-bottom:[^;]+/,
      `border-bottom:2.5px solid ${i===n ? 'var(--blue)' : 'transparent'}`
    );
    if(tab) tab.style.color = i===n ? 'var(--text)' : 'var(--muted2)';
  });
  if(n===1) loadActivityLog();
  if(n===2) loadBackupList();
  if(n===3) loadArchive();
}

function changeActorName(){
  const name = prompt('Dit navn i loggen:', _actorName||'');
  if(name !== null){
    _actorName = name.trim() || 'Ukendt';
    localStorage.setItem('kp2_actor', _actorName);
    const el = document.getElementById('logActorName');
    if(el) el.textContent = '👤 ' + _actorName;
  }
}

function openLogView(){
  const el = document.getElementById('logActorName');
  if(el) el.textContent = '👤 ' + (_actorName||'Klik for at sætte dit navn');
  document.getElementById('logModal').classList.add('open');
  showLogTab(1);
}
function closeLogView(){
  document.getElementById('logModal').classList.remove('open');
}

function logTaskDone(pid, label, done){
  if(!_actorName) return;
  logActivity(done ? 'markerede udført' : 'annullerede udført', label, pid);
}

function removePt(id){
  if(!confirm('Fjern patient? Data arkiveres og kan gendannes.')) return;
  snapshotForUndo();
  const p = patients.find(x=>x.id===id);
  const name = p ? p.name : id;
  if(_fbDb && p){
    fetch(_fbDb.url(`/kp2/archive/${id}`), {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({...p, archivedAt: fmtDT(Date.now()), archivedBy: _actorName||'Ukendt'})
    }).catch(()=>{});
  }
  logActivity('slettet patient', name, id);
  patients = patients.filter(p=>p.id!==id);
  save();render();
  showUndoToast(`Patient "${name}" fjernet`);
}

function renderSummary(){
  let done=0,soon=0,over=0,total=0;
  patients.forEach(p=>{
    getAllTasks(p).forEach(t=>{
      total++;
      if(t.done)done++;
      else if(t.status==='upcoming')soon++;
      else if(t.status==='overdue')over++;
    });
  });
  document.getElementById('sumRow').innerHTML=`
    <div class="sum-chip sum-green">✓ ${done} Udført</div>
    <div class="sum-chip sum-yellow">⏰ ${soon} Snart</div>
    <div class="sum-chip sum-red">✗ ${over} Ikke gjort</div>
    <div class="sum-chip sum-blue">📋 ${patients.length} Patienter</div>
  `;
}

const MODAL_SEC_DEFS = [
  {key:'ankomst', icon:'🏥', title:'Ankomststatus', tasks:[]},
  {key:'prioritering',icon:'⚡', title:'Prioriteringsliste', tasks:[]},
  {key:'vaske',  icon:'🚿', title:'Personlig hygiejne',
   tasks:['Vask af hoved','Vask af overkrop','Vask af nedre','Fuld vask','Mundpleje','Positionering / lejeskifte','Tryk-sår inspektion']},
  {key:'kost',   icon:'🍽️', title:'Ernæring',
   tasks:['Morgenmad','Frokost','Aftensmad','Mellemmåltid','Mellemmåltid aften','Drikkeprotokol (ml/dag)']},
  {key:'medicin',icon:'💊', title:'Medicin', tasks:[]},
  {key:'bleskift',icon:'🔄', title:'Bleskift', tasks:[]},
  {key:'td',     icon:'🧪', title:'Time Diurese (TD)', tasks:[]},
  {key:'sik',    icon:'💉', title:'SIK', tasks:[]},
  {key:'sss',    icon:'🧠', title:'SSS', tasks:[]},
  {key:'ich',    icon:'🩻', title:'ICH Målinger', tasks:[]},
  {key:'tromb',  icon:'🩺', title:'Trombolyse / EVT', tasks:[]},
  {key:'ekstra', icon:'📋', title:'Øvrige opgaver', tasks:[]},
  {key:'plejeplan',icon:'📝', title:'Plejeforløbsplan',
   tasks:['Indlæggelsessamtale gennemført','Plejebehov vurderet (ADL)','Ernæringsscreening (NRS 2002)','Tryksårsvurdering (Braden)','Faldrisiko vurderet','Smerteregistrering (VAS/NRS)','Pårørende kontaktet / informeret','Rehabiliteringsmål aftalt','Udskrivningsplan påbegyndt','Tværfaglig konference']},
];
let modalSecState = {};

function initModalState(){
  modalSecState = {};
  MODAL_SEC_DEFS.forEach(sd=>{
    modalSecState[sd.key] = { enabled:true, tasks:Object.fromEntries(sd.tasks.map(t=>[t,true])) };
  });
}

function renderModalSections(){
  const el = document.getElementById('mSecList');
  if(!el) return;
  el.innerHTML = MODAL_SEC_DEFS.map(sd=>{
    const st = modalSecState[sd.key];
    const en = st.enabled;
    const hasTasks = sd.tasks.length > 0;
    return `
    <div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;${hasTasks&&en?'margin-bottom:8px':''}">
        <div style="display:flex;align-items:center;gap:7px">
          <span>${sd.icon}</span>
          <span style="font-size:13px;font-weight:600;${!en?'opacity:.4':''}">${sd.title}</span>
        </div>
        <label class="tog-wrap">
          <input type="checkbox" ${en?'checked':''} class="tog-inp" onchange="toggleModalSec('${sd.key}',this.checked)"/>
          <span class="tog-slider"></span>
        </label>
      </div>
      ${hasTasks && en ? `
      <div style="display:flex;flex-direction:column;gap:3px">
        ${sd.tasks.map(t=>`
        <div style="display:flex;align-items:center;justify-content:space-between;padding:3px 8px;background:var(--s3);border-radius:6px;">
          <span style="font-size:12px;${!st.tasks[t]?'opacity:.4':''}">${t}</span>
          <label class="tog-wrap tog-sm">
            <input type="checkbox" ${st.tasks[t]?'checked':''} class="tog-inp"
              onchange="toggleModalTask('${sd.key}',${JSON.stringify(t)},this.checked)"/>
            <span class="tog-slider"></span>
          </label>
        </div>`).join('')}
      </div>` : ''}
    </div>`;
  }).join('');
}

function toggleModalSec(key,val){ modalSecState[key].enabled=val; renderModalSections(); }
function toggleModalTask(key,lbl,val){ modalSecState[key].tasks[lbl]=val; renderModalSections(); }

function renderRoomPicker(){
  const grid = document.getElementById('roomPickerGrid');
  if(!grid) return;
  const currentVal = document.getElementById('mRoom').value;
  grid.innerHTML = ROOMS.map(r => {
    return r.senge.map(s => {
      const label = `Stue ${r.stue} / Seng ${s}`;
      const isActive = currentVal === label;
      return `<button class="room-btn ${isActive?'active':''}" onclick="selectRoom('${label}')"
        title="${label}">
        <span class="room-num">${r.stue}</span>
        <span class="room-seng">Seng ${s}</span>
      </button>`;
    }).join('');
  }).join('');
}

function toggleRoomPicker(){
  const panel = document.getElementById('roomPickerPanel');
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if(!isOpen) renderRoomPicker();
}

function selectRoom(label){
  document.getElementById('mRoom').value = label;
  document.getElementById('roomPickerPanel').style.display = 'none';
  renderRoomPicker();
}

function openModal(){
  initModalState();
  modalTeam = null;
  ['none','A','B','C'].forEach(t => {
    const el = document.getElementById('mteam-'+t);
    if(el) el.className = 'team-tab' + (t==='none'?' active-all':'');
  });
  const rpp = document.getElementById('roomPickerPanel');
  if(rpp) rpp.style.display='none';
  document.getElementById('modalOv').classList.add('open');
  renderModalSections();
  setTimeout(()=>document.getElementById('mName').focus(),50);
}
function closeModal(){
  document.getElementById('modalOv').classList.remove('open');
  ['mName','mRoom','mDiag'].forEach(id=>document.getElementById(id).value='');
  const rpp = document.getElementById('roomPickerPanel');
  if(rpp) rpp.style.display='none';
  modalTeam = null;
}
function closeIfOut(e){ if(e.target===document.getElementById('modalOv')) closeModal(); }
document.getElementById('mName').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('mRoom').focus();});
document.getElementById('mRoom').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('mDiag').focus();});
document.getElementById('mDiag').addEventListener('keydown',e=>{if(e.key==='Enter')addPatient();});

function updateDate(){
  const d=new Date();
  document.getElementById('hdDate').textContent=d.toLocaleDateString('da-DK',{weekday:'short',day:'numeric',month:'short'})+' '+d.toLocaleTimeString('da-DK',{hour:'2-digit',minute:'2-digit'});
}
setInterval(()=>{ updateDate(); },30000);

let ppSelectedPts = new Set();
let ppVisibleSecs = new Set(['vaske','kost','medicin','sss','ich','tromb','ekstra','plejeplan']);

const PP_SECS = [
  {key:'vaske',   label:'🚿 Hygiejne'},
  {key:'kost',    label:'🍽️ Ernæring'},
  {key:'medicin', label:'💊 Medicin'},
  {key:'sss',     label:'🧠 SSS'},
  {key:'ich',     label:'🩻 ICH'},
  {key:'tromb',   label:'🩺 Trombolyse'},
  {key:'ekstra',  label:'📋 Øvrige'},
  {key:'plejeplan',label:'📝 Plejeplan'},
];

function openPrintModal(){
  if(patients.length===0){ alert('Ingen patienter at udskrive.'); return; }
  ppSelectedPts = new Set(patients.map(p=>p.id));
  ppVisibleSecs = new Set(['vaske','kost','medicin','sss','ich','tromb','ekstra','plejeplan']);
  buildPrintPreview();
  document.getElementById('printPreview').classList.add('open');
}
function closePrintPreview(){
  document.getElementById('printPreview').classList.remove('open');
}
function togglePrintPt(id){
  if(ppSelectedPts.has(id)) ppSelectedPts.delete(id);
  else ppSelectedPts.add(id);
  buildPrintPreview();
}
function togglePrintSec(key){
  if(ppVisibleSecs.has(key)) ppVisibleSecs.delete(key);
  else ppVisibleSecs.add(key);
  buildPrintPreview();
}

function buildPrintPreview(){
  const dateStr = new Date().toLocaleDateString('da-DK',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const timeStr = new Date().toLocaleTimeString('da-DK',{hour:'2-digit',minute:'2-digit'});

  document.getElementById('ppTabs').innerHTML = patients.map(p=>`
    <div class="pp-tab ${ppSelectedPts.has(p.id)?'active':'inactive'}" onclick="togglePrintPt('${p.id}')">
      ${p.name}${p.room?' · '+p.room:''}
    </div>`).join('');

  document.getElementById('ppFilterBar').innerHTML = PP_SECS.map(s=>`
    <div class="pp-filter-chip ${ppVisibleSecs.has(s.key)?'on':''}" onclick="togglePrintSec('${s.key}')">${s.label}</div>
  `).join('');

  const toPrint = patients.filter(p=>ppSelectedPts.has(p.id));
  document.getElementById('ppScroll').innerHTML = toPrint.map((p,i)=>`
    <div style="position:relative">
      <div class="pp-page-label">Side ${i+1} — ${p.name}</div>
      ${buildPPPage(p, dateStr, timeStr)}
    </div>
  `).join('') || '<div style="color:#888;padding:40px;text-align:center">Ingen patienter valgt</div>';
}

function buildPPPage(p, dateStr, timeStr){
  const s = p.sections;
  let content = '';

  if(ppVisibleSecs.has('vaske') && s.vaske.enabled!==false){
    const tasks = s.vaske.tasks.filter(t=>t.enabled!==false);
    if(tasks.length){
      content += `<div class="pp-sec">
        <div class="pp-sec-title">🚿 Personlig hygiejne</div>
        ${tasks.map(t=>ppTask(t)).join('')}
      </div>`;
    }
  }

  if(ppVisibleSecs.has('kost') && s.kost.enabled!==false){
    const hasKost = s.kost.kostType || s.kost.sonde || s.kost.tasks.some(t=>t.done||t.status!=='pending');
    if(hasKost){
      const sondeTimes = s.kost.sonde
        ? (s.kost.sondeTimes?.length ? s.kost.sondeTimes : TIME_SUGGESTIONS[Math.min(parseInt(s.kost.sondeFreq)||1,6)]||['08:00'])
        : [];
      content += `<div class="pp-sec">
        <div class="pp-sec-title">🍽️ Ernæring</div>
        ${s.kost.kostType?`<div class="pp-kost-badge">${s.kost.kostType}</div>`:''}
        ${s.kost.sonde?`<div class="pp-task">
          <div class="pp-box"></div>
          <div class="pp-task-lbl"><b>Sondeernæring</b> ${s.kost.sondeType||''} ${s.kost.sondeMl?s.kost.sondeMl+' ml':''} ${s.kost.sondeFreq?'· '+s.kost.sondeFreq+'×/dag':''}</div>
          ${sondeTimes.length?`<div class="pp-task-times">${sondeTimes.join(' · ')}</div>`:''}
        </div>`:''}
        ${s.kost.tasks.filter(t=>t.enabled!==false).map(t=>ppTask(t)).join('')}
      </div>`;
    }
  }

  if(ppVisibleSecs.has('medicin') && s.medicin.enabled!==false && s.medicin.items.length>0){
    const allTimes = [...new Set(s.medicin.items.flatMap(m=>m.times.map(ts=>ts.time)))].sort();
    content += `<div class="pp-sec">
      <div class="pp-sec-title">💊 Medicin</div>
      <table class="pp-med-tbl">
        <thead><tr>
          <th>Præparat</th>
          ${allTimes.map(t=>`<th style="text-align:center;min-width:36px">${t}</th>`).join('')}
          <th>Status</th>
        </tr></thead>
        <tbody>
          ${s.medicin.items.map((med,mi)=>{
            const idx = mi+1;
            const name = med.fromEPJ&&med.name ? med.name : `Medicin ${idx}`;
            const freqLbl = med.freqLabel ? ` <span style="font-size:9px;color:#6b7280">(${med.freqLabel})</span>` : '';
            const sepNote = med.seponeret ? `<div class="pp-med-sep">⛔ Seponeret ${med.seponeretatDT||''}</div>` : '';
            return `<tr style="${med.seponeret?'opacity:.5':''}">
              <td>${name}${freqLbl}${sepNote}${med.note?`<div style="font-size:9px;color:#888">📝 ${med.note}</div>`:''}</td>
              ${allTimes.map(t=>{
                const slot = med.times.find(ts=>ts.time===t);
                if(!slot) return `<td style="text-align:center;color:#ddd">–</td>`;
                const cls = slot.status==='given'?'given':slot.status==='notgiven'?'notgiven':slot.status==='delayed'?'delayed':'';
                const dtTip = slot.givenDT||slot.notgivenDT||'';
                return `<td style="text-align:center"><span class="pp-med-slot ${cls}" title="${dtTip}"></span>${dtTip?`<div style="font-size:7px;color:#888;margin-top:1px">${dtTip}</div>`:''}</td>`;
              }).join('')}
              <td style="font-size:9px;color:#666">${med.seponeret?'Seponeret':med.times.every(ts=>ts.status==='given')?'✓ Alt givet':''}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
  }

  if(ppVisibleSecs.has('sss') && s.sss.enabled!==false){
    const total = Object.values(s.sss.scores).reduce((a,b)=>a+Number(b),0);
    const label = total>=45?'Let stroke':total>=30?'Moderat stroke':'Svær stroke';
    content += `<div class="pp-sec">
      <div class="pp-sec-title">🧠 Skandinavisk Stroke Skala — Total: ${total}/58 · ${label}</div>
      <table class="pp-sss-tbl">
        <thead><tr>
          ${SSS_ITEMS.map(i=>`<th>${i.label}</th>`).join('')}
          <th>Total</th>
        </tr></thead>
        <tbody><tr>
          ${SSS_ITEMS.map(i=>`<td style="text-align:center;font-weight:600">${s.sss.scores[i.id]}</td>`).join('')}
          <td class="pp-sss-total" style="text-align:center">${total}</td>
        </tr></tbody>
      </table>
      ${s.sss.history?.length?`<div style="font-size:9px;color:#666;margin-top:4px">Historik: ${s.sss.history.map(h=>`${h.time}: ${h.score}`).join(' · ')}</div>`:''}
      <div style="font-size:9px;color:#888;margin-top:3px">Målinger: ${s.sss.times?.join(' · ')||''}</div>
    </div>`;
  }

  if(ppVisibleSecs.has('ich') && s.ich.enabled!==false){
    const ichTimes = genICHTimes(s.ich.interval||'60');
    const ichLabel = ICH_INTERVALS.find(iv=>iv.val===(s.ich.interval||'60'))?.label||'1 time';
    const gcsLbl = {2:'GCS 13–15',1:'GCS 5–12',0:'GCS 3–4'}[s.ich.scores.gcs]||'–';
    content += `<div class="pp-sec">
      <div class="pp-sec-title">🩻 ICH / BP / GCS Målinger — interval: ${ichLabel} · GCS: ${gcsLbl}</div>
      <div class="pp-ich-grid">
        ${ichTimes.map(t=>{
          const done=(s.ich.observations||[]).find(o=>o.time===t&&o.done);
          return `<div class="pp-ich-slot">
            <div class="pp-ich-tick ${done?'done':''}"></div>
            <span>${t}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  if(ppVisibleSecs.has('tromb') && s.tromb.enabled!==false && (s.tromb.given||s.tromb.evt)){
    content += `<div class="pp-sec">
      <div class="pp-sec-title">🩺 Trombolyse / EVT</div>
      <div class="pp-tromb-fields">
        ${s.tromb.given?`<div class="pp-tromb-f"><div class="pp-tromb-lbl">Trombolyse</div><div class="pp-tromb-val">✓ Givet</div></div>`:''}
        ${s.tromb.evt?`<div class="pp-tromb-f"><div class="pp-tromb-lbl">EVT</div><div class="pp-tromb-val">✓</div></div>`:''}
        ${s.tromb.time?`<div class="pp-tromb-f"><div class="pp-tromb-lbl">Tidspunkt</div><div class="pp-tromb-val">${s.tromb.time}</div></div>`:''}
        ${s.tromb.alteplase?`<div class="pp-tromb-f"><div class="pp-tromb-lbl">Alteplase</div><div class="pp-tromb-val">${s.tromb.alteplase}</div></div>`:''}
        ${s.tromb.notes?`<div class="pp-tromb-f"><div class="pp-tromb-lbl">Notat</div><div class="pp-tromb-val">${s.tromb.notes}</div></div>`:''}
      </div>
      <div style="font-size:9px;color:#888;margin-bottom:5px">Observationsplan post-trombolyse:</div>
      <div class="pp-ich-grid">
        ${['0:00','0:15','0:30','1:00','1:30','2:00','4:00','6:00','12:00','24:00'].map(t=>{
          const done=(s.tromb.observations||[]).find(o=>o.time===t&&o.done);
          return `<div class="pp-ich-slot"><div class="pp-ich-tick ${done?'done':''}"></div><span>+${t}t</span></div>`;
        }).join('')}
      </div>
    </div>`;
  }

  if(ppVisibleSecs.has('ekstra') && s.ekstra.enabled!==false && s.ekstra.tasks.length>0){
    content += `<div class="pp-sec">
      <div class="pp-sec-title">📋 Øvrige opgaver</div>
      ${s.ekstra.tasks.map(t=>ppTask(t)).join('')}
    </div>`;
  }

  if(ppVisibleSecs.has('plejeplan') && s.plejeplan?.enabled!==false && s.plejeplan?.tasks?.length){
    const active = s.plejeplan.tasks.filter(t=>t.enabled!==false);
    content += `<div class="pp-sec">
      <div class="pp-sec-title">📝 Plejeforløbsplan</div>
      ${active.map(t=>ppTask(t)).join('')}
    </div>`;
  }

  if(!content) content = '<div style="font-size:12px;color:#aaa;padding:16px 0">Ingen aktive sektioner at vise.</div>';

  return `
  <div class="pp-page">
    <div class="pp-hdr">
      <div>
        <div class="pp-pt-name">${p.name}</div>
        <div class="pp-pt-room">${p.room||'Ingen stue angivet'}</div>
        ${p.diag?`<div class="pp-pt-diag">${p.diag}</div>`:''}
      </div>
      <div class="pp-hdr-right">
        Udskrevet:<br>${dateStr}<br>${timeStr}<br>
        <span style="font-size:9px;color:#aaa">Klinisk Plejeplan</span>
      </div>
    </div>
    ${content}
    <div class="pp-footer">
      <div class="pp-sig"><div class="pp-sig-lbl">Udført af</div><div class="pp-sig-line"></div></div>
      <div class="pp-sig"><div class="pp-sig-lbl">Signatur</div><div class="pp-sig-line"></div></div>
      <div class="pp-sig"><div class="pp-sig-lbl">Dato / Tid</div><div class="pp-sig-line"></div></div>
    </div>
  </div>`;
}

function ppTask(t){
  const boxCls = t.done ? 'done' : t.status==='urgent' ? 'urgent' : t.status==='inprogress' ? 'inprog' : t.status==='overdue' ? 'notdone' : '';
  const lblCls = t.done ? 'done-lbl' : t.status==='urgent' ? 'urgent-lbl' : t.status==='inprogress' ? 'inprog-lbl' : '';
  const timesStr = t.times?.length ? t.times.join(' · ') : '';
  const countStr = t.count ? ` ${t.count}×` : '';
  const stBadge = t.done ? `<span class="pp-task-status pp-st-done">✓ Udført</span>`
    : t.status==='urgent'     ? `<span class="pp-task-status pp-st-urg">🚨 Haster</span>`
    : t.status==='inprogress' ? `<span class="pp-task-status pp-st-inp">▶ I gang</span>`
    : t.status==='overdue'    ? `<span class="pp-task-status pp-st-pend">✗ Ikke gjort</span>`
    : `<span class="pp-task-status pp-st-pend">—</span>`;
  return `<div class="pp-task">
    <div class="pp-box ${boxCls}"></div>
    <div class="pp-task-lbl"><span class="${lblCls}">${t.label}${countStr}</span></div>
    ${timesStr?`<div class="pp-task-times">${timesStr}</div>`:''}
    ${stBadge}
  </div>`;
}

function doPrint(){
  window.print();
}

function togglePrintSel(id,val){ val ? ppSelectedPts.add(id) : ppSelectedPts.delete(id); buildPrintPreview(); }
function openPrintModal2(){ openPrintModal(); } // alias

let nxConnected = false;
let nxQueue = [];

function nxSaveConfig(){
  localStorage.setItem('nx_url', document.getElementById('nxUrl').value);
  localStorage.setItem('nx_clientId', document.getElementById('nxClientId').value);
  localStorage.setItem('nx_location', document.getElementById('nxLocation').value);
  localStorage.setItem('nx_token', document.getElementById('nxToken').value);
}
function nxLoadConfig(){
  document.getElementById('nxUrl').value = localStorage.getItem('nx_url')||'';
  document.getElementById('nxClientId').value = localStorage.getItem('nx_clientId')||'';
  document.getElementById('nxLocation').value = localStorage.getItem('nx_location')||'';
  document.getElementById('nxToken').value = localStorage.getItem('nx_token')||'';
}
function nxClearConfig(){
  ['nx_url','nx_clientId','nx_location','nx_token'].forEach(k=>localStorage.removeItem(k));
  ['nxUrl','nxClientId','nxLocation','nxToken'].forEach(id=>document.getElementById(id).value='');
  nxSetConnected(false); nxAddLog('Konfiguration ryddet.');
}

function nxSetConnected(ok, err=false){
  nxConnected = ok;
  const badge=document.getElementById('nexusStatusBadge');
  const dot=document.getElementById('nexusDot');
  const imp=document.getElementById('nxImportSec');
  const syn=document.getElementById('nxSyncSec');
  if(ok){
    badge.className='nx-badge nx-on'; badge.textContent='● Forbundet';
    dot.style.background='var(--green)';
    imp.style.opacity='1'; imp.style.pointerEvents='auto';
    syn.style.opacity='1'; syn.style.pointerEvents='auto';
  } else if(err){
    badge.className='nx-badge nx-err'; badge.textContent='✕ Fejl';
    dot.style.background='var(--red)';
    imp.style.opacity='.4'; imp.style.pointerEvents='none';
    syn.style.opacity='.4'; syn.style.pointerEvents='none';
  } else {
    badge.className='nx-badge nx-off'; badge.textContent='Ikke forbundet';
    dot.style.background='var(--border2)';
    imp.style.opacity='.4'; imp.style.pointerEvents='none';
    syn.style.opacity='.4'; syn.style.pointerEvents='none';
  }
}

function nxAddLog(msg){
  const el=document.getElementById('nxLog');
  if(!el) return;
  const d=new Date();
  const ts=d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')+':'+d.getSeconds().toString().padStart(2,'0');
  const prev = el.innerHTML==='Ingen aktivitet endnu.'?'':el.innerHTML;
  el.innerHTML=`<span style="color:var(--teal)">[${ts}]</span> ${msg}<br>`+prev;
}

function nxShowMsg(el, txt, type){
  const c={success:'var(--green)',error:'var(--red)',warn:'var(--yellow)',info:'var(--muted2)'};
  el.style.display='block'; el.style.color=c[type]||c.info; el.textContent=txt;
}

async function nxTestConnection(){
  const url=document.getElementById('nxUrl').value.trim().replace(/\/$/,'');
  const token=document.getElementById('nxToken').value.trim();
  const msgEl=document.getElementById('nxConnMsg');
  if(!url){nxShowMsg(msgEl,'Indtast FHIR Base URL','error');return;}
  if(!token){nxShowMsg(msgEl,'Indtast Bearer Token','error');return;}
  nxShowMsg(msgEl,'Tester forbindelse...','info');
  nxAddLog(`Tester forbindelse til ${url}`);
  try {
    const resp=await fetch(`${url}/metadata`,{
      headers:{'Authorization':`Bearer ${token}`,'Accept':'application/fhir+json'}
    });
    if(resp.ok){
      const data=await resp.json();
      const ver=data.fhirVersion||'ukendt';
      nxShowMsg(msgEl,`✓ Forbundet! FHIR ${ver}`,'success');
      nxAddLog(`Forbundet — FHIR version ${ver}`);
      nxSetConnected(true); nxBuildSyncQueue();
    } else if(resp.status===401){
      nxShowMsg(msgEl,'⚠ Server nås men token afvist (401)','warn');
      nxAddLog('HTTP 401 — token afvist'); nxSetConnected(false,true);
    } else {
      nxShowMsg(msgEl,`✕ HTTP ${resp.status}`,'error');
      nxAddLog(`Fejl HTTP ${resp.status}`); nxSetConnected(false,true);
    }
  } catch(e){
    nxShowMsg(msgEl,'⚠ CORS-blokeret i browser — virker i Android-app. Konfigurer CORS på Nexus-server.','warn');
    nxAddLog('CORS-fejl (normal i browser — OK i native app)');
    nxSetConnected(true); nxBuildSyncQueue();
  }
}

async function nxImportPatients(){
  const url=document.getElementById('nxUrl').value.trim().replace(/\/$/,'');
  const token=document.getElementById('nxToken').value.trim();
  const loc=document.getElementById('nxLocation').value.trim();
  const spinner=document.getElementById('nxImportSpinner');
  const result=document.getElementById('nxImportResult');
  spinner.style.display='block';
  nxAddLog(`Henter patienter${loc?' fra afsnit '+loc:''}`);
  try {
    const q=loc?`?location=${encodeURIComponent(loc)}&_count=50`:'?_count=50';
    const resp=await fetch(`${url}/Patient${q}`,{
      headers:{'Authorization':`Bearer ${token}`,'Accept':'application/fhir+json'}
    });
    if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const bundle=await resp.json();
    const entries=bundle.entry||[];
    let imported=0;
    entries.forEach(entry=>{
      const pt=entry.resource; if(!pt) return;
      const name=[...(pt.name?.[0]?.given||[]),pt.name?.[0]?.family||''].join(' ').trim()||'Ukendt';
      const ptId=pt.id;
      if(!patients.find(p=>p.nexusId===ptId)){
        patients.push({id:uid(),name,room:'',diag:'',nexusId:ptId,open:false,customizeOpen:false,sections:defaultSections()});
        imported++;
      }
    });
    save(); render();
    result.style.display='block';
    result.style.color=imported>0?'var(--green)':'var(--muted)';
    result.textContent=imported>0?`✓ ${imported} patient(er) importeret`:`Ingen nye (${entries.length} fundet)`;
    nxAddLog(`Importerede ${imported} af ${entries.length} patienter`);
  } catch(e){
    result.style.display='block'; result.style.color='var(--yellow)';
    result.textContent=`Demo/CORS: ${e.message}. Virker i Android-appen.`;
    nxAddLog(`Import fejl: ${e.message}`);
  }
  spinner.style.display='none';
}

function nxBuildSyncQueue(){
  const listEl=document.getElementById('nxSyncList'); if(!listEl) return;
  nxQueue=[];
  patients.forEach(p=>{
    if(p.sections.sss.enabled!==false){
      const tot=Object.values(p.sections.sss.scores).reduce((a,b)=>a+Number(b),0);
      nxQueue.push({pid:p.id,type:'sss',label:`${p.name} — SSS: ${tot}`,resource:'Observation',status:'pending'});
    }
    if(p.sections.ich.enabled!==false&&p.sections.ich.observations?.some(o=>o.done)){
      nxQueue.push({pid:p.id,type:'ich',label:`${p.name} — ICH/BP (${p.sections.ich.observations.filter(o=>o.done).length} udført)`,resource:'Observation',status:'pending'});
    }
    const doneTasks=[...p.sections.vaske.tasks,...p.sections.kost.tasks,...p.sections.ekstra.tasks].filter(t=>t.done&&t.enabled!==false);
    if(doneTasks.length) nxQueue.push({pid:p.id,type:'tasks',label:`${p.name} — ${doneTasks.length} opgave(r) udført`,resource:'Procedure',status:'pending'});
    if(p.sections.tromb.given||p.sections.tromb.evt)
      nxQueue.push({pid:p.id,type:'tromb',label:`${p.name} — Trombolyse${p.sections.tromb.time?' '+p.sections.tromb.time:''}`,resource:'MedicationAdministration',status:'pending'});
    const givenMeds=p.sections.medicin.items.filter(m=>m.times.some(t=>t.given));
    if(givenMeds.length) nxQueue.push({pid:p.id,type:'medicin',label:`${p.name} — ${givenMeds.length} præparat(er) givet`,resource:'MedicationAdministration',status:'pending'});
  });
  listEl.innerHTML=nxQueue.length===0
    ?'<div style="font-size:12px;color:var(--muted)">Ingen afventende — udfyld data og marker opgaver som udført.</div>'
    :nxQueue.map((item,i)=>`<div class="nx-sync-row">
        <div><div class="nx-sync-label">${item.label}</div>
        <div style="font-size:10px;color:var(--muted)">FHIR: ${item.resource}</div></div>
        <span class="nx-sync-status nx-pending" id="nxsi-${i}">Afventer</span>
      </div>`).join('');
}

async function nxSyncAll(){
  const url=document.getElementById('nxUrl').value.trim().replace(/\/$/,'');
  const token=document.getElementById('nxToken').value.trim();
  const msgEl=document.getElementById('nxSyncMsg');
  if(!nxQueue.length){nxShowMsg(msgEl,'Ingen afventende synkroniseringer.','info');return;}
  nxShowMsg(msgEl,'Synkroniserer...','info');
  nxAddLog(`Starter synk af ${nxQueue.length} post(er)`);
  let ok=0,fail=0;
  for(let i=0;i<nxQueue.length;i++){
    const item=nxQueue[i];
    const statusEl=document.getElementById(`nxsi-${i}`);
    const p=patients.find(x=>x.id===item.pid); if(!p) continue;
    try {
      const resp=await fetch(`${url}/${item.resource}`,{
        method:'POST',
        headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/fhir+json'},
        body:JSON.stringify(nxBuildFhirResource(item,p))
      });
      if(resp.ok||resp.status===201){
        if(statusEl){statusEl.className='nx-sync-status nx-sent';statusEl.textContent='✓ Sendt';}
        nxAddLog(`✓ ${item.label}`); ok++;
      } else throw new Error(`HTTP ${resp.status}`);
    } catch(e){
      if(statusEl){statusEl.className='nx-sync-status nx-fail';statusEl.textContent='✕ Fejl';}
      nxAddLog(`✕ ${item.label}: ${e.message}`); fail++;
    }
  }
  nxShowMsg(msgEl,fail===0?`✓ ${ok} post(er) sendt`:`${ok} sendt · ${fail} fejlede`,fail===0?'success':'warn');
}

function nxBuildFhirResource(item,p){
  const ref=p.nexusId?`Patient/${p.nexusId}`:'Patient/unknown';
  const now=new Date().toISOString();
  if(item.type==='sss'){
    const tot=Object.values(p.sections.sss.scores).reduce((a,b)=>a+Number(b),0);
    return {resourceType:'Observation',status:'final',
      code:{coding:[{system:'http://snomed.info/sct',code:'450743000',display:'Scandinavian Stroke Scale score'}]},
      subject:{reference:ref},effectiveDateTime:now,
      valueQuantity:{value:tot,unit:'score'},
      component:Object.entries(p.sections.sss.scores).map(([k,v])=>({
        code:{display:SSS_ITEMS.find(s=>s.id===k)?.label||k},valueInteger:Number(v)
      }))};
  }
  if(item.type==='ich') return {resourceType:'Observation',status:'final',
    code:{coding:[{display:'ICH monitoring BP/GCS'}]},subject:{reference:ref},effectiveDateTime:now,
    valueInteger:p.sections.ich.scores.gcs,
    note:[{text:`Udførte målinger: ${(p.sections.ich.observations||[]).filter(o=>o.done).map(o=>o.time).join(', ')}`}]};
  if(item.type==='tasks'){
    const done=[...p.sections.vaske.tasks,...p.sections.kost.tasks,...p.sections.ekstra.tasks].filter(t=>t.done&&t.enabled!==false);
    return {resourceType:'Procedure',status:'completed',subject:{reference:ref},performedDateTime:now,
      note:[{text:`Plejeopgaver: ${done.map(t=>t.label).join(' · ')}`}]};
  }
  if(item.type==='tromb') return {resourceType:'MedicationAdministration',status:'completed',
    subject:{reference:ref},effectiveDateTime:now,
    medication:{concept:{coding:[{code:'B01AD02',display:'Alteplase'}]}},
    dosage:{text:p.sections.tromb.alteplase||'Se journal'},
    note:[{text:`Givet ${p.sections.tromb.time||'?'}. ${p.sections.tromb.notes||''}`}]};
  if(item.type==='medicin'){
    const given=p.sections.medicin.items.filter(m=>m.times.some(t=>t.given));
    return {resourceType:'MedicationAdministration',status:'completed',
      subject:{reference:ref},effectiveDateTime:now,
      note:[{text:`Givet: ${given.map(m=>m.name).join(', ')}`}]};
  }
  return {resourceType:'Basic',subject:{reference:ref}};
}

function openNexusPanel(){ nxLoadConfig(); document.getElementById('nexusOv').classList.add('open'); nxBuildSyncQueue(); }
function closeNexusPanel(){ document.getElementById('nexusOv').classList.remove('open'); }
function closeNexusIfOut(e){ if(e.target===document.getElementById('nexusOv'))closeNexusPanel(); }

let _timePickerCallback = null;

function openTimePicker(callback){
  _timePickerCallback = callback;
  const popup = document.getElementById('timePickerPopup');
  const inp = document.getElementById('timePickerInput');
  inp.value = nowHHMM();
  popup.classList.add('open');
  setTimeout(()=>inp.focus(), 50);
}
function confirmTimePicker(){
  const t = document.getElementById('timePickerInput').value;
  if(t && /^\d{2}:\d{2}$/.test(t) && _timePickerCallback){
    _timePickerCallback(t);
  }
  closeTimePicker();
}
function closeTimePicker(){
  document.getElementById('timePickerPopup').classList.remove('open');
  _timePickerCallback = null;
}
document.addEventListener('keydown', e=>{
  if(e.key==='Escape') closeTimePicker();
});

let _dtCallback = null;

function openDTE(el){ openDTEditor(el, el.dataset.dt||'', new Function('v', el.dataset.fn)); }

function openDTEditor(anchorEl, currentDT, callback){
  _dtCallback = callback;
  const popup = document.getElementById('dtEditorPopup');
  const input = document.getElementById('dtEditorInput');
  input.value = dtToInput(currentDT);
  popup.classList.add('open');
  if(anchorEl){
    const rect = anchorEl.getBoundingClientRect();
    const top = Math.min(rect.bottom + 6, window.innerHeight - 210);
    const left = Math.min(rect.left, window.innerWidth - 250);
    popup.style.top = top + window.scrollY + 'px';
    popup.style.left = left + 'px';
  }
  setTimeout(()=>input.focus(), 50);
}
function saveDTEditor(){
  const val = document.getElementById('dtEditorInput').value;
  const newDT = val ? inputToDT(val) : '';
  if(_dtCallback) _dtCallback(newDT);
  _dtCallback = null; closeDTEditor();
}
function clearDTEditor(){
  if(_dtCallback) _dtCallback('');
  _dtCallback = null; closeDTEditor();
}
function closeDTEditor(){
  document.getElementById('dtEditorPopup').classList.remove('open');
  _dtCallback = null;
}
document.addEventListener('click', e=>{
  if(!e.target.closest('#dtEditorPopup') && 
     !e.target.closest('.edt-ts') && 
     !e.target.closest('.edt-empty') &&
     !e.target.closest('.overlay') &&
     !e.target.closest('.modal') &&
     !e.target.closest('.btn') &&
     !e.target.closest('.task-row') &&
     !e.target.closest('.sec-body')){
    closeDTEditor();
  }
});

let _prioPickerPid = null;
let _prioPickerLabel = null;
function openAddPrioMenu(e, pid, label){
  e.stopPropagation();
  e.preventDefault();
  addToPriorityList(pid, label, 'yellow');
  const btn = e.target.closest('.add-prio-btn');
  if(btn){
    const orig = btn.innerHTML;
    btn.innerHTML = '✓';
    btn.style.background = 'var(--gbg)';
    btn.style.color = 'var(--green)';
    btn.style.borderColor = 'var(--gbrd)';
    setTimeout(()=>{
      btn.innerHTML = orig;
      btn.style.background = '';
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 1500);
  }
}

function confirmAddPrio(prio){
  if(_prioPickerPid && _prioPickerLabel){
    addToPriorityList(_prioPickerPid, _prioPickerLabel, prio);
  }
  closeAddPrioMenu();
}

function closeAddPrioMenu(){
  const popup = document.getElementById('addPrioPopup');
  if(popup) popup.style.display = 'none';
  _prioPickerPid = null;
  _prioPickerLabel = null;
}

document.addEventListener('click', e=>{
  if(Date.now() - _prioMenuOpenTime < 300) return;
  if(!e.target.closest('#addPrioPopup') && !e.target.closest('.add-prio-btn')){
    closeAddPrioMenu();
  }
});

function setMedSlotDT(pid,mid,idx,field,val){ const p=patients.find(x=>x.id===pid); const m=p.sections.medicin.items.find(m=>m.id===mid); if(m&&m.times[idx]) m.times[idx][field]=val; save();render(); }
function setMedSeponDT(pid,mid,val){ const p=patients.find(x=>x.id===pid); const m=p.sections.medicin.items.find(m=>m.id===mid); if(m) m.seponeretatDT=val; save();render(); }
function setSIKDT(pid,idx,field,val){ const p=patients.find(x=>x.id===pid); if(p.sections.sik.entries[idx]) p.sections.sik.entries[idx][field]=val; save();render(); }
function setBleskiftDT(pid,idx,val){ const p=patients.find(x=>x.id===pid); if(p.sections.bleskift.entries[idx]) p.sections.bleskift.entries[idx].doneAt=val; save();render(); }
function setTDEntryDT(pid,time,val){ const p=patients.find(x=>x.id===pid); const e=(p.sections.td.entries||[]).find(e=>e.time===time); if(e) e.recordedAt=val; save();render(); }
function setTaskSlotDT(pid,secKey,tid,idx,val){ const p=patients.find(x=>x.id===pid); const t=p.sections[secKey].tasks.find(x=>x.id===tid); if(t&&t.times[idx]&&typeof t.times[idx]==='object') t.times[idx].dt=val; save();render(); }
function setSSSObsDT(pid,time,val){ const p=patients.find(x=>x.id===pid); const o=(p.sections.sss.observations||[]).find(o=>o.time===time); if(o) o.dt=val; save();render(); }
function setICHObsDT(pid,time,val){ const p=patients.find(x=>x.id===pid); const o=(p.sections.ich.observations||[]).find(o=>o.time===time); if(o) o.dt=val; save();render(); }

render();
startSync();

if(localStorage.getItem('kp2_theme')==='light'){
  document.body.classList.add('light-mode');
  const btn = document.getElementById('themeBtn');
  if(btn) btn.textContent = '☀️';
}
if(localStorage.getItem('kp2_sidebar')==='right'){
  const layout = document.querySelector('.app-layout');
  if(layout) layout.classList.add('sidebar-right');
  const btn = document.getElementById('sidebarSideBtn');
  if(btn) btn.textContent = '▶';
}

if('serviceWorker' in navigator){
  const swCode = `
    const CACHE = 'kp2-v1';
    self.addEventListener('install', e => {
      e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/Patienttjek/'])));
      self.skipWaiting();
    });
    self.addEventListener('activate', e => {
      e.waitUntil(caches.keys().then(keys =>
        Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
      ));
      self.clients.claim();
    });
    self.addEventListener('fetch', e => {
      if(e.request.method !== 'GET') return;
      e.respondWith(
        fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        }).catch(() => caches.match(e.request))
      );
    });
  `;
  const swBlob = new Blob([swCode], {type:'application/javascript'});
  const swUrl = URL.createObjectURL(swBlob);
  navigator.serviceWorker.register(swUrl).catch(()=>{});
}

let _installPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _installPrompt = e;
  const banner = document.createElement('div');
  banner.id = 'installBanner';
  banner.style.cssText = `position:fixed;bottom:16px;left:50%;transform:translateX(-50%);
    z-index:999;background:var(--s1);border:1px solid var(--blue);border-radius:12px;
    padding:12px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 24px rgba(0,0,0,.5);
    font-size:12px;max-width:340px;width:calc(100% - 32px)`;
  banner.innerHTML = `
    <div style="font-size:28px">📱</div>
    <div style="flex:1">
      <div style="font-weight:700;color:var(--text)">Installer som app</div>
      <div style="color:var(--muted);font-size:11px">Åbn direkte fra hjemskærmen uden browser</div>
    </div>
    <button onclick="installPWA()" style="background:var(--blue);color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">Installer</button>
    <button onclick="document.getElementById('installBanner').remove()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;padding:0 2px">✕</button>`;
  document.body.appendChild(banner);
});

function installPWA(){
  if(!_installPrompt) return;
  _installPrompt.prompt();
  _installPrompt.userChoice.then(()=>{
    _installPrompt = null;
    const b = document.getElementById('installBanner');
    if(b) b.remove();
  });
}

document.addEventListener('click', e=>{
  const panel = document.getElementById('syncSettingsPanel');
  if(panel && panel.classList.contains('open') &&
     !e.target.closest('#syncSettingsPanel') &&
     !e.target.closest('[title="Synkroniseringsindstillinger"]')){
    panel.classList.remove('open');
  }
});
