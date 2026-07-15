import type { Item } from '@/types/catalog';

export interface ItemContent {
  /** Nội dung hiển thị dưới tên hạng mục trên báo giá. */
  text: string;
  /** true nếu là dữ liệu mẫu (chưa có API thật) — UI phải hiển thị in nghiêng. */
  isMock: boolean;
}

/**
 * Nội dung chi tiết của 1 hạng mục báo giá — ưu tiên `Item.description` (cột thật trên
 * catalog_items). Khi trống, fallback sang mô tả loại thiết bị (`equipment_type_details.description`
 * ở schema mới, xem docs/database.md mục 3) — backend chưa có endpoint join tới tầng này
 * (docs/more-require.md mục (ii)) nên tạm sinh placeholder cùng định dạng với dữ liệu seed thật.
 */
export function getItemContent(item: Pick<Item, 'description' | 'typeDetailDescription'> | null | undefined, itemName: string): ItemContent {
  const real = item?.description?.trim() || item?.typeDetailDescription?.trim();
  if (real) return { text: real, isMock: false };
  return { text: `Chi tiết loại thiết bị: ${itemName}`, isMock: true };
}
