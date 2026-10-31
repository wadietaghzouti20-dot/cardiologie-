(() => {
  "use strict";
  const cfg = window.RENDEVO_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const form = $("#appointment-form");
  const steps = $$(".form-step");
  const alertBox = $("#form-alert");
  const serviceBox = $("#service-options");
  let currentStep = 1;
  const totalSteps = steps.length;

  $("#year").textContent = new Date().getFullYear();
  $("#clinic-name").textContent = cfg.clinicName || "Cabinet médical";
  $("#footer-clinic").textContent = cfg.clinicName || "Cabinet médical";
  document.title = "Prendre rendez-vous | " + (cfg.clinicName || cfg.specialty || "Cabinet médical");
  if (cfg.phone) {
    const phone = $("#header-phone");
    phone.href = "tel:" + cfg.phone.replace(/[^+\d]/g, "");
    phone.querySelector("strong").textContent = cfg.phone;
  } else {
    $("#header-phone").addEventListener("click", e => { e.preventDefault(); showAlert("Les coordonnées du cabinet seront ajoutées lors de la configuration.", "info"); });
  }

  const iconFor = (label) => /grossesse|gynéco|cycle|contraception/i.test(label) ? "♡" : /ECG|électro|effort|cardio|tension/i.test(label) ? "♡" : /vision|fond d'œil|glaucome|ophtalmo|correction/i.test(label) ? "◉" : /résultat|suivi|contrôle/i.test(label) ? "✓" : "＋";
  (cfg.services || []).forEach((item, i) => {
    const label = document.createElement("label");
    label.className = "choice-card";
    const input = document.createElement("input");
    input.type = "radio"; input.name = "service"; input.value = item[0]; input.required = true;
    const icon = document.createElement("span"); icon.className = "choice-icon"; icon.setAttribute("aria-hidden","true"); icon.textContent = iconFor(item[0]);
    const text = document.createElement("span"); text.className = "choice-text";
    const strong = document.createElement("strong"); strong.textContent = item[0];
    const small = document.createElement("small"); small.textContent = item[1];
    text.append(strong, small);
    const arrow = document.createElement("span"); arrow.className = "choice-arrow"; arrow.setAttribute("aria-hidden","true"); arrow.textContent = "›";
    label.append(input, icon, text, arrow);
    serviceBox.append(label);
    input.addEventListener("change", () => {
      $$(".choice-card", serviceBox).forEach(card => card.classList.toggle("is-selected", $("input",card).checked));
      $("#other-reason-wrap").hidden = input.value !== "Autre motif";
      setStep(2);
    });
  });

  const dateInput = $("#appointment-date"), timeInput = $("#appointment-time");
  const timeStatus = $("#time-status");
  let availabilityLoading = false;
  let availabilityRequest = 0;
  let lastSlotDate = "";
  let lastSlotService = "";

  async function loadAvailableSlots() {
    const requestId = ++availabilityRequest;
    const date = dateInput.value;
    const service = value("service");
    const previousSelection = date === lastSlotDate && service === lastSlotService ? timeInput.value : "";
    timeInput.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";

    if (!date || !service) {
      placeholder.textContent = "Choisissez d’abord une date";
      timeInput.append(placeholder);
      timeInput.disabled = true;
      timeStatus.textContent = "Choisissez une date pour afficher les heures disponibles.";
      availabilityLoading = false;
      return;
    }

    placeholder.textContent = "Chargement des créneaux…";
    timeInput.append(placeholder);
    timeInput.disabled = true;
    timeStatus.textContent = "Recherche des heures disponibles…";
    availabilityLoading = true;

    try {
      if (!cfg.apiUrl || !/^https:\/\/script\.google\.com\/macros\/s\//.test(cfg.apiUrl)) {
        throw new Error("La connexion au service de réservation n’est pas configurée.");
      }
      const response = await fetch(cfg.apiUrl, {
        method: "POST",
        redirect: "follow",
        headers: {"Content-Type":"text/plain;charset=utf-8"},
        body: JSON.stringify({action:"availability", preferredDate:date, service:service})
      });
      if (!response.ok) throw new Error("Le service de réservation est temporairement indisponible.");
      const result = await response.json();
      if (!result || result.success !== true) {
        throw new Error(result && result.message ? result.message : "Impossible de charger les créneaux.");
      }
      if (requestId !== availabilityRequest) return;

      const slots = Array.isArray(result.availableSlots) ? result.availableSlots : [];
      timeInput.replaceChildren();
      const firstOption = document.createElement("option");
      firstOption.value = "";
      firstOption.textContent = slots.length ? "Sélectionnez une heure" : "Aucun créneau disponible";
      timeInput.append(firstOption);
      slots.forEach(slot => {
        const option = document.createElement("option");
        option.value = slot;
        option.textContent = slot;
        if (slot === previousSelection) option.selected = true;
        timeInput.append(option);
      });
      timeInput.disabled = slots.length === 0;
      lastSlotDate = date;
      lastSlotService = service;
      timeStatus.textContent = result.message || (slots.length
        ? "Ces créneaux sont disponibles au moment de la vérification."
        : "Aucun créneau disponible. Essayez une autre date.");
    } catch (error) {
      if (requestId !== availabilityRequest) return;
      timeInput.replaceChildren();
      const errorOption = document.createElement("option");
      errorOption.value = "";
      errorOption.textContent = "Créneaux indisponibles";
      timeInput.append(errorOption);
      timeInput.disabled = true;
      timeStatus.textContent = error instanceof Error ? error.message : "Impossible de charger les créneaux.";
    } finally {
      if (requestId === availabilityRequest) availabilityLoading = false;
    }
  }

  const todayParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: cfg.timezone || "Africa/Algiers",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const todayValues = Object.fromEntries(todayParts.map(part => [part.type, part.value]));
  const todayStr = `${todayValues.year}-${todayValues.month}-${todayValues.day}`;

  dateInput.min = todayStr;
  dateInput.addEventListener("change", loadAvailableSlots);

  function showAlert(message, type = "error") {
    alertBox.textContent = message; alertBox.className = "form-alert " + type; alertBox.hidden = false;
    alertBox.scrollIntoView({behavior:"smooth",block:"nearest"});
  }
  function clearAlert(){ alertBox.hidden = true; alertBox.textContent = ""; }
  function validateStep(n) {
    clearAlert();
    if (n === 1 && !form.querySelector('input[name="service"]:checked')) return "Choisissez un motif de rendez-vous pour continuer.";
    if (n === 2) {
      if (!dateInput.value) return "Choisissez une date souhaitée.";
      if (dateInput.value < todayStr) return "La date souhaitée doit être aujourd'hui ou dans le futur.";
      if (availabilityLoading) return "Veuillez attendre le chargement des créneaux disponibles.";
      if (!timeInput.value) return "Veuillez sélectionner une heure disponible avant de continuer.";
    }
    if (n === 3) {
      if (!$("#patient-name").value.trim()) return "Indiquez votre nom et prénom.";
      const phone = $("#patient-phone").value.trim();
      if (!phone || phone.replace(/\D/g,"").length < 8) return "Indiquez un numéro de téléphone valide.";
      const email = $("#patient-email").value.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Vérifiez le format de votre adresse e-mail.";
    }
    return "";
  }
  function setStep(n) {
    currentStep = n;
    steps.forEach(step => { const active = Number(step.dataset.step) === n; step.hidden = !active; step.classList.toggle("is-active", active); });
    $("#step-counter").textContent = "Étape " + n + " sur " + totalSteps;
    $("#progress-track").setAttribute("aria-valuenow", String(n));
    $("#progress-fill").style.width = (n / totalSteps * 100) + "%";
    $("#back-button").hidden = n === 1;
    $("#continue-button").hidden = n === totalSteps;
    $("#submit-button").hidden = n !== totalSteps;
    if (n === 2) loadAvailableSlots();
    if (n === totalSteps) renderReview();
    clearAlert();
    $("#form-heading").textContent = n === 1 ? "Commençons" : n === 2 ? "Vos disponibilités" : n === 3 ? "Vos coordonnées" : "Dernière vérification";
    $("#booking").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function value(name) { const el = form.elements[name]; if (!el) return ""; if (el instanceof RadioNodeList) return el.value || ""; return el.value || ""; }
  function prettyDate(v) { if (!v) return "Non précisée"; return new Intl.DateTimeFormat("fr-FR",{dateStyle:"long",timeZone:"UTC"}).format(new Date(v+"T12:00:00Z")); }
  function renderReview() {
    const rows = [
      ["Motif", value("service") + (value("otherReason") ? " — "+value("otherReason") : "")],
      ["Date souhaitée", prettyDate(value("date"))],
      ["Heure souhaitée", value("time") || "Non précisée"],
      ["Nom", value("name")], ["Téléphone", value("phone")], ["E-mail", value("email") || "Non renseignée"],
      ["Note au secrétariat", value("note") || "Aucune"]
    ];
    const list = $("#review-list"); list.replaceChildren();
    rows.forEach(([label, val]) => { const dt = document.createElement("dt"); dt.textContent = label; const dd = document.createElement("dd"); dd.textContent = val; list.append(dt,dd); });
    const configured = Boolean(cfg.apiUrl && cfg.bookingEnabled);
    $("#integration-note").hidden = configured;
    $("#submit-button").textContent = configured ? "Envoyer la demande →" : "Configuration requise";
    $("#submit-button").disabled = !configured;
    if (!configured) $("#integration-note").innerHTML = "<strong>Réservation bientôt disponible</strong><p>Le formulaire visuel est prêt, mais la connexion sécurisée du cabinet n'est pas encore activée. Aucune demande ni confirmation fictive ne sera créée.</p>";
  }
  $("#continue-button").addEventListener("click", () => {
    const error = validateStep(currentStep);
    if (error) return showAlert(error);
    if (currentStep < totalSteps) setStep(currentStep + 1);
  });
  $("#back-button").addEventListener("click", () => { if (currentStep > 1) setStep(currentStep - 1); });
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const error = validateStep(3);
    if (error) { setStep(3); return showAlert(error); }
    if (!$("#privacy-consent").checked) return showAlert("Veuillez accepter l'utilisation de vos coordonnées pour traiter la demande.");
    if (!cfg.apiUrl || !cfg.bookingEnabled) return showAlert("La réservation n'est pas encore activée. Aucune demande n'a été envoyée.", "info");
    const submit = $("#submit-button"); submit.disabled = true; submit.textContent = "Envoi en cours…";
    try {
      const payload = {action:"createAppointment", specialty:cfg.specialty, service:value("service"), otherReason:value("otherReason"), date:value("date"), time:value("time"), name:value("name").trim(), phone:value("phone").trim(), email:value("email").trim(), note:value("note").trim(), consent:true, timezone:cfg.timezone};
      const response = await fetch(cfg.apiUrl, {method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify(payload), redirect:"follow"});
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Impossible de transmettre la demande.");
      form.hidden = true; $("#success-panel").hidden = false; $("#success-message").textContent = result.message || "Votre demande a été transmise au cabinet.";
    } catch (err) { showAlert(err.message || "Une erreur est survenue. Réessayez ou contactez le cabinet."); }
    finally { submit.disabled = false; submit.textContent = "Envoyer la demande →"; }
  });
  $("#new-request").addEventListener("click", () => { form.reset(); form.hidden = false; $("#success-panel").hidden = true; $$(".choice-card",serviceBox).forEach(c=>c.classList.remove("is-selected")); $("#other-reason-wrap").hidden = true; setStep(1); });
  setStep(1);
})();