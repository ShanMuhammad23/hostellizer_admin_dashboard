"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { DialogFooter } from "@/components/ui/dialog";
import Image from "next/image";
import { LocalImageUpload } from "@/components/LocalImageUpload";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  roomNumber: z.number().min(1, "Room number must be at least 1"),
  status: z.enum(["active", "inactive", "pending"]),
  accomodationType: z.enum(["single", "double", "triple"]),
  monthlyRent: z.number().min(0, "Monthly rent must be at least 0"),
  paymentStatus: z.enum(["paid", "pending", "overdue"]),
  payment_due_date: z.string(),
  istakingmess: z.boolean(),
});

interface AddStudentFormProps {
  onStudentAdded?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddStudentForm({
  onStudentAdded,
  open: controlledOpen,
  onOpenChange,
}: AddStudentFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      roomNumber: 0,
      status: "active",
      accomodationType: "single",
      monthlyRent: 0,
      paymentStatus: "pending",
      payment_due_date: format(new Date(), "yyyy-MM-dd"),
      istakingmess: false
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const response = await axios.post("/api/students", {
        ...values,
        joinedDate: new Date().toISOString(),
        profileImagePath: profilePreview || undefined,
      });

      if (response.data.success) {
        toast.success("Student added successfully! The student's details have been saved to the database.", {
          description: "You can now view the student in the students list.",
          duration: 5000,
        });
        setOpen(false);
        setProfilePreview(null);
        form.reset();
        onStudentAdded?.();
      } else {
        toast.error("Failed to add student", {
          description: response.data.message || "Please check the form and try again.",
          duration: 5000,
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to add student';
      toast.error("Failed to add student", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setProfilePreview(null); }}>
      <DialogTrigger asChild>
        <Button >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add New Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto my-4 bg-white border">
        <DialogHeader>
          <DialogTitle className="text-primary">Add New Student</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter student name" 
                      {...field} 
                      className="bg-slate-50/50 border-2 border-slate-200 text-slate-700 placeholder:text-slate-400/70 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 hover:border-slate-300"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter email address" 
                      {...field} 
                      className="bg-slate-50/50 border-2 border-slate-200 text-slate-700 placeholder:text-slate-400/70 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 hover:border-slate-300"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Phone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter phone number" 
                      {...field} 
                      className="bg-slate-50/50 border-2 border-slate-200 text-slate-700 placeholder:text-slate-400/70 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 hover:border-slate-300"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Profile picture (optional)</p>
              {profilePreview ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-slate-200">
                  <Image
                    src={profilePreview}
                    alt="Profile preview"
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
              ) : null}
              <LocalImageUpload
                folder="students"
                label={profilePreview ? "Change photo" : "Upload photo"}
                onUploadSuccess={(path) => setProfilePreview(path)}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter address" 
                      {...field} 
                      className="bg-slate-50/50 border-2 border-slate-200 text-slate-700 placeholder:text-slate-400/70 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 hover:border-slate-300"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roomNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Room Number</FormLabel>
                  <FormControl>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Enter room number" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d+$/.test(value)) {
                          field.onChange(value === '' ? '' : parseInt(value, 10));
                        }
                      }}
                      value={field.value === 0 ? '' : field.value}
                      className="bg-slate-50/50 border-2 border-slate-200 text-slate-700 placeholder:text-slate-400/70 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 hover:border-slate-300"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-50/50 border-2 border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 hover:border-slate-300">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-2 border-slate-200">
                      <SelectItem value="active" className="text-emerald-600 hover:text-emerald-700">Active</SelectItem>
                      <SelectItem value="inactive" className="text-red-600 hover:text-red-700">Inactive</SelectItem>
                      <SelectItem value="pending" className="text-yellow-600 hover:text-yellow-700">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accomodationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Accommodation Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-50/50 border-2 border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 hover:border-slate-300">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-2 border-slate-200">
                      <SelectItem value="single" className="text-slate-700 hover:text-slate-900">Single</SelectItem>
                      <SelectItem value="double" className="text-slate-700 hover:text-slate-900">Double</SelectItem>
                      <SelectItem value="triple" className="text-slate-700 hover:text-slate-900">Triple</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthlyRent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Monthly Rent</FormLabel>
                  <FormControl>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Enter monthly rent" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d+$/.test(value)) {
                          field.onChange(value === '' ? '' : parseInt(value, 10));
                        }
                      }}
                      value={field.value === 0 ? '' : field.value}
                      className="bg-slate-50/50 border-2 border-slate-200 text-slate-700 placeholder:text-slate-400/70 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 hover:border-slate-300"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Payment Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-50/50 border-2 border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 hover:border-slate-300">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-2 border-slate-200">
                      <SelectItem value="paid" className="text-emerald-600 hover:text-emerald-700">Paid</SelectItem>
                      <SelectItem value="pending" className="text-yellow-600 hover:text-yellow-700">Pending</SelectItem>
                      <SelectItem value="overdue" className="text-red-600 hover:text-red-700">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payment_due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Payment Due Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="bg-slate-50/50 border-2 border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 hover:border-slate-300"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="istakingmess"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Taking Mess Facility</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="istakingmess"
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                      <label
                        htmlFor="istakingmess"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Taking Mess Facility
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Adding...</span>
                  </div>
                ) : (
                  "Add Student"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 