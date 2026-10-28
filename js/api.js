/* Collegamento ai dati. Con l'indirizzo dello script in config.js parla con il Google Foglio;
   senza, usa una versione di prova salvata solo su questo telefono. */
(function (root) {
  'use strict';
  var L = root.BV;
  var URL = (root.BV_CONFIG && root.BV_CONFIG.API_URL) || '';

  function chiama(metodo, body) {
    var opz = metodo === 'GET' ? {} : {
      method: 'POST',
      // text/plain evita il controllo preliminare del browser, che Apps Script non gestisce.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    };
    var url = metodo === 'GET' ? URL + '?azione=stato&t=' + Date.now() : URL;
    return fetch(url, opz).then(function (r) {
      if (!r.ok) throw new Error('Il server non risponde (' + r.status + ')');
      return r.json();
    }).then(function (j) {
      if (!j.ok) throw new Error(j.errore || 'Errore');
      return j;
    });
  }

  var vero = {
    prova: false,
    stato: function () { return chiama('GET'); },
    salva: function (nome, cognome, risposte) { return chiama('POST', { azione: 'salva', nome: nome, cognome: cognome, risposte: risposte }); },
    admin: function (pin, op, dati) { return chiama('POST', { azione: 'admin', pin: pin, op: op, dati: dati || {} }); }
  };

  // ---------- Versione di prova ----------
  var CHIAVE = 'bv-prova-v1';
  function leggi() {
    try { var s = JSON.parse(localStorage.getItem(CHIAVE)); if (s) return s; } catch (e) { /* niente */ }
    var s2 = semina(); scrivi(s2); return s2;
  }
  function scrivi(s) { try { localStorage.setItem(CHIAVE, JSON.stringify(s)); } catch (e) { /* niente */ } }
  function semina() {
    var oggi = L.oggiLocale();
    var nomi = [['Giulia', 'Marino'], ['Paolo', 'Testa'], ['Sara', 'Leone'], ['Marco', 'Bianchi'], ['Elena', 'Ferri'], ['Luca', 'Dini'],
      ['Chiara', 'Villa'], ['Andrea', 'Pace'], ['Davide', 'Conti'], ['Marta', 'Gallo'], ['Fabio', 'Riva']];
    var wk = L.weekendDelMese(L.meseDi(oggi)).concat(L.weekendDelMese(L.addMesi(L.meseDi(oggi), 1)))
      .filter(function (w) { return w.giorni[1] >= oggi; }).slice(0, 3);
    var r = [];
    function add(slot, i, ruolo, extra) {
      var p = nomi[i];
      r.push(Object.assign({ slot: slot, persona: L.chiavePersona(p[0], p[1]), nome: p[0], cognome: p[1], ruolo: ruolo, acc: 0, dalle: null, alle: null }, extra || {}));
    }
    if (wk[0]) {
      var s = L.slotId(wk[0].giorni[0], 'M');
      for (var i = 0; i < 9; i++) add(s, i, 'gioco', i === 2 ? { dalle: 9, alle: 12 } : i === 5 ? { dalle: 11, alle: 13 } : null);
      add(s, 9, 'guardo', { acc: 1 }); add(s, 10, 'post');
      var s2 = L.slotId(wk[0].giorni[1], 'P');
      [0, 3, 4, 7].forEach(function (k) { add(s2, k, 'gioco'); });
    }
    if (wk[1]) {
      var s3 = L.slotId(wk[1].giorni[0], 'M');
      [1, 2, 5, 6, 8].forEach(function (k) { add(s3, k, 'gioco'); });
      add(L.slotId(wk[1].giorni[1], 'P'), 9, 'gioco');
    }
    var campi = [{ id: 'demo1', nome: 'Lido di prova', indirizzo: 'Via del Mare 1', campi: 2, costo: '20 €', tipo: 'outdoor', nota: 'Esempio: cambialo dall’area admin', mappa: '' }];
    var date = {};
    if (wk[0]) date[L.slotId(wk[0].giorni[0], 'M')] = { campo: 'demo1' };
    return { risposte: r, date: date, campi: campi };
  }
  function statoProva() {
    var s = leggi();
    return Promise.resolve({ ok: true, oggi: L.oggiLocale(), risposte: s.risposte, date: s.date, campi: s.campi, prova: true });
  }
  var prova = {
    prova: true,
    stato: statoProva,
    salva: function (nome, cognome, risposte) {
      var s = leggi(), persona = L.chiavePersona(nome, cognome), rifiutate = [], oggi = L.oggiLocale();
      risposte.forEach(function (x) {
        if (!L.iscrizioniAperte(x.slot, s.date[x.slot], oggi)) { rifiutate.push(x.slot); return; }
        s.risposte = s.risposte.filter(function (r) { return !(r.slot === x.slot && r.persona === persona); });
        if (x.ruolo) {
          s.risposte.push({ slot: x.slot, persona: persona, nome: L.pulisci(nome), cognome: L.pulisci(cognome), ruolo: x.ruolo, acc: +x.acc || 0, dalle: x.dalle == null ? null : +x.dalle, alle: x.alle == null ? null : +x.alle });
        }
      });
      scrivi(s);
      return new Promise(function (ok) { setTimeout(ok, 350); }).then(statoProva).then(function (st) { st.rifiutate = rifiutate; return { ok: true, rifiutate: rifiutate, stato: st }; });
    },
    admin: function (pin, op, d) {
      if (String(pin) !== '1234') return Promise.reject(new Error('PIN errato (nella prova è 1234)'));
      var s = leggi(); d = d || {};
      if (op === 'impostaData') {
        var imp = s.date[d.slot] || {};
        Object.keys(d.modifiche || {}).forEach(function (k) { var v = d.modifiche[k]; if (v === null || v === '') delete imp[k]; else imp[k] = v; });
        s.date[d.slot] = imp;
      } else if (op === 'salvaCampo') {
        var c = Object.assign({}, d.campo); if (!c.id) c.id = 'c' + Date.now().toString(36);
        if (!c.nome) return Promise.reject(new Error('Serve il nome del campo'));
        s.campi = s.campi.filter(function (x) { return x.id !== c.id; }).concat([c]);
      } else if (op === 'eliminaCampo') {
        s.campi = s.campi.filter(function (x) { return x.id !== d.id; });
      } else if (op === 'eliminaRisposta') {
        s.risposte = s.risposte.filter(function (r) { return !(r.slot === d.slot && r.persona === d.persona); });
      }
      scrivi(s);
      return statoProva().then(function (st) { return { ok: true, stato: st }; });
    },
    azzera: function () { try { localStorage.removeItem(CHIAVE); } catch (e) { /* niente */ } }
  };

  root.BVApi = URL ? vero : prova;
})(this);
