export default function SiteNotFound() {
  return (
    <div className="min-h-screen bg-[color:var(--bg)]">
      <div className="mx-auto max-w-[760px] px-4 pt-16 sm:px-0">
        <div className="mb-6 flex items-baseline gap-2.5">
          <span className="text-[18px] font-semibold text-[color:var(--ink)]">Tunyl</span>
          <span className="text-[color:var(--ink-3)]">Site</span>
        </div>
        <div className="rounded-xl border border-[color:var(--border)] bg-white p-6 shadow-[var(--shadow)]">
          <h1 className="text-[20px] font-semibold">This site link is not right</h1>
          <p className="mt-2 text-[14px] text-[color:var(--ink-2)]">
            The link should look like tunyl.app/site/xx-xxxx-0000 and comes from the office. Check the message it was sent in, or ask the office to send it again.
          </p>
        </div>
      </div>
    </div>
  );
}
