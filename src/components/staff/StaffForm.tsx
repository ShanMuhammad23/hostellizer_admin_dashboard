"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { toast } from "sonner";
import { LocalImageUpload } from "@/components/LocalImageUpload";

const schema = z.object({
  cnic: z.string().min(13, "CNIC must be at least 13 digits"),
  fullName: z.string().min(2, "Required"),
  fatherOrSpouseName: z.string().optional(),
  role: z.string().min(1, "Required"),
  employmentType: z.enum(["permanent", "daily_wage"]),
  joinDate: z.string().min(1),
  salaryAmountMonthly: z.coerce.number().min(0),
  salaryIsGross: z.boolean(),
  salaryNetAmount: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountOrIban: z.string().optional(),
  easypaisaMsisdn: z.string().optional(),
  jazzcashMsisdn: z.string().optional(),
  addressStreet: z.string().min(1, "Address required"),
  phone: z.string().min(10, "Phone required"),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  contractLanguage: z.string(),
  status: z.enum(["active", "inactive", "terminated"]),
  notes: z.string().optional(),
});

export type StaffFormValues = z.infer<typeof schema>;

export function emptyStaffDefaults(): StaffFormValues {
  return {
    cnic: "",
    fullName: "",
    fatherOrSpouseName: "",
    role: "Guard",
    employmentType: "permanent",
    joinDate: new Date().toISOString().slice(0, 10),
    salaryAmountMonthly: 0,
    salaryIsGross: true,
    salaryNetAmount: "",
    bankName: "",
    bankAccountOrIban: "",
    easypaisaMsisdn: "",
    jazzcashMsisdn: "",
    addressStreet: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    contractLanguage: "ur",
    status: "active",
    notes: "",
  };
}

export function staffToFormValues(s: Record<string, unknown>): StaffFormValues {
  const addr = (s.address as { street?: string }) || {};
  return {
    cnic: String(s.cnic ?? ""),
    fullName: String(s.fullName ?? ""),
    fatherOrSpouseName: String(s.fatherOrSpouseName ?? ""),
    role: String(s.role ?? "Guard"),
    employmentType:
      s.employmentType === "daily_wage" ? "daily_wage" : "permanent",
    joinDate: String(s.joinDate ?? "").slice(0, 10),
    salaryAmountMonthly: Number(s.salaryAmountMonthly ?? 0),
    salaryIsGross: s.salaryIsGross !== false,
    salaryNetAmount:
      s.salaryNetAmount != null && s.salaryNetAmount !== ""
        ? String(s.salaryNetAmount)
        : "",
    bankName: String(s.bankName ?? ""),
    bankAccountOrIban: String(s.bankAccountOrIban ?? ""),
    easypaisaMsisdn: String(s.easypaisaMsisdn ?? ""),
    jazzcashMsisdn: String(s.jazzcashMsisdn ?? ""),
    addressStreet: String(addr.street ?? ""),
    phone: String(s.phone ?? ""),
    emergencyContactName: String(s.emergencyContactName ?? ""),
    emergencyContactPhone: String(s.emergencyContactPhone ?? ""),
    emergencyContactRelation: String(s.emergencyContactRelation ?? ""),
    contractLanguage: String(s.contractLanguage ?? "ur"),
    status:
      s.status === "inactive" || s.status === "terminated"
        ? s.status
        : "active",
    notes: String(s.notes ?? ""),
  };
}

function buildPayload(
  v: StaffFormValues,
  photoPath: string | null,
  contractPath: string | null,
  complianceDocuments: { type: string; file_path: string }[]
) {
  return {
    cnic: v.cnic.replace(/\D/g, ""),
    fullName: v.fullName,
    fatherOrSpouseName: v.fatherOrSpouseName || undefined,
    role: v.role,
    employmentType: v.employmentType,
    joinDate: v.joinDate,
    salaryAmountMonthly: v.salaryAmountMonthly,
    salaryIsGross: v.salaryIsGross,
    salaryNetAmount: v.salaryNetAmount ? Number(v.salaryNetAmount) : null,
    bankName: v.bankName || undefined,
    bankAccountOrIban: v.bankAccountOrIban || undefined,
    easypaisaMsisdn: v.easypaisaMsisdn || undefined,
    jazzcashMsisdn: v.jazzcashMsisdn || undefined,
    address: { street: v.addressStreet, town: "", city: "" },
    phone: v.phone,
    emergencyContactName: v.emergencyContactName || undefined,
    emergencyContactPhone: v.emergencyContactPhone || undefined,
    emergencyContactRelation: v.emergencyContactRelation || undefined,
    photoPath: photoPath ?? undefined,
    contractDocumentPath: contractPath ?? undefined,
    contractLanguage: v.contractLanguage,
    complianceDocuments,
    status: v.status,
    notes: v.notes || undefined,
  };
}

interface StaffFormProps {
  mode: "create" | "edit";
  staffId?: string;
  initialStaff?: Record<string, unknown> | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StaffForm({
  mode,
  staffId,
  initialStaff,
  onSuccess,
  onCancel,
}: StaffFormProps) {
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyStaffDefaults(),
  });

  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [contractPath, setContractPath] = useState<string | null>(null);
  const [compliance, setCompliance] = useState<
    { type: string; file_path: string }[]
  >([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === "edit" && initialStaff) {
      form.reset(staffToFormValues(initialStaff));
      const p = String(initialStaff.photoPath ?? "");
      setPhotoPath(p || null);
      const c = String(initialStaff.contractDocumentPath ?? "");
      setContractPath(c || null);
      const docs = initialStaff.complianceDocuments;
      setCompliance(Array.isArray(docs) ? (docs as { type: string; file_path: string }[]) : []);
    }
  }, [mode, initialStaff, form]);

  async function onSubmit(v: StaffFormValues) {
    setSaving(true);
    try {
      const payload = buildPayload(v, photoPath, contractPath, compliance);
      const url = mode === "create" ? "/api/staff" : `/api/staff/${staffId}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Save failed");
      }
      onSuccess();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="cnic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNIC (digits)</FormLabel>
                <FormControl>
                  <Input placeholder="35202..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name (official)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fatherOrSpouseName"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Father / husband name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role / designation</FormLabel>
                <FormControl>
                  <Input list="staff-roles" {...field} placeholder="Warden, Guard, Cook…" />
                </FormControl>
                <datalist id="staff-roles">
                  <option value="Warden" />
                  <option value="Head Guard" />
                  <option value="Guard" />
                  <option value="Cook" />
                  <option value="Assistant Cook" />
                  <option value="Cleaner" />
                  <option value="Electrician (part-time)" />
                </datalist>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="employmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent (monthly)</SelectItem>
                    <SelectItem value="daily_wage">Daily wage</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="joinDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Join date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salaryAmountMonthly"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly salary (PKR)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
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
            name="salaryIsGross"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0 pt-8">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(c) => field.onChange(c === true)}
                  />
                </FormControl>
                <FormLabel className="!mt-0">Salary is gross</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salaryNetAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Net salary (optional, PKR)</FormLabel>
                <FormControl>
                  <Input placeholder="If known" {...field} />
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
                <FormLabel>Phone (WhatsApp)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="addressStreet"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Address (current / hometown)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankAccountOrIban"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account / IBAN</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="easypaisaMsisdn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Easypaisa MSISDN</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jazzcashMsisdn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>JazzCash MSISDN</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emergencyContactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency contact name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emergencyContactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency contact phone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emergencyContactRelation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relation</FormLabel>
                <FormControl>
                  <Input placeholder="Wife, brother…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contractLanguage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract language</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ur">Urdu</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="bilingual">Bilingual</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <textarea
                    rows={2}
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-medium">Photo (ID card)</p>
          {photoPath ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-md border">
              <Image src={photoPath} alt="" fill className="object-cover" unoptimized />
            </div>
          ) : null}
          <LocalImageUpload
            folder="staff"
            label={photoPath ? "Change photo" : "Upload photo"}
            onUploadSuccess={(p) => setPhotoPath(p)}
          />
        </div>

        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-medium">Contract (PDF)</p>
          {contractPath ? (
            <a href={contractPath} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
              View uploaded contract
            </a>
          ) : null}
          <LocalImageUpload
            folder="documents"
            label={contractPath ? "Replace contract PDF" : "Upload contract PDF"}
            accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
            onUploadSuccess={(p) => setContractPath(p)}
          />
        </div>

        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-medium">Compliance documents</p>
          {compliance.map((d, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{d.type}</span>
              <a href={d.file_path} target="_blank" rel="noreferrer" className="text-primary underline">
                File
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => setCompliance((c) => c.filter((_, j) => j !== i))}
              >
                Remove
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 items-end">
            <Input
              id="docType"
              placeholder="Document type (e.g. CNIC copy)"
              className="max-w-xs"
            />
            <LocalImageUpload
              folder="documents"
              label="Add document"
              accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
              onUploadSuccess={(path) => {
                const el = document.getElementById("docType") as HTMLInputElement | null;
                const type = el?.value?.trim() || "Document";
                setCompliance((c) => [...c, { type, file_path: path }]);
                if (el) el.value = "";
              }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Create staff" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
