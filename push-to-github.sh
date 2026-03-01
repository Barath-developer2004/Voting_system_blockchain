#!/bin/bash

echo "🔐 GitHub Voting System Push Helper"
echo "===================================="
echo ""
echo "📝 Instructions:"
echo "1. Go to: https://github.com/settings/tokens"
echo "2. Click 'Generate new token' -> 'Generate new token (classic)'"
echo "3. Name: 'OVS Voting System'"
echo "4. Scope: Check 'repo' (full control)"
echo "5. Click 'Generate token' and COPY it"
echo ""
echo "Then paste your token here:"
read -s -p "Enter your PAT: " TOKEN
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ Token is empty. Aborting."
    exit 1
fi

echo "🚀 Pushing to GitHub..."
git push -u https://pranavm924:${TOKEN}@github.com/pranavm924/ovsblockchain.git main

if [ $? -eq 0 ]; then
    echo "✅ Push successful!"
    echo ""
    echo "📍 Your repo: https://github.com/pranavm924/ovsblockchain"
else
    echo "❌ Push failed. Check your token and try again."
    exit 1
fi
