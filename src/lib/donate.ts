/**
 * Where we send people who want to say thanks. QRCode666 is not affiliated
 * with either organisation and receives nothing. Both URLs are the official
 * entry points linked from each organisation's own site (checked 2026-10-22);
 * UNICEF's routes visitors to their national UNICEF donation page.
 */
export const CHARITIES = [
  { id: 'unicef', url: 'https://help.unicef.org/global/donate' },
  { id: 'wfp', url: 'https://www.wfp.org/donate' },
] as const

export type CharityId = (typeof CHARITIES)[number]['id']

/**
 * Links go through /donate/<org> on our own domain, where a Cloudflare Pages
 * Function adds one to an anonymous daily tally and redirects to the official
 * page (see functions/donate/[org].ts). Only the organisation, the day and the
 * page language are counted.
 */
export const donateHref = (id: CharityId, lang: string) => `/donate/${id}?lang=${lang}`
