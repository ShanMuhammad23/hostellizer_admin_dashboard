"use client"
import { useState } from "react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { ProfileData } from "@/app/dashboard/profile/page";
import { Loader2 } from "lucide-react";
const formSchema = z.object({
  hostel_phone: z.string().min(10, "Phone number must be at least 10 digits"),
  hostel_monthly_rent_range: z.object({
    min: z.number().min(0, "Minimum rent must be at least 0"),
    max: z.number().min(0, "Maximum rent must be at least 0"),
  }),
  hostel_rules: z.array(z.string()),
  amenities: z.object({
    wifi: z.boolean(),
    laundry: z.boolean(),
    mess: z.object({
      available: z.boolean(),
      price_per_month: z.number().min(0, "Price must be at least 0"),
    }),
    security: z.boolean(),
    powerBackup: z.boolean(),
    kitchen: z.boolean(),
    parking: z.boolean(),
    electricity: z.object({
      included_in_rent: z.boolean(),
      price_per_unit: z.number().min(0, "Price must be at least 0"),
    }),
    transport: z.object({
      speedo_stop: z.string(),
      distance_in_meters: z.number().min(0, "Distance must be at least 0"),
    }),
  }),
  total_rooms: z.number().min(0, "Total rooms must be at least 0"),
  vacancies_available: z.number().min(0, "Vacancies must be at least 0"),
  total_vacancies: z.number().min(0, "Total vacancies must be at least 0"),
});

interface EditProfileFormProps {
  hostel: ProfileData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated: () => void;
}

export function EditProfileForm({ hostel, open, onOpenChange, onProfileUpdated }: EditProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [newRule, setNewRule] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hostel_phone: hostel.hostel_phone,
      hostel_monthly_rent_range: hostel.hostel_monthly_rent_range,
      hostel_rules: hostel.hostel_rules,
      amenities: hostel.amenities,
      total_rooms: hostel.totalrooms,
      vacancies_available: hostel.vacanciesavailable,
      total_vacancies: hostel.total_vacancies,
    },
  });

  const addRule = () => {
    if (newRule.trim()) {
      const currentRules = form.getValues("hostel_rules");
      form.setValue("hostel_rules", [...currentRules, newRule.trim()]);
      setNewRule("");
    }
  };

  const removeRule = (index: number) => {
    const currentRules = form.getValues("hostel_rules");
    form.setValue("hostel_rules", currentRules.filter((_, i) => i !== index));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const updatedData = {
        hostel_phone: values.hostel_phone,
        hostel_monthly_rent_range: values.hostel_monthly_rent_range,
        hostel_rules: values.hostel_rules,
        amenities: values.amenities,
        total_rooms: values.total_rooms,
        vacancies_available: values.vacancies_available,
        total_vacancies: values.total_vacancies,
      };
      
      const response = await axios.patch(`/api/hostel/${hostel.hostel_id}`, updatedData);

      if (response.data.success) {
        toast.success("Profile updated successfully!", {
          description: "The hostel's details have been updated in the database.",
          duration: 5000,
        });
        onOpenChange(false);
        onProfileUpdated();
      } else {
        toast.error("Failed to update profile", {
          description: response.data.message || "Please check the form and try again.",
          duration: 5000,
        });
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors;
        const errorMessage = validationErrors.map((error: any) => 
          `${error.path.join('.')}: ${error.message}`
        ).join('\n');
        
        toast.error("Validation Error", {
          description: errorMessage,
          duration: 5000,
        });
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to update profile';
        toast.error("Failed to update profile", {
          description: errorMessage,
          duration: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto my-2">
        <DialogHeader>
          <DialogTitle className="text-primary">Edit Hostel Profile</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-primary">Basic Information</h3>
              <FormField
                control={form.control}
                name="hostel_phone"
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
            </div>

            {/* Room Information Section */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Room Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="total_rooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Rooms</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter total rooms" 
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
                  name="total_vacancies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Vacancies</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter total vacancies" 
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
                  name="vacancies_available"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Vacancies</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter available vacancies" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Rules Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Hostel Rules</h3>
              <div className="space-y-2">
                {form.getValues("hostel_rules").map((rule, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={rule} readOnly />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeRule(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="Add new rule"
                  />
                  <Button type="button" onClick={addRule}>
                    Add Rule
                  </Button>
                </div>
              </div>
            </div>

            {/* Amenities Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Amenities</h3>
              <div className="space-y-4">
                {/* Basic Amenities */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amenities.wifi"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">WiFi</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amenities.laundry"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Laundry</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amenities.security"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Security</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amenities.powerBackup"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Power Backup</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amenities.kitchen"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Kitchen</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amenities.parking"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Parking</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Mess Section */}
                <div className="space-y-2">
                  <h4 className="font-medium">Mess</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amenities.mess.available"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Available</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amenities.mess.price_per_month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per Month</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter price" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Electricity Section */}
                <div className="space-y-2">
                  <h4 className="font-medium">Electricity</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amenities.electricity.included_in_rent"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Included in Rent</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amenities.electricity.price_per_unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per Unit</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter price" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Transport Section */}
                <div className="space-y-2">
                  <h4 className="font-medium">Transport</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amenities.transport.speedo_stop"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Speedo Stop</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter stop name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amenities.transport.distance_in_meters"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Distance (meters)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter distance" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rent Range Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Rent Range</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hostel_monthly_rent_range.min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Rent</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter minimum rent" 
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
                  name="hostel_monthly_rent_range.max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Rent</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter maximum rent" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 