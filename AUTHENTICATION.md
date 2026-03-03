# Authentication Architecture — Blockchain Voting System

## Overview

This document explains the **multi-factor authentication (MFA)** architecture used in the Online Voting System built on the Internet Computer (ICP) blockchain. The system uses **three independent authentication factors** to ensure that only verified, eligible citizens can cast votes.

---

## The Three Authentication Factors

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                          │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐   │
│  │   Factor 1   │   │   Factor 2   │   │     Factor 3     │   │
│  │  Internet    │──▶│  Aadhaar OTP │──▶│   Biometric      │   │
│  │  Identity    │   │  Verification│   │   Fingerprint    │   │
│  └──────────────┘   └──────────────┘   └──────────────────┘   │
│                                                                 │
│  "You hold this   "You control this  "Same physical person    │
│   cryptographic     Aadhaar-linked    as the one who           │
│   key (passkey)"    mobile number"    registered"              │
└─────────────────────────────────────────────────────────────────┘
```

### Factor 1: Internet Identity (ICP Authentication)

**What it proves:** "You hold a unique cryptographic key (passkey) stored on your device."

**How it works:**
1. User clicks "Login" → popup opens to **Internet Identity** service (`identity.ic0.app`)
2. User creates/enters an **anchor number** (e.g., `10001`)
3. Internet Identity uses **WebAuthn** (FIDO2) to authenticate via device passkey
4. The ICP blockchain generates a unique **Principal ID** (e.g., `abc12-def34-xyz56-...`)
5. This Principal ID is cryptographically tied to the user's device

**FAQ: How do two users A and B login on the same browser?**
- User A clicks Login → enters anchor `10001` → gets Principal A
- User A logs out (session cleared)
- User B clicks Login → enters anchor `10002` → gets Principal B
- Each user has a **different anchor number**, so they get different Principals
- All biometric credentials are stored **per-user** (keyed by Principal ID) so they don't overwrite each other

**Security properties:**
- Principal IDs are unique and cannot be forged
- Each canister (smart contract) sees a different Principal per user (prevents tracking)
- Passkeys are hardware-bound and never leave the device

---

### Factor 2: Aadhaar OTP Verification (Identity Verification)

**What it proves:** "You control the mobile number linked to the Aadhaar number you claim."

**How it works:**
1. During citizen registration, user enters their **12-digit Aadhaar number** and **mobile number**
2. System sends a **6-digit OTP** to the registered mobile number
3. User must enter the correct OTP within **5 minutes**
4. Maximum **5 attempts** before OTP expires (prevents brute force)
5. Only after OTP verification can the user proceed with registration
6. The backend **validates** that OTP was verified before accepting registration

> **Note:** In this project, we simulate the UIDAI API call. In production, this would integrate with the Aadhaar e-KYC (Know Your Customer) API which requires government authorization. The architecture and flow are identical — only the OTP delivery mechanism changes.

**Security properties:**
- Prevents fake registrations (can't use someone else's Aadhaar without their phone)
- One Aadhaar = one registration (duplicate check on blockchain)
- OTP has time expiry and attempt limits (prevents brute force)
- Mobile number must match during registration (cross-validation)

**Backend enforcement (main.mo):**
```motoko
// In registerCitizen function:
switch (aadhaarOTPs.get(aadhaarNumber)) {
    case null {
        return #err("Aadhaar not verified. Complete OTP verification first.");
    };
    case (?otpRecord) {
        if (not otpRecord.verified) {
            return #err("Aadhaar OTP verification incomplete.");
        };
        if (otpRecord.mobileNumber != mobileNumber) {
            return #err("Mobile number mismatch with OTP verification.");
        };
    };
};
```

---

### Factor 3: Biometric Fingerprint (Physical Verification)

**What it proves:** "The same physical person who registered is the one voting now."

**How it works:**
1. After citizen registration, user enrolls their **fingerprint** using WebAuthn
2. Browser creates a **public-private key pair** tied to the fingerprint
3. The credential ID is stored on the **blockchain** (not the fingerprint itself)
4. Before every vote, the user must scan their fingerprint
5. The browser verifies the fingerprint locally, then the **blockchain verifies** the credential matches

**Why fingerprint data is safe:**
- The fingerprint **never leaves the device** (WebAuthn standard)
- Only a cryptographic signature is sent to the blockchain
- The blockchain stores credential IDs, not biometric data

**Per-user isolation:**
```javascript
// Biometric credentials are stored per-user in localStorage:
localStorage.setItem(`biometric_credential_${principalId}`, ...);
localStorage.setItem(`biometric_enrolled_${principalId}`, 'true');
// This means multiple users on the same browser have separate credentials
```

**Backend enforcement (main.mo):**
```motoko
// In castVote function:
switch (biometrics.get(voterPrincipal)) {
    case null {
        return #err("Biometric verification required before voting.");
    };
    case (?bioCred) {
        if (not bioCred.isActive) {
            return #err("Biometric credential inactive.");
        };
    };
};
```

---

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW                         │
│                                                              │
│  1. User visits site                                         │
│     ↓                                                        │
│  2. Clicks "Login with Internet Identity"                    │
│     → Popup opens → User creates/enters anchor               │
│     → Gets unique Principal ID (Factor 1 ✅)                 │
│     ↓                                                        │
│  3. Goes to "Register as Citizen"                            │
│     → Enters Aadhaar number + mobile number                  │
│     → System sends OTP to mobile                             │
│     → User enters OTP (Factor 2 ✅)                          │
│     → Fills remaining details                                │
│     → Submits registration                                   │
│     ↓                                                        │
│  4. Registers fingerprint (WebAuthn)                         │
│     → Scans finger → Credential stored on blockchain         │
│     (Factor 3 enrolled ✅)                                   │
│     ↓                                                        │
│  5. Election Officer reviews & verifies citizen              │
│     → Checks submitted documents                             │
│     → Approves or rejects                                    │
│     ↓                                                        │
│  6. Citizen is now eligible to vote                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      VOTING FLOW                             │
│                                                              │
│  1. User logs in with Internet Identity (Factor 1)           │
│     ↓                                                        │
│  2. Backend checks:                                          │
│     ✅ Is registered citizen?                                │
│     ✅ Is verified by Election Officer?                      │
│     ✅ Is 18+?                                               │
│     ✅ Is in correct constituency?                           │
│     ✅ Has biometric enrolled?                               │
│     ✅ Has NOT already voted in this election?               │
│     ↓                                                        │
│  3. User selects candidate and clicks "Vote"                 │
│     ↓                                                        │
│  4. Biometric Verification Modal appears                     │
│     → User scans fingerprint (Factor 3)                      │
│     → Verified locally AND on blockchain                     │
│     ↓                                                        │
│  5. Vote is cast and recorded immutably on blockchain        │
│     → Cannot be changed or deleted                           │
│     → Audit log entry created                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Checks Before Every Vote (9 Checks)

The `castVote` function in `main.mo` performs these checks **on the blockchain**:

| # | Check | What it prevents |
|---|-------|-----------------|
| 1 | Is registered citizen? | Anonymous voting |
| 2 | Is verified by Election Officer? | Unverified accounts voting |
| 3 | Is 18+ years old? | Underage voting |
| 4 | Has biometric enrolled? | Voting without physical verification |
| 5 | Election exists? | Invalid election IDs |
| 6 | Election is open for voting? | Voting outside time window |
| 7 | Within voting time window? | Early/late voting |
| 8 | Correct constituency? | Cross-constituency voting |
| 9 | Has NOT already voted? | Double voting |

---

## How This Addresses Common Questions

### Q: "How does Internet Identity verify the actual person?"
**A:** Internet Identity alone doesn't — it only proves device ownership. That's why we have **three factors**: Internet Identity (device), Aadhaar OTP (phone/identity), and Biometric (physical person). Together they form a strong identity chain.

### Q: "Can someone create multiple accounts?"
**A:** No, because:
- Each Aadhaar number can only register once (blockchain check)
- Aadhaar OTP verification prevents using someone else's Aadhaar
- Election Officer manually verifies documents before approval

### Q: "How do two people use the same computer?"
**A:** Each user has a different Internet Identity anchor number. All biometric data is stored **per-user** (keyed by Principal ID), so multiple users on the same browser maintain separate credentials.

### Q: "What if someone steals my session?"
**A:** They still can't vote because:
- Biometric fingerprint verification is required before every vote
- The fingerprint must match the one enrolled on the blockchain
- Sessions expire after 24 hours

### Q: "Is the Aadhaar verification real?"
**A:** The architecture is production-ready. In this project, the UIDAI API is simulated (OTP is shown in demo mode). In production, the same flow would use the official Aadhaar e-KYC API (requires government authorization). The blockchain verification logic remains identical.

### Q: "Where is the fingerprint stored?"
**A:** The actual fingerprint **never leaves the device**. Only a cryptographic credential ID is stored on the blockchain. This uses the WebAuthn (FIDO2) standard used by Google, Apple, Microsoft, etc.

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Blockchain | Internet Computer (ICP) | Immutable vote storage, smart contracts |
| Authentication | Internet Identity | Cryptographic device-bound login |
| Identity Verification | Aadhaar OTP (simulated) | Real-world identity confirmation |
| Biometric | WebAuthn / FIDO2 | Physical person verification |
| Backend | Motoko (main.mo) | On-chain logic and security checks |
| Frontend | React + Vite | User interface |
| Styling | Tailwind CSS | Responsive design |

---

## Architecture Diagram

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser    │     │  Internet        │     │  ICP Blockchain  │
│   (React)    │────▶│  Identity        │────▶│  (Motoko)        │
│              │     │  Service         │     │                  │
│  - WebAuthn  │     │  - Anchor mgmt   │     │  - Citizens map  │
│  - Biometric │     │  - Passkey auth  │     │  - Elections map │
│  - OTP input │     │  - Delegation    │     │  - Votes array   │
│              │     │                  │     │  - Biometrics    │
│              │     │                  │     │  - Aadhaar OTPs  │
│              │     │                  │     │  - Audit logs    │
└─────────────┘     └──────────────────┘     └─────────────────┘
       │                                              │
       │         ┌──────────────────┐                 │
       └────────▶│  UIDAI Aadhaar   │◀────────────────┘
                 │  e-KYC API       │
                 │  (Simulated)     │
                 └──────────────────┘
```
