// 固定時段配置（共用於前台預約頁和後台儀表板）
export const TIME_SLOTS = [
  { id: "MORNING_1", label: "09:00–10:30", start: "09:00", end: "10:30" },
  { id: "MORNING_2", label: "10:30–12:00", start: "10:30", end: "12:00" },
  { id: "NOON_1", label: "12:00–13:30", start: "12:00", end: "13:30" },
  { id: "NOON_2", label: "13:30–15:00", start: "13:30", end: "15:00" },
] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];
export type TimeSlotId = TimeSlot["id"];









