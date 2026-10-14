/** Only the digits of what someone typed. */
export const digits = (s: string) => s.replace(/\D/g, '')

/** Digits with thousands separators, so 30000 reads as 30,000 while typing. */
export const withCommas = (s: string) => (digits(s) ? Number(digits(s)).toLocaleString('en-NG') : '')
