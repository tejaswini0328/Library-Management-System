import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./lib/auth";
import { Layout } from "./components/layout";
import { useEffect } from "react";

// Pages
import Instructions from "./pages/instructions";
import AdminLogin from "./pages/admin/login";
import UserLogin from "./pages/user/login";
import AdminHome from "./pages/admin/home";
import AdminBooks from "./pages/admin/books";
import AdminMovies from "./pages/admin/movies";
import AdminMemberships from "./pages/admin/memberships";
import AdminReports from "./pages/admin/reports";
import UserHome from "./pages/user/home";
import UserBooks from "./pages/user/books";
import UserSearch from "./pages/user/search";
import TransactionsList from "./pages/transactions/index";
import IssueTransaction from "./pages/transactions/issue";
import ReturnItem from "./pages/transactions/return";
import PayFine from "./pages/transactions/pay-fine";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient();

function IndexRedirect() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) setLocation("/instructions");
      else if (user.role === "admin") setLocation("/admin/home");
      else setLocation("/user/home");
    }
  }, [user, isLoading, setLocation]);

  return <div className="p-8 text-center text-muted-foreground">Loading application...</div>;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={IndexRedirect} />
        <Route path="/instructions" component={Instructions} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/user/login" component={UserLogin} />
        <Route path="/admin/home" component={AdminHome} />
        <Route path="/admin/books" component={AdminBooks} />
        <Route path="/admin/movies" component={AdminMovies} />
        <Route path="/admin/memberships" component={AdminMemberships} />
        <Route path="/admin/reports" component={AdminReports} />
        <Route path="/user/home" component={UserHome} />
        <Route path="/user/books" component={UserBooks} />
        <Route path="/user/search" component={UserSearch} />
        <Route path="/transactions" component={TransactionsList} />
        <Route path="/transactions/issue" component={IssueTransaction} />
        <Route path="/transactions/return" component={ReturnItem} />
        <Route path="/transactions/pay-fine" component={PayFine} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
