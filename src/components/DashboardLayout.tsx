import { Outlet } from "react-router";
import { DashboardSidebar } from "./DashboardSidebar";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="
        min-h-screen transition-all duration-300 ease-in-out
        pl-0 sm:pl-20
        pb-20 sm:pb-0
      ">
        <div className="container mx-auto p-4 sm:p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}