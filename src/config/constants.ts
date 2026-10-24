/** Product constants that more than one layer needs. */
export const SANDBOX_LIFETIME_MS = 6 * 60 * 60 * 1000;
export const SANDBOX_CAP = 30;
export const TEMPLATE_USER_EMAIL = "sandbox-template@tapisode.invalid";
export const DEFAULT_COUNTRY = "US";

/** How long provider data may be kept and when it is refreshed. The 6-month rule is why PURGE_DAYS is 150. */
export const FRESHNESS = {
  /** A title opened by a user is refetched when its content is older than this. */
  openOngoingHours: 24,
  openStaticDays: 14,
  /** The weekly job refreshes tracked titles older than this, oldest first. */
  jobOngoingDays: 3,
  jobStaticDays: 60,
  availabilityHours: 72,
  /** Content older than this is deleted. Five months, a month inside the provider's six. */
  purgeDays: 150,
  /** How many titles one weekly run may refetch. */
  jobBudget: 300,
  /** The weekly job refreshes this many titles at once, and stops starting new batches after the time budget, well inside the route's 60 seconds. */
  jobBatch: 5,
  jobTimeBudgetMs: 40_000,
} as const;
