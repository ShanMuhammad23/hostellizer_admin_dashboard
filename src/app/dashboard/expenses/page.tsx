"use client"
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Loader2, Plus } from "lucide-react";
import MegaLoader from '@/components/ui/MegaLoader';
import { useSession } from "next-auth/react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  amount: z.number().min(0, "Amount must be at least 0"),
  date: z.string(),
  description: z.string().min(5, "Description must be at least 5 characters"),
});

interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export default function ExpensesPage() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: "",
    },
  });

  const fetchExpenses = async () => {
    if (!session?.user?.id) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get('/api/expenses');
      if (response.data.success) {
        console.log('Fetched expenses:', response.data.expenses);
        setExpenses(response.data.expenses);
      } else {
        throw new Error(response.data.message || 'Failed to fetch expenses');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to fetch expenses';
      setError(errorMessage);
      toast.error("Failed to load expenses", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchExpenses();
    }
  }, [session]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user?.id) {
      toast.error("Not authenticated");
      return;
    }

    setIsAddingExpense(true);
    try {
      const response = await axios.post('/api/expenses', {
        ...values,
        hostel_id: session.user.id,
      });

      if (response.data.success) {
        setIsAddingExpense(false);
        toast.success("Expense added successfully!");
        setIsAddDialogOpen(false);
        form.reset();
        fetchExpenses();
      } else {
        throw new Error(response.data.message || 'Failed to add expense');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to add expense';
      toast.error("Failed to add expense", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsAddingExpense(false);
    }
  };

  // Calculate total expenses and prepare data for pie chart
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(totalExpenses);

  const expenseCategories = expenses.reduce((acc, expense) => {
    acc[expense.name] = (acc[expense.name] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.entries(expenseCategories).map(([name, amount]) => ({
    name,
    value: amount,
  }));

  console.log('Pie chart data:', pieChartData);

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'];

  // Custom tooltip for the pie chart
  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
    }>;
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-blue-600">PKR {payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <MegaLoader />
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="text-red-500 text-lg font-medium">{error}</div>
          <Button
            onClick={fetchExpenses}
            className="bg-emerald-500 hover:bg-emerald-600 text-white transition-colors duration-200"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 ">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-primary ">Expenses</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='w-4 h-4 mr-2' />
              Add New Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border">
            <DialogHeader>
              <DialogTitle className="text-primary ">Add New Expense</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Expense Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter expense name"
                          {...field}
                          className="bg-white border text-gray-700 focus:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                          min="0"
                          step="1"
                          className="bg-white border text-gray-700 focus:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className="bg-white border text-gray-700 focus:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter description"
                          {...field}
                          className="bg-white border text-gray-700 focus:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary text-white">
                  {isAddingExpense ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Add Expense
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Expenses Card */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <h2 className="text-lg font-semibold text-primary mb-2">Total Expenses</h2>
        <p className="text-3xl font-bold">PKR {formattedTotal}</p>
      </div>

      {/* Pie Chart */}
      <div className="bg-white rounded-lg border border-purple-200 p-6 mb-8">
        <h2 className="text-lg font-semibold  mb-4">Expense Distribution</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-primary">Recent Expenses</h2>
        </div>
        <div className="divide-y">
          {expenses.map((expense) => (
            <div key={expense.id} className="p-4 hover:bg-purple-50 transition-colors duration-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-primary">{expense.name}</h3>
                  <p className="text-sm text-gray-600">{expense.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">PKR {expense.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{new Date(expense.date).toLocaleDateString('en-Us', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 