import { useState } from "react";
import { useListBooks, useCreateBook, useUpdateBook, useDeleteBook, getListBooksQueryKey, Book } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Plus, Edit, Trash2, Search, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  totalCopies: z.coerce.number().min(1, "At least 1 copy is required"),
  publishedYear: z.coerce.number().optional(),
  coverUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type BookFormValues = z.infer<typeof bookSchema>;

export default function AdminBooks() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [deleteBookId, setDeleteBookId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useListBooks({ search, page, limit: 10 }, {
    query: { queryKey: getListBooksQueryKey({ search, page, limit: 10 }) }
  });

  const createMutation = useCreateBook();
  const updateMutation = useUpdateBook();
  const deleteMutation = useDeleteBook();

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "", author: "", isbn: "", category: "", description: "", totalCopies: 1, publishedYear: new Date().getFullYear(), coverUrl: ""
    }
  });

  const handleEdit = (book: Book) => {
    setEditBook(book);
    form.reset({
      title: book.title,
      author: book.author,
      isbn: book.isbn || "",
      category: book.category,
      description: book.description || "",
      totalCopies: book.totalCopies,
      publishedYear: book.publishedYear || new Date().getFullYear(),
      coverUrl: book.coverUrl || ""
    });
  };

  const handleOpenAdd = () => {
    setEditBook(null);
    form.reset({
      title: "", author: "", isbn: "", category: "", description: "", totalCopies: 1, publishedYear: new Date().getFullYear(), coverUrl: ""
    });
    setIsAddOpen(true);
  };

  const onSubmit = (values: BookFormValues) => {
    if (editBook) {
      updateMutation.mutate({ id: editBook.id, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          setEditBook(null);
          toast({ title: "Book updated successfully" });
        }
      });
    } else {
      createMutation.mutate({ data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          setIsAddOpen(false);
          toast({ title: "Book added successfully" });
        }
      });
    }
  };

  const handleDelete = () => {
    if (deleteBookId) {
      deleteMutation.mutate({ id: deleteBookId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          setDeleteBookId(null);
          toast({ title: "Book deleted successfully" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Books Catalog</h1>
          <p className="text-muted-foreground">Manage the library's book collection.</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Book
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>All Books</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search books..."
                className="pl-8"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Copies (Avail/Total)</TableHead>
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
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No books found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        {book.title}
                      </div>
                    </TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>{book.category}</TableCell>
                    <TableCell>{book.availableCopies} / {book.totalCopies}</TableCell>
                    <TableCell>
                      <StatusBadge status={book.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(book)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteBookId(book.id)}>
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

      <Dialog open={isAddOpen || !!editBook} onOpenChange={(open) => {
        if (!open) {
          setIsAddOpen(false);
          setEditBook(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editBook ? "Edit Book" : "Add New Book"}</DialogTitle>
            <DialogDescription>
              {editBook ? "Update book details in the catalog." : "Enter the details of the new book to add to the catalog."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="author" render={({ field }) => (
                  <FormItem><FormLabel>Author</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="isbn" render={({ field }) => (
                  <FormItem><FormLabel>ISBN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="publishedYear" render={({ field }) => (
                  <FormItem><FormLabel>Published Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="totalCopies" render={({ field }) => (
                  <FormItem><FormLabel>Total Copies</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="coverUrl" render={({ field }) => (
                  <FormItem><FormLabel>Cover URL</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setEditBook(null); }}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Book"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteBookId} onOpenChange={(open) => !open && setDeleteBookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the book from the catalog.
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
