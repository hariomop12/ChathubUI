import clsx from "clsx";
import { useState, useEffect } from "react";
import Cropper from "react-easy-crop";
import { Settings, Sun, Moon, LogOut } from "lucide-react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { api } from "../api/api";
import { useTheme } from "../context/ThemeContext";

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getCroppedImageFile = async (imageSrc, cropPixels) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height,
  );

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );

  return new File([blob], "profile-image.jpg", { type: "image/jpeg" });
};

const Sidebar = ({
  chats,
  activeChat,
  onSelectChat,
  onDeleteChat,
  onChatsChange,
}) => {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const { theme, toggleTheme } = useTheme();
  const [users, setUsers] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    api.getUsers().then(setUsers).catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (selectedImage) URL.revokeObjectURL(selectedImage);
    };
  }, [selectedImage]);

  useEffect(() => {
    if (isSettingsOpen && user) {
      setDisplayName(user.fullName || user.username || "");
    }
  }, [isSettingsOpen, user]);

  if (!isLoaded) return null;

  const startChat = async (otherUser) => {
    try {
      const chat = await api.createChat([otherUser.id]);
      onSelectChat(chat);
      await onChatsChange();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteChat = async (e, chatId) => {
    e.stopPropagation();

    const confirmed = window.confirm("Delete this direct chat?");
    if (!confirmed) return;

    await onDeleteChat(chatId);
  };

  const resetImageSelection = () => {
    if (selectedImage) URL.revokeObjectURL(selectedImage);
    setSelectedImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setUploadError("");
  };

  const closeSettings = () => {
    if (isUploading) return;
    setIsSettingsOpen(false);
    resetImageSelection();
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }

    resetImageSelection();
    setSelectedImage(URL.createObjectURL(file));
  };

  const saveUserSettings = async () => {
    if (!user) return;

    const trimmedName = displayName.trim();
    const currentName = (user.fullName || user.username || "").trim();
    const hasNameChange = trimmedName && trimmedName !== currentName;
    const hasImageChange = selectedImage && croppedAreaPixels;

    if (!hasNameChange && !hasImageChange) return;

    try {
      setIsUploading(true);
      setUploadError("");

      if (hasNameChange) {
        const [firstName, ...lastNameParts] = trimmedName.split(/\s+/);

        await user.update({
          firstName,
          lastName: lastNameParts.join(" "),
        });
      }

      if (hasImageChange) {
        const croppedImageFile = await getCroppedImageFile(
          selectedImage,
          croppedAreaPixels,
        );

        await user.setProfileImage({
          file: croppedImageFile,
        });
      }

      await user.reload?.();

      await api.upsertUser({
        id: user.id,
        username: trimmedName || user.username || user.fullName || "Anonymous",
        email: user.primaryEmailAddress?.emailAddress || "",
        avatar: user.imageUrl,
      });

      api.getUsers().then(setUsers).catch(() => {});

      setIsSettingsOpen(false);
      resetImageSelection();
    } catch (err) {
      console.error(err);
      setUploadError("Could not update your settings. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const trimmedDisplayName = displayName.trim();
  const currentDisplayName = (user?.fullName || user?.username || "").trim();
  const canSaveSettings =
    !isUploading &&
    ((trimmedDisplayName && trimmedDisplayName !== currentDisplayName) ||
      Boolean(selectedImage));

  return (
    <div
      className="chat-sidebar w-[320px] bg-bg-sidebar flex flex-col border-r border-border text-text"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-base">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h2 className="m-0 text-lg font-bold text-text">
            Messages
          </h2>
        </div>
      </div>

      <div className="px-5 pt-4 pb-2 text-xs font-bold text-text-muted tracking-wider uppercase">
        All Users
      </div>

      <div className="max-h-[220px] overflow-y-auto px-2.5">
        {Array.isArray(users) &&
          users
            .filter((u) => u.id !== user?.id)
          .map((u) => (
            <div
              key={u.id}
              onClick={() => startChat(u)}
              className="px-3 py-2.5 cursor-pointer flex items-center gap-3 rounded-[10px] mb-1.5 transition-all duration-200 hover:bg-bg-hover"
            >
              <img
                src={u.avatar}
                alt=""
                className="w-[42px] h-[42px] rounded-full border-2 border-border object-cover"
              />

              <div className="min-w-0">
                <div className="text-sm font-semibold">
                  {u.username}
                </div>

                <div className="text-xs text-text-muted overflow-hidden truncate">
                  {u.email}
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="px-5 pt-4 pb-2 text-xs font-bold text-text-muted tracking-wider uppercase">
        Your Chats
      </div>

      <div className="flex-1 overflow-y-auto px-2.5">
        {!Array.isArray(chats) || chats.length === 0 ? (
          <p
            className="empty-chat-copy p-5 text-text-muted text-center text-sm"
          >
            Start chatting with someone 👋
          </p>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className={clsx(
                "p-3 cursor-pointer flex items-center justify-between gap-3 rounded-md mb-1.5 transition-all duration-150 hover:bg-bg-hover",
                activeChat?.id === chat.id && "bg-bg-active shadow-sm",
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {chat.other_avatar && (
                  <img
                    src={chat.other_avatar}
                    alt=""
                    className="w-[44px] h-[44px] rounded-full object-cover border-2 border-border"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm">
                    {chat.other_username || chat.name || "Direct Chat"}
                  </div>

                  {chat.last_message && (
                    <p
                      className={clsx(
                        "mt-1 text-xs overflow-hidden whitespace-nowrap truncate",
                        activeChat?.id === chat.id ? "text-primary-light" : "text-text-muted",
                      )}
                    >
                      {chat.last_message}
                    </p>
                  )}
                </div>
              </div>

              {!chat.is_group && (
                <button
                  type="button"
                  onClick={(e) => deleteChat(e, chat.id)}
                  title="Delete chat"
                  className="w-8 h-8 rounded-[8px] border-none bg-call-red text-white cursor-pointer text-sm transition-all duration-200 opacity-70 hover:opacity-100 shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom User Section */}
      <div className="px-[18px] py-[14px] border-t border-border flex items-center gap-3 bg-bg-card">
        <img
          src={user?.imageUrl}
          alt=""
          className="w-[42px] h-[42px] rounded-full object-cover"
        />

        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">
            {user?.fullName || user?.username}
          </div>

          <div className="text-xs text-text-muted">
            Online
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "light" ? "Dark mode" : "Light mode"}
            aria-label="Toggle theme"
            className="w-9 h-9 border-none rounded-[8px] cursor-pointer flex items-center justify-center transition-all duration-200 relative overflow-hidden hover:scale-105 hover:opacity-80"
            style={{
              background: theme === "light" ? "#f1f5f9" : "#334155",
              color: theme === "light" ? "#f59e0b" : "#fbbf24",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center" style={{
              transition: "transform 0.4s ease, opacity 0.3s ease",
              transform: theme === "light" ? "rotate(0deg) scale(1)" : "rotate(180deg) scale(0)",
              opacity: theme === "light" ? 1 : 0,
            }}>
              <Sun size={18} strokeWidth={2.2} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center" style={{
              transition: "transform 0.4s ease, opacity 0.3s ease",
              transform: theme === "dark" ? "rotate(0deg) scale(1)" : "rotate(-180deg) scale(0)",
              opacity: theme === "dark" ? 1 : 0,
            }}>
              <Moon size={18} strokeWidth={2.2} />
            </div>
          </button>
          <button type="button" onClick={() => clerk.signOut()} title="Sign out" aria-label="Sign out" className="w-9 h-9 rounded-[8px] border border-border bg-bg-card cursor-pointer flex items-center justify-center text-call-red shrink-0 transition-all duration-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 hover:scale-105 hover:shadow-sm active:scale-95">
            <LogOut size={16} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
            aria-label="Open settings"
            className="w-9 h-9 border-none rounded-[8px] bg-bg-hover text-text-secondary cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-border hover:text-text"
          >
            <Settings size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {isSettingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="User Settings"
          onClick={closeSettings}
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[1000] backdrop-blur-sm"
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[460px] max-h-[90vh] overflow-y-auto bg-bg-card rounded-lg shadow-[0_30px_80px_rgba(0,0,0,0.3)] animate-slide-up">
            {/* HEADER */}
            <div className="px-5 py-[18px] border-b border-border flex justify-between items-center">
              <div>
                <h3 className="m-0 text-base font-bold text-text">Profile settings</h3>
                <p className="mt-1 text-sm text-text-secondary">Update your profile details</p>
              </div>

              <button
                onClick={closeSettings}
                disabled={isUploading}
                className="w-[34px] h-[34px] rounded-sm border border-border bg-bg-card text-text-muted cursor-pointer text-base shrink-0"
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="p-5 flex flex-col gap-3.5">
              {/* Avatar */}
              <div className="flex items-center gap-3.5">
                <img src={user?.imageUrl} className="w-[74px] h-[74px] rounded-full object-cover border-[3px] border-border" alt="avatar" />

                <label className="px-3.5 py-2.5 rounded-[10px] border border-border bg-bg text-text text-sm font-semibold cursor-pointer">
                  Change photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    hidden
                  />
                </label>
              </div>

              {/* Name */}
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-[11px] rounded-[10px] border border-border bg-bg text-text outline-none text-sm"
              />

              {/* Crop */}
              {selectedImage && (
                <div className="flex flex-col gap-2.5">
                  <p className="m-0 text-sm font-bold text-text">Adjust image</p>

                  <div className="w-full h-[260px] rounded-md overflow-hidden bg-text">
                    <Cropper
                      image={selectedImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={(_, croppedPixels) =>
                        setCroppedAreaPixels(croppedPixels)
                      }
                    />
                  </div>

                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setZoom(1);
                    }}
                    className="self-start border-none bg-transparent text-call-red text-sm font-semibold cursor-pointer"
                  >
                    Remove selected image
                  </button>
                </div>
              )}

              {uploadError && <p className="m-0 text-call-red text-sm">{uploadError}</p>}
            </div>

            {/* FOOTER */}
            <div className="px-5 py-[14px] border-t border-border flex justify-end gap-2.5">
              <button
                onClick={closeSettings}
                disabled={isUploading}
                className="px-3.5 py-[9px] rounded-[10px] border border-border bg-bg-card text-text font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={saveUserSettings}
                disabled={!canSaveSettings}
                className={clsx(
                  "px-3.5 py-[9px] rounded-[10px] border-none bg-primary text-white font-bold cursor-pointer shadow-[0_4px_12px_rgba(79,70,229,0.3)]",
                  !canSaveSettings && "opacity-50 cursor-not-allowed",
                )}
              >
                {isUploading ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
