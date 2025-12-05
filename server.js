// server.js
const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------
// CONFIGURAZIONE DB
// ---------------------
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("ERRORE: DATABASE_URL non è configurata.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false }
});

// ---------------------
// CREAZIONE TABELLE
// ---------------------
async function ensureTables() {
  const createIscrizioni = `
    CREATE TABLE IF NOT EXISTS iscrizioni (
      id SERIAL PRIMARY KEY,
      nome TEXT,
      email TEXT,
      telefono TEXT,
      eta INTEGER,
      edizione TEXT,
      obiettivi TEXT,
      esperienza TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  const createLezioni = `
    CREATE TABLE IF NOT EXISTS lezioni (
      id SERIAL PRIMARY KEY,
      titolo TEXT NOT NULL,
      descrizione TEXT,
      link TEXT,
      categoria TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  const createRichieste = `
    CREATE TABLE IF NOT EXISTS richieste (
      id SERIAL PRIMARY KEY,
      nome_studente TEXT,
      email_studente TEXT,
      categoria TEXT NOT NULL,
      messaggio TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  const createUtenti = `
    CREATE TABLE IF NOT EXISTS utenti (
      id SERIAL PRIMARY KEY,
      nome TEXT,
      email TEXT,
      ruolo TEXT NOT NULL,          -- 'studente' o 'docente'
      categorie TEXT,               -- lista categorie (es. "a,b,c") per studente
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  try {
    await pool.query(createIscrizioni);
    await pool.query(createLezioni);
    await pool.query(createRichieste);
    await pool.query(createUtenti);
    console.log("Tabelle pronte.");
  } catch (err) {
    console.error("Errore nella creazione delle tabelle:", err);
  }
}
ensureTables();

// ---------------------
// MIDDLEWARE
// ---------------------
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------------------
// API ISCRIZIONE CORSO
// ---------------------
app.post("/api/iscrizioni", async (req, res) => {
  const { nome, email, telefono, eta, edizione, obiettivi, esperienza } =
    req.body || {};

  if (!nome || !email || !edizione) {
    return res.status(400).json({
      success: false,
      error: "Nome, email ed edizione sono obbligatori."
    });
  }

  const text = `
    INSERT INTO iscrizioni (nome, email, telefono, eta, edizione, obiettivi, esperienza)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, created_at;
  `;
  const values = [
    nome,
    email,
    telefono || null,
    eta ? Number(eta) : null,
    edizione,
    obiettivi || null,
    esperienza || null
  ];

  try {
    const result = await pool.query(text, values);
    const row = result.rows[0];
    return res.json({ success: true, id: row.id, created_at: row.created_at });
  } catch (error) {
    console.error("Errore salvataggio iscrizione:", error);
    return res.status(500).json({
      success: false,
      error: "Errore durante il salvataggio nel database."
    });
  }
});

// ---------------------
// API REGISTRAZIONE STUDENTE/DOCENTE
// ---------------------
app.post("/api/registrazione-studente", async (req, res) => {
  const { nome, email, categorie } = req.body || {};
  if (!email || !Array.isArray(categorie) || categorie.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Email e almeno una categoria sono obbligatorie."
    });
  }

  const cats = categorie.join(",");

  const text = `
    INSERT INTO utenti (nome, email, ruolo, categorie)
    VALUES ($1, $2, 'studente', $3)
    RETURNING id, created_at;
  `;
  const values = [nome || null, email, cats];

  try {
    const result = await pool.query(text, values);
    const row = result.rows[0];
    return res.json({
      success: true,
      id: row.id,
      created_at: row.created_at
    });
  } catch (err) {
    console.error("Errore registrazione studente:", err);
    return res.status(500).json({
      success: false,
      error: "Errore durante la registrazione dello studente."
    });
  }
});

app.post("/api/registrazione-docente", async (req, res) => {
  const { nome, email } = req.body || {};
  if (!email) {
    return res.status(400).json({
      success: false,
      error: "L'email è obbligatoria per il docente."
    });
  }

  const text = `
    INSERT INTO utenti (nome, email, ruolo, categorie)
    VALUES ($1, $2, 'docente', NULL)
    RETURNING id, created_at;
  `;
  const values = [nome || null, email];

  try {
    const result = await pool.query(text, values);
    const row = result.rows[0];
    return res.json({
      success: true,
      id: row.id,
      created_at: row.created_at
    });
  } catch (err) {
    console.error("Errore registrazione docente:", err);
    return res.status(500).json({
      success: false,
      error: "Errore durante la registrazione del docente."
    });
  }
});

// ---------------------
// API LEZIONI
// ---------------------
app.post("/api/lezioni", async (req, res) => {
  const { titolo, descrizione, link, categoria } = req.body || {};

  if (!titolo || !categoria) {
    return res.status(400).json({
      success: false,
      error: "Titolo e categoria sono obbligatori."
    });
  }

  const text = `
    INSERT INTO lezioni (titolo, descrizione, link, categoria)
    VALUES ($1, $2, $3, $4)
    RETURNING id, created_at;
  `;
  const values = [titolo, descrizione || null, link || null, categoria];

  try {
    const result = await pool.query(text, values);
    const row = result.rows[0];
    return res.json({
      success: true,
      id: row.id,
      created_at: row.created_at
    });
  } catch (error) {
    console.error("Errore inserimento lezione:", error);
    return res.status(500).json({
      success: false,
      error: "Errore durante il salvataggio della lezione."
    });
  }
});

app.get("/api/lezioni", async (req, res) => {
  const categoria = req.query.categoria || null;

  let text = `
    SELECT id, titolo, descrizione, link, categoria, created_at
    FROM lezioni
  `;
  const values = [];

  if (categoria) {
    text += " WHERE categoria = $1 ORDER BY created_at DESC;";
    values.push(categoria);
  } else {
    text += " ORDER BY created_at DESC;";
  }

  try {
    const result = await pool.query(text, values);
    return res.json({ success: true, lezioni: result.rows });
  } catch (error) {
    console.error("Errore recupero lezioni:", error);
    return res.status(500).json({
      success: false,
      error: "Errore durante il recupero delle lezioni."
    });
  }
});

// ---------------------
// API RICHIESTE STUDENTI
// ---------------------
app.post("/api/richieste", async (req, res) => {
  const { nome, email, categoria, messaggio } = req.body || {};

  if (!categoria || !messaggio) {
    return res.status(400).json({
      success: false,
      error: "Categoria e messaggio sono obbligatori."
    });
  }

  const text = `
    INSERT INTO richieste (nome_studente, email_studente, categoria, messaggio)
    VALUES ($1, $2, $3, $4)
    RETURNING id, created_at;
  `;
  const values = [nome || null, email || null, categoria, messaggio];

  try {
    const result = await pool.query(text, values);
    const row = result.rows[0];
    return res.json({
      success: true,
      id: row.id,
      created_at: row.created_at
    });
  } catch (error) {
    console.error("Errore inserimento richiesta:", error);
    return res.status(500).json({
      success: false,
      error: "Errore durante il salvataggio della richiesta."
    });
  }
});

app.get("/api/richieste", async (req, res) => {
  const categoria = req.query.categoria || null;

  let text = `
    SELECT id, nome_studente, email_studente, categoria, messaggio, created_at
    FROM richieste
  `;
  const values = [];

  if (categoria) {
    text += " WHERE categoria = $1 ORDER BY created_at DESC;";
    values.push(categoria);
  } else {
    text += " ORDER BY created_at DESC;";
  }

  try {
    const result = await pool.query(text, values);
    return res.json({ success: true, richieste: result.rows });
  } catch (error) {
    console.error("Errore recupero richieste:", error);
    return res.status(500).json({
      success: false,
      error: "Errore durante il recupero delle richieste."
    });
  }
});

// ---------------------
// PAGINE STATICHE
// ---------------------
app.get("/accesso", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "accesso.html"));
});

app.get("/area-studenti", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "area-studenti.html"));
});

app.get("/area-professori", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "area-professori.html"));
});

// fallback → homepage
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
});
