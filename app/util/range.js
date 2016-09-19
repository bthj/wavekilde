export function remapNumberToRange( inputNumber, fromMin, fromMax, toMin, toMax ) {
  return (inputNumber - fromMin) / (fromMax - fromMin) * (toMax - toMin) + toMin;
}

export function isAudible( frequency ) {
  return 20 <= frequency && frequency <=20000;
}

// TODO: questionably the right location:
export const numWorkers = window.navigator.hardwareConcurrency || 4;
