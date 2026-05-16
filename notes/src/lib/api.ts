const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const TOKEN_KEY = "notes_access_token";
const EMAIL_KEY = "notes_user_email";

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  share_name?: string;
  owner_username?: string;
  share_permission?: "viewer" | "editor";
  permission?: "viewer" | "editor";
  edited_by?: Array<{
    name: string;
    email: string;
    edited_at: string;
  }>;
};

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const emailStore = {
  get: () => localStorage.getItem(EMAIL_KEY),
  set: (email: string) => localStorage.setItem(EMAIL_KEY, email),
  clear: () => localStorage.removeItem(EMAIL_KEY),
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth) {
    const token = tokenStore.get();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || "Request failed";
    throw new Error(Array.isArray(data?.errors) ? data.errors.join(", ") : message);
  }

  return data as T;
};

export const api = {
  register: (email: string, password: string, name?: string) =>
    request<{ message: string }>("/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<{ access_token: string; username: string; name: string }>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getNotes: () => request<Note[]>("/notes", { auth: true }),

  createNote: (payload: Pick<Note, "title" | "content">) =>
    request<Note>("/notes", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    }),

  updateNote: (id: string, payload: Pick<Note, "title" | "content">) =>
    request<Note>(`/notes/${id}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(payload),
    }),

  deleteNote: (id: string) =>
    request<void>(`/notes/${id}`, {
      method: "DELETE",
      auth: true,
    }),

  shareNote: (id: string, shareName: string, permission: "viewer" | "editor") =>
    request<{ message: string; share_link: string; username: string; share_name: string }>(`/notes/${id}/share`, {
      method: "POST",
      auth: true,
      body: JSON.stringify({ share_name: shareName, permission }),
    }),

  getSharedNote: (username: string, shareName: string) => request<Note>(`/${username}/${shareName}`),

  updateSharedNote: (username: string, shareName: string, payload: Pick<Note, "title" | "content">) =>
    request<Note>(`/${username}/${shareName}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(payload),
    }),
};
