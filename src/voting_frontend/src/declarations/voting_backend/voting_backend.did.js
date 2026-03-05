export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const CandidateInput = IDL.Record({
    'age' : IDL.Nat,
    'occupation' : IDL.Text,
    'name' : IDL.Text,
    'education' : IDL.Text,
    'manifesto' : IDL.Text,
    'photoUrl' : IDL.Text,
    'electionId' : IDL.Nat,
    'constituency' : IDL.Text,
    'party' : IDL.Text,
    'partySymbol' : IDL.Text,
  });
  const Result_8 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Time = IDL.Int;
  const ElectionLevel = IDL.Variant({
    'State' : IDL.Null,
    'National' : IDL.Null,
    'District' : IDL.Null,
    'Village' : IDL.Null,
    'Municipal' : IDL.Null,
  });
  const ElectionType = IDL.Variant({
    'Referendum' : IDL.Null,
    'General' : IDL.Null,
    'LocalBody' : IDL.Null,
    'ByElection' : IDL.Null,
  });
  const ElectionInput = IDL.Record({
    'votingStartDate' : Time,
    'title' : IDL.Text,
    'description' : IDL.Text,
    'level' : ElectionLevel,
    'state' : IDL.Opt(IDL.Text),
    'votingEndDate' : Time,
    'electionType' : ElectionType,
    'constituency' : IDL.Text,
  });
  const Result_7 = IDL.Variant({
    'ok' : IDL.Vec(IDL.Principal),
    'err' : IDL.Text,
  });
  const VoterStatus = IDL.Variant({
    'Suspended' : IDL.Null,
    'Rejected' : IDL.Null,
    'Verified' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const Gender = IDL.Variant({
    'Male' : IDL.Null,
    'Female' : IDL.Null,
    'Other' : IDL.Null,
  });
  const Citizen = IDL.Record({
    'age' : IDL.Nat,
    'status' : VoterStatus,
    'aadhaarPhotoUrl' : IDL.Text,
    'principal' : IDL.Principal,
    'isEligible' : IDL.Bool,
    'dateOfBirth' : IDL.Text,
    'voterIdNumber' : IDL.Text,
    'city' : IDL.Text,
    'lastUpdated' : Time,
    'fullName' : IDL.Text,
    'mobileNumber' : IDL.Text,
    'photoUrl' : IDL.Text,
    'email' : IDL.Opt(IDL.Text),
    'district' : IDL.Text,
    'voterIdPhotoUrl' : IDL.Opt(IDL.Text),
    'state' : IDL.Text,
    'addressLine1' : IDL.Text,
    'addressLine2' : IDL.Text,
    'gender' : Gender,
    'constituency' : IDL.Text,
    'aadhaarNumber' : IDL.Text,
    'pincode' : IDL.Text,
    'registrationTime' : Time,
    'verifiedAt' : IDL.Opt(Time),
    'verifiedBy' : IDL.Opt(IDL.Principal),
  });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Vec(Citizen), 'err' : IDL.Text });
  const ElectionStatus = IDL.Variant({
    'VotingClosed' : IDL.Null,
    'VotingOpen' : IDL.Null,
    'RegistrationClosed' : IDL.Null,
    'Cancelled' : IDL.Null,
    'ResultsDeclared' : IDL.Null,
    'RegistrationOpen' : IDL.Null,
    'Upcoming' : IDL.Null,
  });
  const Election = IDL.Record({
    'id' : IDL.Nat,
    'votingStartDate' : Time,
    'status' : ElectionStatus,
    'title' : IDL.Text,
    'registrationEndDate' : Time,
    'totalVotes' : IDL.Nat,
    'createdAt' : Time,
    'createdBy' : IDL.Principal,
    'description' : IDL.Text,
    'level' : ElectionLevel,
    'state' : IDL.Opt(IDL.Text),
    'votingEndDate' : Time,
    'electionType' : ElectionType,
    'constituency' : IDL.Text,
    'winnerCandidateId' : IDL.Opt(IDL.Nat),
    'registrationStartDate' : Time,
  });
  const AuditLog = IDL.Record({
    'action' : IDL.Text,
    'target' : IDL.Opt(IDL.Principal),
    'timestamp' : Time,
    'details' : IDL.Text,
    'actorPrincipal' : IDL.Principal,
  });
  const Result_6 = IDL.Variant({ 'ok' : IDL.Vec(AuditLog), 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Bool, 'err' : IDL.Text });
  const Candidate = IDL.Record({
    'id' : IDL.Nat,
    'age' : IDL.Nat,
    'occupation' : IDL.Text,
    'name' : IDL.Text,
    'education' : IDL.Text,
    'manifesto' : IDL.Text,
    'photoUrl' : IDL.Text,
    'votesReceived' : IDL.Nat,
    'addedAt' : Time,
    'addedBy' : IDL.Principal,
    'electionId' : IDL.Nat,
    'constituency' : IDL.Text,
    'party' : IDL.Text,
    'partySymbol' : IDL.Text,
  });
  const Result_5 = IDL.Variant({ 'ok' : Election, 'err' : IDL.Text });
  const ElectionResults = IDL.Record({
    'status' : ElectionStatus,
    'electionTitle' : IDL.Text,
    'totalVotes' : IDL.Nat,
    'winner' : IDL.Opt(IDL.Tuple(IDL.Nat, IDL.Text, IDL.Text, IDL.Nat)),
    'electionId' : IDL.Nat,
    'candidates' : IDL.Vec(IDL.Tuple(IDL.Nat, IDL.Text, IDL.Text, IDL.Nat)),
  });
  const Result_4 = IDL.Variant({ 'ok' : ElectionResults, 'err' : IDL.Text });
  const Result_3 = IDL.Variant({ 'ok' : Citizen, 'err' : IDL.Text });
  const Statistics = IDL.Record({
    'totalElections' : IDL.Nat,
    'verifiedCitizens' : IDL.Nat,
    'totalVotesCast' : IDL.Nat,
    'totalCitizens' : IDL.Nat,
    'activeElections' : IDL.Nat,
    'pendingVerifications' : IDL.Nat,
  });
  const AddressInfo = IDL.Record({
    'city' : IDL.Text,
    'line1' : IDL.Text,
    'line2' : IDL.Text,
    'district' : IDL.Text,
    'state' : IDL.Text,
    'pincode' : IDL.Text,
  });
  const BiometricVerificationRequest = IDL.Record({
    'signature' : IDL.Text,
    'clientDataJSON' : IDL.Text,
    'authenticatorData' : IDL.Text,
    'credentialId' : IDL.Text,
  });
  return IDL.Service({
    'addAdmin' : IDL.Func([IDL.Principal], [Result], []),
    'addAdminByInitializer' : IDL.Func([IDL.Principal], [Result], []),
    'addCandidate' : IDL.Func([CandidateInput], [Result_8], []),
    'amIAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'castVote' : IDL.Func([IDL.Nat, IDL.Nat], [Result], []),
    'createElection' : IDL.Func([ElectionInput], [Result_8], []),
    'endVoting' : IDL.Func([IDL.Nat], [Result], []),
    'enrollBiometricCredential' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [Result],
        [],
      ),
    'getAdmins' : IDL.Func([], [Result_7], ['query']),
    'getAllCitizens' : IDL.Func([], [Result_2], ['query']),
    'getAllElections' : IDL.Func([], [IDL.Vec(Election)], ['query']),
    'getAuditLogs' : IDL.Func([IDL.Nat], [Result_6], ['query']),
    'getBiometricStatus' : IDL.Func([], [Result_1], ['query']),
    'getCandidates' : IDL.Func([IDL.Nat], [IDL.Vec(Candidate)], ['query']),
    'getElection' : IDL.Func([IDL.Nat], [Result_5], ['query']),
    'getElectionResults' : IDL.Func([IDL.Nat], [Result_4], ['query']),
    'getMyCitizenProfile' : IDL.Func([], [Result_3], ['query']),
    'getPendingCitizens' : IDL.Func([], [Result_2], ['query']),
    'getStatistics' : IDL.Func([], [Statistics], ['query']),
    'getSystemInfo' : IDL.Func(
        [],
        [
          IDL.Record({
            'initialized' : IDL.Bool,
            'totalAdmins' : IDL.Nat,
            'version' : IDL.Text,
          }),
        ],
        ['query'],
      ),
    'hasVoted' : IDL.Func([IDL.Nat], [IDL.Bool], ['query']),
    'initialize' : IDL.Func([], [Result], []),
    'registerCitizen' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          AddressInfo,
          Gender,
          IDL.Text,
          IDL.Text,
          IDL.Text,
        ],
        [Result],
        [],
      ),
    'removeBiometricCredential' : IDL.Func([], [Result], []),
    'requestAadhaarOTP' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'startVoting' : IDL.Func([IDL.Nat], [Result], []),
    'verifyAadhaarOTP' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'verifyBiometricCredential' : IDL.Func(
        [BiometricVerificationRequest],
        [Result_1],
        [],
      ),
    'verifyCitizen' : IDL.Func(
        [IDL.Principal, IDL.Bool, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
