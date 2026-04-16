import { useState } from "react";
import { useListBooks, getListBooksQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Book as BookIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function UserBooks() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListBooks(
    { search, category, available: true, page, limit: 12 },
    { query: { queryKey: getListBooksQueryKey({ search, category, available: true, page, limit: 12 }) } }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library Catalog</h1>
          <p className="text-muted-foreground">Browse available books to borrow.</p>
        </div>
        <Button asChild>
          <Link href="/transactions/issue">Issue a Book</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search titles, authors..."
            className="pl-8"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Filter by category..."
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {isLoading ? (
          [...Array(8)].map((_, i) => (
            <Card key={i} className="flex flex-col h-full">
              <CardHeader className="pb-2 flex-grow-0">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="pb-2 flex-grow">
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-5 w-20" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))
        ) : data?.data.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <BookIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium">No books found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        ) : (
          data?.data.map((book) => (
            <Card key={book.id} className="flex flex-col h-full">
              <CardHeader className="pb-2 flex-grow-0">
                <CardTitle className="line-clamp-2 text-lg">{book.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{book.author}</p>
              </CardHeader>
              <CardContent className="pb-2 flex-grow">
                {book.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{book.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-auto">
                  <Badge variant="secondary">{book.category}</Badge>
                  {book.publishedYear && <Badge variant="outline">{book.publishedYear}</Badge>}
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t flex items-center justify-between mt-auto">
                <div className="text-sm">
                  <span className="font-medium">{book.availableCopies}</span> 
                  <span className="text-muted-foreground"> / {book.totalCopies} available</span>
                </div>
                <Button size="sm" asChild disabled={book.availableCopies === 0}>
                  <Link href={`/transactions/issue?type=book&id=${book.id}`}>Request</Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {data && data.total > 12 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous Page</Button>
          <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page * 12 >= data.total}>Next Page</Button>
        </div>
      )}
    </div>
  );
}
