export function formatUnits(value: bigint, decimals: number): string {
  const negative = value < 0n;
  const v = negative ? -value : value;
  const base = 10n ** BigInt(decimals);
  const whole = v / base;
  const fraction = v % base;
  const fractionStr = fraction
    .toString()
    .padStart(decimals, '0')
    .replace(/0+$/, '');
  const s = fractionStr.length ? `${whole.toString()}.${fractionStr}` : whole.toString();
  return negative ? `-${s}` : s;
}

