"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { parse } from "csv-parse/sync";

type Template = {
  id: string;
  title: string;
  prompt: string;
  reply: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  id?: string; // 有代表在編輯
  title: string;
  prompt: string;
  reply: string;
  tagsInput: string; // 逗號分隔的字串
  isActive: boolean;
};

// 推薦預設問答
const recommendedTemplates: Array<{
  title: string;
  prompt: string;
  reply: string;
  tags: string[];
}> = [
  {
    title: "營業時間",
    prompt: "營業時間, 幾點營業, 幾點打烊",
    reply:
      "我們平日營業時間為 09:00–15:00，最後點餐時間為 14:30；週末與國定假日為 08:30–16:00，實際營業時間以門市公告為主。",
    tags: ["營業時間", "開門", "關門", "營業", "假日"],
  },
  {
    title: "用餐時間限制",
    prompt: "用餐時間, 可以坐多久, 時間限制",
    reply:
      "為了讓每位客人都有舒適的用餐體驗，目前每桌的用餐時間為 90 分鐘，若當時段未滿座，我們也會視現場狀況彈性安排。",
    tags: ["用餐時間", "坐多久", "90分鐘"],
  },
  {
    title: "預約規則",
    prompt: "如何預約, 可以預約嗎, 訂位方式",
    reply:
      "目前採『線上預約為主』，您可以透過網站預約頁填寫日期、時段與人數。系統會自動幫您建立預約與行事曆提醒。若當日臨時造訪，將依現場座位狀況安排候位。",
    tags: ["預約", "訂位", "線上預約", "候位"],
  },
  {
    title: "取消或更改預約",
    prompt: "取消預約, 更改時間, 改時間",
    reply:
      "若需取消或更改預約時間，目前請直接透過電話或 IG 私訊與我們聯繫，提供您的姓名與預約日期，我們會協助您調整。",
    tags: ["取消", "改時間", "更改預約"],
  },
  {
    title: "寵物友善政策",
    prompt: "可以帶寵物嗎, 狗狗, 毛小孩",
    reply:
      "本店為友善寵物空間，請協助將毛孩放置於寵物推車或提籃內，並避免打擾其他客人；如有特殊情況，仍以當日店內公告與現場人員指引為主。",
    tags: ["寵物", "狗", "貓", "毛小孩"],
  },
];

export default function SupportBotPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    title: "",
    prompt: "",
    reply: "",
    tagsInput: "",
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);
  
  // Excel/CSV 匯入相關 state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    createdCount: number;
    skippedCount: number;
    errors: Array<{ index: number; title?: string; message: string }>;
    skippedTitles: string[];
  } | null>(null);

  // 載入現有 templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/support/templates");
        const data = await res.json();
        setTemplates(data.templates ?? []);
      } catch (err) {
        console.error("fetch templates error", err);
        setError("載入常用問答時發生錯誤");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // 新增 / 更新表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const tags =
      form.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) ?? [];

    try {
      if (form.id) {
        // 編輯
        const res = await fetch(`/api/support/templates/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            prompt: form.prompt,
            reply: form.reply,
            tags,
            isActive: form.isActive,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "更新失敗");
        setTemplates((prev) =>
          prev.map((t) => (t.id === data.template.id ? data.template : t))
        );
      } else {
        // 新增
        const res = await fetch("/api/support/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            prompt: form.prompt,
            reply: form.reply,
            tags,
            isActive: form.isActive,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "新增失敗");
        setTemplates((prev) => [data.template, ...prev]);
      }

      // 重置表單（保留 isActive）
      setForm({
        id: undefined,
        title: "",
        prompt: "",
        reply: "",
        tagsInput: "",
        isActive: true,
      });
    } catch (err: any) {
      console.error("save template error", err);
      setError(err.message ?? "儲存時發生錯誤");
    } finally {
      setSaving(false);
    }
  };

  // 編輯
  const handleEdit = (t: Template) => {
    setForm({
      id: t.id,
      title: t.title,
      prompt: t.prompt,
      reply: t.reply,
      tagsInput: t.tags.join(", "),
      isActive: t.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 刪除
  const handleDelete = async (id: string) => {
    if (!window.confirm("確定要刪除這個問答嗎？")) return;
    try {
      const res = await fetch(`/api/support/templates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("刪除失敗");
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("delete template error", err);
      alert("刪除失敗，請稍後再試");
    }
  };

  // 啟用 / 停用切換
  const toggleActive = async (t: Template) => {
    try {
      const res = await fetch(`/api/support/templates/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !t.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新失敗");
      setTemplates((prev) =>
        prev.map((item) => (item.id === data.template.id ? data.template : item))
      );
    } catch (err) {
      console.error("toggle active error", err);
      alert("更新狀態失敗，請稍後重試");
    }
  };

  // 匯入推薦預設問答
  const handleSeedRecommended = async () => {
    if (!window.confirm("要匯入推薦預設問答嗎？匯入後可以再修改內容。")) return;

    try {
      setSaving(true);
      const created: Template[] = [];
      for (const item of recommendedTemplates) {
        const res = await fetch("/api/support/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            prompt: item.prompt,
            reply: item.reply,
            tags: item.tags,
            isActive: true,
          }),
        });
        const data = await res.json();
        if (res.ok && data.template) {
          created.push(data.template);
        }
      }
      if (created.length > 0) {
        setTemplates((prev) => [...created, ...prev]);
      }
    } catch (err) {
      console.error("seed recommended error", err);
      alert("匯入預設問答時發生錯誤，請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  // 解析 Excel/CSV 檔案
  const parseFile = async (file: File): Promise<Array<{
    title: string;
    prompt: string;
    reply: string;
    tags?: string | string[];
    isActive?: boolean;
  }>> => {
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    if (fileExtension === 'csv') {
      // 處理 CSV
      const text = await file.text();
      const records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });

      return records.map((row: any) => ({
        title: row.title || '',
        prompt: row.prompt || '',
        reply: row.reply || '',
        tags: row.tags || '',
        isActive: row.isActive !== undefined ? row.isActive === 'true' || row.isActive === true : undefined,
      }));
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // 處理 Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      return jsonData.map((row: any) => ({
        title: row.title || '',
        prompt: row.prompt || '',
        reply: row.reply || '',
        tags: row.tags || '',
        isActive: row.isActive !== undefined ? row.isActive === true || row.isActive === 'true' || row.isActive === 1 : undefined,
      }));
    } else {
      throw new Error('不支援的檔案格式，請上傳 .xlsx, .xls 或 .csv 檔案');
    }
  };

  // 處理檔案上傳
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.split('.').pop();
      
      if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
        setError('請選擇 .xlsx, .xls 或 .csv 檔案');
        setImportFile(null);
        return;
      }
      
      setImportFile(file);
      setImportResult(null);
      setError(null);
    }
  };

  // 執行匯入
  const handleImport = async () => {
    if (!importFile) {
      setError('請先選擇檔案');
      return;
    }

    setImporting(true);
    setError(null);
    setImportResult(null);

    try {
      // 1. 解析檔案
      const parsedData = await parseFile(importFile);

      if (parsedData.length === 0) {
        setError('檔案中沒有資料');
        setImporting(false);
        return;
      }

      // 2. 呼叫 API
      const res = await fetch('/api/support/templates/import-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: parsedData }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '匯入失敗');
      }

      // 3. 顯示結果
      setImportResult(data);

      // 4. 如果成功建立新記錄，重新載入列表
      if (data.success && data.createdCount > 0) {
        const fetchRes = await fetch("/api/support/templates");
        const fetchData = await fetchRes.json();
        setTemplates(fetchData.templates ?? []);
      }

      // 5. 清空檔案選擇
      setImportFile(null);
    } catch (err: any) {
      console.error('匯入錯誤', err);
      setError(err.message || '匯入時發生錯誤');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-orange-600 mb-4">客服機器人管理</h1>
      <p className="text-lg text-gray-700 mb-8">
        在這裡可以設定 AI 客服的常用問答，啟用後客戶可在對話中快速點選。
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* 區塊一：新增 / 編輯問答表單 */}
      <div className="bg-white rounded-2xl p-6 shadow-warm mb-8">
        <h2 className="text-xl font-bold text-orange-600 mb-4">
          {form.id ? "編輯問答" : "新增問答"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              標題 *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
              placeholder="例如：營業時間"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              客戶可能會問的問題／關鍵句 *
            </label>
            <textarea
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none resize-none"
              placeholder="例如：營業時間, 幾點營業, 幾點打烊"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              機器人回覆 *
            </label>
            <textarea
              value={form.reply}
              onChange={(e) => setForm({ ...form, reply: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none resize-none"
              placeholder="輸入機器人要回覆的內容..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              標籤
            </label>
            <input
              type="text"
              value={form.tagsInput}
              onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
              placeholder="例如：營業時間, 假日, 早餐"
            />
            <p className="mt-1 text-xs text-gray-500">多個標籤請用逗號分隔</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-400"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              啟用此問答
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "儲存中..." : form.id ? "更新" : "新增"}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={() =>
                  setForm({
                    id: undefined,
                    title: "",
                    prompt: "",
                    reply: "",
                    tagsInput: "",
                    isActive: true,
                  })
                }
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
              >
                取消編輯
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 區塊三：Excel/CSV 匯入 */}
      <div className="bg-white rounded-2xl p-6 shadow-warm mb-8">
        <h2 className="text-xl font-bold text-orange-600 mb-4">匯入 Excel/CSV</h2>
        <p className="text-gray-700 mb-4 text-sm">
          您可以上傳 Excel (.xlsx, .xls) 或 CSV 檔案來批次匯入問答。檔案第一列應為欄位名稱（title, prompt, reply, tags, isActive）。
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇檔案
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={importing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {importFile && (
              <p className="mt-2 text-sm text-gray-600">
                已選擇：<span className="font-medium">{importFile.name}</span>
              </p>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={!importFile || importing}
            className="px-6 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg font-medium hover:from-orange-500 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? "匯入中..." : "開始匯入"}
          </button>

          {/* 匯入結果顯示 */}
          {importResult && (
            <div className={`mt-4 p-4 rounded-lg border ${
              importResult.success && importResult.createdCount > 0
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h3 className="font-semibold mb-2 text-gray-800">匯入結果</h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium text-green-700">成功新增：{importResult.createdCount} 筆</span>
                </p>
                {importResult.skippedCount > 0 && (
                  <p className="text-gray-700">
                    <span className="font-medium text-yellow-700">略過：{importResult.skippedCount} 筆</span>
                  </p>
                )}
                {importResult.skippedTitles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">略過的標題：</p>
                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                      {importResult.skippedTitles.slice(0, 10).map((title, idx) => (
                        <li key={idx}>{title}</li>
                      ))}
                      {importResult.skippedTitles.length > 10 && (
                        <li className="text-gray-500">... 還有 {importResult.skippedTitles.length - 10} 筆</li>
                      )}
                    </ul>
                  </div>
                )}
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-red-600 mb-1 font-medium">錯誤訊息：</p>
                    <ul className="list-disc list-inside text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errors.slice(0, 5).map((err, idx) => (
                        <li key={idx}>
                          第 {err.index + 1} 筆{err.title ? ` (${err.title})` : ''}：{err.message}
                        </li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li className="text-gray-500">... 還有 {importResult.errors.length - 5} 個錯誤</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 區塊四：推薦預設問答（當 templates 為空時） */}
      {!loading && templates.length === 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-warm mb-8">
          <h2 className="text-xl font-bold text-orange-600 mb-4">推薦預設問答</h2>
          <p className="text-gray-700 mb-4">
            以下是我們為您準備的常用問答範本，您可以一鍵匯入後再依需求調整內容。
          </p>
          <div className="space-y-3 mb-6">
            {recommendedTemplates.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{item.reply}</p>
              </div>
            ))}
          </div>
          <button
            onClick={handleSeedRecommended}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg font-medium hover:from-orange-500 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "匯入中..." : "全部加入"}
          </button>
        </div>
      )}

      {/* 區塊二：現有問答列表 */}
      <div className="bg-white rounded-2xl p-6 shadow-warm">
        <h2 className="text-xl font-bold text-orange-600 mb-4">現有問答列表</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-500">載入中...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            目前尚無問答，請新增或匯入推薦預設問答。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">標題</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">狀態</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">更新時間</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800">{t.title}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {t.prompt}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          t.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {t.isActive ? "啟用" : "停用"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(t.updatedAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(t)}
                          className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-all"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => toggleActive(t)}
                          className={`px-3 py-1 text-xs rounded transition-all ${
                            t.isActive
                              ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}
                        >
                          {t.isActive ? "停用" : "啟用"}
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-all"
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
