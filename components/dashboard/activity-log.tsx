"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

interface Props {
  logs?: Array<{
    id: string;
    userName: string;
    userRole: string;
    action: string;
    controlId?: string | null;
    controlLabel?: string | null;
    fromStatus?: string | null;
    toStatus?: string | null;
    details?: string | null;
    isLocal?: boolean;
    createdAt: Date;
    companyKey?: string;
    userId?: string;
  }>
}

export function ActivityLogTable({ logs = [] }: Props) {
  const [filter, setFilter] = useState<"all" | "local" | "cloud">("all")
  const [visibleCount, setVisibleCount] = useState(25)
  const PAGE_SIZE = 25
  
  const filteredLogs = logs.filter(log => {
    if (filter === "all") return true
    if (filter === "local") return log.isLocal
    return !log.isLocal
  })
  const visibleLogs = filteredLogs.slice(0, visibleCount)
  const hasMore = filteredLogs.length > visibleCount
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Log</CardTitle>
          <div className="flex gap-2" role="radiogroup" aria-label="Filter by source">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              role="radio"
              aria-checked={filter === "all"}
            >
              All
            </Button>
            <Button
              variant={filter === "local" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("local")}
              role="radio"
              aria-checked={filter === "local"}
            >
              Local
            </Button>
            <Button
              variant={filter === "cloud" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("cloud")}
              role="radio"
              aria-checked={filter === "cloud"}
            >
              Cloud
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Control</TableHead>
              <TableHead>Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleLogs.map(log => (
              <TableRow key={log.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(log.createdAt)}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-foreground">{log.userName}</p>
                    <p className="text-xs text-muted-foreground">{log.userRole}</p>
                  </div>
                </TableCell>
                <TableCell className="text-foreground">{log.action}</TableCell>
                <TableCell className="font-mono text-sm">
                  {log.controlId && (
                    <span className="text-primary">{log.controlId}</span>
                  )}
                </TableCell>
                <TableCell>
                  {log.fromStatus && log.toStatus && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-destructive border-destructive/50">
                        {log.fromStatus.replace('_', ' ')}
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="outline" className="text-primary border-primary/50">
                        {log.toStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No activity logs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button variant="outline" size="sm" onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}>
              Load More ({filteredLogs.length - visibleCount} remaining)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
