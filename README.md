# MediFind AI — Medicine & Pharmacy Finder

A full-stack medicine availability and pharmacy finder platform with AI features powered by **Google Gemini**.

## 🔑 Quick Setup (Fix API Key Errors)

### 1. Get Your Gemini API Key
- Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Sign in with your Google account
- Click **Create API Key** → copy the key

### 2. Add Key to Backend `.env`
Open `backend/.env` and replace `your_gemini_api_key_here` with your actual key:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/medicine_finder
JWT_SECRET=medifind_super_secret_key_2026
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=AIza...your_actual_key_here
```

### 3. Install & Run

**Backend:**
```bash
cd backend
npm install          # installs @google/generative-ai and all deps
npm run seed         # seed sample pharmacy + medicine data
npm run dev          # starts on http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev          # starts on http://localhost:5173
```

> **MongoDB** must be running locally: `mongod` or use MongoDB Atlas (update MONGODB_URI)

---

## 🤖 AI Features (All Powered by Gemini 1.5 Flash)

| Feature | Endpoint | Description |
|---|---|---|
| **MediBot Chat** | `POST /api/ai/chat` | Streaming chatbot for medicine Q&A |
| **Prescription OCR** | `POST /api/ai/prescription-ocr` | Upload prescription image → extract medicines |
| **Smart Substitutes** | `POST /api/ai/substitutes` | Find clinical alternatives for unavailable drugs |
| **Drug Interaction Checker** | `POST /api/ai/interactions` | Check interactions between multiple medicines |
| **Medicine Info** | `GET /api/ai/medicine-info?name=...` | Detailed info about any medicine |

## 🗺️ Map & Emergency Features

These features use your **MongoDB database** (not AI). They need:
- Backend server running (`npm run dev` in `/backend`)  
- Database seeded with pharmacy data (`npm run seed`)
- Location permissions granted in your browser

## 📂 Project Structure

```
medicine-finder/
├── backend/
│   ├── routes/ai.js          ← Gemini-powered AI routes (fixed)
│   ├── .env                  ← Add GEMINI_API_KEY here
│   └── package.json          ← Uses @google/generative-ai
└── frontend/
    ├── src/pages/MediBot.jsx
    ├── src/utils/api.js      ← 45s timeout for AI calls
    └── .env
```

## ❓ Troubleshooting

| Error | Fix |
|---|---|
| `AI request failed` | Add `GEMINI_API_KEY` to `backend/.env` |
| `Check API key` | Make sure key starts with `AIza` and has no spaces |
| `Failed to load pharmacies` | Start MongoDB + run `npm run seed` + start backend |
| `Cannot connect to server` | Run `npm run dev` in the backend folder |
| `401 Unauthorized` | Log in again — session expired |

---

## 🔐 Login / Auth

### Why login fails
There are 3 possible reasons — check them in order:

**1. Backend not running**
```bash
cd backend && npm run dev
# Should print: 🚀 Server running on http://localhost:5000
```

**2. MongoDB not running**
```bash
mongod
# Or if using Homebrew: brew services start mongodb-community
```

**3. Demo users not seeded**
The demo login buttons (User / Pharmacy / Admin) only work after seeding:
```bash
cd backend && npm run seed
# Should print: ✅ Seeding complete!
```

### Demo credentials (after seeding)
| Role | Email | Password |
|---|---|---|
| Patient | priya@example.com | password123 |
| Pharmacy Admin | ravi@pharmacy.com | password123 |
| Admin | admin@medifind.com | password123 |

### Creating your own account
Just click **Sign up** — registration works as long as MongoDB is running.
No seed required for new accounts.
