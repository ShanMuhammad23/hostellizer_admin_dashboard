"use client"
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import Image from "next/image";
import { LocalImageUpload } from "@/components/LocalImageUpload";
import { getUploadServeUrl, isPrivateUploadPath, isStoredUploadPath } from "@/lib/upload-url";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

/** API may return `YYYY-MM-DD` or an ISO datetime string */
function formatDueDateInput(v: string | null | undefined): string {
  if (v == null || v === "") return "";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : format(d, "yyyy-MM-dd");
}

function normalizePaymentStatusEnum(
  raw: string | undefined
): "paid" | "pending" | "overdue" {
  if (raw == null || raw === "") return "pending";
  const v = String(raw).toLowerCase();
  if (v === "paid") return "paid";
  if (v === "overdue") return "overdue";
  return "pending";
}

function normalizeMessFlag(student: {
  istakingmess?: boolean;
  is_taking_mess?: boolean;
}): boolean {
  const v: unknown = student.istakingmess ?? student.is_taking_mess;
  return v === true || v === "true" || v === 1;
}

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

interface EditStudentFormProps {
  student: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    roomNumber: number;
    status: string;
    accomodationType: string;
    monthlyRent: number;
    /** Prefer camelCase; `paymentstatus` matches GET `/api/students` JSON */
    paymentStatus?: string;
    paymentstatus?: string;
    payment_due_date: string;
    istakingmess?: boolean;
    is_taking_mess?: boolean;
    image?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentUpdated: () => void;
}

export function EditStudentForm({ student, open, onOpenChange, onStudentUpdated }: EditStudentFormProps) {
  const [loading, setLoading] = useState(false);
  const [profilePath, setProfilePath] = useState(student.image || "");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: student.name,
      email: student.email,
      phone: student.phone,
      address: student.address,
      roomNumber: student.roomNumber,
      status: student.status as "active" | "inactive" | "pending",
      accomodationType: student.accomodationType as "single" | "double" | "triple",
      monthlyRent: student.monthlyRent,
      paymentStatus: normalizePaymentStatusEnum(
        student.paymentStatus ?? student.paymentstatus
      ),
      payment_due_date: formatDueDateInput(student.payment_due_date),
      istakingmess: normalizeMessFlag(student),
    },
  });

  // Update form values when student data changes
  useEffect(() => {
    form.reset({
      name: student.name,
      email: student.email,
      phone: student.phone,
      address: student.address,
      roomNumber: student.roomNumber,
      status: student.status as "active" | "inactive" | "pending",
      accomodationType: student.accomodationType as "single" | "double" | "triple",
      monthlyRent: student.monthlyRent,
      paymentStatus: normalizePaymentStatusEnum(
        student.paymentStatus ?? student.paymentstatus
      ),
      payment_due_date: formatDueDateInput(student.payment_due_date),
      istakingmess: normalizeMessFlag(student),
    });
  }, [student, form]);

  useEffect(() => {
    setProfilePath(student.image || "");
  }, [student.image, student.id]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const payload: Record<string, unknown> = { ...values };
      if (profilePath === "") {
        payload.profileImagePath = null;
      } else if (isStoredUploadPath(profilePath)) {
        payload.profileImagePath = profilePath;
      }

      const response = await axios.put(`/api/students/${student.id}`, payload);

      if (response.data.success) {
        toast.success("Student updated successfully!", {
          description: "The student's details have been updated in the database.",
          duration: 5000,
        });
        onOpenChange(false);
        onStudentUpdated();
      } else {
        toast.error("Failed to update student", {
          description: response.data.message || "Please check the form and try again.",
          duration: 5000,
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to update student';
      toast.error("Failed to update student", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto my-4">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col items-center gap-2 border-b pb-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full border">
                {profilePath ? (
                  <Image
                    src={getUploadServeUrl(profilePath)}
                    alt=""
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                    unoptimized={isPrivateUploadPath(profilePath)}
                  />
                ) : (
                  <Image
                    src="/img/user-placeholder-image.jpg"
                    alt=""
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <LocalImageUpload
                  folder="students"
                  label={profilePath ? "Change photo" : "Add photo"}
                  onUploadSuccess={(path) => setProfilePath(path)}
                />
                {profilePath ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => setProfilePath("")}
                  >
                    Remove photo
                  </Button>
                ) : null}
              </div>
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter student name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roomNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Number</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter room number" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accomodationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accommodation Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                      <SelectItem value="triple">Triple</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthlyRent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Rent</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter monthly rent" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payment_due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Due Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="istakingmess"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taking mess facility</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-istakingmess"
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                      <label
                        htmlFor="edit-istakingmess"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Student uses mess facility
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white transition-colors duration-200" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                "Update Student"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 