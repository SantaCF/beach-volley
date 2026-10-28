# Beach Volley tra colleghi

App web (installabile sul telefono) per organizzare le partite di beach volley tra colleghi nel weekend.

- **Giocatori**: scrivono nome e cognome una volta sola, segnano per ogni weekend se giocano, guardano o vengono solo al post-partita, e possono cambiare idea quando vogliono. Vedono i weekend, chi c'è, le squadre proposte e il campo.
- **Admin** (con PIN): chiude o riapre le iscrizioni, annulla una data, sceglie campo e orario, numero di squadre e giocatori per squadra, girone o eliminazione diretta, sposta i giocatori, gestisce la scheda campi, cancella risposte e copia i messaggi pronti per WhatsApp.

Regole: si gioca con almeno 6 giocatori; si risponde fino a due giorni prima di ogni data; le squadre restano uguali finché non cambiano gli iscritti. Nessuna mail né telefono.

## Come è fatta

- La pagina (questi file) è pubblicata gratis con **GitHub Pages**.
- I dati stanno in un **Google Foglio** gestito da uno script (`apps-script/Codice.gs`) pubblicato come app web dal tuo account Google.
- Finché in `js/config.js` non c'è l'indirizzo dello script, l'app gira in **versione di prova**: i dati restano solo sul telefono e il PIN admin è `1234`.

## Messa in funzione (una volta sola)

### 1. Pubblicare la pagina
1. Nel repository su GitHub apri **Settings** → **Pages**.
2. In *Build and deployment* scegli **Deploy from a branch**, ramo **main**, cartella **/ (root)**, poi **Save**.
3. Dopo un paio di minuti l'app è su `https://santacf.github.io/beach-volley/` (in versione di prova).

### 2. Creare il Foglio dati
1. Apri [sheets.new](https://sheets.new) (con l'account Google che vuoi usare) e chiamalo `Beach Volley app – dati`.
2. Menu **Estensioni** → **Apps Script**.
3. Cancella tutto quello che c'è nel file `Codice.gs` e incolla il contenuto di [`apps-script/Codice.gs`](apps-script/Codice.gs).
4. Nella riga `const PIN_ADMIN = 'CAMBIAMI';` sostituisci `CAMBIAMI` con il tuo PIN (es. `'4829'`). Salva (icona del dischetto).
5. In alto scegli la funzione **inizializza** e premi **Esegui**. Google chiede le autorizzazioni: *Rivedi autorizzazioni* → scegli l'account → *Avanzate* → *Vai a … (non sicuro)* → *Consenti*. Nel Foglio compaiono le schede Risposte, Date, Campi.

### 3. Pubblicare lo script
1. In Apps Script: **Esegui il deployment** → **Nuovo deployment**.
2. Ingranaggio → **App web**.
3. *Esegui come*: **Me**. *Chi ha accesso*: **Chiunque**.
4. **Esegui il deployment** e copia l'**URL dell'app web** (finisce con `/exec`).
5. Incolla l'URL in `js/config.js` al posto delle virgolette vuote di `API_URL` (oppure mandalo a Claude, che lo inserisce).

Se in futuro modifichi lo script: **Esegui il deployment** → **Gestisci deployment** → matita → *Versione*: **Nuova versione** → **Esegui il deployment**. L'URL resta lo stesso.

## Installare l'app sul telefono

- **iPhone (Safari)**: apri il link → tasto Condividi → **Aggiungi alla schermata Home**.
- **Android (Chrome)**: apri il link → menu ⋮ → **Installa app** (o *Aggiungi a schermata Home*).

L'area admin è all'indirizzo dell'app seguito da `#admin`.
