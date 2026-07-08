import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usersApi } from "../api";
import type { CreateUserDto, UpdateUserDto, UserListParams } from "../types";
import type { ApiError } from "@/shared/api/errors";

export const usersKeys = {
  all: ["users"] as const,
  list: (p: UserListParams) => [...usersKeys.all, "list", p] as const,
  detail: (id: string) => [...usersKeys.all, "detail", id] as const,
};

export function useUser(id: string) {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => usersApi.get(id),
    enabled: !!id,
  });
}

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/** Loads users available for @mentions in comments. */
export function useMentionableUsers() {
  return useQuery({
    queryKey: [...usersKeys.all, "mentionable"] as const,
    queryFn: () => usersApi.mentionable(),
    staleTime: 5 * 60 * 1000,
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
      qc.invalidateQueries({ queryKey: usersKeys.detail(id) });
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
