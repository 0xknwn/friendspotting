// SPDX-License-Identifier: MIT
/* solhint-disable var-name-mixedcase */
/* solhint-disable func-param-name-mixedcase */
pragma solidity ^0.8.0;

contract MockedFriendTech {
    mapping(address => uint256) public sharesSupply;

    uint256 public lastExecuted;

    constructor(address _SHARE_SUBJECT, uint256 _INITIAL_SHARE_SUPPLY) {
        sharesSupply[_SHARE_SUBJECT] = _INITIAL_SHARE_SUPPLY;
    }

    function setSharesSupply(address _sharesSubject, uint256 _newSupply) public {
        sharesSupply[_sharesSubject] = _newSupply;
        lastExecuted = block.timestamp;
    }

    function getPrice(uint256 supply, uint256 amount) public pure returns (uint256) {
        uint256 sum1 = supply == 0 ? 0 : (supply - 1) * (supply) * (2 * (supply - 1) + 1) / 6;
        uint256 sum2 = supply == 0 && amount == 1
            ? 0
            : (supply - 1 + amount) * (supply + amount) * (2 * (supply - 1 + amount) + 1) / 6;
        uint256 summation = sum2 - sum1;
        return summation * 1 ether / 16000;
    }

    function getBuyPrice(address sharesSubject, uint256 amount) public view returns (uint256) {
        return getPrice(sharesSupply[sharesSubject], amount);
    }

    function getSellPrice(address sharesSubject, uint256 amount) public view returns (uint256) {
        return getPrice(sharesSupply[sharesSubject] - amount, amount);
    }

    function getSharesSupply(address sharesSubject) public view returns (uint256) {
        return sharesSupply[sharesSubject];
    }
}
