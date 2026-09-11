export default function ClaimNotFound() {
  return (
    <div className="mx-auto max-w-[760px] px-5 pt-16">
      <div className="flex items-baseline gap-2.5 pb-6"><b className="text-[18px] font-bold">Tunyl</b><span className="text-[color:var(--ink2)]">Claim</span></div>
      <div className="card">
        <h1 className="text-[22px]">This claim link is not right</h1>
        <p className="mt-2 text-[color:var(--ink2)]">Claim links are sent by the subcontractor's office and expire after certification. Ask them to send the link again.</p>
      </div>
    </div>
  );
}
