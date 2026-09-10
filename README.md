# 🌾 AgriSync — Smart Mandi Procurement

> A smart, scheduled digital platform built to bridge the gap between **Farmers, Hub Managers, and Consumers/Buyers**, eliminating unnecessary intermediary layers to lower costs and maximize farmer earnings. Developed by **Team Elite** for **Smart India Hackathon 2026** (Problem Statement ID: `SIH26033`).

---

## 🚀 Quick Links & Live Demos

* 🌐 **Live Web Application:** [AgriSync Platform](https://elite-frontend-omega.vercel.app/)
* 🔗 **Backend API:** [AgriSync API Engine](https://elite-pe1d.onrender.com/)
* 📹 **Video Demo:** [Watch Demo on YouTube](https://youtu.be/4B_IOHFmIo4?feature=shared)
* 💻 **GitHub Repository:** [shreyansh0200/elite](https://github.com/shreyansh0200/elite)

---

## 📌 Project Overview

**AgriSync** digitizes and streamlines crop procurement processes across India. By introducing a centralized hub model, it acts as a single, transparent intermediate layer.

Farmers request sale tokens, reserve hub slots, and receive SMS notifications without standing in long queues. Hub managers inspect produce, issue tokens, and manage hub inventory. Wholesalers, retailers, and consumers can directly purchase procurement-ready produce straight from the hub.

---

## 🎯 Problem Statement

* **Problem Statement ID:** `SIH26033`
* **Problem Title:** Multiple intermediaries reduce farmers' earnings and increase consumer prices.

### Key Operational Challenges:
* **Excess Intermediaries:** Multiple transport layers and commission agents inflate final market prices while squeezing farmer margins.
* **Lack of Visibility:** Inability to easily track mandi prices across locations leading to unfair pricing.
* **Unorganized Logistics:** Long waiting times and chaotic crowds at procurement centers.
* **Digital Literacy Barriers:** Complex UI systems that deter non-tech-savvy farmers.

---

## 💡 Our Solution

AgriSync creates a streamlined ecosystem connecting all three primary stakeholders:

```text
       [ FARMER ]                   [ HUB MANAGER ]                   [ CONSUMER / BUYER ]
           │                               │                                   │
           ▼                               ▼                                   ▼
• Request Sale Token            • Review Pending Requests           • Browse Procurement Goods
• Voice AI Assistant            • Verify & Grant Tokens             • Request Buy Tokens
• Receive SMS Updates           • Update Physical Inventory         • Direct Hub Purchases
```

## ✨ Core Features

### 👨‍🌾 1. Farmer Dashboard
- **Token Request Flow:** Book pickup slots with hub managers for hassle-free drop-offs.
- **SMS & Live Notifications:** Receive real-time token approvals and status updates directly on mobile devices.
- **Voice-Enabled AI Assistant:** Interacts in Hindi/English using voice input to check mandi rates, booking status, and slot details.

### 🏢 2. Hub Manager Control Centre
- **Single-Layer Management:** Approve or reject farmer procurement requests and consumer purchase tokens.
- **Inventory Logging:** Record exact weight (in Quintals), quality grades, and crop details.
- **Digital Ticket Verification:** Quick verification of arrival tokens to cut down processing delays.

### 🛒 3. Marketplace & Consumer Module
- **Procurement-Ready Lots:** Browse verified crop inventory (Wheat, Rice, Maize, etc.) direct from local hubs.
- **Fair Price Discovery:** Lower procurement overheads by cutting out multi-level transit markup.

### 📊 4. Live Mandi Price Portal
Real-time price tracking powered by direct feeds from data.gov.in, showing minimum, modal, and maximum market rates across various APMC locations.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| Frontend | React.js, Vite, Tailwind CSS, Axios, Web Speech API |
| Backend | Node.js, Express.js, JWT, bcrypt, CORS |
| Database | MongoDB Atlas, Mongoose |
| AI Agent & Voice System | Agentic AI, LangChain, Llama 3.1, Faster-Whisper, Coqui TTS, HuggingFace Spaces |
| Deployment | Vercel (Frontend), Render (Backend), HuggingFace (AI Modules) |
| Data Integrations | Government Open Data Portal (data.gov.in), APMC Mandi Feeds |

---

## 📂 Project Structure

```
elite/
├── frontend/             # React + Vite Frontend
│   ├── src/
│   │   ├── components/   # UI & Shared Components
│   │   ├── pages/        # Dashboard, Mandi Rates, Marketplace
│   │   └── services/     # API Integration & Speech Drivers
│   └── package.json
│
├── backend/              # Node.js + Express API Backend
│   ├── controllers/      # Logic for Tokens, Auth, Hubs & Mandi Rates
│   ├── models/           # Mongoose Schemas (User, Token, Crop, Hub)
│   ├── routes/           # REST Endpoints
│   ├── middleware/       # Auth & Verification
│   ├── server.js         # Express Entry Point
│   └── .env.example
│
├── scripts/              # Data Seeding & Maintenance
│   └── seed.js
│
├── render.yaml           # Deployment configuration for Render
└── README.md
```

---

## 🚀 Local Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas database URI

### 1. Clone the repository
```bash
git clone https://github.com/shreyansh0200/elite.git
cd elite
```

### 2. Configure & Run Backend
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
DATA_GOV_API_KEY=your_government_data_api_key
```

Start the server:
```bash
npm start
```

### 3. Configure & Run Frontend
```bash
cd ../frontend
npm install
npm run dev
```

---

## 🌟 Key Benefits & Impact
- **Economic:** Increases net farmer revenue by avoiding middleman commissions and reduces consumer prices.
- **Operational:** Reduces transit delays and waiting crowds at APMC mandis via scheduled token allocation.
- **Environmental:** Decreases carbon emissions by eliminating redundant multi-stop transportation layers.

---

## 👥 Team Details — Team Elite
- **Backend Developer :** Shreyansh Kandu ([@shreyansh0200](https://github.com/shreyansh0200))
- **Event:** Smart India Hackathon 2026
