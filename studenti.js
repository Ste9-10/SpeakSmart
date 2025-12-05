// public/studenti.js

const CATEGORIES = [
    { id: "nessuna-conoscenza", label: "Nessuna conoscenza pregressa" },
    { id: "problemi-ansia", label: "Problemi di ansia" },
    { id: "conoscenza-di-se", label: "Conoscenza di sé" },
    { id: "comunicazione-linguaggio", label: "Comunicazione e linguaggio" },
    { id: "strategie-colloquio", label: "Strategie di colloquio" },
    { id: "presentazione-professionale", label: "Presentazione professionale" }
  ];
  
  document.addEventListener("DOMContentLoaded", () => {
    // recupero dati studente da localStorage
    let studRaw = localStorage.getItem("speaksmart_studente");
    let stud = null;
    try {
      if (studRaw) stud = JSON.parse(studRaw);
    } catch {
      stud = null;
    }
  
    const welcome = document.getElementById("stud-welcome");
  
    if (!stud) {
      if (welcome) {
        welcome.textContent =
          "Non risulti registrato come studente. Verrai reindirizzato alla pagina di accesso…";
      }
      setTimeout(() => {
        window.location.href = "/accesso";
      }, 1200);
      return;
    }
  
    if (welcome) {
      const nome = stud.nome ? `, ${stud.nome}` : "";
      welcome.textContent =
        "Accesso studente attivo" + nome + ". Le categorie selezionate filtrano le lezioni.";
    }
  
    const selectedCats = Array.isArray(stud.categorie) ? stud.categorie : [];
    const filterContainer = document.getElementById("student-filter");
  
    // costruisci i filtri con selezione preimpostata
    function buildFilters() {
      if (!filterContainer) return;
      filterContainer.innerHTML = "";
  
      CATEGORIES.forEach((cat) => {
        const label = document.createElement("label");
        label.className = "filter-tag";
  
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = cat.id;
        input.checked =
          !selectedCats.length || selectedCats.includes(cat.id);
  
        input.addEventListener("change", applyCategoryFilter);
  
        const span = document.createElement("span");
        span.textContent = cat.label;
  
        label.appendChild(input);
        label.appendChild(span);
        filterContainer.appendChild(label);
      });
    }
  
    function activeCategories() {
      if (!filterContainer) return [];
      const inputs = filterContainer.querySelectorAll("input[type=checkbox]");
      const out = [];
      inputs.forEach((i) => i.checked && out.push(i.value));
      return out;
    }
  
    function applyCategoryFilter() {
      const active = activeCategories();
      const cards = document.querySelectorAll(".percorso-card");
      cards.forEach((card) => {
        const cat = card.getAttribute("data-category");
        if (!active.length || active.includes(cat)) {
          card.style.display = "";
        } else {
          card.style.display = "none";
        }
      });
  
      // aggiorna select richieste
      const reqSel = document.getElementById("req-categoria");
      if (reqSel) {
        reqSel.innerHTML = "";
        CATEGORIES.forEach((cat) => {
          if (!active.length || active.includes(cat.id)) {
            const opt = document.createElement("option");
            opt.value = cat.id;
            opt.textContent = cat.label;
            reqSel.appendChild(opt);
          }
        });
      }
    }
  
    buildFilters();
    applyCategoryFilter();
  
    // carica lezioni dal backend e riempie i blocchi
    async function loadLessons() {
      const containers = document.querySelectorAll(".lesson-list");
      if (!containers.length) return;
  
      try {
        const res = await fetch("/api/lezioni");
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Errore lezioni");
        }
  
        const lezioni = data.lezioni || [];
  
        containers.forEach((container) => {
          const cat = container.dataset.category;
          const filtered = lezioni.filter((l) => l.categoria === cat);
  
          if (!filtered.length) {
            container.innerHTML =
              '<p class="lesson-empty">Nessuna lezione caricata per questa categoria.</p>';
            return;
          }
  
          container.innerHTML = filtered
            .map((l) => {
              const desc = l.descrizione || "";
              const linkHtml = l.link
                ? `<div class="lesson-card-link"><a href="${l.link}" target="_blank" rel="noopener noreferrer">Apri materiale</a></div>`
                : "";
              return `
                <div class="lesson-card">
                  <div class="lesson-card-title">${l.titolo}</div>
                  ${desc ? `<div class="lesson-card-desc">${desc}</div>` : ""}
                  ${linkHtml}
                </div>
              `;
            })
            .join("");
        });
      } catch (err) {
        console.error(err);
        containers.forEach((c) => {
          c.innerHTML =
            '<p class="lesson-empty">Errore nel caricamento delle lezioni.</p>';
        });
      }
    }
  
    loadLessons();
  
    // form richieste
    const reqForm = document.getElementById("request-form");
    const reqMsg = document.getElementById("request-message");
  
    // precompila nome/email se presenti
    const reqNome = document.getElementById("req-nome");
    const reqEmail = document.getElementById("req-email");
    if (reqNome && stud.nome) reqNome.value = stud.nome;
    if (reqEmail && stud.email) reqEmail.value = stud.email;
  
    if (reqForm && reqMsg) {
      reqForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        reqMsg.textContent = "Invio richiesta…";
        reqMsg.className = "form-message";
  
        const fd = new FormData(reqForm);
        const payload = {
          nome: fd.get("nome") || "",
          email: fd.get("email") || "",
          categoria: fd.get("categoria"),
          messaggio: fd.get("messaggio")
        };
  
        if (!payload.categoria || !payload.messaggio.trim()) {
          reqMsg.textContent =
            "Categoria e messaggio sono obbligatori.";
          reqMsg.className = "form-message error";
          return;
        }
  
        try {
          const res = await fetch("/api/richieste", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
  
          if (res.ok && data.success) {
            reqMsg.textContent = "Richiesta inviata ai docenti.";
            reqMsg.className = "form-message ok";
            reqForm.reset();
            if (reqNome && stud.nome) reqNome.value = stud.nome;
            if (reqEmail && stud.email) reqEmail.value = stud.email;
          } else {
            throw new Error(data.error || "Errore sconosciuto");
          }
        } catch (err) {
          console.error(err);
          reqMsg.textContent =
            "Errore durante l’invio della richiesta. Riprova più tardi.";
          reqMsg.className = "form-message error";
        }
      });
    }
  });
  