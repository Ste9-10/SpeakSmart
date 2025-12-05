// public/app.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("iscrizione-form");
  const messageEl = document.getElementById("form-message");

  if (!form || !messageEl) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    messageEl.textContent = "Invio in corso...";
    messageEl.className = "form-message";

    const formData = new FormData(form);
    const payload = {
      nome: formData.get("nome"),
      email: formData.get("email"),
      telefono: formData.get("telefono"),
      eta: formData.get("eta"),
      edizione: formData.get("edizione"),
      obiettivi: formData.get("obiettivi"),
      esperienza: formData.get("esperienza")
    };

    try {
      const res = await fetch("/api/iscrizioni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        messageEl.textContent = "Richiesta salvata! Ti contatteremo a breve.";
        messageEl.className = "form-message ok";
        form.reset();
      } else {
        throw new Error(data.error || "Errore sconosciuto");
      }
    } catch (err) {
      console.error(err);
      messageEl.textContent = "Errore durante il salvataggio. Riprova più tardi.";
      messageEl.className = "form-message error";
    }
  });
});
