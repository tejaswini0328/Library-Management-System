import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { useAuth } from "../../lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function UserLogin() {
  const [, setLocation] = useLocation();
  const { login: setAuthToken } = useAuth();
  const { toast } = useToast();
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { data: { ...data, role: "user" } },
      {
        onSuccess: (res) => {
          setAuthToken(res.token);
          toast({ title: "Login successful", description: "Welcome back to the library." });
          setLocation("/user/home");
        },
        onError: (err: any) => {
          toast({ title: "Login failed", description: err.message || "Invalid credentials", variant: "destructive" });
        },
      }
    );
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(
      { data: { ...data, role: "user" } },
      {
        onSuccess: (res) => {
          setAuthToken(res.token);
          toast({ title: "Registration successful", description: "Your account has been created." });
          setLocation("/user/home");
        },
        onError: (err: any) => {
          toast({ title: "Registration failed", description: err.message || "Could not create account", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md border-border shadow-md">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Member Access</CardTitle>
          <CardDescription>Sign in to your account or register to join</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Email Address</Label>
                        <FormControl>
                          <Input placeholder="member@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
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
                  <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Authenticating..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Full Name</Label>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Email Address</Label>
                        <FormControl>
                          <Input placeholder="jane@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
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
                  <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? "Creating account..." : "Register Account"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
