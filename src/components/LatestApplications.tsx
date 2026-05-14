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
import { Building2, ArrowRight, Check, X } from "lucide-react"
import { toast } from "sonner"
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
    status: 'pending' | 'approved' | 'rejected'
}

interface ApiApplication {
    id: string
    student_id: string
    status: string
    date: string
    "bid-amount": number
    student_name: string
}

function buildColumns(
  operational: boolean,
  onStatusChange: (id: string, status: "approved" | "rejected") => void,
  actingId: string | null
): ColumnDef<Application>[] {
  const base: ColumnDef<Application>[] = [
    {
      accessorKey: "studentName",
      header: "Student Name",
    },
    {
      accessorKey: "bidAmount",
      header: () => <div className="text-right">Bid Amount</div>,
      cell: ({ row }) => {
        const amount = row.getValue("bidAmount") as number
        return (
          <div className="text-right font-medium">
            PKR {Number(amount).toLocaleString()}
          </div>
        )
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
  if (!operational) return base
  return [
    ...base,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const status = row.original.status
        if (status !== "pending") {
          return <span className="text-xs text-muted-foreground">—</span>
        }
        const busy = actingId === row.original.id
        return (
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              size="sm"
              variant="default"
              className="h-7 bg-emerald-600 hover:bg-emerald-700"
              disabled={busy}
              onClick={() => onStatusChange(row.original.id, "approved")}
            >
              <Check className="h-3 w-3 mr-1" />
              Approve
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 border-red-200 text-red-700 hover:bg-red-50"
              disabled={busy}
              onClick={() => onStatusChange(row.original.id, "rejected")}
            >
              <X className="h-3 w-3 mr-1" />
              Reject
            </Button>
          </div>
        )
      },
    },
  ]
}

interface LatestApplicationsProps {
  variant?: "default" | "operational"
}

export default function LatestApplications({ variant = "default" }: LatestApplicationsProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)

  const operational = variant === "operational"

  const handleStatusChange = React.useCallback(
    async (id: string, status: "approved" | "rejected") => {
      try {
        setActingId(id)
        const res = await axios.put(`/api/applications/${id}`, { status })
        if (!res.data?.success) {
          throw new Error(res.data?.message || "Update failed")
        }
        toast.success(status === "approved" ? "Application approved" : "Application rejected")
        const response = await axios.get("/api/fetchLatestApplications")
        const raw = response.data?.LatestApplications
        const list = Array.isArray(raw) ? raw : []
        const mappedData = list.map((app: ApiApplication) => ({
          id: app.id,
          studentName: app.student_name,
          bidAmount: app["bid-amount"],
          status: (app.status?.toLowerCase() || "pending") as Application["status"],
        }))
        setApplications(mappedData)
      } catch (e) {
        console.error(e)
        toast.error("Could not update application")
      } finally {
        setActingId(null)
      }
    },
    []
  )

  const columns = React.useMemo(
    () => buildColumns(operational, handleStatusChange, actingId),
    [operational, handleStatusChange, actingId]
  )

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
        const raw = response.data?.LatestApplications
        const list = Array.isArray(raw) ? raw : []
        const mappedData = list.map((app: ApiApplication) => ({
          id: app.id,
          studentName: app.student_name,
          bidAmount: app["bid-amount"],
          status: (app.status?.toLowerCase() || "pending") as Application["status"],
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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-primary">Latest Applications</h1>
          </div>
          {operational ? (
            <p className="text-xs text-muted-foreground pl-9 max-w-md">
              Pending requests can be approved or rejected here without opening the full list.
            </p>
          ) : null}
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
