import { AssetFormDialog } from "@/components/assets/AssetFormDialog";
import { AssetList } from "@/components/assets/AssetList";
import { AssetStatsCard } from "@/components/dashboard/asset/AssetStatsCard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAssets } from "@/hooks/use-assets";
import { useSiteId } from "@/hooks/use-site-id";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import { AssetStatsCardProps, AssetStatsData } from "@/types/asset";
import { Plus } from "lucide-react";

import { useEffect, useState } from "react";

const AssetDashboard = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const siteId = useSiteId();
  const userMetadata = useUserMetadata();
  const parsedMetadata = userMetadata ? JSON.parse(userMetadata) : null;
  const isStaffUser = parsedMetadata?.user_group_name === "Centre Staff";

  let assetStats: AssetStatsData = {
    total: 0,
    active: 0,
    maintenance: 0,
  };

  const { useAssetsQuery } = useAssets();

  const {
    data: assets,
    isLoading: isLoadingAssets,
    error: errorAssets,
    refetch,
  } = useAssetsQuery();

  useEffect(() => {
    if (!isDialogOpen) {
      refetch();
    }
  }, [isDialogOpen, refetch]);

  if (errorAssets) {
    console.error(errorAssets);
    return <div>Error fetching assets</div>;
  }

  const displayAssets = isStaffUser && !siteId ? [] : assets;

  if (!isLoadingAssets && assets) {
    if (displayAssets.length > 0) {
      assetStats = {
        total: displayAssets.length,
        active: displayAssets.filter((a) => a?.is_active).length,
        maintenance: displayAssets.filter((a) => !a?.is_active).length,
      };
    }
  }

  const items: AssetStatsCardProps[] = [
    {
      title: "Total Assets",
      value: isLoadingAssets
        ? "Loading..."
        : assetStats?.total.toString() || "0",
      description: "Asset registered",
    },
    {
      title: "Active Assets",
      value: isLoadingAssets
        ? "Loading..."
        : assetStats?.active.toString() || "0",
      color: "green-600",
      description: "Currently in use",
    },
    {
      title: "Under Maintenance",
      value: isLoadingAssets
        ? "Loading..."
        : assetStats?.maintenance.toString() || "0",
      color: "red-600",
      description: "Being serviced",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Asset Management</h1>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Asset
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <AssetStatsCard key={item.title} {...item} />
          ))}
        </div>

        <AssetList
          assets={displayAssets}
          isLoadingAssets={isLoadingAssets}
          refetch={refetch}
        />
        <AssetFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          defaultSiteId={isStaffUser && siteId ? siteId : null}
        />
      </div>
    </DashboardLayout>
  );
};

export default AssetDashboard;
