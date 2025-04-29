
import { useState, useEffect } from "react";
import { format, differenceInMinutes } from "date-fns";
import { CalendarIcon, Clock, Category, List, Users, User, MessageSquare, CircleUser, Globe } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { EventType, TakwimEvent, Category, Pillar, Programme, Module } from "@/types/takwim";
import { formatDuration } from "@/utils/date-utils";

interface TakwimEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventToEdit?: Omit<TakwimEvent, "id">;
  eventTypes: EventType[];
  onSubmit: (event: Omit<TakwimEvent, "id">) => void;
  categories: Category[];
  pillars: Pillar[];
  programmes: Programme[];
  modules: Module[];
}

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  date: z.date({ required_error: "Date is required" }),
  startTime: z.string().min(1, { message: "Start time is required" }),
  endTime: z.string().min(1, { message: "End time is required" }),
  type: z.string().min(1, { message: "Event type is required" }),
  description: z.string().optional(),
  location: z.string().optional(),
  category: z.string().min(1, { message: "Category is required" }),
  pillar: z.string().min(1, { message: "Pillar is required" }),
  programme: z.string().min(1, { message: "Programme is required" }),
  module: z.string().min(1, { message: "Module is required" }),
  isGroupEvent: z.boolean().default(false),
  mode: z.enum(["Online", "Physical"], { required_error: "Mode is required" }),
  targetParticipant: z.string().min(1, { message: "Target participant is required" }),
  trainerName: z.string().min(1, { message: "Trainer/organization name is required" }),
})
.refine(data => {
  const [startHour, startMinute] = data.startTime.split(':').map(Number);
  const [endHour, endMinute] = data.endTime.split(':').map(Number);
  
  if (startHour > endHour) return false;
  if (startHour === endHour && startMinute >= endMinute) return false;
  
  return true;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export function TakwimEventDialog({
  open,
  onOpenChange,
  eventToEdit,
  eventTypes,
  onSubmit,
  categories,
  pillars,
  programmes,
  modules,
}: TakwimEventDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredPillars, setFilteredPillars] = useState<Pillar[]>([]);
  const [filteredProgrammes, setFilteredProgrammes] = useState<Programme[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [duration, setDuration] = useState<string>("0h");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: eventToEdit?.title || "",
      date: eventToEdit?.date || new Date(),
      startTime: eventToEdit?.startTime || "09:00",
      endTime: eventToEdit?.endTime || "10:00",
      type: eventToEdit?.type || "meeting",
      description: eventToEdit?.description || "",
      location: eventToEdit?.location || "",
      category: eventToEdit?.category || "",
      pillar: eventToEdit?.pillar || "",
      programme: eventToEdit?.programme || "",
      module: eventToEdit?.module || "",
      isGroupEvent: eventToEdit?.isGroupEvent || false,
      mode: eventToEdit?.mode || "Physical",
      targetParticipant: eventToEdit?.targetParticipant || "",
      trainerName: eventToEdit?.trainerName || "",
    },
  });

  // Filter pillars based on category
  useEffect(() => {
    const selectedCategory = form.watch("category");
    if (selectedCategory) {
      const filtered = pillars.filter(pillar => pillar.categoryId === selectedCategory);
      setFilteredPillars(filtered);
      form.setValue("pillar", "");
      form.setValue("programme", "");
      form.setValue("module", "");
    }
  }, [form.watch("category"), pillars]);

  // Filter programmes based on pillar
  useEffect(() => {
    const selectedPillar = form.watch("pillar");
    if (selectedPillar) {
      const filtered = programmes.filter(programme => programme.pillarId === selectedPillar);
      setFilteredProgrammes(filtered);
      form.setValue("programme", "");
      form.setValue("module", "");
    }
  }, [form.watch("pillar"), programmes]);

  // Filter modules based on programme
  useEffect(() => {
    const selectedProgramme = form.watch("programme");
    if (selectedProgramme) {
      const filtered = modules.filter(module => module.programmeId === selectedProgramme);
      setFilteredModules(filtered);
      form.setValue("module", "");
    }
  }, [form.watch("programme"), modules]);

  // Calculate duration when start or end time changes
  useEffect(() => {
    const startTime = form.watch("startTime");
    const endTime = form.watch("endTime");
    const date = form.watch("date");

    if (startTime && endTime && date) {
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      const startDate = new Date(date);
      startDate.setHours(startHour, startMinute, 0);

      const endDate = new Date(date);
      endDate.setHours(endHour, endMinute, 0);

      // Handle case where end time is before start time (invalid)
      if (endDate < startDate) {
        setDuration("Invalid time range");
        return;
      }

      const diffInMinutes = differenceInMinutes(endDate, startDate);
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;

      const formattedDuration = formatDuration(diffInMinutes / 60);
      setDuration(formattedDuration);
    }
  }, [form.watch("startTime"), form.watch("endTime"), form.watch("date")]);

  function handleSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const newEvent: Omit<TakwimEvent, "id"> = {
      title: values.title,
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      type: values.type,
      description: values.description,
      location: values.location,
      category: values.category,
      pillar: values.pillar,
      programme: values.programme,
      module: values.module,
      isGroupEvent: values.isGroupEvent,
      mode: values.mode,
      targetParticipant: values.targetParticipant,
      trainerName: values.trainerName,
      duration: duration,
    };
    
    // Submit the event
    onSubmit(newEvent);
    
    // Reset and close the dialog
    setIsSubmitting(false);
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {eventToEdit ? "Edit Event" : "Create New Event"}
          </DialogTitle>
          <DialogDescription>
            Add event details to schedule in the Takwim calendar.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Programme Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Event title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <Category className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pillar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pillar (Sub Category)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!form.watch("category")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <Category className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Select pillar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredPillars.map(pillar => (
                          <SelectItem key={pillar.value} value={pillar.value}>
                            {pillar.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="programme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Programme</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!form.watch("pillar")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <List className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Select programme" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredProgrammes.map(programme => (
                          <SelectItem key={programme.value} value={programme.value}>
                            {programme.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="module"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!form.watch("programme")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <List className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Select module" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredModules.map(module => (
                          <SelectItem key={module.value} value={module.value}>
                            {module.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Select a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eventTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center">
                              <span className={cn("w-2 h-2 rounded-full mr-2", type.color.split(" ")[0])}></span>
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="time"
                          {...field}
                          className="pl-9"
                        />
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="time"
                          {...field}
                          className="pl-9"
                        />
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col justify-end">
                <FormLabel>Duration</FormLabel>
                <div className="h-10 flex items-center px-3 py-2 border rounded-md bg-muted/50">
                  {duration}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isGroupEvent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center">
                        <CircleUser className="mr-2 h-4 w-4" />
                        Group Event
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>
                      <Globe className="inline-block mr-2 h-4 w-4" />
                      Mode
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Online" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Online
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Physical" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Physical
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="targetParticipant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Users className="inline-block mr-2 h-4 w-4" />
                    Target Participant
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter target participant" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trainerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <User className="inline-block mr-2 h-4 w-4" />
                    Trainer / Organization Name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter trainer or organization name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Event location (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <MessageSquare className="inline-block mr-2 h-4 w-4" />
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Event description (optional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : eventToEdit ? "Update Event" : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
