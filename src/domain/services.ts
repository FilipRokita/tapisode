/** Our own curated list of streaming services. Providers map their ids onto these keys. */
export const SERVICE_KEYS = ["netflix", "prime", "disney", "hbo", "apple", "sky"] as const;
export type ServiceKey = (typeof SERVICE_KEYS)[number];

export const SERVICE_NAMES: Readonly<Record<ServiceKey, string>> = {
  netflix: "Netflix",
  prime: "Prime Video",
  disney: "Disney+",
  hbo: "HBO Max",
  apple: "Apple TV+",
  sky: "SkyShowtime",
};

/** ISO 3166-1 alpha-2 country code, which is also the catalog region. */
export type RegionCode = string;
