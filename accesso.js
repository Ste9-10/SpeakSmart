// public/accesso.js

const CATEGORIES = [
    { id: "nessuna-conoscenza", label: "Nessuna conoscenza pregressa" },
    { id: "problemi-ansia", label: "Problemi di ansia" },
    { id: "conoscenza-di-se", label: "Conoscenza di sé" },
    { id: "comunicazione-linguaggio", label: "Comunicazione e linguaggio" },
    { id: "strategie-colloquio", label: "Strategie di colloquio" },
    { id: "presentazione-professionale", label: "Presentazione professionale" }
  ];
  
  document.addEventListener("DOMContentLoaded", () => {
    // STUDENTE
    const studForm = document.getElementById("student-register-form");
    const studMsg = document.getElementById("student-register-message");
  
    if (studForm && studMsg) {
      studForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        studMsg.textContent = "Registrazione in corso…";
        studMsg.className = "form-message";
  
        const fd = new FormData(studForm);
        const nome = fd.get("nome") || "";
        const email = fd.get("email");
        const categorie = fd.getAll("categorie");
  
        if (!email || !categorie.length) {
          studMsg.textContent = "Email e almeno una categoria sono obbligatorie.";
          studMsg.className = "form-message error";
          return;
        }
  
        try {
          const res = await fetch("/api/registrazione-studente", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, email, categorie })
          });
          const data = await res.json();
  
          if (res.ok && data.success) {
            const obj = {
              id: data.id,
              nome,
              email,
              categorie,
              ruolo: "studente"
            };
            localStorage.setItem("speaksmart_studente", JSON.stringify(obj));
            studMsg.textContent = "Registrazione completata. Reindirizzamento…";
            studMsg.className = "form-message ok";
            setTimeout(() => {
              window.location.href = "/area-studenti";
            }, 800);
          } else {
            throw new Error(data.error || "Errore sconosciuto");
          }
        } catch (err) {
          console.error(err);
          studMsg.textContent =
            "Errore durante la registrazione. Riprova più tardi.";
          studMsg.className = "form-message error";
        }
      });
    }
  
    // DOCENTE
    const teachForm = document.getElementById("teacher-register-form");
    const teachMsg = document.getElementById("teacher-register-message");
  
    if (teachForm && teachMsg) {
      teachForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        teachMsg.textContent = "Registrazione in corso…";
        teachMsg.className = "form-message";
  
        const fd = new FormData(teachForm);
        const nome = fd.get("nome") || "";
        const email = fd.get("email");
  
        if (!email) {
          teachMsg.textContent = "L'email è obbligatoria.";
          teachMsg.className = "form-message error";
          return;
        }
  
        try {
          const res = await fetch("/api/registrazione-docente", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, email })
          });
          const data = await res.json();
  
          if (res.ok && data.success) {
            const obj = {
              id: data.id,
              nome,
              email,
              ruolo: "docente"
            };
            localStorage.setItem("speaksmart_docente", JSON.stringify(obj));
            teachMsg.textContent = "Registrazione completata. Reindirizzamento…";
            teachMsg.className = "form-message ok";
            setTimeout(() => {
              window.location.href = "/area-professori";
            }, 800);
          } else {
            throw new Error(data.error || "Errore sconosciuto");
          }
        } catch (err) {
          console.error(err);
          teachMsg.textContent =
            "Errore durante la registrazione. Riprova più tardi.";
          teachMsg.className = "form-message error";
        }
      });
    }
  });
  