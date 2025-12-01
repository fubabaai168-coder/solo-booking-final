import { z } from 'zod';

/**
 * 預約 Log 結構
 * 所有欄位皆為必填
 */
export interface ReservationLog {
  name: string;        // 顧客姓名
  phone: string;      // 顧客電話
  date: string;       // 預約日期 (格式: YYYY-MM-DD)
  dateTime: string;   // 完整日期時間字串 (ISO 8601, 例如: 2025-11-30T06:00:00+08:00)
  time: string;       // 預約時段 (例如: 06:00-10:30)
  people: number;     // 預約人數
  notes: string;      // 顧客備註
}

/**
 * Zod Schema 用於驗證 ReservationLog
 */
export const ReservationLogSchema = z.object({
  name: z.string().min(1, '姓名為必填欄位'),
  phone: z.string().min(1, '電話為必填欄位'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式應為 YYYY-MM-DD'),
  dateTime: z.string().min(1, '完整日期時間為必填欄位'),
  time: z.string().min(1, '預約時段為必填欄位'),
  people: z.number().int().positive('預約人數必須為正整數'),
  notes: z.string(), // 備註為必填欄位（允許空字串）
});

