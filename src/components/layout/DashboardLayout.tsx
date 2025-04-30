
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardNavbar } from "./DashboardNavbar";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import PageBreadcrumb from "./PageBreadcrumb";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { state, isMobile, openMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    if (isMobile && openMobile) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMobile, openMobile]);

  return (
    <div className="relative min-h-screen flex w-full bg-[#F7F9FC] dark:bg-gray-900 text-gray-800 dark:text-white">
      {isMobile && openMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => useSidebar().setOpenMobile(false)}
        />
      )}

      <div className={cn("z-50", isMobile ? "fixed" : "sticky top-0 h-screen")}>
        <DashboardSidebar />
      </div>

      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 w-full",
        !isMobile && isCollapsed ? "ml-[72px]" : "",
        !isMobile && !isCollapsed ? "ml-[240px]" : "",
        isMobile ? "ml-0" : ""
      )}>
        <DashboardNavbar />
        <PageBreadcrumb/>
        <AnnouncementBanner />
        <main className="flex-1 p-6 overflow-auto w-full">
          <div className="w-full mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
