import { useEffect, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { usersApi } from "../api";
import type {
  CreateUserDto,
  PaginatedResult,
  PortalUser,
  UpdateUserDto,
  UserListParams,
} from "../types";
import type { ApiError } from "@/shared/api/errors";

export const usersKeys = {
  all: ["users"] as const,
  list: (p: UserListParams) => [...usersKeys.all, "list", p] as const,
};

function findUserInCache(
  qc: QueryClient,
  id: string,
): PortalUser | undefined {
  const entries = qc.getQueriesData<PaginatedResult<PortalUser>>({
    queryKey: usersKeys.all,
  });
  for (const [, data] of entries) {
    const user = data?.items.find((u) => u.id === id);
    if (user) return user;
  }
  return undefined;
}

export function useUserFromCache(id: string) {
  const qc = useQueryClient();
  const [user, setUser] = useState<PortalUser | undefined>(() =>
    findUserInCache(qc, id),
  );

  useEffect(() => {
    setUser(findUserInCache(qc, id));
    return qc.getQueryCache().subscribe(() => {
      setUser(findUserInCache(qc, id));
    });
  }, [qc, id]);

  return {
    data: user,
    isLoading: false,
    isError: !user && !!id,
  };
}

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserDto) => usersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.all });
      toast.success("User created");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserDto) => usersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.all });
      toast.success("User updated");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.all });
      toast.success("User deleted");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: (id: string) => usersApi.sendTestEmail(id),
    onSuccess: () => toast.success("Test message sent"),
    onError: (e: ApiError) => toast.error(e.message),
  });
}
