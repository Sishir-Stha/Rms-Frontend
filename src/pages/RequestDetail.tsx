import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Building, Calendar, CheckCircle2, Clock, Hash, Minus, Monitor, Package, Plus, Save, Tag, User, XCircle, type LucideIcon } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchDepartments } from '../services/departments.service';
import {
  approveDeviceRequestById,
  deleteDeviceRequestById,
  fetchDeviceRequestById,
  fetchRequestHistory,
  processSplitFulfillment,
  updateDeviceRequestById,
} from '../services/device-request.service';
import { fetchUsers } from '../services/user.service';
import type { Priority, RequestApprovalStatus } from '../types/app';
import type { RepairDepartmentOption, RepairUserOption } from '../types/repair.types';
import { formatDeviceRequestStatus } from '../utils/device-request-status';
import {
  isRequestViewerOnly, canEditDeviceDetails, canEditRequesterInformation,
  canUpdateDeviceQuantity, canEditPartialAndExpense, canViewRequestedStatus, canViewRecommendedStatus,
  canViewApprovedStatus, canViewRejectedStatus, canViewFulfilledStatus, canFulfillRequestStatus,
  canActOnRequested, canActOnRecommended, canDeleteDeviceRequest,
} from '../utils/access-control';

interface RequestDetailFormState {
  requestId: number; display_id: string; requestedById: number; requestedFor: string; departmentId: number;
  deviceType: string; brand: string; reason: string; requestDate: string; approvalStatus: RequestApprovalStatus;
  approvedById: number | null; approvedByName: string | null; approvalDate: string; priority: Priority;
  quantity: number; is_deleted: boolean; original_request_id: number | null; split_info: string | null;
  expenseWithoutVat: number; expenseWithVat: number;
}

interface InfoRowProps { icon: LucideIcon; label: string; value: string | number | null | undefined }
interface TimelineItem { color: string; title: string; date: string; notes?: string }
interface TimelineEventProps extends TimelineItem { last: boolean }

const FIELD_LABEL = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';
const SECTION_TITLE = 'flex items-center gap-2 font-semibold text-sm mb-4';
const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
const REQUEST_STATUSES: RequestApprovalStatus[] = ['Requested', 'Pending', 'Approved', 'Rejected', 'Fulfilled'];

const formatDateInputValue = (v: string | null): string => v ? v.slice(0, 10) : '';
const toNullableDate = (v: string): string | null => v.trim() === '' ? null : v;
const parseRequestId = (v: string | undefined): number | null => {
  if (!v) return null;
  const match = v.match(/(?:REQ-)?(\d+)/);
  return match ? Number(match[1]) : null;
};

const createRequestForm = (r: any): RequestDetailFormState => ({
  requestId: r.requestId, display_id: r.id || `REQ-${r.requestId}`, requestedById: r.requestedById, requestedFor: r.requestedFor || '', departmentId: r.departmentId,
  deviceType: r.deviceType, brand: r.brand || '', reason: r.reason, requestDate: formatDateInputValue(r.requestDate),
  approvalStatus: r.approvalStatus, approvedById: r.approvedById, approvedByName: r.approvedBy,
  approvalDate: formatDateInputValue(r.approvalDate), priority: r.priority, quantity: r.quantity,
  is_deleted: r.isDeleted ?? false, original_request_id: r.originalRequestId ?? null, split_info: r.splitInfo ?? null,
  expenseWithoutVat: Number(r.expenseWithoutVat || r.expense_without_vat || 0),
  expenseWithVat: Number(r.expenseWithVat || r.expense_with_vat || 0),
});

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--primary-lighter)' }}><Icon size={13} style={{ color: 'var(--primary)' }} /></div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{label}</p>
        <p className="text-sm font-medium mt-0.5 break-words" style={{ color: 'var(--on-surface)' }}>{value !== null && value !== undefined && value !== '' ? String(value) : '-'}</p>
      </div>
    </div>
  );
}

function TimelineEvent({ color, title, date, notes, last }: TimelineEventProps) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: color }} />
        {!last && <div className="w-px flex-1 mt-1" style={{ background: 'var(--border-color)', minHeight: '24px' }} />}
      </div>
      <div className="pb-4">
        <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>{title}</p>
        {notes && <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{notes}</p>}
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{date}</p>
      </div>
    </div>
  );
}

export default function RequestDetail() {
  const { id } = useParams<'id'>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const viewOnly = isRequestViewerOnly(currentUser?.email);
    const deviceDetailsBase = canEditDeviceDetails(currentUser?.email);
  const requesterInfoEditable = canEditRequesterInformation(currentUser?.email);
  const quantityEditable = canUpdateDeviceQuantity(currentUser?.email);
  const partialAndExpenseEditable = canEditPartialAndExpense(currentUser?.email);

  const [form, setForm] = useState<RequestDetailFormState | null>(null);
  const [users, setUsers] = useState<RepairUserOption[]>([]);
  const [departments, setDepartments] = useState<RepairDepartmentOption[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [partialFulfilledQty, setPartialFulfilledQty] = useState<number>(0);
  const [expenseWithoutVatInput, setExpenseWithoutVatInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canViewRequested = currentUser?.email ? canViewRequestedStatus(currentUser.email) : true;
  const canViewRecommended = currentUser?.email ? canViewRecommendedStatus(currentUser.email) : true;
  const canViewApproved = currentUser?.email ? canViewApprovedStatus(currentUser.email) : true;
  const canViewRejected = currentUser?.email ? canViewRejectedStatus(currentUser.email) : true;
  const canViewFulfilled = currentUser?.email ? canViewFulfilledStatus(currentUser.email) : true;
  const canFulfillRequest = currentUser?.email ? canFulfillRequestStatus(currentUser.email) : false;
  const canActOnReq = currentUser?.email ? canActOnRequested(currentUser.email) : false;
  const canActOnRec = currentUser?.email ? canActOnRecommended(currentUser.email) : false;
  const canDeleteRequest = currentUser?.email ? canDeleteDeviceRequest(currentUser.email) : false;
  const requestedActionLabel = 'Recommend';

  const isAnjana = currentUser?.email?.trim().toLowerCase() === 'anjana@yetiairlines.com';
  const isSishir = currentUser?.email?.trim().toLowerCase() === 'sishir@yetiairlines.com';
  const canEditExpenseWithoutVat = isAnjana || isSishir;

  const userEmailLc = (currentUser?.email || '').trim().toLowerCase();
  const userNameLc = (currentUser?.name || '').trim().toLowerCase();
  const isUmesh = userEmailLc.includes('umesh') || userNameLc.includes('umesh');
  const isSpecialUser =
    userEmailLc === 'anjana@yetiairlines.com' || userNameLc.includes('anjana') ||
    userEmailLc === 'sishir@yetiairlines.com' || userNameLc.includes('sishir') ||
    userEmailLc === 'sudharshan@yetiairlines.com' || userNameLc.includes('sudharshan') ||
    isUmesh;
  const isOtherUser = !isSpecialUser;

  useEffect(() => {
    const abortController = new AbortController();
    const requestId = parseRequestId(id);
    if (requestId === null) { setForm(null); setErrorMessage(`No record found for ${id}`); setIsLoading(false); return () => { abortController.abort() } }

    const load = async () => {
      setIsLoading(true); setErrorMessage(null);
      try {
        const [requestDetail, userOptions, departmentOptions, historyData] = await Promise.all([
          fetchDeviceRequestById(requestId, abortController.signal),
          fetchUsers(),
          fetchDepartments(abortController.signal),
          fetchRequestHistory(requestId).catch(() => [])
        ]);
        if (abortController.signal.aborted) return;
        setUsers(userOptions); setDepartments(departmentOptions);
        setForm(createRequestForm(requestDetail));
        setHistory(historyData);
        setPartialFulfilledQty((requestDetail as any).plannedFulfilledQty ?? requestDetail.quantity ?? 0);
        const loadedWithoutVat = Number((requestDetail as any).expenseWithoutVat ?? (requestDetail as any).expense_without_vat ?? 0);
        setExpenseWithoutVatInput(loadedWithoutVat > 0 ? String(loadedWithoutVat) : '');
      } catch (error) {
        if (abortController.signal.aborted) return;
        setForm(null); setErrorMessage(error instanceof Error ? error.message : 'Unable to load request detail.');
      } finally { if (!abortController.signal.aborted) setIsLoading(false) }
    };
    void load();
    return () => { abortController.abort() };
  }, [id]);

  const selectedRequester = useMemo(() => users.find((u) => u.user_id === form?.requestedById) ?? null, [form?.requestedById, users]);
  const selectedDepartment = useMemo(() => departments.find((d) => d.department_id === form?.departmentId) ?? null, [departments, form?.departmentId]);

  const canViewThisRequest = useMemo(() => {
    if (!form) return true;
    if (form.approvalStatus === 'Requested' && !canViewRequested) return false;
    if (form.approvalStatus === 'Pending' && !canViewRecommended) return false;
    if (form.approvalStatus === 'Approved' && !canViewApproved) return false;
    if (form.approvalStatus === 'Rejected' && !canViewRejected) return false;
    if (form.approvalStatus === 'Fulfilled' && !canViewFulfilled) return false;
    return true;
  }, [form, canViewRequested, canViewRecommended, canViewApproved, canViewRejected, canViewFulfilled]);

  if (isLoading) return <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}><div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" /><p className="text-sm mt-4" style={{ color: 'var(--muted)' }}>Loading request detail...</p></div>;

  if (!form) return (
    <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
      <AlertCircle size={48} style={{ color: 'var(--muted)' }} />
      <h2 className="font-bold text-lg mt-4" style={{ color: 'var(--on-surface)' }}>Request Not Found</h2>
      <p className="text-sm mt-1 mb-5" style={{ color: 'var(--muted)' }}>{errorMessage ?? `No record found for ${id}`}</p>
      <button onClick={() => navigate('/requests')} className="btn-primary">&larr; Back to Requests</button>
    </div>
  );

  if (!canViewThisRequest) return (
    <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
      <AlertCircle size={48} style={{ color: 'var(--muted)' }} />
      <h2 className="font-bold text-lg mt-4" style={{ color: 'var(--on-surface)' }}>Access Denied</h2>
      <p className="text-sm mt-1 mb-5" style={{ color: 'var(--muted)' }}>You do not have permission to view this request.</p>
      <button onClick={() => navigate('/requests')} className="btn-primary">&larr; Back to Requests</button>
    </div>
  );

    const isFulfilledViewOnly = currentUser?.email?.trim().toLowerCase() === 'sudharshan@yetiairlines.com' && form.approvalStatus === 'Fulfilled';

 
  const lockedStatuses: RequestApprovalStatus[] = ['Pending', 'Approved', 'Rejected', 'Fulfilled'];
  const lockDeviceEdits = (isUmesh || isOtherUser) && lockedStatuses.includes(form.approvalStatus);
  const deviceDetailsEditable = deviceDetailsBase && !lockDeviceEdits;

  const quantityOnlyEditable = quantityEditable && form.approvalStatus === 'Pending';
  const quantityEnabled = !isFulfilledViewOnly && (deviceDetailsEditable || quantityOnlyEditable) && !lockDeviceEdits;
  const showPartialAndExpense = form.approvalStatus === 'Approved' || form.approvalStatus === 'Fulfilled';
  const partialEditable = form.approvalStatus === 'Approved' && (partialAndExpenseEditable || canFulfillRequest) && !lockDeviceEdits;

  const expenseWithoutVatEditable = showPartialAndExpense && canEditExpenseWithoutVat && !(isAnjana && form.approvalStatus === 'Fulfilled');

  const setField = <Key extends keyof RequestDetailFormState>(key: Key, value: RequestDetailFormState[Key]) => {
    setForm((cur) => (cur ? { ...cur, [key]: value } : cur));
  };

  const handleStatusChange = (nextStatus: RequestApprovalStatus) => {
    setForm((cur) => {
      if (!cur) return cur;
      if (nextStatus === 'Requested' || nextStatus === 'Pending') return { ...cur, approvalStatus: nextStatus, approvedById: null, approvedByName: null, approvalDate: '' };
      const today = new Date().toISOString().slice(0, 10);
      return { ...cur, approvalStatus: nextStatus, approvedById: cur.approvedById ?? currentUser?.id ?? null, approvedByName: cur.approvedByName ?? currentUser?.name ?? null, approvalDate: cur.approvalDate || today };
    });
  };

   const performSave = async (): Promise<boolean> => {
    if (!form) return false;
    if (!form.requestedById || !form.departmentId || !form.requestedFor.trim() || !form.deviceType.trim()) { showToast('Requester, department, requested for, and device type are required', 'error'); return false; }
    
    // FIX: if quantity changed and partial is now > quantity, clamp partial to new quantity
    let adjustedPartial = partialFulfilledQty;
    if (adjustedPartial > form.quantity) {
      adjustedPartial = form.quantity;
      setPartialFulfilledQty(adjustedPartial);
    }

    try {
      await updateDeviceRequestById(form.requestId, {
        requested_by: form.requestedById, department_id: form.departmentId, device_type: form.deviceType.trim(),
        brand: form.brand.trim(), reason: form.reason.trim(), quantity: form.quantity, priority: form.priority,
        requested_for: form.requestedFor.trim(), request_date: toNullableDate(form.requestDate),
        approval_status: form.approvalStatus, approved_by: form.approvedById, approval_date: toNullableDate(form.approvalDate),
        planned_fulfilled_qty: form.approvalStatus === 'Approved' ? adjustedPartial : null,
        updated_by: currentUser?.id ?? null,
        expense_without_vat: showPartialAndExpense ? form.expenseWithoutVat : null,
        expense_with_vat: showPartialAndExpense ? form.expenseWithVat : null,
      } as any);
      const refreshed = await fetchDeviceRequestById(form.requestId);
      setForm(createRequestForm(refreshed));
      const refreshedPartial = (refreshed as any).plannedFulfilledQty ?? refreshed.quantity ?? 0;
      setPartialFulfilledQty(Math.min(refreshedPartial, refreshed.quantity));
      const latestHistory = await fetchRequestHistory(form.requestId).catch(() => []);
      setHistory(latestHistory);

      return true;
    } catch (error) { showToast(error instanceof Error ? error.message : 'Failed to update device request.', 'error'); return false; }
  };

  const handleSave = async () => { setIsSaving(true); const ok = await performSave(); if (ok) showToast(`${form?.display_id} updated successfully`, 'success'); setIsSaving(false); };

  const handleApproval = async (nextStatus: 'Approved' | 'Rejected' | 'Fulfilled' | 'Pending') => {
    if (!currentUser) { showToast('You must be logged in to review requests', 'error'); return; }
    setIsSaving(true);
    try {
      const ok = await performSave(); if (!ok) { setIsSaving(false); return; }
      await approveDeviceRequestById(form!.requestId, { approval_status: nextStatus, approved_by: currentUser.id });
      const refreshed = await fetchDeviceRequestById(form!.requestId);
      setForm(createRequestForm(refreshed));
      let msg = `${form!.display_id} ${nextStatus.toLowerCase()}`; let type: 'success' | 'info' = 'info';
      if (nextStatus === 'Approved' || nextStatus === 'Fulfilled' || nextStatus === 'Pending') { msg = nextStatus === 'Pending' ? `${form!.display_id} recommended` : `${form!.display_id} ${nextStatus.toLowerCase()}`; type = 'success'; }
      showToast(msg, type);
    } catch (error) { showToast(error instanceof Error ? error.message : `Failed to mark request as ${nextStatus}.`, 'error'); }
    finally { setIsSaving(false); setShowRejectDialog(false); }
  };

    const handleFulfill = async () => {
    if (!currentUser || !form) return;
    setIsSaving(true);
    try {
      // FIX: persist pending edits (expenses, quantity, etc.) BEFORE fulfilling
      const ok = await performSave();
      if (!ok) { setIsSaving(false); return; }

      if (partialFulfilledQty < form.quantity) {
        await processSplitFulfillment(form.requestId, {
          fulfilled_quantity: partialFulfilledQty,
          performed_by: Number(currentUser?.id || 0),
          notes: `Fulfilled ${partialFulfilledQty} of ${form.quantity}`
        });
        showToast(`Request split: ${partialFulfilledQty} fulfilled, ${form.quantity - partialFulfilledQty} remaining in Approved.`, 'success');
        navigate('/requests');
      } else {
        await approveDeviceRequestById(form.requestId, { approval_status: 'Fulfilled', approved_by: currentUser.id });
        showToast(`${form.display_id} fulfilled successfully`, 'success');
        const refreshed = await fetchDeviceRequestById(form.requestId);
        setForm(createRequestForm(refreshed));
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to fulfill request', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !form) return;
    if (!window.confirm(`Are you sure you want to delete ${form.display_id}? This action will soft-delete it from the system.`)) return;
    try {
      await deleteDeviceRequestById(form.requestId, currentUser.id);
      showToast(`${form.display_id} deleted successfully`, 'success');
      navigate('/requests');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete request', 'error');
    }
  };

  const timeline: TimelineItem[] = [{ color: 'var(--primary)', title: `Request submitted by ${selectedRequester?.user_name ?? form.approvedByName ?? `User #${form.requestedById}`}`, date: form.requestDate }];
  if (form.approvalStatus === 'Pending') timeline.push({ color: '#f59e0b', title: 'Moved to Recommended review', date: form.requestDate });
  if (form.approvalStatus === 'Approved' && form.approvedByName && form.approvalDate) timeline.push({ color: 'var(--success)', title: `Approved by ${form.approvedByName}`, date: form.approvalDate });
  if (form.approvalStatus === 'Rejected' && form.approvedByName && form.approvalDate) timeline.push({ color: 'var(--error-text)', title: `Rejected by ${form.approvedByName}`, date: form.approvalDate });
  if (form.approvalStatus === 'Fulfilled' && form.approvalDate) timeline.push({ color: '#0891b2', title: `Fulfilled by ${form.approvedByName ?? 'System'}`, date: form.approvalDate });

  const fullTimeline = [
    ...timeline.map((t) => ({ ...t, sortKey: t.date || '' })),
    ...history.map((h: any) => ({
      color: h.action === 'REQUEST_SPLIT' ? '#0891b2' : h.action === 'SOFT_DELETE' ? 'var(--error-text)' : (h.action === 'QUANTITY_UPDATE' || h.action === 'PARTIAL_FULFILLED_UPDATE' || h.action === 'EXPENSE_UPDATE') ? '#3b82f6' : 'var(--primary)',
      title: h.notes || `${h.action.replace(/_/g, ' ')} by ${h.performed_by_name || 'System'}`,
      date: h.performed_at,
      sortKey: h.performed_at || '',
    })),
  ].sort((a, b) => (a.sortKey < b.sortKey ? 1 : a.sortKey > b.sortKey ? -1 : 0));

  const canReviewFinal = !viewOnly && ((form.approvalStatus === 'Requested' && canActOnReq) || (form.approvalStatus === 'Pending' && canActOnRec));
  const canSave = (deviceDetailsEditable || requesterInfoEditable || quantityEditable || partialAndExpenseEditable) && !isFulfilledViewOnly;

  const renderSectionTitle = (icon: ReactNode, title: string) => (
    <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary-lighter)' }}>{icon}</div>{title}
    </div>
  );

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => navigate('/requests')} className="btn-ghost px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm" style={{ border: '1px solid var(--border-strong)' }}><ArrowLeft size={15} /> Requests</button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-xl tracking-tight" style={{ color: 'var(--on-surface)' }}>{form.display_id}</h1>
            <StatusBadge status={formatDeviceRequestStatus(form.approvalStatus)} />
            <StatusBadge status={form.priority} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canReviewFinal && (
            <>
              <button onClick={() => setShowRejectDialog(true)} disabled={isSaving} className="btn-ghost px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5" style={{ color: 'var(--error-text)', border: '1px solid var(--border-strong)' }}><XCircle size={14} /> Reject</button>
              <button onClick={() => { const t = form.approvalStatus === 'Requested' && requestedActionLabel === 'Recommend' ? 'Pending' : 'Approved'; handleApproval(t); }} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ background: 'rgba(0,83,56,0.1)', color: 'var(--success-text)', border: '1px solid rgba(0,83,56,0.2)' }}>
                <CheckCircle2 size={14} />{isSaving ? 'Saving...' : (form.approvalStatus === 'Requested' ? requestedActionLabel : 'Approve')}
              </button>
            </>
          )}
          {canFulfillRequest && form.approvalStatus === 'Approved' && (
            <button onClick={handleFulfill} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ background: 'rgba(8,145,178,0.1)', color: '#0891b2', border: '1px solid rgba(8,145,178,0.2)' }}>
              <Package size={14} />{isSaving ? 'Saving...' : 'Fulfill'}
            </button>
          )}
          {canSave && (<button onClick={handleSave} className="btn-primary text-sm" disabled={isSaving}><Save size={14} />{isSaving ? 'Saving...' : 'Save Changes'}</button>)}
          {canDeleteRequest && (<button onClick={handleDelete} className="btn-ghost px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5" style={{ color: 'var(--error-text)', border: '1px solid var(--border-strong)' }}><XCircle size={14} /> Delete</button>)}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="section-card">
            {renderSectionTitle(<Monitor size={14} style={{ color: 'var(--primary)' }} />, 'Device Details')}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Device Type</label><input value={form.deviceType} onChange={(e) => setField('deviceType', e.target.value)} placeholder="e.g. Laptop, Monitor..." disabled={!deviceDetailsEditable} className="input-field" /></div>
              <div><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Brand / Model</label><input value={form.brand} onChange={(e) => setField('brand', e.target.value)} placeholder="e.g. Dell XPS 15" disabled={!deviceDetailsEditable} className="input-field" /></div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Priority</label>
                <select value={form.priority} onChange={(e) => setField('priority', e.target.value as Priority)} disabled={!deviceDetailsEditable} className="input-field">{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select>
              </div>
              <div>
                <div className="flex items-start gap-4 flex-wrap">
                  <div style={{ width: '150px', flexShrink: 0 }}>
                    <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Quantity</label>
                    <input type="number" min="1" value={form.quantity} onChange={(e) => {
                    const newQty = parseInt(e.target.value) || 1;
                    setField('quantity', newQty);
                    if (partialFulfilledQty > newQty) setPartialFulfilledQty(newQty);
                    }} disabled={!quantityEnabled} className="input-field" style={{ padding: '0.625rem 0.5rem', textAlign: 'center' }} />
                  </div>
                  {showPartialAndExpense && (
                    <div style={{ width: '150px', flexShrink: 0 }}>
                      <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Partial (Fulfilled)</label>
                      <div className="input-field flex items-stretch overflow-hidden select-none" style={{ width: '100%', padding: 0, background: partialEditable ? 'var(--input-bg)' : 'var(--surface-low)', opacity: partialEditable ? 1 : 0.7 }}>
                        <button type="button" onClick={() => setPartialFulfilledQty(Math.max(0, partialFulfilledQty - 1))} disabled={!partialEditable || partialFulfilledQty <= 0} className="flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ padding: '0.625rem 0.625rem', borderRight: '1px solid var(--border-color)', color: 'var(--on-surface)' }}>
                          <Minus size={12} />
                        </button>
                        <span className="flex-1 flex items-center justify-center text-sm font-bold tabular-nums" style={{ padding: '0.625rem 0', color: 'var(--on-surface)' }}>
                          {String(partialFulfilledQty).padStart(2, '0')}
                        </span>
                        <button type="button" onClick={() => setPartialFulfilledQty(Math.min(form.quantity, partialFulfilledQty + 1))} disabled={!partialEditable || partialFulfilledQty >= form.quantity} className="flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ padding: '0.625rem 0.625rem', borderLeft: '1px solid var(--border-color)', color: 'var(--on-surface)' }}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="sm:col-span-2"><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Reason / Justification</label><textarea value={form.reason} onChange={(e) => setField('reason', e.target.value)} rows={3} placeholder="Why is this device needed?" disabled={!deviceDetailsEditable} className="input-field resize-none" /></div>

              {showPartialAndExpense && (
                <>
                                    <div>
                    <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Expense Without VAT (Rs.)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={expenseWithoutVatInput}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setExpenseWithoutVatInput(raw);
                        const val = parseFloat(raw) || 0;
                        setField('expenseWithoutVat', val);
                        setField('expenseWithVat', Math.round(val * 1.13 * 100) / 100);
                      }}
                      placeholder="0.00"
                      disabled={!expenseWithoutVatEditable}
                      className="input-field"
                      style={{ opacity: expenseWithoutVatEditable ? 1 : 0.7 }}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Expense With VAT 13% (Rs.)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.expenseWithVat}
                      disabled={true}
                      className="input-field"
                      style={{ opacity: 0.6, cursor: 'not-allowed', background: 'var(--surface-low)' }}
                    />

                  </div>
                </>
              )}
            </div>
          </div>

          <div className="section-card">
            {renderSectionTitle(<User size={14} style={{ color: 'var(--primary)' }} />, 'Requester Information')}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Requested By</label><select value={String(form.requestedById)} onChange={(e) => setField('requestedById', Number(e.target.value))} disabled={!requesterInfoEditable} className="input-field"><option value="">Select requester</option>{users.map((u) => (<option key={u.user_id} value={u.user_id}>{u.user_name}</option>))}</select></div>
              <div><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Department</label><select value={String(form.departmentId)} onChange={(e) => setField('departmentId', Number(e.target.value))} disabled={!requesterInfoEditable} className="input-field"><option value="">Select department</option>{departments.map((d) => (<option key={d.department_id} value={d.department_id}>{d.department_name}</option>))}</select></div>
              <div><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Requested For</label><input value={form.requestedFor} onChange={(e) => setField('requestedFor', e.target.value)} placeholder="e.g. New hire, Apple" disabled={!requesterInfoEditable} className="input-field" /></div>
              <div><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Request Date</label><input type="date" value={form.requestDate} onChange={(e) => setField('requestDate', e.target.value)} disabled={!requesterInfoEditable} className="input-field" /></div>
              <div><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Status</label><select value={form.approvalStatus} onChange={(e) => handleStatusChange(e.target.value as RequestApprovalStatus)} disabled={!requesterInfoEditable} className="input-field">{REQUEST_STATUSES.map((s) => (<option key={s} value={s}>{formatDeviceRequestStatus(s)}</option>))}</select></div>
              {form.approvalDate && (<div><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Decision Date</label><input readOnly value={form.approvalDate} className="input-field" style={{ opacity: 0.7 }} /></div>)}
            </div>
            {(form.approvalStatus === 'Approved' || form.approvalStatus === 'Rejected' || form.approvalStatus === 'Fulfilled') && (
              <div className="mt-4 pt-4 flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: (form.approvalStatus === 'Approved' || form.approvalStatus === 'Fulfilled') ? 'var(--success-bg)' : 'var(--error-bg)', border: `1px solid ${(form.approvalStatus === 'Approved' || form.approvalStatus === 'Fulfilled') ? 'rgba(0,83,56,0.2)' : 'rgba(186,26,26,0.2)'}`, borderTop: '1px solid var(--border-color)' }}>
                {(form.approvalStatus === 'Approved' || form.approvalStatus === 'Fulfilled') ? <CheckCircle2 size={18} style={{ color: 'var(--success-text)' }} /> : <XCircle size={18} style={{ color: 'var(--error-text)' }} />}
                <div>
                  <p className="text-sm font-semibold" style={{ color: (form.approvalStatus === 'Approved' || form.approvalStatus === 'Fulfilled') ? 'var(--success-text)' : 'var(--error-text)' }}>{form.approvalStatus} by {form.approvedByName ?? '-'}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>on {form.approvalDate || '-'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="section-card" style={{ background: 'var(--primary-lighter)', border: '1px solid var(--primary-light)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>Quick Info</p>
            <InfoRow icon={Hash} label="Request ID" value={form.display_id} />
            <InfoRow icon={Building} label="Department" value={selectedDepartment?.department_name ?? ''} />
            <InfoRow icon={User} label="Requester" value={selectedRequester?.user_name ?? ''} />
            <InfoRow icon={Tag} label="Requested For" value={form.requestedFor} />
            <InfoRow icon={Calendar} label="Request Date" value={form.requestDate} />
            {showPartialAndExpense && (
              <>
                <InfoRow icon={Package} label="Total Qty" value={form.quantity} />
                <InfoRow icon={Package} label="Partial (Fulfilled)" value={partialFulfilledQty} />
                <InfoRow icon={Package} label="Remaining" value={Math.max(0, form.quantity - partialFulfilledQty)} />
                <InfoRow icon={Tag} label="Expense Without VAT" value={`Rs. ${form.expenseWithoutVat.toFixed(2)}`} />
                <InfoRow icon={Tag} label="Expense With VAT" value={`Rs. ${form.expenseWithVat.toFixed(2)}`} />
              </>
            )}
            <div className="flex items-start gap-3 pt-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary-lighter)' }}><Tag size={13} style={{ color: 'var(--primary)' }} /></div>
              <div><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Current Status</p><div className="mt-1"><StatusBadge status={formatDeviceRequestStatus(form.approvalStatus)} /></div></div>
            </div>
          </div>

          <div className="section-card">
            <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}><Clock size={15} style={{ color: 'var(--primary)' }} /> History</div>
            {fullTimeline.map((event, index) => (<TimelineEvent key={`${event.title}-${index}`} color={event.color} title={event.title} date={event.date} last={index === fullTimeline.length - 1} />))}
          </div>
        </div>
      </div>

      <ConfirmDialog isOpen={showRejectDialog} onClose={() => setShowRejectDialog(false)} onConfirm={() => handleApproval('Rejected')} danger title="Reject Request" message={`Reject ${form.display_id}? This action will be logged.`} />
    </div>
  );
}