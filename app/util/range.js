export function remapNumberToRange( inputNumber, fromMin, fromMax, toMin, toMax ) {
  return (inputNumber - fromMin) / (fromMax - fromMin) * (toMax - toMin) + toMin;
}

export function isAudible( frequency ) {
  return 20 <= frequency && frequency <=20000;
}
