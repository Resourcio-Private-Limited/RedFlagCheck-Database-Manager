# RedFlagCheck — Database Manager

A private database manager built with **Node.js + Express + Prisma ORM** on **Neon PostgreSQL**, featuring a dark glassmorphism UI with login-gated access.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)
- Git

---

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/redflagcheck-database.git
cd redflagcheck-database
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Or create `.env` manually:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

PORT=3000
ADMIN_USER=admin
ADMIN_PASS=yourpassword
SESSION_SECRET=a_long_random_secret_string
```

- **`DATABASE_URL`** — get from [console.neon.tech](https://console.neon.tech) → your project → **Connection Details** → copy the connection string
- **`ADMIN_USER` / `ADMIN_PASS`** — login credentials for the web UI
- **`SESSION_SECRET`** — any long random string (used to sign session cookies)

### 4. Run database migrations

This creates the `User` and `Post` tables in your Neon database:

```bash
npx prisma migrate dev --name init
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Start the server

```bash
npm start
```

Visit **[http://localhost:3000](http://localhost:3000)** — you'll be redirected to the login page.

---

## Project Structure

```
.
├── index.js                 # Express server + API routes
├── prisma/
│   └── schema.prisma        # Database schema (User, Post models)
├── public/
│   ├── index.html           # Main app UI
│   └── login.html           # Login page
├── .env                     # Environment variables (not committed)
└── package.json
```

---

## Database Schema

```
User
├── id           Int       (PK, auto-increment)
├── name         String
├── nationality  String
├── job          String
├── location     String
├── age          Int
├── photos       String[]  (array of photo URLs, 1–5)
└── createdAt    DateTime

Post
├── id           Int       (PK, auto-increment)
├── remarks      String
├── photoUrl     String?   (optional)
├── userId       Int       (FK → User)
└── createdAt    DateTime
```

---

## API Reference

| Method   | Endpoint           | Description                    |
|----------|--------------------|--------------------------------|
| `GET`    | `/api/users`       | List all users (with posts)    |
| `GET`    | `/api/users/:id`   | Get a single user with posts   |
| `POST`   | `/api/users`       | Create a user                  |
| `PUT`    | `/api/users/:id`   | Update a user                  |
| `DELETE` | `/api/users/:id`   | Delete user and all their posts|
| `GET`    | `/api/posts`       | List all posts                 |
| `POST`   | `/api/posts`       | Create a post                  |
| `PUT`    | `/api/posts/:id`   | Update a post                  |
| `DELETE` | `/api/posts/:id`   | Delete a post                  |

All endpoints require an active login session (cookie-based).

---

## Deployment (Railway)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Select your repo — Railway auto-detects Node.js
4. Add your environment variables under **Variables** tab
5. Railway provides a live URL automatically

> **Note:** Do not commit your `.env` file. Add `.env` to `.gitignore`.

---

## Features

- **Login gate** — username/password from environment variables
- **Add Person** — name, nationality, job, location, age + 1–5 photo URLs
- **Add Post** — searchable person picker, remarks (up to 2000 words), optional photo
- **View Records** — browse all persons with photo strips, expandable posts, search
- **Edit** — edit person details or any post inline via modal
- **Delete** — delete persons (cascades to posts) or individual posts
