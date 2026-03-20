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

// Production-safe logger — only logs in local development
const logger = {
    log: (...args) => { if (isLocal) console.log(...args); },
    warn: (...args) => { if (isLocal) console.warn(...args); },
    error: (...args) => { console.error(...args); }, // errors always logged
};

// Backend canister ID — MUST be set via environment at build time
const canisterId = process.env.CANISTER_ID_VOTING_BACKEND;
if (!canisterId) {
    throw new Error(
        'CANISTER_ID_VOTING_BACKEND is not set. ' +
        'Run: dfx deploy && bash generate-env.sh, then rebuild the frontend.'
    );
}

// Internet Identity canister ID
const iiCanisterId = process.env.CANISTER_ID_INTERNET_IDENTITY;
if (!iiCanisterId && isLocal) {
    throw new Error(
        'CANISTER_ID_INTERNET_IDENTITY is not set. ' +
        'Run: dfx deploy internet_identity && bash generate-env.sh'
    );
}

// Build the Identity Provider URL
// Local:   http://<ii-canister-id>.localhost:4943
// Mainnet: https://identity.ic0.app
const identityProvider = isLocal
    ? `http://${iiCanisterId}.localhost:4943`
    : 'https://identity.ic0.app';

logger.log('🌐 Network:', network);
logger.log('🔗 Backend Canister:', canisterId);
logger.log('🔑 Identity Provider:', identityProvider);

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
            logger.log('🔐 Starting Internet Identity login...');

            if (!authClient) {
                authClient = await AuthClient.create();
            }

            logger.log('🌐 Opening Internet Identity popup...');

            authClient.login({
                identityProvider,
                windowOpenerFeatures: `
                    left=${window.screen.width / 2 - 525 / 2},
                    top=${window.screen.height / 2 - 705 / 2},
                    toolbar=0,location=0,menubar=0,width=525,height=705
                `,
                maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days
                onSuccess: async () => {
                    logger.log('✅ Internet Identity authentication successful!');
                    try {
                        await setupActor();
                        const principal = authClient.getIdentity().getPrincipal().toString();
                        logger.log('✅ Logged in as:', principal);
                        resolve(true);
                    } catch (err) {
                        console.error('Login connection error');
                        reject(err);
                    }
                },
                onError: (error) => {
                    console.error('Login failed');
                    reject(error);
                },
            });
        } catch (error) {
            console.error('Login initialization error');
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
    logger.log('Logged out and cleared authentication state');
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

    // Fetch root key for certificate validation during development only
    if (isLocal) {
        await agent.fetchRootKey().catch(err => {
            logger.warn('Unable to fetch root key. Check if the local replica is running');
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
        logger.log('Requesting Aadhaar OTP...');
        const actor = getActor();
        const result = await actor.requestAadhaarOTP(aadhaarNumber, mobileNumber);
        logger.log('OTP request result:', result);
        return result;
    } catch (error) {
        console.error('OTP request error');
        throw error;
    }
};

export const verifyAadhaarOTP = async (aadhaarNumber, otp) => {
    try {
        logger.log('Verifying Aadhaar OTP...');
        const actor = getActor();
        const result = await actor.verifyAadhaarOTP(aadhaarNumber, otp);
        logger.log('OTP verify result:', result);
        return result;
    } catch (error) {
        console.error('OTP verify error');
        throw error;
    }
};

export const initializeSystem = async () => {
    const actor = getActor();
    return await actor.initialize();
};

export const registerCitizen = async (data) => {
    try {
        logger.log('Calling backend registerCitizen...');
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
        logger.log('Backend response:', result);
        return result;
    } catch (error) {
        console.error('Service registerCitizen error');
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
    // Convert numbers to BigInt format required by Motoko Nat types
    return await actor.castVote(BigInt(electionId), BigInt(candidateId));
};

export const hasVoted = async (electionId) => {
    const actor = getActor();
    return await actor.hasVoted(BigInt(electionId));
};

export const getElectionResults = async (electionId) => {
    const actor = getActor();
    return await actor.getElectionResults(BigInt(electionId));
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

// ============ SMS CONFIGURATION (Admin) ============

export const configureSms = async (apiKey, enabled, gatewayUrl = null) => {
    const actor = getActor();
    return await actor.configureSms(apiKey, enabled, gatewayUrl ? [gatewayUrl] : []);
};

export const getSmsStatus = async () => {
    const actor = getActor();
    return await actor.getSmsStatus();
};

// ============ ACCOUNT RECOVERY ============

export const requestRecoveryOTP = async (aadhaarNumber, mobileNumber) => {
    const actor = getActor();
    return await actor.requestRecoveryOTP(aadhaarNumber, mobileNumber);
};

export const verifyRecoveryOTP = async (aadhaarNumber, otp) => {
    const actor = getActor();
    return await actor.verifyRecoveryOTP(aadhaarNumber, otp);
};

export const getMyRecoveryStatus = async (aadhaarNumber) => {
    const actor = getActor();
    return await actor.getMyRecoveryStatus(aadhaarNumber);
};

export const getPendingRecoveryRequests = async () => {
    const actor = getActor();
    return await actor.getPendingRecoveryRequests();
};

export const reviewRecoveryRequest = async (requestId, approve) => {
    const actor = getActor();
    return await actor.reviewRecoveryRequest(requestId, approve);
};

// ============ ADMIN MANAGEMENT (Portal) ============

export const addAdminByInitializer = async (newAdminPrincipal) => {
    const actor = getActor();
    return await actor.addAdminByInitializer(newAdminPrincipal);
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
                logger.warn('Unable to fetch root key');
            });
        }

        const anonymousActor = Actor.createActor(idlFactory, {
            agent,
            canisterId,
        });

        return await anonymousActor.getSystemInfo();
    } catch (error) {
        console.error('Error getting system info');
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
        logger.log('Enrolling biometric credential on blockchain...');

        if (!actor) {
            return { err: 'Actor not initialized' };
        }

        // Call backend to enroll biometric
        const result = await actor.enrollBiometricCredential(
            credentialData.id,
            credentialData.response.clientDataJSON,
            credentialData.response.attestationObject
        );

        if (result.ok) {
            logger.log('Biometric enrolled on blockchain');

            // Store per-user biometric session (keyed by principal)
            sessionStorage.setItem(getBiometricKey('session'), JSON.stringify({
                verified: true,
                timestamp: Date.now(),
                credentialId: credentialData.id
            }));

            return result;
        } else {
            logger.error('Backend enrollment failed:', result.err);
            return result;
        }
    } catch (error) {
        console.error('Error enrolling biometric');
        return { err: error.message };
    }
};

export const verifyBiometricCredential = async (credentialData) => {
    try {
        logger.log('Verifying biometric credential on blockchain...');

        if (!actor) {
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
            logger.log('Biometric verification successful on blockchain');

            // Store per-user biometric session
            sessionStorage.setItem(getBiometricKey('session'), JSON.stringify({
                verified: true,
                timestamp: Date.now(),
                credentialId: credentialData.credentialId
            }));

            return result;
        } else {
            logger.error('Backend verification failed:', result.err);
            return result;
        }
    } catch (error) {
        console.error('Error verifying biometric');
        return { err: error.message };
    }
};

export const getBiometricStatus = async () => {
    try {
        logger.log('Checking biometric status...');

        if (!actor) {
            return { err: 'Actor not initialized' };
        }

        const result = await actor.getBiometricStatus();
        return result;
    } catch (error) {
        console.error('Error getting biometric status');
        return { err: error.message };
    }
};

export const removeBiometricCredential = async () => {
    try {
        logger.log('Removing biometric credential...');

        if (!actor) {
            return { err: 'Actor not initialized' };
        }

        const result = await actor.removeBiometricCredential();

        if (result.ok) {
            sessionStorage.removeItem(getBiometricKey('session'));
            localStorage.removeItem(getBiometricKey('credential'));
            localStorage.removeItem(getBiometricKey('enrolled'));
        }

        return result;
    } catch (error) {
        console.error('Error removing biometric');
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
    } catch {
        return false;
    }
};

export const getBiometricSession = () => {
    try {
        // Check sessionStorage first, then localStorage for migration
        let session = sessionStorage.getItem(getBiometricKey('session'));
        if (!session) {
            session = localStorage.getItem(getBiometricKey('session'));
            if (session) {
                // Migrate from localStorage to sessionStorage
                sessionStorage.setItem(getBiometricKey('session'), session);
                localStorage.removeItem(getBiometricKey('session'));
            }
        }
        if (!session) return null;

        const sessionData = JSON.parse(session);
        // Check if session is still valid (24 hours)
        const maxAge = 24 * 60 * 60 * 1000;
        if (Date.now() - sessionData.timestamp > maxAge) {
            sessionStorage.removeItem(getBiometricKey('session'));
            return null;
        }

        return sessionData;
    } catch {
        return null;
    }
};

export const clearBiometricSession = () => {
    try {
        sessionStorage.removeItem(getBiometricKey('session'));
        // Also clean up any legacy localStorage entries
        localStorage.removeItem(getBiometricKey('session'));
        logger.log('Biometric session cleared');
    } catch {
        // silently ignore
    }
};
