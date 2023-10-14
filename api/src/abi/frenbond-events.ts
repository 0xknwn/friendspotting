import { parseAbiItem } from "viem";

export const events = parseAbiItem([
  `event TreasuryOpened(uint256 indexed _treasuryID, address indexed opener, uint256 indexed _startedAt, uint256 _maturityAt, uint256 _startingPrice, uint256 _timestamp)`,
  `event NewPayouts(uint256 indexed _balanceTreasury, uint256 _longSupply, uint256 indexed _longPayout, uint256 _shortSupply, uint256 indexed _shortPayout, uint256 _timestamp)`,
  `event PricesUpdated(uint256 indexed _treasuryID, uint256 indexed _newMaturityPrice, uint256 _numberOfUpdates, uint256 indexed _timestamp)`,
  `event BondsBought(uint256 indexed _treasuryID, address indexed _by, bool indexed _isLong, uint256 _quantityBought, uint256 _amountPaid, uint256 _newUserAveragePrice, uint256 _timestamp)`,
  `event BondsSold(uint256 indexed _treasuryID, address indexed _by, bool indexed _isLong, uint256 _quantitySold, uint256 _sellPrice, uint256 _amountSold, uint256 _timestamp)`,
  `event FeesSplitted(uint256 indexed _treasuryID, address indexed _closer, uint256 _revShareAmount, uint256 _ftSubjectAmount, uint256 _treasurersAmount, uint256 _collectorAmount, uint256 _timestamp)`,
  `event TreasuryClosed(uint256 indexed _treasuryID, TreasuryStatus indexed _status, BondType indexed _winningBond, uint256 _startingPrice, uint256 _ftPrice, uint256 _maturityPrice, uint256 _quoteBalanceToShare, uint256 _winningBondSupply, uint256 _winningPayout, uint256 _timestamp)`,
  `event TreasuryClosedWithoutTrade(uint256 indexed _treasuryID, TreasuryStatus indexed _status, uint256 _timestamp)`,
  `event BondsRefunded(uint256 indexed _treasuryID, address indexed _claimer, uint256 indexed _amountRefunded, uint256 _quantityOfLong, uint256 _quantityOfShort, uint256 _timestamp)`,
  `event BondsSettled(uint256 indexed _treasuryID, address indexed _claimer, uint256 indexed _amountSettled, uint256 _quantitySettled, uint256 _ratioPaid, uint256 _timestamp)`,
  `event TreasuryRefunded(uint256 indexed _treasuryID, TreasuryStatus indexed _status, uint256 indexed _pausedAt)`,
  `event NewFeesCollector(address indexed _feesCollector, uint256 _timestamp)`,
  `event NewRevShare(address indexed _revShare, uint256 _timestamp)`,
  `event NewQuoteToken(address indexed _token, uint256 _timestamp)`,
  `event NewPointToken(address indexed _pointToken, uint256 _timestamp)`,
  `event NewBuyFee(uint16 indexed _buyFee, uint256 _timestamp)`,
  `event NewSellFee(uint16 indexed _sellFee, uint256 _timestamp)`,
  `event NewRevShareFee(uint16 indexed _revShareFee, uint256 _timestamp)`,
  `event NewFTSubjectFee(uint16 indexed _ftSubjectFee, uint256 _timestamp)`,
  `event NewTreasurersFee(uint16 indexed _treasurersFee, uint256 _timestamp)`,
  `event NewInitialBondPrice(uint96 indexed _initialBondPrice, uint256 _timestamp)`,
  `event NewInitialSellPercent(uint16 indexed _initialDiscountPercent, uint256 _timestamp)`,
  `event NewEpoch(uint64 indexed _epoch, uint256 _timestamp)`,
]);

export const address = "0x0"