'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Copy,
  FileSignature,
  GitCompare,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import QuotationPicklistView from '@/components/quotations/QuotationPicklistView';
import SurveyComparisonPanel from '@/components/quotations/SurveyComparisonPanel';
import InventoryAvailabilityPanel from '@/components/quotations/InventoryAvailabilityPanel';
import CreateOrderFromQuotationModal from '@/components/quotations/CreateOrderFromQuotationModal';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import {
  ASSIGNEE_POOL,
  AdminQuotationLineItem,
  ITEM_CATEGORY_OPTIONS,
  QUOTATION_CATALOGUE,
  QUOTATION_STATUS_META,
  QuotationSurveyAssignment,
  deleteAdminQuotation,
  getAdminQuotationDetail,
  updateAdminQuotation,
} from '@/mocks/db/quotations';
import { getAdminContracts } from '@/mocks/adminContractsMock';
import { getSurveyReportByQuotationId } from '@/mocks/db';
import { getAdminSchedulePlanByQuotationId } from '@/mocks/db/schedulePlans';
import { getAdminOrders } from '@/mocks/db/orders';
import { MOCK_POLICIES } from '@/mocks/apiFixtures';

// Trang thuần giao diện — xem giải thích ở đầu src/mocks/adminQuotationsMock.ts. Bố cục port từ
// docs/components/Quotations (1).tsx do người dùng cung cấp: 2 trang (Báo giá chính thức / Picklist
// chi tiết) chuyển bằng chấm phân trang, sửa hạng mục inline ngay tại trang này (không còn chuyển
// sang wizard riêng), và khối "Đối chiếu khảo sát" khi báo giá đang ở trạng thái "Đang khảo sát".

function emptyEditItem(): AdminQuotationLineItem {
  return { id: `qi-edit-new-${Date.now()}-${Math.floor(Math.random() * 1000)}`, name: '', category: ITEM_CATEGORY_OPTIONS[0], unit: 'Cái', quantity: 1, unitPrice: 0, discount: 0 };
}

export default function AdminQuotationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [detail, setDetail] = useState(() => getAdminQuotationDetail(id));
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [surveyForm, setSurveyForm] = useState<QuotationSurveyAssignment>({ assigneeName: '', date: '', time: '', notes: '' });
  const [detailPage, setDetailPage] = useState<1 | 2>(1);
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [editItems, setEditItems] = useState<AdminQuotationLineItem[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [isSurveyComparisonOpen, setIsSurveyComparisonOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const quotationCardRef = useRef<HTMLDivElement>(null);

  const isLinkedToContract = useMemo(
    () => (detail ? getAdminContracts().some((c) => c.quotationId === detail.row.quotationId) : false),
    [detail],
  );

  if (!detail) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">Không tìm thấy báo giá.</p>
        <Link href="/admin/quotations" className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const { row } = detail;
  const canDelete = row.status === 'draft' || row.status === 'surveying';
  const canApproveReject = row.status === 'draft' || row.status === 'surveying';
  const surveyReport = row.status === 'surveying' ? getSurveyReportByQuotationId(row.quotationId) : undefined;
  // Báo giá nháp: phân công khảo sát điều phối qua Kế hoạch & phân công (lịch, nhân sự) thay vì chỉ
  // 1 field đơn giản như báo giá đã qua khảo sát — xem giải thích ở đầu adminSchedulePlansMock.ts.
  const linkedSurveyPlan = row.status === 'draft' ? getAdminSchedulePlanByQuotationId(row.quotationId) : undefined;
  const linkedSurveyActivity = linkedSurveyPlan?.activities.find((a) => a.type === 'Khảo sát');
  const linkedOrder = row.status === 'approved' ? getAdminOrders().find((o) => o.quotationId === row.quotationId) : undefined;
  const equipmentCheckItems = row.items
    .filter((it) => it.category.includes('Thiết bị') || it.category.includes('Thi công'))
    .map((it) => ({ name: it.name, quantity: it.quantity, unit: it.unit ?? '' }));
  // "Chính sách chung" hiện đúng nội dung chính sách đặt cọc/hủy đơn thật đang quản lý ở
  // /admin/policies (thay vì text hard-code) — sửa policy trong Admin sẽ phản ánh ngay ở đây.
  const generalPolicies = MOCK_POLICIES.filter((p) => p.isActive && (p.policyType === 'DEPOSIT' || p.policyType === 'CANCELLATION'));

  const refresh = () => setDetail(getAdminQuotationDetail(id));

  const handleApprove = () => {
    if (!canApproveReject) return;
    updateAdminQuotation(row.quotationId, { status: 'approved', updatedAt: new Date().toISOString().slice(0, 10) });
    refresh();
  };

  const handleReject = () => {
    if (!canApproveReject) return;
    updateAdminQuotation(row.quotationId, { status: 'rejected', updatedAt: new Date().toISOString().slice(0, 10) });
    refresh();
  };

  const handleDeleteConfirm = () => {
    deleteAdminQuotation(row.quotationId);
    router.push('/admin/quotations');
  };

  const handleOpenSurveyModal = () => {
    if (row.status === 'draft') {
      // Luôn kèm ?quotationId= dù đã có kế hoạch hay chưa — trang Kế hoạch & phân công tự phát hiện
      // kế hoạch đã liên kết (getAdminSchedulePlanByQuotationId) để mở đúng drawer sửa kế hoạch đó,
      // thay vì chỉ đưa về danh sách chung rồi bắt tìm lại thủ công.
      router.push(`/admin/coordination/planning?quotationId=${row.quotationId}`);
      return;
    }
    setSurveyForm(row.surveyAssignment ?? { assigneeName: ASSIGNEE_POOL[0], date: row.createdAt, time: '09:00', notes: '' });
    setIsSurveyModalOpen(true);
  };

  const handleSurveySubmit = () => {
    if (!surveyForm.assigneeName || !surveyForm.date || !surveyForm.time) return;
    updateAdminQuotation(row.quotationId, { surveyAssignment: surveyForm, updatedAt: new Date().toISOString().slice(0, 10) });
    refresh();
    setIsSurveyModalOpen(false);
  };

  // Chụp khối báo giá (letterhead + hạng mục + tổng kết) thành ảnh PNG rồi copy vào clipboard —
  // dynamic import html-to-image để không kéo lib vào bundle SSR/khi chưa bấm nút. Dùng html-to-image
  // (rasterize qua SVG foreignObject, để trình duyệt tự parse CSS) thay vì html2canvas vì html2canvas
  // không parse được màu oklch()/lab() mà Tailwind v4 xuất ra — báo lỗi "unsupported color function".
  const handleCopyImage = async () => {
    if (!quotationCardRef.current || copyState === 'copying') return;
    setCopyState('copying');
    try {
      const { toBlob } = await import('html-to-image');
      const blob = await toBlob(quotationCardRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      if (!blob) throw new Error('Không tạo được ảnh báo giá');

      if (typeof window !== 'undefined' && 'ClipboardItem' in window && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } else {
        // Trình duyệt không hỗ trợ copy ảnh vào clipboard (vd Firefox cũ) — tải ảnh về thay thế.
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bao-gia-${row.code}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
      setCopyState('copied');
    } catch (error) {
      console.error('Sao chép ảnh báo giá thất bại:', error);
      setCopyState('error');
    } finally {
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  // ---- Sửa hạng mục inline ----
  const startEditingItems = () => {
    setEditItems(row.items.map((it) => ({ ...it })));
    setEditNotes(row.notes ?? '');
    setDetailPage(1);
    setIsEditingItems(true);
  };

  const handleUpdateEditItemField = <K extends keyof AdminQuotationLineItem>(index: number, field: K, value: AdminQuotationLineItem[K]) => {
    setEditItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const handleAddManualEditItem = () => setEditItems((prev) => [...prev, emptyEditItem()]);

  const handleAddCatalogueEditItem = (catItem: (typeof QUOTATION_CATALOGUE)[number]) => {
    setEditItems((prev) => [
      ...prev,
      { id: `qi-edit-cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`, name: catItem.name, category: catItem.category, unit: catItem.unit, quantity: 1, unitPrice: catItem.price, discount: 0 },
    ]);
  };

  const handleRemoveEditItem = (index: number) => setEditItems((prev) => prev.filter((_, i) => i !== index));

  const editSubtotal = editItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const editDiscountTotal = editItems.reduce((sum, it) => sum + (it.discount ?? 0) * it.quantity, 0);
  const editTotalAmount = editSubtotal - editDiscountTotal;

  const handleSaveEditedItems = () => {
    updateAdminQuotation(row.quotationId, {
      items: editItems,
      notes: editNotes,
      subtotal: editSubtotal,
      discount: editDiscountTotal,
      totalAmount: editTotalAmount,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    refresh();
    setIsEditingItems(false);
  };

  // ---- Đối chiếu khảo sát ----
  const handleSyncFromSurvey = () => {
    if (!surveyReport) return;
    const syncedItems: AdminQuotationLineItem[] = surveyReport.quoteItems.map((item, idx) => ({
      id: `qi-survey-sync-${idx}-${Date.now()}`,
      name: item.name,
      category: item.category,
      unit: item.unit,
      unitPrice: item.price,
      quantity: item.quantity,
      discount: 0,
    }));
    const subtotal = syncedItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    updateAdminQuotation(row.quotationId, { items: syncedItems, subtotal, discount: 0, totalAmount: subtotal, updatedAt: new Date().toISOString().slice(0, 10) });
    setSyncSuccess(true);
    refresh();
  };

  const handleApproveFromSurvey = () => {
    updateAdminQuotation(row.quotationId, { status: 'approved', updatedAt: new Date().toISOString().slice(0, 10) });
    refresh();
  };

  return (
    <div className="p-6 print:p-0">
      <div className="flex items-center gap-1.5 text-sm text-slate-400 print:hidden">
        <span>Báo giá</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/admin/quotations" className="hover:text-blue-600 hover:underline">
          Danh sách báo giá
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-600">{row.code}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Báo giá {row.code}</h1>
            <Badge variant={QUOTATION_STATUS_META[row.status].variant}>{QUOTATION_STATUS_META[row.status].label}</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Phiên bản: v{row.version} | Tạo bởi: {row.assignee} (Kinh doanh)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {isEditingItems ? (
            <>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleSaveEditedItems}>
                <Check className="h-4 w-4" />
                Lưu thay đổi
              </Button>
              <Button variant="secondary" onClick={() => setIsEditingItems(false)}>
                <X className="h-4 w-4" />
                Hủy bỏ
              </Button>
            </>
          ) : (
            <>
              {row.status !== 'approved' && (
                <Button variant="secondary" onClick={handleOpenSurveyModal}>
                  <ClipboardCheck className="h-4 w-4" />
                  {row.status === 'draft'
                    ? linkedSurveyPlan
                      ? 'Đổi lịch phân công'
                      : 'Lập kế hoạch khảo sát báo giá'
                    : row.surveyAssignment
                      ? 'Đổi phân công khảo sát'
                      : 'Tạo phân công khảo sát báo giá'}
                </Button>
              )}
              {row.status === 'surveying' && surveyReport && (
                <Button variant="secondary" onClick={() => setIsSurveyComparisonOpen(true)}>
                  <GitCompare className="h-4 w-4 text-blue-600" />
                  Xem đối chiếu khảo sát
                </Button>
              )}
              {detailPage === 1 && (
                <>
                  <Button variant="secondary" onClick={handleCopyImage} isLoading={copyState === 'copying'}>
                    {copyState === 'copied' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    {copyState === 'copied' ? 'Đã sao chép!' : copyState === 'error' ? 'Sao chép lỗi' : 'Sao chép ảnh'}
                  </Button>
                  <Button variant="secondary" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" />
                    In báo giá
                  </Button>
                </>
              )}
              {canDelete && (
                <Button variant="secondary" onClick={() => setIsDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </Button>
              )}
              {canApproveReject && (
                <>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>
                    <CheckCircle2 className="h-4 w-4" />
                    Phê duyệt báo giá
                  </Button>
                  <Button variant="secondary" className="border-red-100 bg-red-50 text-red-600 hover:bg-red-100" onClick={handleReject}>
                    <X className="h-4 w-4" />
                    Từ chối
                  </Button>
                </>
              )}
              {row.status === 'approved' &&
                (linkedOrder ? (
                  <Link href={`/admin/orders_audit/${linkedOrder.orderId}`}>
                    <Button>
                      <FileSignature className="h-4 w-4" />
                      {`Xem đơn đặt ${linkedOrder.orderId}`}
                    </Button>
                  </Link>
                ) : (
                  <Button onClick={() => setIsCreateOrderOpen(true)}>
                    <FileSignature className="h-4 w-4" />
                    Sinh hợp đồng & đơn đặt
                  </Button>
                ))}
            </>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.25 }}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xs print:hidden"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Phân công khảo sát báo giá</h2>
          {row.status !== 'approved' && (
            <button
              type="button"
              onClick={handleOpenSurveyModal}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {row.status === 'draft' ? (linkedSurveyPlan ? 'Đổi lịch phân công' : 'Phân công') : row.surveyAssignment ? 'Đổi phân công' : 'Phân công'}
            </button>
          )}
        </div>
        <div className="mt-3">
          {row.status === 'draft' ? (
            !linkedSurveyPlan ? (
              <p className="text-sm text-slate-500">Chưa phân công khảo sát cho báo giá này.</p>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={linkedSurveyPlan.staffList[0]?.name ?? linkedSurveyPlan.manager} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {linkedSurveyPlan.staffList.map((s) => s.name).join(', ') || linkedSurveyPlan.manager}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {linkedSurveyActivity ? `${formatDate(linkedSurveyActivity.date)} · ${linkedSurveyActivity.startTime}` : formatDate(linkedSurveyPlan.eventDate)}
                      {` — Kế hoạch ${linkedSurveyPlan.id}`}
                    </p>
                  </div>
                </div>
                <Badge variant="info">Đã lập kế hoạch</Badge>
              </div>
            )
          ) : !row.surveyAssignment ? (
            <p className="text-sm text-slate-500">Chưa phân công khảo sát cho báo giá này.</p>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={row.surveyAssignment.assigneeName} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{row.surveyAssignment.assigneeName}</p>
                  <p className="truncate text-xs text-slate-400">
                    {formatDate(row.surveyAssignment.date)} · {row.surveyAssignment.time}
                    {row.surveyAssignment.notes ? ` — ${row.surveyAssignment.notes}` : ''}
                  </p>
                </div>
              </div>
              <Badge variant="info">Đã phân công</Badge>
            </div>
          )}
        </div>
      </motion.div>

      <div className="mt-6">
        {!isEditingItems && detailPage === 2 ? (
          <div className="space-y-6">
            <QuotationPicklistView row={row} />
            <div className="mx-auto max-w-4xl">
              <InventoryAvailabilityPanel items={equipmentCheckItems} />
            </div>
          </div>
        ) : (
          <motion.div
            ref={quotationCardRef}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.25 }}
            className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-8 shadow-xs"
          >
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
                <h3 className="text-lg font-bold uppercase tracking-widest text-slate-900">Báo giá chính thức</h3>
                <p className="mt-1 font-mono text-xs font-bold text-slate-500">Số: {row.code}</p>
                <div className="mt-4 space-y-1 text-xs text-slate-500">
                  <p>Ngày lập: {formatDate(row.createdAt)}</p>
                  <p>Cập nhật cuối: {formatDate(row.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Customer + terms */}
            <div className="mt-6 grid grid-cols-1 gap-8 rounded-xl border border-slate-100 bg-slate-50 p-5 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Đơn vị thụ hưởng (Khách hàng)</p>
                <div className="space-y-1.5 text-xs">
                  <p className="text-sm font-bold text-slate-900">{row.customerName}</p>
                  <p className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {row.customerPhone}
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-600">
                    <Mail className="h-3.5 w-3.5 text-slate-400" /> {detail.customerEmail}
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {detail.customerAddress}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Ghi chú điều khoản</p>
                  {isEditingItems ? (
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Ghi chú điều khoản hoặc mốc thanh toán..."
                      className="h-20 w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-xs italic leading-relaxed text-slate-700">{row.notes || 'Không có yêu cầu ghi chú gì thêm cho báo giá này.'}</p>
                  )}
                </div>
                <div className="space-y-1 text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">Chính sách chung:</p>
                  <p>• Báo giá có hiệu lực đến hết ngày {formatDate(row.validUntil)}.</p>
                  {generalPolicies.map((policy) => (
                    <p key={policy.policyId}>
                      • {policy.policyName}: <strong className="font-semibold text-slate-700">{policy.policyValue.toLocaleString('vi-VN')}{policy.unit}</strong>
                      {policy.description ? ` — ${policy.description}` : ''}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Items table / editor */}
            {isEditingItems ? (
              <div className="mt-6 space-y-4">
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="flex items-center gap-1 text-xs font-bold text-slate-700">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                    Thêm nhanh từ danh mục mẫu:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUOTATION_CATALOGUE.map((catItem) => (
                      <button
                        key={catItem.name}
                        type="button"
                        onClick={() => handleAddCatalogueEditItem(catItem)}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-2xs transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Plus className="h-3 w-3 text-blue-600" />
                        {catItem.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[720px] text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
                      <tr>
                        <th className="px-3 py-2.5">Tên hạng mục *</th>
                        <th className="w-40 px-3 py-2.5">Phân loại</th>
                        <th className="w-16 px-3 py-2.5 text-center">ĐVT</th>
                        <th className="w-16 px-3 py-2.5 text-center">SL</th>
                        <th className="w-28 px-3 py-2.5 text-right">Đơn giá (đ)</th>
                        <th className="w-24 px-3 py-2.5 text-right">Giảm giá/item</th>
                        <th className="w-28 px-3 py-2.5 text-right">Thành tiền</th>
                        <th className="w-10 px-3 py-2.5 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-6 text-center italic text-slate-400">
                            Chưa có hạng mục nào. Chọn từ danh mục mẫu hoặc bấm &quot;Thêm dòng nhập tay&quot; bên dưới.
                          </td>
                        </tr>
                      ) : (
                        editItems.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                required
                                placeholder="Nhập tên dịch vụ/thiết bị..."
                                value={item.name}
                                onChange={(e) => handleUpdateEditItemField(idx, 'name', e.target.value)}
                                className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <select
                                value={item.category}
                                onChange={(e) => handleUpdateEditItemField(idx, 'category', e.target.value)}
                                className="w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-xs focus:outline-none"
                              >
                                {ITEM_CATEGORY_OPTIONS.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                placeholder="Cái"
                                value={item.unit ?? ''}
                                onChange={(e) => handleUpdateEditItemField(idx, 'unit', e.target.value)}
                                className="w-full rounded border border-slate-200 bg-slate-50 px-1 py-1 text-center text-xs focus:outline-none"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => handleUpdateEditItemField(idx, 'quantity', Number(e.target.value) || 1)}
                                className="w-full rounded border border-slate-200 bg-slate-50 px-1 py-1 text-center text-xs font-bold focus:outline-none"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min={0}
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateEditItemField(idx, 'unitPrice', Number(e.target.value) || 0)}
                                className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right text-xs font-medium focus:outline-none"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min={0}
                                value={item.discount ?? 0}
                                onChange={(e) => handleUpdateEditItemField(idx, 'discount', Number(e.target.value) || 0)}
                                className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right text-xs font-medium text-red-600 focus:outline-none"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-slate-900">{formatCurrency((item.unitPrice - (item.discount ?? 0)) * item.quantity)}</td>
                            <td className="px-2 py-2 text-center">
                              <button type="button" onClick={() => handleRemoveEditItem(idx)} className="p-1 text-slate-400 transition hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={handleAddManualEditItem}
                  className="flex items-center gap-1 rounded bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:text-blue-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm dòng nhập tay
                </button>
              </div>
            ) : (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-900">Hạng mục báo giá</p>
                  {!isLinkedToContract && (
                    <button
                      type="button"
                      onClick={startEditingItems}
                      aria-label="Sửa hạng mục"
                      className="text-slate-400 hover:text-blue-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600">
                      <tr>
                        <th className="w-12 py-3 px-4 text-center">STT</th>
                        <th className="py-3 px-4">Tên hạng mục sự kiện / Dịch vụ</th>
                        <th className="w-28 py-3 px-4">Phân loại</th>
                        <th className="w-16 py-3 px-4 text-center">ĐVT</th>
                        <th className="w-16 py-3 px-4 text-center">SL</th>
                        <th className="w-28 py-3 px-4 text-right">Đơn giá</th>
                        <th className="w-24 py-3 px-4 text-right">Chiết khấu</th>
                        <th className="w-28 py-3 px-4 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {row.items.map((item, idx) => {
                        const lineTotal = (item.unitPrice - (item.discount ?? 0)) * item.quantity;
                        return (
                          <tr key={item.id}>
                            <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                            <td className="py-3 px-4 text-slate-600">{item.category}</td>
                            <td className="py-3 px-4 text-center text-slate-600">{item.unit ?? '—'}</td>
                            <td className="py-3 px-4 text-center font-bold text-slate-800">{item.quantity}</td>
                            <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-3 px-4 text-right font-medium text-red-600">-{formatCurrency(item.discount ?? 0)}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-950">{formatCurrency(lineTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-xs space-y-2 border-t border-slate-100 pt-4 text-sm">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Tổng tiền dịch vụ:</span>
                  <span className="font-medium text-slate-800">{formatCurrency(isEditingItems ? editSubtotal : row.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Khấu trừ giảm giá:</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(isEditingItems ? editDiscountTotal : row.discount)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 text-base">
                  <span className="font-black text-slate-900">Thành tiền (VND):</span>
                  <span className="text-xl font-bold text-blue-600">{formatCurrency(isEditingItems ? editTotalAmount : row.totalAmount)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Pagination dots — chuyển giữa "Báo giá chính thức" và "Picklist chi tiết" */}
      {!isEditingItems && (
        <div className="mx-auto my-4 flex max-w-4xl flex-col items-center justify-center gap-2 border-y border-slate-100 py-4 print:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDetailPage(1)}
              title="Trang 1: Báo giá chính thức"
              className={`h-3.5 w-3.5 rounded-full transition-all focus:outline-none ${detailPage === 1 ? 'scale-125 bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-300 hover:bg-slate-400'}`}
            />
            <button
              type="button"
              onClick={() => setDetailPage(2)}
              title="Trang 2: Picklist chi tiết vật tư"
              className={`h-3.5 w-3.5 rounded-full transition-all focus:outline-none ${detailPage === 2 ? 'scale-125 bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-300 hover:bg-slate-400'}`}
            />
          </div>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {detailPage === 1 ? 'Đang xem: Trang 1/2 — Bản đề xuất báo giá chính thức' : 'Đang xem: Trang 2/2 — Bản kê Picklist chi tiết vật tư chuẩn bị kho'}
          </p>
        </div>
      )}

      {row.status === 'surveying' && surveyReport && (
        <Modal isOpen={isSurveyComparisonOpen} onClose={() => setIsSurveyComparisonOpen(false)} size="2xl" footer={<Button variant="secondary" onClick={() => setIsSurveyComparisonOpen(false)}>Đóng</Button>}>
          <SurveyComparisonPanel
            quotationItems={row.items}
            surveyReport={surveyReport}
            syncSuccess={syncSuccess}
            onSync={handleSyncFromSurvey}
            onApprove={handleApproveFromSurvey}
          />
        </Modal>
      )}

      {row.status === 'approved' && !linkedOrder && (
        <CreateOrderFromQuotationModal
          isOpen={isCreateOrderOpen}
          onClose={() => setIsCreateOrderOpen(false)}
          quotation={row}
          onSaved={() => setIsCreateOrderOpen(false)}
        />
      )}

      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Xóa báo giá"
        subtitle={`Bạn có chắc muốn xóa báo giá ${row.code}? Hành động này không thể hoàn tác.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Xóa báo giá
            </Button>
          </>
        }
      >
        <div />
      </Modal>

      <Modal
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
        title="Tạo phân công khảo sát báo giá"
        subtitle={`Chọn nhân viên đi khảo sát hiện trường để làm căn cứ lập báo giá ${row.code}.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSurveyModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSurveySubmit}>Lưu phân công</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Nhân viên khảo sát"
            required
            value={surveyForm.assigneeName}
            onChange={(e) => setSurveyForm((prev) => ({ ...prev, assigneeName: e.target.value }))}
            options={ASSIGNEE_POOL.map((name) => ({ value: name, label: name }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ngày khảo sát"
              type="date"
              required
              value={surveyForm.date}
              onChange={(e) => setSurveyForm((prev) => ({ ...prev, date: e.target.value }))}
            />
            <Input
              label="Giờ khảo sát"
              type="time"
              required
              value={surveyForm.time}
              onChange={(e) => setSurveyForm((prev) => ({ ...prev, time: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Ghi chú</label>
            <textarea
              rows={3}
              value={surveyForm.notes}
              onChange={(e) => setSurveyForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Ví dụ: cần khảo sát mặt bằng sảnh, lối vận chuyển thiết bị..."
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
