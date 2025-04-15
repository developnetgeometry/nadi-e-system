import { useEffect } from "react";
import ReactDOM from "react-dom";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteProfile } from "./hook/use-site-profile";
import { useSiteCode } from "./hook/use-site-code";
import { useSiteAddress } from "./hook/use-site-address";
import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableHeader,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Trash2,
  MapPin,
  Globe,
  Mail,
  Calendar,
  Users,
  Building,
  EyeOff,
  Eye,
  Plus,
  ArrowDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useSiteGeneralData from "@/hooks/use-site-general-data";
import useGeoData from "@/hooks/use-geo-data";
import BillingFormDialog from "./BillingFormDialog";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import SiteClosure from "./SiteClosure";
import { useSiteBilling } from "./hook/use-site-billing";
import { supabase } from "@/lib/supabase";
import { BUCKET_NAME_UTILITIES } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SiteDetailProps {
  siteId: string;
}

const SiteDetail: React.FC<SiteDetailProps> = ({ siteId }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBillingData, setSelectedBillingData] = useState(null);
  const [refreshBilling, setRefreshBilling] = useState(false);
  const [isSiteClosureDialogOpen, setIsSiteClosureDialogOpen] = useState(false);

  const { data, loading, error } = useSiteProfile(siteId);
  const {
    siteCode,
    loading: codeLoading,
    error: codeError,
  } = useSiteCode(siteId);
  const {
    data: addressData,
    loading: addressLoading,
    error: addressError,
  } = useSiteAddress(siteId);
  const {
    data: billingData,
    loading: billingLoading,
    error: billingError,
  } = useSiteBilling(siteId, refreshBilling);
  const {
    siteStatus,
    technology,
    bandwidth,
    buildingType,
    space,
    zone,
    categoryArea,
    buildingLevel,
    socioEconomics,
  } = useSiteGeneralData();
  const { regions, states, parliaments, duns, mukims, phases } = useGeoData();
  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const { userMetadata, isLoading: isMetadataLoading } = useUserMetadata();
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    if (userMetadata) {
      try {
        const metadata = JSON.parse(userMetadata);
        setUserType(metadata?.user_type);
      } catch (error) {
        console.error("Error parsing user metadata:", error);
      }
    }
  }, [userMetadata]);

  useEffect(() => {
    if (!isDialogOpen) {
      setRefreshBilling((prev) => !prev);
    }
  }, [isDialogOpen]);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this record?"
    );
    if (!confirmDelete) return;

    try {
      const { data: attachmentData, error: attachmentError } = await supabase
        .from("nd_utilities_attachment")
        .select("file_path")
        .eq("utilities_id", id)
        .single();

      if (attachmentError) {
        console.warn(
          "No associated file found or error fetching file path:",
          attachmentError
        );
      } else if (attachmentData?.file_path) {
        const filePath = attachmentData.file_path;

        const relativeFilePath = filePath.split("//")[2];

        console.log("File path translated:", relativeFilePath);

        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME_UTILITIES)
          .remove([relativeFilePath]);

        if (storageError) {
          console.error("Error deleting file from storage:", storageError);
          alert("Failed to delete the associated file. Please try again.");
          return;
        }
      }

      const { error } = await supabase
        .from("nd_utilities")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting record:", error);
        alert("An error occurred while deleting the record.");
        return;
      }

      alert("Record and associated file deleted successfully.");
      setRefreshBilling((prev) => !prev);
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  const handleSiteClosureClick = () => {
    const modal = document.createElement("div");
    modal.id = "site-closure-modal";
    document.body.appendChild(modal);

    ReactDOM.render(
      <SiteClosure
        siteId={siteId}
        siteDetails={data}
        location={addressData}
        onSubmit={(closureData) => {
          console.log("Closure submitted:", closureData);
          ReactDOM.unmountComponentAtNode(modal);
          document.body.removeChild(modal);
        }}
        onClose={() => {
          ReactDOM.unmountComponentAtNode(modal);
          document.body.removeChild(modal);
        }}
      />,
      modal
    );
  };

  if (loading || codeLoading || addressLoading)
    return <Skeleton className="w-full h-96">Loading...</Skeleton>;
  if (error || codeError || addressError)
    return (
      <div className="p-4 text-destructive">
        Error: {error || codeError || addressError}
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="items-center">
          <h1 className="text-2xl font-bold">{data.fullname || "Site Name"}</h1>
          <h3 className="text-muted-foreground">
            Site Code: <span className="font-bold">{siteCode || "N/A"}</span>
          </h3>
          <div className="font-medium flex items-center gap-2">
            <span className="text-muted-foreground">Status: </span>
            <span className="font-medium flex items-center gap-2">
              {siteStatus.find((status) => status.id === data.active_status)
                ?.eng || "N/A"}
              {data.is_active ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {userType?.startsWith("staff") && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Apply Request <ArrowDown className="h-4 w-4 mr-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    setIsSiteClosureDialogOpen(true);
                  }}
                >
                  Site Closure
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    console.log("Temporary Closure selected");
                  }}
                >
                  Temporary Closure
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {userType?.startsWith("staff") && (
            <Button
              onClick={() => {
                setSelectedBillingData(null);
                setIsDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Billing
            </Button>
          )}
        </div>
      </div>

      <div className="flex border-b">
        <button
          className={`px-4 py-2 ${
            activeTab === "details" ? "border-b-2 border-blue-500" : ""
          }`}
          onClick={() => setActiveTab("details")}
        >
          Site Details
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "billing" ? "border-b-2 border-blue-500" : ""
          }`}
          onClick={() => setActiveTab("billing")}
        >
          Billing
        </button>
      </div>

      {activeTab === "details" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Location Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Region:</span>
                  <span className="font-medium">
                    {regions.find((region) => region.id === data.region_id)
                      ?.eng || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">State:</span>
                  <span className="font-medium">
                    {states.find((state) => state.id === data.state_id)?.name ||
                      "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mukim:</span>
                  <span className="font-medium">
                    {mukims.find((mukim) => mukim.id === data.mukim_id)?.name ||
                      "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coordinates:</span>
                  <span className="font-medium">
                    {data.latitude && data.longtitude
                      ? `${data.latitude}, ${data.longtitude}`
                      : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Contact & Online Presence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{data.email || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Website:</span>
                  <span className="font-medium">{data.website || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference ID:</span>
                  <span className="font-medium">{data.ref_id || "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Building Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Building Type:</span>
                  <span className="font-medium">
                    {buildingType.find(
                      (type) => type.id === data.building_type_id
                    )?.eng || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Building Area:</span>
                  <span className="font-medium">
                    {data.building_area_id != null
                      ? data.building_area_id.toLocaleString() + " sqft"
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rental:</span>
                  <span className="font-medium">
                    {data.building_rental_id ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">OKU Friendly:</span>
                  <span className="font-medium">
                    {data.oku_friendly ? "Yes" : "No"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Demographic & Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Technology</TableHead>
                      <TableHead>Bandwidth</TableHead>
                      <TableHead>Total Population</TableHead>
                      <TableHead>Socioeconomic ID</TableHead>
                      <TableHead>Phase ID</TableHead>
                      <TableHead>Cluster ID</TableHead>
                      <TableHead>Operation Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        {technology.find((tech) => tech.id === data.technology)
                          ?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {bandwidth.find((band) => band.id === data.bandwidth)
                          ?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {data.total_population?.toLocaleString() || "N/A"}
                      </TableCell>
                      <TableCell>
                        {data.socioeconomic_id &&
                        data.socioeconomic_id.length > 0
                          ? data.socioeconomic_id
                              .map(
                                (id) =>
                                  socioEconomics.find((se) => se.id === id)
                                    ?.eng || "N/A"
                              )
                              .join(", ")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {phases.find((phase) => phase.id === data.phase_id)
                          ?.name || "N/A"}
                      </TableCell>
                      <TableCell>{data.cluster_id || "N/A"}</TableCell>
                      <TableCell>
                        {data.operate_date
                          ? new Date(data.operate_date).toLocaleDateString()
                          : "Not specified"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableHead className="w-1/4">Parliament RFID</TableHead>
                      <TableCell>
                        {parliaments.find(
                          (parliament) => parliament.id === data.parliament_rfid
                        )?.fullname || "N/A"}
                      </TableCell>
                      <TableHead className="w-1/4">DUN RFID</TableHead>
                      <TableCell>
                        {duns.find((dun) => dun.id === data.dun_rfid)?.name ||
                          "N/A"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead>UST ID</TableHead>
                      <TableCell>{data.ust_id || "N/A"}</TableCell>
                      <TableHead>DUSP TP ID</TableHead>
                      <TableCell>{data.dusp_tp_id || "N/A"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead>Space ID</TableHead>
                      <TableCell>
                        {data.space_id && data.space_id.length > 0
                          ? data.space_id
                              .map(
                                (id) =>
                                  space.find((s) => s.id === id)?.eng || "N/A"
                              )
                              .join(", ")
                          : "N/A"}
                      </TableCell>
                      <TableHead>Zone ID</TableHead>
                      <TableCell>
                        {zone.find((z) => z.id === data.zone_id)?.area || "N/A"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead>Area ID</TableHead>
                      <TableCell>
                        {categoryArea.find((area) => area.id === data.area_id)
                          ?.name || "N/A"}
                      </TableCell>
                      <TableHead>Level ID</TableHead>
                      <TableCell>
                        {buildingLevel.find(
                          (level) => level.id === data.level_id
                        )?.eng || "N/A"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead>Created At</TableHead>
                      <TableCell>
                        {data.created_at
                          ? new Date(data.created_at).toLocaleString()
                          : "N/A"}
                      </TableCell>
                      <TableHead>Updated At</TableHead>
                      <TableCell>
                        {data.updated_at
                          ? new Date(data.updated_at).toLocaleString()
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address Line 1:</span>
                <span className="font-medium">
                  {addressData.address1 || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address Line 2:</span>
                <span className="font-medium">
                  {addressData.address2 || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">City:</span>
                <span className="font-medium">{addressData.city || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Postal Code:</span>
                <span className="font-medium">
                  {addressData.postcode || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">State:</span>
                <span className="font-medium">
                  {states.find((state) => state.id === addressData.state_id)
                    ?.name || "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {data.remark && (
            <Card>
              <CardHeader>
                <CardTitle>Remarks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{data.remark}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "billing" && (
        <div>
          <div className="space-y-6">
            <div className="flex space-x-4">
              <input
                type="number"
                placeholder="Year"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <input
                type="number"
                placeholder="Month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <input
                type="text"
                placeholder="Utility Type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Billing Type</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Loading billing data...
                    </TableCell>
                  </TableRow>
                ) : !billingData || billingData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No billing data found
                    </TableCell>
                  </TableRow>
                ) : (
                  (() => {
                    const filteredBillingData = billingData.filter(item => 
                      (!yearFilter || item.year.toString() === yearFilter) &&
                      (!monthFilter || item.month.toString() === monthFilter) &&
                      (!typeFilter || (item.type_name && item.type_name.toLowerCase().includes(typeFilter.toLowerCase())))
                    );
                    
                    return filteredBillingData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.year}</TableCell>
                        <TableCell>{item.month}</TableCell>
                        <TableCell>{item.type_name}</TableCell>
                        <TableCell>
                          {item.file_path ? (
                            <a
                              href={item.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View PDF
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSelectedBillingData(item);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ));
                  })()
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <BillingFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        siteId={siteId}
        initialData={selectedBillingData}
      />

      {isSiteClosureDialogOpen && (
        <SiteClosure
          siteId={siteId}
          siteDetails={data}
          location={addressData}
          onSubmit={(closureData) => {
            console.log("Closure submitted:", closureData);
            setIsSiteClosureDialogOpen(false);
          }}
          onClose={() => {
            setIsSiteClosureDialogOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default SiteDetail;
