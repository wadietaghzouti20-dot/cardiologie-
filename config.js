/* Configuration du cabinet — à personnaliser avant mise en ligne. */
window.RENDEVO_CONFIG = {
  product: "RENDEVO",
  specialty: "cardiologie",
  clinicName: "Cabinet Cardiologie",
  subtitle: "Un suivi cardiovasculaire organisé, en toute simplicité.",
  phone: "",
  email: "",
  city: "Oran",
  timezone: "Africa/Algiers",
  locale: "fr-DZ",
  currency: "DZD",
  /* Apps Script backend */
  apiUrl: "https://script.google.com/macros/s/AKfycbySHoeZmIgkz43svYY6TbcegcnT1VqO7oyMBMljQGDbN8johKD7UnOx5I-SAQIKLBcBGQ/exec",
  /* Keep disabled until the live booking flow is tested end to end. */
  bookingEnabled: true,
  /* Public clinic schedule is informational until the backend confirms availability. */
  schedule: { days: ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Samedi"], note: "Les horaires sont confirmés par le cabinet." },
  services: [["Première consultation cardiologique","Première visite ou nouveau motif"],["Consultation de suivi","Suivi planifié avec le cardiologue"],["Contrôle de la tension artérielle","Rendez-vous de contrôle"],["Électrocardiogramme (ECG)","Demande de rendez-vous pour ECG"],["Échocardiographie","Demande de rendez-vous pour échographie cardiaque"],["Épreuve d'effort","Demande de rendez-vous — confirmation par le cabinet"],["Suivi après hospitalisation","Consultation de suivi"],["Suivi d'un traitement","Rendez-vous de contrôle du traitement"],["Résultats d'examens","Discussion des résultats avec le praticien"],["Autre motif","À préciser brièvement au secrétariat"]]
};