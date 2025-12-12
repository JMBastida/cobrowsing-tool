export function numberToString(n: number, lan: string): string {
  if (n === undefined || n === null) {
    return '0';
  }
  return n.toString();
}
