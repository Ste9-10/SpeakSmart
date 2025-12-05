// public/professori.js

const CATEGORIES = [
    { id: "nessuna-conoscenza", label: "Nessuna conoscenza pregressa" },
    { id: "problemi-ansia", label: "Problemi di ansia" },
    { id: "conoscenza-di-se", label: "Conoscenza di sé" },
    { id: "comunicazione-linguaggio", label: "Comunicazione e linguaggio" },
    { id: "strategie-colloquio", label: "Strategie di colloquio" },
    { id: "presentazione-professionale", label: "Presentazione professionale" }
  ];
  
  document.addEventListener("DOMContentLoaded", () => {
    const welcome = document.getElementById("prof-welcome");
  
    // Proviamo a leggere l’eventuale docente dal localStorage
    let raw = localStorage.getItem("speaksmart_docente");
    let docente = null;
    let isDocente = false;
  
    try {
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.ruolo === "docente") {
          docente = parsed;
          isDocente = true;
        }
      }
    } catch {
      // compat con vecchia versione dove salvavi solo "true"
      if (raw === "true") {
        isDocente = true;
      }
    }
  
    // 🔓 Nessun redirect: la pagina è SEMPRE visibile
    if (!isDocente) {
      if (welcome) {
        welcome.textContent =
          "Stai visualizzando l’area professori come ospite. " +
          "Puoi vedere richieste e lezioni; per registrarti come docente vai alla pagina di accesso.";
      }
    } else if (welcome) {
      const nome = docente?.nome ? `, ${docente.nome}` : "";
      welcome.textContent =
        "Accesso docente attivo" + nome + ". Qui trovi richieste e lezioni.";
    }
  
    const reqSelect = document.getElementById("prof-req-categoria");
    const lezSelect = document.getElementById("prof-lez-categoria");
    const richiesteTableBody =
      document.querySelector("#richieste-table tbody");
    const lezioniTableBody =
      document.querySelector("#lezioni-table tbody");
  
    // -------------------------
    // CARICAMENTO RICHIESTE
    // -------------------------
    async function loadRichieste() {
      if (!richiesteTableBody) return;
      const categoria = reqSelect ? reqSelect.value : "";
      let url = "/api/richieste";
      if (categoria) url += "?categoria=" + encodeURIComponent(categoria);
  
      richiesteTableBody.innerHTML =
        "<tr><td colspan='5'>Caricamento richieste…</td></tr>";
  
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Errore");
  
        const arr = data.richieste || [];
        if (!arr.length) {
          richiesteTableBody.innerHTML =
            "<tr><td colspan='5'>Nessuna richiesta trovata.</td></tr>";
          return;
        }
  
        richiesteTableBody.innerHTML = arr
          .map((r) => {
            const dataStr = new Date(r.created_at).toLocaleString();
            const nome = r.nome_studente || "—";
            const email = r.email_studente || "";
            const contatto = email ? `<a href="mailto:${email}">${email}</a>` : "—";
            const catLabel =
              CATEGORIES.find((c) => c.id === r.categoria)?.label ||
              r.categoria;
            const msg = (r.messaggio || "").replace(/\n/g, "<br>");
            return `
              <tr>
                <td>${dataStr}</td>
                <td>${nome}</td>
                <td>${catLabel}</td>
                <td>${msg}</td>
                <td>${contatto}</td>
              </tr>
            `;
          })
          .join("");
      } catch (err) {
        console.error(err);
        richiesteTableBody.innerHTML =
          "<tr><td colspan='5'>Errore durante il caricamento delle richieste.</td></tr>";
      }
    }
  
    // -------------------------
    // CARICAMENTO LEZIONI
    // -------------------------
    async function loadLezioni() {
      if (!lezioniTableBody) return;
      const categoria = lezSelect ? lezSelect.value : "";
      let url = "/api/lezioni";
      if (categoria) url += "?categoria=" + encodeURIComponent(categoria);
  
      lezioniTableBody.innerHTML =
        "<tr><td colspan='5'>Caricamento lezioni…</td></tr>";
  
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Errore");
  
        const arr = data.lezioni || [];
        if (!arr.length) {
          lezioniTableBody.innerHTML =
            "<tr><td colspan='5'>Nessuna lezione trovata.</td></tr>";
          return;
        }
  
        lezioniTableBody.innerHTML = arr
          .map((l) => {
            const dataStr = new Date(l.created_at).toLocaleString();
            const catLabel =
              CATEGORIES.find((c) => c.id === l.categoria)?.label ||
              l.categoria;
            const desc = (l.descrizione || "").replace(/\n/g, "<br>");
            const link = l.link
              ? `<a href="${l.link}" target="_blank" rel="noopener noreferrer">Apri</a>`
              : "—";
            return `
              <tr>
                <td>${dataStr}</td>
                <td>${l.titolo}</td>
                <td>${catLabel}</td>
                <td>${desc}</td>
                <td>${link}</td>
              </tr>
            `;
          })
          .join("");
      } catch (err) {
        console.error(err);
        lezioniTableBody.innerHTML =
          "<tr><td colspan='5'>Errore durante il caricamento delle lezioni.</td></tr>";
      }
    }
  
    if (reqSelect) reqSelect.addEventListener("change", loadRichieste);
    if (lezSelect) lezSelect.addEventListener("change", loadLezioni);
  
    loadRichieste();
    loadLezioni();
  
    // -------------------------
    // FORM NUOVA LEZIONE
    // (è comunque utilizzabile anche da “ospite”, perché non abbiamo auth vera)
    // -------------------------
    const lessonForm = document.getElementById("lesson-form");
    const lessonMessage = document.getElementById("lesson-message");
  
    if (lessonForm && lessonMessage) {
      lessonForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        lessonMessage.textContent = "Salvataggio in corso…";
        lessonMessage.className = "form-message";
  
        const fd = new FormData(lessonForm);
        const payload = {
          titolo: fd.get("titolo"),
          categoria: fd.get("categoria"),
          descrizione: fd.get("descrizione"),
          link: fd.get("link")
        };
  
        if (!payload.titolo || !payload.categoria) {
          lessonMessage.textContent = "Titolo e categoria sono obbligatori.";
          lessonMessage.className = "form-message error";
          return;
        }
  
        try {
          const res = await fetch("/api/lezioni", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
  
          if (res.ok && data.success) {
            lessonMessage.textContent = "Lezione salvata con successo.";
            lessonMessage.className = "form-message ok";
            lessonForm.reset();
            loadLezioni();
          } else {
            throw new Error(data.error || "Errore sconosciuto");
          }
        } catch (err) {
          console.error(err);
          lessonMessage.textContent =
            "Errore durante il salvataggio della lezione.";
          lessonMessage.className = "form-message error";
        }
      });
    }
  });
  