import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { idlFactory } from './declarations/voting_backend';

// ============ CONFIGURATION ============
// Network detection: 'local' for development, 'ic' for mainnet
const network = process.env.DFX_NETWORK || 'local';
const isLocal = network !== 'ic';
const host = isLocal ? 'http://localhost:4943' : 'https://ic0.app';

let authClient = null;
let actor = null;

// Backend canister ID (from dfx deploy output)
const canisterId = process.env.CANISTER_ID_VOTING_BACKEND || 'uzt4z-lp777-77774-qaabq-cai';

// Internet Identity canister ID (from dfx deploy output)
const iiCanisterId = process.env.CANISTER_ID_INTERNET_IDENTITY || 'uxrrr-q7777-77774-qaaaq-cai';

// Build the Identity Provider URL
// Local:   http://<ii-canister-id>.localhost:4943
// Mainnet: https://identity.ic0.app
const identityProvider = isLocal
    ? `http://${iiCanisterId}.localhost:4943`
    : 'https://identity.ic0.app';

console.log('🌐 Network:', network);
console.log('🔗 Backend Canister:', canisterId);
console.log('🔑 Identity Provider:', identityProvider);

// ============ AUTHENTICATION ============

export const initAuth = async () => {
    authClient = await AuthClient.create();

    if (await authClient.isAuthenticated()) {
        await setupActor();
    }

    return authClient;
};

export const login = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('🔐 Starting Internet Identity login...');

            if (!authClient) {
                authClient = await AuthClient.create();
            }

            console.log('🌐 Opening Internet Identity popup...');
            console.log('   → New users: Click "Create New" to get an Anchor Number');
            console.log('   → Returning users: Enter your Anchor Number');

            authClient.login({
                identityProvider,
                windowOpenerFeatures: `
                    left=${window.screen.width / 2 - 525 / 2},
                    top=${window.screen.height / 2 - 705 / 2},
                    toolbar=0,location=0,menubar=0,width=525,height=705
                `,
                maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days
                onSuccess: async () => {
                    console.log('✅ Internet Identity authentication successful!');
                    try {
                        await setupActor();
                        const principal = authClient.getIdentity().getPrincipal().toString();
                        console.log('✅ Logged in as:', principal);
                        resolve(true);
                    } catch (err) {
                        console.error('❌ Error setting up connection:', err);
                        reject(err);
                    }
                },
                onError: (error) => {
                    console.error('❌ Login failed:', error);
                    reject(error);
                },
            });
        } catch (error) {
            console.error('❌ Login initialization error:', error);
            reject(error);
        }
    });
};

export const logout = async () => {
    if (authClient) {
        await authClient.logout();
    }
    actor = null;
    authClient = null;
    console.log('🚪 Logged out and cleared authentication state');
};

export const isAuthenticated = async () => {
    if (!authClient) {
        authClient = await AuthClient.create();
    }
    return await authClient.isAuthenticated();
};

export const getIdentity = async () => {
    if (!authClient) {
        authClient = await AuthClient.create();
    }
    return authClient.getIdentity();
};

export const getPrincipal = async () => {
    const identity = await getIdentity();
    return identity.getPrincipal().toString();
};

const setupActor = async () => {
    const identity = authClient.getIdentity();

    const agent = new HttpAgent({
        host,
        identity,
    });

    // Fetch root key for certificate validation during development
    if (isLocal) {
        await agent.fetchRootKey().catch(err => {
            console.warn('Unable to fetch root key. Check if the local replica is running');
            console.error(err);
        });
    }

    actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
    });
};

export const getActor = () => {
    if (!actor) {
        throw new Error('Actor not initialized. Please login first.');
    }
    return actor;
};

// Voting System API

// ============ AADHAAR OTP VERIFICATION ============

export const requestAadhaarOTP = async (aadhaarNumber, mobileNumber) => {
    try {
        console.log('\ud83d\udce8 Requesting Aadhaar OTP...');
        const actor = getActor();
        const result = await actor.requestAadhaarOTP(aadhaarNumber, mobileNumber);
        console.log('\ud83d\udce8 OTP request result:', result);
        return result;
    } catch (error) {
        console.error('\u274c OTP request error:', error);
        throw error;
    }
};

export const verifyAadhaarOTP = async (aadhaarNumber, otp) => {
    try {
        console.log('\ud83d\udd10 Verifying Aadhaar OTP...');
        const actor = getActor();
        const result = await actor.verifyAadhaarOTP(aadhaarNumber, otp);
        console.log('\ud83d\udd10 OTP verify result:', result);
        return result;
    } catch (error) {
        console.error('\u274c OTP verify error:', error);
        throw error;
    }
};

export const initializeSystem = async () => {
    const actor = getActor();
    return await actor.initialize();
};

export const registerCitizen = async (data) => {
    try {
        console.log('📡 Calling backend registerCitizen with:', data);
        const actor = getActor();
        if (!actor) {
            throw new Error('Actor not initialized. Please login first.');
        }
        const result = await actor.registerCitizen(
            data.fullName,
            data.dateOfBirth,
            data.aadhaarNumber,
            data.mobileNumber,
            data.address,
            data.gender,
            data.aadhaarPhotoUrl,
            data.photoUrl,
            data.voterIdNumber
        );
        console.log('📡 Backend response:', result);
        return result;
    } catch (error) {
        console.error('📡 Service registerCitizen error:', error);
        throw error;
    }
};

export const getMyCitizenProfile = async () => {
    const actor = getActor();
    return await actor.getMyCitizenProfile();
};

export const verifyCitizen = async (principal, approve, voterIdNumber, rejectionReason) => {
    const actor = getActor();
    return await actor.verifyCitizen(principal, approve, voterIdNumber, rejectionReason);
};

export const getPendingCitizens = async () => {
    const actor = getActor();
    return await actor.getPendingCitizens();
};

export const getAllCitizens = async () => {
    const actor = getActor();
    return await actor.getAllCitizens();
};

export const createElection = async (data) => {
    const actor = getActor();
    return await actor.createElection(data);
};

export const addCandidate = async (data) => {
    const actor = getActor();
    return await actor.addCandidate(data);
};

export const startVoting = async (electionId) => {
    const actor = getActor();
    return await actor.startVoting(electionId);
};

export const endVoting = async (electionId) => {
    const actor = getActor();
    return await actor.endVoting(electionId);
};

export const getAllElections = async () => {
    const actor = getActor();
    return await actor.getAllElections();
};

export const getElection = async (electionId) => {
    const actor = getActor();
    return await actor.getElection(electionId);
};

export const getCandidates = async (electionId) => {
    const actor = getActor();
    return await actor.getCandidates(electionId);
};

export const castVote = async (electionId, candidateId) => {
    const actor = getActor();
    return await actor.castVote(electionId, candidateId);
};

export const hasVoted = async (electionId) => {
    const actor = getActor();
    return await actor.hasVoted(electionId);
};

export const getElectionResults = async (electionId) => {
    const actor = getActor();
    return await actor.getElectionResults(electionId);
};

export const amIAdmin = async () => {
    const actor = getActor();
    return await actor.amIAdmin();
};

export const addAdmin = async (principal) => {
    const actor = getActor();
    return await actor.addAdmin(principal);
};

export const getAdmins = async () => {
    const actor = getActor();
    return await actor.getAdmins();
};

export const getStatistics = async () => {
    const actor = getActor();
    return await actor.getStatistics();
};

export const getAuditLogs = async (limit) => {
    const actor = getActor();
    return await actor.getAuditLogs(limit);
};

// ============ ADMIN SETUP (SELF-SERVICE) ============
// Calls initialize() on the backend — the first caller becomes admin.
// This allows a client to claim admin from the browser without using CLI.
export const claimAdmin = async () => {
    const actor = getActor();
    return await actor.initialize();
};

export const getSystemInfo = async () => {
    try {
        // Try with authenticated actor first
        if (actor) {
            return await actor.getSystemInfo();
        }

        // Fall back to anonymous actor for public calls
        const agent = new HttpAgent({ host });
        if (isLocal) {
            await agent.fetchRootKey().catch(err => {
                console.warn('Unable to fetch root key');
            });
        }

        const anonymousActor = Actor.createActor(idlFactory, {
            agent,
            canisterId,
        });

        return await anonymousActor.getSystemInfo();
    } catch (error) {
        console.error('Error getting system info:', error);
        throw error;
    }
};

// ============ BIOMETRIC AUTHENTICATION ============

// Helper: Get per-user localStorage key
const getBiometricKey = (suffix) => {
    try {
        const identity = authClient?.getIdentity();
        const principalId = identity ? identity.getPrincipal().toString() : 'anonymous';
        return `biometric_${suffix}_${principalId}`;
    } catch {
        return `biometric_${suffix}_anonymous`;
    }
};

export const enrollBiometricCredential = async (credentialData) => {
    try {
        console.log('🔐 Enrolling biometric credential on blockchain...');

        if (!actor) {
            console.error('❌ Actor not initialized');
            return { err: 'Actor not initialized' };
        }

        // Call backend to enroll biometric
        const result = await actor.enrollBiometricCredential(
            credentialData.id,
            credentialData.response.clientDataJSON,
            credentialData.response.attestationObject
        );

        if (result.ok) {
            console.log('✅ Biometric enrolled on blockchain:', result.ok);

            // Store per-user biometric session (keyed by principal)
            localStorage.setItem(getBiometricKey('session'), JSON.stringify({
                verified: true,
                timestamp: Date.now(),
                credentialId: credentialData.id
            }));

            return result;
        } else {
            console.error('❌ Backend enrollment failed:', result.err);
            return result;
        }
    } catch (error) {
        console.error('❌ Error enrolling biometric:', error);
        return { err: error.message };
    }
};

export const verifyBiometricCredential = async (credentialData) => {
    try {
        console.log('🔐 Verifying biometric credential on blockchain...');

        if (!actor) {
            console.error('❌ Actor not initialized');
            return { err: 'Actor not initialized' };
        }

        // Call backend to verify biometric
        const result = await actor.verifyBiometricCredential({
            credentialId: credentialData.credentialId,
            clientDataJSON: credentialData.clientDataJSON,
            authenticatorData: credentialData.authenticatorData,
            signature: credentialData.signature
        });

        if (result.ok) {
            console.log('✅ Biometric verification successful on blockchain');

            // Store per-user biometric session
            localStorage.setItem(getBiometricKey('session'), JSON.stringify({
                verified: true,
                timestamp: Date.now(),
                credentialId: credentialData.credentialId
            }));

            return result;
        } else {
            console.error('❌ Backend verification failed:', result.err);
            return result;
        }
    } catch (error) {
        console.error('❌ Error verifying biometric:', error);
        return { err: error.message };
    }
};

export const getBiometricStatus = async () => {
    try {
        console.log('🔍 Checking biometric status...');

        if (!actor) {
            console.error('❌ Actor not initialized');
            return { err: 'Actor not initialized' };
        }

        const result = await actor.getBiometricStatus();
        return result;
    } catch (error) {
        console.error('❌ Error getting biometric status:', error);
        return { err: error.message };
    }
};

export const removeBiometricCredential = async () => {
    try {
        console.log('🗑️  Removing biometric credential...');

        if (!actor) {
            console.error('❌ Actor not initialized');
            return { err: 'Actor not initialized' };
        }

        const result = await actor.removeBiometricCredential();

        if (result.ok) {
            localStorage.removeItem(getBiometricKey('session'));
            localStorage.removeItem(getBiometricKey('credential'));
            localStorage.removeItem(getBiometricKey('enrolled'));
        }

        return result;
    } catch (error) {
        console.error('❌ Error removing biometric:', error);
        return { err: error.message };
    }
};

export const isBiometricEnrolled = () => {
    try {
        // Check per-user key first, fall back to legacy key
        const perUserKey = getBiometricKey('enrolled');
        if (localStorage.getItem(perUserKey) === 'true') return true;
        // Legacy fallback
        return localStorage.getItem('biometric_enrolled') === 'true';
    } catch (error) {
        console.error('Error checking biometric enrollment:', error);
        return false;
    }
};

export const getBiometricSession = () => {
    try {
        const session = localStorage.getItem(getBiometricKey('session'));
        if (!session) return null;

        const sessionData = JSON.parse(session);
        // Check if session is still valid (24 hours)
        const maxAge = 24 * 60 * 60 * 1000;
        if (Date.now() - sessionData.timestamp > maxAge) {
            localStorage.removeItem(getBiometricKey('session'));
            return null;
        }

        return sessionData;
    } catch (error) {
        console.error('Error getting biometric session:', error);
        return null;
    }
};

export const clearBiometricSession = () => {
    try {
        localStorage.removeItem(getBiometricKey('session'));
        console.log('✅ Biometric session cleared');
    } catch (error) {
        console.error('Error clearing biometric session:', error);
    }
};
