#!/bin/bash

echo "🗳️  Blockchain Voting System - Setup Script"
echo "============================================"
echo ""

# Check if DFX is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ DFX is not installed."
    echo "📥 Installing DFX SDK..."
    sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
    echo "✅ DFX installed successfully!"
else
    echo "✅ DFX is already installed ($(dfx --version))"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "Please install Node.js v16 or higher from https://nodejs.org/"
    exit 1
else
    echo "✅ Node.js is installed ($(node --version))"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    echo "Please install npm"
    exit 1
else
    echo "✅ npm is installed ($(npm --version))"
fi

echo ""
echo "📦 Installing frontend dependencies..."
cd src/voting_frontend
npm install
cd ../..

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🚀 To start the project:"
echo "   1. Start local IC replica:  dfx start --background --clean"
echo "   2. Deploy all canisters:    dfx deploy"
echo "   3. Initialize admin:        dfx canister call voting_backend initialize"
echo "   4. Generate env file:       bash generate-env.sh"
echo "   5. Start frontend:          cd src/voting_frontend && npm run dev"
echo ""
echo "   Then add your browser principal as admin:"
echo "   dfx canister call voting_backend addAdminByInitializer '(principal \"<YOUR-BROWSER-PRINCIPAL>\")'"
echo ""
echo "📖 Read README.md for more detailed instructions"
echo ""
