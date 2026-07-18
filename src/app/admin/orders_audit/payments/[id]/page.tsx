'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, Check, CheckCircle2, ChevronLeft, Copy, Download, FileText, MapPin, Pencil, Phone, Trash2, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import Reveal from '@/components/ui/Reveal';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import {
  DEPOSIT_STATUS_META,
  PAYMENT_METHOD_OPTIONS,
  computeOrderFinancials,
  confirmDeposit,
  getOrderPaymentViewById,
  getDepositTransferContent,
  updateDepositAmount,
} from '@/mocks/db';

// Trang thuần giao diện — xem giải thích ở đầu src/mocks/db/payments.ts. Trước đây là 1 trong 2 tab
// của trang "Đặt cọc & thanh toán" — theo yêu cầu người dùng, tách hẳn thành màn riêng cho "Đặt cọc".
// Nội dung quyết toán cuối kỳ giờ ở /admin/orders_audit/settlements/[id]. Card tối tổng quan đơn hàng,
// hồ sơ yêu cầu tạm ứng cọc kèm chứng từ + cổng VietQR minh họa (mã QR chỉ là hoa văn trang trí, không
// phải mã thật). Xác nhận cọc chỉ cập nhật state cục bộ qua mock.

function paymentMethodLabel(value: string | null): string {
  if (!value) return '-';
  return PAYMENT_METHOD_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function FakeVietQrCode({ seed }: Readonly<{ seed: string }>) {
  const size = 17;
  const cells = useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const arr: boolean[] = [];
    for (let i = 0; i < size * size; i += 1) {
      h = (h * 1103515245 + 12345) >>> 0;
      arr.push((h >>> 16) % 2 === 0);
    }
    return arr;
  }, [seed]);

  return (
    <div>
      <p className="text-center text-lg font-black tracking-tight">
        <span className="text-red-500">VIET</span>
        <span className="text-slate-800">QR</span>
      </p>
      <div className="mt-2 grid gap-px" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {cells.map((on, i) => (
          <span key={i} className={`aspect-square ${on ? 'bg-slate-900' : 'bg-white'}`} />
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] font-semibold text-slate-400">napas 247 · VietinBank</p>
    </div>
  );
}

export default function OrderDepositDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState(() => getOrderPaymentViewById(params.id));
  const [confirmMethod, setConfirmMethod] = useState('bank_transfer');
  const [copied, setCopied] = useState(false);
  const [isEditingDeposit, setIsEditingDeposit] = useState(false);
  const [editDepositAmount, setEditDepositAmount] = useState('');

  if (!order) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">Không tìm thấy đơn đặt.</p>
        <Link href="/admin/orders_audit/payments" className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const transferContent = getDepositTransferContent(order, order.orderCode);
  const { paidAmount, remainingAmount } = computeOrderFinancials(order);

  const refresh = () => setOrder(getOrderPaymentViewById(order.orderId));

  const handleConfirmDeposit = () => {
    confirmDeposit(order.orderId, confirmMethod);
    refresh();
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(transferContent).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleOpenEditDeposit = () => {
    setEditDepositAmount(String(order.depositAmount));
    setIsEditingDeposit(true);
  };

  const handleCancelEditDeposit = () => {
    setIsEditingDeposit(false);
  };

  const handleSaveDepositAmount = () => {
    const amount = Number(editDepositAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    updateDepositAmount(order.orderId, amount);
    refresh();
    setIsEditingDeposit(false);
  };

  return (
    <div className="p-6">
      <Link href="/admin/orders_audit/payments" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600">
        <ChevronLeft className="h-4 w-4" />
        Quay lại danh sách
      </Link>

      <Reveal className="rounded-2xl bg-[#0F172A] p-6 text-white">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex rounded-full bg-indigo-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-indigo-300">
              Thông tin đơn hàng
            </span>
            <h1 className="mt-2 text-2xl font-bold text-white">{order.eventTitle}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(order.eventDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {order.venue}
              </span>
            </div>
            <div className="mt-4">
              <p className="font-semibold text-white">Khách hàng: {order.customerName}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300">
                <Phone className="h-3.5 w-3.5" />
                {order.customerPhone}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[520px]">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Tổng giá trị đơn</p>
              <p className="mt-1 text-lg font-bold text-white">{formatCurrency(order.totalValue)}</p>
              <p className="mt-1 text-xs text-slate-400">Giá trị thanh lý hợp đồng</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Số tiền đã trả</p>
              <p className="mt-1 text-lg font-bold text-emerald-400">{formatCurrency(paidAmount)}</p>
              <p className="mt-1 text-xs text-slate-400">Khớp dữ liệu kế toán</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Số tiền còn lại</p>
              <p className="mt-1 text-lg font-bold text-rose-400">{formatCurrency(remainingAmount)}</p>
              <p className="mt-1 text-xs text-rose-300/80">Chờ đối soát quyết toán</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-slate-300">
              Trạng thái đặt cọc:{' '}
              <span className="ml-1 inline-flex rounded-full bg-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-200">
                {DEPOSIT_STATUS_META[order.depositStatus].label.toUpperCase()}
              </span>
            </span>
            <span className="text-slate-300">
              Trạng thái sự kiện: <span className="font-bold text-white">{order.eventStatus}</span>
            </span>
          </div>
          <p className="text-xs italic text-slate-400">Nhân viên quản lý: {order.managerName}</p>
        </div>
      </Reveal>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Reveal className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Hồ sơ yêu cầu tạm ứng cọc
            </p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${DEPOSIT_STATUS_META[order.depositStatus].badgeClass}`}>
              {DEPOSIT_STATUS_META[order.depositStatus].label.toUpperCase()}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Mã yêu cầu cọc</p>
              <p className="mt-1 font-bold text-slate-900">{order.depositCode}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Số tiền cọc</p>
              {isEditingDeposit ? (
                <div className="mt-1 flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    step={100_000}
                    autoFocus
                    value={editDepositAmount}
                    onChange={(e) => setEditDepositAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveDepositAmount();
                      if (e.key === 'Escape') handleCancelEditDeposit();
                    }}
                    className="w-32 rounded-md border border-blue-300 px-2 py-1 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={handleSaveDepositAmount} aria-label="Lưu số tiền cọc" className="text-emerald-600 hover:text-emerald-700">
                    <Check className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={handleCancelEditDeposit} aria-label="Hủy chỉnh sửa" className="text-slate-400 hover:text-red-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-1.5">
                  <p className="font-bold text-slate-900">{formatCurrency(order.depositAmount)}</p>
                  {order.depositStatus === 'PENDING' && (
                    <button type="button" onClick={handleOpenEditDeposit} aria-label="Chỉnh sửa số tiền cọc" className="text-slate-400 hover:text-blue-600">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Hạn thanh toán</p>
              <p className="mt-1 font-semibold text-slate-800">{formatDate(order.depositDueDate)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Ngày thanh toán</p>
              <p className={`mt-1 font-semibold ${order.depositPaymentDate ? 'text-emerald-600' : 'text-slate-400'}`}>
                {order.depositPaymentDate ? formatDate(order.depositPaymentDate) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Phương thức</p>
              <p className="mt-1 font-semibold text-slate-800">{paymentMethodLabel(order.paymentMethod)}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-700">Nội dung chuyển khoản</p>
            <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <span className="truncate font-mono text-sm uppercase text-slate-700">{transferContent}</span>
              <button type="button" onClick={handleCopy} aria-label="Sao chép nội dung" className="shrink-0 text-slate-400 hover:text-blue-600">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-700">Tải lên chứng từ thanh toán (Ủy nhiệm chi / Hóa đơn ngân hàng)</p>
            <div className="mt-2 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-4">
              {order.depositEvidence ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">{order.depositEvidence.fileName}</p>
                      <p className="text-xs text-slate-400">{order.depositEvidence.note}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100">
                      Thay thế
                    </button>
                    <button type="button" className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
                      <Trash2 className="h-3.5 w-3.5" />
                      Xóa chứng từ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                  <UploadCloud className="h-6 w-6 text-emerald-400" />
                  <p className="text-sm text-slate-500">Chưa có chứng từ thanh toán được tải lên.</p>
                </div>
              )}
            </div>
          </div>

          {order.accountantNote && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-700">Ghi chú đối soát của kế toán</p>
              <div className="mt-1.5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{order.accountantNote}</div>
            </div>
          )}

          {order.depositStatus === 'RECEIVED' ? (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm font-bold text-emerald-700">Đã hoàn thành thủ tục tạm ứng cọc</p>
                <p className="mt-0.5 text-sm text-emerald-600">
                  Hóa đơn cọc được đối soát hoàn tất và lưu vết bảo mật. Không cần thao tác duyệt bổ sung.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">Xác nhận đã nhận cọc</p>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div className="min-w-[220px] flex-1">
                  <Select label="Phương thức" value={confirmMethod} onChange={(e) => setConfirmMethod(e.target.value)} options={PAYMENT_METHOD_OPTIONS} />
                </div>
                <Button onClick={handleConfirmDeposit}>Xác nhận đã nhận cọc</Button>
              </div>
            </div>
          )}
        </Reveal>

        <Reveal delay={0.05} className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-bold text-slate-900">Cổng thanh toán VietQR</p>
          <p className="mt-1 text-xs text-slate-400">Quét mã để hoàn thành nhanh tiền cọc</p>

          <div className="mt-4 flex justify-center">
            <div className="w-full max-w-[220px] rounded-xl border border-slate-200 p-3">
              <FakeVietQrCode seed={transferContent} />
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">Số tiền cần đóng</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(order.depositAmount)}</p>
          </div>

          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-400">Nội dung bắt buộc:</p>
            <p className="mt-0.5 break-all font-mono text-sm font-semibold text-slate-700">{transferContent}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary">
              <Download className="h-4 w-4" />
              Tải mã QR
            </Button>
            <Button onClick={handleCopy}>
              <Copy className="h-4 w-4" />
              {copied ? 'Đã chép!' : 'Sao chép'}
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
