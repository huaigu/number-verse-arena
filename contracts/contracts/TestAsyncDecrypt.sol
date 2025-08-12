pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract TestAsyncDecrypt is SepoliaConfig {
  ebool xBool;
  bool public yBool;
  bool public isDecryptionPending;
  uint256 public latestRequestId;

  constructor() {
    xBool = FHE.asEbool(true);
    FHE.allowThis(xBool);
  }

  function requestBool() public {
    require(!isDecryptionPending, "Decryption is in progress");
    bytes32[] memory cts = new bytes32[](1);
    cts[0] = FHE.toBytes32(xBool);
    latestRequestId = FHE.requestDecryption(cts, this.myCustomCallback.selector);

    /// @dev This prevents sending multiple requests before the first callback was sent.
    isDecryptionPending = true;
  }

  function myCustomCallback(uint256 requestId, bool decryptedInput, bytes[] memory signatures) public returns (bool) {
    /// @dev This check is used to verify that the request id is the expected one.
    require(requestId == latestRequestId, "Invalid requestId");
    FHE.checkSignatures(requestId, signatures);
    yBool = decryptedInput;
    isDecryptionPending = false;
    return yBool;
  }
}