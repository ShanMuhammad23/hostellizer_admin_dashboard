"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, Users, Home } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  roomnumber: number;
  status: string;
  joineddate: string;
  accomodationtype: string;
  monthlyrent: number;
  paymentstatus: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'leave';
  notes?: string;
  created_at: string;
}

interface StudentsByRoom {
  [roomNumber: number]: Student[];
}

const RoomViseAttendance = () => {
  const [studentsByRoom, setStudentsByRoom] = useState<StudentsByRoom>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<'present' | 'absent' | 'leave'>('present');
  const [bulkNotes, setBulkNotes] = useState('');

  // Fetch students by room
  const fetchStudentsByRoom = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/students/by-room');
      if (response.data.success) {
        setStudentsByRoom(response.data.studentsByRoom);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance for selected date
  const fetchAttendanceForDate = async (date: Date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const studentIds = Object.values(studentsByRoom).flat().map(s => s.id);
      
      const attendancePromises = studentIds.map(async (studentId) => {
        try {
          const response = await axios.get(`/api/students/${studentId}/attendance?date=${dateStr}`);
          return response.data.success ? response.data.attendance : null;
        } catch (error) {
          return null;
        }
      });

      const attendanceResults = await Promise.all(attendancePromises);
      const attendanceMap: Record<string, AttendanceRecord> = {};
      
      attendanceResults.forEach((attendance) => {
        if (attendance) {
          attendanceMap[attendance.student_id] = attendance;
        }
      });

      setAttendanceRecords(attendanceMap);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  // Mark attendance for a student
  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'leave', notes = '') => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await axios.post(`/api/students/${studentId}/attendance`, {
        date: dateStr,
        status,
        notes
      });

      if (response.data.success) {
        setAttendanceRecords(prev => ({
          ...prev,
          [studentId]: response.data.attendance
        }));
        toast.success(`Attendance marked for ${studentsByRoom[selectedRoom!]?.find(s => s.id === studentId)?.name}`);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
  };

  // Mark attendance for all students in selected room
  const markBulkAttendance = async () => {
    if (!selectedRoom || !studentsByRoom[selectedRoom]) return;

    setMarkingAttendance(true);
    try {
      const promises = studentsByRoom[selectedRoom].map(student => 
        markAttendance(student.id, bulkStatus, bulkNotes)
      );
      
      await Promise.all(promises);
      toast.success(`Attendance marked for all students in Room ${selectedRoom}`);
      setBulkNotes('');
    } catch (error) {
      toast.error('Failed to mark bulk attendance');
    } finally {
      setMarkingAttendance(false);
    }
  };

  useEffect(() => {
    fetchStudentsByRoom();
  }, []);

  useEffect(() => {
    if (Object.keys(studentsByRoom).length > 0) {
      fetchAttendanceForDate(selectedDate);
    }
  }, [selectedDate, studentsByRoom]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'leave': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4" />;
      case 'absent': return <XCircle className="h-4 w-4" />;
      case 'leave': return <Clock className="h-4 w-4" />;
      default: return null;
    }
  };

  const getRoomStats = (roomNumber: number) => {
    const students = studentsByRoom[roomNumber] || [];
    const stats = {
      total: students.length,
      present: 0,
      absent: 0,
      leave: 0,
      notMarked: 0
    };

    students.forEach(student => {
      const attendance = attendanceRecords[student.id];
      if (attendance) {
        stats[attendance.status]++;
      } else {
        stats.notMarked++;
      }
    });

    return stats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Room-wise Attendance</h1>
          <p className="text-gray-600 mt-1">Mark attendance by visiting rooms</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="date-picker">Date:</Label>
            <Input
              id="date-picker"
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                const date = new Date(e.target.value);
                setSelectedDate(date);
              }}
              className="w-[200px]"
            />
          </div>
        </div>
      </div>

      {/* Room Selection */}
      <Card className='bg-white'>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Select Room
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.keys(studentsByRoom)
              .map(Number)
              .sort((a, b) => a - b)
              .map((roomNumber) => {
                const stats = getRoomStats(roomNumber);
                return (
                  <Button
                    key={roomNumber}
                    variant={selectedRoom === roomNumber ? "default" : "outline"}
                    onClick={() => setSelectedRoom(roomNumber)}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <div className="font-semibold">Room {roomNumber}</div>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4" />
                      {stats.total} students
                    </div>
                    <div className="flex gap-1 text-xs">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {stats.present}
                      </Badge>
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        {stats.absent}
                      </Badge>
                      {stats.notMarked > 0 && (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700">
                          {stats.notMarked}
                        </Badge>
                      )}
                    </div>
                  </Button>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Room Details */}
      {selectedRoom && studentsByRoom[selectedRoom] && (
        <div className="space-y-4 bg-white">
          {/* Bulk Actions */}
          <Card className='bg-white'>
            <CardHeader>
              <CardTitle>Bulk Actions - Room {selectedRoom}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="bulk-status">Status:</Label>
                  <Select value={bulkStatus} onValueChange={(value: any) => setBulkStatus(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="leave">Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Notes (optional)"
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  className="w-48"
                />
                <Button 
                  onClick={markBulkAttendance}
                  disabled={markingAttendance}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {markingAttendance ? 'Marking...' : 'Mark All'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Students List */}
          <Card className='bg-white'>
            <CardHeader>
              <CardTitle>Students in Room {selectedRoom}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentsByRoom[selectedRoom].map((student, index) => {
                  const attendance = attendanceRecords[student.id];
                  const currentStatus = attendance?.status || 'not_marked';

                  return (
                    <div key={student.id}>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                              {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{student.name}</h3>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            <p className="text-sm text-gray-500">Phone: {student.phone}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(currentStatus)}>
                            {getStatusIcon(currentStatus)}
                            <span className="ml-1 capitalize">{currentStatus.replace('_', ' ')}</span>
                          </Badge>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={currentStatus === 'present' ? 'default' : 'outline'}
                              onClick={() => markAttendance(student.id, 'present')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant={currentStatus === 'absent' ? 'default' : 'outline'}
                              onClick={() => markAttendance(student.id, 'absent')}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Absent
                            </Button>
                            <Button
                              size="sm"
                              variant={currentStatus === 'leave' ? 'default' : 'outline'}
                              onClick={() => markAttendance(student.id, 'leave')}
                              className="bg-yellow-600 hover:bg-yellow-700"
                            >
                              Leave
                            </Button>
                          </div>
                        </div>
                      </div>
                      {index < studentsByRoom[selectedRoom].length - 1 && <Separator className="my-2" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedRoom && (
        <Card className='bg-white'>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Room</h3>
              <p className="text-gray-600">Choose a room from above to view and mark attendance</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoomViseAttendance;