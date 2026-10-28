/* Beach Volley tra colleghi: schermate dell'app. */
(function () {
  'use strict';
  var L = window.BV, api = window.BVApi;
  var $app = document.getElementById('app');

  // ---------- Memoria del telefono ----------
  function leggiLocale(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function scriviLocale(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* niente */ } }
  function leggiSessione(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function scriviSessione(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { /* niente */ } }

  var S = {
    dati: null, errore: null, me: leggiLocale('bv-io'), mese: null, wk: null, orariAperti: {},
    salvataggio: '', pendenti: {}, inviando: false, timer: null,
    pin: leggiSessione('bv-pin'), tab: 'date', slotAdmin: null, sposta: false, campoEdit: null, meseAdmin: null
  };

  // ---------- Utilità ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function oggi() { return (S.dati && S.dati.oggi) || L.oggiLocale(); }
  function io() { return S.me ? L.chiavePersona(S.me.nome, S.me.cognome) : null; }
  function linkApp() { return location.origin + location.pathname; }
  function plur(n, uno, tanti) { return n + ' ' + (n === 1 ? uno : tanti); }

  var I = {
    check: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
    lista: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/></svg>',
    cal: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    sx: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>',
    dx: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
    pin: '<svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C2410C" stroke-width="2" stroke-linecap="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    lucchetto: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    matita: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>',
    palla: '<svg class="palla" aria-hidden="true" viewBox="0 0 180 180"><circle cx="90" cy="90" r="70" fill="none" stroke="#FFF8EE" stroke-width="10"/><path d="M20 90 Q90 40 160 90" fill="none" stroke="#FFF8EE" stroke-width="8"/><path d="M90 20 Q50 90 90 160" fill="none" stroke="#FFF8EE" stroke-width="8"/></svg>',
    pallaGira: '<svg aria-hidden="true" width="44" height="44" viewBox="0 0 180 180"><circle cx="90" cy="90" r="70" fill="none" stroke="#E8572A" stroke-width="12"/><path d="M20 90 Q90 40 160 90" fill="none" stroke="#E8572A" stroke-width="10"/><path d="M90 20 Q50 90 90 160" fill="none" stroke="#E8572A" stroke-width="10"/></svg>'
  };
  function onda(sopra) {
    return '<svg class="onda" aria-hidden="true" viewBox="0 0 390 30" preserveAspectRatio="none" style="background:' + sopra + '"><path d="M0 10 Q 32 0 65 10 T 130 10 T 195 10 T 260 10 T 325 10 T 390 10 L390 30 L0 30 Z" fill="#0F5F63"/><path d="M0 20 Q 32 10 65 20 T 130 20 T 195 20 T 260 20 T 325 20 T 390 20 L390 30 L0 30 Z" fill="#F4E9D8"/></svg>';
  }
  function rete() {
    var v = ''; for (var x = 13; x < 390; x += 26) v += 'M' + x + ' 4 L' + x + ' 22 ';
    return '<svg class="rete" aria-hidden="true" viewBox="0 0 390 44" preserveAspectRatio="none"><line x1="0" y1="4" x2="390" y2="4" stroke="#FFF8EE" stroke-width="3"/><path d="' + v + 'M0 13 L390 13 M0 22 L390 22" stroke="#FFF8EE" stroke-opacity=".45" stroke-width="1.5" fill="none"/><path d="M0 32 Q 32 22 65 32 T 130 32 T 195 32 T 260 32 T 325 32 T 390 32 L390 44 L0 44 Z" fill="#F4E9D8"/></svg>';
  }

  var toastTimer;
  function toast(msg) {
    var t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  // ---------- Dati ----------
  function risposte() {
    if (!S.dati) return [];
    var me = io();
    var base = S.dati.risposte.filter(function (r) { return !(r.persona === me && S.pendenti[r.slot]); });
    Object.keys(S.pendenti).forEach(function (slot) {
      var p = S.pendenti[slot];
      if (p.ruolo) base.push({ slot: slot, persona: me, nome: S.me.nome, cognome: S.me.cognome, ruolo: p.ruolo, acc: p.acc || 0, dalle: p.dalle, alle: p.alle });
    });
    return base;
  }
  function mia(slot) {
    if (S.pendenti[slot]) return S.pendenti[slot];
    var me = io();
    var r = S.dati && S.dati.risposte.filter(function (x) { return x.slot === slot && x.persona === me; })[0];
    return r ? { ruolo: r.ruolo, acc: r.acc || 0, dalle: r.dalle, alle: r.alle } : { ruolo: '', acc: 0, dalle: null, alle: null };
  }
  function imp(slot) { return (S.dati && S.dati.date[slot]) || {}; }
  function riep(slot) { return L.riepilogoSlot(slot, risposte(), imp(slot), oggi()); }
  function campoDi(id) { return S.dati && S.dati.campi.filter(function (c) { return c.id === id; })[0]; }
  function nomiPersone() {
    var m = {}; risposte().forEach(function (r) { m[r.persona] = L.nomeBreve(r); }); return m;
  }

  function carica(silenzioso) {
    if (!silenzioso) { S.errore = null; }
    return api.stato().then(function (d) {
      S.dati = d; S.errore = null;
      if (!S.mese) S.mese = meseIniziale();
      render();
    }).catch(function (e) {
      if (!S.dati) { S.errore = e.message || 'Errore di rete'; render(); }
    });
  }
  function meseIniziale() {
    var m = L.meseDi(oggi());
    var futuri = L.weekendDelMese(m).filter(function (w) { return w.giorni[1] >= oggi(); });
    return futuri.length ? m : L.addMesi(m, 1);
  }

  // ---------- Salvataggio automatico ----------
  function modifica(slot, patch) {
    var cur = mia(slot);
    var nuovo = Object.assign({}, cur, patch);
    if (nuovo.ruolo !== 'gioco') { nuovo.dalle = null; nuovo.alle = null; }
    if (!nuovo.ruolo || nuovo.ruolo === 'no') nuovo.acc = 0;
    S.pendenti[slot] = nuovo;
    S.salvataggio = 'attesa';
    clearTimeout(S.timer);
    S.timer = setTimeout(invia, 700);
    render();
  }
  function invia() {
    if (S.inviando) { S.timer = setTimeout(invia, 400); return; }
    var lotto = S.pendenti;
    var slots = Object.keys(lotto);
    if (!slots.length) return;
    S.inviando = true; S.salvataggio = 'invio'; render();
    var dati = slots.map(function (s) { var p = lotto[s]; return { slot: s, ruolo: p.ruolo || 'no', acc: p.acc || 0, dalle: p.dalle, alle: p.alle }; });
    api.salva(S.me.nome, S.me.cognome, dati).then(function (r) {
      S.inviando = false;
      if (r.stato) S.dati = r.stato;
      // Tolgo dai pendenti solo ciò che non è cambiato nel frattempo.
      slots.forEach(function (s) { if (S.pendenti[s] === lotto[s]) delete S.pendenti[s]; });
      var rif = r.rifiutate || [];
      rif.forEach(function (s) { delete S.pendenti[s]; });
      S.salvataggio = Object.keys(S.pendenti).length ? 'attesa' : 'salvato';
      if (rif.length) toast('Iscrizioni chiuse per ' + rif.map(function (s) { return L.etichettaGiorno(L.dataDiSlot(s)); }).join(', ') + ': risposta non salvata');
      render();
    }).catch(function () {
      S.inviando = false; S.salvataggio = 'errore'; render();
    });
  }

  // ---------- Percorsi ----------
  function percorso() {
    var h = location.hash.replace(/^#\/?/, '');
    var p = h.split('/');
    return { vista: p[0] || 'disponibilita', arg: p[1] || '' };
  }
  function vai(h) { if (location.hash !== h) location.hash = h; else render(); }

  // ---------- Disegno ----------
  function render() {
    var p = percorso();
    document.body.classList.toggle('in-admin', p.vista === 'admin');
    if (p.vista === 'admin') {
      $app.className = 'admin'; $app.innerHTML = vistaAdmin();
      var sel = $app.querySelector('.slot-chips [aria-pressed="true"]');
      if (sel) sel.parentNode.scrollLeft = sel.offsetLeft - sel.parentNode.offsetLeft - 16;
      return;
    }
    $app.className = '';
    if (!S.me) { $app.innerHTML = vistaBenvenuto(); return; }
    if (!S.dati) { $app.innerHTML = S.errore ? vistaErrore() : vistaCaricamento(); return; }
    var html;
    if (p.vista === 'weekend') html = vistaWeekend();
    else if (p.vista === 'data') html = vistaData(p.arg);
    else html = vistaDisponibilita(p.arg);
    $app.innerHTML = (api.prova ? '<div class="avviso" style="border-radius:0">Versione di prova: i dati restano solo su questo telefono.</div>' : '') + html;
  }

  function vistaCaricamento() { return '<div class="caricamento">' + I.pallaGira + '<span>Carico le partite…</span></div>'; }
  function vistaErrore() {
    return '<div class="caricamento"><strong>Non riesco a caricare i dati.</strong><span>' + esc(S.errore) + '</span><button class="btn pieno" data-a="riprova">Riprova</button></div>';
  }

  function barra(attiva) {
    return '<nav class="barra" aria-label="Sezioni">' +
      '<a href="#disponibilita"' + (attiva === 'd' ? ' aria-current="page"' : '') + '>' + I.lista + 'Disponibilità</a>' +
      '<a href="#weekend"' + (attiva === 'w' ? ' aria-current="page"' : '') + '>' + I.cal + 'Weekend</a></nav>';
  }

  function vistaBenvenuto() {
    return '<div class="benvenuto"><header class="testata arancio">' + I.palla +
      '<div class="occhiello">Si gioca nel weekend</div><h1 class="titolo">Beach volley<br>tra colleghi</h1></header>' + onda('#E8572A') +
      '<main><form class="card" data-f="entra" autocomplete="on"><h2 class="h2">Come ti chiami?</h2>' +
      '<p class="piccolo" style="margin:0">Serve solo per mostrare ai colleghi chi c’è. Il telefono lo ricorda, non ti chiederemo mail né numero.</p>' +
      '<div class="campo-form"><label for="nome">Nome</label><input id="nome" name="nome" required maxlength="40" autocomplete="given-name" value="' + esc(S.me ? S.me.nome : '') + '"></div>' +
      '<div class="campo-form"><label for="cognome">Cognome</label><input id="cognome" name="cognome" required maxlength="40" autocomplete="family-name"></div>' +
      '<button class="btn arancio largo" type="submit">Entra</button></form>' +
      '<p class="piccolo" style="text-align:center">Usa sempre lo stesso nome e cognome: così ritrovi le tue risposte anche da un altro telefono.</p></main></div>';
  }

  // Selettore del mese condiviso dalle schermate.
  function navMese(mese, min, max, azione, colore) {
    var prima = mese > min, dopo = mese < max;
    return '<div class="nav-mese"><button class="tondo" ' + (colore ? 'style="border-color:' + colore + ';color:' + colore + '"' : '') + ' aria-label="Mese precedente" data-a="' + azione + '" data-v="-1"' + (prima ? '' : ' disabled') + '>' + I.sx + '</button>' +
      '<button class="tondo" ' + (colore ? 'style="border-color:' + colore + ';color:' + colore + '"' : '') + ' aria-label="Mese successivo" data-a="' + azione + '" data-v="1"' + (dopo ? '' : ' disabled') + '>' + I.dx + '</button></div>';
  }
  function limitiMese() { var m = L.meseDi(oggi()); return { min: L.addMesi(m, -1), max: L.addMesi(m, 2) }; }

  // Un giorno è "da fare" se ha fasce aperte e non ho risposto a nessuna delle due.
  function giornoDaFare(g) {
    var slots = L.slotDi(g);
    return slots.some(function (s) { return riep(s).aperte; }) && !slots.some(function (s) { return mia(s).ruolo; });
  }
  function weekendDaFare(w) { return w.giorni.some(giornoDaFare); }

  function vistaDisponibilita(arg) {
    if (arg) { S.mese = L.meseDi(arg); S.wk = arg; }
    var wks = L.weekendDelMese(S.mese);
    var o = oggi();
    if (!S.wk || !wks.some(function (w) { return w.id === S.wk; })) {
      var futuro = wks.filter(function (w) { return w.giorni[1] >= o; })[0];
      S.wk = (futuro || wks[0]).id;
    }
    var lim = limitiMese();
    var w = wks.filter(function (x) { return x.id === S.wk; })[0];
    var chips = wks.map(function (x) {
      var passato = x.giorni[1] < o, daFare = !passato && weekendDaFare(x);
      var d1 = L.parse(x.giorni[0]).getUTCDate(), d2 = L.parse(x.giorni[1]).getUTCDate();
      return '<button class="chip-wk' + (daFare ? ' dafare' : '') + (passato ? ' passato' : '') + '" aria-pressed="' + (x.id === S.wk) + '" data-a="wk" data-v="' + x.id + '"><b>' + d1 + '–' + d2 + '</b><span>' + (passato ? 'passato' : daFare ? 'da fare' : 'fatto') + '</span></button>';
    }).join('');

    var apertiTutti = w.giorni.some(function (g) { return L.slotDi(g).some(function (s) { return riep(s).aperte; }); });
    var stato = { attesa: 'Modifiche in corso…', invio: 'Salvo…', salvato: I.check + 'Salvato', errore: 'Non salvato' }[S.salvataggio] || '';

    var giorni = w.giorni.map(function (g) { return cardGiorno(g); }).join('');
    var d1 = L.parse(w.giorni[0]), d2 = L.parse(w.giorni[1]);
    var titoloWk = 'Weekend ' + d1.getUTCDate() + (d1.getUTCMonth() !== d2.getUTCMonth() ? ' ' + L.MESI_BREVI[d1.getUTCMonth()] : '') + '–' + d2.getUTCDate() + ' ' + L.MESI_BREVI[d2.getUTCMonth()];

    return '<header class="testata arancio">' + I.palla +
      '<div class="riga" style="position:relative"><span class="occhiello">' + esc(L.nomeMese(S.mese)) + ' ' + S.mese.slice(0, 4) + '</span>' + navMese(S.mese, lim.min, lim.max, 'mese', '#FFF8EE') + '</div>' +
      '<h1 class="titolo">Beach volley<br>tra colleghi</h1>' +
      '<div class="riga-testata"><span>Ciao, <strong>' + esc(L.nomeCompleto(S.me)) + '</strong></span><button class="link" style="background:none;border:0;min-height:44px;padding:0;text-decoration:underline" data-a="esci">Non sei tu?</button></div></header>' +
      onda('#E8572A') +
      '<main><div class="weekend-chips">' + chips + '</div>' +
      '<div class="riga"><h2 class="h2">' + esc(titoloWk) + '</h2><span class="salvato' + (S.salvataggio === 'errore' ? ' errore' : '') + '" role="status">' + stato + (S.salvataggio === 'errore' ? ' <button class="btn mini" data-a="reinvia">Riprova</button>' : '') + '</span></div>' +
      (apertiTutti ? '<button class="btn largo" data-a="tutto" data-v="' + w.id + '">Ci sono tutto il weekend</button>' : '') +
      giorni +
      '<p class="piccolo" style="margin:0">Gli orari sono indicativi: quello preciso si decide nel gruppo. Si risponde fino a due giorni prima di ogni data.</p>' +
      '</main>' + barra('d');
  }

  function cardGiorno(g) {
    var slots = L.slotDi(g);
    var rs = slots.map(riep);
    var tot = rs.reduce(function (a, r) { return a + r.giocatori.length; }, 0);
    var aperte = rs.some(function (r) { return r.aperte; });
    var chiusura = rs[0].chiusura;
    var nota = aperte ? (chiusura ? 'rispondi entro ' + L.etichettaGiorno(chiusura).toLowerCase() : 'iscrizioni aperte') : (g < oggi() ? 'giornata passata' : 'iscrizioni chiuse');
    var fasce = slots.map(function (s, i) { return fascia(s, rs[i]); }).join('');
    var miei = slots.map(mia);
    var conMe = miei.some(function (m) { return m.ruolo && m.ruolo !== 'no'; });
    var acc = Math.max.apply(null, miei.map(function (m) { return m.acc || 0; }));
    return '<section class="card" aria-label="' + esc(L.etichettaLunga(g)) + '">' +
      '<div class="giorno-titolo"><span class="d">' + esc(L.etichettaGiorno(g)) + '</span><span class="piccolo">' + plur(tot, 'giocatore', 'giocatori') + ' · ' + esc(nota) + '</span></div>' +
      fasce +
      (conMe ? '<div class="riga separa"><span>Accompagnatori <span class="piccolo">(facoltativo)</span></span><div class="contatore">' +
        '<button class="tondo" aria-label="Un accompagnatore in meno" data-a="acc" data-g="' + g + '" data-v="-1"' + (aperte ? '' : ' disabled') + '>−</button><b>' + acc + '</b>' +
        '<button class="tondo" aria-label="Un accompagnatore in più" data-a="acc" data-g="' + g + '" data-v="1"' + (aperte ? '' : ' disabled') + '>+</button></div></div>' : '') +
      '</section>';
  }

  function fascia(s, r) {
    var f = L.fasciaDiSlot(s);
    var m = mia(s);
    var def = L.ORARI[f];
    var opzioni = [['gioco', 'Gioco'], ['guardo', 'Guardo'], ['post', 'Post'], ['no', 'No']];
    var btn = opzioni.map(function (o) {
      return '<button class="scelta" aria-pressed="' + (m.ruolo === o[0]) + '" data-a="ruolo" data-s="' + s + '" data-v="' + o[0] + '"' + (r.aperte ? '' : ' disabled') + '>' + o[1] + '</button>';
    }).join('');
    var orario = '';
    if (m.ruolo === 'gioco') {
      var a = m.dalle != null ? m.dalle : def[0], b = m.alle != null ? m.alle : def[1];
      if (S.orariAperti[s] && r.aperte) {
        orario = '<div class="orario"><label>Dalle <select data-c="dalle" data-s="' + s + '">' + opzOre(a, 7, 21) + '</select></label>' +
          '<label>alle <select data-c="alle" data-s="' + s + '">' + opzOre(b, 8, 22) + '</select></label>' +
          '<button class="link" data-a="orario" data-s="' + s + '">Fatto</button></div>';
      } else {
        orario = '<div class="orario"><span>' + (m.dalle != null ? 'Ci sei' : 'Orario indicativo') + ' ' + L.oraTesto(a) + '–' + L.oraTesto(b) + '</span>' +
          (r.aperte ? '<button class="link" data-a="orario" data-s="' + s + '">Cambia orario</button>' : '') + '</div>';
      }
    }
    var info = r.giocatori.length ? plur(r.giocatori.length, 'gioca', 'giocano') : 'nessuno ancora';
    if (r.stato === 'sigioca') info += ' · si gioca';
    if (r.stato === 'annullata') info = 'annullata';
    return '<div class="fascia"><div class="riga"><span class="etichetta">' + L.FASCE[f] + ' <span style="text-transform:none;letter-spacing:0;font-weight:500">· ' + def[0] + '–' + def[1] + '</span></span>' +
      '<a class="piccolo" href="#data/' + s + '" style="color:inherit">' + esc(info) + '</a></div>' +
      '<div class="scelte" role="group" aria-label="' + L.FASCE[f] + '">' + btn + '</div>' + orario + '</div>';
  }
  function opzOre(sel, da, a) {
    var h = ''; for (var i = da; i <= a; i++) h += '<option value="' + i + '"' + (i === +sel ? ' selected' : '') + '>' + L.oraTesto(i) + '</option>'; return h;
  }

  var ETICHETTE = { sigioca: 'Si gioca', votazione: 'In votazione', nonsigioca: 'Non si gioca', annullata: 'Annullata', giocata: 'Giocata', saltata: 'Non si è giocato' };
  var RUOLO_TESTO = { gioco: 'Gioco', guardo: 'Guardo', post: 'Post', no: 'No' };

  function vistaWeekend() {
    var lim = limitiMese();
    var wks = L.weekendDelMese(S.mese);
    var o = oggi();
    var tutte = [], daFare = 0;
    wks.forEach(function (w) { w.giorni.forEach(function (g) { L.slotDi(g).forEach(function (s) { tutte.push(riep(s)); }); }); if (w.giorni[1] >= o && weekendDaFare(w)) daFare++; });
    var conf = tutte.filter(function (r) { return r.stato === 'sigioca'; }).length;
    var schede = wks.map(schedaWeekend).join('');
    return '<header class="testata mare">' + I.palla + '<div class="occhiello">Le partite</div>' +
      '<div class="riga" style="align-items:flex-end;position:relative"><h1 class="titolo">I weekend<br>di ' + esc(L.nomeMese(S.mese)) + '</h1>' + navMese(S.mese, lim.min, lim.max, 'mese', '#FFF8EE') + '</div>' +
      '<div class="pills"><span class="pill piena">' + (conf ? plur(conf, 'partita confermata', 'partite confermate') : 'Nessuna partita ancora confermata') + '</span>' +
      (daFare ? '<a class="pill vuota" href="#disponibilita" style="text-decoration:none">Ti ' + (daFare === 1 ? 'manca 1 weekend' : 'mancano ' + daFare + ' weekend') + '</a>' : '') + '</div>' +
      rete() + '</header><main style="padding-top:14px">' + schede + '<a href="#admin" class="piccolo" style="text-align:center;padding:8px">Area organizzatore</a></main>' + barra('w');
  }

  function schedaWeekend(w) {
    var o = oggi();
    var rs = [];
    w.giorni.forEach(function (g) { L.slotDi(g).forEach(function (s) { rs.push(riep(s)); }); });
    var gioca = rs.filter(function (r) { return r.stato === 'sigioca'; });
    var passato = w.giorni[1] < o;
    var kind, stato;
    if (gioca.length) {
      kind = 'sigioca';
      var giorni = gioca.map(function (r) { return L.dow(r.data) === 6 ? 'sabato' : 'domenica'; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
      stato = 'Si gioca ' + giorni.join(' e ');
    } else if (passato) { kind = 'passato'; stato = rs.some(function (r) { return r.stato === 'giocata'; }) ? 'Giocato' : 'Passato'; }
    else if (rs.some(function (r) { return r.aperte; })) { kind = 'votazione'; stato = 'In votazione'; }
    else { kind = 'passato'; stato = 'Non si gioca'; }
    var d1 = L.parse(w.giorni[0]), d2 = L.parse(w.giorni[1]);
    var titolo = d1.getUTCDate() + '–' + d2.getUTCDate() + ' ' + L.MESI_BREVI[d2.getUTCMonth()];
    var righe = w.giorni.map(function (g) {
      var a = riep(L.slotId(g, 'M')), b = riep(L.slotId(g, 'P'));
      var best = b.giocatori.length > a.giocatori.length ? b : a;
      var altro = best === a ? b : a;
      var n = best.giocatori.length;
      var main = n ? L.FASCE[best.fascia] + ' · ' + plur(n, 'gioca', 'giocano') : 'Ancora nessuno';
      var sub;
      if (best.stato === 'annullata') sub = 'annullata';
      else if (best.stato === 'sigioca') sub = best.aperte ? 'si risponde fino a ' + L.etichettaGiorno(best.chiusura).toLowerCase() : 'iscrizioni chiuse';
      else if (best.stato === 'votazione') sub = (n ? 'mancano ' + best.mancano + ' per giocare · ' : '') + (best.chiusura ? 'chiude ' + L.etichettaGiorno(best.chiusura).toLowerCase() : 'iscrizioni aperte');
      else sub = ETICHETTE[best.stato].toLowerCase();
      if (altro.giocatori.length) sub += ' · ' + L.FASCE[altro.fascia].toLowerCase() + ' ' + altro.giocatori.length;
      var miei = [mia(a.id), mia(b.id)];
      var daFare = giornoDaFare(g);
      var top = ['gioco', 'guardo', 'post', 'no'].filter(function (x) { return miei.some(function (m) { return m.ruolo === x; }); })[0];
      var chip = daFare ? '<span class="io dafare">Da fare</span>' : top ? '<span class="io ' + top + '">Tu: ' + RUOLO_TESTO[top] + '</span>' : '';
      return '<a class="wk-riga" href="#data/' + best.id + '"><span class="g">' + L.GIORNI[L.dow(g)] + '</span><span class="c"><strong>' + esc(main) + '</strong><span>' + esc(sub) + '</span></span>' + chip + '</a>';
    }).join('');
    var apribile = rs.some(function (r) { return r.aperte; });
    var conDettaglio = rs.filter(function (r) { return r.stato === 'sigioca' || r.stato === 'giocata'; }).sort(function (x, y) { return y.giocatori.length - x.giocatori.length; })[0];
    return '<section class="wk"><div class="wk-testa ' + kind + '"><span class="t">' + esc(titolo) + '</span><span class="pill">' + esc(stato) + '</span></div>' +
      '<div class="wk-corpo">' + righe + '<div class="wk-piede"><a href="#disponibilita/' + w.id + '">' + I.matita + (apribile ? (weekendDaFare(w) ? 'Rispondi' : 'Modifica') : 'Le mie risposte') + '</a>' +
      (conDettaglio ? '<a href="#data/' + conDettaglio.id + '" style="color:#0F5F63">Squadre e campo' + I.dx + '</a>' : '') + '</div></div></section>';
  }

  // ---------- Dettaglio di una data ----------
  function vistaData(id) {
    if (!/^\d{4}-\d{2}-\d{2}-(M|P)$/.test(id)) return vistaWeekend();
    var r = riep(id);
    var f = r.fascia;
    var orario = r.orario ? L.oraTesto(r.orario[0]) + '–' + L.oraTesto(r.orario[1]) : 'orario indicativo ' + L.ORARI[f][0] + '–' + L.ORARI[f][1];
    var chip = ETICHETTE[r.stato] + (r.stato === 'sigioca' || r.stato === 'votazione' ? (r.aperte ? ' · iscrizioni aperte' : ' · iscrizioni chiuse') : '');
    var altro = L.slotId(r.data, f === 'M' ? 'P' : 'M');
    var tabs = '<div class="tabs-fascia">' + ['M', 'P'].map(function (x) {
      var sid = L.slotId(r.data, x);
      return '<a class="btn' + (x === f ? ' pieno' : '') + '" href="#data/' + sid + '"' + (x === f ? ' aria-current="page"' : '') + '>' + L.FASCE[x] + ' · ' + riep(sid).giocatori.length + '</a>';
    }).join('') + '</div>';
    void altro;

    var campo = campoDi(r.campo);
    var htmlCampo = campo ?
      '<div class="card campo">' + I.pin + '<span class="c"><strong>' + esc(campo.nome) + '</strong><span class="piccolo">' + esc([campo.indirizzo, plur(campo.campi, 'campo', 'campi'), campo.tipo, campo.costo ? campo.costo + '/ora' : ''].filter(Boolean).join(' · ')) + '</span>' +
      (campo.nota ? '<span class="piccolo">' + esc(campo.nota) + '</span>' : '') + '</span>' +
      '<a class="piccolo" style="font-weight:700;min-height:44px;display:flex;align-items:center" target="_blank" rel="noopener" href="' + esc(campo.mappa || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(campo.nome + ' ' + campo.indirizzo))) + '">Mappa</a></div>' :
      '<div class="card campo">' + I.pin + '<span class="c"><strong>Campo da decidere</strong><span class="piccolo">Lo sceglie l’organizzatore quando la data è confermata.</span></span></div>';

    return '<header class="testata mare"><a class="indietro" href="#weekend">' + I.sx + 'Weekend</a>' +
      '<div class="occhiello">' + L.FASCE[f] + ' · ' + esc(orario) + '</div>' +
      '<h1 class="titolo" style="font-size:52px">' + esc(L.etichettaGiorno(r.data)) + '</h1>' +
      '<div class="pills" style="margin-top:8px"><span class="pill arancio">' + esc(chip) + '</span></div>' + rete() + '</header>' +
      '<main style="padding-top:10px">' + tabs + htmlCampo + blocchiPartita(r, campo) + '</main>' + barra('w');
  }

  function graficoOre(giocatori) {
    var sv = L.sovrapposizione(giocatori);
    if (!sv.ore.length) return '';
    var cols = sv.ore.map(function (o) {
      return '<div class="col"><span class="v">' + o.n + '</span><div class="bar' + (o.n === sv.max ? ' top' : '') + '" style="height:' + Math.round(o.n / sv.max * 70) + '%"></div></div>';
    }).join('');
    var assi = sv.ore.map(function (o) { return '<span>' + o.ora + '</span>'; }).join('');
    return '<div class="card stretta"><div class="riga"><strong>Quando ci sono</strong><span class="piccolo">' +
      (sv.migliore ? 'meglio ' + L.oraTesto(sv.migliore[0]) + '–' + L.oraTesto(sv.migliore[1]) : '') + '</span></div>' +
      '<div class="ore" role="img" aria-label="Giocatori presenti per ora">' + cols + '</div><div class="ore-assi" aria-hidden="true">' + assi + '</div></div>';
  }

  // Squadre, formula e numeri: usati sia dal dettaglio sia dall'area admin.
  function blocchiPartita(r, campo, admin) {
    var nomi = nomiPersone();
    var out = '';
    out += graficoOre(r.giocatori);
    var n = r.giocatori.length;
    if (n >= L.MIN_GIOCATORI) {
      var sq = L.squadre(r.id, r.giocatori, r.imp);
      var per = sq.squadre.length ? Math.max.apply(null, sq.squadre.map(function (s) { return s.membri.length; })) : 0;
      out += '<div class="riga"><h2 class="h-display">Squadre</h2><span class="piccolo">' + plur(n, 'giocatore', 'giocatori') + ' · ' + plur(sq.squadre.length, 'squadra', 'squadre') + ' da ' + per + '</span></div>';
      if (sq.cambiati && admin) out += '<div class="avviso">Gli iscritti sono cambiati: le squadre spostate a mano sono state sostituite da una nuova proposta.</div>';
      out += '<div class="squadre">' + sq.squadre.map(function (s, i) {
        return '<div class="squadra"><span class="badge b' + (i % 8) + '">' + s.nome + '</span>' + s.membri.map(function (m) { return '<span>' + esc(nomi[m] || m) + '</span>'; }).join('') + '</div>';
      }).join('') + '</div>';
      if (sq.riserve.length) out += '<div class="card stretta"><strong>A rotazione</strong><div class="nomi">' + sq.riserve.map(function (m) { return '<span>' + esc(nomi[m] || m) + '</span>'; }).join('') + '</div></div>';
      out += formula(sq, r.imp, campo);
    } else if (r.stato !== 'annullata') {
      out += '<div class="card stretta"><strong>Squadre</strong><span class="piccolo">Le squadre compaiono quando siete almeno ' + L.MIN_GIOCATORI + '. ' + (n ? 'Mancano ' + r.mancano + '.' : '') + '</span></div>';
    }
    out += '<div class="numeri"><div class="numero"><b>' + r.guardano.length + '</b><span>vengono a guardare</span></div><div class="numero"><b>' + r.post.length + '</b><span>solo post-partita</span></div></div>';
    var chi = [['Giocano', r.giocatori], ['Guardano', r.guardano], ['Solo post-partita', r.post]].filter(function (x) { return x[1].length; });
    if (chi.length) {
      out += '<div class="card stretta"><strong>Chi c’è</strong>' + chi.map(function (x) {
        return '<span class="etichetta" style="margin-top:6px">' + x[0] + '</span><div class="nomi">' + x[1].map(function (p) { return '<span>' + esc(L.nomeBreve(p)) + (p.acc ? ' +' + p.acc : '') + '</span>'; }).join('') + '</div>';
      }).join('') + (r.accompagnatori ? '<span class="piccolo" style="margin-top:6px">Accompagnatori in tutto: ' + r.accompagnatori + '</span>' : '') + '</div>';
    }
    return out;
  }

  function formula(sq, imp, campo) {
    var lett = sq.squadre.map(function (s) { return s.nome; });
    if (lett.length < 2) return '';
    var tipo = imp.formula === 'eliminazione' ? 'eliminazione' : 'girone';
    var campi = campo ? campo.campi : 1;
    var corpo = '';
    if (tipo === 'girone') {
      var turni = L.girone(lett, campi);
      corpo = '<ol class="turni">' + turni.map(function (t, i) {
        return '<li><span class="n">Turno ' + (i + 1) + '</span><span>' + t.partite.map(function (p) { return p[0] + '–' + p[1]; }).join(' · ') + (t.riposa.length ? ' <span class="piccolo">(riposa ' + t.riposa.join(', ') + ')</span>' : '') + '</span></li>';
      }).join('') + '</ol>';
    } else {
      var el = L.eliminazione(lett);
      corpo = '<ol class="turni">' + el.map(function (t) {
        return '<li style="flex-direction:column;gap:2px"><span class="n">' + t.nome + '</span><span>' + t.incontri.map(function (m) { return '<b>' + m.n + '</b> ' + m.a + '–' + m.b; }).join(' · ') +
          (t.passano.length ? ' <span class="piccolo">(passa' + (t.passano.length > 1 ? 'no' : '') + ' il turno ' + t.passano.join(', ') + ')</span>' : '') + '</span></li>';
      }).join('') + '</ol>';
    }
    var titolo = tipo === 'girone' ? 'Formula: girone all’italiana' : 'Formula: eliminazione diretta';
    var nota = tipo === 'girone' ? 'Tutti contro tutti' + (campi > 1 ? ', ' + campi + ' campi in contemporanea' : ', un campo alla volta') + '.' : 'Chi perde esce; il numero indica la partita.';
    return '<div class="card stretta"><strong>' + titolo + '</strong><span class="piccolo">' + nota + '</span>' + corpo + '</div>';
  }

  // ---------- Area admin ----------
  function vistaAdmin() {
    if (!S.pin) {
      return '<div class="testata-admin"><span class="occhiello">' + I.lucchetto + 'Area admin</span><h1 class="titolo medio">Entra</h1></div>' +
        '<main><form class="card" data-f="pin"><div class="campo-form"><label for="pin">PIN</label><input id="pin" name="pin" type="password" inputmode="numeric" autocomplete="current-password" required></div>' +
        '<button class="btn arancio largo" type="submit">Entra</button>' + (api.prova ? '<span class="piccolo">Nella versione di prova il PIN è 1234.</span>' : '') + '</form>' +
        '<a href="#disponibilita" class="piccolo" style="text-align:center">Torna all’app</a></main>';
    }
    if (!S.dati) return S.errore ? vistaErrore() : vistaCaricamento();
    if (!S.meseAdmin) S.meseAdmin = S.mese || meseIniziale();
    var tabs = [['date', 'Date'], ['campi', 'Campi'], ['iscritti', 'Iscritti']].map(function (t) {
      return '<button aria-pressed="' + (S.tab === t[0]) + '" data-a="tab" data-v="' + t[0] + '">' + t[1] + '</button>';
    }).join('');
    var corpo = S.tab === 'campi' ? adminCampi() : S.tab === 'iscritti' ? adminIscritti() : adminDate();
    return '<div class="testata-admin"><div class="riga"><span class="occhiello">' + I.lucchetto + 'Area admin' + (api.prova ? ' · prova' : '') + '</span>' +
      '<span><a href="#disponibilita" style="font-weight:700;font-size:13px;margin-right:14px">App</a><button class="link" data-a="esciAdmin" style="background:none;border:0;color:#F59E6B;font-weight:700;font-size:13px;min-height:44px">Esci</button></span></div>' +
      '<div class="tabs">' + tabs + '</div></div><main>' + corpo + '</main>';
  }

  function slotDelMese(mese) {
    var out = [];
    L.weekendDelMese(mese).forEach(function (w) { w.giorni.forEach(function (g) { L.slotDi(g).forEach(function (s) { out.push(s); }); }); });
    return out;
  }
  function scegliSlotAdmin() {
    var slots = slotDelMese(S.meseAdmin);
    if (S.slotAdmin && slots.indexOf(S.slotAdmin) >= 0) return slots;
    var futuri = slots.filter(function (s) { return L.dataDiSlot(s) >= oggi(); }).map(riep);
    futuri.sort(function (a, b) { return b.giocatori.length - a.giocatori.length || (a.id < b.id ? -1 : 1); });
    S.slotAdmin = futuri.length ? futuri[0].id : slots[0];
    return slots;
  }
  function chipsSlot() {
    var lim = limitiMese();
    var slots = scegliSlotAdmin();
    return '<div class="riga"><h2 class="h-display" style="font-size:22px">' + esc(L.nomeMese(S.meseAdmin)) + '</h2>' + navMese(S.meseAdmin, lim.min, lim.max, 'meseAdmin', '#F4E9D8') + '</div>' +
      '<div class="slot-chips">' + slots.map(function (s) {
        var r = riep(s);
        return '<button aria-pressed="' + (s === S.slotAdmin) + '" data-a="slotAdmin" data-v="' + s + '"><b>' + esc(L.etichettaGiorno(r.data)) + ' · ' + r.fascia + '</b><span>' + r.giocatori.length + ' · ' + esc(ETICHETTE[r.stato].toLowerCase()) + '</span></button>';
      }).join('') + '</div>';
  }

  function adminDate() {
    var out = chipsSlot();
    var s = S.slotAdmin, r = riep(s), im = imp(s);
    var campo = campoDi(r.campo);
    out += '<div class="riga"><h1 class="titolo medio">' + esc(L.etichettaGiorno(r.data)) + '</h1><span class="piccolo">' + L.FASCE[r.fascia].toLowerCase() + ' · ' + plur(r.giocatori.length, 'gioca', 'giocano') + '</span></div>';

    var modo = im.iscrizioni || 'auto';
    out += '<div class="card"><div class="riga"><span><strong>Iscrizioni ' + (r.aperte ? 'aperte' : 'chiuse') + '</strong><br><span class="piccolo">Chiusura automatica: ' + esc(L.etichettaGiorno(L.chiusuraAuto(r.data)).toLowerCase()) + '</span></span></div>' +
      '<div class="scelte tre" role="group" aria-label="Iscrizioni">' + [['auto', 'Automatica'], ['chiuse', 'Chiudi ora'], ['aperte', 'Tieni aperte']].map(function (o) {
        return '<button class="scelta" aria-pressed="' + (modo === o[0]) + '" data-a="iscrizioni" data-v="' + o[0] + '">' + o[1] + '</button>';
      }).join('') + '</div>' +
      '<button class="btn ' + (im.annullata ? 'pieno' : 'pericolo') + ' mini" data-a="annulla">' + (im.annullata ? 'Ripristina la data' : 'Annulla questa data') + '</button></div>';

    var camp = '<option value="">Da decidere</option>' + S.dati.campi.map(function (c) { return '<option value="' + esc(c.id) + '"' + (c.id === r.campo ? ' selected' : '') + '>' + esc(c.nome) + '</option>'; }).join('');
    var sv = L.sovrapposizione(r.giocatori);
    var o0 = r.orario ? r.orario[0] : (sv.migliore ? sv.migliore[0] : L.ORARI[r.fascia][0]);
    var o1 = r.orario ? r.orario[1] : (sv.migliore ? sv.migliore[1] : L.ORARI[r.fascia][1]);
    out += '<div class="card"><strong>Campo e orario</strong><div class="campo-form"><label for="campo-sel">Campo</label><select id="campo-sel" data-c="campoData">' + camp + '</select></div>' +
      '<div class="orario"><span>' + (r.orario ? 'Orario confermato' : 'Orario da confermare') + '</span>' +
      '<label>dalle <select class="mini" data-c="orarioDa">' + opzOre(o0, 7, 21) + '</select></label><label>alle <select class="mini" data-c="orarioA">' + opzOre(o1, 8, 22) + '</select></label></div>' +
      '<div class="scelte due"><button class="btn mini pieno" data-a="confermaOrario">' + (r.orario ? 'Aggiorna orario' : 'Conferma orario') + '</button>' +
      (r.orario ? '<button class="btn mini" data-a="togliOrario">Torna a indicativo</button>' : '') + '</div></div>';

    var n = r.giocatori.length;
    if (n >= 2) {
      var sq = L.squadre(s, r.giocatori, im);
      var ns = +im.nSquadre || L.numeroSquadreAuto(n);
      var per = +im.perSquadra || Math.ceil(n / ns);
      out += '<div class="card"><div class="riga"><strong>Squadre</strong>' + (im.nSquadre || im.perSquadra ? '<button class="btn mini" data-a="squadreAuto">Automatico</button>' : '<span class="piccolo">automatico</span>') + '</div>' +
        '<div class="scelte due">' + passo('Numero squadre', ns, 'nSquadre') + passo('Giocatori per squadra', per, 'perSquadra') + '</div>' +
        '<div class="scelte due" role="group" aria-label="Formula">' + [['girone', 'Girone'], ['eliminazione', 'Eliminazione']].map(function (o) {
          return '<button class="scelta" aria-pressed="' + ((im.formula || 'girone') === o[0]) + '" data-a="formula" data-v="' + o[0] + '">' + o[1] + '</button>';
        }).join('') + '</div>' +
        '<div class="scelte due"><button class="btn mini" data-a="sposta">' + (S.sposta ? 'Fine spostamenti' : 'Sposta giocatori') + '</button>' +
        (sq.manuali ? '<button class="btn mini" data-a="squadreReset">Proposta automatica</button>' : '') + '</div>' +
        (S.sposta ? spostaGiocatori(sq) : '') + '</div>';
    }
    out += blocchiPartita(r, campo, true);

    var testo = messaggioData(r, campo);
    out += cardMessaggio('Messaggio per il gruppo', testo);
    out += cardMessaggio('Annuncio: disponibilità di ' + L.nomeMese(S.meseAdmin), messaggioAnnuncio(S.meseAdmin));
    return out;
  }
  function passo(etichetta, v, campo) {
    return '<div style="display:flex;flex-direction:column;gap:6px"><span class="piccolo">' + etichetta + '</span><div class="riga" style="background:#14232B;border-radius:12px;padding:2px">' +
      '<button class="tondo" style="border:0" aria-label="' + etichetta + ': meno" data-a="passo" data-k="' + campo + '" data-v="-1">−</button><b style="font-family:var(--display);font-size:24px;font-weight:400">' + v + '</b>' +
      '<button class="tondo" style="border:0" aria-label="' + etichetta + ': più" data-a="passo" data-k="' + campo + '" data-v="1">+</button></div></div>';
  }
  function spostaGiocatori(sq) {
    var nomi = nomiPersone();
    var opz = sq.squadre.map(function (s, i) { return [String(i), 'Squadra ' + s.nome]; }).concat([['r', 'A rotazione']]);
    var righe = [];
    sq.squadre.forEach(function (s, i) { s.membri.forEach(function (m) { righe.push([m, String(i)]); }); });
    sq.riserve.forEach(function (m) { righe.push([m, 'r']); });
    return '<div class="lista">' + righe.map(function (x) {
      return '<div class="voce"><span class="c"><strong>' + esc(nomi[x[0]] || x[0]) + '</strong></span><select class="mini" aria-label="Squadra di ' + esc(nomi[x[0]] || x[0]) + '" data-c="sposta" data-p="' + esc(x[0]) + '">' +
        opz.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === x[1] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
    }).join('') + '</div>';
  }
  function cardMessaggio(titolo, testo) {
    return '<div class="card"><strong>' + esc(titolo) + '</strong><p class="messaggio">' + esc(testo) + '</p>' +
      '<div class="scelte due"><button class="btn mini" data-a="copia" data-t="' + esc(testo) + '">Copia</button>' +
      '<a class="btn mini verde" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(testo) + '">Apri WhatsApp</a></div></div>';
  }
  function messaggioData(r, campo) {
    var quando = L.etichettaLunga(r.data) + ', ' + L.FASCE[r.fascia].toLowerCase();
    var orario = r.orario ? 'dalle ' + L.oraTesto(r.orario[0]) + ' alle ' + L.oraTesto(r.orario[1]) : 'orario da definire (indicativo ' + L.ORARI[r.fascia][0] + '–' + L.ORARI[r.fascia][1] + ')';
    var link = linkApp() + '#data/' + r.id;
    if (r.stato === 'annullata') return 'Beach volley: la partita di ' + quando + ' è annullata. Ci vediamo alla prossima!\n' + linkApp() + '#weekend';
    if (r.giocatori.length >= L.MIN_GIOCATORI) {
      var sq = L.squadre(r.id, r.giocatori, r.imp);
      return 'Beach volley tra colleghi\nSi gioca ' + quando + ', ' + orario + '.\n' +
        (campo ? 'Campo: ' + campo.nome + (campo.indirizzo ? ', ' + campo.indirizzo : '') + '\n' : 'Campo: da decidere\n') +
        'Siamo in ' + r.giocatori.length + ' a giocare' + (sq.squadre.length > 1 ? ', ' + sq.squadre.length + ' squadre' : '') + (r.guardano.length ? ' e ' + r.guardano.length + ' a guardare' : '') + '.\n' +
        (r.aperte ? 'Chi vuole aggiungersi ha tempo fino a ' + L.etichettaLunga(r.chiusura || r.data) + '.\n' : '') +
        'Squadre e dettagli: ' + link;
    }
    return 'Beach volley: per ' + quando + ' siamo in ' + r.giocatori.length + ', ne mancano ' + r.mancano + ' per giocare.\n' +
      (r.aperte && r.chiusura ? 'Se ci sei segnalo nell’app entro ' + L.etichettaLunga(r.chiusura) + ': ' : 'Disponibilità nell’app: ') + linkApp() + '#disponibilita/' + r.data;
  }
  function messaggioAnnuncio(mese) {
    return 'Beach volley tra colleghi\nSono aperte le disponibilità per i weekend di ' + L.nomeMese(mese) + '.\nSegna quando ci sei, ci vuole un minuto: ' + linkApp() +
      '\nSi risponde fino a due giorni prima di ogni data e puoi cambiare idea quando vuoi.';
  }

  function adminCampi() {
    var c = S.campoEdit;
    if (c) {
      return '<form class="card" data-f="campo"><strong>' + (c.id ? 'Modifica campo' : 'Nuovo campo') + '</strong>' +
        campoInput('Nome', 'nome', c.nome, 'text', true) + campoInput('Indirizzo', 'indirizzo', c.indirizzo) +
        campoInput('Numero di campi', 'campi', c.campi || 1, 'number') + campoInput('Costo orario', 'costo', c.costo, 'text', false, 'es. 20 € a campo') +
        '<div class="campo-form"><label for="f-tipo">Tipo</label><select id="f-tipo" name="tipo"><option value="outdoor"' + (c.tipo !== 'indoor' ? ' selected' : '') + '>Outdoor</option><option value="indoor"' + (c.tipo === 'indoor' ? ' selected' : '') + '>Indoor</option></select></div>' +
        '<div class="campo-form"><label for="f-nota">Nota di valutazione</label><textarea id="f-nota" name="nota" maxlength="300">' + esc(c.nota) + '</textarea></div>' +
        campoInput('Link mappa (facoltativo)', 'mappa', c.mappa, 'url') +
        '<div class="scelte due"><button class="btn" type="button" data-a="annullaCampo">Annulla</button><button class="btn arancio" type="submit">Salva</button></div></form>';
    }
    var lista = S.dati.campi.length ? S.dati.campi.map(function (x) {
      return '<div class="card stretta"><div class="riga"><strong>' + esc(x.nome) + '</strong><span class="piccolo">' + esc(x.tipo) + '</span></div>' +
        '<span class="piccolo">' + esc([x.indirizzo, plur(x.campi, 'campo', 'campi'), x.costo ? x.costo + '/ora' : ''].filter(Boolean).join(' · ')) + '</span>' +
        (x.nota ? '<span class="piccolo">' + esc(x.nota) + '</span>' : '') +
        '<div class="scelte due" style="margin-top:6px"><button class="btn mini" data-a="modCampo" data-v="' + esc(x.id) + '">Modifica</button><button class="btn mini pericolo" data-a="delCampo" data-v="' + esc(x.id) + '">Elimina</button></div></div>';
    }).join('') : '<div class="vuoto">Nessun campo ancora.</div>';
    return '<button class="btn arancio largo" data-a="nuovoCampo">Aggiungi un campo</button>' + lista;
  }
  function campoInput(etichetta, nome, val, tipo, req, ph) {
    return '<div class="campo-form"><label for="f-' + nome + '">' + etichetta + '</label><input id="f-' + nome + '" name="' + nome + '" type="' + (tipo || 'text') + '"' + (tipo === 'number' ? ' min="1" max="20"' : '') +
      (req ? ' required' : '') + (ph ? ' placeholder="' + esc(ph) + '"' : '') + ' value="' + esc(val == null ? '' : val) + '"></div>';
  }

  function adminIscritti() {
    var out = chipsSlot();
    var s = S.slotAdmin;
    var rs = (S.dati.risposte || []).filter(function (r) { return r.slot === s; });
    var ordine = { gioco: 0, guardo: 1, post: 2, no: 3 };
    rs.sort(function (a, b) { return ordine[a.ruolo] - ordine[b.ruolo] || L.nomeCompleto(a).localeCompare(L.nomeCompleto(b), 'it'); });
    out += '<div class="card"><strong>' + esc(L.etichettaGiorno(L.dataDiSlot(s))) + ' · ' + L.FASCE[L.fasciaDiSlot(s)] + '</strong>' + (rs.length ? '<div class="lista">' + rs.map(function (r) {
      var o = r.ruolo === 'gioco' ? L.orarioDi(r) : null;
      return '<div class="voce"><span class="c"><strong>' + esc(L.nomeCompleto(r)) + '</strong><span>' + RUOLO_TESTO[r.ruolo] + (o ? ' · ' + o[0] + '–' + o[1] : '') + (r.acc ? ' · +' + r.acc + ' accompagnatori' : '') + '</span></span>' +
        '<button class="btn mini pericolo" data-a="delRisposta" data-p="' + esc(r.persona) + '" data-n="' + esc(L.nomeCompleto(r)) + '">Elimina</button></div>';
    }).join('') + '</div>' : '<div class="vuoto">Nessuna risposta per questa fascia.</div>') + '</div>';
    return out;
  }

  function salvaAdmin(op, dati, msg) {
    return api.admin(S.pin, op, dati).then(function (r) {
      if (r.stato) S.dati = r.stato;
      if (msg !== false) toast(msg || 'Salvato');
      render();
      return r;
    }).catch(function (e) {
      toast(e.message || 'Errore');
      if (/PIN/.test(e.message || '')) { S.pin = null; scriviSessione('bv-pin', null); render(); }
      throw e;
    });
  }
  function impostaData(modifiche, msg) { return salvaAdmin('impostaData', { slot: S.slotAdmin, modifiche: modifiche }, msg).catch(function () {}); }

  function copia(testo) {
    var fatto = function () { toast('Messaggio copiato'); };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(testo).then(fatto, function () { copiaVecchio(testo); fatto(); }); }
    else { copiaVecchio(testo); fatto(); }
  }
  function copiaVecchio(testo) {
    var t = document.createElement('textarea'); t.value = testo; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) { /* niente */ } document.body.removeChild(t);
  }

  // ---------- Azioni ----------
  var A = {
    riprova: function () { S.errore = null; render(); carica(); },
    reinvia: function () { invia(); },
    esci: function () { if (confirm('Vuoi cambiare nome? Le risposte già date restano salvate.')) { S.me = null; scriviLocale('bv-io', null); S.pendenti = {}; render(); } },
    mese: function (d) { S.mese = L.addMesi(S.mese, +d.v); S.wk = null; if (percorso().arg) vai('#' + percorso().vista); else render(); },
    wk: function (d) { S.wk = d.v; vai('#disponibilita/' + d.v); },
    ruolo: function (d) { modifica(d.s, { ruolo: d.v }); },
    orario: function (d) { S.orariAperti[d.s] = !S.orariAperti[d.s]; render(); },
    tutto: function (d) {
      var w = L.weekendDelMese(L.meseDi(d.v)).filter(function (x) { return x.id === d.v; })[0];
      w.giorni.forEach(function (g) { L.slotDi(g).forEach(function (s) { if (riep(s).aperte) modifica(s, { ruolo: 'gioco' }); }); });
      toast('Segnato: giochi in tutte le fasce aperte');
    },
    acc: function (d) {
      L.slotDi(d.g).forEach(function (s) {
        var m = mia(s);
        if (m.ruolo && m.ruolo !== 'no' && riep(s).aperte) modifica(s, { acc: Math.max(0, Math.min(10, (m.acc || 0) + +d.v)) });
      });
    },
    tab: function (d) { S.tab = d.v; S.campoEdit = null; render(); },
    esciAdmin: function () { S.pin = null; scriviSessione('bv-pin', null); vai('#disponibilita'); },
    meseAdmin: function (d) { S.meseAdmin = L.addMesi(S.meseAdmin, +d.v); S.slotAdmin = null; S.sposta = false; render(); },
    slotAdmin: function (d) { S.slotAdmin = d.v; S.sposta = false; render(); },
    iscrizioni: function (d) { impostaData({ iscrizioni: d.v === 'auto' ? null : d.v }, d.v === 'chiuse' ? 'Iscrizioni chiuse' : d.v === 'aperte' ? 'Iscrizioni tenute aperte' : 'Chiusura automatica'); },
    annulla: function () {
      var im = imp(S.slotAdmin);
      if (!im.annullata && !confirm('Annullare questa data? I colleghi la vedranno come annullata.')) return;
      impostaData({ annullata: im.annullata ? null : true }, im.annullata ? 'Data ripristinata' : 'Data annullata');
    },
    confermaOrario: function () {
      var a = +document.querySelector('[data-c="orarioDa"]').value, b = +document.querySelector('[data-c="orarioA"]').value;
      if (b <= a) { toast('L’ora di fine deve essere dopo l’inizio'); return; }
      impostaData({ orario: [a, b] }, 'Orario confermato');
    },
    togliOrario: function () { impostaData({ orario: null }, 'Orario tornato indicativo'); },
    squadreAuto: function () { impostaData({ nSquadre: null, perSquadra: null, manuali: null }, 'Squadre automatiche'); },
    passo: function (d) {
      var r = riep(S.slotAdmin), im = imp(S.slotAdmin), n = r.giocatori.length;
      var ns = +im.nSquadre || L.numeroSquadreAuto(n), per = +im.perSquadra || Math.ceil(n / ns);
      var m = { manuali: null };
      if (d.k === 'nSquadre') { ns = Math.max(1, Math.min(n, ns + +d.v)); m.nSquadre = ns; m.perSquadra = im.perSquadra ? Math.max(Math.ceil(n / ns), 1) : null; }
      else { per = Math.max(1, Math.min(n, per + +d.v)); m.perSquadra = per; m.nSquadre = ns; }
      impostaData(m, false);
    },
    formula: function (d) { impostaData({ formula: d.v === 'girone' ? null : d.v }, false); },
    sposta: function () { S.sposta = !S.sposta; render(); },
    squadreReset: function () { impostaData({ manuali: null }, 'Proposta automatica'); },
    copia: function (d) { copia(d.t); },
    nuovoCampo: function () { S.campoEdit = { tipo: 'outdoor', campi: 1 }; render(); },
    modCampo: function (d) { S.campoEdit = Object.assign({}, campoDi(d.v)); render(); },
    annullaCampo: function () { S.campoEdit = null; render(); },
    delCampo: function (d) { var c = campoDi(d.v); if (c && confirm('Eliminare il campo "' + c.nome + '"?')) salvaAdmin('eliminaCampo', { id: d.v }, 'Campo eliminato').catch(function () {}); },
    delRisposta: function (d) { if (confirm('Eliminare la risposta di ' + d.n + '?')) salvaAdmin('eliminaRisposta', { slot: S.slotAdmin, persona: d.p }, 'Risposta eliminata').catch(function () {}); }
  };

  var C = {
    dalle: function (el) { modifica(el.dataset.s, { dalle: +el.value, alle: Math.max(+el.value + 1, mia(el.dataset.s).alle != null ? mia(el.dataset.s).alle : L.ORARI[L.fasciaDiSlot(el.dataset.s)][1]) }); },
    alle: function (el) { var s = el.dataset.s, m = mia(s); var da = m.dalle != null ? m.dalle : L.ORARI[L.fasciaDiSlot(s)][0]; modifica(s, { dalle: Math.min(da, +el.value - 1), alle: +el.value }); },
    campoData: function (el) { impostaData({ campo: el.value || null }, 'Campo aggiornato'); },
    sposta: function (el) {
      var r = riep(S.slotAdmin), sq = L.squadre(S.slotAdmin, r.giocatori, imp(S.slotAdmin));
      var p = el.dataset.p;
      var squadre = sq.squadre.map(function (s) { return s.membri.filter(function (m) { return m !== p; }); });
      var riserve = sq.riserve.filter(function (m) { return m !== p; });
      if (el.value === 'r') riserve.push(p); else squadre[+el.value].push(p);
      impostaData({ manuali: { chiavi: r.giocatori.map(function (g) { return g.persona; }), squadre: squadre, riserve: riserve } }, false);
    }
  };

  var F = {
    entra: function (f) {
      var nome = L.pulisci(f.nome.value), cognome = L.pulisci(f.cognome.value);
      if (!nome || !cognome) return;
      S.me = { nome: L.maiuscola(nome), cognome: L.maiuscola(cognome) };
      scriviLocale('bv-io', S.me);
      render();
      if (!S.dati) carica();
    },
    pin: function (f) {
      var pin = f.pin.value;
      api.admin(pin, 'verifica').then(function () {
        S.pin = pin; scriviSessione('bv-pin', pin);
        if (!S.dati) carica(); else render();
      }).catch(function (e) { toast(e.message || 'PIN errato'); });
    },
    campo: function (f) {
      var c = { id: S.campoEdit.id || '', nome: f.nome.value, indirizzo: f.indirizzo.value, campi: +f.campi.value || 1, costo: f.costo.value, tipo: f.tipo.value, nota: f.nota.value, mappa: f.mappa.value };
      salvaAdmin('salvaCampo', { campo: c }, 'Campo salvato').then(function () { S.campoEdit = null; render(); }).catch(function () {});
    }
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    var f = A[el.dataset.a];
    if (f) { e.preventDefault(); f(el.dataset, el); }
  });
  document.addEventListener('change', function (e) {
    var el = e.target.closest('[data-c]');
    if (el && C[el.dataset.c]) C[el.dataset.c](el);
  });
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-f]');
    if (f && F[f.dataset.f]) { e.preventDefault(); F[f.dataset.f](f); }
  });
  window.addEventListener('hashchange', function () { S.sposta = false; render(); window.scrollTo(0, 0); });

  // Aggiorno i dati ogni minuto quando l'app è in primo piano, così si vedono le risposte degli altri.
  function aggiorna() {
    if (document.visibilityState !== 'visible' || S.inviando || Object.keys(S.pendenti).length || S.campoEdit) return;
    var a = document.activeElement;
    if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
    carica(true);
  }
  setInterval(aggiorna, 60000);
  document.addEventListener('visibilitychange', aggiorna);

  render();
  carica();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* l'app funziona anche senza */ });
  }

  window.BVApp = { stato: S, render: render };
})();
