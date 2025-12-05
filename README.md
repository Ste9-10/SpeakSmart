# Landing page corsi colloquio con invio SMS

Questo progetto è una landing page per l'iscrizione a corsi su come parlare ai colloqui di lavoro.
Quando un utente invia il modulo, il server invia un SMS al numero **+39 351 572 4009** con i dati della richiesta.

Stack:
- Frontend statico (HTML/CSS/JS)
- Backend Node.js + Express
- Integrazione SMS tramite Twilio
- Deploy pensato per Render partendo da una repo GitHub

---

## Come usare in locale

1. Installa Node.js (versione 18+ consigliata).
2. Clona la repo o estrai lo ZIP.
3. Dentro la cartella del progetto esegui:

```bash
npm install
```

4. Crea un file `.env` (solo per uso locale, su Render userai le variabili d'ambiente) con:

```bash
TWILIO_ACCOUNT_SID=il_tuo_account_sid
TWILIO_AUTH_TOKEN=il_tuo_auth_token
TWILIO_FROM_NUMBER=+39XXXXXXXXX  # numero Twilio verificato
PORT=3000
```

5. Avvia il server:

```bash
npm start
```

6. Apri il browser su <http://localhost:3000>

Compilando il form e cliccando **"Invia richiesta di iscrizione"** verrà chiamato l'endpoint `/api/send-sms` e, se Twilio è configurato correttamente, verrà inviato un SMS al numero configurato nel server (`+393515724009`).

---

## Deploy su Render usando GitHub

1. Crea una nuova repo su GitHub e carica tutti i file di questo progetto (inclusa la cartella `public`).  
2. Vai su [Render](https://render.com), crea un account (se non lo hai già) e scegli **"New + → Web Service"**.
3. Collega l'account GitHub e seleziona la repo appena creata.
4. Imposta:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

5. Nella sezione **Environment → Environment Variables**, aggiungi:

   - `TWILIO_ACCOUNT_SID` = il tuo Account SID Twilio
   - `TWILIO_AUTH_TOKEN` = il tuo Auth Token Twilio
   - `TWILIO_FROM_NUMBER` = il numero di telefono Twilio in formato `+39...`

6. Salva e deploya il servizio.

Quando Render avrà completato il deploy, apri l'URL del servizio: il sito sarà online e ogni invio del form genererà un SMS verso **+39 351 572 4009** (se Twilio è configurato correttamente).

---

## Note importanti

- Il progetto non contiene le tue credenziali Twilio: devono essere inserite come variabili d'ambiente.
- Il numero di destinazione (`+393515724009`) è hardcodato in `server.js`. Se vuoi cambiarlo, modifica quella costante e redeploya.
- Assicurati che il numero di partenza (`TWILIO_FROM_NUMBER`) sia un numero abilitato su Twilio e configurato correttamente per l'invio verso numeri italiani.
