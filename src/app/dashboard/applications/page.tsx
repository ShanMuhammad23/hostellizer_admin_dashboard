"use client"
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { toast } from "sonner";
import { MessageCircleWarningIcon} from 'lucide-react';
import MegaLoader from '@/components/ui/MegaLoader';
interface Application {
  id: string;
  student_id: string;
  student_name: string;
  status: string;
  date: string;
  bidamount: number;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString());
  const lastUpdateRef = useRef<string>(new Date().toISOString());

  const fetchApplications = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }

      const url = isInitialLoad 
        ? '/api/applications'
        : `/api/applications?lastUpdate=${encodeURIComponent(lastUpdateRef.current)}`;

      const response = await axios.get(url);
      
      if (response.data.success) {
        if (isInitialLoad) {
          setApplications(response.data.applications);
        } else if (response.data.hasNew) {
          // Only update if there are new applications
          setApplications(prevApps => {
            const newApps = response.data.applications;
            const existingIds = new Set(prevApps.map(app => app.id));
            const uniqueNewApps = newApps.filter((app: Application) => !existingIds.has(app.id));
            return [...uniqueNewApps, ...prevApps];
          });
        }
        const newLastUpdate = new Date().toISOString();
        setLastUpdate(newLastUpdate);
        lastUpdateRef.current = newLastUpdate;
        setError(null);
      } else {
        throw new Error('Failed to fetch applications. Please check your internet connection!');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to fetch applications. Please check your internet connection!';
      setError(errorMessage);
      if (isInitialLoad) {
        toast.error(errorMessage, {
          duration: 5000,
        });
      }
    }
    if (isInitialLoad) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load
    fetchApplications(true);

    // Set up polling with exponential backoff
    let pollInterval = 5000; // Start with 5 seconds
    const maxInterval = 30000; // Max 30 seconds
    let timeoutId: NodeJS.Timeout;

    const poll = () => {
      fetchApplications(false);
      timeoutId = setTimeout(poll, pollInterval);
      // Increase interval up to max
      pollInterval = Math.min(pollInterval * 1.5, maxInterval);
    };

    timeoutId = setTimeout(poll, pollInterval);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [fetchApplications]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [id]: true }));
      const response = await axios.put('/api/applications', { id, status: newStatus });
      
      if (response.data.success) {
        setApplications(prevApps => 
          prevApps.map(app => 
            app.id === id ? { ...app, status: newStatus } : app
          )
        );
        toast.success('Application status updated successfully');
      } else {
        throw new Error(response.data.message || 'Failed to update application status');
      }
    } catch (error) {
      toast.error('Failed to update application status', {
        description: error instanceof Error ? error.message : 'Please try again later'
      });
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [id]: false }));
    }
  };

  // Filter applications based on search query and status
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredApplications = applications.filter(app => {
    const name = (app.student_name ?? "").toLowerCase();
    const status = app.status ?? "";
    const matchesSearch = name.includes(normalizedQuery);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <MegaLoader/>
  }

  if (error) {
    return (
      <div className="p-4 flex items-center justify-center max-w-md mt-6 mx-auto border height-content border-green-600">
        <div className="flex flex-col items-center gap-4">
          <div className='flex gap-4'>
            <MessageCircleWarningIcon className='text-red-500'/>
            <div className="text-red-500 text-lg font-medium">{error}</div>
          </div>
          
          <Button 
            onClick={() => fetchApplications(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white transition-colors duration-200"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-primary">Applications</h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border  shadow-sm">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-gray-50">
              <tr className="border-b transition-colors hover:bg-gray-100 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Student</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Date</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Bid Amount</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {filteredApplications.map((application) => (
                <tr key={application.id} className="border-b transition-colors hover:bg-primary/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle font-medium text-gray-900">{application.student_name.toUpperCase()}</td>
                  <td className="p-4 align-middle text-gray-600">{new Date(application.date).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                  <td className="p-4 align-middle font-semibold text-primary">{application.bidamount}</td>
                  <td className="p-4 align-middle">
                    <Badge
                      variant={
                        application.status === 'approved'
                          ? 'default'
                          : application.status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className={
                        application.status === 'approved'
                          ? 'bg-primary hover:bg-primary text-white'
                          : application.status === 'rejected'
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-amber-500 hover:bg-amber-600 text-white'
                      }
                    >
                      {application.status}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex gap-2">
                      <Select
                        value={application.status}
                        onValueChange={(value) => handleStatusChange(application.id, value)}
                        disabled={updatingStatus[application.id]}
                      >
                        <SelectTrigger className="w-[130px] border hover:border-primary focus:ring-primary">
                          <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approve</SelectItem>
                          <SelectItem value="rejected">Reject</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 