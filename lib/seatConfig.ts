// 固定座位配置
export const TABLES = [
  // 2 人桌 x4
  { id: "T2-1", label: "2人桌 1", capacity: 2, type: "T2" },
  { id: "T2-2", label: "2人桌 2", capacity: 2, type: "T2" },
  { id: "T2-3", label: "2人桌 3", capacity: 2, type: "T2" },
  { id: "T2-4", label: "2人桌 4", capacity: 2, type: "T2" },
  // 4 人桌 x3
  { id: "T4-1", label: "4人桌 1", capacity: 4, type: "T4" },
  { id: "T4-2", label: "4人桌 2", capacity: 4, type: "T4" },
  { id: "T4-3", label: "4人桌 3", capacity: 4, type: "T4" },
  // 6 人桌 x2
  { id: "T6-1", label: "6人桌 1", capacity: 6, type: "T6" },
  { id: "T6-2", label: "6人桌 2", capacity: 6, type: "T6" },
] as const;

export type TableUsage = {
  id: string;
  label: string;
  capacity: number;
  type: string;
  used: boolean;
};









