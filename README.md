# 🗳️ VoteChain — Blockchain Voting System

A secure, transparent, and tamper-proof online voting system built on the **Internet Computer (ICP)** blockchain. Citizens can register, get verified by an Election Officer, and cast votes using fingerprint authentication — all recorded permanently on the blockchain.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start (One Command)](#quick-start-one-command)
- [Manual Setup](#manual-setup)
- [How It Works — Complete Feature Guide](#how-it-works--complete-feature-guide)
  - [1. Home Page](#1-home-page)
  - [2. Login with Internet Identity](#2-login-with-internet-identity)
  - [3. First-Time Admin Setup](#3-first-time-admin-setup)
  - [4. Admin Dashboard](#4-admin-dashboard)
  - [5. Citizen Registration](#5-citizen-registration)
  - [6. Aadhaar OTP Verification](#6-aadhaar-otp-verification)
  - [7. Admin Reviews & Approves Citizens](#7-admin-reviews--approves-citizens)
  - [8. Biometric Fingerprint Enrollment](#8-biometric-fingerprint-enrollment)
  - [9. Creating Elections](#9-creating-elections)
  - [10. Adding Candidates](#10-adding-candidates)
  - [11. Voting](#11-voting)
  - [12. Election Results](#12-election-results)
  - [13. Settings](#13-settings)
- [Security Features](#security-features)
- [Project Structure](#project-structure)
- [Backend Smart Contract — All Functions](#backend-smart-contract--all-functions)
- [Current State & Known Issues](#current-state--known-issues)
- [Deployment to Mainnet](#deployment-to-mainnet)
- [License](#license)

---

## Overview

VoteChain is a decentralized voting application where:

- **Admin (Election Officer)** creates elections, adds candidates, verifies citizens, and manages the voting process.
- **Voters (Citizens)** register with their Aadhaar and personal details, get verified, enroll their fingerprint, and cast votes securely.
- **Every action** (registration, verification, vote) is permanently recorded on the blockchain — no one can alter or delete it.

The system uses **3-factor authentication** before a vote is cast:
1. **Internet Identity** — ICP's built-in login system (like Google login, but decentralized)
2. **Aadhaar OTP** — Verifies the citizen's identity via a one-time password sent to their mobile
3. **Biometric (Fingerprint/PIN)** — WebAuthn-based verification at the time of voting

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Blockchain** | Internet Computer (ICP) | Decentralized backend — stores all data on-chain |
| **Backend Language** | Motoko | Smart contract language for ICP (like Solidity for Ethereum) |
| **Frontend** | React 18 + Vite 5 | Web app that users interact with |
| **Styling** | Tailwind CSS 3 | Modern, responsive UI design |
| **Authentication** | Internet Identity | ICP's native decentralized login (no passwords) |
| **Biometric** | WebAuthn / Passkeys | Fingerprint, Face ID, or PIN verification |
| **Icons** | Lucide React | UI icons |
| **Animations** | Framer Motion | Smooth animations |
| **Dev Tools** | DFX SDK | ICP developer toolkit |

---

## Prerequisites

Before running this project, you need:

| Requirement | How to install |
|------------|---------------|
| **DFX SDK** (ICP developer kit) | `sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"` |
| **Node.js** (v16 or higher) | [nodejs.org](https://nodejs.org) or `nvm install 18` |
| **npm** | Comes with Node.js |

To verify installation:
```bash
dfx --version    # Should show 0.20+ 
node --version   # Should show v16+
npm --version    # Should show 8+
```

---

## Quick Start (One Command)

```bash
cd ovsblockchain
bash start.sh
```

This single command does everything:
1. Starts a local ICP blockchain
2. Deploys the Internet Identity canister (login system)
3. Deploys the voting backend smart contract
4. Generates environment configuration
5. Installs frontend dependencies (first time only)
6. Starts the web app on **http://localhost:5173**

After it starts, open your browser and follow the instructions printed on screen.

---

## Manual Setup

If you prefer to do each step yourself:

```bash
# Step 1: Start the local blockchain
dfx start --background --clean

# Step 2: Deploy Internet Identity (login canister)
dfx deploy internet_identity

# Step 3: Deploy the voting backend smart contract
dfx deploy voting_backend

# Step 4: Generate the .env file with canister IDs
bash generate-env.sh

# Step 5: Install frontend dependencies
cd src/voting_frontend
npm install

# Step 6: Start the web app
npm run dev
```

Open **http://localhost:5173** in your browser.

### Useful Commands

| Command | What it does |
|---------|-------------|
| `bash start.sh` | Does everything (recommended) |
| `dfx start --background` | Start blockchain in background |
| `dfx deploy` | Deploy all canisters |
| `dfx stop` | Stop the blockchain |
| `npm run dev` (in src/voting_frontend) | Start frontend dev server |
| `npm run build` (in src/voting_frontend) | Build frontend for production |
| `dfx canister call voting_backend getSystemInfo` | Check system status via CLI |

---

## How It Works — Complete Feature Guide

### 1. Home Page

**What you see:** A landing page titled "Democracy, Secured on Chain" with:
- Three feature cards — Cryptographic Security, Immutable Records, Biometric Verification
- A "How It Works" section explaining the 4-step process (Login → Register → Verify → Vote)
- System Status panel at the bottom showing whether the system is active, the version, and number of Election Officers

**What to do:** Click **"Get Started"** to log in, or **"Register"** to register as a citizen.

---

### 2. Login with Internet Identity

Internet Identity (II) is ICP's built-in login system. It works like "Sign in with Google" but without any company controlling it.

**How it works:**
1. Click **"Login"** or **"Get Started"**
2. A popup window opens (Internet Identity)
3. **First time?** Click "Create New" → choose a name → enter captcha → done. You get a unique identity.
4. **Returning?** Click on your saved identity → done.
5. The popup closes and you're logged in.

Each identity gets a unique **Principal ID** (like a blockchain address). This is your unique identity on the chain — it looks like `td3bu-nx7d6-nlpil-tgovq-...`.

> **Note:** Local development uses a simplified Internet Identity (just name + captcha). On the real ICP mainnet, it uses real passkeys and fingerprint.

---

### 3. First-Time Admin Setup

When the system is freshly deployed, there is **no admin**. The first person to log in sees a special **"System Setup"** screen.

**What happens:**
1. Log in (any identity)
2. You see: "This voting system has just been deployed and needs an Election Officer"
3. Your Principal ID is displayed
4. Click **"🛡️ Claim Admin Role"**
5. You are now the admin — this is recorded on the blockchain forever

Only one person can claim this. Once claimed, everyone else who logs in goes to the Voter Dashboard instead.

---

### 4. Admin Dashboard

The Admin (Election Officer) sees a dashboard with:

**Stats at the top (6 cards):**
- Total Citizens registered
- Verified citizens
- Pending verifications
- Total Elections
- Active Elections
- Total Votes Cast

**Two tabs:**
- **Pending Verification** — Citizens waiting for admin approval. Each card shows the citizen's name, age, gender, phone, masked Aadhaar number, and a "Review" button to expand their full documents.
- **All Citizens** — Complete list of every registered citizen with their verification status (Verified / Pending / Rejected).

**Create Election button** — Opens a form to create a new election (see Section 9).

---

### 5. Citizen Registration

Any user can register as a citizen (voter). The registration form has these sections:

**Personal Details:**
- Full Name (as on Aadhaar card)
- Date of Birth (format: DD-MM-YYYY, must be 18 or older)
- Voter ID Number (EPIC number)
- Gender (Male / Female / Other)

**Aadhaar Verification:**
- 12-digit Aadhaar number
- Mobile number linked to Aadhaar
- OTP verification (see next section)

**Address:**
- Address Line 1 & 2, City, District, State, Pincode
- The district and pincode are combined to create the voter's constituency (e.g., `Tiruvallur-600019`)

**Documents (Optional):**
- Aadhaar card photo URL
- Your photo/selfie URL

The **"Register"** button only becomes active **after Aadhaar OTP verification** is completed. Before that, it shows "🔒 Verify Aadhaar First".

---

### 6. Aadhaar OTP Verification

This is a simulated Aadhaar verification flow (demo mode):

1. Enter your 12-digit Aadhaar number and mobile number
2. Click **"Send OTP to Mobile"**
3. The system generates a 6-digit OTP and shows it in the response message (demo mode — in production, it would be sent via SMS)
4. Enter the OTP and click **"Verify"**
5. Green checkmark appears — "Aadhaar verified"

**Rules:**
- OTP expires in 5 minutes
- Maximum 5 wrong attempts allowed
- Each Aadhaar number can only be registered once (prevents duplicate registrations)

---

### 7. Admin Reviews & Approves Citizens

After a citizen registers, their status is **"Pending"**. The admin must review and approve them:

1. Admin goes to Dashboard → **"Pending Verification"** tab
2. Each citizen card shows basic info (name, age, gender, phone, masked Aadhaar)
3. Click **"Review"** → Expands to show the full document panel:
   - Aadhaar card photo
   - Voter's selfie photo
   - Full Aadhaar number (unmasked)
   - Voter ID, Date of Birth, mobile number
   - Full address (line 1, line 2, city, district, state, pincode)
   - Whether Aadhaar OTP was verified (green badge)
4. Click **"Approve"** → Citizen becomes "Verified" and eligible to vote. An EPIC number is auto-generated.
5. Click **"Reject"** → Citizen is rejected with reason "Documents incomplete" logged in audit trail.

---

### 8. Biometric Fingerprint Enrollment

Before voting, citizens must enroll their fingerprint (or device PIN if no fingerprint scanner):

1. Go to **Settings → Security** tab
2. Click **"Register Fingerprint"**
3. Browser shows a WebAuthn prompt — scan your fingerprint, use Face ID, or enter your device PIN
4. Credential is saved on the blockchain

**Note:** If your laptop doesn't have a fingerprint scanner, it uses PIN instead. Both are equally secure — they create the same type of cryptographic key using the WebAuthn standard.

This step can also be done right after registration (the success screen shows a biometric setup option).

---

### 9. Creating Elections

Only the admin can create elections:

1. Go to Admin Dashboard → Click **"+ Create Election"**
2. Fill in the form:
   - **Title** — e.g., "2026 Parliament Elections"
   - **Constituency** — e.g., "Tiruvallur" or "ALL" (national level, all voters can participate)
   - **Type** — General / By-Election / Referendum / Local Body
   - **Level** — National / State / District / Municipal / Village
   - **State** — e.g., "Tamil Nadu" (optional)
   - **Start Date & Time** — When voting begins
   - **End Date & Time** — When voting ends
   - **Description** — Optional details about the election
3. Click **"Create Election"** → Election is created with status "Upcoming"

---

### 10. Adding Candidates

After creating an election, the admin adds candidates:

1. Go to **Elections** page → Click on the election
2. Click **"+ Add Candidate"**
3. Fill in the candidate details:
   - Name, Age, Party name, Party Symbol
   - Education, Occupation
   - Photo URL (optional)
   - Manifesto (what the candidate promises)
4. Click **"Add Candidate"**
5. Repeat for all candidates (at least 2 recommended)

---

### 11. Voting

This is the core feature. A voter needs **ALL** of these before they can vote:
- ✅ Registered as citizen
- ✅ Approved (Verified) by admin
- ✅ Fingerprint enrolled (biometric)
- ✅ Election voting is open (admin clicked "Start Voting")
- ✅ Their constituency matches the election's constituency

**Voting flow:**
1. Admin clicks **"Start Voting"** on the election (changes status from Upcoming → Voting Open)
2. Voter goes to **Elections** page → clicks on the election
3. Sees candidate cards with **"Vote with Fingerprint"** buttons
4. Clicks on their preferred candidate's **"Vote with Fingerprint"** button
5. Confirm dialog appears: "Are you sure? This action cannot be undone!"
6. **Biometric Verification Modal** appears with 3-step verification:
   - ✅ Step 1: Internet Identity (already logged in)
   - ✅ Step 2: Aadhaar OTP (verified during registration)
   - → Step 3: Fingerprint (verify now)
7. Click **"Verify with Fingerprint"** → browser fingerprint/PIN prompt appears
8. Complete the verification → Vote is cast on the blockchain permanently
9. **Vote Receipt** appears with:
   - Election name
   - Candidate voted for (name & party)
   - Timestamp
   - Unique Reference ID (e.g., `VR-1-20260303-A3F7B2`)
   - **"Copy Receipt"** button to save the receipt

After voting, the candidate card shows **"You have voted"** badge — cannot vote again.

**The backend performs 9 security checks before accepting a vote:**
1. Must be a registered citizen
2. Must have "Verified" status
3. Must be eligible (18+ years old)
4. Must have biometric credential enrolled
5. Election must exist
6. Election must be in "Voting Open" status
7. Current time must be within the voting start/end window
8. Voter's constituency must match the election's constituency
9. Must not have already voted in this election

---

### 12. Election Results

After admin clicks **"End Voting"**:

- Both admin and voters can see the results
- **Winner** is highlighted with a gold border and trophy icon
- All candidates are listed, ranked by vote count
- Each candidate shows a progress bar with their vote percentage
- Total votes cast is displayed at the bottom

---

### 13. Settings

The Settings page has 3 tabs:

**Security:**
- Manage biometric (fingerprint) — enroll, test, or remove
- Two-Factor Authentication (coming soon)

**Sessions:**
- See current device info (browser, user agent)
- "Logout All Devices" button (clears all biometric sessions)

**Account:**
- View and copy your full Principal ID
- Account status — Internet Identity connection + Biometric enrollment status

---

## Security Features

| Feature | How it works |
|---------|-------------|
| **Decentralized Storage** | All data lives on the ICP blockchain — no central server to hack |
| **3-Factor Authentication** | Internet Identity + Aadhaar OTP + Fingerprint required before voting |
| **Immutable Votes** | Once cast, a vote cannot be changed or deleted — it's on the blockchain forever |
| **No Double Voting** | Backend checks if voter already voted before accepting the vote |
| **Constituency Matching** | Voters can only vote in elections for their registered constituency |
| **Audit Trail** | Every action (registration, verification, vote, admin action) is permanently logged |
| **Aadhaar Deduplication** | Each Aadhaar number can only register once — prevents fake accounts |
| **Age Verification** | Dynamic calculation ensures voter is 18+ at time of registration |
| **WebAuthn Standard** | Industry-standard biometric protocol (same as Google Passkeys, Apple Face ID) |
| **OTP Rate Limiting** | Maximum 5 wrong OTP attempts, OTP expires in 5 minutes |

---

## Project Structure

```
ovsblockchain/
├── start.sh                    # One-command startup script
├── generate-env.sh             # Generates .env with canister IDs
├── setup.sh                    # Initial setup (installs DFX, Node.js deps)
├── dfx.json                    # ICP canister configuration
├── package.json                # Root project scripts
├── .env                        # Auto-generated canister IDs (do not edit)
│
├── src/
│   ├── voting_backend/
│   │   ├── main.mo             # Smart contract — all backend logic (1,140 lines)
│   │   └── types.mo            # Type definitions (276 lines)
│   │
│   └── voting_frontend/
│       ├── package.json        # Frontend dependencies
│       ├── vite.config.js      # Vite build configuration
│       ├── tailwind.config.js  # Tailwind CSS configuration
│       ├── index.html          # HTML entry point
│       └── src/
│           ├── main.jsx        # React entry point
│           ├── App.jsx         # Main app — routing, auth, admin claim
│           ├── service.js      # API layer — all backend canister calls
│           ├── index.css       # Global styles
│           └── components/
│               ├── Home.jsx                      # Landing page
│               ├── Header.jsx                    # Navigation bar with Principal copy
│               ├── CitizenRegistration.jsx        # Registration form with OTP
│               ├── VoterDashboard.jsx             # Voter's profile & status
│               ├── AdminDashboard.jsx             # Admin panel with doc review
│               ├── Elections.jsx                  # Election list, voting, results
│               ├── BiometricAuth.jsx              # Fingerprint enrollment
│               ├── BiometricVerificationModal.jsx # Fingerprint check before vote
│               └── Settings.jsx                   # User settings (3 tabs)
```

---

## Backend Smart Contract — All 29 Functions

### System & Admin (8 functions)

| Function | Access | Description |
|----------|--------|-------------|
| `initialize()` | Anyone (once) | First caller becomes admin. Immutably recorded. |
| `addAdminByInitializer(principal)` | Initial admin only | Add another admin (for CLI-to-browser setup) |
| `addAdmin(principal)` | Super Admin only | Add a new Election Officer |
| `getAdmins()` | Admin only | List all admin principals |
| `amIAdmin()` | Anyone | Check if caller is an admin |
| `getSystemInfo()` | Anyone | Get system status, version, admin count |
| `getStatistics()` | Anyone | Get counts (citizens, elections, votes) |
| `getAuditLogs(limit)` | Admin only | View recent audit trail entries |

### Citizen Registration & Verification (7 functions)

| Function | Access | Description |
|----------|--------|-------------|
| `requestAadhaarOTP(aadhaar, mobile)` | Anyone | Generate 6-digit OTP for Aadhaar verification |
| `verifyAadhaarOTP(aadhaar, otp)` | Anyone | Verify the entered OTP (5 attempts, 5-min expiry) |
| `registerCitizen(name, dob, ...)` | Anyone | Register as citizen (requires OTP verified first) |
| `getMyCitizenProfile()` | Registered citizen | Get your own citizen profile |
| `verifyCitizen(principal, approve, ...)` | Admin only | Approve or reject a citizen registration |
| `getPendingCitizens()` | Admin only | List all citizens with Pending status |
| `getAllCitizens()` | Admin only | List all registered citizens |

### Elections & Voting (10 functions)

| Function | Access | Description |
|----------|--------|-------------|
| `createElection(input)` | Admin only | Create a new election |
| `addCandidate(input)` | Admin only | Add a candidate to an election |
| `startVoting(electionId)` | Admin only | Open voting (status → VotingOpen) |
| `endVoting(electionId)` | Admin only | Close voting (status → VotingClosed) |
| `getAllElections()` | Anyone | List all elections |
| `getElection(id)` | Anyone | Get one election's details |
| `getCandidates(electionId)` | Anyone | List candidates for an election |
| `castVote(electionId, candidateId)` | Verified citizen | Cast a vote (9 security checks enforced) |
| `hasVoted(electionId)` | Anyone | Check if caller already voted |
| `getElectionResults(electionId)` | Anyone | Get vote counts, percentages, and winner |

### Biometric (4 functions)

| Function | Access | Description |
|----------|--------|-------------|
| `enrollBiometricCredential(...)` | Registered citizen | Save fingerprint/PIN credential on blockchain |
| `verifyBiometricCredential(request)` | Anyone | Verify a fingerprint/PIN scan against stored credential |
| `getBiometricStatus()` | Anyone | Check if fingerprint is enrolled |
| `removeBiometricCredential()` | Enrolled user | Delete fingerprint credential |

---

## Current State & Known Issues

### ✅ Working Features (22 features — Fully Functional)

- Internet Identity login/logout
- First-time admin self-service claim from browser (no CLI needed)
- Admin Dashboard with 6 real-time statistics
- Citizen registration with full form validation
- Aadhaar OTP verification (demo mode — OTP shown in response)
- Admin document review panel (Aadhaar photo, selfie, full unmasked details)
- Admin approve/reject citizens with audit logging
- Election creation (4 types × 5 levels)
- Candidate management (add with full details)
- Start/End voting controls
- Voting with 3-factor biometric verification
- 9 backend security checks on every vote
- Vote receipt with unique reference ID and copy function
- Election results with winner display and vote bars
- Constituency matching (exact match, district prefix, or ALL)
- Biometric enrollment, verification, and removal
- Settings page (Security, Sessions, Account tabs)
- Complete audit trail logging of every action
- Dynamic age calculation (no hardcoded dates)
- Copyable Principal ID from header
- Responsive mobile design
- Admin/Voter view toggle for dual-role users
- One-command startup script (`bash start.sh`)

### ⚠️ Known Limitations (Demo Mode)

- Aadhaar OTP is **simulated** — OTP is shown in the response message, not sent via real SMS (would need government UIDAI API access for production)
- Document photos accept **URLs only** — no file upload (would need asset canister for production)
- Biometric UI text says "Fingerprint" but uses PIN on laptops without scanners (both use the same WebAuthn standard)
- Two-Factor Authentication section shows "Coming Soon"
- Some actions use browser `alert()` instead of toast notifications

### 📋 Future Enhancements

- Real Aadhaar UIDAI API integration
- File upload for identity documents
- Toast notification system
- Email/SMS notifications
- NOTA (None of the Above) candidate option
- Multi-language support (Tamil, Hindi, etc.)
- Voter turnout analytics
- Mainnet deployment
- Automated test suite

---

## Deployment to Mainnet

Currently the project runs on a **local blockchain** (your machine only). To deploy to the real ICP mainnet (accessible by anyone on the internet):

### What's needed:
1. **ICP Cycles** — Fuel for running canisters on ICP. Costs about $5 to start.
2. **ICP Wallet** — Use the NNS dapp at [nns.ic0.app](https://nns.ic0.app) to manage cycles.

### Deploy commands:
```bash
# Deploy to the real ICP mainnet
dfx deploy --network ic

# Your app will be live at:
# https://<frontend-canister-id>.ic0.app
```

### What changes on mainnet:
| Local (development) | Mainnet (production) |
|---|---|
| `dfx start` needed | Blockchain always running |
| `localhost:5173` | `<canister-id>.ic0.app` |
| Simplified Internet Identity (name + captcha) | Real passkeys & fingerprint |
| Data resets on `--clean` | Data persists permanently |
| Free | Costs ICP cycles |

---

## License

MIT License — see [LICENSE](LICENSE) file.

---

**Built with ❤️ on the Internet Computer**
