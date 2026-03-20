import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";

module {
    // Gender types
    public type Gender = {
        #Male;
        #Female;
        #Other;
    };

    // Voter status types
    public type VoterStatus = {
        #Pending;      // Registered, awaiting verification
        #Verified;     // Verified by election officer, can vote
        #Rejected;     // Documents invalid/incomplete
        #Suspended;    // Account suspended
    };

    // Election types
    public type ElectionType = {
        #General;      // Regular elections
        #ByElection;   // Fill vacant seat
        #Referendum;   // Yes/No vote
        #LocalBody;    // Municipal/Panchayat
    };

    // Election level
    public type ElectionLevel = {
        #National;     // Parliament
        #State;        // Legislative Assembly
        #District;     // District Council
        #Municipal;    // City/Town
        #Village;      // Panchayat
    };

    // Election status
    public type ElectionStatus = {
        #Upcoming;          // Not started yet
        #RegistrationOpen;  // Voters can register
        #RegistrationClosed;
        #VotingOpen;        // Active voting period
        #VotingClosed;      // Ended, counting in progress
        #ResultsDeclared;   // Winner announced
        #Cancelled;         // Cancelled by authorities
    };

    // Address information
    public type AddressInfo = {
        line1 : Text;
        line2 : Text;
        city : Text;
        district : Text;
        state : Text;
        pincode : Text;
    };

    // Citizen/Voter profile
    public type Citizen = {
        principal : Principal;
        fullName : Text;
        dateOfBirth : Text;
        age : Nat;
        gender : Gender;
        
        // Government ID
        aadhaarNumber : Text;
        voterIdNumber : Text;
        
        // Address
        addressLine1 : Text;
        addressLine2 : Text;
        city : Text;
        district : Text;
        state : Text;
        pincode : Text;
        constituency : Text;
        
        // Contact
        mobileNumber : Text;
        email : ?Text;
        
        // Documents
        aadhaarPhotoUrl : Text;
        voterIdPhotoUrl : ?Text;
        photoUrl : Text;
        
        // Verification
        status : VoterStatus;
        isEligible : Bool;
        
        // Audit
        registrationTime : Time.Time;
        verifiedBy : ?Principal;
        verifiedAt : ?Time.Time;
        lastUpdated : Time.Time;
    };

    // Candidate information
    public type Candidate = {
        id : Nat;
        name : Text;
        age : Nat;
        party : Text;
        partySymbol : Text;
        photoUrl : Text;
        
        // Background
        education : Text;
        occupation : Text;
        
        // Campaign
        manifesto : Text;
        
        // Election specific
        electionId : Nat;
        constituency : Text;
        
        // Results
        votesReceived : Nat;
        
        // Metadata
        addedBy : Principal;
        addedAt : Time.Time;
    };

    // Election information
    public type Election = {
        id : Nat;
        title : Text;
        description : Text;
        electionType : ElectionType;
        level : ElectionLevel;
        
        // Geographic scope
        constituency : Text;
        state : ?Text;
        
        // Timeline
        registrationStartDate : Time.Time;
        registrationEndDate : Time.Time;
        votingStartDate : Time.Time;
        votingEndDate : Time.Time;
        
        // Status
        status : ElectionStatus;
        
        // Results
        totalVotes : Nat;
        winnerCandidateId : ?Nat;
        
        // Admin
        createdBy : Principal;
        createdAt : Time.Time;
    };

    // Vote record (minimal info for privacy)
    public type VoteRecord = {
        voterPrincipal : Principal;
        electionId : Nat;
        candidateId : Nat;
        timestamp : Time.Time;
        constituency : Text;
    };

    // Audit log entry
    public type AuditLog = {
        timestamp : Time.Time;
        actorPrincipal : Principal;
        action : Text;
        target : ?Principal;
        details : Text;
    };

    // Role types
    public type Role = {
        #SuperAdmin;      // Can add/remove admins
        #ElectionOfficer; // Can verify voters, manage elections
        #Citizen;         // Can vote
    };

    // Result types
    public type Result<T, E> = {
        #ok : T;
        #err : E;
    };

    // Citizen registration input
    public type CitizenRegistrationInput = {
        fullName : Text;
        dateOfBirth : Text;
        aadhaarNumber : Text;
        mobileNumber : Text;
        address : AddressInfo;
        gender : Gender;
        aadhaarPhotoUrl : Text;
        photoUrl : Text;
    };

    // Election creation input
    public type ElectionInput = {
        title : Text;
        description : Text;
        electionType : ElectionType;
        level : ElectionLevel;
        constituency : Text;
        state : ?Text;
        votingStartDate : Time.Time;
        votingEndDate : Time.Time;
    };

    // Candidate input
    public type CandidateInput = {
        name : Text;
        age : Nat;
        party : Text;
        partySymbol : Text;
        photoUrl : Text;
        education : Text;
        occupation : Text;
        manifesto : Text;
        electionId : Nat;
        constituency : Text;
    };

    // Election results
    public type ElectionResults = {
        electionId : Nat;
        electionTitle : Text;
        totalVotes : Nat;
        candidates : [(Nat, Text, Text, Nat)]; // (id, name, party, votes)
        winner : ?(Nat, Text, Text, Nat);
        status : ElectionStatus;
    };

    // Statistics
    public type Statistics = {
        totalCitizens : Nat;
        verifiedCitizens : Nat;
        pendingVerifications : Nat;
        totalElections : Nat;
        activeElections : Nat;
        totalVotesCast : Nat;
    };

    // Biometric credential storage
    public type BiometricCredential = {
        credentialId : Text;
        principal : Principal;
        clientDataJSON : Text;
        attestationObject : Text;
        enrolledAt : Time.Time;
        lastVerified : ?Time.Time;
        isActive : Bool;
    };

    // Biometric verification request
    public type BiometricVerificationRequest = {
        credentialId : Text;
        clientDataJSON : Text;
        authenticatorData : Text;
        signature : Text;
    };

    // Aadhaar OTP verification record
    public type AadhaarOTPRecord = {
        aadhaarNumber : Text;
        otp : Text;
        mobileNumber : Text;
        generatedAt : Time.Time;
        verified : Bool;
        attempts : Nat;
    };

    // ============ ACCOUNT RECOVERY ============

    public type RecoveryStatus = {
        #Pending;    // Waiting for admin review
        #Approved;   // Admin approved the transfer
        #Rejected;   // Admin rejected the request
    };

    public type RecoveryRequest = {
        id : Nat;
        aadhaarNumber : Text;
        mobileNumber : Text;
        oldPrincipal : Principal;     // The original principal on the citizen record
        newPrincipal : Principal;     // The new principal requesting recovery
        otpVerified : Bool;
        status : RecoveryStatus;
        requestedAt : Time.Time;
        reviewedBy : ?Principal;
        reviewedAt : ?Time.Time;
    };

    // ============ HTTP OUTCALL TYPES (for SMS via IC HTTPS outcalls) ============

    public type HttpHeader = {
        name : Text;
        value : Text;
    };

    public type HttpMethod = {
        #get;
        #post;
        #head;
    };

    public type HttpResponsePayload = {
        status : Nat;
        headers : [HttpHeader];
        body : Blob;
    };

    public type TransformArgs = {
        response : HttpResponsePayload;
        context : Blob;
    };

    public type TransformContext = {
        function : shared query TransformArgs -> async HttpResponsePayload;
        context : Blob;
    };

    public type HttpRequestArgs = {
        url : Text;
        max_response_bytes : ?Nat64;
        headers : [HttpHeader];
        body : ?Blob;
        method : HttpMethod;
        transform : ?TransformContext;
    };
}
