/* Logica pura dell'app: weekend, stato delle date, squadre, formule, orari.
   Nessun accesso a rete o pagina: si può provare anche con Node. */
(function (root) {
  'use strict';

  var MIN_GIOCATORI = 6;
  var GIORNI_CHIUSURA = 2; // si risponde fino a due giorni prima della data
  // Nel weekend mattina e pomeriggio, dal lunedì al venerdì solo la sera.
  var ORARI = { M: [10, 13], P: [15, 18], S: [19, 21] };
  var FASCE = { M: 'Mattina', P: 'Pomeriggio', S: 'Sera' };
  var SETTIMANE_PRIMA = 1, SETTIMANE_DOPO = 2; // si vedono la settimana scorsa, questa e le due successive
  var GIORNI = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  var GIORNI_LUNGHI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  var MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  var MESI_BREVI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

  // ---- Date come stringhe 'AAAA-MM-GG', calcolate in UTC per evitare sorprese col fuso ----
  function parse(s) { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function fmt(d) { return d.toISOString().slice(0, 10); }
  function addDays(s, n) { var d = parse(s); d.setUTCDate(d.getUTCDate() + n); return fmt(d); }
  function dow(s) { return parse(s).getUTCDay(); }
  function oggiLocale() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function meseDi(s) { return s.slice(0, 7); }
  function addMesi(mese, n) {
    var y = +mese.slice(0, 4), m = +mese.slice(5, 7) - 1 + n;
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    return y + '-' + String(m + 1).padStart(2, '0');
  }
  function nomeMese(mese) { return MESI[+mese.slice(5, 7) - 1]; }
  function etichettaGiorno(s) { var d = parse(s); return GIORNI[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MESI_BREVI[d.getUTCMonth()]; }
  function etichettaLunga(s) { var d = parse(s); return GIORNI_LUNGHI[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MESI[d.getUTCMonth()]; }

  // Weekend del mese: ogni sabato del mese con la domenica successiva (anche se cade nel mese dopo).
  function weekendDelMese(mese) {
    var out = [];
    var d = mese + '-01';
    while (dow(d) !== 6) d = addDays(d, 1);
    while (meseDi(d) === mese) {
      var dom = addDays(d, 1);
      out.push({ id: d, giorni: [d, dom] });
      d = addDays(d, 7);
    }
    return out;
  }
  // Settimane da lunedì a domenica, indicate con la data del lunedì.
  function lunediDi(s) { return addDays(s, -((dow(s) + 6) % 7)); }
  function settimana(s) {
    var l = lunediDi(s), giorni = [];
    for (var i = 0; i < 7; i++) giorni.push(addDays(l, i));
    return { id: l, giorni: giorni };
  }
  function settimaneVisibili(oggi) {
    var out = [], l = lunediDi(oggi);
    for (var i = -SETTIMANE_PRIMA; i <= SETTIMANE_DOPO; i++) out.push(settimana(addDays(l, 7 * i)));
    return out;
  }
  function etichettaSettimana(w) {
    var a = parse(w.giorni[0]), b = parse(w.giorni[6]);
    return a.getUTCDate() + (a.getUTCMonth() !== b.getUTCMonth() ? ' ' + MESI_BREVI[a.getUTCMonth()] : '') + '–' + b.getUTCDate() + ' ' + MESI_BREVI[b.getUTCMonth()];
  }
  function weekend(s) { var d = dow(s); return d === 0 || d === 6; }
  function fasceDi(data) { return weekend(data) ? ['M', 'P'] : ['S']; }
  function slotId(data, fascia) { return data + '-' + fascia; }
  function slotDi(data) { return fasceDi(data).map(function (f) { return slotId(data, f); }); }
  function dataDiSlot(id) { return id.slice(0, 10); }
  function fasciaDiSlot(id) { return id.slice(11); }

  // ---- Persone ----
  function pulisci(s) { return String(s || '').trim().replace(/\s+/g, ' '); }
  function chiavePersona(nome, cognome) {
    var n = (pulisci(nome) + '|' + pulisci(cognome)).toLowerCase();
    return n.normalize ? n.normalize('NFD').replace(/[̀-ͯ]/g, '') : n;
  }
  function maiuscola(s) { return pulisci(s).replace(/(^|[\s'-])(\S)/g, function (m, a, b) { return a + b.toUpperCase(); }); }
  function nomeBreve(r) { return maiuscola(r.nome) + ' ' + maiuscola(r.cognome).charAt(0) + '.'; }
  function nomeCompleto(r) { return maiuscola(r.nome) + ' ' + maiuscola(r.cognome); }

  // ---- Stato di una fascia (slot) ----
  function chiusuraAuto(data) { return addDays(data, -GIORNI_CHIUSURA); }
  function iscrizioniAperte(id, impostazioni, oggi) {
    var data = dataDiSlot(id);
    var imp = impostazioni || {};
    if (imp.annullata) return false;
    if (data < oggi) return false;
    if (imp.iscrizioni === 'chiuse') return false;
    if (imp.iscrizioni === 'aperte') return true;
    return oggi <= chiusuraAuto(data);
  }

  function risposteDiSlot(risposte, id) { return risposte.filter(function (r) { return r.slot === id; }); }

  function riepilogoSlot(id, risposte, impostazioni, oggi, min) {
    min = min || MIN_GIOCATORI;
    var imp = impostazioni || {};
    var rs = risposteDiSlot(risposte, id);
    var per = { gioco: [], guardo: [], post: [] };
    var acc = 0;
    rs.forEach(function (r) {
      if (per[r.ruolo]) { per[r.ruolo].push(r); acc += +r.acc || 0; }
    });
    Object.keys(per).forEach(function (k) { per[k].sort(function (a, b) { return nomeCompleto(a).localeCompare(nomeCompleto(b), 'it'); }); });
    var data = dataDiSlot(id);
    var aperte = iscrizioniAperte(id, imp, oggi);
    var n = per.gioco.length;
    var stato;
    if (imp.annullata) stato = 'annullata';
    else if (data < oggi) stato = n >= min ? 'giocata' : 'saltata';
    else if (n >= min) stato = 'sigioca';
    else stato = aperte ? 'votazione' : 'nonsigioca';
    var orario = imp.orario || null;
    return {
      id: id, data: data, fascia: fasciaDiSlot(id), stato: stato, aperte: aperte,
      chiusura: imp.iscrizioni === 'chiuse' ? null : chiusuraAuto(data),
      giocatori: per.gioco, guardano: per.guardo, post: per.post, accompagnatori: acc,
      mancano: Math.max(0, min - n), orario: orario, campo: imp.campo || null, imp: imp
    };
  }

  // ---- Squadre ----
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function lettera(i) { return String.fromCharCode(65 + i); }

  function numeroSquadreAuto(n) { return n < 4 ? 1 : Math.max(2, Math.ceil(n / 4)); }

  /* Squadre proposte: stesse persone, stesse squadre (mescolamento con seme fisso).
     Se l'admin ha spostato qualcuno (manuali) e gli iscritti sono ancora gli stessi, vale la sua versione. */
  function squadre(id, giocatori, imp) {
    imp = imp || {};
    var chiavi = giocatori.map(function (g) { return g.persona; }).sort();
    var n = chiavi.length;
    if (n < 2) return { squadre: [], riserve: [], manuali: false, cambiati: false };
    var ns = Math.max(1, Math.min(+imp.nSquadre || numeroSquadreAuto(n), n));
    var per = +imp.perSquadra || Math.ceil(n / ns);
    var posti = Math.min(n, ns * per);

    var man = imp.manuali;
    if (man && man.chiavi && man.chiavi.slice().sort().join(',') === chiavi.join(',') && man.squadre && man.squadre.length) {
      return {
        squadre: man.squadre.map(function (s, i) { return { nome: lettera(i), membri: s.slice() }; }),
        riserve: (man.riserve || []).slice(), manuali: true, cambiati: false
      };
    }
    var r = rng(hash(id + '|' + chiavi.join(',')));
    var mix = chiavi.slice();
    for (var i = mix.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = mix[i]; mix[i] = mix[j]; mix[j] = t; }
    var out = [];
    for (var k = 0; k < ns; k++) out.push({ nome: lettera(k), membri: [] });
    for (var p = 0; p < posti; p++) out[p % ns].membri.push(mix[p]);
    return { squadre: out, riserve: mix.slice(posti), manuali: false, cambiati: !!man };
  }

  // ---- Formule ----
  function girone(nomi, campi) {
    campi = Math.max(1, +campi || 1);
    var t = nomi.slice();
    if (t.length < 2) return [];
    if (t.length % 2) t.push(null);
    var giri = [], m = t.length;
    for (var g = 0; g < m - 1; g++) {
      var partite = [], riposa = [];
      for (var i = 0; i < m / 2; i++) {
        var a = t[i], b = t[m - 1 - i];
        if (a && b) partite.push([a, b]); else riposa.push(a || b);
      }
      giri.push({ partite: partite, riposa: riposa });
      t.splice(1, 0, t.pop());
    }
    // Ogni giro si spezza in turni secondo i campi disponibili.
    var turni = [];
    giri.forEach(function (gr) {
      for (var s = 0; s < gr.partite.length; s += campi) {
        var qui = gr.partite.slice(s, s + campi);
        var inCampo = {};
        qui.forEach(function (p) { inCampo[p[0]] = inCampo[p[1]] = 1; });
        turni.push({ partite: qui, riposa: nomi.filter(function (x) { return !inCampo[x]; }) });
      }
    });
    return turni;
  }

  function nomeTurnoElim(squadreNelTurno) {
    return { 2: 'Finale', 4: 'Semifinali', 8: 'Quarti di finale', 16: 'Ottavi di finale' }[squadreNelTurno] || ('Turno da ' + squadreNelTurno);
  }
  function eliminazione(nomi) {
    var n = nomi.length;
    if (n < 2) return [];
    var size = 1; while (size < n) size *= 2;
    // Teste di serie nell'ordine classico, così i "passa il turno" vanno alle prime squadre.
    var ordine = [1];
    while (ordine.length < size) {
      var tot = ordine.length * 2 + 1, nuovo = [];
      ordine.forEach(function (x) { nuovo.push(x, tot - x); });
      ordine = nuovo;
    }
    var slot = ordine.map(function (x) { return x <= n ? nomi[x - 1] : null; });
    var turni = [], incontri = [], prossimi = [], passano = [], numero = 1;
    for (var i = 0; i < size; i += 2) {
      var a = slot[i], b = slot[i + 1];
      if (a && b) { incontri.push({ n: numero, a: a, b: b }); prossimi.push('Vincente ' + numero); numero++; }
      else { prossimi.push(a || b); passano.push(a || b); }
    }
    turni.push({ nome: nomeTurnoElim(size), incontri: incontri, passano: passano });
    var corrente = prossimi;
    while (corrente.length > 1) {
      var inc = [], nx = [];
      for (var k = 0; k < corrente.length; k += 2) {
        inc.push({ n: numero, a: corrente[k], b: corrente[k + 1] });
        nx.push('Vincente ' + numero); numero++;
      }
      turni.push({ nome: nomeTurnoElim(corrente.length), incontri: inc, passano: [] });
      corrente = nx;
    }
    return turni;
  }

  // ---- Orari: quante persone ci sono in ogni ora ----
  function orarioDi(r) {
    var def = ORARI[fasciaDiSlot(r.slot)] || [10, 13];
    var a = r.dalle != null && r.dalle !== '' ? +r.dalle : def[0];
    var b = r.alle != null && r.alle !== '' ? +r.alle : def[1];
    if (b <= a) b = a + 1;
    return [a, b];
  }
  function sovrapposizione(giocatori) {
    if (!giocatori.length) return { ore: [], max: 0, migliore: null };
    var min = 24, max = 0;
    var intervalli = giocatori.map(function (g) { var o = orarioDi(g); min = Math.min(min, o[0]); max = Math.max(max, o[1]); return o; });
    var ore = [];
    for (var h = min; h < max; h++) {
      ore.push({ ora: h, n: intervalli.filter(function (o) { return o[0] <= h && o[1] > h; }).length });
    }
    var top = Math.max.apply(null, ore.map(function (o) { return o.n; }));
    // La finestra migliore: la serie più lunga di ore consecutive col massimo delle presenze.
    var best = null, cur = null;
    ore.forEach(function (o) {
      if (o.n === top) { if (cur && cur[1] === o.ora) cur[1] = o.ora + 1; else cur = [o.ora, o.ora + 1]; if (!best || cur[1] - cur[0] > best[1] - best[0]) best = cur.slice(); }
      else cur = null;
    });
    return { ore: ore, max: top, migliore: best };
  }
  function oraTesto(h) { return String(h).padStart(2, '0') + ':00'; }

  var L = {
    MIN_GIOCATORI: MIN_GIOCATORI, SETTIMANE_PRIMA: SETTIMANE_PRIMA, SETTIMANE_DOPO: SETTIMANE_DOPO, GIORNI_CHIUSURA: GIORNI_CHIUSURA, ORARI: ORARI, FASCE: FASCE,
    parse: parse, fmt: fmt, addDays: addDays, dow: dow, oggiLocale: oggiLocale, meseDi: meseDi, addMesi: addMesi,
    nomeMese: nomeMese, etichettaGiorno: etichettaGiorno, etichettaLunga: etichettaLunga, GIORNI: GIORNI, MESI_BREVI: MESI_BREVI,
    weekendDelMese: weekendDelMese, lunediDi: lunediDi, settimana: settimana, settimaneVisibili: settimaneVisibili,
    etichettaSettimana: etichettaSettimana, weekend: weekend, fasceDi: fasceDi, GIORNI_LUNGHI: GIORNI_LUNGHI, slotId: slotId, slotDi: slotDi, dataDiSlot: dataDiSlot, fasciaDiSlot: fasciaDiSlot,
    pulisci: pulisci, chiavePersona: chiavePersona, maiuscola: maiuscola, nomeBreve: nomeBreve, nomeCompleto: nomeCompleto,
    chiusuraAuto: chiusuraAuto, iscrizioniAperte: iscrizioniAperte, riepilogoSlot: riepilogoSlot,
    numeroSquadreAuto: numeroSquadreAuto, squadre: squadre, lettera: lettera, girone: girone, eliminazione: eliminazione,
    orarioDi: orarioDi, sovrapposizione: sovrapposizione, oraTesto: oraTesto
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = L; else root.BV = L;
})(this);
