/** The numbers behind the request limits. One place, so a test and the code agree. */
export const LIMITS = {
  /** The app's own ceiling on provider calls, below TMDB's soft limit of about 40 per second. */
  providerPerSecond: 20,
  providerPerDay: 20_000,
  searchPerUserPerMinute: 40,
  searchPerIpPerMinute: 80,
  /** Fetching a title's details from the provider on behalf of a user. */
  titleFetchPerUserPer10Min: 60,
  titleFetchPerIpPer10Min: 120,
} as const;
