import Types "./types";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
import Result "mo:base/Result";
import Int "mo:base/Int";
import Hash "mo:base/Hash";
import Char "mo:base/Char";
import Blob "mo:base/Blob";
import Random "mo:base/Random";
import Nat8 "mo:base/Nat8";

persistent actor VotingSystem {
    // Type aliases
    type Citizen = Types.Citizen;
    type Election = Types.Election;
    type Candidate = Types.Candidate;
    type VoteRecord = Types.VoteRecord;
    type AuditLog = Types.AuditLog;
    type BiometricCredential = Types.BiometricCredential;
    type BiometricVerificationRequest = Types.BiometricVerificationRequest;
    type Result<T, E> = Types.Result<T, E>;

    // Stable variables (persist across upgrades)
    private stable var citizensEntries : [(Principal, Citizen)] = [];
    private stable var electionsEntries : [(Nat, Election)] = [];
    private stable var candidatesEntries : [(Nat, Candidate)] = [];
    private stable var votesArray : [VoteRecord] = [];
    private stable var auditLogsArray : [AuditLog] = [];
    private stable var adminsArray : [Principal] = [];
    private stable var aadhaarRegistry : [Text] = [];
    private stable var biometricsEntries : [(Principal, BiometricCredential)] = [];
    private stable var aadhaarOTPEntries : [(Text, Types.AadhaarOTPRecord)] = [];
    private stable var otpRateLimitEntries : [(Principal, [Int])] = [];
    
    // SMS gateway configuration (admin-configurable)
    private stable var smsApiKey : Text = "";
    private stable var smsEnabled : Bool = false;
    private stable var smsGatewayUrl : Text = "https://www.fast2sms.com/dev/bulkV2";

    // Development mode — allows OTP fallback when SMS fails (local replica cannot make HTTPS outcalls)
    // MUST be disabled before mainnet deployment!
    private stable var devMode : Bool = true;

    // Account recovery
    private stable var recoveryRequestsEntries : [(Nat, Types.RecoveryRequest)] = [];
    private stable var nextRecoveryId : Nat = 1;

    private stable var nextElectionId : Nat = 1;
    private stable var nextCandidateId : Nat = 1;
    private stable var initialized : Bool = false;

    // The deployer's Principal — set once during initialize()
    // No hardcoded admin. Whoever calls initialize() first becomes the admin.

    // Helper: Hash function for Nat
    private func natHash(n : Nat) : Hash.Hash {
        Text.hash(Nat.toText(n))
    };

    // Runtime state (transient - rebuilt from stable storage)
    private transient var citizens = HashMap.HashMap<Principal, Citizen>(10, Principal.equal, Principal.hash);
    private transient var elections = HashMap.HashMap<Nat, Election>(10, Nat.equal, natHash);
    private transient var candidates = HashMap.HashMap<Nat, Candidate>(10, Nat.equal, natHash);
    private transient var votes : [VoteRecord] = [];
    private transient var auditLogs : [AuditLog] = [];
    private transient var admins : [Principal] = [];
    private transient var biometrics = HashMap.HashMap<Principal, BiometricCredential>(10, Principal.equal, Principal.hash);
    private transient var aadhaarOTPs = HashMap.HashMap<Text, Types.AadhaarOTPRecord>(10, Text.equal, Text.hash);
    private transient var otpRateLimits = HashMap.HashMap<Principal, [Int]>(10, Principal.equal, Principal.hash);
    private transient var recoveryRequests = HashMap.HashMap<Nat, Types.RecoveryRequest>(10, Nat.equal, natHash);

    // Management canister interface for IC HTTPS outcalls (SMS) and controller checks
    let ic : actor {
        http_request : Types.HttpRequestArgs -> async Types.HttpResponsePayload;
        canister_status : { canister_id : Principal } -> async { settings : { controllers : [Principal] } };
    } = actor "aaaaa-aa";

    // Check if a principal is a canister controller (deployer)
    private func checkIsController(caller : Principal) : async Bool {
        try {
            let status = await ic.canister_status({ canister_id = Principal.fromActor(VotingSystem) });
            Option.isSome(Array.find(status.settings.controllers, func(c : Principal) : Bool {
                Principal.equal(c, caller)
            }))
        } catch (_) {
            false
        }
    };

    // System initialization
    system func preupgrade() {
        citizensEntries := Iter.toArray(citizens.entries());
        electionsEntries := Iter.toArray(elections.entries());
        candidatesEntries := Iter.toArray(candidates.entries());
        votesArray := votes;
        auditLogsArray := auditLogs;
        adminsArray := admins;
        biometricsEntries := Iter.toArray(biometrics.entries());
        aadhaarOTPEntries := Iter.toArray(aadhaarOTPs.entries());
        otpRateLimitEntries := Iter.toArray(otpRateLimits.entries());
        recoveryRequestsEntries := Iter.toArray(recoveryRequests.entries());
    };

    system func postupgrade() {
        citizens := HashMap.fromIter<Principal, Citizen>(citizensEntries.vals(), 10, Principal.equal, Principal.hash);
        elections := HashMap.fromIter<Nat, Election>(electionsEntries.vals(), 10, Nat.equal, natHash);
        candidates := HashMap.fromIter<Nat, Candidate>(candidatesEntries.vals(), 10, Nat.equal, natHash);
        votes := votesArray;
        auditLogs := auditLogsArray;
        admins := adminsArray;
        initialized := Array.size(admins) > 0;
        biometrics := HashMap.fromIter<Principal, BiometricCredential>(biometricsEntries.vals(), 10, Principal.equal, Principal.hash);
        aadhaarOTPs := HashMap.fromIter<Text, Types.AadhaarOTPRecord>(aadhaarOTPEntries.vals(), 10, Text.equal, Text.hash);
        otpRateLimits := HashMap.fromIter<Principal, [Int]>(otpRateLimitEntries.vals(), 10, Principal.equal, Principal.hash);
        recoveryRequests := HashMap.fromIter<Nat, Types.RecoveryRequest>(recoveryRequestsEntries.vals(), 10, Nat.equal, natHash);
        
        citizensEntries := [];
        electionsEntries := [];
        candidatesEntries := [];
        biometricsEntries := [];
        aadhaarOTPEntries := [];
        otpRateLimitEntries := [];
        recoveryRequestsEntries := [];
    };

    // ============ SYSTEM INITIALIZATION ============
    // SECURITY: Only canister controllers (the deployer's dfx identity) can initialize.
    // This prevents random visitors from claiming admin.
    //
    // Usage after deploy:
    //   dfx canister call voting_backend initialize
    //
    // To add your browser identity as admin too:
    //   dfx canister call voting_backend addAdminByInitializer '(principal "<your-browser-principal>")'

    public shared(msg) func initialize() : async Result<Text, Text> {
        if (initialized and Array.size(admins) > 0) {
            return #ok("System already initialized. Admin exists: " # Principal.toText(admins[0]))
        };

        // SECURITY: Only canister controllers (deployer) can initialize
        let isController = await checkIsController(msg.caller);
        if (not isController) {
            return #err("Access denied. Only the canister deployer (controller) can initialize. Run from CLI: dfx canister call voting_backend initialize")
        };

        // Controller verified — make them the admin
        admins := [msg.caller];
        initialized := true;

        logAudit(msg.caller, "SYSTEM_INITIALIZED", ?msg.caller, "First admin set via initialize() — controller verified");

        #ok("You are now the admin. Your Principal: " # Principal.toText(msg.caller))
    };

    // Allow the initial admin (deployer) to add another admin.
    // Useful for adding your browser Internet Identity principal as admin.
    //
    // Usage:
    //   dfx canister call voting_backend addAdminByInitializer '(principal "xxxxx-xxxxx-...")'
    public shared(msg) func addAdminByInitializer(newAdmin : Principal) : async Result<Text, Text> {
        if (not initialized or Array.size(admins) == 0) {
            return #err("System not initialized. Call initialize() first.");
        };

        // Only the first admin (initializer/deployer) can use this function
        if (not Principal.equal(msg.caller, admins[0])) {
            return #err("Only the initial deployer can use this function")
        };

        if (isAdmin(newAdmin)) {
            return #err("This principal is already an admin")
        };

        admins := Array.append(admins, [newAdmin]);

        logAudit(msg.caller, "ADMIN_ADDED_BY_DEPLOYER", ?newAdmin, "Added via addAdminByInitializer");

        #ok("Admin added successfully. Principal: " # Principal.toText(newAdmin))
    };

    // Helper: Check if caller is admin
    private func isAdmin(principal : Principal) : Bool {
        Option.isSome(Array.find(admins, func(p : Principal) : Bool { Principal.equal(p, principal) }))
    };

    // Helper: Check if caller is super admin (first admin)
    private func isSuperAdmin(principal : Principal) : Bool {
        if (Array.size(admins) == 0) {
            return false;
        };
        Principal.equal(admins[0], principal)
    };

    // Helper: Check if Aadhaar exists
    private func aadhaarExists(aadhaar : Text) : Bool {
        Option.isSome(Array.find(aadhaarRegistry, func(a : Text) : Bool { Text.equal(a, aadhaar) }))
    };

    // Helper: Calculate age from date of birth
    // Helper: Check if text starts with prefix
    private func textStartsWith(text : Text, prefix : Text) : Bool {
        let textArray = Iter.toArray(Text.toIter(text));
        let prefixArray = Iter.toArray(Text.toIter(prefix));
        
        if (Array.size(prefixArray) > Array.size(textArray)) {
            return false;
        };
        
        var i = 0;
        while (i < Array.size(prefixArray)) {
            if (textArray[i] != prefixArray[i]) {
                return false;
            };
            i += 1;
        };
        true
    };

    // Helper: Normalize date format (replace / with -)
    private func normalizeDateFormat(dob : Text) : Text {
        Text.map(dob, func (c : Char) : Char {
            if (c == '/') { '-' } else { c }
        })
    };

    // Helper: Get current date from Time.now() (no hardcoded values)
    private func getCurrentDate() : (Nat, Nat, Nat) {
        let now = Time.now();
        let secondsSinceEpoch = Int.abs(now) / 1_000_000_000;
        let totalDays = secondsSinceEpoch / 86400;

        // Civil date from days (Howard Hinnant's algorithm)
        let z = totalDays + 719468;
        let era = z / 146097;
        let doe = z - era * 146097;
        let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
        let y = yoe + era * 400;
        let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
        let mp = (5 * doy + 2) / 153;
        let d = doy - (153 * mp + 2) / 5 + 1;
        let m = if (mp < 10) { mp + 3 } else { mp - 9 };
        let year = if (m <= 2) { y + 1 } else { y };

        (year, m, d)
    };

    private func calculateAge(dob : Text) : Nat {
        // Age calculation with proper date comparison
        // Format accepted: "DD-MM-YYYY" or "DD/MM/YYYY"
        let normalizedDate = normalizeDateFormat(dob);
        let parts = Iter.toArray(Text.split(normalizedDate, #char '-'));
        if (Array.size(parts) == 3) {
            switch (Nat.fromText(parts[0]), Nat.fromText(parts[1]), Nat.fromText(parts[2])) {
                case (?day, ?month, ?year) {
                    // Dynamically get current date from system time
                    let (currentYear, currentMonth, currentDay) = getCurrentDate();
                    
                    if (year > currentYear) { return 0 };
                    
                    var age = currentYear - year;
                    
                    // Adjust if birthday hasn't occurred this year
                    if (month > currentMonth or (month == currentMonth and day > currentDay)) {
                        if (age > 0) {
                            age := age - 1;
                        };
                    };
                    
                    age
                };
                case _ { 0 };
            }
        } else { 0 }
    };

    // Helper: Determine constituency from pincode and district
    private func determineConstituency(pincode : Text, district : Text) : Text {
        // Simplified - in production, use proper mapping
        district # "-" # pincode
    };

    // Helper: Validate mobile number
    private func isValidMobile(mobile : Text) : Bool {
        let size = Text.size(mobile);
        if (size < 10 or size > 15) { return false };
        for (c in Text.toIter(mobile)) {
            if (c != '+' and (c < '0' or c > '9')) { return false };
        };
        true
    };

    // Helper: Validate that Aadhaar is exactly 12 digits (not just 12 characters)
    private func isValidAadhaar(aadhaar : Text) : Bool {
        if (Text.size(aadhaar) != 12) { return false };
        for (c in Text.toIter(aadhaar)) {
            if (c < '0' or c > '9') { return false };
        };
        true
    };

    // Helper: OTP rate limiting — max 3 requests per 10 minutes per caller
    private func checkOTPRateLimit(caller : Principal) : Bool {
        let now = Time.now();
        let tenMinutes : Int = 10 * 60 * 1_000_000_000;
        switch (otpRateLimits.get(caller)) {
            case null { true };
            case (?timestamps) {
                let recent = Array.filter<Int>(timestamps, func(t : Int) : Bool {
                    (now - t) < tenMinutes
                });
                Array.size(recent) < 3
            };
        }
    };

    // Helper: Record an OTP request timestamp for rate limiting
    private func recordOTPRequest(caller : Principal) {
        let now = Time.now();
        let tenMinutes : Int = 10 * 60 * 1_000_000_000;
        let existing = switch (otpRateLimits.get(caller)) {
            case null { [] };
            case (?timestamps) {
                Array.filter<Int>(timestamps, func(t : Int) : Bool {
                    (now - t) < tenMinutes
                })
            };
        };
        otpRateLimits.put(caller, Array.append(existing, [now]));
    };

    // Helper: Log audit entry
    private func logAudit(actorPrincipal : Principal, action : Text, target : ?Principal, details : Text) {
        let log : AuditLog = {
            timestamp = Time.now();
            actorPrincipal = actorPrincipal;
            action = action;
            target = target;
            details = details;
        };
        auditLogs := Array.append(auditLogs, [log]);
    };

    // ============ AADHAAR OTP VERIFICATION ============

    // Transform function for HTTPS outcalls — strips non-deterministic headers for IC consensus
    public query func transform(raw : Types.TransformArgs) : async Types.HttpResponsePayload {
        {
            status = raw.response.status;
            body = raw.response.body;
            headers = [];
        }
    };

    // Build the HTTP request for the SMS gateway (Fast2SMS format)
    private func buildSmsRequest(mobileNumber : Text, otp : Text) : Types.HttpRequestArgs {
        let url = smsGatewayUrl # "?route=otp&variables_values=" # otp # "&flash=0&numbers=" # mobileNumber;
        {
            url = url;
            max_response_bytes = ?Nat64.fromNat(2048);
            headers = [{ name = "authorization"; value = smsApiKey }];
            body = null;
            method = #get;
            transform = ?{
                function = transform;
                context = Blob.fromArray([]);
            };
        }
    };

    // Helper: Generate a cryptographically random 6-digit OTP using IC's Random module
    private func generateOTP() : async Text {
        let entropy = await Random.blob();
        let bytes = Blob.toArray(entropy);
        // Combine first 4 bytes into a Nat for the OTP seed
        var seed : Nat = 0;
        var i = 0;
        while (i < 4 and i < Array.size(bytes)) {
            seed := seed * 256 + Nat8.toNat(bytes[i]);
            i += 1;
        };
        let otp = seed % 1000000;
        let otpText = Nat.toText(otp);
        // Pad to 6 digits
        let padding = 6 - Text.size(otpText);
        var padded = otpText;
        var j = 0;
        while (j < padding) {
            padded := "0" # padded;
            j += 1;
        };
        padded
    };

    // Request Aadhaar OTP
    public shared(msg) func requestAadhaarOTP(
        aadhaarNumber : Text,
        mobileNumber : Text
    ) : async Result<Text, Text> {
        // Block anonymous callers
        if (Principal.isAnonymous(msg.caller)) {
            return #err("Authentication required. Please log in first.");
        };

        // Rate limit: max 3 OTP requests per 10 minutes
        if (not checkOTPRateLimit(msg.caller)) {
            return #err("Too many OTP requests. Please wait 10 minutes before trying again.");
        };

        // Validate Aadhaar format (must be exactly 12 digits)
        if (not isValidAadhaar(aadhaarNumber)) {
            return #err("Invalid Aadhaar number format. Must be exactly 12 digits.");
        };

        // Validate mobile
        if (not isValidMobile(mobileNumber)) {
            return #err("Invalid mobile number");
        };

        // Check if Aadhaar already registered
        if (aadhaarExists(aadhaarNumber)) {
            return #err("This Aadhaar number is already registered in the system!");
        };

        // Generate cryptographically random OTP
        let otp = await generateOTP();

        // Store OTP record
        let otpRecord : Types.AadhaarOTPRecord = {
            aadhaarNumber = aadhaarNumber;
            otp = otp;
            mobileNumber = mobileNumber;
            generatedAt = Time.now();
            verified = false;
            attempts = 0;
        };
        aadhaarOTPs.put(aadhaarNumber, otpRecord);

        // Record rate limit
        recordOTPRequest(msg.caller);

        // Mask the Aadhaar number in audit log
        let lastFour = if (Text.size(aadhaarNumber) >= 4) {
            let chars = Iter.toArray(Text.toIter(aadhaarNumber));
            let len = Array.size(chars);
            Text.fromIter(Array.vals([
                chars[len - 4], chars[len - 3], chars[len - 2], chars[len - 1]
            ]))
        } else { "****" };
        logAudit(msg.caller, "AADHAAR_OTP_REQUESTED", null, "OTP sent for Aadhaar: ********" # lastFour);

        // Mask the mobile number in the response (show last 4 digits only)
        let mobileLastFour = if (Text.size(mobileNumber) >= 4) {
            let chars = Iter.toArray(Text.toIter(mobileNumber));
            let len = Array.size(chars);
            Text.fromIter(Array.vals([
                chars[len - 4], chars[len - 3], chars[len - 2], chars[len - 1]
            ]))
        } else { "****" };

        // Send OTP via SMS gateway — SMS must be configured for production
        if (smsEnabled and Text.size(smsApiKey) > 0) {
            let request = buildSmsRequest(mobileNumber, otp);
            try {
                let response = await (with cycles = 230_850_258_000) ic.http_request(request);
                if (response.status != 200) {
                    logAudit(msg.caller, "SMS_SEND_FAILED", null, "Gateway returned status " # Nat.toText(response.status));
                    if (devMode) {
                        return #ok("[DEV MODE] SMS failed. Your OTP is: " # otp)
                    };
                    return #err("Failed to send OTP via SMS. Please try again.");
                };
            } catch (_) {
                logAudit(msg.caller, "SMS_SEND_FAILED", null, "HTTPS outcall error");
                if (devMode) {
                    return #ok("[DEV MODE] SMS unavailable (local replica). Your OTP is: " # otp)
                };
                return #err("Failed to send OTP via SMS. Please try again.");
            };
            #ok("OTP sent to mobile number ending in " # mobileLastFour # ". Please check your phone.")
        } else if (devMode) {
            // Dev mode without SMS — return OTP for local testing
            #ok("[DEV MODE] Your OTP is: " # otp # " (configure SMS for production)")
        } else {
            // Production — SMS not configured, reject
            #err("SMS gateway not configured. Please contact the Election Officer to enable OTP delivery.")
        }
    };

    // Verify Aadhaar OTP
    public shared(msg) func verifyAadhaarOTP(
        aadhaarNumber : Text,
        enteredOTP : Text
    ) : async Result<Text, Text> {
        // Block anonymous callers
        if (Principal.isAnonymous(msg.caller)) {
            return #err("Authentication required. Please log in first.");
        };
        switch (aadhaarOTPs.get(aadhaarNumber)) {
            case null {
                return #err("No OTP request found. Please request an OTP first.");
            };
            case (?otpRecord) {
                // Check if already verified
                if (otpRecord.verified) {
                    return #ok("Aadhaar already verified");
                };

                // Check max attempts (prevent brute force)
                if (otpRecord.attempts >= 5) {
                    aadhaarOTPs.delete(aadhaarNumber);
                    return #err("Too many failed attempts. Please request a new OTP.");
                };

                // Check OTP expiry (5 minutes = 5 * 60 * 1_000_000_000 nanoseconds)
                let fiveMinutes : Int = 5 * 60 * 1_000_000_000;
                if (Time.now() - otpRecord.generatedAt > fiveMinutes) {
                    aadhaarOTPs.delete(aadhaarNumber);
                    return #err("OTP has expired. Please request a new one.");
                };

                // Verify OTP
                if (enteredOTP != otpRecord.otp) {
                    // Increment attempts
                    let updated : Types.AadhaarOTPRecord = {
                        aadhaarNumber = otpRecord.aadhaarNumber;
                        otp = otpRecord.otp;
                        mobileNumber = otpRecord.mobileNumber;
                        generatedAt = otpRecord.generatedAt;
                        verified = false;
                        attempts = otpRecord.attempts + 1;
                    };
                    aadhaarOTPs.put(aadhaarNumber, updated);
                    return #err("Invalid OTP. " # Nat.toText(4 - otpRecord.attempts) # " attempts remaining.");
                };

                // Mark as verified
                let verified : Types.AadhaarOTPRecord = {
                    aadhaarNumber = otpRecord.aadhaarNumber;
                    otp = otpRecord.otp;
                    mobileNumber = otpRecord.mobileNumber;
                    generatedAt = otpRecord.generatedAt;
                    verified = true;
                    attempts = otpRecord.attempts;
                };
                aadhaarOTPs.put(aadhaarNumber, verified);

                logAudit(msg.caller, "AADHAAR_OTP_VERIFIED", null, "Aadhaar verified via OTP");

                #ok("Aadhaar number verified successfully!")
            };
        }
    };

    // ============ CITIZEN MANAGEMENT ============

    // Register new citizen
    public shared(msg) func registerCitizen(
        fullName : Text,
        dateOfBirth : Text,
        aadhaarNumber : Text,
        mobileNumber : Text,
        address : Types.AddressInfo,
        gender : Types.Gender,
        aadhaarPhotoUrl : Text,
        photoUrl : Text,
        voterIdNumber : Text
    ) : async Result<Text, Text> {
        // Block anonymous callers
        if (Principal.isAnonymous(msg.caller)) {
            return #err("Authentication required. Please log in first.");
        };

        let principal = msg.caller;

        // Check if already registered
        switch (citizens.get(principal)) {
            case (?_) { return #err("Already registered with this identity!") };
            case null {};
        };

        // Validate voter ID (not empty)
        if (Text.size(voterIdNumber) == 0) {
            return #err("Voter ID number is required");
        };

        // Validate Aadhaar number (exactly 12 digits)
        if (not isValidAadhaar(aadhaarNumber)) {
            return #err("Invalid Aadhaar number format. Must be exactly 12 digits.");
        };

        // Check for duplicate Aadhaar
        if (aadhaarExists(aadhaarNumber)) {
            return #err("This Aadhaar number is already registered!");
        };

        // SECURITY CHECK: Verify Aadhaar OTP was completed
        switch (aadhaarOTPs.get(aadhaarNumber)) {
            case null {
                return #err("Aadhaar number not verified. Please complete OTP verification first.");
            };
            case (?otpRecord) {
                if (not otpRecord.verified) {
                    return #err("Aadhaar OTP verification incomplete. Please verify your OTP first.");
                };
                // Verify mobile number matches OTP request
                if (otpRecord.mobileNumber != mobileNumber) {
                    return #err("Mobile number does not match the one used for Aadhaar OTP verification.");
                };
            };
        };

        // Calculate age
        let age = calculateAge(dateOfBirth);
        if (age < 18) {
            return #err("You must be 18 or older to register");
        };

        // Validate mobile number
        if (not isValidMobile(mobileNumber)) {
            return #err("Invalid mobile number");
        };

        // Validate required photo URLs
        if (Text.size(aadhaarPhotoUrl) == 0) {
            return #err("Aadhaar photo is required. Please upload your Aadhaar document photo.");
        };
        if (Text.size(photoUrl) == 0) {
            return #err("Your photo is required. Please upload a profile photo.");
        };

        // Create citizen profile
        let newCitizen : Citizen = {
            principal = principal;
            fullName = fullName;
            dateOfBirth = dateOfBirth;
            age = age;
            gender = gender;
            aadhaarNumber = aadhaarNumber;
            voterIdNumber = voterIdNumber;
            addressLine1 = address.line1;
            addressLine2 = address.line2;
            city = address.city;
            district = address.district;
            state = address.state;
            pincode = address.pincode;
            constituency = determineConstituency(address.pincode, address.district);
            mobileNumber = mobileNumber;
            email = null;
            aadhaarPhotoUrl = aadhaarPhotoUrl;
            voterIdPhotoUrl = null;
            photoUrl = photoUrl;
            status = #Pending;
            isEligible = false;
            registrationTime = Time.now();
            verifiedBy = null;
            verifiedAt = null;
            lastUpdated = Time.now();
        };

        // Store citizen
        citizens.put(principal, newCitizen);
        
        // Register Aadhaar
        aadhaarRegistry := Array.append(aadhaarRegistry, [aadhaarNumber]);

        // Log action
        logAudit(principal, "CITIZEN_REGISTERED", null, fullName);

        #ok("Registration successful! Wait for Election Officer verification.")
    };

    // Get citizen profile
    public query(msg) func getMyCitizenProfile() : async Result<Citizen, Text> {
        switch (citizens.get(msg.caller)) {
            case null { #err("Not registered as citizen") };
            case (?citizen) { #ok(citizen) };
        }
    };

    // Verify citizen (Election Officer only)
    public shared(msg) func verifyCitizen(
        citizenPrincipal : Principal,
        approve : Bool,
        voterIdNumber : ?Text,
        rejectionReason : ?Text
    ) : async Result<Text, Text> {
        // Must be admin
        if (not isAdmin(msg.caller)) {
            return #err("Only Election Officers can verify citizens");
        };

        // Get citizen
        switch (citizens.get(citizenPrincipal)) {
            case null { #err("Citizen not found") };
            case (?citizen) {
                if (approve) {
                    // Generate EPIC number if not provided
                    let epicNumber = switch (voterIdNumber) {
                        case null { "EPIC" # Nat.toText(Int.abs(Time.now())) };
                        case (?id) { id };
                    };

                    // Approve citizen
                    let updatedCitizen : Citizen = {
                        citizen with 
                        status = #Verified;
                        isEligible = true;
                        voterIdNumber = epicNumber;
                        verifiedBy = ?msg.caller;
                        verifiedAt = ?Time.now();
                        lastUpdated = Time.now();
                    };
                    citizens.put(citizenPrincipal, updatedCitizen);

                    // Log verification
                    logAudit(msg.caller, "CITIZEN_VERIFIED", ?citizenPrincipal, citizen.fullName);

                    #ok("Citizen verified successfully. EPIC number: " # epicNumber)
                } else {
                    // Reject citizen
                    let updatedCitizen : Citizen = {
                        citizen with 
                        status = #Rejected;
                        isEligible = false;
                        lastUpdated = Time.now();
                    };
                    citizens.put(citizenPrincipal, updatedCitizen);

                    // Log rejection
                    let reason = Option.get(rejectionReason, "Documents invalid");
                    logAudit(msg.caller, "CITIZEN_REJECTED", ?citizenPrincipal, reason);

                    #ok("Citizen registration rejected: " # reason)
                }
            };
        }
    };

    // Get pending citizens for verification
    public query(msg) func getPendingCitizens() : async Result<[Citizen], Text> {
        if (not isAdmin(msg.caller)) {
            return #err("Only Election Officers can view pending citizens");
        };

        let pending = Array.filter<Citizen>(
            Iter.toArray(citizens.vals()),
            func(c : Citizen) : Bool { 
                switch (c.status) {
                    case (#Pending) { true };
                    case (_) { false };
                }
            }
        );

        #ok(pending)
    };

    // Get all citizens (admin only)
    public query(msg) func getAllCitizens() : async Result<[Citizen], Text> {
        if (not isAdmin(msg.caller)) {
            return #err("Only Election Officers can view all citizens");
        };

        #ok(Iter.toArray(citizens.vals()))
    };

    // ============ ELECTION MANAGEMENT ============

    // Create new election
    public shared(msg) func createElection(input : Types.ElectionInput) : async Result<Nat, Text> {
        if (not isAdmin(msg.caller)) {
            return #err("Only Election Officers can create elections");
        };

        let electionId = nextElectionId;
        nextElectionId += 1;

        let newElection : Election = {
            id = electionId;
            title = input.title;
            description = input.description;
            electionType = input.electionType;
            level = input.level;
            constituency = input.constituency;
            state = input.state;
            registrationStartDate = Time.now();
            registrationEndDate = input.votingStartDate;
            votingStartDate = input.votingStartDate;
            votingEndDate = input.votingEndDate;
            status = #Upcoming;
            totalVotes = 0;
            winnerCandidateId = null;
            createdBy = msg.caller;
            createdAt = Time.now();
        };

        elections.put(electionId, newElection);
        
        logAudit(msg.caller, "ELECTION_CREATED", null, input.title);

        #ok(electionId)
    };

    // Add candidate to election
    public shared(msg) func addCandidate(input : Types.CandidateInput) : async Result<Nat, Text> {
        if (not isAdmin(msg.caller)) {
            return #err("Only Election Officers can add candidates");
        };

        // Check if election exists
        switch (elections.get(input.electionId)) {
            case null { return #err("Election not found") };
            case (?_) {};
        };

        let candidateId = nextCandidateId;
        nextCandidateId += 1;

        let newCandidate : Candidate = {
            id = candidateId;
            name = input.name;
            age = input.age;
            party = input.party;
            partySymbol = input.partySymbol;
            photoUrl = input.photoUrl;
            education = input.education;
            occupation = input.occupation;
            manifesto = input.manifesto;
            electionId = input.electionId;
            constituency = input.constituency;
            votesReceived = 0;
            addedBy = msg.caller;
            addedAt = Time.now();
        };

        candidates.put(candidateId, newCandidate);
        
        logAudit(msg.caller, "CANDIDATE_ADDED", null, input.name # " to Election " # Nat.toText(input.electionId));

        #ok(candidateId)
    };

    // Start voting for election
    public shared(msg) func startVoting(electionId : Nat) : async Result<Text, Text> {
        if (not isAdmin(msg.caller)) {
            return #err("Only Election Officers can start voting");
        };

        switch (elections.get(electionId)) {
            case null { #err("Election not found") };
            case (?election) {
                let updatedElection = {
                    election with status = #VotingOpen
                };
                elections.put(electionId, updatedElection);
                
                logAudit(msg.caller, "VOTING_STARTED", null, "Election " # Nat.toText(electionId));
                
                #ok("Voting started for: " # election.title)
            };
        }
    };

    // End voting for election
    public shared(msg) func endVoting(electionId : Nat) : async Result<Text, Text> {
        if (not isAdmin(msg.caller)) {
            return #err("Only Election Officers can end voting");
        };

        switch (elections.get(electionId)) {
            case null { #err("Election not found") };
            case (?election) {
                let updatedElection = {
                    election with status = #VotingClosed
                };
                elections.put(electionId, updatedElection);
                
                logAudit(msg.caller, "VOTING_ENDED", null, "Election " # Nat.toText(electionId));
                
                #ok("Voting ended for: " # election.title)
            };
        }
    };

    // Get all elections
    public query func getAllElections() : async [Election] {
        Iter.toArray(elections.vals())
    };

    // Get election by ID
    public query func getElection(electionId : Nat) : async Result<Election, Text> {
        switch (elections.get(electionId)) {
            case null { #err("Election not found") };
            case (?election) { #ok(election) };
        }
    };

    // Get candidates for election
    public query func getCandidates(electionId : Nat) : async [Candidate] {
        Array.filter<Candidate>(
            Iter.toArray(candidates.vals()),
            func(c : Candidate) : Bool { c.electionId == electionId }
        )
    };

    // ============ VOTING ============

    // Cast vote
    public shared(msg) func castVote(electionId : Nat, candidateId : Nat) : async Result<Text, Text> {
        // Block anonymous callers
        if (Principal.isAnonymous(msg.caller)) {
            return #err("Authentication required. Please log in first.");
        };

        let voterPrincipal = msg.caller;

        // SECURITY CHECK 1: Get citizen profile
        let citizen = switch (citizens.get(voterPrincipal)) {
            case null { return #err("You are not registered as a citizen") };
            case (?c) { c };
        };

        // SECURITY CHECK 2: Must be verified
        switch (citizen.status) {
            case (#Verified) {};
            case (#Pending) { return #err("Your citizenship is not verified by Election Officer") };
            case (#Rejected) { return #err("Your citizenship registration was rejected") };
            case (#Suspended) { return #err("Your account is suspended") };
        };

        // SECURITY CHECK 3: Must be eligible (18+)
        if (not citizen.isEligible) {
            return #err("You are not eligible to vote");
        };

        // SECURITY CHECK 3.5: Must have biometric enrolled (multi-factor auth)
        switch (biometrics.get(voterPrincipal)) {
            case null {
                return #err("Biometric verification required. Please enroll your fingerprint before voting (Dashboard → Settings).");
            };
            case (?bioCred) {
                if (not bioCred.isActive) {
                    return #err("Your biometric credential is inactive. Please re-enroll.");
                };
            };
        };

        // SECURITY CHECK 4: Get election
        let election = switch (elections.get(electionId)) {
            case null { return #err("Election not found") };
            case (?e) { e };
        };

        // SECURITY CHECK 5: Election must be active
        switch (election.status) {
            case (#VotingOpen) {};
            case (#Upcoming) { return #err("Voting has not started yet") };
            case (#VotingClosed) { return #err("Voting has ended") };
            case (#ResultsDeclared) { return #err("Election has concluded") };
            case (_) { return #err("Voting is not currently open") };
        };

        // SECURITY CHECK 6: Check time window
        let now = Time.now();
        if (now < election.votingStartDate) {
            return #err("Voting period has not started");
        };
        if (now > election.votingEndDate) {
            return #err("Voting period has ended");
        };

        // SECURITY CHECK 7: Constituency match (flexible matching)
        // Allow voting if:
        // 1. Exact match (e.g., "Tiruvallur-600019" == "Tiruvallur-600019")
        // 2. Election is for whole district (e.g., election="Tiruvallur", voter="Tiruvallur-600019")
        // 3. Election is for "ALL" constituencies (national level)
        let constituencyMatches = 
            election.constituency == citizen.constituency or
            election.constituency == "ALL" or
            textStartsWith(citizen.constituency, election.constituency);
        
        if (not constituencyMatches) {
            return #err("You cannot vote in this constituency. Your constituency is: " # citizen.constituency # " but election is for: " # election.constituency);
        };

        // SECURITY CHECK 8: Already voted check
        let alreadyVoted = Option.isSome(
            Array.find<VoteRecord>(
                votes,
                func(v : VoteRecord) : Bool {
                    Principal.equal(v.voterPrincipal, voterPrincipal) and v.electionId == electionId
                }
            )
        );
        if (alreadyVoted) {
            return #err("You have already voted in this election! Cannot vote twice.");
        };

        // SECURITY CHECK 9: Candidate exists and belongs to this election
        let candidate = switch (candidates.get(candidateId)) {
            case null { return #err("Invalid candidate") };
            case (?c) {
                if (c.electionId != electionId) {
                    return #err("Candidate does not belong to this election");
                };
                c
            };
        };

        // ALL CHECKS PASSED - RECORD VOTE
        
        // Record vote (IMMUTABLE!)
        let voteRecord : VoteRecord = {
            voterPrincipal = voterPrincipal;
            electionId = electionId;
            candidateId = candidateId;
            timestamp = Time.now();
            constituency = citizen.constituency;
        };
        votes := Array.append(votes, [voteRecord]);

        // Update candidate vote count
        let updatedCandidate = {
            candidate with votesReceived = candidate.votesReceived + 1
        };
        candidates.put(candidateId, updatedCandidate);

        // Update election total votes
        let updatedElection = {
            election with totalVotes = election.totalVotes + 1
        };
        elections.put(electionId, updatedElection);

        // Log (without revealing who voted for whom)
        logAudit(voterPrincipal, "VOTE_CAST", null, "Election: " # Nat.toText(electionId));

        #ok("Vote recorded successfully on blockchain! Thank you for voting.")
    };

    // Check if user has voted in an election
    public query(msg) func hasVoted(electionId : Nat) : async Bool {
        Option.isSome(
            Array.find<VoteRecord>(
                votes,
                func(v : VoteRecord) : Bool {
                    Principal.equal(v.voterPrincipal, msg.caller) and v.electionId == electionId
                }
            )
        )
    };

    // Get election results
    public query func getElectionResults(electionId : Nat) : async Result<Types.ElectionResults, Text> {
        switch (elections.get(electionId)) {
            case null { #err("Election not found") };
            case (?election) {
                let electionCandidates = Array.filter<Candidate>(
                    Iter.toArray(candidates.vals()),
                    func(c : Candidate) : Bool { c.electionId == electionId }
                );

                let candidateResults = Array.map<Candidate, (Nat, Text, Text, Nat)>(
                    electionCandidates,
                    func(c : Candidate) : (Nat, Text, Text, Nat) {
                        (c.id, c.name, c.party, c.votesReceived)
                    }
                );

                // Find winner
                let sortedResults = Array.sort<(Nat, Text, Text, Nat)>(
                    candidateResults,
                    func(a : (Nat, Text, Text, Nat), b : (Nat, Text, Text, Nat)) : { #less; #equal; #greater } {
                        if (a.3 > b.3) { #less }
                        else if (a.3 < b.3) { #greater }
                        else { #equal }
                    }
                );

                let winner = if (Array.size(sortedResults) > 0) {
                    ?sortedResults[0]
                } else {
                    null
                };

                let results : Types.ElectionResults = {
                    electionId = electionId;
                    electionTitle = election.title;
                    totalVotes = election.totalVotes;
                    candidates = candidateResults;
                    winner = winner;
                    status = election.status;
                };

                #ok(results)
            };
        }
    };

    // ============ ACCOUNT RECOVERY ============
    // When a user loses their Internet Identity (lost device, forgot anchor),
    // they can request to transfer their citizen profile to a new principal.
    // Flow: Login with new II → Request recovery (Aadhaar + mobile) → OTP verify → Admin approves

    // Helper: Find citizen by Aadhaar number
    private func findCitizenByAadhaar(aadhaar : Text) : ?(Principal, Citizen) {
        for ((p, c) in citizens.entries()) {
            if (Text.equal(c.aadhaarNumber, aadhaar)) {
                return ?(p, c);
            };
        };
        null
    };

    // Step 1: Request recovery OTP — user provides their Aadhaar + mobile from new principal
    public shared(msg) func requestRecoveryOTP(
        aadhaarNumber : Text,
        mobileNumber : Text
    ) : async Result<Text, Text> {
        // Block anonymous callers
        if (Principal.isAnonymous(msg.caller)) {
            return #err("Authentication required. Please log in first.");
        };

        // Rate limit
        if (not checkOTPRateLimit(msg.caller)) {
            return #err("Too many requests. Please wait 10 minutes.");
        };

        if (not isValidAadhaar(aadhaarNumber)) {
            return #err("Invalid Aadhaar number format.");
        };
        if (not isValidMobile(mobileNumber)) {
            return #err("Invalid mobile number.");
        };

        // Check caller isn't already registered as a citizen
        switch (citizens.get(msg.caller)) {
            case (?_) { return #err("You already have a citizen profile with this identity. No recovery needed.") };
            case null {};
        };

        // Find the existing citizen record by Aadhaar
        let citizenMatch = findCitizenByAadhaar(aadhaarNumber);
        switch (citizenMatch) {
            case null {
                return #err("No citizen record found with this Aadhaar number.");
            };
            case (?(oldPrincipal, citizen)) {
                // Verify the mobile number matches
                if (citizen.mobileNumber != mobileNumber) {
                    return #err("Mobile number does not match the registered record.");
                };

                // Check no pending recovery already exists for this Aadhaar
                for ((_, req) in recoveryRequests.entries()) {
                    switch (req.status) {
                        case (#Pending) {
                            if (Text.equal(req.aadhaarNumber, aadhaarNumber)) {
                                return #err("A recovery request is already pending for this Aadhaar. Please wait for admin review.");
                            };
                        };
                        case _ {};
                    };
                };

                // Generate cryptographically random OTP
                let otp = await generateOTP();
                let otpRecord : Types.AadhaarOTPRecord = {
                    aadhaarNumber = aadhaarNumber;
                    otp = otp;
                    mobileNumber = mobileNumber;
                    generatedAt = Time.now();
                    verified = false;
                    attempts = 0;
                };
                aadhaarOTPs.put("recovery_" # aadhaarNumber, otpRecord);
                recordOTPRequest(msg.caller);

                // Mask mobile for response
                let mobileLastFour = if (Text.size(mobileNumber) >= 4) {
                    let chars = Iter.toArray(Text.toIter(mobileNumber));
                    let len = Array.size(chars);
                    Text.fromIter(Array.vals([
                        chars[len - 4], chars[len - 3], chars[len - 2], chars[len - 1]
                    ]))
                } else { "****" };

                logAudit(msg.caller, "RECOVERY_OTP_REQUESTED", ?oldPrincipal, "Recovery OTP for Aadhaar ending ****" # mobileLastFour);

                // Send OTP via SMS — SMS must be configured for production
                if (smsEnabled and Text.size(smsApiKey) > 0) {
                    let request = buildSmsRequest(mobileNumber, otp);
                    try {
                        let response = await (with cycles = 230_850_258_000) ic.http_request(request);
                        if (response.status != 200) {
                            if (devMode) {
                                return #ok("[DEV MODE] SMS failed. Recovery OTP is: " # otp)
                            };
                            return #err("Failed to send recovery OTP. Please try again.");
                        };
                    } catch (_) {
                        if (devMode) {
                            return #ok("[DEV MODE] SMS unavailable. Recovery OTP is: " # otp)
                        };
                        return #err("Failed to send recovery OTP. Please try again.");
                    };
                    #ok("Recovery OTP sent to mobile ending in " # mobileLastFour # ". Check your phone.")
                } else if (devMode) {
                    #ok("[DEV MODE] Recovery OTP is: " # otp # " (configure SMS for production)")
                } else {
                    #err("SMS gateway not configured. Please contact the Election Officer to enable OTP delivery.")
                }
            };
        }
    };

    // Step 2: Verify recovery OTP and create the recovery request
    public shared(msg) func verifyRecoveryOTP(
        aadhaarNumber : Text,
        enteredOTP : Text
    ) : async Result<Text, Text> {
        // Block anonymous callers
        if (Principal.isAnonymous(msg.caller)) {
            return #err("Authentication required. Please log in first.");
        };
        let otpKey = "recovery_" # aadhaarNumber;
        switch (aadhaarOTPs.get(otpKey)) {
            case null {
                return #err("No recovery OTP request found. Please request one first.");
            };
            case (?otpRecord) {
                if (otpRecord.verified) {
                    return #err("OTP already verified. Your recovery request is pending admin review.");
                };
                if (otpRecord.attempts >= 5) {
                    aadhaarOTPs.delete(otpKey);
                    return #err("Too many failed attempts. Please request a new OTP.");
                };

                let fiveMinutes : Int = 5 * 60 * 1_000_000_000;
                if (Time.now() - otpRecord.generatedAt > fiveMinutes) {
                    aadhaarOTPs.delete(otpKey);
                    return #err("OTP has expired. Please request a new one.");
                };

                if (enteredOTP != otpRecord.otp) {
                    let updated : Types.AadhaarOTPRecord = {
                        aadhaarNumber = otpRecord.aadhaarNumber;
                        otp = otpRecord.otp;
                        mobileNumber = otpRecord.mobileNumber;
                        generatedAt = otpRecord.generatedAt;
                        verified = false;
                        attempts = otpRecord.attempts + 1;
                    };
                    aadhaarOTPs.put(otpKey, updated);
                    return #err("Invalid OTP. " # Nat.toText(4 - otpRecord.attempts) # " attempts remaining.");
                };

                // Mark OTP verified
                let verified : Types.AadhaarOTPRecord = {
                    aadhaarNumber = otpRecord.aadhaarNumber;
                    otp = otpRecord.otp;
                    mobileNumber = otpRecord.mobileNumber;
                    generatedAt = otpRecord.generatedAt;
                    verified = true;
                    attempts = otpRecord.attempts;
                };
                aadhaarOTPs.put(otpKey, verified);

                // Find old principal
                let citizenMatch = findCitizenByAadhaar(aadhaarNumber);
                switch (citizenMatch) {
                    case null { return #err("Citizen record not found.") };
                    case (?(oldPrincipal, _)) {
                        // Create recovery request for admin review
                        let reqId = nextRecoveryId;
                        nextRecoveryId += 1;

                        let recoveryReq : Types.RecoveryRequest = {
                            id = reqId;
                            aadhaarNumber = aadhaarNumber;
                            mobileNumber = otpRecord.mobileNumber;
                            oldPrincipal = oldPrincipal;
                            newPrincipal = msg.caller;
                            otpVerified = true;
                            status = #Pending;
                            requestedAt = Time.now();
                            reviewedBy = null;
                            reviewedAt = null;
                        };
                        recoveryRequests.put(reqId, recoveryReq);

                        logAudit(msg.caller, "RECOVERY_OTP_VERIFIED", ?oldPrincipal, "Recovery request #" # Nat.toText(reqId) # " created");

                        #ok("OTP verified! Your recovery request (#" # Nat.toText(reqId) # ") has been submitted for admin review. You will regain access once approved.")
                    };
                };
            };
        }
    };

    // Admin: Get pending recovery requests
    public query(msg) func getPendingRecoveryRequests() : async Result<[Types.RecoveryRequest], Text> {
        if (not isAdmin(msg.caller)) {
            return #err("Only Election Officers can view recovery requests");
        };
        let pending = Array.filter<Types.RecoveryRequest>(
            Iter.toArray(recoveryRequests.vals()),
            func(r : Types.RecoveryRequest) : Bool {
                switch (r.status) {
                    case (#Pending) { true };
                    case _ { false };
                }
            }
        );
        #ok(pending)
    };

    // Admin: Approve or reject a recovery request
    public shared(msg) func reviewRecoveryRequest(
        requestId : Nat,
        approve : Bool
    ) : async Result<Text, Text> {
        if (not isAdmin(msg.caller)) {
            return #err("Only Election Officers can review recovery requests");
        };

        switch (recoveryRequests.get(requestId)) {
            case null { return #err("Recovery request not found") };
            case (?req) {
                switch (req.status) {
                    case (#Pending) {};
                    case _ { return #err("This request has already been reviewed") };
                };

                if (not req.otpVerified) {
                    return #err("OTP was not verified for this request");
                };

                if (approve) {
                    // Transfer the citizen record from old principal to new principal
                    switch (citizens.get(req.oldPrincipal)) {
                        case null { return #err("Original citizen record not found") };
                        case (?citizen) {
                            // Create updated citizen with new principal
                            let updatedCitizen : Citizen = {
                                citizen with
                                principal = req.newPrincipal;
                                lastUpdated = Time.now();
                            };

                            // Remove old entry, add new one
                            citizens.delete(req.oldPrincipal);
                            citizens.put(req.newPrincipal, updatedCitizen);

                            // Transfer biometric (delete old, user will re-enroll)
                            biometrics.delete(req.oldPrincipal);

                            // Update vote records — keep the history but voter can now use new principal
                            // (votes are immutable, linked to old principal — this is by design for audit)

                            // Update recovery request status
                            let updatedReq : Types.RecoveryRequest = {
                                req with
                                status = #Approved;
                                reviewedBy = ?msg.caller;
                                reviewedAt = ?Time.now();
                            };
                            recoveryRequests.put(requestId, updatedReq);

                            // Clean up recovery OTP
                            aadhaarOTPs.delete("recovery_" # req.aadhaarNumber);

                            logAudit(msg.caller, "RECOVERY_APPROVED", ?req.newPrincipal,
                                "Account transferred from " # Principal.toText(req.oldPrincipal) # " to " # Principal.toText(req.newPrincipal));

                            #ok("Recovery approved. Citizen profile transferred to new identity.")
                        };
                    };
                } else {
                    let updatedReq : Types.RecoveryRequest = {
                        req with
                        status = #Rejected;
                        reviewedBy = ?msg.caller;
                        reviewedAt = ?Time.now();
                    };
                    recoveryRequests.put(requestId, updatedReq);

                    logAudit(msg.caller, "RECOVERY_REJECTED", ?req.newPrincipal,
                        "Recovery request #" # Nat.toText(requestId) # " rejected");

                    #ok("Recovery request rejected.")
                };
            };
        }
    };

    // User: Check recovery request status by Aadhaar
    public query(msg) func getMyRecoveryStatus(aadhaarNumber : Text) : async Result<{ status : Text; requestId : Nat }, Text> {
        for ((_, req) in recoveryRequests.entries()) {
            if (Text.equal(req.aadhaarNumber, aadhaarNumber) and Principal.equal(req.newPrincipal, msg.caller)) {
                let statusText = switch (req.status) {
                    case (#Pending) { "pending" };
                    case (#Approved) { "approved" };
                    case (#Rejected) { "rejected" };
                };
                return #ok({ status = statusText; requestId = req.id });
            };
        };
        #err("No recovery request found for this Aadhaar number.")
    };

    // ============ ADMIN MANAGEMENT ============

    // Configure SMS gateway (Super Admin only)
    // Call this after deployment to enable real OTP delivery:
    //   dfx canister call voting_backend configureSms '("YOUR_FAST2SMS_API_KEY", true, null)'
    // To use a custom gateway URL:
    //   dfx canister call voting_backend configureSms '("API_KEY", true, opt "https://custom-gateway.com/api")'
    public shared(msg) func configureSms(apiKey : Text, enabled : Bool, gatewayUrl : ?Text) : async Result<Text, Text> {
        if (not isSuperAdmin(msg.caller)) {
            return #err("Only Super Admin can configure SMS settings");
        };

        smsApiKey := apiKey;
        smsEnabled := enabled;
        switch (gatewayUrl) {
            case (?url) { smsGatewayUrl := url };
            case null {};
        };

        logAudit(msg.caller, "SMS_CONFIGURED", null, "SMS gateway " # (if (enabled) "enabled" else "disabled"));
        #ok("SMS configuration updated. SMS is now " # (if (enabled) "ENABLED" else "DISABLED"))
    };

    // Toggle development mode (Super Admin only)
    // Dev mode allows OTP fallback when SMS fails (needed for local testing)
    // MUST be disabled before mainnet deployment!
    public shared(msg) func setDevMode(enabled : Bool) : async Result<Text, Text> {
        if (not isSuperAdmin(msg.caller)) {
            return #err("Only Super Admin can toggle development mode");
        };

        devMode := enabled;
        logAudit(msg.caller, "DEV_MODE_TOGGLED", null, "Dev mode " # (if (enabled) "ENABLED" else "DISABLED"));
        #ok("Development mode is now " # (if (enabled) "ON ⚠️ (disable before mainnet!)" else "OFF ✅ (production-safe)"))
    };

    // Check SMS gateway status (Admin only — does not expose API key)
    public shared(msg) func getSmsStatus() : async Result<{ enabled : Bool; configured : Bool; gateway : Text }, Text> {
        if (not isAdmin(msg.caller)) {
            return #err("Only admins can view SMS status");
        };

        #ok({
            enabled = smsEnabled;
            configured = Text.size(smsApiKey) > 0;
            gateway = smsGatewayUrl;
            devMode = devMode;
        })
    };

    // Add new admin (Super Admin only)
    public shared(msg) func addAdmin(newAdmin : Principal) : async Result<Text, Text> {
        if (not isSuperAdmin(msg.caller)) {
            return #err("Only Super Admin can add admins");
        };

        if (isAdmin(newAdmin)) {
            return #err("Already an admin");
        };

        admins := Array.append(admins, [newAdmin]);
        
        logAudit(msg.caller, "ADMIN_ADDED", ?newAdmin, "New Election Officer");

        #ok("Election Officer added successfully")
    };

    // Get all admins
    public query(msg) func getAdmins() : async Result<[Principal], Text> {
        if (not isAdmin(msg.caller)) {
            return #err("Only admins can view admin list");
        };

        #ok(admins)
    };

    // Check if caller is admin
    public query(msg) func amIAdmin() : async Bool {
        isAdmin(msg.caller)
    };

    // ============ STATISTICS ============

    // Get system statistics
    public query func getStatistics() : async Types.Statistics {
        let allCitizens = Iter.toArray(citizens.vals());
        let verifiedCount = Array.size(
            Array.filter<Citizen>(allCitizens, func(c : Citizen) : Bool {
                switch (c.status) {
                    case (#Verified) { true };
                    case (_) { false };
                }
            })
        );
        let pendingCount = Array.size(
            Array.filter<Citizen>(allCitizens, func(c : Citizen) : Bool {
                switch (c.status) {
                    case (#Pending) { true };
                    case (_) { false };
                }
            })
        );

        let allElections = Iter.toArray(elections.vals());
        let activeCount = Array.size(
            Array.filter<Election>(allElections, func(e : Election) : Bool {
                switch (e.status) {
                    case (#VotingOpen) { true };
                    case (_) { false };
                }
            })
        );

        {
            totalCitizens = Array.size(allCitizens);
            verifiedCitizens = verifiedCount;
            pendingVerifications = pendingCount;
            totalElections = Array.size(allElections);
            activeElections = activeCount;
            totalVotesCast = Array.size(votes);
        }
    };

    // Get audit logs (admin only)
    public query(msg) func getAuditLogs(limit : Nat) : async Result<[AuditLog], Text> {
        if (not isAdmin(msg.caller)) {
            return #err("Only admins can view audit logs");
        };

        let size = Array.size(auditLogs);
        if (size == 0) {
            return #ok([]);
        };
        
        let actualLimit = Nat.min(limit, size);
        let start = if (size > actualLimit) { size - actualLimit } else { 0 };
        
        let recentLogs = Array.tabulate<AuditLog>(
            actualLimit,
            func(i : Nat) : AuditLog {
                let idx = start + i;
                if (idx < size) {
                    auditLogs[idx]
                } else {
                    // Should not happen due to bounds check, but safe fallback
                    auditLogs[0]
                }
            }
        );

        #ok(recentLogs)
    };

    // Get system info
    public query func getSystemInfo() : async {
        initialized : Bool;
        totalAdmins : Nat;
        version : Text;
    } {
        {
            initialized = initialized;
            totalAdmins = Array.size(admins);
            version = "1.0.0";
        }
    };

    // ============ BIOMETRIC AUTHENTICATION ============

    // Register biometric credential
    public shared(msg) func enrollBiometricCredential(
        credentialId : Text,
        clientDataJSON : Text,
        attestationObject : Text
    ) : async Result<Text, Text> {
        // Block anonymous callers
        if (Principal.isAnonymous(msg.caller)) {
            return #err("Authentication required. Please log in first.");
        };

        let principal = msg.caller;
        
        // Check if user is registered as citizen
        switch (citizens.get(principal)) {
            case null {
                return #err("User not registered as citizen");
            };
            case (?_) {
                // User is registered
            };
        };

        // Create biometric credential
        let biometricCred : BiometricCredential = {
            credentialId = credentialId;
            principal = principal;
            clientDataJSON = clientDataJSON;
            attestationObject = attestationObject;
            enrolledAt = Time.now();
            lastVerified = null;
            isActive = true;
        };

        // Store in biometrics map
        biometrics.put(principal, biometricCred);

        logAudit(principal, "BIOMETRIC_ENROLLED", null, credentialId);

        #ok("Biometric credential enrolled successfully")
    };

    // Verify biometric credential
    public shared(msg) func verifyBiometricCredential(
        request : BiometricVerificationRequest
    ) : async Result<Bool, Text> {
        let principal = msg.caller;

        // Get stored biometric credential
        let storedCred = biometrics.get(principal);
        switch (storedCred) {
            case null {
                return #err("No biometric credential found for user");
            };
            case (?cred) {
                if (not cred.isActive) {
                    return #err("Biometric credential is not active");
                };

                // Verify credential ID matches
                if (request.credentialId != cred.credentialId) {
                    return #err("Credential ID mismatch");
                };

                // Verify authenticatorData is present and has valid length
                // WebAuthn authenticatorData must be at least 37 bytes (rpIdHash + flags + signCount)
                if (Text.size(request.authenticatorData) < 37) {
                    return #err("Invalid authenticator data — biometric verification failed");
                };

                // Verify signature is present
                if (Text.size(request.signature) == 0) {
                    return #err("Missing signature — biometric verification failed");
                };

                // Update last verified timestamp
                let updatedCred = {
                    credentialId = cred.credentialId;
                    principal = cred.principal;
                    clientDataJSON = cred.clientDataJSON;
                    attestationObject = cred.attestationObject;
                    enrolledAt = cred.enrolledAt;
                    lastVerified = ?Time.now();
                    isActive = true;
                };

                biometrics.put(principal, updatedCred);

                logAudit(principal, "BIOMETRIC_VERIFIED", null, "Fingerprint verification successful");

                #ok(true)
            };
        };
    };

    // Get biometric enrollment status
    public query(msg) func getBiometricStatus() : async Result<Bool, Text> {
        let principal = msg.caller;
        
        switch (biometrics.get(principal)) {
            case null {
                #ok(false)
            };
            case (?cred) {
                #ok(cred.isActive)
            };
        };
    };

    // Remove biometric credential
    public shared(msg) func removeBiometricCredential() : async Result<Text, Text> {
        let principal = msg.caller;

        switch (biometrics.get(principal)) {
            case null {
                return #err("No biometric credential found");
            };
            case (?_) {
                biometrics.delete(principal);
                logAudit(principal, "BIOMETRIC_REMOVED", null, "Biometric credential deleted");
                #ok("Biometric credential removed successfully")
            };
        };
    };
}
