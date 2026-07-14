import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { useAuth, loginSchema, loginSearchSchema, requireGuest, safeRedirectPath, type LoginFormValues } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ApiError } from "@/shared/api/errors";

type FormValues = LoginFormValues;

export const Route = createFileRoute("/login")({
  validateSearch: zodValidator(loginSearchSchema),
  beforeLoad: requireGuest,
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      toast.success("Welcome back");
      navigate({ to: safeRedirectPath(redirectTo) });
    } catch (e) {
      toast.error((e as ApiError).message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="from-background via-background to-muted flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="bg-primary text-primary-foreground mx-auto flex h-12 w-12 items-center justify-center rounded-xl">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">YTInterface</CardTitle>
          <CardDescription>Sign in to your internal workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
              {form.formState.errors.password && <p className="text-destructive text-xs">{form.formState.errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
            {/* <p className="text-xs text-center text-muted-foreground">
              Backend: <code className="font-mono">{import.meta.env.VITE_API_BASE_URL ?? "/api"}</code>
            </p> */}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
