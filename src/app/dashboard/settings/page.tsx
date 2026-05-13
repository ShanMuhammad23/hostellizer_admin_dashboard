"use client";

import { useState, useEffect } from "react";
import { FaLock, FaToggleOn } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import axios from "axios";
const Settings = () => {
  const [isAcceptingApplications, setIsAcceptingApplications] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchIsAcceptingApplications = async () => {
      try {
        const response = await axios.get("/api/receiving-applications");
        setIsAcceptingApplications(response.data);
      } catch (error) {
        toast.error("Error fetching application status");
      }
    };
    fetchIsAcceptingApplications();
  }, []);
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    try {
        setIsLoading(true);
        const response = await axios.post("/api/change-password", passwords);
        if (response.status === 200) {
            setError("Password changed successfully");
            
        }
        else{
            setError(response.data.error);
        }
    } catch (error) {
        setError("Password change failed");
        console.error(error);
    }
    finally{
        setIsLoading(false);
    }
        setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        });
  };

  const handleApplicationToggle = async () => {
    try {
      const newStatus = !isAcceptingApplications;
      const response = await axios.post("/api/receiving-applications", { isAcceptingApplications: newStatus });
      if (response.status === 200) {
        setIsAcceptingApplications(newStatus);
        toast.success("Application status updated");
      } else {
        toast.error(response.data.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update application status");
    }
  };

  return (
    <div className="p-4 sm:p-8 w-full">
      <h1 className="text-2xl font-bold text-primary mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
        {/* Change Password Section */}
        <div className="bg-white rounded-lg border p-4 sm:p-6 w-full">
          <div className="flex items-center gap-3 mb-4">
            <FaLock className="text-2xl text-primary" />
            <h2 className="text-lg font-semibold text-primary">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <Input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
                className="w-full bg-white"
                required
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <Input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                className="w-full bg-white"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <Input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full bg-white"
                required
              />
            </div>
            <div className="flex items-center justify-center">
                {error && <p className="text-red-500">{error}</p>}
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary text-white"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Change Password"}
            </Button>
          </form>
        </div>

        {/* Application Control Section */}
        <div className="bg-white rounded-lg border p-4 sm:p-6 w-full h-fit">
          <div className="flex items-center gap-3 mb-4">
            <FaToggleOn className="text-2xl text-primary" />
            <h2 className="text-lg font-semibold text-primary">Application Control</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Accept Applications</h3>
                <p className="text-sm text-gray-500">
                  {isAcceptingApplications
                    ? "Currently accepting new applications"
                    : "Applications are currently closed"}
                </p>
              </div>
              <Switch
                checked={isAcceptingApplications}
                onCheckedChange={handleApplicationToggle}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">By turning this off, you will not be able to receive new applications.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;