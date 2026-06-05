import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  MoreHorizontal,
  Shield,
  ShieldOff,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { UserAvatar } from "@/shared/components/UserAvatar";
import { formatDateTime } from "@/shared/utils/format";
import {
  useUser,
  useUpdateUser,
  useBanUser,
  useDeleteUser,
  useSendTestEmail,
} from "@/features/users/hooks";

export const Route = createFileRoute("/_authenticated/users/$id")({
  component: UserDetailPage,
});

const schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  username: z
    .string()
    .min(1, "Username is required")
    .regex(/^[a-zA-Z0-9._-]+$/, "Letters, numbers, dot, underscore, dash"),
  email: z.string().email("Invalid email address"),
  userType: z.enum(["Standard", "Reporter", "Guest"]),
  vcsUsernames: z.string().optional(),
  timeZoneRegion: z.string().optional(),
  timeZoneCity: z.string().optional(),
  language: z.string().optional(),
  dateFormat: z.string().optional(),
  periodFormat: z.string().optional(),
  firstDayOfWeek: z.enum(["Sunday", "Monday"]).optional(),
  defaultSorting: z.enum(["Relevance", "Updated"]).optional(),
});

type FormValues = z.infer<typeof schema>;

const TABS = [
  { value: "general", label: "General" },
  { value: "workspace", label: "Workspace" },
  { value: "ai", label: "AI Features" },
  { value: "tags", label: "Tags and Saved Searches" },
  { value: "notifications", label: "Notifications" },
  { value: "groups", label: "Groups" },
  { value: "security", label: "Account Security" },
];

function UserDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const query = useUser(id);
  const updateMut = useUpdateUser(id);
  const banMut = useBanUser();
  const delMut = useDeleteUser();
  const testEmail = useSendTestEmail();
  const [tab, setTab] = useState("general");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      userType: "Standard",
      vcsUsernames: "",
      timeZoneRegion: "",
      timeZoneCity: "",
      language: "English",
      dateFormat: "31 Dec 2000 23:59",
      periodFormat: "Weeks, days, hours, and minutes",
      firstDayOfWeek: "Sunday",
      defaultSorting: "Relevance",
    },
  });

  useEffect(() => {
    if (!query.data) return;
    const u = query.data;
    form.reset({
      fullName: u.fullName ?? "",
      username: u.username ?? "",
      email: u.email ?? "",
      userType: u.userType ?? "Standard",
      vcsUsernames: (u.vcsUsernames ?? []).join("\n"),
      timeZoneRegion: u.timeZoneRegion ?? "",
      timeZoneCity: u.timeZoneCity ?? "",
      language: u.language ?? "English",
      dateFormat: u.dateFormat ?? "31 Dec 2000 23:59",
      periodFormat: u.periodFormat ?? "Weeks, days, hours, and minutes",
      firstDayOfWeek: u.firstDayOfWeek ?? "Sunday",
      defaultSorting: u.defaultSorting ?? "Relevance",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data]);

  const onSubmit = (values: FormValues) => {
    updateMut.mutate({
      ...values,
      vcsUsernames: (values.vcsUsernames ?? "")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Card className="p-8 text-center space-y-3">
        <p className="text-sm font-medium text-destructive">
          Failed to load user
        </p>
        <p className="text-xs text-muted-foreground">
          {(query.error as Error)?.message}
        </p>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>
          Try again
        </Button>
      </Card>
    );
  }

  const user = query.data;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon">
            <Link to="/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <UserAvatar
            name={user.fullName}
            src={user.avatarUrl ?? undefined}
            seed={user.id}
            className="h-10 w-10"
          />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">
              {user.fullName || user.username}
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() =>
                banMut.mutate({ id: user.id, banned: !!user.banned })
              }
            >
              {user.banned ? (
                <>
                  <ShieldOff className="mr-2 h-4 w-4" /> Unban user
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" /> Ban user
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                delMut.mutate(user.id, {
                  onSuccess: () => navigate({ to: "/users" }),
                });
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 gap-1">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-3 py-2 -mb-px text-muted-foreground"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="pt-6">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 max-w-3xl"
          >
            <FieldRow label="Full name">
              <Input className="max-w-md" {...form.register("fullName")} />
              <FieldError message={form.formState.errors.fullName?.message} />
            </FieldRow>

            <FieldRow label="Username">
              <Input className="max-w-md" {...form.register("username")} />
              <FieldError message={form.formState.errors.username?.message} />
            </FieldRow>

            <FieldRow label="Avatar">
              <UserAvatar
                name={user.fullName}
                src={user.avatarUrl ?? undefined}
                seed={user.id}
                className="h-12 w-12 rounded-md"
              />
            </FieldRow>

            <FieldRow label="User type">
              <Select
                value={form.watch("userType")}
                onValueChange={(v) =>
                  form.setValue("userType", v as FormValues["userType"], {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard user</SelectItem>
                  <SelectItem value="Reporter">Reporter</SelectItem>
                  <SelectItem value="Guest">Guest</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2 max-w-2xl">
                This setting defines which features are available to this user
                when working with YouTrack. Fine-grained access rights are
                managed using group memberships and roles.
              </p>
            </FieldRow>

            <Separator />

            <FieldRow
              label={
                <span className="inline-flex items-center gap-1.5">
                  Email
                  {user.emailVerified && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                </span>
              }
            >
              <div className="flex items-center gap-2 max-w-md">
                <Input {...form.register("email")} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => testEmail.mutate(user.id)}
                  disabled={testEmail.isPending}
                >
                  Send test message
                </Button>
              </div>
              <FieldError message={form.formState.errors.email?.message} />
            </FieldRow>

            <FieldRow label="VCS usernames">
              <Textarea
                className="max-w-md font-mono text-sm"
                rows={3}
                {...form.register("vcsUsernames")}
              />
              <p className="text-xs text-muted-foreground mt-2 max-w-2xl">
                Adding personal identifiers from integrated version control
                systems (VCS) lets YouTrack add links to issues referenced in
                your code commits.
              </p>
            </FieldRow>

            <FieldRow label="Registration date">
              <p className="text-sm">{formatDateTime(user.registrationDate)}</p>
            </FieldRow>

            <FieldRow label="Personal data">
              <Button type="button" variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Download in CSV format
              </Button>
            </FieldRow>

            <Separator />

            <FieldRow label="Local time zone">
              <div className="space-y-2 max-w-md">
                <Input
                  placeholder="Region (e.g. Europe)"
                  {...form.register("timeZoneRegion")}
                />
                <Input
                  placeholder="City (e.g. Tirane)"
                  {...form.register("timeZoneCity")}
                />
                <p className="text-xs text-muted-foreground">
                  Guess time zone from browser settings
                </p>
              </div>
            </FieldRow>

            <FieldRow label="Language">
              <Select
                value={form.watch("language") ?? "English"}
                onValueChange={(v) =>
                  form.setValue("language", v, { shouldDirty: true })
                }
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="German">German</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2 max-w-2xl">
                Set your display language for YouTrack. The language used for
                search queries, commands, and custom fields is set at the global
                level.
              </p>
            </FieldRow>

            <FieldRow label="Date format">
              <Select
                value={form.watch("dateFormat") ?? "31 Dec 2000 23:59"}
                onValueChange={(v) =>
                  form.setValue("dateFormat", v, { shouldDirty: true })
                }
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="31 Dec 2000 23:59">
                    31 Dec 2000 23:59
                  </SelectItem>
                  <SelectItem value="2000-12-31 23:59">
                    2000-12-31 23:59
                  </SelectItem>
                  <SelectItem value="12/31/2000 11:59 PM">
                    12/31/2000 11:59 PM
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2 max-w-2xl">
                Choose how you want to display and enter dates in issue fields
              </p>
            </FieldRow>

            <FieldRow label="Period format">
              <Select
                value={
                  form.watch("periodFormat") ??
                  "Weeks, days, hours, and minutes"
                }
                onValueChange={(v) =>
                  form.setValue("periodFormat", v, { shouldDirty: true })
                }
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weeks, days, hours, and minutes">
                    Weeks, days, hours, and minutes
                  </SelectItem>
                  <SelectItem value="Hours and minutes">
                    Hours and minutes
                  </SelectItem>
                  <SelectItem value="Minutes only">Minutes only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2 max-w-2xl">
                Choose how you want to display period values in issue fields and
                on some reports
              </p>
            </FieldRow>

            <FieldRow label="First day of week">
              <Select
                value={form.watch("firstDayOfWeek") ?? "Sunday"}
                onValueChange={(v) =>
                  form.setValue(
                    "firstDayOfWeek",
                    v as FormValues["firstDayOfWeek"],
                    { shouldDirty: true },
                  )
                }
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sunday">Sunday</SelectItem>
                  <SelectItem value="Monday">Monday</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2 max-w-2xl">
                Choose which day starts each week in calendar controls
              </p>
            </FieldRow>

            <FieldRow label="Default sorting for text search">
              <div className="inline-flex rounded-md border p-0.5">
                {(["Relevance", "Updated"] as const).map((opt) => {
                  const active = form.watch("defaultSorting") === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        form.setValue("defaultSorting", opt, {
                          shouldDirty: true,
                        })
                      }
                      className={`px-3 py-1 text-xs rounded-sm transition-colors ${
                        active
                          ? "bg-primary/10 text-primary border border-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </FieldRow>

            <Separator />

            <div className="flex items-center gap-2 sticky bottom-0 bg-background pt-4 pb-2">
              <Button
                type="submit"
                disabled={!form.formState.isDirty || updateMut.isPending}
              >
                {updateMut.isPending ? "Saving..." : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={!form.formState.isDirty}
                onClick={() => form.reset()}
              >
                Discard
              </Button>
            </div>
          </form>
        </TabsContent>

        {TABS.filter((t) => t.value !== "general").map((t) => (
          <TabsContent key={t.value} value={t.value} className="pt-6">
            <Card className="p-12 text-center text-sm text-muted-foreground">
              {t.label} settings coming soon.
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-6 items-start">
      <Label className="text-sm text-muted-foreground pt-2">{label}</Label>
      <div>{children}</div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}
