import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { AskProvider } from "./ask-panel";

export function AppShell({ children, queueCount, name }: { children: React.ReactNode; queueCount: number; name: string }) {
  return (
    <AskProvider name={name}>
      <Topbar name={name} />
      <div className="md:grid md:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar queueCount={queueCount} name={name} />
        <main className="min-w-0 px-4 py-6 md:px-6 md:py-8"><div className="mx-auto max-w-[1280px]">{children}</div></main>
      </div>
    </AskProvider>
  );
}
