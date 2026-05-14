"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaBed, FaMoneyBillWave, FaDoorOpen, FaClock, FaReceipt, FaPencilAlt, FaPlus } from "react-icons/fa"
import { format, differenceInMonths } from "date-fns"
import { toast } from "sonner"
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from "@/components/ui/button"
import {ScrollText, CheckCircle,X} from "lucide-react"
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { AttendanceCalendar } from '@/components/AttendanceCalendar';
import { MessAttendance } from '@/components/MessAttendance';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge"
import { LocalImageUpload } from "@/components/LocalImageUpload";
// Register the plugin
interface WindowWithJsPDF extends Window {
    jsPDF: typeof jsPDF;
}
(window as unknown as WindowWithJsPDF).jsPDF = jsPDF; // For some environments, this helps

interface Address {
    street: string;
    town: string;
    city: string;
}

interface StudentDetails {
    id: string;
    name: string;
    image: string;
    email: string;
    phone: string;
    address: Address;
    roomnumber: number;
    status: string;
    joineddate: string;
    accomodationtype: string;
    monthlyrent: number;
    paymentstatus: string;
    payment_due_date: string;
    leavedate: string;
    istakingmess: boolean;
    payment_history: {
        id: string;
        amount: number;
        date: string;
        createdAt: string;
        paymentChannel: string;
        transactionId?: string;
    }[];
    total_amount_paid: number;
}

function generateTranscript(student: StudentDetails) {
    const doc = new jsPDF();
    // Hostel Header
    doc.setFontSize(18);
    doc.text('Hostellizer Hostel Management', 14, 18);
    doc.setFontSize(12);
    doc.text('123 Hostel Lane, City, Country', 14, 26);
    doc.text('Phone: +92-123-4567890', 14, 32);
    doc.line(14, 36, 196, 36);

    // Student Details
    doc.setFontSize(14);
    doc.text('Student Details', 14, 46);
    doc.setFontSize(12);
    doc.text(`Name: ${student.name}`, 14, 54);
    doc.text(`Room Number: ${student.roomnumber}`, 14, 60);
    doc.text(`Phone: ${student.phone}`, 14, 66);
    doc.text(`Email: ${student.email}`, 14, 72);
    doc.text(`Accommodation: ${student.accomodationtype}`, 14, 78);
    doc.text(`Monthly Rent: PKR ${student.monthlyrent}`, 14, 84);
    doc.text(`Joined Date: ${student.joineddate ? new Date(student.joineddate).toLocaleDateString() : ''}`, 14, 90);

    // Payment History Table
    doc.setFontSize(14);
    doc.text('Payment History', 14, 104);
    autoTable(doc, {
        startY: 110,
        head: [['#', 'Amount (PKR)', 'Date', 'Payment Channel', 'Transaction ID', 'Status']],
        body: student.payment_history.map((p, idx) => [
            idx + 1,
            p.amount,
            p.date ? new Date(p.date).toLocaleDateString() : '',
            p.paymentChannel?.replace('_', ' ') || '-',
            p.transactionId || '-',
            'Paid',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 11 },
    });

    // Footer
    doc.setFontSize(10);
    doc.text('Hostellizer - Admin Dashboard', 14, 280);
    doc.text('Shan Muhammad', 14, 285);
    doc.text('03219720819', 14, 290);
    doc.text('Generated on: ' + new Date().toLocaleDateString(), 14, 295);
    doc.text('This is a computer generated document, no signature required.', 14, 300);

    // Open PDF in a new window for printing
    const pdfOutput = doc.output('datauristring');
    const printWindow = window.open();
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>${student.name} - Hostel Transcript</title>
                    <style>
                        body { margin: 0; }
                        iframe { width: 100%; height: 100vh; border: none; }
                    </style>
                </head>
                <body>
                    <iframe src="${pdfOutput}"></iframe>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
}

export default function StudentDetails({ params }: { params: { id: string } }) {
    const { id } = params;
    const [student, setStudent] = useState<StudentDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedStudent, setEditedStudent] = useState<StudentDetails | null>(null);
    const [editError, setEditError] = useState<string | null>(null);
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [newPayment, setNewPayment] = useState({
        amount: '',
        date: '',
        paymentChannel: '',
        transactionId: ''
    });
    const [addPaymentError, setAddPaymentError] = useState<string | null>(null);
    const [addPaymentLoading, setAddPaymentLoading] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);
    const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(false);
    const [loadingTransaction, setLoadingTransaction] = useState<string | null>(null);
    const [showAttendance, setShowAttendance] = useState(false);
    const [showMessAttendance, setShowMessAttendance] = useState(false);

    useEffect(() => {
        const fetchStudentDetails = async () => {
            try {
                console.log('Fetching student with ID:', id);
                const response = await axios.get(`/api/students/${id}`);
                console.log('Response:', response.data);

                if (response.data.success) {
                    console.log('Payment History:', response.data.student.payment_history);
                    setStudent(response.data.student);
                } else {
                    throw new Error(response.data.message || 'Failed to fetch student details');
                }
            } catch (error) {
                console.error('Error fetching student details:', error);
                setError(error instanceof Error ? error.message : 'Failed to fetch student details');
                toast.error('Failed to fetch student details', {
                    description: error instanceof Error ? error.message : 'Please try again later'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStudentDetails();
    }, [id]);

    const calculateTimeSpan = (joinedDate: string) => {
        if (!joinedDate) return 0;
        try {
            // Extract just the date part (YYYY-MM-DD) from the ISO string
            const dateStr = joinedDate.split('T')[0];
            const date = new Date(dateStr + 'T00:00:00');
            if (isNaN(date.getTime())) return 0;
            const months = differenceInMonths(new Date(), date);
            return months || 0;
        } catch (error) {
            console.error('Error calculating time span:', error);
            return 0;
        }
    };

    const handleEdit = () => {
        setEditedStudent(student);
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            const response = await axios.put(`/api/students/${id}`, editedStudent);
            if (response.data.success) {
                const refreshed = await axios.get(`/api/students/${id}`);
                if (refreshed.data.success) {
                    setStudent(refreshed.data.student);
                }
                setIsEditing(false);
                toast.success('Student details updated successfully');
            } else {
                throw new Error(response.data.message || response.data.error || 'Failed to update student details');
            }
        } catch (error) {
            setEditError(error instanceof Error ? error.message : 'Failed to update student details');
            toast.error('Failed to update student details', {
                description: error instanceof Error ? error.message : 'Please try again later'
            });
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedStudent(null);
        setEditError(null);
    };

    const handleAddPayment = () => {
        setShowAddPayment(true);
        setNewPayment({ amount: '', date: '', paymentChannel: '', transactionId: '' });
        setAddPaymentError(null);
    };

    const handleAddPaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent form submission from reloading the page
        setAddPaymentLoading(true);
        setAddPaymentError(null);
        try {
            if (!student) return;
            const response = await axios.post('/api/payments', {
                studentId: student.id,
                amount: Number(newPayment.amount),
                date: newPayment.date,
                paymentChannel: newPayment.paymentChannel,
                transactionId: newPayment.transactionId,
            });
            if (response.data.success) {
                toast.success('Payment added successfully');
                setShowAddPayment(false);
                setNewPayment({ amount: '', date: '', paymentChannel: '', transactionId: '' });
                // Refresh student details
                const refreshed = await axios.get(`/api/students/${id}`);
                if (refreshed.data.success) setStudent(refreshed.data.student);
            } else {
                throw new Error(response.data.message || 'Failed to add payment');
            }
        } catch (error) {
            setAddPaymentError(error instanceof Error ? error.message : 'Failed to add payment');
            toast.error('Failed to add payment', {
                description: error instanceof Error ? error.message : 'Please try again later'
            });
        } finally {
            setAddPaymentLoading(false);
        }
    };

    const handlePaymentClick = async (paymentId: string) => {
        setLoadingTransaction(paymentId);
        setPaymentDetailsLoading(true);
        try {
            const response = await axios.get(`/api/payments/${paymentId}`);
            if (response.data.success) {
                setSelectedPayment(response.data.payment);
                setShowPaymentDetails(true);
            } else {
                throw new Error(response.data.message || 'Failed to fetch payment details');
            }
        } catch (error) {
            toast.error('Failed to fetch payment details', {
                description: error instanceof Error ? error.message : 'Please try again later'
            });
        } finally {
            setPaymentDetailsLoading(false);
            setLoadingTransaction(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-500">Student not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-4 px-2 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="bg-white rounded-lg border overflow-hidden mb-4 sm:mb-8">
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row  sm:justify-between gap-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                                <div className="h-40 w-40 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                                    {student.image ? (
                                        <Image
                                            src={student.image}
                                            alt={student.name}
                                            width={160}
                                            height={160}
                                            className="h-full w-full object-cover"
                                            unoptimized={student.image.startsWith("/uploads/")}
                                        />
                                    ) : (
                                        <Image src='/img/user-placeholder-image.jpg' alt='User Placeholder' width={160} height={160} className="h-full w-full object-cover" />
                                    )}
                                </div>
                                <div className="flex flex-col  gap-2 sm:gap-4">
                                    <h1 className="text-xl sm:text-4xl font-bold text-primary flex flex-wrap items-center gap-2">
                                        {student.name}
                                     <Badge variant={student.status === 'active' ? 'default' : 'destructive'}>{student.status}</Badge>
                                    </h1>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            variant={showAttendance ? "outline" : "default"}
                                            onClick={() => setShowAttendance(v => !v)}
                                            className="text-xs sm:text-sm"
                                        >
                                            {showAttendance ? 'Hide Attendance' : 'Show Attendance'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={showMessAttendance ? "secondary" : "outline"}
                                            onClick={() => setShowMessAttendance(v => !v)}
                                            className="text-xs sm:text-sm"
                                        >
                                            {showMessAttendance ? 'Hide Mess Attendance' : 'Show Mess Attendance'}
                                        </Button>
                                            <Link href={`/dashboard/students/${id}/documents`}>
                                            <Button variant='outline' size='sm'>
                                                <ScrollText className="mr-2" />
                                                Documents
                                            </Button>
                                            </Link>
                                            
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Edit Button */}
                    <div className="flex justify-end mt-2 sm:mt-4 px-4 sm:px-6 pb-4">
                        <Button
                            onClick={handleEdit}
                            variant="outline"
                        >
                            <FaPencilAlt className="mr-2" /> Edit Student Details
                        </Button>
                    </div>

                </div>

                {/* Attendance Calendar Section */}
                {showAttendance && (
                    <div className="mt-4 sm:mt-6 transition-all duration-300 ease-in-out">
                        <div className="backdrop-blur-lg rounded-lg border p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg sm:text-xl font-semibold text-primary">Attendance Record</h2>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-primary hover:text-primary-900 hover:bg-primary-50"
                                    onClick={() => setShowAttendance(false)}
                                >
                                    Hide Attendance
                                </Button>
                            </div>
                            <div className="relative min-h-[400px]">
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-lg transition-opacity duration-300"
                                    style={{ opacity: loading ? 1 : 0, pointerEvents: loading ? 'auto' : 'none' }}>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                        <p className="text-sm text-primary font-medium">Loading attendance data...</p>
                                    </div>
                                </div>
                                <AttendanceCalendar studentId={student.id} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Mess Attendance Section */}
                {showMessAttendance && (
                    <div className="mt-4 sm:mt-6 transition-all duration-300 ease-in-out">
                        <div className="backdrop-blur-lg rounded-lg border p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg sm:text-xl font-semibold text-primary">Mess Attendance</h2>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-primary hover:text-primary-900 hover:bg-primary-50"
                                    onClick={() => setShowMessAttendance(false)}
                                >
                                    Hide Mess Attendance
                                </Button>
                            </div>
                            {student.istakingmess ? (
                                <MessAttendance studentId={student.id} />
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-lg text-gray-600 mb-2">Not Taking Mess Facility</div>
                                    <p className="text-sm text-gray-500">
                                        This student is not enrolled in the mess facility.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Edit Student Dialog */}
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogContent className=" border">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-primary ">Edit Student Details</DialogTitle>
                        </DialogHeader>
                        {editedStudent && (
                            <div className="space-y-4 mt-4">
                                <div className="flex flex-col items-center gap-3 border-b border-slate-100 pb-4">
                                    <div className="relative h-24 w-24 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                                        {editedStudent.image ? (
                                            <Image
                                                src={editedStudent.image}
                                                alt=""
                                                width={96}
                                                height={96}
                                                className="h-full w-full object-cover"
                                                unoptimized={editedStudent.image.startsWith("/uploads/")}
                                            />
                                        ) : (
                                            <Image
                                                src="/img/user-placeholder-image.jpg"
                                                alt=""
                                                width={96}
                                                height={96}
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                        <LocalImageUpload
                                            folder="students"
                                            label={editedStudent.image ? "Change photo" : "Add photo"}
                                            onUploadSuccess={(path) =>
                                                setEditedStudent({ ...editedStudent, image: path })
                                            }
                                        />
                                        {editedStudent.image ? (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600"
                                                onClick={() =>
                                                    setEditedStudent({ ...editedStudent, image: "" })
                                                }
                                            >
                                                Remove photo
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary">Name</label>
                                    <input
                                        type="text"
                                        value={editedStudent.name}
                                        onChange={(e) => setEditedStudent({ ...editedStudent, name: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary">Email</label>
                                    <input
                                        type="email"
                                        value={editedStudent.email}
                                        onChange={(e) => setEditedStudent({ ...editedStudent, email: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary">Phone</label>
                                    <input
                                        type="text"
                                        value={editedStudent.phone}
                                        onChange={(e) => setEditedStudent({ ...editedStudent, phone: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary">Monthly Rent</label>
                                    <input
                                        type="number"
                                        value={editedStudent.monthlyrent}
                                        onChange={(e) => setEditedStudent({ ...editedStudent, monthlyrent: Number(e.target.value) })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="istakingmess"
                                        checked={editedStudent.istakingmess}
                                        onChange={(e) => setEditedStudent({ ...editedStudent, istakingmess: e.target.checked })}
                                    />
                                    <label htmlFor="istakingmess" className="text-sm font-medium text-primary">
                                        Taking Mess Facility
                                    </label>
                                </div>
                                {editError && <div className="text-red-500">{editError}</div>}
                            </div>
                        )}
                        <DialogFooter className="mt-6">
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                            >
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add Payment Dialog */}
                <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
                    <DialogContent className="bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-gray-900">Add Payment</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddPaymentSubmit} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Amount (PKR)</label>
                                <input
                                    type="number"
                                    value={newPayment.amount}
                                    onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input
                                    type="date"
                                    value={newPayment.date}
                                    onChange={e => setNewPayment({ ...newPayment, date: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Payment Channel</label>
                                <select
                                    value={newPayment.paymentChannel}
                                    onChange={e => setNewPayment({ ...newPayment, paymentChannel: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Select Payment Channel</option>
                                    <option value="cash">Cash</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="easypaisa">EasyPaisa</option>
                                    <option value="jazzcash">JazzCash</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                                <input
                                    type="text"
                                    value={newPayment.transactionId}
                                    onChange={e => setNewPayment({ ...newPayment, transactionId: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter transaction ID (if applicable)"
                                />
                            </div>
                            {addPaymentError && <div className="text-red-500 text-sm">{addPaymentError}</div>}
                            <DialogFooter className="mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowAddPayment(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={addPaymentLoading}
                                >
                                    {addPaymentLoading ? 'Adding...' : 'Add Payment'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Payment Details Dialog */}
                <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
                    <DialogContent className="bg-white border border-gray-200 max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <FaReceipt className="text-primary" />
                                Payment Receipt
                            </DialogTitle>
                        </DialogHeader>
                        {paymentDetailsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : selectedPayment ? (
                            <div className="space-y-6 py-4">
                                {/* Header with Logo and Details */}
                                <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Hostellizer</h2>
                                        <p className="text-sm text-gray-600">Hostel Management System</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Receipt #</p>
                                        <p className="font-semibold text-gray-900">{selectedPayment.id}</p>
                                    </div>
                                </div>

                                {/* Payment Status and Amount */}
                                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <p className="font-semibold text-primary">Payment Successful</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Amount Paid</p>
                                        <p className="text-2xl font-bold text-gray-900">PKR {selectedPayment.amount}</p>
                                    </div>
                                </div>

                                {/* Transaction Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Payment Date</p>
                                            <p className="font-medium text-gray-900">
                                                {format(new Date(selectedPayment.date), 'PPP')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Payment Channel</p>
                                            <p className="font-medium text-gray-900 capitalize">
                                                {selectedPayment.paymentChannel?.replace('_', ' ')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Transaction ID</p>
                                            <p className="font-medium text-gray-900">
                                                {selectedPayment.transactionId || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Student Name</p>
                                            <p className="font-medium text-gray-900">{student?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Room Number</p>
                                            <p className="font-medium text-gray-900">{student?.roomnumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Recorded On</p>
                                            <p className="font-medium text-gray-900">
                                                {format(new Date(selectedPayment.createdAt), 'PPP')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="border-t border-gray-200 pt-4 mt-6">
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm text-gray-600">
                                            <p>Generated on: {format(new Date(), 'PPP')}</p>
                                            <p>This is a computer generated receipt, no signature required.</p>
                                        </div>
                                        <div className="text-right text-sm text-gray-600">
                                            <p>Hostellizer Hostel Management</p>
                                            <p>123 Hostel Lane, City, Country</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Print Button */}
                                <div className="flex justify-end mt-6">
                                    <Button
                                        className="px-4 py-2 bg-primary hover:bg-primary text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                        onClick={() => {
                                            const printWindow = window.open('', '_blank');
                                            if (printWindow) {
                                                printWindow.document.write(`
                                                    <html>
                                                        <head>
                                                            <title>Payment Receipt - ${selectedPayment.id}</title>
                                                            <style>
                                                                body {
                                                                    font-family: Arial, sans-serif;
                                                                    padding: 20px;
                                                                    max-width: 800px;
                                                                    margin: 0 auto;
                                                                }
                                                                .header {
                                                                    text-align: center;
                                                                    margin-bottom: 30px;
                                                                }
                                                                .details {
                                                                    margin-bottom: 30px;
                                                                }
                                                                .amount {
                                                                    background: #f3f4f6;
                                                                    padding: 20px;
                                                                    border-radius: 8px;
                                                                    margin-bottom: 30px;
                                                                }
                                                                .footer {
                                                                    margin-top: 50px;
                                                                    border-top: 1px solid #e5e7eb;
                                                                    padding-top: 20px;
                                                                    font-size: 12px;
                                                                    color: #6b7280;
                                                                }
                                                                @media print {
                                                                    body {
                                                                        padding: 0;
                                                                    }
                                                                    .no-print {
                                                                        display: none;
                                                                    }
                                                                }
                                                            </style>
                                                        </head>
                                                        <body>
                                                            <div class="header">
                                                                <h1>Hostellizer</h1>
                                                                <p>Hostel Management System</p>
                                                            </div>
                                                            <div class="details">
                                                                <h2>Payment Receipt</h2>
                                                                <p><strong>Receipt #:</strong> ${selectedPayment.id}</p>
                                                                <p><strong>Student Name:</strong> ${student?.name}</p>
                                                                <p><strong>Room Number:</strong> ${student?.roomnumber}</p>
                                                            </div>
                                                            <div class="amount">
                                                                <p><strong>Amount Paid:</strong> PKR ${selectedPayment.amount}</p>
                                                                <p><strong>Payment Date:</strong> ${format(new Date(selectedPayment.date), 'PPP')}</p>
                                                                <p><strong>Payment Channel:</strong> ${selectedPayment.paymentChannel?.replace('_', ' ')}</p>
                                                                <p><strong>Transaction ID:</strong> ${selectedPayment.transactionId || 'N/A'}</p>
                                                            </div>
                                                            <div class="footer">
                                                                <p>Generated on: ${format(new Date(), 'PPP')}</p>
                                                                <p>This is a computer generated receipt, no signature required.</p>
                                                                <p>Hostellizer Hostel Management</p>
                                                                <p>123 Hostel Lane, City, Country</p>
                                                            </div>
                                                            <div class="no-print" style="text-align: center; margin-top: 20px;">
                                                                <button onclick="window.print()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                                                    Print Receipt
                                                                </button>
                                                            </div>
                                                        </body>
                                                    </html>
                                                `);
                                                printWindow.document.close();
                                            }
                                        }}
                                    >
                                        Print Receipt
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                    </DialogContent>
                </Dialog>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mt-4">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-8">
                        {/* Contact Information */}
                        <div className=" rounded-lg border p-4 sm:p-6 bg-white">
                            <h2 className="text-lg sm:text-xl font-semibold text-primary mb-3 sm:mb-4">Contact Information</h2>
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-start sm:items-center">
                                    <FaEnvelope className="text-primary mr-3 mt-1 sm:mt-0 text-sm sm:text-base" />
                                    <span className="text-sm sm:text-base text-gray-900 break-words">{student.email}</span>
                                </div>
                                <div className="flex items-start sm:items-center">
                                    <FaPhone className="text-primary mr-3 mt-1 sm:mt-0 text-sm sm:text-base" />
                                    <span className="text-sm sm:text-base text-gray-900">{student.phone}</span>
                                </div>
                                <div className="flex items-start">
                                    <FaMapMarkerAlt className="text-primary mr-3 mt-1 text-sm sm:text-base" />
                                    <span className="text-sm sm:text-base text-gray-900 break-words">
                                        {student.address.street}, {student.address.town}, {student.address.city}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Accommodation Details */}
                        <div className="rounded-lg border p-4 sm:p-6 bg-white">
                            <h2 className="text-lg sm:text-xl font-semibold text-primary mb-3 sm:mb-4">Accommodation Details</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg border border-primary/20">
                                    <FaBed className="text-xl sm:text-3xl text-primary" />
                                    <div>
                                        <div className="text-lg sm:text-2xl font-bold text-primary">{student.roomnumber}</div>
                                        <div className="text-xs sm:text-sm text-gray-900">Room Number</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg border border-primary/20">
                                    <FaDoorOpen className="text-xl sm:text-3xl text-primary" />
                                    <div>
                                        <div className="text-lg sm:text-2xl font-bold text-primary">{student.accomodationtype}</div>
                                        <div className="text-xs sm:text-sm text-gray-900">Accommodation Type</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4 sm:space-y-8">
                        {/* Dates */}
                        <div className="rounded-lg border p-4 sm:p-6 bg-white">
                            <h2 className="text-lg sm:text-xl font-semibold text-primary mb-3 sm:mb-4">Important Dates</h2>
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-start sm:items-center">
                                    <FaCalendarAlt className="text-primary mr-3 mt-1 sm:mt-0 text-sm sm:text-base" />
                                    <div>
                                        <div className="text-xs sm:text-sm text-gray-900">Joined Date</div>
                                        <div className="text-sm sm:text-base">
                                            {student.joineddate ? (() => {
                                                try {
                                                    // Extract just the date part (YYYY-MM-DD) from the ISO string
                                                    const dateStr = student.joineddate.split('T')[0];
                                                    const date = new Date(dateStr + 'T00:00:00');
                                                    return isNaN(date.getTime()) ? 'Invalid Date' : format(date, 'PPP');
                                                } catch (error) {
                                                    return 'Invalid Date';
                                                }
                                            })() : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start sm:items-center">
                                    <FaClock className="text-primary mr-3 mt-1 sm:mt-0 text-sm sm:text-base" />
                                    <div>
                                        <div className="text-xs sm:text-sm text-gray-900">Time Span</div>
                                        <div className="text-sm sm:text-base text-primary">{calculateTimeSpan(student.joineddate)} Months</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="rounded-lg border p-4 sm:p-6 bg-white">
                            <h2 className="text-lg sm:text-xl font-semibold text-primary mb-3 sm:mb-4">Payment Information</h2>
                            <div className="flex items-center justify-between border-b p-2">
                                <h3>Monthly Rent:</h3>
                                <span>PKR {student.monthlyrent}</span>
                            </div>
                            <div className="flex items-center justify-between border-b p-2">
                                <h3>Payment Status:</h3>
                                <span>{student.paymentstatus === 'paid' ? <CheckCircle className="text-primary" /> : <X className="text-red-500" />}</span>
                            </div>
                            <div className="flex items-center justify-between border-b p-2">
                                <h3>Due Date:</h3>
                                <span>{format(new Date(student.payment_due_date), 'PPP')}</span>
                            </div>
                        </div>

                        {/* Add Payment Button */}
                        <div className="flex justify-end mt-2 sm:mt-4">
                            <Button
                                onClick={handleAddPayment}
                            >
                                <FaPlus className="mr-2" /> Add Payment
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Payment History Section */}
                <div className="mt-4 sm:mt-8">
                    <div className="bg-white rounded-lg border">
                        <div className="p-4 sm:p-6 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Payment Statement</h2>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Account Statement for {student.name}</p>
                                </div>
                                <div className="mt-2 sm:mt-0 text-left sm:text-right">
                                    <p className="text-xs sm:text-sm text-gray-600">Statement Period</p>
                                    <p className="text-sm sm:text-base font-medium text-gray-900">
                                        {format(new Date(student.joineddate), 'MMM yyyy')} - {format(new Date(), 'MMM yyyy')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {student.payment_history && student.payment_history.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                                            <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                            <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Channel</th>
                                            <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {student.payment_history.map((payment, idx) => (
                                            <tr
                                                key={payment.id}
                                                className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                                                onClick={() => handlePaymentClick(payment.id)}
                                            >
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                    {format(new Date(payment.date), 'dd MMM yyyy')}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-mono">
                                                    {payment.transactionId || '-'}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                    Hostel Fee Payment
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 capitalize">
                                                    {payment.paymentChannel?.replace('_', ' ')}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 text-right font-medium">
                                                    PKR {payment.amount.toLocaleString()}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                                                    {loadingTransaction === payment.id ? (
                                                        <div className="flex justify-center">
                                                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-b-2 border-primary"></div>
                                                        </div>
                                                    ) : (
                                                        <span className="px-2 py-1 text-xs font-medium rounded-full  text-primary">
                                                            Completed
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                        <tr>
                                            <td colSpan={4} className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                                                Total Amount Paid
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 text-right">
                                                PKR {student.total_amount_paid.toLocaleString()}
                                            </td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td colSpan={4} className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                                                Total Amount Due
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 text-right">
                                                PKR {(calculateTimeSpan(student.joineddate) * (student.monthlyrent || 0)).toLocaleString()}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 sm:py-12">
                                <div className="text-sm sm:text-base text-gray-500">No payment history available</div>
                                <p className="text-xs sm:text-sm text-gray-400 mt-2">Start by adding a payment using the button above</p>
                            </div>
                        )}

                        {/* Statement Footer */}
                        <div className="p-4 sm:p-6 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                <div className="text-xs sm:text-sm text-gray-600">
                                    <p>Generated on: {format(new Date(), 'PPP')}</p>
                                    <p>This is a computer generated statement, no signature required.</p>
                                </div>
                                <div className="mt-2 sm:mt-0 text-left sm:text-right text-xs sm:text-sm text-gray-600">
                                    <p>Hostellizer Hostel Management</p>
                                    <p>123 Hostel Lane, City, Country</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Generate Transcript Button */}
                <div className="flex justify-center mt-4 sm:mt-8">
                    {student.payment_history && student.payment_history.length > 0 ? (
                        <Button
                            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white text-sm sm:text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            onClick={() => student && generateTranscript(student)}
                        >
                            Generate Transcript
                        </Button>
                    ) : (
                        <div className="text-center py-3 sm:py-4 px-4 sm:px-6 rounded-lg border border-primary/20">
                            <p className="text-sm sm:text-base text-red-500">Transcript cannot be generated without payment history</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 