import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background font-outfit relative overflow-x-hidden">
      {/* Background Subtle Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      {/* Mobile Top Header & Bottom Nav */}
      <MobileNav />

      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      <main
        className={`transition-all duration-300 relative z-10 min-h-screen ${
          isMobile ? "p-3 pb-24" : "lg:ml-64 p-6 xl:p-8"
        }`}
      >
        <div className="hidden lg:block">
          <TopBar />
        </div>
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
