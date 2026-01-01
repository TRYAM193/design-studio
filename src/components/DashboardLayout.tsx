import { Outlet } from "react-router";
import { DashboardSidebar } from "./DashboardSidebar";

export function DashboardLayout() {
  return (
    <div className="min-h-screen relative font-sans selection:bg-orange-500 selection:text-white bg-[#0f172a]">
      
      {/* ✅ GLOBAL DASHBOARD BACKGROUND: COSMIC SHIVA THEME */}
      {/* This ensures every dashboard page gets the premium look automatically */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         {/* Base Night Sky */}
         <div className="absolute inset-0 bg-[#0f172a]" />
         
         {/* Blob 1: Neelkanth Blue (Top Left) */}
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
         
         {/* Blob 2: Agni Saffron (Bottom Right) */}
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-orange-600/10 blur-[100px] animate-pulse delay-1000" />
         
         {/* Blob 3: Ash Silver (Center/Bottom) */}
         <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] rounded-full bg-slate-400/5 blur-[120px] animate-pulse delay-2000" />
         
         {/* Grain Texture */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* Sidebar (Fixed Z-Index High) */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <main className="
        relative z-10 min-h-screen transition-all duration-300 ease-in-out
        pl-0 sm:pl-20 
        pb-20 sm:pb-0
      ">
        <div className="container mx-auto p-4 sm:p-8 max-w-7xl">
          {/* We pass a default text color so all pages inherit readable text */}
          <div className="text-slate-200">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}