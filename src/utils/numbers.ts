import numeral from 'numeral';

// ----------------------------------------------------------------------

export function fCurrency(number : number) {
  return numeral(number).format('$0,0.00');
}

export function fPercent(number : number) {
  return numeral(number).format('0.00%');
}

export function RoundToTwoDecimalPlaces(number : number ) {
  return Math.round((number + Number.EPSILON) * 100) / 100;
}