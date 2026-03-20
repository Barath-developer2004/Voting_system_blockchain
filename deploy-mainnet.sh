#!/bin/bash
set -e

# =============================================================
# IC Mainnet Deployment Script - Blockchain Voting System
# =============================================================

export DFX_WARNING=-mainnet_plaintext_identity

echo "============================================"
echo "  IC Mainnet Deployment - Voting System"
echo "============================================"
echo ""

# Step 0: Preflight checks
echo "🔍 Running preflight checks..."

# Check dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx is not installed. Run: sh -ci \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
    exit 1
fi

echo "  ✅ dfx $(dfx --version) found"

# Check identity
IDENTITY=$(dfx identity whoami)
PRINCIPAL=$(dfx identity get-principal)
echo "  🆔 Identity: $IDENTITY"
echo "  🔑 Principal: $PRINCIPAL"

# Check cycles balance
echo ""
echo "🔋 Checking cycles balance..."
CYCLES_BALANCE=$(dfx cycles balance --network ic 2>&1 || echo "0")
echo "  Cycles balance: $CYCLES_BALANCE"

ICP_BALANCE=$(dfx ledger balance --network ic 2>&1 || echo "0")
echo "  ICP balance: $ICP_BALANCE"

echo ""
echo "⚠️  Deployment requires cycles. If your balance is 0:"
echo "   1. Get ICP tokens from an exchange"
echo "   2. Send to account: $(dfx ledger account-id)"
echo "   3. Convert: dfx cycles convert --amount 1.0 --network ic"
echo ""
read -p "Do you have enough cycles to proceed? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Aborting. Fund your account first."
    exit 1
fi

# Step 1: Build frontend
echo ""
echo "📦 Building frontend..."
cd src/voting_frontend
npm install
npm run build
cd ../..

if [ ! -f "src/voting_frontend/dist/index.html" ]; then
    echo "❌ Frontend build failed — dist/index.html not found"
    exit 1
fi
echo "  ✅ Frontend built successfully"

# Step 2: Deploy backend canister
echo ""
echo "🚀 Deploying voting_backend to mainnet..."
dfx deploy voting_backend --network ic
BACKEND_ID=$(dfx canister id voting_backend --network ic)
echo "  ✅ Backend deployed: $BACKEND_ID"

# Step 3: Generate env for frontend (with mainnet canister IDs)
echo ""
echo "🔧 Generating environment for mainnet..."
DFX_NETWORK=ic bash generate-env.sh --network ic

# Step 4: Rebuild frontend with mainnet canister IDs
echo ""
echo "📦 Rebuilding frontend with mainnet canister IDs..."
cd src/voting_frontend
npm run build
cd ../..

# Step 5: Deploy frontend canister
echo ""
echo "🚀 Deploying voting_frontend to mainnet..."
dfx deploy voting_frontend --network ic
FRONTEND_ID=$(dfx canister id voting_frontend --network ic)
echo "  ✅ Frontend deployed: $FRONTEND_ID"

# Step 6: Print results
echo ""
echo "============================================"
echo "  🎉 Deployment Complete!"
echo "============================================"
echo ""
echo "  Frontend URL: https://${FRONTEND_ID}.ic0.app"
echo "  Backend ID:   $BACKEND_ID"
echo "  Frontend ID:  $FRONTEND_ID"
echo ""
echo "  Internet Identity: https://identity.ic0.app"
echo "  (Uses mainnet II canister: rdmx6-jaaaa-aaaaa-aaadq-cai)"
echo ""
echo "  Backend Candid UI: https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.ic0.app/?id=$BACKEND_ID"
echo ""
echo "📋 Next steps:"
echo "  1. Visit your frontend URL"
echo "  2. Login with Internet Identity"
echo "  3. You'll be the first admin"
echo ""
echo "🔋 Monitor cycles:"
echo "  dfx canister status voting_backend --network ic"
echo "  dfx canister status voting_frontend --network ic"
echo ""
