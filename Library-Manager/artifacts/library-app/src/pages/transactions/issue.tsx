import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useCreateTransaction, 
  useListBooks, 
  useListMovies,
  useListUsers,
  getListTransactionsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const issueSchema = z.object({
  itemType: z.enum(["book", "movie"] as const),
  itemId: z.coerce.number().min(1, "Please select an item"),
  userId: z.coerce.number().optional(), // Admin needs this, User ignores
  daysToReturn: z.coerce.number().min(1).max(30).default(14),
});

type IssueFormValues = z.infer<typeof issueSchema>;

export default function IssueTransaction() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(window.location.search);
  const defaultType = searchParams.get("type") as "book" | "movie" | null;
  const defaultId = searchParams.get("id");

  const form = useForm<IssueFormValues>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      itemType: defaultType || "book",
      itemId: defaultId ? parseInt(defaultId) : 0,
      daysToReturn: 14,
      userId: user?.role === 'admin' ? 0 : user?.id,
    }
  });

  const itemType = form.watch("itemType");

  const { data: books } = useListBooks({ available: true, limit: 100 }, { query: { queryKey: ["/api/books", "available"] } });
  const { data: movies } = useListMovies({ available: true, limit: 100 }, { query: { queryKey: ["/api/movies", "available"] } });
  const { data: users } = useListUsers({ limit: 100 }, { query: { queryKey: ["/api/users"], enabled: user?.role === 'admin' } });

  const createMutation = useCreateTransaction();

  const onSubmit = (values: IssueFormValues) => {
    // Ensure correct userId is sent depending on role
    const payload = {
      ...values,
      userId: user?.role === 'admin' ? values.userId : user?.id
    };

    createMutation.mutate({ data: payload as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        toast({ 
          title: "Request submitted", 
          description: "The issue request has been recorded successfully." 
        });
        
        if (user?.role === 'admin') {
          setLocation("/admin/reports");
        } else {
          setLocation("/user/home");
        }
      },
      onError: (err: any) => {
        toast({ 
          title: "Request failed", 
          description: err.message || "Failed to create issue request",
          variant: "destructive"
        });
      }
    });
  };

  // Reset item select when changing type
  useEffect(() => {
    if (!defaultId) {
      form.setValue("itemId", 0);
    }
  }, [itemType, form, defaultId]);

  const itemsList = itemType === "book" ? books?.data : movies?.data;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Issue Request</CardTitle>
          <CardDescription>
            {user?.role === 'admin' 
              ? "Create a new issue transaction for a user." 
              : "Request to borrow an item from the library."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {user?.role === 'admin' && (
                <FormField control={form.control} name="userId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member</FormLabel>
                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value ? field.value.toString() : ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users?.data.map((u) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.name} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormField control={form.control} name="itemType" render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Item Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="book" /></FormControl>
                        <FormLabel className="font-normal">Book</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="movie" /></FormControl>
                        <FormLabel className="font-normal">Movie</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="itemId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Item</FormLabel>
                  <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value && field.value > 0 ? field.value.toString() : ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select a ${itemType}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {itemsList?.map((item: any) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.title} {item.author || item.director ? `— ${item.author || item.director}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Only currently available items are shown.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
          <Button variant="outline" onClick={() => window.history.back()}>Cancel</Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
