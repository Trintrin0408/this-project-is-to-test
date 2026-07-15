'use client';

import { Boxes, CheckCircle2, Printer } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import { AdminQuotationRow, QUOTATION_STATUS_META, getQuotationItemPicklist } from '@/mocks/db/quotations';

interface QuotationPicklistViewProps {
  row: AdminQuotationRow;
}

// Trang 2 của chi tiết báo giá — bóc tách từng hạng mục thành vật tư cấu thành cụ thể để chuẩn bị
// xuất kho, port từ docs/components/Quotations (1).tsx.
export default function QuotationPicklistView({ row }: Readonly<QuotationPicklistViewProps>) {
  const internalCount = row.items.reduce(
    (total, item) => total + getQuotationItemPicklist(item.name, item.quantity, item.unit ?? '').filter((x) => x.source === 'Internal').length,
    0,
  );
  const externalCount = row.items.reduce(
    (total, item) => total + getQuotationItemPicklist(item.name, item.quantity, item.unit ?? '').filter((x) => x.source === 'External').length,
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 overflow-hidden rounded-xl border border-slate-200 bg-white p-8 shadow-xs">
      {/* Letterhead */}
      <div className="flex flex-wrap justify-between gap-6 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900">
              <span className="font-mono text-sm font-black text-white">BN</span>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">Công ty Sự kiện BN</h4>
              <p className="text-xs text-slate-500">Giải pháp tổ chức sự kiện đỉnh cao tại Việt Nam</p>
            </div>
          </div>
          <div className="mt-4 space-y-1 text-xs text-slate-500">
            <p>VP: 120 Điện Biên Phủ, Phường Đa Kao, Quận 1, TP. HCM</p>
            <p>Điện thoại: 0944 556 677 | Hòm thư: sales@bnevent.vn</p>
          </div>
        </div>

        <div className="text-right">
          <h3 className="text-lg font-bold uppercase tracking-widest text-blue-600">Picklist chi tiết</h3>
          <p className="mt-1 font-mono text-xs font-bold text-slate-500">Mã tham chiếu: {row.code}</p>
          <div className="mt-4 space-y-1 text-xs text-slate-500">
            <p>Ngày lập báo giá: {formatDate(row.createdAt)}</p>
            <p>
              Trạng thái báo giá: <strong className="text-blue-600">{QUOTATION_STATUS_META[row.status].label}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Customer summary */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-blue-100/60 bg-blue-50/40 p-4 sm:flex-row sm:items-center">
        <div className="text-xs">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Khách hàng thụ hưởng</p>
          <p className="font-bold text-slate-800">{row.customerName}</p>
        </div>
        <div className="text-xs sm:text-right">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tổng số hạng mục gốc</p>
          <p className="font-black text-slate-800">{row.items.length} hạng mục</p>
        </div>
      </div>

      {/* Breakdown per item */}
      <div className="space-y-6">
        {row.items.map((item, idx) => {
          const subItems = getQuotationItemPicklist(item.name, item.quantity, item.unit ?? '');
          return (
            <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex flex-col justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">{idx + 1}</span>
                  <h5 className="text-xs font-bold text-slate-900 sm:text-sm">{item.name}</h5>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">{item.category}</span>
                  <span className="font-medium text-slate-500">
                    Số lượng báo giá: <strong>{item.quantity} {item.unit ?? ''}</strong>
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-[11px]">
                  <thead className="border-b border-slate-100 bg-white font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="w-12 px-4 py-2 text-center">STT</th>
                      <th className="px-4 py-2">Tên thiết bị / Vật tư cấu thành</th>
                      <th className="w-20 px-4 py-2 text-center">SL cần</th>
                      <th className="w-16 px-4 py-2 text-center">ĐVT</th>
                      <th className="w-24 px-4 py-2 text-center">Tồn kho</th>
                      <th className="w-24 px-4 py-2 text-center">Nguồn</th>
                      <th className="px-4 py-2">Ghi chú kỹ thuật</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {subItems.map((sub, sIdx) => {
                      const isShortage = sub.source === 'Internal' && sub.inStock < sub.qty;
                      return (
                        <tr key={sub.name} className="hover:bg-slate-50/30">
                          <td className="px-4 py-2 text-center font-semibold text-slate-400">{sIdx + 1}</td>
                          <td className="px-4 py-2 font-bold text-slate-700">{sub.name}</td>
                          <td className="px-4 py-2 text-center font-black text-slate-900">{sub.qty}</td>
                          <td className="px-4 py-2 text-center text-slate-500">{sub.unit}</td>
                          <td className="px-4 py-2 text-center">
                            {sub.source === 'External' ? (
                              <span className="italic text-slate-400">Thuê ngoài</span>
                            ) : (
                              <span className={`inline-flex items-center rounded px-2 py-0.5 font-bold ${isShortage ? 'border border-amber-100 bg-amber-50 text-amber-700' : 'border border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
                                {sub.inStock} (Khả dụng)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${sub.source === 'Internal' ? 'border border-blue-100 bg-blue-50 text-blue-700' : 'border border-purple-100 bg-purple-50 text-purple-700'}`}>
                              {sub.source === 'Internal' ? 'Nội bộ' : 'Thuê ngoài'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-[11px] italic text-slate-500">{sub.notes}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Warehouse dispatch summary */}
      <div className="mt-4 space-y-3 rounded-xl border border-slate-200/60 bg-slate-50 p-5">
        <h5 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-900">
          <Boxes className="h-4 w-4 text-blue-600" />
          Tổng hợp lệnh xuất kho dự kiến
        </h5>
        <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-3">
          <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-2xs">
            <p className="text-[10px] font-semibold uppercase text-slate-400">Thiết bị nội bộ</p>
            <p className="mt-0.5 text-base font-black text-slate-800">{internalCount} dòng hàng</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-2xs">
            <p className="text-[10px] font-semibold uppercase text-slate-400">Vật tư thuê ngoài</p>
            <p className="mt-0.5 text-base font-black text-purple-700">{externalCount} hạng mục hoa/nhân sự</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-2xs">
            <p className="text-[10px] font-semibold uppercase text-slate-400">Tải trọng hậu cần</p>
            <p className="mt-0.5 text-base font-black text-amber-600">Trung bình (Phù hợp xe 2.5T)</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-2 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>• Hệ thống tự động phân tách picklist dựa trên năng lực thiết bị nội bộ hiện có.</p>
          <div className="flex gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 font-bold text-white shadow-2xs transition hover:bg-blue-700"
            >
              <Printer className="h-3 w-3" />
              In phiếu picklist
            </button>
            <button
              type="button"
              onClick={() => alert('Đã gửi yêu cầu kiểm tra kỹ thuật kho cho các thiết bị trong Picklist!')}
              className="flex items-center gap-1 rounded border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              Yêu cầu soạn kho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
