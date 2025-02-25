import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReportList } from "@/components/reports/ReportList";

const Reports = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-2">
            View and manage system reports
          </p>
        </div>
        <ReportList />
      </div>
    </DashboardLayout>
  );
};

export default Reports;