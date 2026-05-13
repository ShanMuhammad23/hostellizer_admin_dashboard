import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from 'axios';
import { EditStudentForm } from "@/components/EditStudentForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StudentCardProps {
  student: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    roomNumber: number;
    status: string;
    monthlyRent: number;
    joinedDate: string;
    accomodationType: string;
    paymentStatus: string;
    payment_due_date: string;
  };
  onStudentUpdated: () => void;
}

export function StudentCard({ student, onStudentUpdated }: StudentCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    try {
      const response = await axios.delete(`/api/students/${student.id}`);
      if (response.data.success) {
        toast.success("Student deleted successfully!");
        onStudentUpdated();
      } else {
        throw new Error(response.data.message || 'Failed to delete student');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to delete student';
      toast.error("Failed to delete student", {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-lg rounded-lg border border-emerald-500/20 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0 mr-4">
          <h3 className="text-lg font-semibold text-white truncate">{student.name}</h3>
          <p className="text-sm text-emerald-300/70 truncate">{student.email}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
            className="text-emerald-300/70 hover:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-emerald-300/70 hover:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200"
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-emerald-200">Phone</span>
          <span className="text-sm text-emerald-300/70">{student.phone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-emerald-200">Room</span>
          <span className="text-sm text-emerald-300/70">{student.roomNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-emerald-200">Status</span>
          <span className="text-sm text-emerald-300/70">{student.status}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-emerald-200">Monthly Rent</span>
          <span className="text-sm text-emerald-300/70">PKR {student.monthlyRent}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-emerald-200">Joined Date</span>
          <span className="text-sm text-emerald-300/70">{new Date(student.joinedDate).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-emerald-200">Accommodation</span>
          <span className="text-sm text-emerald-300/70">{student.accomodationType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-emerald-200">Payment Status</span>
          <span className={`text-sm ${
            student.paymentStatus === "Paid" 
              ? "text-emerald-400" 
              : student.paymentStatus === "Pending"
              ? "text-yellow-400"
              : "text-red-400"
          }`}>
            {student.paymentStatus}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-emerald-200">Due Date</span>
          <span className="text-sm text-emerald-300/70">{new Date(student.payment_due_date).toLocaleDateString()}</span>
        </div>
      </div>

      <EditStudentForm
        student={student}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onStudentUpdated={onStudentUpdated}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border border-emerald-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-400">Delete Student</AlertDialogTitle>
            <AlertDialogDescription className="text-emerald-300/70">
              Are you sure you want to delete this student? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-emerald-300/70 hover:text-emerald-400 hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-emerald-500 text-white hover:bg-emerald-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 