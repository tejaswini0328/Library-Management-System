import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/instructions");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-xl text-primary">LibSys</Link>
            
            {user?.role === "admin" && (
              <nav className="hidden md:flex gap-4">
                <Link href="/admin/home" className="text-sm font-medium hover:text-primary">Dashboard</Link>
                <Link href="/admin/books" className="text-sm font-medium hover:text-primary">Books</Link>
                <Link href="/admin/movies" className="text-sm font-medium hover:text-primary">Movies</Link>
                <Link href="/admin/memberships" className="text-sm font-medium hover:text-primary">Memberships</Link>
                <Link href="/admin/reports" className="text-sm font-medium hover:text-primary">Reports</Link>
                <Link href="/transactions" className="text-sm font-medium hover:text-primary">Transactions</Link>
              </nav>
            )}

            {user?.role === "user" && (
              <nav className="hidden md:flex gap-4">
                <Link href="/user/home" className="text-sm font-medium hover:text-primary">Dashboard</Link>
                <Link href="/user/books" className="text-sm font-medium hover:text-primary">Books</Link>
                <Link href="/user/search" className="text-sm font-medium hover:text-primary">Search</Link>
                <Link href="/transactions/issue" className="text-sm font-medium hover:text-primary">Issue Item</Link>
                <Link href="/transactions/return" className="text-sm font-medium hover:text-primary">Returns</Link>
                <Link href="/transactions/pay-fine" className="text-sm font-medium hover:text-primary">Fines</Link>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!user ? (
              <>
                <Link href="/admin/login">
                  <Button variant="ghost" size="sm">Admin Login</Button>
                </Link>
                <Link href="/user/login">
                  <Button size="sm">User Login</Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{user.name}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
