const { IDL } = require('@dfinity/candid');
try {
  IDL.Nat.encodeValue(1);
  console.log("Success with Number");
} catch(e) {
  console.log("Error with Number:", e.message);
}
try {
  IDL.Nat.encodeValue(BigInt(1));
  console.log("Success with BigInt");
} catch(e) {
  console.log("Error with BigInt:", e.message);
}
