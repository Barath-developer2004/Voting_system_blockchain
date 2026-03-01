# Blockchain Voting System for Citizens

A secure, transparent, and tamper-proof voting system built on the Internet Computer (ICP) blockchain for government elections.

## Features

- 🔐 **Secure Authentication** - Internet Identity integration
- 🗳️ **Citizen Voting** - Aadhaar-based verification
- 👨‍💼 **Election Officer Panel** - Verify citizens and manage elections
- 🏛️ **Multi-Level Elections** - National, State, District, Municipal
- 📊 **Real-time Results** - Transparent vote counting
- 🔒 **Immutable Records** - Blockchain-secured votes
- 🚫 **Duplicate Prevention** - One person, one vote
- 📍 **Constituency-Based** - Location-based voting
- 💰 **Zero Gas Fees** - Users pay nothing!

## Technology Stack

- **Backend**: Motoko (ICP Canister)
- **Frontend**: React + Vite + Tailwind CSS
- **Authentication**: Internet Identity
- **Blockchain**: Internet Computer Protocol (ICP)
- **Interface**: Candid

## Prerequisites

- Node.js (v16 or higher)
- DFX SDK (v0.15.0 or higher)
- Internet connection (for initial setup)

## Installation

### 1. Install DFX SDK

```bash
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
```

### 2. Verify Installation

```bash
dfx --version
```

### 3. Clone and Setup

```bash
cd /home/barathy/ic-projects/voting-system
npm install
```

## Running Locally (FREE - No Cost!)

### 1. Start Local ICP Replica

```bash
dfx start --background --clean
```

### 2. Deploy Canisters

```bash
dfx deploy
```

### 3. Start Frontend Development Server

```bash
npm start
```

### 4. Open in Browser

The terminal will show URLs like:
```
Frontend: http://localhost:4943/?canisterId=xxxxx
Backend:  http://localhost:4943/?canisterId=yyyyy
```

## Usage Guide

### For Citizens (Voters)

1. **Register**
   - Click "Register as Citizen"
   - Fill in details (Name, Aadhaar, Address, etc.)
   - Upload Aadhaar card photo
   - Submit and wait for Election Officer verification

2. **Vote**
   - Login with Internet Identity
   - View available elections in your constituency
   - Select candidate and cast vote
   - Receive blockchain confirmation

3. **View Results**
   - Check real-time election results
   - Verify vote counts on blockchain

### For Election Officers (Admins)

1. **Login as Officer**
   - First deployer becomes Super Admin
   - Login with Internet Identity

2. **Verify Citizens**
   - Review pending citizen registrations
   - Check Aadhaar details and documents
   - Approve or reject applications

3. **Create Elections**
   - Set election details (title, type, level)
   - Define constituency and dates
   - Add candidates with details

4. **Manage Elections**
   - Start/stop voting periods
   - Monitor voting progress
   - Declare results

## Project Structure

```
voting-system/
├── src/
│   ├── voting_backend/          # Backend canister (Motoko)
│   │   ├── main.mo             # Main voting logic
│   │   └── types.mo            # Type definitions
│   └── voting_frontend/         # Frontend application
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── services/       # API services
│       │   └── App.jsx         # Main app
│       ├── index.html
│       └── package.json
├── dfx.json                     # DFX configuration
└── README.md
```

## Security Features

✅ **Immutable Votes** - Cannot be changed or deleted
✅ **Duplicate Prevention** - Principal-based identity
✅ **Verification Required** - Officer approval needed
✅ **Constituency Check** - Vote only in your area
✅ **Time-bound Voting** - Strict election periods
✅ **Audit Trail** - Complete action logging
✅ **Role-Based Access** - Admin/Officer/Citizen roles

## Cost Breakdown

- **Development**: ₹0 (100% FREE locally)
- **Testing**: ₹0 (Unlimited)
- **Deployment**: ₹1,000-1,500 (one-time, when ready)
- **Running**: ₹200-500/month (after launch)

## Commands Reference

```bash
# Start local blockchain
dfx start --background

# Deploy all canisters
dfx deploy

# Deploy specific canister
dfx deploy voting_backend

# Check canister status
dfx canister status voting_backend

# View canister ID
dfx canister id voting_backend

# Stop local blockchain
dfx stop

# Clean and restart
dfx start --clean --background
```

## Testing

### Create Test Data

```bash
# Login as first user (becomes admin)
# Register citizens
# Verify citizens
# Create election
# Cast votes
# View results
```

## Troubleshooting

### Port Already in Use
```bash
dfx stop
killall dfx
dfx start --clean --background
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
npm install
npm run build
cd ../..
dfx deploy voting_frontend
```

## Future Enhancements

- [ ] Multiple simultaneous elections
- [ ] Biometric verification integration
- [ ] Mobile app (iOS/Android)
- [ ] SMS notifications
- [ ] Voter helpline chatbot
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Accessibility features

## Contributing

This is a final year project. Suggestions and improvements are welcome!

## License

MIT License - Free to use for educational purposes

## Contact

Project by: Barathy
Institution: [Your College Name]
Year: 2026
Purpose: Final Year Project

---

**Built with ❤️ on Internet Computer**
