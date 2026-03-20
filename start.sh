#!/bin/bash
# ============================================
#  VoteChain — One-Command Start Script
#  Run this to start the entire project.
# ============================================

set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       🗳️  VoteChain — Starting...        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# --- Step 1: Check if dfx is installed ---
if ! command -v dfx &> /dev/null; then
    echo "❌ 'dfx' is not installed."
    echo "   Run:  sh -ci \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
    exit 1
fi

# --- Step 2: Start the local ICP blockchain replica ---
echo "🔗 Starting local blockchain replica..."
dfx stop 2>/dev/null || true
sleep 1
dfx start --background --clean
echo "✅ Blockchain replica running."
echo ""

# --- Step 3: Deploy Internet Identity (login system) ---
echo "🔑 Deploying Internet Identity canister..."
dfx deploy internet_identity 2>&1 | tail -3
echo ""

# --- Step 4: Deploy the voting backend smart contract ---
echo "📦 Deploying voting backend canister..."
dfx deploy voting_backend 2>&1 | tail -3
echo ""

# --- Step 4.5: Initialize the system (deployer becomes admin) ---
echo "🛡️  Initializing admin (your dfx identity becomes the admin)..."
INIT_RESULT=$(dfx canister call voting_backend initialize 2>&1)
echo "   $INIT_RESULT"

# Show deployer's principal
DEPLOYER_PRINCIPAL=$(dfx identity get-principal 2>/dev/null)
echo "   Deployer principal: $DEPLOYER_PRINCIPAL"
echo ""

# --- Step 5: Generate .env file with canister IDs ---
echo "⚙️  Generating environment config..."
bash generate-env.sh
echo ""

# --- Step 6: Install frontend dependencies (only if needed) ---
cd src/voting_frontend
if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies (first time only)..."
    npm install 2>&1 | tail -3
fi

# --- Step 7: Start the web app ---
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       ✅  Everything is ready!           ║"
echo "║                                          ║"
echo "║  Open your browser and go to:            ║"
echo "║  👉  http://localhost:5173               ║"
echo "║                                          ║"
echo "║  Admin is auto-initialized!              ║"
echo "║  To add your browser identity as admin:  ║"
echo "║  1. Login → copy your Principal from     ║"
echo "║     the 'System Setup' screen            ║"
echo "║  2. Run:                                 ║"
echo "║     dfx canister call voting_backend     ║"
echo "║       addAdminByInitializer              ║"
echo "║       '(principal \"<YOUR-PRINCIPAL>\")'    ║"
echo "╚══════════════════════════════════════════╝"
echo ""

npm run dev
