import { useAuth } from "../../lib/auth";
import { useListTransactions, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, Film, Clock, AlertTriangle, CreditCard } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserHome() {
  const { user } = useAuth();
  
  const { data: transactions, isLoading } = useListTransactions(
    { userId: user?.id, limit: 100 },
    { query: { enabled: !!user?.id, queryKey: getListTransactionsQueryKey({ userId: user?.id, limit: 100 }) } }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[250px]" />
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  const txs = transactions?.data || [];
  
  const activeItems = txs.filter(tx => tx.status === 'issued');
  const overdueItems = txs.filter(tx => tx.status === 'overdue');
  const pendingRequests = txs.filter(tx => tx.status === 'pending');
  
  const totalFines = txs
    .filter(tx => !tx.finePaid && (tx.fineAmount || 0) > 0)
    .reduce((sum, tx) => sum + (tx.fineAmount || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground">Here is an overview of your library activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-400">Currently Borrowed</CardTitle>
            <Book className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">{activeItems.length}</div>
            <p className="text-xs text-blue-700/70 dark:text-blue-400/70 mt-1">items to return</p>
          </CardContent>
        </Card>
        
        <Card className={overdueItems.length > 0 ? "bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${overdueItems.length > 0 ? 'text-red-800 dark:text-red-400' : ''}`}>Overdue Items</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${overdueItems.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueItems.length > 0 ? 'text-red-900 dark:text-red-300' : ''}`}>{overdueItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">requires immediate action</p>
          </CardContent>
        </Card>
        
        <Card className={totalFines > 0 ? "bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-100 dark:border-yellow-900" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${totalFines > 0 ? 'text-yellow-800 dark:text-yellow-400' : ''}`}>Outstanding Fines</CardTitle>
            <CreditCard className={`h-4 w-4 ${totalFines > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalFines > 0 ? 'text-yellow-900 dark:text-yellow-300' : ''}`}>
              ${totalFines.toFixed(2)}
            </div>
            {totalFines > 0 && (
              <Button variant="link" className="px-0 h-auto text-xs text-yellow-700 dark:text-yellow-500 mt-1" asChild>
                <Link href="/transactions/pay-fine">Pay now</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Pending Requests
            </CardTitle>
            <CardDescription>Items you've requested to borrow</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">No pending requests</div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {tx.itemType === 'book' ? <Book className="h-4 w-4 text-muted-foreground" /> : <Film className="h-4 w-4 text-muted-foreground" />}
                        {tx.itemTitle}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Requested: {tx.createdAt ? format(parseISO(tx.createdAt), "MMM d, yyyy") : "-"}</div>
                    </div>
                    <StatusBadge status={tx.status} />
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/transactions/issue">Request New Item</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              Active Borrowings
            </CardTitle>
            <CardDescription>Items you currently have</CardDescription>
          </CardHeader>
          <CardContent>
            {activeItems.length === 0 && overdueItems.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">You have no active items</div>
            ) : (
              <div className="space-y-4">
                {[...overdueItems, ...activeItems].map(tx => (
                  <div key={tx.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium">{tx.itemTitle}</div>
                      <div className={`text-xs mt-1 ${tx.status === 'overdue' ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        Due: {tx.dueDate ? format(parseISO(tx.dueDate), "MMM d, yyyy") : "-"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={tx.status} />
                      <Button variant="link" size="sm" className="h-auto p-0" asChild>
                        <Link href="/transactions/return">Return</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
