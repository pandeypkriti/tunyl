import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto max-w-[760px] px-5 pt-16">
      <div className="flex items-baseline gap-2.5 pb-6"><b className="text-[18px] font-semibold">Tunyl</b><span className="text-[color:var(--ink2)]">Docket to claim</span></div>
      <div className="card">
        <h1 className="text-[22px]">There is nothing at this address</h1>
        <p className="mt-2 text-[color:var(--ink2)]"><Link className="text-[color:var(--tint-ink)] underline" href="/">Go to the board view</Link> or check the link you were sent.</p>
      </div>
    </div>
  );
}
