
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserType } from "@/types/auth";

interface AnnouncementFormData {
  title: string;
  message: string;
  userTypes: UserType[];
}

export const CreateAnnouncementDialog = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset } = useForm<AnnouncementFormData>({
    defaultValues: {
      userTypes: [] as UserType[] // Explicitly typed as UserType[]
    }
  });

  const onSubmit = async (data: AnnouncementFormData) => {
    const { error } = await supabase
      .from('announcements')
      .insert({
        title: data.title,
        message: data.message,
        user_types: data.userTypes // Already correctly typed as UserType[]
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Announcement created successfully",
    });
    
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Announcement</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Announcement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              placeholder="Title"
              {...register("title", { required: true })}
            />
          </div>
          <div>
            <Textarea
              placeholder="Message"
              {...register("message", { required: true })}
              rows={4}
            />
          </div>
          {/* We'll need to add a UserType selector here in the future */}
          <Button type="submit" className="w-full">
            Create Announcement
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
