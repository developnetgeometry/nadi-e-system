import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import Landing from "@/pages/Landing";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import MemberLogin from "@/pages/auth/MemberLogin";
import { dashboardRoutes, DashboardRoutes } from "@/routes/dashboard.routes";
import { memberRoutes } from "@/routes/member.routes";
import { moduleRoutes } from "@/routes/module.routes";
import UIComponents from "@/pages/UIComponents";
import OrganizationDetails from "@/pages/dashboard/OrganizationDetails";
import HomeExample from "@/pages/examples/HomeExample";
import DetailExample from "@/pages/examples/DetailExample";
import SettingsExample from "@/pages/examples/SettingsExample";
import NotFound from "@/pages/NotFound";
import UnderDevelopment from "@/pages/UnderDevelopment";
import NoAccess from "@/pages/NoAccess";
import Announcements from "@/pages/dashboard/Announcements";
import AnnouncementSettings from "@/pages/dashboard/AnnouncementSettings";
import CreateAnnouncement from "@/pages/demo/CreateAnnouncement";
import Takwim from "@/pages/dashboard/Takwim";
import NotificationManagement from "@/pages/dashboard/NotificationManagement";
import Notifications from "@/pages/dashboard/Notifications";

const queryClient = new QueryClient();

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/member-login" element={<MemberLogin />} />
              <Route path="/register" element={<Register />} />
              <Route path="/ui-components" element={<UIComponents />} />

              <Route path="/examples/home" element={<HomeExample />} />
              <Route path="/examples/detail" element={<DetailExample />} />
              <Route path="/examples/settings" element={<SettingsExample />} />

              <Route
                path="/admin/organizations/:id"
                element={<OrganizationDetails />}
              />

              <Route path="/admin/takwim" element={<Takwim />} />
              <Route path="/dashboard/notifications" element={<Notifications />} />
              <Route path="/dashboard/notification-management" element={<NotificationManagement />} />

              <Route path="/demo/announcements" element={<Announcements />} />
              <Route path="/demo/announcements/create" element={<CreateAnnouncement />} />
              <Route path="/demo/announcement-settings" element={<AnnouncementSettings />} />

              <Route path="/under-development" element={<UnderDevelopment />} />
              <Route path="/announcements" element={<UnderDevelopment />} />

              <Route path="/no-access" element={<NoAccess />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
