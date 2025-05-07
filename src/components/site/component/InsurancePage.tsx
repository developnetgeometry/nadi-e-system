import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TableRowNumber } from "@/components/ui/TableRowNumber";
import { Edit, Eye, FilePlus, Settings, Trash2 } from "lucide-react";
import InsuranceFormDialog from "../InsuranceFormDialog";
import { useSiteInsurance } from "../hook/use-site-insurance";
import { supabase } from "@/lib/supabase";
import { BUCKET_NAME_SITE_INSURANCE } from "@/integrations/supabase/client";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast"; // Import the useToast hook
import InsurancePageView from "./InsurancePageView";

interface InsurancePageProps {
  siteId: string;
}

const InsurancePage: React.FC<InsurancePageProps> = ({ siteId }) => {
  const [refreshInsurance, setRefreshInsurance] = useState(false);
  const { data, loading, error } = useSiteInsurance(siteId, refreshInsurance);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // State for delete confirmation dialog
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null); // State to store the record ID to delete
  const [selectedInsurance, setSelectedInsurance] = useState<any>(null);
  const { toast } = useToast(); // Initialize the toast hook
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false); // State for view dialog
  const [viewData, setViewData] = useState<any>(null); // State for selected data to view


  const handleView = (insurance: any) => {
    setViewData(insurance); // Set the selected insurance data
    setIsViewDialogOpen(true); // Open the view dialog
  };

  const handleEdit = (insurance: any) => {
    setSelectedInsurance(insurance);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    if (!isDialogOpen) {
      setRefreshInsurance((prev) => !prev);
    }
  }, [isDialogOpen]);

  const handleDelete = async () => {
    if (!deleteRecordId) return;

    try {
      // Step 1: Delete from `nd_site_attachment` and get file path
      const { data: attachmentData, error: attachmentError } = await supabase
        .from("nd_site_attachment")
        .select("file_path")
        .eq("site_remark_id", deleteRecordId)
        .single();

      if (attachmentError) {
        console.warn("No associated file found or error fetching file path:", attachmentError);
      } else if (attachmentData?.file_path) {
        const filePath = attachmentData.file_path;

        // Extract the part of the file path after the bucket name
        const relativeFilePath = filePath.split(`${BUCKET_NAME_SITE_INSURANCE}/`)[1];

        // Step 2: Delete the file from storage
        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME_SITE_INSURANCE)
          .remove([relativeFilePath]);

        if (storageError) {
          console.error("Error deleting file from storage:", storageError);
          toast({
            title: "Error",
            description: "Failed to delete the associated file. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // Step 3: Delete the record from `nd_site_attachment`
        const { error: attachmentDeleteError } = await supabase
          .from("nd_site_attachment")
          .delete()
          .eq("site_remark_id", deleteRecordId);

        if (attachmentDeleteError) {
          console.error("Error deleting from nd_site_attachment:", attachmentDeleteError);
          toast({
            title: "Error",
            description: "Failed to delete the attachment record. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      // Step 4: Delete from `nd_insurance_report`
      const { error: reportError } = await supabase
        .from("nd_insurance_report")
        .delete()
        .eq("site_remark_id", deleteRecordId);

      if (reportError) {
        console.error("Error deleting from nd_insurance_report:", reportError);
        toast({
          title: "Error",
          description: "Failed to delete the insurance report. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Step 5: Delete from `nd_site_remark`
      const { error: remarkError } = await supabase
        .from("nd_site_remark")
        .delete()
        .eq("id", deleteRecordId);

      if (remarkError) {
        console.error("Error deleting from nd_site_remark:", remarkError);
        toast({
          title: "Error",
          description: "Failed to delete the remark. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Record and associated file deleted successfully.",
        variant: "default",
      });
      setRefreshInsurance((prev) => !prev); // Trigger re-fetch
    } catch (error) {
      console.error("Error deleting record:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false); // Close the dialog
      setDeleteRecordId(null); // Reset the record ID
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Insurance Information</h2>

      <div className="flex justify-end mb-4">
        <Button
          onClick={() => {
            setSelectedInsurance(null);
            setIsDialogOpen(true);
          }}
        >
          <FilePlus className="mr-2 h-4 w-4" />
          Add New Insurance
        </Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] text-center">No.</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Incident Type</TableHead>
              <TableHead>Insurance Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={item.id}>
                <TableRowNumber index={index} />
                <TableCell>{item.description ?? "N/A"}</TableCell>
                <TableCell>{item.type_name ?? "N/A"}</TableCell>
                <TableCell>{item.insurance_type_name ?? "N/A"}</TableCell>
                <TableCell>
                  {item.start_date
                    ? new Intl.DateTimeFormat("en-GB").format(new Date(item.start_date))
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {item.end_date
                    ? new Intl.DateTimeFormat("en-GB").format(new Date(item.end_date))
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {item.file_path ? (
                    <a href={item.file_path} target="_blank" rel="noopener noreferrer">
                      View File
                    </a>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                  <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => handleView(item)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            setDeleteRecordId(item.id.toString()); // Set the record ID to delete
                            setIsDeleteDialogOpen(true); // Open the dialog
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InsurancePageView
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        data={viewData}
      />
      
      <InsuranceFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        siteId={siteId}
        initialData={selectedInsurance}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InsurancePage;