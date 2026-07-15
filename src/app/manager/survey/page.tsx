'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, Compass, Eye, FileText, MapPin, Plus, Search, User } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import type { PaginationState } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import SurveyDetailDrawer from '@/components/survey-reports/SurveyDetailDrawer';
import SurveyCreateDrawer from '@/components/survey-reports/SurveyCreateDrawer';
import {
  AdminSurveyReport,
  SURVEY_REPORT_STATUS_META,
  SurveyReportStatus,
  addAdminSurveyReport,
  getAdminSurveyReports,
  updateAdminSurveyReport,
} from '@/mocks/db';

// Trang thuần giao diện — xem giải thích ở đầu src/mocks/db/surveyReports.ts. Mirror 1:1 của
// src/app/admin/reports/survey/page.tsx cho Manager (cùng dữ liệu mock, cùng component dùng chung),
// chỉ khác đường dẫn route (/manager/survey thay vì /admin/reports/survey). Bố cục dạng drawer trượt
// từ phải theo đúng mẫu docs/components/SurveySection.tsx — không có trang chi tiết riêng.

const STATUS_TABS: { value: SurveyReportStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING_CONFIRM', label: 'Chờ xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
];

export default function ManagerSurveyReportsPage() {
  const [reports, setReports] = useState<AdminSurveyReport[]>(() => getAdminSurveyReports());
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<SurveyReportStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [selectedReport, setSelectedReport] = useState<AdminSurveyReport | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const countPending = reports.filter((r) => r.status === 'PENDING_CONFIRM').length;
  const countConfirmed = reports.filter((r) => r.status === 'CONFIRMED').length;
  const countDraft = reports.filter((r) => r.status === 'DRAFT').length;

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (!term) return true;
      return (
        r.id.toLowerCase().includes(term) ||
        r.orderId.toLowerCase().includes(term) ||
        r.customerName.toLowerCase().includes(term) ||
        r.location.toLowerCase().includes(term)
      );
    });
  }, [reports, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / limit));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredReports.slice((safePage - 1) * limit, safePage * limit);
  const paginationState: PaginationState = { currentPage: safePage, totalPages, totalItems: filteredReports.length, limit };

  const handleCreateSubmit = (report: AdminSurveyReport) => {
    addAdminSurveyReport(report);
    setReports(getAdminSurveyReports());
    setIsCreateOpen(false);
  };

  const handleConfirm = (id: string) => {
    setConfirmingId(id);
  };

  const handleConfirmAction = () => {
    if (!confirmingId) return;
    updateAdminSurveyReport(confirmingId, { status: 'CONFIRMED' });
    setReports(getAdminSurveyReports());
    setSelectedReport((prev) => (prev && prev.id === confirmingId ? { ...prev, status: 'CONFIRMED' } : prev));
    setConfirmingId(null);
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Khảo sát hiện trường</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý báo cáo khảo sát hiện trường phục vụ lập kế hoạch & báo giá.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo báo cáo khảo sát
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-xs"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tổng số báo cáo</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{reports.length}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
            <Compass className="h-5 w-5" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="flex items-center justify-between rounded-xl border border-amber-100/60 bg-amber-50/60 p-4 shadow-xs"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Chờ xác nhận</p>
            <p className="mt-1 text-xl font-bold text-amber-700">{countPending}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="flex items-center justify-between rounded-xl border border-emerald-100/60 bg-emerald-50/60 p-4 shadow-xs"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Đã xác nhận</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{countConfirmed}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.25, delay: 0.15 }}
          className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50 p-4 shadow-xs"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bản nháp/Khác</p>
            <p className="mt-1 text-xl font-bold text-slate-600">{countDraft}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <FileText className="h-5 w-5" />
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.25 }}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm mã báo cáo, mã đơn đặt, khách hàng, địa điểm..."
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === tab.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Mã báo cáo</th>
                <th className="px-4 py-3">Mã đơn đặt</th>
                <th className="px-4 py-3">Khách hàng / Sự kiện</th>
                <th className="px-4 py-3">Ngày khảo sát</th>
                <th className="px-4 py-3">Địa điểm</th>
                <th className="px-4 py-3">Người phụ trách</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pageRows.length > 0 ? (
                pageRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{r.id}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-100 px-2 py-1 font-mono font-medium text-slate-800">{r.orderId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{r.customerName}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{r.eventName}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-500">{r.surveyDate}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600" title={r.location}>
                      {r.location}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {r.assignee}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={SURVEY_REPORT_STATUS_META[r.status].variant}>{SURVEY_REPORT_STATUS_META[r.status].label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedReport(r)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <MapPin className="mx-auto h-6 w-6 text-slate-300" />
                    <p className="mt-2 text-sm font-medium text-slate-500">Không tìm thấy báo cáo khảo sát nào</p>
                    <p className="text-xs text-slate-400">Nhập lại từ khóa hoặc chuyển đổi trạng thái xem.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination pagination={paginationState} onPageChange={setPage} />
      </motion.div>

      <AnimatePresence>
        {selectedReport && (
          <SurveyDetailDrawer report={selectedReport} onClose={() => setSelectedReport(null)} onConfirm={handleConfirm} />
        )}
      </AnimatePresence>

      <SurveyCreateDrawer isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreateSubmit} />

      <Modal
        isOpen={Boolean(confirmingId)}
        onClose={() => setConfirmingId(null)}
        title="Xác nhận báo cáo khảo sát?"
        subtitle={
          confirmingId
            ? `Bạn đang phê duyệt thông số khảo sát của báo cáo ${confirmingId}. Dữ liệu đo đạc này sẽ dùng làm căn cứ lập kế hoạch & báo giá.`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmingId(null)}>
              Hủy bỏ
            </Button>
            <Button onClick={handleConfirmAction}>
              <CheckCircle2 className="h-4 w-4" />
              Đồng ý phê duyệt
            </Button>
          </>
        }
      >
        <div />
      </Modal>
    </div>
  );
}
