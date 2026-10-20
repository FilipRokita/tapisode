import type { ServiceKey } from "@/domain/services";
import type { MediaType, SeriesState } from "@/domain/types";

/** Invented titles and our own artwork. Nothing here comes from a real catalog. */
export interface FakeTitle {
  readonly id: string;
  readonly type: MediaType;
  readonly title: string;
  readonly year: number;
  readonly hue: number;
  readonly overview: string;
  readonly runtimeMinutes: number;
  readonly services: readonly ServiceKey[];
  readonly series?: {
    readonly state: SeriesState;
    /** Episodes per season. */
    readonly counts: readonly number[];
    /** Episodes aired per season. */
    readonly aired: readonly number[];
    /** Days from today until the next episode. */
    readonly nextInDays?: number;
  };
  /** Movies only. */
  readonly released?: boolean;
  /** A title the catalog has no poster for, so the interface shows its fallback. */
  readonly noPoster?: true;
}

export const FAKE_TITLES: readonly FakeTitle[] = [
  { id: "harbor", type: "tv", title: "The Quiet Harbor", year: 2025, hue: 262, runtimeMinutes: 52, services: ["netflix"], overview: "A retired lighthouse keeper starts receiving letters addressed to people who have never lived in town.", series: { state: "ongoing", counts: [8, 10], aired: [8, 8], nextInDays: 3 } },
  { id: "salt", type: "tv", title: "Salt & Static", year: 2024, hue: 198, runtimeMinutes: 47, services: ["hbo"], overview: "Two pirate-radio hosts discover that their broadcast can be heard a few seconds before it airs.", series: { state: "ended", counts: [8], aired: [8] } },
  { id: "kingdoms", type: "tv", title: "Paper Kingdoms", year: 2023, hue: 24, runtimeMinutes: 58, services: ["disney"], overview: "Cartographers at a failing map house are asked to draw borders for countries that do not exist yet.", series: { state: "ongoing", counts: [10, 10, 8], aired: [10, 10, 7], nextInDays: 4 } },
  { id: "orchard", type: "tv", title: "Glass Orchard", year: 2026, hue: 330, runtimeMinutes: 44, services: ["apple"], overview: "A greenhouse inherited from a stranger turns out to grow something that remembers.", series: { state: "ongoing", counts: [6], aired: [6] } },
  { id: "marrow", type: "movie", title: "Last Train to Marrow", year: 2026, hue: 215, runtimeMinutes: 124, services: ["prime"], released: true, overview: "One night, one carriage, and a ticket that was never meant to be punched." },
  { id: "ember", type: "tv", title: "Ember Court", year: 2025, hue: 12, runtimeMinutes: 50, services: ["sky"], overview: "A royal house burns its history every spring, and this year someone kept a copy.", series: { state: "ongoing", counts: [10], aired: [10] } },
  { id: "tide", type: "movie", title: "The Long Tide", year: 2025, hue: 190, runtimeMinutes: 109, services: ["netflix"], released: true, overview: "Two sisters row a borrowed boat toward an island that is not on any chart." },
  { id: "moth", type: "tv", title: "Moth Season", year: 2024, hue: 288, noPoster: true, runtimeMinutes: 46, services: ["hbo"], overview: "Every autumn the town goes quiet. This is the story of the last one.", series: { state: "ended", counts: [8, 8], aired: [8, 8] } },
  { id: "signal", type: "movie", title: "Hollow Signal", year: 2026, hue: 150, runtimeMinutes: 97, services: ["apple"], released: true, overview: "A night-shift operator answers a call from a number that was disconnected years ago." },
  { id: "cartog", type: "tv", title: "Night Cartographers", year: 2023, hue: 305, runtimeMinutes: 55, services: ["netflix", "disney"], overview: "They map the city only after dark, and the map keeps changing.", series: { state: "ended", counts: [6, 6], aired: [6, 6] } },
  { id: "velvet", type: "tv", title: "Velvet Static", year: 2021, hue: 320, runtimeMinutes: 49, services: ["hbo"], overview: "A cult-classic cable channel and the people who still watch it.", series: { state: "ended", counts: [8, 8, 6], aired: [8, 8, 6] } },
  { id: "orbit", type: "movie", title: "Orbit of Two", year: 2024, hue: 232, runtimeMinutes: 118, services: ["prime"], released: true, overview: "Two astronomers, one telescope, and a decade of unanswered messages." },
  { id: "road", type: "movie", title: "The Salt Road", year: 2023, hue: 40, runtimeMinutes: 131, services: ["sky"], released: true, overview: "A salt trader crosses a dry sea to deliver a debt." },
  { id: "lanterns", type: "tv", title: "Lanterns", year: 2022, hue: 48, runtimeMinutes: 42, services: ["disney"], overview: "A festival town, a lantern maker, and the night everything went dark.", series: { state: "ended", counts: [10, 10], aired: [10, 10] } },
  // Titles that are not in anyone's lists: search and "Popular right now" results.
  { id: "lights", type: "tv", title: "Harbor Lights", year: 2022, hue: 200, runtimeMinutes: 45, services: ["netflix"], overview: "An invented title for the prototype.", series: { state: "ended", counts: [8], aired: [8] } },
  { id: "job", type: "movie", title: "The Harbor Job", year: 2021, hue: 20, runtimeMinutes: 100, services: ["prime"], released: true, overview: "An invented title for the prototype." },
  { id: "hours", type: "tv", title: "Quiet Hours", year: 2025, hue: 280, runtimeMinutes: 40, services: ["apple"], overview: "An invented title for the prototype.", series: { state: "ongoing", counts: [8], aired: [5], nextInDays: 6 } },
  { id: "rooms", type: "movie", title: "Quiet Rooms", year: 2019, hue: 310, runtimeMinutes: 100, services: ["hbo"], released: true, overview: "An invented title for the prototype." },
  // Unreleased: they can only go on the Watchlist.
  { id: "aurora", type: "movie", title: "Aurora Gate", year: 2027, hue: 170, runtimeMinutes: 0, services: [], released: false, overview: "An announced film with no release date yet." },
  { id: "tidewater", type: "tv", title: "Tidewater", year: 2027, hue: 205, runtimeMinutes: 0, services: [], overview: "An announced series. Nothing has aired.", series: { state: "upcoming", counts: [6], aired: [0] } },
];

export const FAKE_POPULAR: readonly string[] = ["lights", "job", "hours", "rooms"];
export const FAKE_REGIONS: readonly { code: string; name: string }[] = [
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "GB", name: "United Kingdom" },
  { code: "PL", name: "Poland" },
  { code: "US", name: "United States" },
];
