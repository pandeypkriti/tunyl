export default function SiteNotFound() {
  return (
    <div className="mx-auto max-w-[760px] px-5 pt-16">
      <div className="flex items-baseline gap-2.5 pb-6"><b className="text-[18px] font-bold">Tunyl</b><span className="text-[color:var(--ink2)]">Site</span></div>
      <div className="card">
        <h1 className="text-[22px]">This site link is not right</h1>
        <p className="mt-2 text-[color:var(--ink2)]">The link should look like tunyl.app/site/xx-xxxx-0000 and comes from the office. Check the message it was sent in, or ask the office to send it again.</p>
      </div>
    </div>
  );
}
