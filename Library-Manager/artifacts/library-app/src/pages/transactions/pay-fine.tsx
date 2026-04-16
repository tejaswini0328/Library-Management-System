import { useState } from "react";
import { useListTransactions, usePayFine, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, AlertCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function PayFine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [payFineTxId, setPayFineTxId] = useState<number | null>(null);

  const { data, isLoading } = useListTransactions(
    { userId: user?.id, limit: 100 },
    { query: { enabled: !!user?.id, queryKey: getListTransactionsQueryKey({ userId: user?.id }) } }
  );

  const payFineMutation = usePayFine();

  const handlePay = () => {
    if (payFineTxId) {
      payFineMutation.mutate({ id: payFineTxId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
          setPayFineTxId(null);
          toast({ title: "Payment successful", description: "Your fine has been paid." });
        }
      });
    }
  };

  const fines = data?.data.filter(tx => !tx.finePaid && (tx.fineAmount || 0) > 0) || [];
  const totalFines = fines.reduce((sum, tx) => sum + (tx.fineAmount || 0), 0);

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Outstanding Fines</h1>
        <p className="text-muted-foreground">Review and pay penalties for overdue items.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : fines.length === 0 ? (
            <Card>
              <CardContent className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                <div className="bg-green-50 dark:bg-green-950/20 text-green-600 p-4 rounded-full mb-4">
                  <CreditCard className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">All clear!</h3>
                <p>You have no outstanding fines.</p>
              </CardContent>
            </Card>
          ) : (
            fines.map(tx => (
              <Card key={tx.id} className="border-red-100 dark:border-red-900/50">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{tx.itemTitle}</h3>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Late return penalty
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-bold text-destructive">${tx.fineAmount?.toFixed(2)}</div>
                    <Button onClick={() => setPayFineTxId(tx.id)} size="sm">Pay Now</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Fines</span>
              <span className="font-medium">{fines.length}</span>
            </div>
            <div className="border-t pt-4 flex justify-between items-center">
              <span className="font-semibold">Amount Due</span>
              <span className="text-2xl font-bold text-destructive">${totalFines.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled={fines.length === 0}>
              <CreditCard className="mr-2 h-4 w-4" /> Pay All (${totalFines.toFixed(2)})
            </Button>
          </CardFooter>
        </Card>
      </div>

      <AlertDialog open={!!payFineTxId} onOpenChange={(open) => !open && setPayFineTxId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Process payment for this fine. In a real system, this would integrate with a payment gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePay} disabled={payFineMutation.isPending}>
              {payFineMutation.isPending ? "Processing..." : "Confirm Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
