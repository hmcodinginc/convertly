import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type DataTableProps = {
  children: ReactNode
  className?: string
  minWidth?: string
}

function DataTable({ children, className, minWidth = "36rem" }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn("app-table w-full border-collapse text-left", className)}
        style={{ minWidth }}
      >
        {children}
      </table>
    </div>
  )
}

function DataTableHead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>
}

function DataTableHeadRow({ children }: { children: ReactNode }) {
  return <tr>{children}</tr>
}

function DataTableHeaderCell({
  children,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn("app-table-th", className)} {...props}>
      {children}
    </th>
  )
}

function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

function DataTableRow({
  children,
  className,
  interactive = false,
  ...props
}: React.ComponentProps<"tr"> & {
  interactive?: boolean
}) {
  return (
    <tr
      className={cn(
        interactive &&
          "cursor-pointer focus-within:bg-[color-mix(in_srgb,var(--surface)_72%,transparent)]",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
}

function DataTableCell({
  children,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("app-table-td", className)} {...props}>
      {children}
    </td>
  )
}

function DataTableCardHeader({ children }: { children: ReactNode }) {
  return <div className="app-card-table-header">{children}</div>
}

function DataTableCardFooter({ children }: { children: ReactNode }) {
  return <div className="app-card-table-footer">{children}</div>
}

export {
  DataTable,
  DataTableBody,
  DataTableCardFooter,
  DataTableCardHeader,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableHeadRow,
  DataTableRow,
}
