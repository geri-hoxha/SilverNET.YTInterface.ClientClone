// Minimal JWT helpers. The backend returns a `permissions` array on login and
// refresh, but the access token also carries one `permission` claim per granted
// permission (plus `role` and `organizationId`). Decoding lets us recover
// permissions when only a token is available (e.g. an older refresh response).
import type { PortalRole } from "./types";

export interface JwtClaims {
  permissions: string[];
  role?: PortalRole;
  organizationId?: string;
}

function base64UrlDecode(segment: string): string {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  const withPadding = padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "=");
  if (typeof atob === "function") {
    // Decode and handle UTF-8 byte sequences.
    const binary = atob(withPadding);
    try {
      return decodeURIComponent(
        Array.from(binary)
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join(""),
      );
    } catch {
      return binary;
    }
  }
  return "";
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") return [value];
  return [];
}

// Decodes the claims we care about. Returns null when the token can't be parsed.
export function decodeJwtClaims(token: string | null | undefined): JwtClaims | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;
    const permissions = asArray(payload.permission ?? payload.permissions);
    const role = typeof payload.role === "string" ? (payload.role as PortalRole) : undefined;
    const organizationId = typeof payload.organizationId === "string" ? payload.organizationId : undefined;
    return { permissions, role, organizationId };
  } catch {
    return null;
  }
}
