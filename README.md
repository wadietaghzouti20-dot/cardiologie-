# RENDEVO — Cardiologie

Interface de prise de rendez-vous spécialisée, en français, conçue pour mobile et ordinateur.

## Fichiers
- `index.html` — structure accessible et parcours de réservation.
- `styles.css` — identité visuelle dédiée à la spécialité.
- `app.js` — parcours multi-étapes, validation, récapitulatif et intégration API.
- `config.js` — identité du cabinet, motifs et paramètres d'intégration.

## Avant la mise en service
1. Personnaliser `config.js` avec le nom réel du cabinet, son téléphone et son adresse e-mail.
2. Déployer Google Apps Script et renseigner son URL `/exec` dans `apiUrl`.
3. Tester le backend et le contrat ci-dessous avant de mettre `bookingEnabled` à `true`.
4. Tester la confirmation patient, la notification du cabinet, les conflits de créneaux, l'annulation, les rappels 24 h et le calendrier.

## Contrat d'intégration prévu
Le frontend envoie du JSON avec `action: "createAppointment"`, `specialty`, `service`, `otherReason`, `date`, `timePreference`, `alternateDate`, `name`, `phone`, `email`, `note`, `consent` et `timezone`. Le backend devrait répondre en JSON avec `{"success":true,"message":"..." }` ou `{"success":false,"message":"..." }`.

Le backend doit revalider toutes les données côté serveur, vérifier les créneaux sans course critique, et ne jamais faire confiance aux validations du navigateur. Limiter les accès aux feuilles et journaux. Collecter le minimum nécessaire et ne pas demander de diagnostic ou de résultats médicaux dans le formulaire public.

## État
Le frontend est commité. L'envoi reste désactivé tant que l'URL Apps Script n'est pas renseignée et que `bookingEnabled` reste à `false`. Aucun faux rendez-vous ou faux e-mail de confirmation n'est généré.
