import { useState } from "react";
import { useListMovies, useCreateMovie, useUpdateMovie, useDeleteMovie, getListMoviesQueryKey, Movie } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit, Trash2, Search, Film } from "lucide-react";
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

const movieSchema = z.object({
  title: z.string().min(1, "Title is required"),
  director: z.string().min(1, "Director is required"),
  genre: z.string().min(1, "Genre is required"),
  description: z.string().optional(),
  duration: z.coerce.number().optional(),
  releaseYear: z.coerce.number().optional(),
  totalCopies: z.coerce.number().min(1, "At least 1 copy is required"),
  posterUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type MovieFormValues = z.infer<typeof movieSchema>;

export default function AdminMovies() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editMovie, setEditMovie] = useState<Movie | null>(null);
  const [deleteMovieId, setDeleteMovieId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useListMovies({ search, page, limit: 10 }, {
    query: { queryKey: getListMoviesQueryKey({ search, page, limit: 10 }) }
  });

  const createMutation = useCreateMovie();
  const updateMutation = useUpdateMovie();
  const deleteMutation = useDeleteMovie();

  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      title: "", director: "", genre: "", description: "", duration: 120, releaseYear: new Date().getFullYear(), totalCopies: 1, posterUrl: ""
    }
  });

  const handleEdit = (movie: Movie) => {
    setEditMovie(movie);
    form.reset({
      title: movie.title,
      director: movie.director,
      genre: movie.genre,
      description: movie.description || "",
      duration: movie.duration || 120,
      releaseYear: movie.releaseYear || new Date().getFullYear(),
      totalCopies: movie.totalCopies,
      posterUrl: movie.posterUrl || ""
    });
  };

  const handleOpenAdd = () => {
    setEditMovie(null);
    form.reset({
      title: "", director: "", genre: "", description: "", duration: 120, releaseYear: new Date().getFullYear(), totalCopies: 1, posterUrl: ""
    });
    setIsAddOpen(true);
  };

  const onSubmit = (values: MovieFormValues) => {
    if (editMovie) {
      updateMutation.mutate({ id: editMovie.id, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMoviesQueryKey() });
          setEditMovie(null);
          toast({ title: "Movie updated successfully" });
        }
      });
    } else {
      createMutation.mutate({ data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMoviesQueryKey() });
          setIsAddOpen(false);
          toast({ title: "Movie added successfully" });
        }
      });
    }
  };

  const handleDelete = () => {
    if (deleteMovieId) {
      deleteMutation.mutate({ id: deleteMovieId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMoviesQueryKey() });
          setDeleteMovieId(null);
          toast({ title: "Movie deleted successfully" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movies Catalog</h1>
          <p className="text-muted-foreground">Manage the library's movie collection.</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Movie
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>All Movies</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search movies..."
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
                <TableHead>Director</TableHead>
                <TableHead>Genre</TableHead>
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
                    No movies found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((movie) => (
                  <TableRow key={movie.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Film className="h-4 w-4 text-muted-foreground" />
                        {movie.title}
                      </div>
                    </TableCell>
                    <TableCell>{movie.director}</TableCell>
                    <TableCell>{movie.genre}</TableCell>
                    <TableCell>{movie.availableCopies} / {movie.totalCopies}</TableCell>
                    <TableCell>
                      <StatusBadge status={movie.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(movie)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteMovieId(movie.id)}>
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

      <Dialog open={isAddOpen || !!editMovie} onOpenChange={(open) => {
        if (!open) {
          setIsAddOpen(false);
          setEditMovie(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editMovie ? "Edit Movie" : "Add New Movie"}</DialogTitle>
            <DialogDescription>
              {editMovie ? "Update movie details in the catalog." : "Enter the details of the new movie to add to the catalog."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="director" render={({ field }) => (
                  <FormItem><FormLabel>Director</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="genre" render={({ field }) => (
                  <FormItem><FormLabel>Genre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="duration" render={({ field }) => (
                  <FormItem><FormLabel>Duration (mins)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="releaseYear" render={({ field }) => (
                  <FormItem><FormLabel>Release Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="totalCopies" render={({ field }) => (
                  <FormItem><FormLabel>Total Copies</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="posterUrl" render={({ field }) => (
                  <FormItem><FormLabel>Poster URL</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setEditMovie(null); }}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Movie"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteMovieId} onOpenChange={(open) => !open && setDeleteMovieId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the movie from the catalog.
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
