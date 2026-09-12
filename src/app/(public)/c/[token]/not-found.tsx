export default function ClaimNotFound() {
  return (
    <div className="min-h-screen bg-[color:var(--bg)]">
      <div className="mx-auto max-w-[760px] px-4 pt-16 sm:px-0">
        <div className="mb-6 flex items-baseline gap-2.5">
          <span className="text-[18px] font-semibold text-[color:var(--ink)]">Tunyl</span>
          <span className="text-[color:var(--ink-3)]">Claim</span>
        </div>
        <div className="rounded-xl border border-[color:var(--border)] bg-white p-6 shadow-[var(--shadow)]">
          <h1 className="text-[20px] font-semibold">This claim link is not right</h1>
          <p className="mt-2 text-[14px] text-[color:var(--ink-2)]">
            Claim links are sent by the subcontractor&#39;s office and expire after certification. Ask them to send the link again.
          </p>
        </div>
      </div>
    </div>
  );
}
