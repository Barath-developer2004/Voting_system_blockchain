  # Deployment Guide - Mainnet

This guide covers deploying your voting system to the Internet Computer mainnet.

## ⚠️ Important Notice

- Deployment to mainnet costs real money (₹1000-1500)
- Test thoroughly locally before deploying
- You'll need ICP tokens to pay for cycles
- This is OPTIONAL - your project works perfectly locally!

## Prerequisites

1. **Tested locally** - Ensure everything works on local replica
2. **ICP Tokens** - 1-2 ICP (~₹800-1600)
3. **Identity Setup** - DFX identity configured
4. **Cycles Wallet** - Created and funded

## Step 1: Create Mainnet Identity

```bash
# Create new identity for mainnet (recommended)
dfx identity new mainnet
dfx identity use mainnet

# Get your principal
dfx identity get-principal
```

Save this principal - you'll need it!

## Step 2: Get ICP Tokens

### Buy ICP (India)

**Option A: Indian Exchanges**
- WazirX (wazirx.com)
- CoinDCX (coindcx.com)

**Option B: International Exchanges**
- Binance (binance.com)
- Coinbase (coinbase.com)

Steps:
1. Create account on exchange
2. Complete KYC verification
3. Deposit INR (via UPI/Bank)
4. Buy ICP tokens
5. Withdraw to your DFX principal

### Transfer ICP to DFX

```bash
# Get your account ID
dfx ledger account-id

# Transfer ICP from exchange to this account
# (Use exchange withdrawal feature)
```

## Step 3: Create Cycles Wallet

```bash
# Check your ICP balance
dfx ledger balance

# Create cycles wallet (costs ~0.1 ICP)
dfx ledger create-canister <YOUR-PRINCIPAL> --amount 0.5

# Get cycles wallet canister ID
dfx identity get-wallet

# Top up wallet with more ICP (if needed)
dfx ledger top-up <WALLET-CANISTER-ID> --amount 1.0
```

## Step 4: Configure for Mainnet

Update `dfx.json` if needed (already configured):

```json
{
  "networks": {
    "ic": {
      "providers": ["https://ic0.app"],
      "type": "persistent"
    }
  }
}
```

## Step 5: Deploy to Mainnet

```bash
# Build canisters
dfx build --network ic

# Deploy backend canister
dfx deploy voting_backend --network ic

# Deploy frontend canister
dfx deploy voting_frontend --network ic

# Deploy Internet Identity (already exists on mainnet)
# It will use the mainnet II canister automatically
```

**Expected Time:** 5-10 minutes

**Expected Cost:** 
- Backend canister: ~0.5 ICP
- Frontend canister: ~0.3 ICP
- Total: ~0.8-1 ICP (₹800-1000)

## Step 6: Initialize System

After deployment:

```bash
# Get your frontend URL
dfx canister id voting_frontend --network ic
# URL will be: https://<CANISTER-ID>.ic0.app

# Get backend canister ID
dfx canister id voting_backend --network ic
```

Visit your frontend URL and:
1. Login with Internet Identity
2. Initialize the system
3. You become the first admin

## Step 7: Add Cycles for Running

Your canisters need cycles to run:

```bash
# Check cycles balance
dfx canister status voting_backend --network ic
dfx canister status voting_frontend --network ic

# Add more cycles (from your wallet)
dfx canister deposit-cycles 1000000000000 voting_backend --network ic
dfx canister deposit-cycles 1000000000000 voting_frontend --network ic
```

1 Trillion cycles ≈ 1 ICP ≈ ₹800-1000

## Step 8: Verify Deployment

1. Visit your frontend URL
2. Test login with Internet Identity
3. Register as citizen
4. Create election as admin
5. Test complete voting flow

## Managing Cycles

### Check Cycles Balance

```bash
dfx canister status voting_backend --network ic
```

Look for: `Balance: X_XXX_XXX_XXX_XXX Cycles`

### Add More Cycles

```bash
# Top up with ICP tokens
dfx ledger top-up <CANISTER-ID> --amount 0.5 --network ic
```

### Monitor Usage

- Backend: ~0.1-0.3 ICP/month for 1000 users
- Frontend: ~0.05-0.2 ICP/month
- Total: ~0.2-0.5 ICP/month

## Custom Domain (Optional)

Point your domain to the canister:

```bash
# Add domain to frontend canister
dfx canister update-settings voting_frontend \
  --add-controller <YOUR-DOMAIN-PRINCIPAL> \
  --network ic
```

Then configure DNS:
```
CNAME: <YOUR-DOMAIN> -> <CANISTER-ID>.ic0.app
```

## Troubleshooting

### Out of Cycles

```bash
# Top up immediately
dfx ledger top-up <CANISTER-ID> --amount 1.0 --network ic
```

### Deployment Failed

```bash
# Check identity
dfx identity whoami

# Check balance
dfx ledger balance --network ic

# Try again
dfx deploy --network ic
```

### Can't Access Frontend

- Wait 2-3 minutes for DNS propagation
- Try incognito mode
- Clear browser cache
- Check canister status

## Cost Management

### Optimize Costs

1. **Use Query Calls** - Free for users
2. **Cache Data** - Reduce computations
3. **Batch Operations** - Fewer transactions
4. **Monitor Usage** - Set up alerts

### Budget Planning

**Development Phase (Local):**
- Cost: ₹0 (FREE!)

**Initial Launch:**
- Deployment: ₹800-1000
- 3 months cycles: ₹300-500
- Total: ₹1100-1500

**Running Costs:**
- Small scale (100-1000 users): ₹150-300/month
- Medium scale (1000-10000 users): ₹400-700/month

## Rollback/Update

### Update Canister Code

```bash
# Make changes to code
# Then redeploy
dfx deploy voting_backend --network ic
```

**Note:** Stable variables persist! Your data is safe.

### Rollback

```bash
# Reinstall with clean state (DELETES DATA!)
dfx canister install voting_backend \
  --mode reinstall \
  --network ic
```

⚠️ **Warning:** Only use reinstall for emergencies!

## Monitoring

### Check Canister Health

```bash
# Status
dfx canister status voting_backend --network ic

# Logs (last 100 entries)
dfx canister logs voting_backend --network ic
```

### Key Metrics

- Cycles balance
- Memory usage
- Number of calls
- Response times

## Security Best Practices

1. **Backup Identity**
   ```bash
   # Export identity
   dfx identity export mainnet > mainnet-identity.pem
   # Store safely!
   ```

2. **Multi-Admin Setup**
   - Add backup admins
   - Don't rely on single identity

3. **Regular Monitoring**
   - Check cycles weekly
   - Monitor for unusual activity

4. **Upgrade Carefully**
   - Test locally first
   - Deploy during low-usage hours

## Mainnet URLs

After deployment, your app will be accessible at:

```
Frontend: https://<FRONTEND-CANISTER-ID>.ic0.app
Backend: https://<BACKEND-CANISTER-ID>.ic0.app
```

Share these URLs for public access!

## Alternative: Use Cycles Faucet (Testnet)

For testing before mainnet:

```bash
# Deploy to testnet
dfx deploy --network ic --playground

# Get free cycles from faucet
# Visit: https://faucet.dfinity.org
```

**Note:** Testnet data is temporary!

## Cost Calculator

Estimate your costs:

**For demo/testing:**
- Initial: ₹1500 (lasts 6 months)

**For actual use:**
| Users | Monthly Cost |
|-------|-------------|
| 100 | ₹150 |
| 1,000 | ₹300 |
| 10,000 | ₹600 |
| 100,000 | ₹2,000 |

Much cheaper than AWS or Ethereum!

## Support

- **ICP Forum:** forum.dfinity.org
- **Documentation:** internetcomputer.org/docs
- **Discord:** discord.gg/cA7y6ezyE2

---

## ⚠️ Recommendation

**For Final Year Project:**
- ✅ Develop and test locally (FREE)
- ✅ Demo locally during presentation (FREE)
- ✅ Include mainnet deployment in future work
- ⚠️ Deploy to mainnet ONLY if:
  - You want a live demo URL
  - Project needs to run beyond college
  - You have budget and ICP tokens

**You can complete your entire project without spending anything!**

---

**Good luck with your deployment! 🚀**
