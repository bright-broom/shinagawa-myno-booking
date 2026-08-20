export type VenueId = "all" | "1001" | "1002" | "1003" | "1004" | "1005";
export type TimeWindow = "any" | "morning" | "afternoon" | "evening";

export type Venue = {
  id: Exclude<VenueId, "all">;
  name: string;
  shortName: string;
  area: string;
};

export type BookingSlot = {
  id: string;
  date: string;
  dateLabel: string;
  weekday: string;
  start: string;
  end: string;
  venueId: Venue["id"];
  remaining: number;
  walkMinutes: number;
  timeWindow: Exclude<TimeWindow, "any">;
};

export const venues: Venue[] = [
  { id: "1001", name: "品川区役所 第二庁舎3階 個人番号カード交付会場", shortName: "品川区役所", area: "大井町" },
  { id: "1002", name: "荏原第一地域センター", shortName: "荏原第一地域センター", area: "武蔵小山" },
  { id: "1003", name: "品川区目黒行政サービスコーナー", shortName: "目黒行政サービスコーナー", area: "目黒" },
  { id: "1004", name: "大崎第一地域センター", shortName: "大崎第一地域センター", area: "五反田" },
  { id: "1005", name: "大井第一地域センター", shortName: "大井第一地域センター", area: "南大井" },
];

export const bookingSlots: BookingSlot[] = [
  { id: "1001-20260831-1030", date: "2026-08-31", dateLabel: "8月31日", weekday: "月", start: "10:30", end: "11:00", venueId: "1001", remaining: 8, walkMinutes: 8, timeWindow: "morning" },
  { id: "1001-20260831-1200", date: "2026-08-31", dateLabel: "8月31日", weekday: "月", start: "12:00", end: "12:30", venueId: "1001", remaining: 3, walkMinutes: 8, timeWindow: "afternoon" },
  { id: "1004-20260831-1430", date: "2026-08-31", dateLabel: "8月31日", weekday: "月", start: "14:30", end: "15:00", venueId: "1004", remaining: 2, walkMinutes: 7, timeWindow: "afternoon" },
  { id: "1003-20260901-1000", date: "2026-09-01", dateLabel: "9月1日", weekday: "火", start: "10:00", end: "10:30", venueId: "1003", remaining: 6, walkMinutes: 2, timeWindow: "morning" },
  { id: "1002-20260901-1800", date: "2026-09-01", dateLabel: "9月1日", weekday: "火", start: "18:00", end: "18:30", venueId: "1002", remaining: 4, walkMinutes: 1, timeWindow: "evening" },
  { id: "1001-20260901-1830", date: "2026-09-01", dateLabel: "9月1日", weekday: "火", start: "18:30", end: "19:00", venueId: "1001", remaining: 1, walkMinutes: 8, timeWindow: "evening" },
  { id: "1005-20260902-0900", date: "2026-09-02", dateLabel: "9月2日", weekday: "水", start: "09:00", end: "09:30", venueId: "1005", remaining: 5, walkMinutes: 9, timeWindow: "morning" },
  { id: "1004-20260902-1600", date: "2026-09-02", dateLabel: "9月2日", weekday: "水", start: "16:00", end: "16:30", venueId: "1004", remaining: 3, walkMinutes: 7, timeWindow: "afternoon" },
  { id: "1003-20260903-1100", date: "2026-09-03", dateLabel: "9月3日", weekday: "木", start: "11:00", end: "11:30", venueId: "1003", remaining: 2, walkMinutes: 2, timeWindow: "morning" },
  { id: "1002-20260903-1500", date: "2026-09-03", dateLabel: "9月3日", weekday: "木", start: "15:00", end: "15:30", venueId: "1002", remaining: 7, walkMinutes: 1, timeWindow: "afternoon" },
];

export function venueFor(slot: BookingSlot): Venue {
  const venue = venues.find((candidate) => candidate.id === slot.venueId);
  if (!venue) throw new Error(`Unknown venue: ${slot.venueId}`);
  return venue;
}
