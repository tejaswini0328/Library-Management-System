import { useState } from "react";
import { useListTransactions, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "../../lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { StatusBadge } from "@/components/status-badge";

export default function TransactionsList() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);

  // If admin, see all. If user, see only theirs.
  const queryParams = { 
    userId: user?.role === 'user' ? user.id : undefined,
    status: status !== "all" ? status as any : undefined,
    page, 
    limit: 15 
  };

  const { data, isLoading } = useListTransactions(queryParams, {
    query: { queryKey: getListTransactionsQueryKey(queryParams) }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
          <p className="text-muted-foreground">View and track all past and present item loans.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b mb-4">
          <div className="flex justify-between items-center">
            <CardTitle>History</CardTitle>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                {user?.role === 'admin' && <TableHead>User</TableHead>}
                <TableHead>Item</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due/Returned</TableHead>
                <TableHead>Fine</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    {user?.role === 'admin' && <TableCell><Skeleton className="h-5 w-32" /></TableCell>}
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={user?.role === 'admin' ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">#{tx.id}</TableCell>
                    {user?.role === 'admin' && (
                      <TableCell>
                        <div className="font-medium">{tx.userName}</div>
                        <div className="text-xs text-muted-foreground">ID: {tx.userId}</div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="font-medium">{tx.itemTitle}</div>
                      <div className="text-xs text-muted-foreground capitalize">{tx.itemType}</div>
                    </TableCell>
                    <TableCell>{tx.issueDate ? format(parseISO(tx.issueDate), "MMM d, yyyy") : "-"}</TableCell>
                    <TableCell>
                      {tx.status === 'returned' && tx.returnDate ? (
                        <div className="text-sm">Ret: {format(parseISO(tx.returnDate), "MMM d, yy")}</div>
                      ) : (
                        <div className="text-sm">Due: {tx.dueDate ? format(parseISO(tx.dueDate), "MMM d, yy") : "-"}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {(tx.fineAmount || 0) > 0 ? (
                        <div>
                          <div className="font-medium text-destructive">${tx.fineAmount?.toFixed(2)}</div>
                          <div className="text-xs">{tx.finePaid ? 'Paid' : 'Unpaid'}</div>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={tx.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data && data.total > 15 && (
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 15 >= data.total}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
