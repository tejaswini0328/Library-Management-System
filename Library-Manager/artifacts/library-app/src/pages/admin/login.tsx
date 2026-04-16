import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "../../lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Shield } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { login: setAuthToken } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@library.local",
      password: "password123",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { data: { ...data, role: "admin" } },
      {
        onSuccess: (res) => {
          setAuthToken(res.token);
          toast({
            title: "Authentication successful",
            description: "Welcome back, Administrator.",
          });
          setLocation("/admin/home");
        },
        onError: (err: any) => {
          toast({
            title: "Authentication failed",
            description: err.message || "Invalid credentials",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md border-primary/20 shadow-lg">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Portal</CardTitle>
          <CardDescription>Secure access for library administrators</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label>Email Address</Label>
                    <FormControl>
                      <Input placeholder="admin@library.local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Label>Password</Label>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Authenticating..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground border-t p-4">
          <p>Restricted access. All actions are logged.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
