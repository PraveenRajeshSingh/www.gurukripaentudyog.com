const GREEN = ['DELIVERED', 'APPROVED', 'QUOTATION_PREPARED'];
const AMBER = ['NEW', 'UNDER_REVIEW', 'DRAFT', 'SENT', 'CONFIRMED', 'PRODUCTION', 'PENDING'];
const RED = ['REJECTED', 'CANCELLED', 'CLOSED'];

const LABELS: Record<string, string> = {
  NEW: 'New',
  UNDER_REVIEW: 'Under review',
  QUOTATION_PREPARED: 'Quotation ready',
  CLOSED: 'Closed',
  DRAFT: 'Draft',
  SENT: 'Awaiting response',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CONFIRMED: 'Confirmed',
  PRODUCTION: 'In production',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
};

export default function StatusPill({ status }: { status: string }) {
  const tone = GREEN.includes(status)
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : RED.includes(status)
    ? 'bg-red-50 text-red-700 border-red-200'
    : AMBER.includes(status)
    ? 'bg-amber-50 text-amber-800 border-amber-200'
    : 'bg-neutral-100 text-neutral-600 border-neutral-200';
  return (
    <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${tone}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
