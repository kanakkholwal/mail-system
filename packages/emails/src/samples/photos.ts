const CDN = 'https://images.unsplash.com';

/**
 * Sourced at twice the display width so the picture stays sharp on retina, and
 * cropped wide so a hero does not push the call to action off a phone screen.
 */
function photo(id: string, width: number, height: number): string {
  return `${CDN}/${id}?w=${width}&h=${height}&fit=crop&crop=entropy&q=72&fm=jpg`;
}

const hero = (id: string): string => photo(id, 1200, 700);
const square = (id: string): string => photo(id, 400, 400);

/**
 * Every URL was fetched and looked at before it landed here. A 200 response is
 * not verification: the first candidate for the shipping hero returned a valid
 * JPEG of toy figurines.
 */
export const PHOTO = {
  trialEnding: hero('photo-1517245386807-bb43f82c33c4'),
  usageLimit: hero('photo-1551288049-bebda4e38f71'),
  winback: hero('photo-1499750310107-5fef28a66643'),
  referral: hero('photo-1543269865-cbf427effbad'),
  weeklyDigest: hero('photo-1504384308090-c894fdcc538d'),
  teamInvite: hero('photo-1521737604893-d14cc237f11d'),
  mention: hero('photo-1531482615713-2afd69097998'),
  shipping: hero('photo-1553413077-190dd305871c'),
  storefront: hero('photo-1441984904996-e0b6ba687e04'),
} as const;

export const PRODUCT = {
  sketchbook: square('photo-1531346878377-a5be20888e57'),
  pens: square('photo-1583485088034-697b5bc54ccd'),
  notebooks: square('photo-1517842645767-c639042777db'),
} as const;

/** Alt text carries the message on its own, because a third of clients block images. */
export const PHOTO_ALT = {
  trialEnding: 'Two people reviewing work on a laptop',
  usageLimit: 'An analytics dashboard showing usage over time',
  winback: 'A quiet desk with a closed laptop and a coffee',
  referral: 'Friends looking at a laptop together',
  weeklyDigest: 'An open plan studio mid-week',
  teamInvite: 'A team working around one table',
  mention: 'Two colleagues reading a screen together',
  shipping: 'A fulfilment warehouse aisle',
  storefront: 'The inside of a small shop',
} as const;
