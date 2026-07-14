import * as signalR from "@microsoft/signalr";
import { API_BASE_URL } from "@/shared/api/client";
import { tokenStore } from "@/shared/api/tokens";
import type { UserNotification } from "@/features/notifications/types";

const HUB_URL = `${API_BASE_URL}/hubs/notifications`;

let connection: signalR.HubConnection | null = null;
let onNotification: ((notification: UserNotification) => void) | null = null;
let onReconnected: (() => void) | null = null;

function buildConnection() {
  return new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => tokenStore.getAccessToken() ?? "",
    })
    .withAutomaticReconnect()
    .configureLogging(import.meta.env.DEV ? signalR.LogLevel.Information : signalR.LogLevel.Warning)
    .build();
}

export async function startNotificationsHub(handlers: { onNotification: (notification: UserNotification) => void; onReconnected?: () => void }) {
  onNotification = handlers.onNotification;
  onReconnected = handlers.onReconnected ?? null;

  if (connection?.state === signalR.HubConnectionState.Connected) return;

  if (!connection) {
    connection = buildConnection();
    connection.on("ReceiveNotification", (notification: UserNotification) => {
      onNotification?.(notification);
    });
    connection.onreconnected(() => {
      onReconnected?.();
    });
  }

  if (connection.state === signalR.HubConnectionState.Disconnected) {
    await connection.start();
  }
}

export async function stopNotificationsHub() {
  if (connection) {
    await connection.stop();
    connection = null;
  }
  onNotification = null;
  onReconnected = null;
}
