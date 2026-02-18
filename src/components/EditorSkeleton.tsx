export default function EditorSkeleton() {
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#0f172a]">

      {/* Background theme */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] h-[60%] w-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[50%] w-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* Header (desktop only) */}
      <div className="hidden md:flex items-center gap-3 px-6 py-4">
        <div className="h-4 w-40 animate-pulse rounded-md bg-slate-700/60" />
        <div className="h-4 w-24 animate-pulse rounded-md bg-slate-700/60" />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:flex-row">

        {/* Sidebar (desktop only) */}
        <div className="hidden md:flex w-20 flex-col items-center gap-3 border-r border-white/10 px-2 py-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-10 animate-pulse rounded-lg bg-slate-700/60"
            />
          ))}
        </div>

        {/* Canvas */}
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="aspect-[3/4] w-full max-w-sm md:max-w-3xl rounded-2xl bg-slate-800/80 p-4 shadow-lg ring-1 ring-white/10">
            <div className="h-full w-full animate-pulse rounded-xl bg-slate-700/60" />
          </div>
        </div>

        {/* Right panel (desktop only) */}
        <div className="hidden md:flex w-72 flex-col gap-3 border-l border-white/10 px-4 py-4">
          <div className="h-4 w-32 animate-pulse rounded-md bg-slate-700/60" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-full animate-pulse rounded-lg bg-slate-700/60"
            />
          ))}
        </div>

      </div>

      {/* Bottom toolbar (mobile only) */}
      <div className="md:hidden border-t border-white/10 bg-slate-900/70 backdrop-blur px-4 py-3">
        <div className="flex justify-between">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-14 animate-pulse rounded-xl bg-slate-700/60"
            />
          ))}
        </div>
      </div>

    </div>
  );
}
