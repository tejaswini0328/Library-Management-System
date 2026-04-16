import { useState } from "react";
import { useListTransactions, useReturnItem, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { Undo2, Book, Film } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";

export default function ReturnItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [returnTxId, setReturnTxId] = useState<number | null>(null);

  // Fetch user's active and overdue transactions
  const { data, isLoading } = useListTransactions(
    { userId: user?.id, limit: 100 },
    { query: { enabled: !!user?.id, queryKey: getListTransactionsQueryKey({ userId: user?.id }) } }
  );

  const returnMutation = useReturnItem();

  const handleReturn = () => {
    if (returnTxId) {
      returnMutation.mutate({ id: returnTxId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
          setReturnTxId(null);
          toast({ title: "Return registered", description: "The item has been returned successfully." });
        }
      });
    }
  };

  const activeItems = data?.data.filter(tx => tx.status === 'issued' || tx.status === 'overdue') || [];

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Return Items</h1>
        <p className="text-muted-foreground">Select an active item to register its return.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Borrowed Items</CardTitle>
          <CardDescription>Items that require returning to the library.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : activeItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              You do not have any active or overdue items to return.
            </div>
          ) : (
            <div className="grid gap-4">
              {activeItems.map(tx => (
                <div key={tx.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg gap-4 bg-card">
                  <div className="flex items-start gap-4">
                    <div className="bg-muted p-3 rounded-md flex-shrink-0">
                      {tx.itemType === 'book' ? <Book className="h-6 w-6 text-muted-foreground" /> : <Film className="h-6 w-6 text-muted-foreground" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{tx.itemTitle}</h3>
                      <div className="text-sm text-muted-foreground mt-1">
                        Borrowed: {tx.issueDate ? format(parseISO(tx.issueDate), "MMM d, yyyy") : "-"}
                      </div>
                      <div className={`text-sm mt-1 font-medium ${tx.status === 'overdue' ? 'text-destructive' : 'text-muted-foreground'}`}>
                        Due: {tx.dueDate ? format(parseISO(tx.dueDate), "MMM d, yyyy") : "-"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                    <StatusBadge status={tx.status} />
                    <Button onClick={() => setReturnTxId(tx.id)} className="w-full sm:w-auto mt-2">
                      <Undo2 className="mr-2 h-4 w-4" /> Return Item
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!returnTxId} onOpenChange={(open) => !open && setReturnTxId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Return</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to return this item? This action will update the inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReturn} disabled={returnMutation.isPending}>
              {returnMutation.isPending ? "Processing..." : "Confirm Return"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
