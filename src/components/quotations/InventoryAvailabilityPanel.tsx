'use client';

import { AlertTriangle, Check, Package } from 'lucide-react';
import { getMockInStock } from '@/mocks/db/quotations';

interface InventoryCheckItem {
  name: string;
  quantity: number;
  unit: string;
}

interface InventoryAvailabilityPanelProps {
  items: InventoryCheckItem[];
}

// Khối "Kiểm tra & dự báo khả dụng tồn kho thiết bị" — dùng chung cho khối Đối chiếu khảo sát
// (SurveyComparisonPanel) và trang Picklist chi tiết báo giá, tránh lặp lại cùng 1 bảng đối chiếu kho.
export default function InventoryAvailabilityPanel({ items }: Readonly<InventoryAvailabilityPanelProps>) {
  const hasShortage = items.some((item) => getMockInStock(item.name) < item.quantity);

  return (
    <div className="space-y-6 rounded-xl border border-slate-200/80 bg-white p-8 shadow-xs">
      <div>
        <h4 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
          <Package className="h-5 w-5 text-amber-600" />
          Kiểm tra &amp; dự báo khả dụng tồn kho thiết bị
        </h4>
        <p className="mt-1 text-xs text-slate-500">Đối chiếu trực tiếp với hệ thống tồn kho vật tư trung tâm để khóa chỗ loa đài, cơ điện, rạp bạt.</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-3 py-2.5">Tên thiết bị / Phụ tùng</th>
              <th className="w-28 px-3 py-2.5 text-center">Nhu cầu thực tế</th>
              <th className="w-28 px-3 py-2.5 text-center">Tồn kho khả dụng</th>
              <th className="w-32 px-3 py-2.5 text-center">Nguồn cung</th>
              <th className="w-40 px-3 py-2.5 text-center">Trạng thái khả dụng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center italic text-slate-400">
                  Không có thiết bị cơ khí/điện tử cần rà soát kho.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const inStock = getMockInStock(item.name);
                const isEnough = inStock >= item.quantity;
                return (
                  <tr key={item.name} className="hover:bg-slate-50/50">
                    <td className="px-3 py-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="px-3 py-3 text-center font-extrabold text-slate-900">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="bg-slate-50/30 px-3 py-3 text-center font-bold text-slate-600">
                      {inStock} {item.unit}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-extrabold ${isEnough ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                        {isEnough ? 'Kho BN (Internal)' : 'Thuê ngoài (External)'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {isEnough ? (
                        <span className="flex items-center justify-center gap-1 text-xs font-extrabold text-emerald-600">
                          <Check className="h-3.5 w-3.5" />
                          Đủ hàng khả dụng
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1 text-xs font-extrabold text-amber-600">
                          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                          Thiếu {item.quantity - inStock} {item.unit}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {items.length > 0 &&
        (hasShortage ? (
          <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
            <p className="flex items-center gap-1 font-bold text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Lưu ý phân phối điều động kho:
            </p>
            <p>
              Hệ thống phát hiện nhu cầu của một số hạng mục vượt định mức hiện hữu tại Kho BN. Khi được cấp duyệt, phòng vận hành sẽ tự động liên hệ đối tác liên kết ngoài
              (External Logistics) để bổ sung đầy đủ đúng hạn lắp đặt.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
            <Check className="h-5 w-5 flex-shrink-0 text-emerald-600" />
            Xác nhận: Toàn bộ thiết bị sự kiện dự toán đều sẵn sàng trong kho BN. Đã khóa chỗ tài nguyên phục vụ sự kiện thành công!
          </div>
        ))}
    </div>
  );
}
