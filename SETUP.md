# Quick Start Guide

## Prerequisites

Ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **DFX SDK** - Internet Computer SDK

## Installation Steps

### 1. Install DFX SDK

```bash
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
```

Verify installation:
```bash
dfx --version
```

### 2. Run Setup Script (Automated)

```bash
chmod +x setup.sh
./setup.sh
```

OR Manual Setup:

```bash
# Install frontend dependencies
cd src/voting_frontend
npm install
cd ../..
```

## Running the Application Locally

### Step 1: Start Local Internet Computer Replica

```bash
dfx start --background --clean
```

This starts a local blockchain network on your computer (FREE, no cost!)

### Step 2: Deploy Canisters

```bash
dfx deploy
```

This will:
- Compile the Motoko backend
- Deploy backend canister
- Build React frontend
- Deploy frontend canister
- Deploy Internet Identity (for authentication)

**Note:** First deployment may take 2-5 minutes.

### Step 3: Start Frontend Development Server

```bash
cd src/voting_frontend
npm start
```

### Step 4: Access the Application

Open your browser and navigate to the URL shown in terminal (usually):
```
http://localhost:5173
```

## First Time Usage

### Initialize the System

1. Click "Login with Internet Identity"
2. Create a new Internet Identity anchor
3. After login, click "Initialize System & Become Admin"
4. You are now the Super Admin!

### As Admin (Election Officer):

1. **Create an Election**
   - Go to Dashboard
   - Click "+ Create Election"
   - Fill in details
   - Submit

2. **Add Candidates**
   - Go to Elections page
   - Select your election
   - Click "+ Add Candidate"
   - Fill candidate details
   - Submit

3. **Verify Citizens**
   - Go to Dashboard
   - View "Pending Verification" tab
   - Review citizen applications
   - Click "Approve" or "Reject"

4. **Start Voting**
   - Go to Elections page
   - Select election
   - Click "Start Voting"

### As Citizen (Voter):

1. **Register**
   - Click "Register" in header
   - Fill registration form with:
     - Full name
     - Date of birth (DD-MM-YYYY)
     - Aadhaar number (12 digits)
     - Mobile number
     - Address details
   - Submit

2. **Wait for Verification**
   - Election Officer will verify your details
   - Check Dashboard for status

3. **Vote**
   - Once verified, go to Elections
   - Select active election
   - Click "Vote" on your preferred candidate
   - Confirm vote

4. **View Results**
   - After voting closes, see live results
   - Results are transparent and blockchain-verified

## Demo Scenario

Create a complete demo with these steps:

```bash
# 1. Start system
dfx start --background --clean
dfx deploy

# 2. Open app in browser
# Login and initialize as Admin

# 3. Create Election
Title: "2026 Parliament Elections - Mumbai North"
Type: General
Level: National
Constituency: Mumbai North
Start Date: [Today]
End Date: [Tomorrow]

# 4. Add 3 Candidates
1. Candidate A - BJP - Lotus
2. Candidate B - Congress - Hand
3. Candidate C - AAP - Broom

# 5. Register 5 Citizens
Open 5 different browser profiles/incognito windows
Register each with different Internet Identity
Use test data:
- Names: Alice, Bob, Charlie, David, Eve
- Aadhaar: 123456789012, 123456789013, etc.
- All same constituency: Mumbai North

# 6. Verify All Citizens (as Admin)
Go to Dashboard > Pending Verification
Approve all 5 citizens

# 7. Start Voting
Elections > Select election > Start Voting

# 8. Cast Votes (as each Citizen)
Switch to each browser profile
Vote for different candidates

# 9. End Voting & View Results
End voting as Admin
See real-time blockchain-verified results!
```

## Common Commands

```bash
# Start local replica
dfx start --background

# Stop local replica
dfx stop

# Deploy all canisters
dfx deploy

# Deploy specific canister
dfx deploy voting_backend
dfx deploy voting_frontend

# Check canister status
dfx canister status voting_backend

# View canister IDs
dfx canister id voting_backend
dfx canister id voting_frontend

# Clean and restart (fresh state)
dfx stop
rm -rf .dfx
dfx start --background --clean
dfx deploy

# View logs
dfx canister logs voting_backend
```

## Troubleshooting

### Port Already in Use
```bash
dfx stop
killall dfx
dfx start --background --clean
```

### Deployment Fails
```bash
dfx stop
rm -rf .dfx
dfx start --clean --background
dfx deploy
```

### Frontend Not Loading
```bash
cd src/voting_frontend
rm -rf node_modules dist
npm install
npm run build
cd ../..
dfx deploy voting_frontend
```

### Internet Identity Not Working
Check that the local replica is running:
```bash
dfx ping
```

If not running:
```bash
dfx start --background
```

### Can't Login
Clear browser cache and cookies for localhost
Try different browser or incognito mode

## Project Structure

```
voting-system/
├── src/
│   ├── voting_backend/          # Backend (Motoko)
│   │   ├── main.mo             # Main voting logic
│   │   └── types.mo            # Type definitions
│   └── voting_frontend/         # Frontend (React)
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── declarations/   # Candid interfaces
│       │   ├── App.jsx         # Main app
│       │   ├── service.js      # API calls
│       │   └── index.css       # Styles
│       ├── index.html
│       ├── package.json
│       └── vite.config.js
├── dfx.json                     # DFX configuration
├── README.md
├── SETUP.md                     # This file
└── setup.sh                     # Setup script
```

## Testing Checklist

- [ ] System initialization works
- [ ] Citizen registration works
- [ ] Admin can verify citizens
- [ ] Admin can create elections
- [ ] Admin can add candidates
- [ ] Admin can start/end voting
- [ ] Citizens can vote (once per election)
- [ ] Duplicate voting is prevented
- [ ] Results are calculated correctly
- [ ] Blockchain immutability is maintained

## Next Steps

1. Test all features locally
2. Create demo data for presentation
3. Prepare presentation slides
4. Document any bugs/issues
5. Consider enhancements for future

## Support

If you encounter issues:
1. Check this guide first
2. Review DFX documentation: https://internetcomputer.org/docs
3. Check the main README.md
4. Review error messages carefully

## Important Notes

- This runs 100% FREE on your local machine
- No blockchain fees during development/testing
- Unlimited testing and development
- Deploy to mainnet only when ready (costs ₹1000-1500)
- Perfect for final year project demonstration

---

**Happy Coding! 🚀**
