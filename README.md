# 🔥 MozType

> A high-performance, clean-room typing test platform engineered with React 18, TypeScript, custom Vanilla CSS design tokens, and MongoDB Atlas.

---

## 📋 Table of Contents
1. [Quick Start (Local Development)](#-quick-start-local-development)
2. [Environment Configuration (`.env.local`)](#-environment-configuration-envlocal)
3. [Database Connection Configurations](#-database-connection-configurations)
   - [Online MongoDB Atlas Cluster](#1-online-mongodb-atlas-cluster)
   - [Local Docker Atlas Container](#2-local-docker-atlas-container)
4. [Database Scripts & Migrations](#-database-scripts--migrations)
   - [NPM Script Command Reference](#npm-script-command-reference)
5. [Collections & Schema Design](#-collections--schema-design)
6. [Leaderboard Aggregation Pipeline](#-leaderboard-aggregation-pipeline)
7. [Core Engine Architecture](#-core-engine-architecture)

---

## ⚡ Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` (or configure `.env`):
```bash
cp .env.example .env.local
```
Update `.env.local` with your MongoDB Atlas or local connection credentials.

---

### 3. Connect & Seed Database
Choose either your **Online Atlas Cluster** or **Local Docker Container**:

#### Option A: Online MongoDB Atlas Cluster
```bash
# Setup schema, JSON validators, and unique indexes on MongoDB Atlas
npm run db:setup:atlas

# Initialize database and run leaderboard aggregation pipeline
npm run db:seed:atlas

# (Optional) Seed with sample benchmark typists on Atlas
npm run db:seed:atlas -- --sample
```

#### Option B: Local Docker MongoDB Atlas Container
```bash
# Start local Docker container
docker compose up -d

# Setup schema on local Docker
npm run db:setup:local

# Seed local database
npm run db:seed:local
```

---

### 4. Start Frontend Development Server
```bash
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

---

## 🔐 Environment Configuration (`.env.local`)

Place your active connection strings in `.env.local` (which is git-ignored for security):

```env
# Node Environment
NODE_ENV=development
PORT=5173
DB_NAME=moztype

# 1. Local Docker MongoDB Atlas Container URI:
LOCAL_MONGODB_URI=mongodb://admin:password123@localhost:27017/moztype?authSource=admin&directConnection=true

# 2. Remote MongoDB Atlas Online Cluster URI:
ATLAS_MONGODB_URI=mongodb+srv://<db_username>:<password>@<cluster_host>/moztype?retryWrites=true&w=majority&appName=MozTypeCluster

# Active Connection (Defaults to Online Atlas Cluster)
MONGODB_URI=mongodb+srv://<db_username>:<password>@<cluster_host>/moztype?retryWrites=true&w=majority&appName=MozTypeCluster
```

---

## 🔌 Database Connection Configurations

### 1. Online MongoDB Atlas Cluster

#### Node.js Driver Connection URI:
```text
mongodb+srv://<db_username>:<password>@<cluster_host>/moztype?retryWrites=true&w=majority&appName=MozTypeCluster
```

#### MongoDB Compass GUI:
1. Open MongoDB Compass.
2. Paste your cluster URI:
   ```text
   mongodb+srv://<db_username>:<password>@<cluster_host>/moztype?retryWrites=true&w=majority&appName=MozTypeCluster
   ```
3. Click **Connect**.

#### `mongosh` CLI:
```bash
mongosh "mongodb+srv://<cluster_host>/moztype" --apiVersion 1 --username <db_username>
```

---

### 2. Local Docker Atlas Container

The repository includes a ready-to-use MongoDB Atlas Local container in `docker-compose.yml`:

```bash
docker compose up -d
```

#### Local Node.js / Compass / `mongosh` URI:
```text
mongodb://admin:password123@localhost:27017/moztype?authSource=admin&directConnection=true
```

---

## 🗄️ Database Scripts & Migrations

### NPM Script Command Reference

| Command | Target | Description |
| :--- | :--- | :--- |
| `npm run db:setup:atlas` | 🌐 Online Atlas | Validates and creates collections (`users`, `results`, `leaderboards`, `configs`), JSON schema validators, and unique indexes on MongoDB Atlas. |
| `npm run db:seed:atlas` | 🌐 Online Atlas | Initializes the online Atlas cluster and executes the `$setWindowFields` aggregation pipeline. |
| `npm run db:seed:atlas -- --sample` | 🌐 Online Atlas | Seeds sample benchmark typists with verified personal best records on Atlas. |
| `npm run db:update:atlas` | 🌐 Online Atlas | Re-runs the leaderboard aggregation pipeline worker across all ranked modes on Atlas. |
| `npm run db:setup:local` | 🐳 Local Docker | Runs schema creation and index builds on local Docker container. |
| `npm run db:seed:local` | 🐳 Local Docker | Initializes and seeds local Docker container. |
| `npm run db:update:local` | 🐳 Local Docker | Re-runs leaderboard aggregation worker on local Docker. |

---

## 📊 Collections & Schema Design

### 1. `users` Collection
Stores typist accounts, security flags, badges, and nested personal records.
- **Unique Index**: `username` (Case-insensitive collation `locale: "en", strength: 2`)
- **Document Structure**:
```json
{
  "_id": "ObjectId",
  "username": "ApexTyper",
  "email": "apex@moztype.dev",
  "banned": false,
  "badge": "👑 Champion",
  "premium": true,
  "createdAt": "2026-08-16T12:00:00.000Z",
  "updatedAt": "2026-08-16T12:00:00.000Z",
  "lbPersonalBests": {
    "time": {
      "15": {
        "english": {
          "wpm": 172.5,
          "raw": 178.0,
          "acc": 99.1,
          "consistency": 92.4,
          "timestamp": "2026-08-16T12:00:00.000Z"
        }
      },
      "60": {
        "english": { "wpm": 158.0, "raw": 164.2, "acc": 98.6, "consistency": 89.1, "timestamp": "..." }
      }
    },
    "words": {
      "50": {
        "english": { "wpm": 165.2, "raw": 170.0, "acc": 98.9, "consistency": 90.5, "timestamp": "..." }
      }
    }
  }
}
```

### 2. `results` Collection
Stores individual typing test submissions, keystroke logs, and verification metadata.
- **Indexes**: `{ username: 1, timestamp: -1 }`, `{ mode: 1, mode2: 1, wpm: -1 }`.

### 3. `leaderboards` Collection
Pre-aggregated cache table for $O(1)$ fast ranking queries and pagination.
- **Indexes**: `{ mode: 1, mode2: 1, language: 1, rank: 1 }` (Pagination index).

---

## 🏆 Leaderboard Aggregation Pipeline

Leaderboards are compiled using MongoDB's `$setWindowFields` pipeline in `scripts/update-leaderboards.js`:

```javascript
[
  // 1. Filter active non-banned typists with a verified score
  {
    $match: {
      banned: { $ne: true },
      "lbPersonalBests.time.15.english.wpm": { $gt: 0 }
    }
  },
  // 2. Sort by WPM desc, Accuracy desc, Timestamp asc
  {
    $sort: {
      "lbPersonalBests.time.15.english.wpm": -1,
      "lbPersonalBests.time.15.english.acc": -1,
      "lbPersonalBests.time.15.english.timestamp": 1
    }
  },
  // 3. Calculate absolute rank position
  {
    $setWindowFields: {
      sortBy: {
        "lbPersonalBests.time.15.english.wpm": -1
      },
      output: {
        rank: { $documentNumber: {} }
      }
    }
  }
]
```

---

## ⚡ Core Engine Architecture

- **Sub-Millisecond Drift-Corrected Timer**: `requestAnimationFrame` + 50ms heartbeat interval.
- **Zero Re-render Direct DOM Hot-Path**: Caret positioning and letter validation bypass React state during active typing for 240Hz+ responsiveness.
- **Client-Side Anti-Cheat**: Validates keystroke intervals ($\ge 30\text{ms}$ biological limit) and accuracy floors.
- **Kogasa Rhythm Consistency Curve**: Coefficient of variation calculation mapping typing pace stability ($0\% - 100\%$).
- **15+ Custom Themes**: Dark mode, Serika Dark, Dracula, Cyberpunk, Matrix, Botanical, Nord, and more.

---

## 📄 License
MIT © MozType Clean-Room Project
