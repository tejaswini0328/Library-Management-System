import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Film, Users, ShieldAlert } from "lucide-react";

export default function Instructions() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Library Management System</h1>
        <p className="text-xl text-muted-foreground">Command center for institutional library operations.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              For Administrators
            </CardTitle>
            <CardDescription>Manage catalog, users, and oversee daily operations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Key Capabilities</h3>
              <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                <li>View high-level metrics and active transaction alerts</li>
                <li>Add, update, and remove items from the Books and Movies catalogs</li>
                <li>Manage user memberships and subscription tiers</li>
                <li>Process and approve pending issue requests</li>
                <li>Review system-wide reports (Overdue, Active, Pending)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              For Members
            </CardTitle>
            <CardDescription>Browse the catalog and manage your borrowing history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Key Capabilities</h3>
              <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                <li>Search across Books and Movies by title, author, or category</li>
                <li>Request to issue available items</li>
                <li>Track due dates for currently issued items</li>
                <li>Process returns for borrowed items</li>
                <li>View and pay outstanding fines</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 bg-muted rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          System Guidelines
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-1">Borrowing Limits</p>
            <p>Users may only borrow up to their membership tier's maximum limit. Items must be returned before the due date to avoid automated fines.</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Status Tracking</p>
            <p>Every transaction moves through strict states: Pending → Issued → Returned. Overdue states are applied automatically based on due dates.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
