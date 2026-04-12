# MediFind AI - Quick Reference (No Docker)

## ⚡ One-Command To Start Everything

```bash
npm run dev
```

That's it! Both backend and frontend start automatically.

---

## 📋 All Available Commands

| Command | What It Does |
|---------|-------------|
| `npm run install:all` | Install all dependencies (backend + frontend) |
| `npm run dev` | ⭐ **START HERE** - Runs backend + frontend together |
| `npm run start:backend` | Start only backend server |
| `npm run start:frontend` | Start only frontend (Vite dev server) |
| `npm run seed` | Populate database with sample data |

---

## 🔧 MongoDB Setup (Pick ONE)

### Local Installation (Recommended)
1. Download from [mongodb.com/community](https://www.mongodb.com/try/download/community)
2. Install and start service
3. Connection: `mongodb://localhost:27017/medicine_finder`

### Cloud (MongoDB Atlas)
1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)
2. Get connection string
3. Add to `backend/.env`

---

## 📝 First-Time Setup

```bash
# 1. Install dependencies
npm run install:all

# 2. Create backend/.env file
# Copy from .env.example and set MongoDB connection

# 3. Start the app
npm run dev

# 4. (Optional) Seed sample data
npm run seed
```

---

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **WebSocket**: ws://localhost:5000

---

## 🚨 Port Conflicts?

```bash
# Kill process on specific port
npx kill-port 5000
npx kill-port 5173

# Or use PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

---

## ✅ Testing MongoDB Connection

```bash
# Check if local MongoDB is running (Windows)
Get-Service MongoDB

# Test connection with node
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/medicine_finder').then(() => console.log('✅ MongoDB connected!')).catch(e => console.log('❌ Error:', e.message))"
```

---

## 📚 Project Structure

```
medifind-fixed/
├── backend/          # Express API server
├── frontend/         # React + Vite client
├── .env.example      # Configuration template
├── package.json      # Root-level scripts
└── docker-compose.yml  # Setup reference (not used)
```

---

## 💡 Why No Docker?

✅ **Simpler** - Direct npm commands, no Docker daemon  
✅ **Faster** - No container overhead  
✅ **Better Dev Experience** - Native debugging tools work  
✅ **Less Resource Hungry** - No virtual layers  
✅ **Same Functionality** - All app features work identically  

---

## 🆘 Still Need Help?

1. Check [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) for detailed info
2. Verify MongoDB is running
3. Check `backend/.env` has correct `MONGODB_URI`
4. Try clearing cache: `rm -r node_modules && npm run install:all`
