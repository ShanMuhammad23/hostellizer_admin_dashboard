"use client"
import { useEffect, useState } from "react"
import * as React from "react"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {  Building2, ArrowRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

export interface LatestExpensesType{
    hostel_id:string,
    name:string,
    amount:number,
    date:Date,
    description:string,
    created_at:Date,
    updated_at:Date
}

export const columns: ColumnDef<LatestExpensesType>[] = [
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
    
      return <div className="text-right font-medium">{amount}</div>
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <div>{row.getValue("description")}</div>,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"))
      return <div>{date.toLocaleDateString()}</div>
    },
  },
]

export default function LatestExpenses() {
  const [latestExpenses, setLatestExpenses] = useState<LatestExpensesType[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [isLoading, setIsLoading] = useState(true)

  const table = useReactTable({
    data: latestExpenses,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  useEffect(() => {
    const fetchLatestExpenses = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/fetchLatestExpenses')
        const data = await response.json()
        setLatestExpenses(data.LatestExpenses || [])
      } catch (error) {
        console.error('Error fetching expenses:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLatestExpenses()
  }, [])

  return (
    <div className="w-full p-4 sm:p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Latest Expenses</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.href = '/dashboard/expenses'}
        >
          View All
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id} 
                    className="h-12 px-2 sm:px-4 text-sm font-medium text-primary whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="hover:bg-transparent border-b last:border-0">
                  <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-primary/50 border-b last:border-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 sm:py-4 px-2 sm:px-4 text-sm text-gray-700 whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-primary text-sm"
                >
                  No expenses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
