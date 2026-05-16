<div align="center">
  <img src="notes/public/logo.jpg" alt="DumpNotes Logo" width="80" height="80" style="border-radius: 16px" />
  <h1>DumpNotes</h1>
  <p><strong>A high-performance, real-time collaborative note-taking suite.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" />
    <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
    <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
    <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  </p>
</div>

---

## 🍎 Overview

DumpNotes is a professional full-stack application designed to meet and exceed the requirements of the "Multi-user Notes Service" technical challenge. It features a robust RESTful backend, a real-time synchronization engine, and a premium React-based frontend.

## ✅ Requirements Fulfillment (JD Compliance)

This project implements **100%** of the core requirements and all optional stretch goals defined in the specification.

### **Core Features**
- [x] **User Management**: Secure registration (`POST /register`) and JWT-based authentication (`POST /login`).
- [x] **Note Lifecycle**: Full CRUD operations with individual ownership and validation.
- [x] **Secure Sharing**: Permission-based sharing system (Viewer/Editor) via unique vanity URLs.
- [x] **API Documentation**: Automated OpenAPI 3.0 documentation available at `/openapi.json`.
- [x] **About Endpoint**: Detailed author and feature metadata available at `/about`.

### **💡 Custom Feature (Product Sense)**
- **Real-time Collaboration**: Beyond standard REST, DumpNotes implements **WebSockets (Socket.io)** for live editing. Multiple users can edit the same shared note simultaneously with millisecond-latency sync and presence indicators.

### **⭐ Stretch Goals Met**
- [x] **Pagination**: Server-side pagination for `GET /notes` to handle large datasets.
- [x] **Full-Text Search**: MongoDB text-indexing for high-performance keyword searching (`GET /notes/search?q=...`).
- [x] **Containerization**: Fully Dockerized backend environment for deterministic deployments.
- [x] **Frontend Suite**: A premium, responsive React interface built with Vite, Tailwind CSS, and Framer Motion.

## 💎 Technical Highlights

- **Scalability** ⚡️: Leveraging **Bun** for ultra-fast startup times and high request throughput.
- **Search Optimization** 🔍: Implementing `$text` indexes for language-aware, relevance-ranked search results.
- **Live Sync Engine** 🤝: A custom Room-per-Note architecture that handles concurrent edits and user presence.
- **Security** 🔒: Bcrypt hashing for passwords and stateless JWT verification for all private routes.

## 🚀 Setup & Execution

### **Backend (Docker)**
```bash
cd backend
docker build -t dumpnotes-backend .
docker run -p 5000:5000 --env-file .env dumpnotes-backend
```

### **Frontend (Vite)**
```bash
cd notes
bun install
bun run dev
```

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/register` | Create a new account |
| `POST` | `/login` | Authenticate and receive JWT |
| `GET` | `/notes` | List all notes (Paginated) |
| `GET` | `/notes/search` | Full-text search |
| `POST` | `/notes` | Create a new note |
| `GET` | `/notes/:id` | Get specific note |
| `PUT` | `/notes/:id` | Update note |
| `DELETE` | `/notes/:id` | Delete note |
| `POST` | `/notes/:id/share` | Generate public share link |
| `GET` | `/openapi.json` | API Documentation |
| `GET` | `/about` | Author Information |

---

### **About the Creator**
**Atharva Sawant**  
[LinkedIn](https://www.linkedin.com/in/atharvasawant0804/) | [GitHub](https://github.com/Satharva2004)  
*Full-stack engineer passionate about real-time systems and premium user experiences.*
