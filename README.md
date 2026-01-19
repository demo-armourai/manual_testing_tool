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


---

## 🎓 WCAG Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [WAI Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)

---
