"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import * as React from "react"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Building2, ArrowRight } from "lucide-react"
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

interface Application {
    id: string
    studentName: string
    bidAmount: number
    status: 'Pending' | 'Approved' | 'Rejected'
}

interface ApiApplication {
    id: string
    student_id: string
    status: string
    date: string
    "bid-amount": number
    student_name: string
}

const columns: ColumnDef<Application>[] = [
  {
    accessorKey: "studentName",
    header: "Student Name",
  },
  {
    accessorKey: "bidAmount",
    header: () => <div className="text-right">Bid Amount</div>,
    cell: ({ row }) => {
      const amount = row.getValue("bidAmount") as number
      return <div className="text-right font-medium">{amount}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div className={`font-medium ${
          status === 'approved' ? 'text-green-600' :
          status === 'rejected' ? 'text-red-600' :
          'text-amber-600'
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      )
    },
  },
]

export default function LatestApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [isLoading, setIsLoading] = useState(true)

  const table = useReactTable({
    data: applications,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  useEffect(() => {
    const fetchLatestApplications = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get("/api/fetchLatestApplications")
        const mappedData = response.data.LatestApplications.map((app: ApiApplication) => ({
          id: app.id,
          studentName: app.student_name,
          bidAmount: app["bid-amount"],
          status: app.status?.toLowerCase() || 'Pending'
        }))
        setApplications(mappedData)
      } catch (error) {
        console.error("Error fetching latest applications:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLatestApplications()
  }, [])

  return (
    <div className="w-full p-4 sm:p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Latest Applications</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.href = '/dashboard/applications'}
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
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                    <Skeleton className="h-4 w-[100px] ml-auto" />
                  </TableCell>
                  <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                    <Skeleton className="h-4 w-[100px]" />
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
                  No applications found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
