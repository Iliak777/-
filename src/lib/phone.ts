/**
 * Normalizes a phone number to E.164. Local Thai numbers ("081 234 5678")
 * get the +66 country code; tourists type their own "+<country>" prefix.
 * Returns null when the input cannot be a valid phone number.
 */
export function normalizePhone(input: string): string | null {
  let s = input.replace(/[\s\-().]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  else if (/^0\d{8,9}$/.test(s)) s = `+66${s.slice(1)}`;
  if (!/^\+[1-9]\d{7,14}$/.test(s)) return null;
  return s;
}

/** "+66812345678" -> "+66 •••• 5678", for showing a number without revealing it. */
export function maskPhone(phone: string): string {
  return `${phone.slice(0, 3)} •••• ${phone.slice(-4)}`;
}
