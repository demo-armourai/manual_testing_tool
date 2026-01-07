# 🚀 WCAG 2.1 Auditor

A professional, comprehensive web accessibility auditing tool designed to evaluate and document **WCAG 2.1 success criteria** compliance. This platform streamlines the audit workflow, allowing you to manage targets, record findings with evidence, and generate detailed compliance reports.

---

## ✨ Features

-   **Systematic Audit Workflow**: Step-by-step evaluation of WCAG success criteria.
-   **Persistent Storage**: Full historical persistence using **PostgreSQL**.
-   **Finding Management**: Document accessibility issues with severity levels, DOM snippets, and CSS selectors.
-   **Compliance Reports**: Instant generation of scores and summary metrics.
-   **Modern Stack**: Built with **React**, **Zustand**, **Express**, and **PostgreSQL**.

---

## 🛠️ Quick Start (Unified Setup)

The easiest way to run the entire application is using the unified start script.

### 1. Prerequisites
- **Node.js** (v20+ recommended for Vite 7)
- **PostgreSQL** (v12+)

### 2. One-Step Execution
From the project root, run:
```bash
./run.sh
```
*This script will check your node version, create the database if missing, initialize tables, and start both frontend and backend.*

---

## 📂 Project Structure

```text
Auditor/
├── backend/            # Express API & Database Logic
│   ├── routes.js       # Core API logic
│   └── db.js           # PostgreSQL connection
├── src/               # React Frontend
│   ├── hooks/          # useAuditStore (Zustand)
│   └── components/     # UI Components
├── database/          # SQL Schema & Seed scripts
├── run.sh             # Unified startup script
└── README.md          # You are here
```

---

## 🗄️ Database Setup (Manual)

If you prefer to set up the database manually:

1. **Create Database**:
   ```sql
   CREATE DATABASE auditor_db;
   ```
2. **Set Password**: (Default in `.env` is `ArmourAI@123`)
   ```sql
   ALTER USER postgres WITH PASSWORD 'ArmourAI@123';
   ```
3. **Initialize & Seed**:
   ```bash
   cd backend
   npm run setup
   ```

---

## 🔌 API Endpoints

The backend runs on `http://localhost:3001/api`.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/audits/start` | `POST` | Start/Resume an audit for a URL |
| `/audits` | `GET` | List all historical audits |
| `/conditions` | `GET` | Get WCAG criteria reference |
| `/results` | `POST` | Store result for a criterion |
| `/findings` | `POST` | Create a detailed accessibility finding |
| `/reports/generate` | `POST` | Calculate compliance stats |

*See [API.md](./API.md) for full request/response examples.*

---

## 🔍 Troubleshooting

### PostgreSQL "Peer authentication failed"
If you cannot connect, update your `pg_hba.conf` or set the password for the `postgres` user:
```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'ArmourAI@123';"
```

### Port 3001 or 5173 busy
```bash
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Node Version issues
If Vite fails to start, ensure you are on Node 20+:
```bash
source ~/.nvm/nvm.sh && nvm use 20
```

---

## 🎓 WCAG Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [WAI Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Built with ❤️ for a more accessible web.**