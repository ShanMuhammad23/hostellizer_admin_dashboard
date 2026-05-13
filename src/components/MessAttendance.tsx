import { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Calendar, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';

interface MealType {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
}

interface AttendanceRecord {
    id: string;
    meal_type_id: string;
    meal_type_name: string;
    status: 'present' | 'absent';
    notes: string | null;
    start_time: string;
    end_time: string;
}

interface MonthlySummary {
    meal_name: string;
    present_count: number;
    absent_count: number;
    total_days: number;
    attendance_percentage: number;
}

interface OverallStats {
    totalPresent: number;
    totalAbsent: number;
    totalMeals: number;
    attendancePercentage: number;
}

interface MessAttendanceProps {
    studentId: string;
}

export function MessAttendance({ studentId }: MessAttendanceProps) {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [mealTypes, setMealTypes] = useState<MealType[]>([]);
    const [updating, setUpdating] = useState<string | null>(null);
    const [showSummary, setShowSummary] = useState(false);
    const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
    const [overallStats, setOverallStats] = useState<OverallStats | null>(null);

    useEffect(() => {
        fetchMealTypes();
    }, []);

    useEffect(() => {
        if (studentId && selectedDate) {
            fetchAttendance();
        }
    }, [studentId, selectedDate]);

    useEffect(() => {
        if (studentId && selectedMonth) {
            fetchMonthlySummary();
        }
    }, [studentId, selectedMonth]);

    const fetchMealTypes = async () => {
        try {
            const response = await axios.get('/api/meal-types');
            if (response.data.success) {
                setMealTypes(response.data.mealTypes);
            }
        } catch (error) {
            console.error('Error fetching meal types:', error);
            toast.error('Failed to fetch meal types');
        }
    };

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/mess-attendance?studentId=${studentId}&date=${selectedDate}`);
            if (response.data.success) {
                setAttendance(response.data.attendance);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
            toast.error('Failed to fetch attendance');
        } finally {
            setLoading(false);
        }
    };

    const fetchMonthlySummary = async () => {
        try {
            setLoadingSummary(true);
            const response = await axios.get(`/api/mess-attendance/summary?studentId=${studentId}&month=${selectedMonth}`);
            if (response.data.success) {
                setMonthlySummary(response.data.summary);
                setOverallStats(response.data.overallStats);
            }
        } catch (error) {
            console.error('Error fetching monthly summary:', error);
            toast.error('Failed to fetch monthly summary');
        } finally {
            setLoadingSummary(false);
        }
    };

    const updateAttendance = async (mealTypeId: string, status: 'present' | 'absent') => {
        try {
            setUpdating(mealTypeId);
            const response = await axios.post('/api/mess-attendance', {
                studentId,
                date: selectedDate,
                mealTypeId,
                status,
            });

            if (response.data.success) {
                toast.success('Attendance updated successfully');
                fetchAttendance();
                fetchMonthlySummary(); // Refresh summary after update
            }
        } catch (error) {
            console.error('Error updating attendance:', error);
            toast.error('Failed to update attendance');
        } finally {
            setUpdating(null);
        }
    };

    const changeMonth = (direction: 'prev' | 'next') => {
        const [year, month] = selectedMonth.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        date.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
        setSelectedMonth(format(date, 'yyyy-MM'));
    };

    return (
        <div className="space-y-6">
            {/* Summary Toggle */}
            <div className="flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSummary(!showSummary)}
                    className="flex items-center gap-2"
                >
                    <BarChart2 className="h-4 w-4" />
                    {showSummary ? 'Hide Summary' : 'Show Summary'}
                </Button>
            </div>

            {/* Monthly Summary */}
            {showSummary && (
                <div className="bg-white rounded-lg border border-purple-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-purple-700">Monthly Summary</h3>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => changeMonth('prev')}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium">
                                {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => changeMonth('next')}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {loadingSummary ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-700" />
                        </div>
                    ) : (
                        <>
                            {/* Overall Stats */}
                            {overallStats && (
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-emerald-50 rounded-lg p-4 text-center">
                                        <div className="text-2xl font-bold text-emerald-700">
                                            {overallStats.totalPresent}
                                        </div>
                                        <div className="text-sm text-emerald-600">Meals Taken</div>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-4 text-center">
                                        <div className="text-2xl font-bold text-red-700">
                                            {overallStats.totalAbsent}
                                        </div>
                                        <div className="text-sm text-red-600">Meals Missed</div>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                                        <div className="text-2xl font-bold text-purple-700">
                                            {overallStats.attendancePercentage}%
                                        </div>
                                        <div className="text-sm text-purple-600">Attendance Rate</div>
                                    </div>
                                </div>
                            )}

                            {/* Meal-wise Summary */}
                            <div className="space-y-4">
                                {monthlySummary.map((meal) => (
                                    <div key={meal.meal_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="font-medium text-gray-900">{meal.meal_name}</div>
                                            <div className="text-sm text-gray-500">
                                                {meal.present_count} present, {meal.absent_count} absent
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-semibold text-purple-700">
                                                {meal.attendance_percentage}%
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                of {meal.total_days} days
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Daily Attendance */}
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-700" />
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {mealTypes.map((mealType) => {
                            const record = attendance.find(a => a.meal_type_id === mealType.id);
                            const status = record?.status || 'absent';

                            return (
                                <div
                                    key={mealType.id}
                                    className="flex items-center justify-between p-4 rounded-lg border border-purple-200 bg-white"
                                >
                                    <div className="space-y-1">
                                        <h3 className="font-medium text-gray-900">{mealType.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {format(new Date(`2000-01-01T${mealType.start_time}`), 'h:mm a')} - 
                                            {format(new Date(`2000-01-01T${mealType.end_time}`), 'h:mm a')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant={status === 'present' ? 'default' : 'outline'}
                                            className={status === 'present' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                                            onClick={() => updateAttendance(mealType.id, 'present')}
                                            disabled={updating === mealType.id}
                                        >
                                            {updating === mealType.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Present'
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={status === 'absent' ? 'default' : 'outline'}
                                            className={status === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                                            onClick={() => updateAttendance(mealType.id, 'absent')}
                                            disabled={updating === mealType.id}
                                        >
                                            {updating === mealType.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Absent'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
} 