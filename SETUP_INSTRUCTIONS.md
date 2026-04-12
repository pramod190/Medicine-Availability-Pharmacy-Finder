# MediFind AI - Complete Setup Instructions (Docker-Free)

## 🚀 Quick Start (No Docker Required)

We've replaced Docker Compose with a modern, lightweight npm-based setup. Simply choose your MongoDB option and run!

## Step 1: Choose Your MongoDB Setup

### ✅ Option A: MongoDB Community Edition (LOCAL - RECOMMENDED)

**Best for**: Development, fastest performance, no internet dependency

#### Windows:
1. Download MongoDB from: [MongoDB Community Download](https://www.mongodb.com/try/download/community)
2. Run the MSI installer and follow the wizard
3. Check "Install MongoDB as a Service" during installation
4. MongoDB will auto-start and run on `mongodb://localhost:27017`

To verify MongoDB is running:
```powershell
Get-Service MongoDB
# Should show "Running"
```

#### macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Verify
brew services list
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install mongodb

# Start service
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### ✅ Option B: MongoDB Atlas (CLOUD - No Installation Needed)

**Best for**: Quick setup, no local installation, accessible anywhere

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create a new project → Create a cluster
4. Wait for cluster to be created (~10 minutes)
5. Click "Connect" → "Drivers" → Copy connection string
6. Your URL looks like:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/medicine_finder?retryWrites=true&w=majority
   ```


## Step 2: Create `.env` File in Backend

Copy `.env.example` to `backend/.env`:

```env
# For Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/medicine_finder

# OR for MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/medicine_finder?retryWrites=true&w=majority

NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
```


## Step 3: Install Dependencies

```bash
# From project root, install all packages
npm run install:all
```

This will:
- Install backend dependencies
- Install frontend dependencies


## Step 4: Start the Application

```bash
# From project root - starts both backend and frontend
npm run dev
```

This launches:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

### Individual Commands if Needed:
```bash
npm run start:backend    # Backend only
npm run start:frontend   # Frontend only
npm run seed             # Seed database with sample data
```


## ⚙️ How It Works (No Docker!)

Instead of Docker Compose, we use:
- **npm workspaces** + **concurrently** = Run multiple services from one command
- **Local/Cloud MongoDB** = No container overhead
- **Vite** = Lightning-fast frontend bundler
- **Express** = Lightweight Node backend

Built-in scripts (from `package.json`):
```json
{
  "dev": "concurrently \"cd backend && npm run dev\" \"cd frontend && npm run dev\"",
  "install:all": "cd backend && npm install && cd ../frontend && npm install",
  "start:backend": "cd backend && npm start",
  "start:frontend": "cd frontend && npm run dev",
  "seed": "cd backend && npm run seed"
}
```


## 🔍 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: 
- Ensure MongoDB service is running
- Windows: `Get-Service MongoDB` should show "Running"
- Mac: `brew services list` should show MongoDB as "started"
- Check `MONGODB_URI` in `backend/.env` matches your setup

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
npx kill-port 5000

# Kill process on port 5173 (frontend)
npx kill-port 5173

# Or manually in PowerShell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Cannot connect to MongoDB Atlas
- Make sure IP is whitelisted: [MongoDB Atlas Network Access](https://cloud.mongodb.com)
- Add your current IP: Environment selector → Network Access → Add IP
- Check username/password in connection string

### Still Having Issues?

1. **Clear cache**: `rm -r node_modules package-lock.json && npm run install:all`
2. **Check port conflicts**: See "Port Already in Use" above
3. **Verify MongoDB version**: `mongod --version` should be v5.0+


## 📦 System Requirements

- **Node.js**: v14.0.0+ (check: `node --version`)
- **npm**: v6.0.0+ (check: `npm --version`)
- **MongoDB**: v5.0+ (local) OR Atlas free tier (cloud)
- **RAM**: 2GB minimum
- **Storage**: 500MB+ free space


## 🎯 Next Steps

After running `npm run dev`:
1. Open http://localhost:5173 in your browser
2. Register a new account
3. Explore MediFind features
4. (Optional) Run `npm run seed` to seed sample data
3. Verify connection string credentials

---

## Complete Setup Steps

### 1️⃣ Start MongoDB
```bash
# Make sure MongoDB is running (check services)
```

### 2️⃣ Install Dependencies
```bash
cd backend
npm install

cd ../frontend  
npm install
```

### 3️⃣ Seed the Database
```bash
cd backend
npm run seed
```

Expected output:
```
Connected to MongoDB
Cleared existing data
Users seeded
Medicines seeded
Pharmacies seeded
...
✅ Seeding complete!
```

### 4️⃣ Start Backend Server
```powershell
cd backend
npm run dev
# Expected: 🚀 Server running on http://localhost:5000
# Expected: ✅ MongoDB connected
```

### 5️⃣ Start Frontend (New Terminal)
```powershell
cd frontend
npm run dev
# Expected: ✨ Vite server at http://localhost:5173
```

### 6️⃣ Test in Browser
- Open: http://localhost:5173
- Register a test account
- Search for medicines
- Try MediBot (AI chat)
- Test Prescription OCR
- Check Analytics

---

## 🔍 Troubleshooting

### "MongoDB error: connection ECONNREFUSED"
✅ **Solution**: 
- Verify MongoDB service is running: `Get-Service MongoDB`
- Or start it: `net start MongoDB`
- Check .env has correct MONGODB_URI

### "Gemini API Error: 404 Model not found"
✅ **FIXED** - Now using `gemini-1.5-pro` (valid model)

### "Auth/Login showing time error"
✅ **Solution**:
- Sync system time: `net time /setsntp:"time.nist.gov"` (Admin)
- Or ensure server/client system clocks are synchronized

### "AI features (MediBot, OCR) not working"
✅ Check:
- Is backend running? `http://localhost:5000/api/health`
- Is Gemini API key set? Check `backend/.env`
- Any errors in backend terminal?

### "Medicines search not working"
✅ Check:
- Did seed.js run successfully?
- Backend logs show "MongoDB connected"?
- Frontend can reach backend? Check Network tab in DevTools

---

## ✅ Verification Checklist

After setup, verify everything:

- [ ] Backend starts without MongoDB errors
- [ ] `npm run seed` completes successfully
- [ ] Frontend loads at http://localhost:5173
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Medicines search returns results
- [ ] MediBot responds to queries
- [ ] Prescription OCR accepts image uploads
- [ ] Analytics page loads
- [ ] No console errors in browser DevTools

---

## Environment Variables

### Backend `.env` (backend/.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/medicine_finder
JWT_SECRET=medifind_super_secret_key_2026_development
GEMINI_API_KEY=AIzaSyC0tMdPsfo-KJLABaGgrm-qIisM5GlTmQw
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

### Frontend `.env` (frontend/.env)
```
VITE_ENV=development
VITE_API_URL=/api
VITE_SOCKET_URL=http://localhost:5000
VITE_BACKEND_PROXY_URL=http://localhost:5000
```

---

## Commands Reference

```bash
# Backend
cd backend
npm run dev          # Start dev server with auto-reload
npm run seed        # Populate database
npm start           # Start production server

# Frontend
cd frontend
npm run dev         # Start Vite dev server
npm run build       # Build for production
npm run preview     # Preview production build

# Root
npm run seed        # Runs backend seed from root
```

---

## System Requirements

- Node.js 14+ or 18+
- MongoDB 4.4+ (or access to MongoDB Atlas)
- 4GB RAM minimum
- Windows 10/11 (WSL2 optional)

---

## Support

If issues persist:
1. Check backend terminal for specific errors
2. Check browser Console (F12) for frontend errors
3. Verify all .env files are set correctly
4. Ensure MongoDB is running: `Get-Service MongoDB` (Windows)
