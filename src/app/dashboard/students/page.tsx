"use client"
import { useState, useEffect } from 'react';
import { AddStudentForm } from '@/components/AddStudentForm';
import axios from 'axios';
import { Input } from "@/components/ui/input";
import { Search, Download, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from 'next/link';
import { useSession } from "next-auth/react";
import MegaLoader from '@/components/ui/MegaLoader';
import Image from "next/image";
interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  roomnumber: number;
  status: string;
  monthlyrent: number;
  joineddate: string;
  accomodationtype: string;
    paymentstatus: string;
    payment_due_date: string;
    istakingmess?: boolean;
    image?: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { data: session } = useSession();
  const [isExporting, setIsExporting] = useState(false);

  const fetchStudents = async () => {
    if (!session?.user?.id) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/students');
      if (response.data.success) {
        setStudents(response.data.students);
        setFilteredStudents(response.data.students);
      } else {
        throw new Error(response.data.message || 'Failed to fetch students');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to fetch students';
      setError(errorMessage);
      toast.error("Failed to load students", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchStudents();
    }
  }, [session]);

  useEffect(() => {
    const filtered = students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.phone.includes(searchQuery);
      
      const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
    setFilteredStudents(filtered);
  }, [searchQuery, filterStatus, students]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await axios.get('/api/students/export', {
        responseType: 'blob'
      });
      
      // Create a blob from the response data
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = 'students.xlsx';
      
      // Append the link to the document
      document.body.appendChild(link);
      
      // Click the link to trigger the download
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('Students data exported successfully');
    } catch (error) {
      console.error('Error exporting students:', error);
      toast.error('Failed to export students data');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return <MegaLoader/>
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="text-red-500 text-lg font-medium">{error}</div>
          <Button 
            onClick={fetchStudents}
            className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <h1 className="text-xl font-bold text-primary">All Students({filteredStudents.length})</h1>
          <AddStudentForm onStudentAdded={fetchStudents} />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export to Excel
              </>
            )}
          </Button>
          <div className="relative w-full sm:w-72 flex border px-2 rounded-md items-center" >
            <Search className=" h-4 w-4 text-primary" />
            <Input
              placeholder="Search by name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="outline-none border-none"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white border px-2 rounded-md  transition-all duration-200">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-purple-200">
              <SelectItem value="all" className="text-gray-700 hover:text-purple-900">All Status</SelectItem>
              <SelectItem value="active" className="text-emerald-700 hover:text-emerald-900">Active</SelectItem>
              <SelectItem value="inactive" className="text-red-700 hover:text-red-900">Inactive</SelectItem>
              <SelectItem value="pending" className="text-yellow-700 hover:text-yellow-900">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List Header */}
      <div className="bg-white rounded-t-lg border  p-4 hidden sm:grid grid-cols-5 gap-4 text-sm font-medium text-purple-900">
        <div>Student Name</div>
        <div>Phone Number</div>
        <div>Room Number</div>
        <div>Payment Status</div>
        <div>Due Date</div>
      </div>

      {/* List Items */}
      <div className="bg-white rounded-lg sm:rounded-b-lg border">
        {filteredStudents.map((student) => (
          <Link 
            key={student.id}
            href={`/dashboard/students/${student.id}`}
            className="block sm:grid sm:grid-cols-5 gap-4 p-4 hover:bg-purple-50 transition-colors duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="relative hidden h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-50 sm:block">
                {student.image ? (
                  <Image
                    src={student.image}
                    alt=""
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                    unoptimized={student.image.startsWith("/uploads/")}
                  />
                ) : (
                  <Image
                    src="/img/user-placeholder-image.jpg"
                    alt=""
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col sm:block mb-2 sm:mb-0">
                <span className="text-xs text-gray-500 sm:hidden">Student Name</span>
                <div className="text-primary font-medium">{student.name}</div>
              </div>
            </div>
            <div className="flex flex-col sm:block mb-2 sm:mb-0">
              <span className="text-xs text-gray-500 sm:hidden">Phone Number</span>
              <div className="text-gray-700 font-medium">{student.phone}</div>
            </div>
            <div className="flex flex-col sm:block mb-2 sm:mb-0">
              <span className="text-xs text-gray-500 sm:hidden">Room Number</span>
              <div className="text-emerald-700 font-medium">Room {student.roomnumber}</div>
            </div>
            <div className="flex flex-col sm:block mb-2 sm:mb-0">
              <span className="text-xs text-gray-500 sm:hidden">Payment Status</span>
              <div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  student.paymentstatus === 'paid' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : student.paymentstatus === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {student.paymentstatus}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:block">
              <span className="text-xs text-gray-500 sm:hidden">Due Date</span>
              <div className="text-gray-700 font-medium">
                {new Date(student.payment_due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 