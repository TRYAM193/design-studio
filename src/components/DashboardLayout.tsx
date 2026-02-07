import { Outlet } from "react-router"; 
import { DashboardSidebar } from "./DashboardSidebar";

export function DashboardLayout() {
  return (
    <div className="min-h-screen relative font-sans selection:bg-orange-500 selection:text-white bg-[#0f172a]">
      
      {/* GLOBAL BACKGROUND (Cosmic Theme) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0f172a]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-orange-600/10 blur-[100px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
      </div>

      {/* SIDEBAR / BOTTOM BAR */}
      <DashboardSidebar />

      {/* MAIN CONTENT */}
      {/* Mobile: pl-0 (Full width), pb-24 (Space for Bottom Bar)
          Desktop: sm:pl-20 (Space for Collapsed Sidebar), sm:pb-0 (No Bottom Bar)
      */}
      <main className="
        relative z-10 min-h-screen transition-all duration-300 ease-in-out
        pl-0 sm:pl-20 
        pb-24 sm:pb-0
      ">
        <div className="container mx-auto p-4 sm:p-8 max-w-7xl text-slate-200">
          <Outlet />
        </div>
      </main>
    </div>
  );
}