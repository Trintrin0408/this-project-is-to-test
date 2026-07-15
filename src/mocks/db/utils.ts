// Helper dùng chung cho mọi file trong src/mocks/db/ — chuẩn hóa lại pattern CRUD module-scope đã
// dùng rải rác và không nhất quán ở các file src/mocks/admin*Mock.ts cũ (mỗi file tự viết lại
// getX/addX/updateX/deleteX/nextXId theo cách hơi khác nhau). Mọi entity mới trong db/ nên dùng
// createMockStore thay vì tự viết lại store + CRUD từ đầu.

export interface MockStore<T> {
  getAll(): T[];
  getById(id: string): T | undefined;
  add(record: T): void;
  update(id: string, patch: Partial<T>): void;
  remove(id: string): void;
  /** Escape hatch cho các hàm derive phức tạp (vd getXDetail) cần đọc mảng gốc trực tiếp. */
  raw(): T[];
  /** Xóa dữ liệu đã lưu trong localStorage, quay lại đúng seed ban đầu — dùng khi demo bị rối. */
  resetToSeed(): void;
}

const STORAGE_PREFIX = 'bnwems_mock_db_';

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch {
    // localStorage đầy/không khả dụng (vd private browsing) — bỏ qua, demo vẫn chạy tiếp trong bộ
    // nhớ (RAM), chỉ mất khả năng giữ dữ liệu qua lần tải lại trang.
  }
}

/**
 * Tạo 1 "bảng" mock — dữ liệu giữ trong bộ nhớ VÀ đồng bộ xuống localStorage sau mỗi lần ghi, để
 * dữ liệu demo (đơn vừa tạo, khách vừa sửa...) sống sót qua F5/đóng mở lại tab, không chỉ qua
 * chuyển trang trong phiên (điều mà module-scope `let` đơn thuần đã làm được từ trước).
 *
 * storageKey phải DUY NHẤT trong toàn app (dùng tên entity, vd "customers", "orders"). idField
 * phải là 1 field kiểu string duy nhất trên T.
 */
export function createMockStore<T>(storageKey: string, seed: T[], idField: keyof T & string): MockStore<T> {
  let store: T[] = loadFromStorage(storageKey, seed);
  const persist = () => saveToStorage(storageKey, store);

  return {
    getAll: () => store,
    getById: (id) => store.find((record) => record[idField] === id),
    add: (record) => {
      store = [record, ...store];
      persist();
    },
    update: (id, patch) => {
      store = store.map((record) => (record[idField] === id ? { ...record, ...patch } : record));
      persist();
    },
    remove: (id) => {
      store = store.filter((record) => record[idField] !== id);
      persist();
    },
    raw: () => store,
    resetToSeed: () => {
      store = seed;
      persist();
    },
  };
}

/**
 * Sinh id kế tiếp dạng "<prefix><số đệm 0>" (vd nextSequentialId(rows, 'customerId', 'KH', 3) ->
 * "KH043" nếu id lớn nhất hiện có là "KH042"). Dùng cho các entity đánh số tuần tự kiểu
 * adminOrdersMock/adminCustomersMock thay vì mỗi file tự viết lại hàm này.
 */
export function nextSequentialId<T>(rows: T[], idField: keyof T & string, prefix: string, padLength: number): string {
  const maxNum = rows.reduce((max, row) => {
    const raw = String(row[idField]);
    const num = Number(raw.replace(/\D/g, ''));
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0);
  return `${prefix}${String(maxNum + 1).padStart(padLength, '0')}`;
}

/** Envelope chuẩn dùng chung cho mọi response mock — khớp quy ước API thật (CLAUDE.md mục 2):
 * { success, code, message, data, meta? }. mockAdapter.ts và mọi route handler mock nên trả đúng
 * shape này thay vì tự bịa field lẻ tẻ. */
export interface MockApiEnvelope<T> {
  success: true;
  code: string;
  message: string;
  data: T;
  meta?: MockApiMeta;
}

export interface MockApiMeta {
  page: number;
  limit: number;
  totalCount: number;
}

export function paginate<T>(list: T[], page?: number, limit?: number): { data: T[]; meta: MockApiMeta } {
  const p = page && page > 0 ? page : 1;
  const l = limit && limit > 0 ? limit : 20;
  const start = (p - 1) * l;
  return { data: list.slice(start, start + l), meta: { page: p, limit: l, totalCount: list.length } };
}
