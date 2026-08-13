const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

let _getToken = null;

export const setTokenProvider = (fn) => {
  _getToken = fn;
};

export const api = {
  async headers() {
    const token = _getToken ? await _getToken() : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  async get(endpoint) {
    const res = await fetch(`${API}${endpoint}`, {
      headers: await this.headers(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async post(endpoint, body) {
    const res = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: await this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async delete(endpoint) {
    const res = await fetch(`${API}${endpoint}`, {
      method: "DELETE",
      headers: await this.headers(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async upsertUser(user) {
    return this.post("/api/users", user);
  },

  async getUsers() {
    return this.get("/api/users");
  },

  async searchUsers(q) {
    return this.get(`/api/users/search?q=${encodeURIComponent(q)}`);
  },

  async getChats() {
    return this.get("/api/chats");
  },

  async createChat(participantIds, name) {
    return this.post("/api/chats", { participantIds, name });
  },

  async deleteChat(chatId) {
    return this.delete(`/api/chats/${chatId}`);
  },

  async getChatById(chatId) {
    return this.get(`/api/chats/${chatId}`);
  },

  async getMessages(chatId) {
    return this.get(`/api/messages/${chatId}`);
  },

  async sendMessage(chatId, payload) {
    return this.post(`/api/messages/${chatId}`, payload);
  },

  uploadFile(file, onProgress) {
    return new Promise(async (resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);

      const token = _getToken ? await _getToken() : null;
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API}/api/upload`);

      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          try {
            const errMsg = JSON.parse(xhr.responseText).error || "Upload failed";
            reject(new Error(errMsg));
          } catch (parseErr) {
            reject(new Error("Upload failed"));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(formData);
    });
  },
};
