import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AddressInfo {
  'city' : string,
  'line1' : string,
  'line2' : string,
  'district' : string,
  'state' : string,
  'pincode' : string,
}
export interface AuditLog {
  'action' : string,
  'target' : [] | [Principal],
  'timestamp' : Time,
  'details' : string,
  'actorPrincipal' : Principal,
}
export interface BiometricVerificationRequest {
  'signature' : string,
  'clientDataJSON' : string,
  'authenticatorData' : string,
  'credentialId' : string,
}
export interface Candidate {
  'id' : bigint,
  'age' : bigint,
  'occupation' : string,
  'name' : string,
  'education' : string,
  'manifesto' : string,
  'photoUrl' : string,
  'votesReceived' : bigint,
  'addedAt' : Time,
  'addedBy' : Principal,
  'electionId' : bigint,
  'constituency' : string,
  'party' : string,
  'partySymbol' : string,
}
export interface CandidateInput {
  'age' : bigint,
  'occupation' : string,
  'name' : string,
  'education' : string,
  'manifesto' : string,
  'photoUrl' : string,
  'electionId' : bigint,
  'constituency' : string,
  'party' : string,
  'partySymbol' : string,
}
export interface Citizen {
  'age' : bigint,
  'status' : VoterStatus,
  'aadhaarPhotoUrl' : string,
  'principal' : Principal,
  'isEligible' : boolean,
  'dateOfBirth' : string,
  'voterIdNumber' : string,
  'city' : string,
  'lastUpdated' : Time,
  'fullName' : string,
  'mobileNumber' : string,
  'photoUrl' : string,
  'email' : [] | [string],
  'district' : string,
  'voterIdPhotoUrl' : [] | [string],
  'state' : string,
  'addressLine1' : string,
  'addressLine2' : string,
  'gender' : Gender,
  'constituency' : string,
  'aadhaarNumber' : string,
  'pincode' : string,
  'registrationTime' : Time,
  'verifiedAt' : [] | [Time],
  'verifiedBy' : [] | [Principal],
}
export interface Election {
  'id' : bigint,
  'votingStartDate' : Time,
  'status' : ElectionStatus,
  'title' : string,
  'registrationEndDate' : Time,
  'totalVotes' : bigint,
  'createdAt' : Time,
  'createdBy' : Principal,
  'description' : string,
  'level' : ElectionLevel,
  'state' : [] | [string],
  'votingEndDate' : Time,
  'electionType' : ElectionType,
  'constituency' : string,
  'winnerCandidateId' : [] | [bigint],
  'registrationStartDate' : Time,
}
export interface ElectionInput {
  'votingStartDate' : Time,
  'title' : string,
  'description' : string,
  'level' : ElectionLevel,
  'state' : [] | [string],
  'votingEndDate' : Time,
  'electionType' : ElectionType,
  'constituency' : string,
}
export type ElectionLevel = { 'State' : null } |
  { 'National' : null } |
  { 'District' : null } |
  { 'Village' : null } |
  { 'Municipal' : null };
export interface ElectionResults {
  'status' : ElectionStatus,
  'electionTitle' : string,
  'totalVotes' : bigint,
  'winner' : [] | [[bigint, string, string, bigint]],
  'electionId' : bigint,
  'candidates' : Array<[bigint, string, string, bigint]>,
}
export type ElectionStatus = { 'VotingClosed' : null } |
  { 'VotingOpen' : null } |
  { 'RegistrationClosed' : null } |
  { 'Cancelled' : null } |
  { 'ResultsDeclared' : null } |
  { 'RegistrationOpen' : null } |
  { 'Upcoming' : null };
export type ElectionType = { 'Referendum' : null } |
  { 'General' : null } |
  { 'LocalBody' : null } |
  { 'ByElection' : null };
export type Gender = { 'Male' : null } |
  { 'Female' : null } |
  { 'Other' : null };
export type Result = { 'ok' : string } |
  { 'err' : string };
export type Result_1 = { 'ok' : boolean } |
  { 'err' : string };
export type Result_2 = { 'ok' : Array<Citizen> } |
  { 'err' : string };
export type Result_3 = { 'ok' : Citizen } |
  { 'err' : string };
export type Result_4 = { 'ok' : ElectionResults } |
  { 'err' : string };
export type Result_5 = { 'ok' : Election } |
  { 'err' : string };
export type Result_6 = { 'ok' : Array<AuditLog> } |
  { 'err' : string };
export type Result_7 = { 'ok' : Array<Principal> } |
  { 'err' : string };
export type Result_8 = { 'ok' : bigint } |
  { 'err' : string };
export interface Statistics {
  'totalElections' : bigint,
  'verifiedCitizens' : bigint,
  'totalVotesCast' : bigint,
  'totalCitizens' : bigint,
  'activeElections' : bigint,
  'pendingVerifications' : bigint,
}
export type Time = bigint;
export type VoterStatus = { 'Suspended' : null } |
  { 'Rejected' : null } |
  { 'Verified' : null } |
  { 'Pending' : null };
export interface _SERVICE {
  'addAdmin' : ActorMethod<[Principal], Result>,
  'addAdminByInitializer' : ActorMethod<[Principal], Result>,
  'addCandidate' : ActorMethod<[CandidateInput], Result_8>,
  'amIAdmin' : ActorMethod<[], boolean>,
  'castVote' : ActorMethod<[bigint, bigint], Result>,
  'createElection' : ActorMethod<[ElectionInput], Result_8>,
  'endVoting' : ActorMethod<[bigint], Result>,
  'enrollBiometricCredential' : ActorMethod<[string, string, string], Result>,
  'getAdmins' : ActorMethod<[], Result_7>,
  'getAllCitizens' : ActorMethod<[], Result_2>,
  'getAllElections' : ActorMethod<[], Array<Election>>,
  'getAuditLogs' : ActorMethod<[bigint], Result_6>,
  'getBiometricStatus' : ActorMethod<[], Result_1>,
  'getCandidates' : ActorMethod<[bigint], Array<Candidate>>,
  'getElection' : ActorMethod<[bigint], Result_5>,
  'getElectionResults' : ActorMethod<[bigint], Result_4>,
  'getMyCitizenProfile' : ActorMethod<[], Result_3>,
  'getPendingCitizens' : ActorMethod<[], Result_2>,
  'getStatistics' : ActorMethod<[], Statistics>,
  'getSystemInfo' : ActorMethod<
    [],
    { 'initialized' : boolean, 'totalAdmins' : bigint, 'version' : string }
  >,
  'hasVoted' : ActorMethod<[bigint], boolean>,
  'initialize' : ActorMethod<[], Result>,
  'registerCitizen' : ActorMethod<
    [
      string,
      string,
      string,
      string,
      AddressInfo,
      Gender,
      string,
      string,
      string,
    ],
    Result
  >,
  'removeBiometricCredential' : ActorMethod<[], Result>,
  'requestAadhaarOTP' : ActorMethod<[string, string], Result>,
  'startVoting' : ActorMethod<[bigint], Result>,
  'verifyAadhaarOTP' : ActorMethod<[string, string], Result>,
  'verifyBiometricCredential' : ActorMethod<
    [BiometricVerificationRequest],
    Result_1
  >,
  'verifyCitizen' : ActorMethod<
    [Principal, boolean, [] | [string], [] | [string]],
    Result
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
