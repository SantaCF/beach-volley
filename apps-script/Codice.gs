/**
 * Beach Volley tra colleghi: archivio dati dell'app.
 * Va incollato in Estensioni > Apps Script di un Google Foglio nuovo e pubblicato come "App web".
 * La guida passo passo è nel file LEGGIMI.md del repository.
 */

// Cambia questo PIN prima di pubblicare: serve per entrare nell'area admin dell'app.
const PIN_ADMIN = 'CAMBIAMI';

const FUSO = 'Europe/Rome';
const GIORNI_CHIUSURA = 2;
const RUOLI = ['gioco', 'guardo', 'post', 'no'];
const FOGLI = {
  Risposte: ['slot', 'persona', 'nome', 'cognome', 'ruolo', 'accompagnatori', 'dalle', 'alle', 'aggiornato'],
  Date: ['slot', 'impostazioni', 'aggiornato'],
  Campi: ['id', 'nome', 'indirizzo', 'campi', 'costo', 'tipo', 'nota', 'mappa']
};

// ---------- Da eseguire una volta a mano ----------
function inizializza() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(FOGLI).forEach(function (nome) {
    let sh = ss.getSheetByName(nome);
    if (!sh) sh = ss.insertSheet(nome);
    sh.getRange(1, 1, 1, FOGLI[nome].length).setValues([FOGLI[nome]]).setFontWeight('bold');
    sh.setFrozenRows(1);
  });
  const vuoto = ss.getSheetByName('Foglio1') || ss.getSheetByName('Sheet1');
  if (vuoto && ss.getSheets().length > 1) ss.deleteSheet(vuoto);
}

// ---------- Ingressi web ----------
function doGet(e) {
  const azione = (e && e.parameter && e.parameter.azione) || 'stato';
  if (azione === 'stato') return json(statoInCache());
  return json({ ok: true });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, errore: 'Richiesta non valida' }); }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return json({ ok: false, errore: 'Troppe richieste insieme, riprova tra poco' });
  try {
    let esito;
    if (body.azione === 'salva') esito = salva(body);
    else if (body.azione === 'admin') esito = admin(body);
    else esito = { ok: false, errore: 'Azione sconosciuta' };
    if (esito.ok) CacheService.getScriptCache().remove('stato');
    if (esito.ok && !esito.stato) esito.stato = stato();
    return json(esito);
  } catch (err) {
    return json({ ok: false, errore: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- Lettura ----------
function oggi() { return Utilities.formatDate(new Date(), FUSO, 'yyyy-MM-dd'); }

function righe(nome) {
  const sh = SpreadsheetApp.getActive().getSheetByName(nome);
  if (!sh) throw new Error('Manca la scheda "' + nome + '": esegui la funzione inizializza');
  const v = sh.getDataRange().getValues();
  const testa = v.shift();
  return { sh: sh, testa: testa, righe: v };
}

function testo(v) {
  if (v instanceof Date) return Utilities.formatDate(v, FUSO, 'yyyy-MM-dd');
  return v === null || v === undefined ? '' : String(v);
}

function stato() {
  const limite = aggiungiGiorni(oggi(), -70);
  const r = righe('Risposte');
  const risposte = r.righe.filter(function (x) { return testo(x[0]).slice(0, 10) >= limite; }).map(function (x) {
    return {
      slot: testo(x[0]), persona: testo(x[1]), nome: testo(x[2]), cognome: testo(x[3]), ruolo: testo(x[4]),
      acc: +x[5] || 0, dalle: x[6] === '' ? null : +x[6], alle: x[7] === '' ? null : +x[7]
    };
  });
  const date = {};
  righe('Date').righe.forEach(function (x) {
    if (testo(x[0]).slice(0, 10) < limite) return;
    try { date[testo(x[0])] = JSON.parse(x[1] || '{}'); } catch (err) { /* riga rovinata a mano: la ignoro */ }
  });
  const campi = righe('Campi').righe.filter(function (x) { return x[0] !== ''; }).map(function (x) {
    return { id: testo(x[0]), nome: testo(x[1]), indirizzo: testo(x[2]), campi: +x[3] || 1, costo: testo(x[4]), tipo: testo(x[5]), nota: testo(x[6]), mappa: testo(x[7]) };
  });
  return { ok: true, oggi: oggi(), risposte: risposte, date: date, campi: campi };
}

function statoInCache() {
  const cache = CacheService.getScriptCache();
  const c = cache.get('stato');
  if (c) return JSON.parse(c);
  const s = stato();
  const txt = JSON.stringify(s);
  if (txt.length < 95000) cache.put('stato', txt, 60);
  return s;
}

// ---------- Regole (le stesse dell'app) ----------
function aggiungiGiorni(s, n) {
  const p = s.split('-');
  const d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n));
  return d.toISOString().slice(0, 10);
}

function impostazioniDi(slot) {
  const r = righe('Date');
  for (let i = 0; i < r.righe.length; i++) {
    if (testo(r.righe[i][0]) === slot) {
      try { return { riga: i + 2, imp: JSON.parse(r.righe[i][1] || '{}') }; } catch (err) { return { riga: i + 2, imp: {} }; }
    }
  }
  return { riga: 0, imp: {} };
}

function aperte(slot, imp) {
  const data = slot.slice(0, 10);
  const o = oggi();
  if (imp.annullata) return false;
  if (data < o) return false;
  if (imp.iscrizioni === 'chiuse') return false;
  if (imp.iscrizioni === 'aperte') return true;
  return o <= aggiungiGiorni(data, -GIORNI_CHIUSURA);
}

// Evita che un testo venga letto dal Foglio come formula.
function sicuro(s, max) {
  s = String(s || '').trim().replace(/\s+/g, ' ').slice(0, max || 60);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function chiave(nome, cognome) {
  return (String(nome).trim().replace(/\s+/g, ' ') + '|' + String(cognome).trim().replace(/\s+/g, ' '))
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function slotValido(s) { return /^\d{4}-\d{2}-\d{2}-(M|P|S)$/.test(String(s)); }
function ora(v) { if (v === null || v === undefined || v === '') return ''; const n = Math.round(+v); return n >= 6 && n <= 23 ? n : ''; }

// ---------- Scrittura giocatore ----------
function salva(body) {
  const nome = sicuro(body.nome, 40), cognome = sicuro(body.cognome, 40);
  if (!nome || !cognome) return { ok: false, errore: 'Servono nome e cognome' };
  const persona = chiave(nome, cognome);
  const r = righe('Risposte');
  const rifiutate = [];
  (body.risposte || []).slice(0, 40).forEach(function (x) {
    if (!slotValido(x.slot)) return;
    if (!aperte(x.slot, impostazioniDi(x.slot).imp)) { rifiutate.push(x.slot); return; }
    let idx = -1;
    for (let i = 0; i < r.righe.length; i++) {
      if (testo(r.righe[i][0]) === x.slot && testo(r.righe[i][1]) === persona) { idx = i; break; }
    }
    const ruolo = RUOLI.indexOf(x.ruolo) >= 0 ? x.ruolo : '';
    if (!ruolo) {
      if (idx >= 0) { r.sh.deleteRow(idx + 2); r.righe.splice(idx, 1); }
      return;
    }
    const acc = Math.max(0, Math.min(10, Math.round(+x.acc || 0)));
    const riga = [x.slot, persona, nome, cognome, ruolo, acc, ora(x.dalle), ora(x.alle), new Date()];
    if (idx >= 0) { r.sh.getRange(idx + 2, 1, 1, riga.length).setValues([riga]); r.righe[idx] = riga; }
    else { r.sh.appendRow(riga); r.righe.push(riga); }
  });
  return { ok: true, rifiutate: rifiutate };
}

// ---------- Area admin ----------
function admin(body) {
  const cache = CacheService.getScriptCache();
  const tentativi = +(cache.get('pin-errati') || 0);
  if (tentativi >= 10) return { ok: false, errore: 'Troppi PIN sbagliati, riprova tra 10 minuti' };
  // Accetta il PIN scritto con o senza virgolette e ignora gli spazi.
  const pin = String(PIN_ADMIN).trim();
  if (pin === 'CAMBIAMI' || String(body.pin).trim() !== pin) {
    cache.put('pin-errati', String(tentativi + 1), 600);
    return { ok: false, errore: pin === 'CAMBIAMI' ? 'Imposta prima il PIN nello script' : 'PIN errato' };
  }
  const d = body.dati || {};
  switch (body.op) {
    case 'verifica':
      return { ok: true };
    case 'impostaData': {
      if (!slotValido(d.slot)) return { ok: false, errore: 'Data non valida' };
      const cur = impostazioniDi(d.slot);
      const imp = cur.imp;
      Object.keys(d.modifiche || {}).forEach(function (k) {
        const v = d.modifiche[k];
        if (v === null || v === '') delete imp[k]; else imp[k] = v;
      });
      const txt = JSON.stringify(imp);
      if (txt.length > 40000) return { ok: false, errore: 'Dati troppo grandi' };
      const sh = SpreadsheetApp.getActive().getSheetByName('Date');
      if (cur.riga) sh.getRange(cur.riga, 2, 1, 2).setValues([[txt, new Date()]]);
      else sh.appendRow([d.slot, txt, new Date()]);
      return { ok: true };
    }
    case 'salvaCampo': {
      const c = d.campo || {};
      const r = righe('Campi');
      const id = c.id || Utilities.getUuid().slice(0, 8);
      const riga = [id, sicuro(c.nome, 80), sicuro(c.indirizzo, 160), Math.max(1, Math.round(+c.campi || 1)), sicuro(c.costo, 40), c.tipo === 'indoor' ? 'indoor' : 'outdoor', sicuro(c.nota, 300), sicuro(c.mappa, 300)];
      if (!riga[1]) return { ok: false, errore: 'Serve il nome del campo' };
      for (let i = 0; i < r.righe.length; i++) {
        if (testo(r.righe[i][0]) === id) { r.sh.getRange(i + 2, 1, 1, riga.length).setValues([riga]); return { ok: true }; }
      }
      r.sh.appendRow(riga);
      return { ok: true };
    }
    case 'eliminaCampo': {
      const r = righe('Campi');
      for (let i = 0; i < r.righe.length; i++) if (testo(r.righe[i][0]) === d.id) { r.sh.deleteRow(i + 2); break; }
      return { ok: true };
    }
    case 'eliminaRisposta': {
      const r = righe('Risposte');
      for (let i = 0; i < r.righe.length; i++) {
        if (testo(r.righe[i][0]) === d.slot && testo(r.righe[i][1]) === d.persona) { r.sh.deleteRow(i + 2); break; }
      }
      return { ok: true };
    }
  }
  return { ok: false, errore: 'Operazione sconosciuta' };
}
