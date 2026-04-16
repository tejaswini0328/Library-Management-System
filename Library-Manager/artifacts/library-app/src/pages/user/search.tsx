import { useState } from "react";
import { useListBooks, useListMovies, getListBooksQueryKey, getListMoviesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, Film } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: books, isLoading: loadingBooks } = useListBooks(
    { search: debouncedQuery, limit: 20 },
    { query: { enabled: debouncedQuery.length > 0, queryKey: getListBooksQueryKey({ search: debouncedQuery, limit: 20 }) } }
  );

  const { data: movies, isLoading: loadingMovies } = useListMovies(
    { search: debouncedQuery, limit: 20 },
    { query: { enabled: debouncedQuery.length > 0, queryKey: getListMoviesQueryKey({ search: debouncedQuery, limit: 20 }) } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(query);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-extrabold tracking-tight">Global Search</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Find books and movies across the entire library catalog.</p>
        
        <form onSubmit={handleSearch} className="flex max-w-2xl mx-auto mt-8 relative">
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by title, author, director, or genre..."
              className="pl-10 h-12 text-lg rounded-r-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit" className="h-12 rounded-l-none px-8">Search</Button>
        </form>
      </div>

      {debouncedQuery && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="all">All Results</TabsTrigger>
            <TabsTrigger value="books">Books ({books?.total || 0})</TabsTrigger>
            <TabsTrigger value="movies">Movies ({movies?.total || 0})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-8">
            {(loadingBooks || loadingMovies) && <SearchSkeletons />}
            {!loadingBooks && !loadingMovies && books?.data.length === 0 && movies?.data.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">No results found for "{debouncedQuery}"</div>
            )}
            
            {books && books.data.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 border-b pb-2"><BookOpen className="h-5 w-5" /> Books</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {books.data.slice(0, 6).map(book => <BookResult key={book.id} book={book} />)}
                </div>
              </div>
            )}

            {movies && movies.data.length > 0 && (
              <div className="space-y-4 mt-8">
                <h2 className="text-xl font-semibold flex items-center gap-2 border-b pb-2"><Film className="h-5 w-5" /> Movies</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {movies.data.slice(0, 6).map(movie => <MovieResult key={movie.id} movie={movie} />)}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="books">
            {loadingBooks && <SearchSkeletons />}
            {!loadingBooks && books?.data.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">No books found for "{debouncedQuery}"</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {books?.data.map(book => <BookResult key={book.id} book={book} />)}
            </div>
          </TabsContent>

          <TabsContent value="movies">
            {loadingMovies && <SearchSkeletons />}
            {!loadingMovies && movies?.data.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">No movies found for "{debouncedQuery}"</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {movies?.data.map(movie => <MovieResult key={movie.id} movie={movie} />)}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function SearchSkeletons() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex gap-4">
            <Skeleton className="h-16 w-12 flex-shrink-0" />
            <div className="space-y-2 flex-grow">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4 mt-2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function BookResult({ book }: { book: any }) {
  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors">
      <CardContent className="p-0 flex h-full">
        <div className="bg-muted w-16 flex-shrink-0 flex items-center justify-center border-r">
          <BookOpen className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <div className="p-4 flex-grow flex flex-col">
          <div className="font-semibold line-clamp-1">{book.title}</div>
          <div className="text-sm text-muted-foreground mb-2">{book.author}</div>
          <div className="mt-auto flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">{book.category}</Badge>
            <div className="text-xs">
              <span className="font-medium">{book.availableCopies}</span>/{book.totalCopies} available
            </div>
          </div>
        </div>
        <div className="p-4 border-l bg-muted/20 flex items-center justify-center">
          <Button size="sm" asChild disabled={book.availableCopies === 0}>
            <Link href={`/transactions/issue?type=book&id=${book.id}`}>Request</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MovieResult({ movie }: { movie: any }) {
  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors">
      <CardContent className="p-0 flex h-full">
        <div className="bg-muted w-16 flex-shrink-0 flex items-center justify-center border-r">
          <Film className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <div className="p-4 flex-grow flex flex-col">
          <div className="font-semibold line-clamp-1">{movie.title}</div>
          <div className="text-sm text-muted-foreground mb-2">{movie.director}</div>
          <div className="mt-auto flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">{movie.genre}</Badge>
            <div className="text-xs">
              <span className="font-medium">{movie.availableCopies}</span>/{movie.totalCopies} available
            </div>
          </div>
        </div>
        <div className="p-4 border-l bg-muted/20 flex items-center justify-center">
          <Button size="sm" asChild disabled={movie.availableCopies === 0}>
            <Link href={`/transactions/issue?type=movie&id=${movie.id}`}>Request</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
