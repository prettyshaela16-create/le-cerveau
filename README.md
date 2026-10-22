# Le Cerveau — API RESTful de gestion de tâches

API RESTful construite avec **Node.js**, **Express** et **PostgreSQL**, avec authentification sécurisée par **JWT**.
Chaque utilisateur peut s'inscrire, se connecter, puis créer, lire, modifier et supprimer **ses propres** tâches.

## Technologies

- Node.js et Express 4
- PostgreSQL (module `pg`)
- `bcryptjs` : hachage des mots de passe
- `jsonwebtoken` : authentification par JWT
- `dotenv` : variables d'environnement

## Installation

### 1. Cloner et installer

```bash
git clone <url-de-votre-depot>
cd le-cerveau
npm install
```

### 2. Lancer PostgreSQL et créer la base

Exemple avec Docker :

```bash
docker run --name cerveau-db -e POSTGRES_PASSWORD=motdepasse -e POSTGRES_DB=le_cerveau -p 5432:5432 -d postgres:16
```

### 3. Créer les tables

Exécuter le fichier `schema.sql` sur la base `le_cerveau` :

```bash
docker exec -i cerveau-db psql -U postgres -d le_cerveau < schema.sql
```

(Sous PowerShell : `Get-Content schema.sql | docker exec -i cerveau-db psql -U postgres -d le_cerveau`)

### 4. Configurer l'environnement

```bash
cp .env.example .env
```

| Variable         | Description                                    |
|------------------|------------------------------------------------|
| `PORT`           | Port du serveur (3000 par défaut)              |
| `DATABASE_URL`   | URL de connexion PostgreSQL                    |
| `JWT_SECRET`     | Chaîne secrète longue et aléatoire pour signer les JWT |
| `JWT_EXPIRES_IN` | Durée de validité du token (ex : `1h`, `7d`)   |

### 5. Démarrer

```bash
npm start        # production
npm run dev      # développement (redémarrage automatique)
```

Le serveur écoute sur `http://localhost:3000`.

## Structure du projet

```
le-cerveau/
├── schema.sql
├── src/
│   ├── server.js            # Point d'entrée
│   ├── app.js               # Configuration Express
│   ├── db.js                # Connexion PostgreSQL
│   ├── middleware/auth.js   # Vérification du JWT
│   └── routes/
│       ├── auth.routes.js   # Inscription / connexion
│       └── tasks.routes.js  # CRUD des tâches
├── .env.example
└── package.json
```

## Modèle de données

**users** : `id`, `username`, `email` (unique), `password_hash`, `created_at`

**tasks** : `id`, `user_id` (clé étrangère vers `users`, suppression en cascade), `title`, `description`, `completed` (faux par défaut), `created_at`, `updated_at`

## Authentification

Après connexion, l'API renvoie un token JWT. Pour accéder aux routes protégées (🔒), l'envoyer dans l'en-tête :

```
Authorization: Bearer <votre_token>
```

Sans token valide, l'API répond `401`.

## Endpoints

Toutes les requêtes et réponses sont en JSON.

### Authentification

#### `POST /api/auth/register` — Inscription

```json
{ "username": "alice", "email": "alice@example.com", "password": "motdepasse123" }
```

Réponse `201 Created` :

```json
{ "user": { "id": 1, "username": "alice", "email": "alice@example.com", "created_at": "2026-10-22T12:00:00.000Z" } }
```

Erreurs : `400` (champ manquant ou mot de passe de moins de 8 caractères), `409` (email déjà utilisé).

#### `POST /api/auth/login` — Connexion

```json
{ "email": "alice@example.com", "password": "motdepasse123" }
```

Réponse `200 OK` :

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "username": "alice", "email": "alice@example.com" }
}
```

Erreurs : `400` (champ manquant), `401` (identifiants incorrects).

#### `GET /api/auth/me` 🔒 — Profil de l'utilisateur connecté

Réponse `200 OK` :

```json
{ "user": { "id": 1, "username": "alice", "email": "alice@example.com", "created_at": "..." } }
```

### Tâches 🔒 (token requis)

#### `GET /api/tasks` — Lister mes tâches

Paramètre optionnel : `?completed=true` ou `?completed=false`.

Réponse `200 OK` :

```json
{
  "tasks": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Réviser le cours",
      "description": "Chapitres 3 et 4",
      "completed": false,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

#### `GET /api/tasks/:id` — Détail d'une tâche

Réponse `200 OK` : `{ "task": { ... } }`. Erreur `404` si la tâche est introuvable.

#### `POST /api/tasks` — Créer une tâche

```json
{ "title": "Réviser le cours", "description": "Chapitres 3 et 4" }
```

Réponse `201 Created` : `{ "task": { ... } }`. Erreur `400` si `title` est absent ou vide.

#### `PUT /api/tasks/:id` — Modifier une tâche

Tous les champs sont optionnels, seuls ceux envoyés sont modifiés :

```json
{ "title": "Nouveau titre", "description": "Nouvelle description", "completed": true }
```

Réponse `200 OK` : `{ "task": { ... } }`. Erreurs : `400`, `404`.

#### `DELETE /api/tasks/:id` — Supprimer une tâche

Réponse `204 No Content`. Erreur `404` si la tâche est introuvable.

## Codes d'erreur

| Code | Signification                                   |
|------|-------------------------------------------------|
| 400  | Requête invalide (données manquantes ou mal formées) |
| 401  | Token manquant, invalide ou expiré              |
| 404  | Ressource introuvable                           |
| 409  | Conflit (email déjà utilisé)                    |
| 500  | Erreur interne du serveur                       |

Format d'une erreur : `{ "error": "Message explicatif" }`

## Tester avec Postman

1. `POST /api/auth/register` : créer un compte.
2. `POST /api/auth/login` : copier le `token` reçu.
3. Dans les requêtes suivantes : onglet **Authorization** → **Bearer Token** → coller le token.
4. Tester `POST /api/tasks`, `GET /api/tasks`, `PUT /api/tasks/1`, `DELETE /api/tasks/1`.

## Sécurité

- Mots de passe hachés avec bcrypt, jamais stockés en clair.
- Requêtes SQL paramétrées : protection contre les injections SQL.
- Chaque requête sur les tâches est filtrée par `user_id` : un utilisateur ne voit que ses propres tâches.
- Secrets stockés dans `.env`, exclu du dépôt par `.gitignore`.