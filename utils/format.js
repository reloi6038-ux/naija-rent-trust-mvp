exports.formatNaira = (n) => {
  if (typeof n !== 'number' || Number.isNaN(n)) return '₦0';
  return '₦' + n.toLocaleString('en-NG');
};

exports.calcTotalMoveIn = ({ annualRent = 0, agencyFee = 0, legalFee = 0, cautionDeposit = 0 }) =>
  Number(annualRent) + Number(agencyFee) + Number(legalFee) + Number(cautionDeposit);
