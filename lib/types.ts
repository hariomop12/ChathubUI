export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string | null;
}

export interface Chat {
  id: string;
  name?: string | null;
  is_group: boolean;
  created_at: string;
  last_message?: string | null;
  last_message_at?: string | null;
  other_user_id?: string | null;
  other_username?: string | null;
  other_avatar?: string | null;
  other_online?: boolean;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  seq: number;
  client_message_id?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  created_at: string;
  username: string;
  avatar?: string | null;
}

export interface MessagePage {
  messages: Message[];
  nextCursor?: string | null;
}

export interface UploadResponse {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface GoogleProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  idToken: string;
}

export type CallState = "idle" | "incoming" | "calling" | "connected";

export interface CallerInfo {
  callerId?: string;
  username: string;
  avatar?: string;
}

export interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
}
