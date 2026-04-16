import { useState } from "react";
import { 
  useGetActiveIssues, 
  useGetOverdueReturns, 
  useGetPendingRequests,
  useApproveTransaction,
  useReturnItem,
  usePayFine,
  getGetActiveIssuesQueryKey,
  getGetOverdueReturnsQueryKey,
  getGetPendingRequestsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Check, Undo2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function AdminReports() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [approveTxId, setApproveTxId] = useState<number | null>(null);
  const [returnTxId, setReturnTxId] = useState<number | null>(null);
  const [payFineTxId, setPayFineTxId] = useState<number | null>(null);

  const { data: activeIssues, isLoading: isLoadingActive } = useGetActiveIssues({
    query: { queryKey: getGetActiveIssuesQueryKey() }
  });

  const { data: overdueReturns, isLoading: isLoadingOverdue } = useGetOverdueReturns({
    query: { queryKey: getGetOverdueReturnsQueryKey() }
  });

  const { data: pendingRequests, isLoading: isLoadingPending } = useGetPendingRequests({
    query: { queryKey: getGetPendingRequestsQueryKey() }
  });

  const approveMutation = useApproveTransaction();
  const returnMutation = useReturnItem();
  const payFineMutation = usePayFine();

  const handleApprove = () => {
    if (approveTxId) {
      approveMutation.mutate({ id: approveTxId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPendingRequestsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetActiveIssuesQueryKey() });
          setApproveTxId(null);
          toast({ title: "Request approved" });
        }
      });
    }
  };

  const handleReturn = () => {
    if (returnTxId) {
      returnMutation.mutate({ id: returnTxId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetActiveIssuesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetOverdueReturnsQueryKey() });
          setReturnTxId(null);
          toast({ title: "Item marked as returned" });
        }
      });
    }
  };

  const handlePayFine = () => {
    if (payFineTxId) {
      payFineMutation.mutate({ id: payFineTxId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOverdueReturnsQueryKey() });
          setPayFineTxId(null);
          toast({ title: "Fine marked as paid" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Queue</h1>
        <p className="text-muted-foreground">Manage active loans, overdue items, and pending requests.</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="pending">Pending Requests ({pendingRequests?.length || 0})</TabsTrigger>
          <TabsTrigger value="active">Active Issues ({activeIssues?.length || 0})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue Returns ({overdueReturns?.length || 0})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Requested On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingPending ? (
                    <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                  ) : pendingRequests?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">No pending requests</TableCell></TableRow>
                  ) : (
                    pendingRequests?.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="font-medium">{tx.userName}</div>
                          <div className="text-xs text-muted-foreground">ID: {tx.userId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{tx.itemTitle}</div>
                          <div className="text-xs text-muted-foreground capitalize">{tx.itemType}</div>
                        </TableCell>
                        <TableCell>{tx.createdAt ? format(parseISO(tx.createdAt), "MMM d, yyyy") : "-"}</TableCell>
                        <TableCell><StatusBadge status={tx.status} /></TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => setApproveTxId(tx.id)}>
                            <Check className="mr-2 h-4 w-4" /> Approve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Issued On</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingActive ? (
                    <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                  ) : activeIssues?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">No active issues</TableCell></TableRow>
                  ) : (
                    activeIssues?.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="font-medium">{tx.userName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{tx.itemTitle}</div>
                          <div className="text-xs text-muted-foreground capitalize">{tx.itemType}</div>
                        </TableCell>
                        <TableCell>{tx.issueDate ? format(parseISO(tx.issueDate), "MMM d, yyyy") : "-"}</TableCell>
                        <TableCell>{tx.dueDate ? format(parseISO(tx.dueDate), "MMM d, yyyy") : "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => setReturnTxId(tx.id)}>
                            <Undo2 className="mr-2 h-4 w-4" /> Mark Returned
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Fine</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingOverdue ? (
                    <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                  ) : overdueReturns?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">No overdue returns</TableCell></TableRow>
                  ) : (
                    overdueReturns?.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="font-medium">{tx.userName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{tx.itemTitle}</div>
                          <div className="text-xs text-muted-foreground capitalize">{tx.itemType}</div>
                        </TableCell>
                        <TableCell className="text-destructive font-medium">
                          {tx.dueDate ? format(parseISO(tx.dueDate), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold">${tx.fineAmount?.toFixed(2) || "0.00"}</div>
                          {tx.finePaid ? (
                            <span className="text-xs text-green-600">Paid</span>
                          ) : (
                            <span className="text-xs text-destructive">Unpaid</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {tx.status === 'overdue' && (
                              <Button variant="outline" size="sm" onClick={() => setReturnTxId(tx.id)}>
                                Return
                              </Button>
                            )}
                            {!tx.finePaid && (tx.fineAmount || 0) > 0 && (
                              <Button size="sm" onClick={() => setPayFineTxId(tx.id)}>
                                <CreditCard className="mr-2 h-4 w-4" /> Pay Fine
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!approveTxId} onOpenChange={(open) => !open && setApproveTxId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Request</AlertDialogTitle>
            <AlertDialogDescription>Approve this issue request and mark the item as issued to the user.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!returnTxId} onOpenChange={(open) => !open && setReturnTxId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Returned</AlertDialogTitle>
            <AlertDialogDescription>Confirm the user has returned this item.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReturn}>Confirm Return</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!payFineTxId} onOpenChange={(open) => !open && setPayFineTxId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process Fine Payment</AlertDialogTitle>
            <AlertDialogDescription>Confirm the fine has been collected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePayFine}>Confirm Payment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
