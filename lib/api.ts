import { getGoogleToken } from "@/lib/auth";
import type { Chat, Message, MessagePage, UploadResponse, User } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

class ApiError extends Error {
  status: number;
  code?: string;
  requestId?: string;

  constructor(status: number, message: string, code?: string, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

function getAuthHeader(): Record<string, string> {
  const token = getGoogleToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseError(res: Response): Promise<ApiError> {
  const requestId = res.headers.get("x-request-id") || undefined;
  let message = `Request failed (${res.status})`;
  let code: string | undefined;
  try {
    const body = await res.json();
    if (body?.error) {
      message = body.error.message || message;
      code = body.error.code;
    }
  } catch {
    // non-json body
  }
  return new ApiError(res.status, message, code, requestId);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<T>;
}

export const api = {
  baseUrl: API_BASE,

  // Users
  getUsers: () => request<User[]>("/api/v1/users"),

  searchUsers: (q: string) =>
    request<User[]>(`/api/v1/users/search?q=${encodeURIComponent(q)}`),

  upsertUser: (payload: { username: string; email: string; avatar?: string | null }) =>
    request<User>("/api/v1/users", {
      method: "POST",
      body: JSON.stringify({
        username: payload.username,
        email: payload.email,
        ...(payload.avatar ? { avatar: payload.avatar } : {}),
      }),
    }),

  // Chats
  getChats: () => request<Chat[]>("/api/v1/chats"),

  createChat: (participantIds: string[], name?: string) =>
    request<Chat>("/api/v1/chats", {
      method: "POST",
      body: JSON.stringify({ participantIds, ...(name ? { name } : {}) }),
    }),

  getChatById: (chatId: string) => request<Chat>(`/api/v1/chats/${chatId}`),

  deleteChat: (chatId: string) =>
    request<{ deleted: boolean; chatId: string }>(`/api/v1/chats/${chatId}`, {
      method: "DELETE",
    }),

  // Messages
  getMessages: (chatId: string, cursor?: string, limit = 50) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    return request<MessagePage>(`/api/v1/messages/${chatId}?${params.toString()}`);
  },

  sendMessage: (
    chatId: string,
    payload: {
      content?: string;
      clientMessageId?: string;
      fileUrl?: string | null;
      fileName?: string | null;
      fileType?: string | null;
      fileSize?: number | null;
    },
  ) =>
    request<Message>(`/api/v1/messages/${chatId}`, {
      method: "POST",
      body: JSON.stringify({
        chatId,
        content: payload.content || "",
        clientMessageId: payload.clientMessageId,
        ...(payload.fileUrl ? { fileUrl: payload.fileUrl } : {}),
        ...(payload.fileName ? { fileName: payload.fileName } : {}),
        ...(payload.fileType ? { fileType: payload.fileType } : {}),
        ...(payload.fileSize ? { fileSize: payload.fileSize } : {}),
      }),
    }),

  // Files
  uploadFile: (file: File, onProgress?: (pct: number) => void) =>
    new Promise<UploadResponse>((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/api/v1/upload`);
      const headers = getAuthHeader();
      const token = headers.Authorization;
      if (token) xhr.setRequestHeader("Authorization", token);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText) as UploadResponse);
          } catch {
            reject(new Error("Upload failed"));
          }
        } else {
          try {
            const body = JSON.parse(xhr.responseText);
            reject(new Error(body?.error?.message || "Upload failed"));
          } catch {
            reject(new Error("Upload failed"));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(formData);
    }),
};

export { ApiError };
