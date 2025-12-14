整合目標（Why）

為何要把 StaffShift 與 Reservation 連起來（一句話）

v2 關聯方式（How, no code）

文字描述即可（例如：Reservation 透過 staff_shift_id 指向班表區段）

明確標註：v1 不回填、不影響

v1 / v2 邊界說明（Safety）

v1 資料如何保持不變

v2 只新增、不修改既有行為
〈Minimal Fields〉

reservation.staff_shift_id（nullable）

說明一句話：v2 才寫入，v1 資料一律為 
同一 staff_shift_id 被多筆 reservation 指到時：（Reject / Waitlist / Reassign 擇一）

shift 容量滿時：（Reject / Waitlist 擇一）

人工調整時的優先權：（StaffShift 優先 / Reservation 優先 擇一）
Reference：本規則邏輯對齊「養生館按摩預約系統（get_master_times / 時間區間重疊檢查）」；v2 不另發明新衝突模型。