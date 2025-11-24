# Planning Imam — démarrage pas à pas (débutant)

## 1) Installer Node.js
- Va sur https://nodejs.org et installe la version **LTS** (recommandée).
- Vérifie : ouvre un terminal (ou PowerShell) et tape :
  ```bash
  node -v
  npm -v
  ```
  Tu dois voir deux numéros de version (ex: v20.x et 10.x).

## 2) Décompresser ce dossier
- Télécharge le ZIP et décompresse-le.
- Ouvre un **terminal** dans le dossier `imam-planning-starter` (là où se trouve `package.json`).

## 3) Installer les dépendances
```bash
npm install
```

## 4) Démarrer l'application en local
```bash
npm run dev
```
- Le terminal affiche une URL (souvent `http://localhost:5173`).
- Ouvre cette URL dans ton navigateur.

## 5) Utilisation
- Remplis les créneaux en cliquant dessus.
- Tu peux **basculer Été/Hiver**, régler **Début/Fin** et le **Pas (15/30/60)**.
- Boutons utiles : **Sauvegarder**, **Charger**, **Exporter CSV**, **Imprimer**, **Dupliquer** une journée.
- Les données sont sauvegardées **localement** dans ton navigateur (localStorage).

## 6) Déploiement (facultatif)
- Pour créer une version prête à publier :
  ```bash
  npm run build
  ```
  Les fichiers seront dans `dist/`. Tu peux les héberger (Netlify, Vercel, GitHub Pages, etc.).

---

### Besoin d'une version avec composants shadcn/ui (style plus poussé) ?
Dis-le moi et je te donnerai la procédure pour l'intégrer par-dessus ce projet.
