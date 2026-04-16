import { useState } from "react";
import { 
  useListMemberships, 
  useCreateMembership, 
  useUpdateMembership, 
  useDeleteMembership, 
  useListUsers,
  getListMembershipsQueryKey,
  Membership,
  CreateMembershipBodyMembershipType
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addMonths } from "date-fns";
import { Plus, Edit, Trash2, IdCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const membershipSchema = z.object({
  userId: z.coerce.number().min(1, "User is required"),
  membershipType: z.enum(["basic", "premium", "student"] as const),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

type MembershipFormValues = z.infer<typeof membershipSchema>;

export default function AdminMemberships() {
  const [page, setPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editMembership, setEditMembership] = useState<Membership | null>(null);
  const [deleteMembershipId, setDeleteMembershipId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useListMemberships({ page, limit: 10 }, {
    query: { queryKey: getListMembershipsQueryKey({ page, limit: 10 }) }
  });

  const { data: usersData } = useListUsers({ limit: 100 }, {
    query: { queryKey: ["/api/users"] }
  });

  const createMutation = useCreateMembership();
  const updateMutation = useUpdateMembership();
  const deleteMutation = useDeleteMembership();

  const today = new Date();
  
  const form = useForm<MembershipFormValues>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      userId: 0,
      membershipType: "basic",
      startDate: format(today, "yyyy-MM-dd"),
      endDate: format(addMonths(today, 12), "yyyy-MM-dd"),
    }
  });

  const handleEdit = (membership: Membership) => {
    setEditMembership(membership);
    form.reset({
      userId: membership.userId,
      membershipType: membership.membershipType,
      startDate: format(new Date(membership.startDate), "yyyy-MM-dd"),
      endDate: format(new Date(membership.endDate), "yyyy-MM-dd"),
    });
  };

  const handleOpenAdd = () => {
    setEditMembership(null);
    form.reset({
      userId: 0,
      membershipType: "basic",
      startDate: format(today, "yyyy-MM-dd"),
      endDate: format(addMonths(today, 12), "yyyy-MM-dd"),
    });
    setIsAddOpen(true);
  };

  const onSubmit = (values: MembershipFormValues) => {
    if (editMembership) {
      updateMutation.mutate({ id: editMembership.id, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMembershipsQueryKey() });
          setEditMembership(null);
          toast({ title: "Membership updated successfully" });
        }
      });
    } else {
      createMutation.mutate({ data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMembershipsQueryKey() });
          setIsAddOpen(false);
          toast({ title: "Membership added successfully" });
        }
      });
    }
  };

  const handleDelete = () => {
    if (deleteMembershipId) {
      deleteMutation.mutate({ id: deleteMembershipId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMembershipsQueryKey() });
          setDeleteMembershipId(null);
          toast({ title: "Membership deleted successfully" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Memberships</h1>
          <p className="text-muted-foreground">Manage user subscriptions and limits.</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Membership
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Memberships</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Max Books</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No memberships found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <IdCard className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{membership.userName || `User #${membership.userId}`}</div>
                          <div className="text-xs text-muted-foreground">{membership.userEmail}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{membership.membershipType}</TableCell>
                    <TableCell>{membership.maxBooks}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(membership.startDate), "MMM d, yy")} - {format(new Date(membership.endDate), "MMM d, yy")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={membership.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(membership)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteMembershipId(membership.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data && data.total > 10 && (
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 10 >= data.total}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen || !!editMembership} onOpenChange={(open) => {
        if (!open) {
          setIsAddOpen(false);
          setEditMembership(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editMembership ? "Edit Membership" : "Add New Membership"}</DialogTitle>
            <DialogDescription>
              Assign a membership tier to a user.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="userId" render={({ field }) => (
                <FormItem>
                  <FormLabel>User</FormLabel>
                  <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value ? field.value.toString() : ""} disabled={!!editMembership}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {usersData?.data.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="membershipType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Membership Tier</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setEditMembership(null); }}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Membership"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteMembershipId} onOpenChange={(open) => !open && setDeleteMembershipId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the user's membership and revert them to default limits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
