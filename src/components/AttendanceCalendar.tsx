import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, isSameDay } from 'date-fns';
import { Button } from './ui/button';

interface AttendanceDay {
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'leave' | 'not_marked';
  notes?: string | null;
  created_at?: string;
}

interface AttendanceSummary {
  total_present: number;
  total_absent: number;
  total_leave: number;
}

interface AttendanceCalendarProps {
  studentId: string;
}

const statusColors: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-red-100 text-red-700',
  leave: 'bg-yellow-100 text-yellow-700',
  not_marked: 'bg-gray-100 text-gray-400',
};

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ studentId }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [attendance, setAttendance] = useState<AttendanceDay[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({ total_present: 0, total_absent: 0, total_leave: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [markStatus, setMarkStatus] = useState<'present' | 'absent' | 'leave'>('present');
  const [markNotes, setMarkNotes] = useState('');

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line
  }, [selectedMonth, studentId]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/students/${studentId}/attendance?month=${selectedMonth}`);
      if (res.data.success) {
        setAttendance(res.data.attendance);
        setSummary(res.data.summary);
      } else {
        setAttendance([]);
        setSummary({ total_present: 0, total_absent: 0, total_leave: 0 });
      }
    } catch (err) {
      setAttendance([]);
      setSummary({ total_present: 0, total_absent: 0, total_leave: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    const d = new Date(selectedMonth + '-01');
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(format(d, 'yyyy-MM'));
  };
  const handleNextMonth = () => {
    const d = new Date(selectedMonth + '-01');
    d.setMonth(d.getMonth() + 1);
    setSelectedMonth(format(d, 'yyyy-MM'));
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(new Date(selectedMonth + '-01')),
    end: endOfMonth(new Date(selectedMonth + '-01')),
  });

  const getStatus = (date: Date) => {
    const found = attendance.find(a => isSameDay(new Date(a.date), date));
    return found ? found.status : 'not_marked';
  };
  const getNotes = (date: Date) => {
    const found = attendance.find(a => isSameDay(new Date(a.date), date));
    return found ? found.notes : '';
  };

  const handleDayClick = (date: Date) => {
    setSelectedDay(format(date, 'yyyy-MM-dd'));
    const found = attendance.find(a => a.date === format(date, 'yyyy-MM-dd'));
    setMarkStatus((found?.status as any) || 'present');
    setMarkNotes(found?.notes || '');
  };

  const handleMarkAttendance = async () => {
    if (!selectedDay) return;
    setMarking(true);
    try {
      await axios.post(`/api/students/${studentId}/attendance`, {
        date: selectedDay,
        status: markStatus,
        notes: markNotes,
      });
      setSelectedDay(null);
      fetchAttendance();
    } catch (err) {
      // handle error
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border  p-4 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-primary">Attendance Calendar</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrevMonth}>&lt;</Button>
          <span className="font-semibold">{format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</span>
          <Button variant="outline" onClick={handleNextMonth}>&gt;</Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-[10px] sm:text-xs text-center text-primary">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {Array(daysInMonth[0].getDay()).fill(null).map((_, i) => <div key={'empty-'+i}></div>)}
        {daysInMonth.map(day => (
          <button
            key={day.toISOString()}
            className={`rounded-lg p-1 sm:p-2 border text-[10px] sm:text-xs flex flex-col items-center justify-center min-h-[3.5rem] sm:min-h-[4rem] transition-all duration-150
              ${isToday(day) ? 'border-primary' : 'border-slate-200'}
              ${isSameMonth(day, new Date(selectedMonth + '-01')) ? '' : 'opacity-50'}
              ${statusColors[getStatus(day)]}
              ${selectedDay === format(day, 'yyyy-MM-dd') ? 'ring-2 ring-primary' : ''}
            `}
            onClick={() => handleDayClick(day)}
          >
            <span className="font-bold">{day.getDate()}</span>
            <span className="capitalize text-[8px] sm:text-[10px] truncate w-full text-center">{getStatus(day)}</span>
            {getNotes(day) && <span className="text-[7px] sm:text-[8px] text-gray-500 truncate w-full text-center">{getNotes(day)}</span>}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-between items-center mt-4 sm:mt-6 gap-2">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <span className="text-emerald-700 font-semibold text-xs sm:text-sm">Present: {summary.total_present}</span>
          <span className="text-red-700 font-semibold text-xs sm:text-sm">Absent: {summary.total_absent}</span>
          <span className="text-yellow-700 font-semibold text-xs sm:text-sm">Leave: {summary.total_leave}</span>
        </div>
      </div>
      {/* Mark Attendance Dialog */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xs shadow-lg border">
            <h3 className="font-bold text-lg mb-2">Mark Attendance</h3>
            <div className="mb-2">{selectedDay}</div>
            <div className="mb-2">
              <select
                className="w-full border rounded p-2"
                value={markStatus}
                onChange={e => setMarkStatus(e.target.value as any)}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="leave">Leave</option>
              </select>
            </div>
              <div className="mb-2">
                <input
                className="w-full border rounded p-2"
                placeholder="Notes (optional)"
                value={markNotes}
                onChange={e => setMarkNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setSelectedDay(null)} variant="outline">Cancel</Button>
              <Button onClick={handleMarkAttendance} disabled={marking}>
                {marking ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 