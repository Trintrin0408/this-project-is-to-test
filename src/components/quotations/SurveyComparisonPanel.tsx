'use client';

import { AlertTriangle, Check, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { AdminQuotationLineItem } from '@/mocks/db/quotations';
import { AdminSurveyReport, SURVEY_REPORT_STATUS_META } from '@/mocks/db';
import InventoryAvailabilityPanel from './InventoryAvailabilityPanel';

interface SurveyComparisonPanelProps {
  quotationItems: AdminQuotationLineItem[];
  surveyReport: AdminSurveyReport;
  syncSuccess: boolean;
  onSync: () => void;
  onApprove: () => void;
}

// Khối "Đối chiếu khảo sát thực tế & đề xuất báo giá", chỉ hiện khi báo giá ở trạng thái "Đang khảo
// sát" — port từ docs/components/Quotations (1).tsx. Gồm 3 phần: so sánh số liệu, kiểm tra tồn kho,
// phê duyệt cuối.
export default function SurveyComparisonPanel({ quotationItems, surveyReport, syncSuccess, onSync, onApprove }: Readonly<SurveyComparisonPanelProps>) {
  const findQuoteQuantity = (itemName: string) => quotationItems.find((qi) => qi.name === itemName)?.quantity ?? 0;

  const inventoryCheckItems = surveyReport.quoteItems.filter((it) => it.category.includes('Thiết bị') || it.category.includes('Thi công'));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Block 1: Compare */}
      <div className="space-y-6 rounded-xl border border-slate-200/80 bg-white p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h4 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
              <GitCompare className="h-5 w-5 text-blue-600" />
              Đối chiếu khảo sát thực tế &amp; đề xuất báo giá
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Khảo sát viên: <strong className="text-slate-700">{surveyReport.assignee}</strong> | Ngày khảo sát:{' '}
              <strong className="text-slate-700">{formatDate(surveyReport.surveyDate)}</strong>
            </p>
            <p className="text-xs text-slate-500">
              Địa điểm khảo sát thực địa: <strong className="text-slate-700">{surveyReport.location}</strong>
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
              surveyReport.status === 'CONFIRMED' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-amber-200 bg-amber-50 text-amber-700'
            }`}
          >
            • {SURVEY_REPORT_STATUS_META[surveyReport.status].label}
          </span>
        </div>

        <div className="space-y-1.5 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <h5 className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            Kết luận &amp; đánh giá hiện trạng mặt bằng:
          </h5>
          <p className="text-xs font-medium leading-relaxed text-blue-800">{surveyReport.content}</p>
        </div>

        <div className="space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900">So sánh chênh lệch khối lượng &amp; đơn giá</h5>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-3 py-2.5">Tên hạng mục khảo sát</th>
                  <th className="w-16 px-3 py-2.5 text-center">ĐVT</th>
                  <th className="w-20 px-3 py-2.5 text-center">SL gốc</th>
                  <th className="w-20 px-3 py-2.5 text-center">SL thực tế</th>
                  <th className="w-28 px-3 py-2.5 text-center">Chênh lệch</th>
                  <th className="w-24 px-3 py-2.5 text-right">Đơn giá</th>
                  <th className="w-28 px-3 py-2.5 text-right">Thành tiền thực tế</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {surveyReport.quoteItems.map((item) => {
                  const quoteQuantity = findQuoteQuantity(item.name);
                  const diff = item.quantity - quoteQuantity;
                  return (
                    <tr key={item.name} className="hover:bg-slate-50/50">
                      <td className="px-3 py-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="px-3 py-3 text-center font-medium text-slate-600">{item.unit}</td>
                      <td className="px-3 py-3 text-center font-medium text-slate-500">{quoteQuantity}</td>
                      <td className="bg-slate-50/30 px-3 py-3 text-center font-bold text-slate-900">{item.quantity}</td>
                      <td className="px-3 py-3 text-center font-bold">
                        {diff === 0 ? (
                          <span className="text-[10px] font-semibold text-slate-400">Khớp (0)</span>
                        ) : diff > 0 ? (
                          <span className="rounded border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">+{diff} (Phát sinh)</span>
                        ) : (
                          <span className="rounded border border-red-100 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">{diff} (Giảm bớt)</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-slate-600">{formatCurrency(item.price)}</td>
                      <td className="bg-blue-50/10 px-3 py-3 text-right font-black text-slate-900">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {syncSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
            <Check className="h-5 w-5 flex-shrink-0 text-emerald-600" />
            Đã đồng bộ thành công toàn bộ số liệu khảo sát thực tế vào báo giá chính thức phía trên! Bạn có thể duyệt hoặc tiếp tục sửa đổi thủ công.
          </div>
        )}

        <div className="flex justify-end border-t border-slate-100 pt-2">
          <Button variant="secondary" onClick={onSync}>
            <GitCompare className="h-4 w-4 text-blue-600" />
            Áp dụng số lượng khảo sát thực tế vào báo giá
          </Button>
        </div>
      </div>

      {/* Block 2: Inventory check */}
      <InventoryAvailabilityPanel items={inventoryCheckItems} />

      {/* Block 3: Final approval */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-xl bg-slate-900 p-6 text-white shadow-xl sm:flex-row">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="flex items-center justify-center gap-1.5 text-base font-bold text-blue-300 sm:justify-start">
            <Check className="h-5 w-5 text-blue-400" />
            Phê duyệt báo giá cuối cùng
          </h4>
          <p className="text-xs text-slate-300">Chốt phương án kỹ thuật và đơn giá sau khảo sát thực tế để gửi khách hàng ký kết hợp đồng.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={onApprove}>
          <Check className="h-4 w-4" />
          Duyệt &amp; chuyển sang &quot;Đã duyệt&quot;
        </Button>
      </div>
    </div>
  );
}
