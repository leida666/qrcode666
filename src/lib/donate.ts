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

export const charityUrl = (id: CharityId) => CHARITIES.find((c) => c.id === id)!.url
