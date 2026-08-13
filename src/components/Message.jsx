import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { FileText, X, Image as ImageIcon } from "lucide-react";

const formatSize = (bytes) => {
  if (!bytes) return "";

  if (bytes < 1024) return bytes + " B";

  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  }

  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const getFileLabel = (type) => {
  if (!type) return "FILE";

  if (type.startsWith("image/")) return "IMAGE";

  if (type === "application/pdf") return "PDF";

  return "FILE";
};

const FileAttachment = ({ name, size, type, onClick, isOwn }) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 px-3.5 py-3 mt-2 rounded-[14px] cursor-pointer transition-all duration-200 hover:-translate-y-0.5",
        isOwn
          ? "bg-white/10 hover:bg-white/15 border border-white/20"
          : "bg-bg hover:bg-bg-hover border border-border"
      )}
    >
      <div
        className={clsx(
          "w-[42px] h-[42px] rounded-md flex items-center justify-center shrink-0",
          isOwn ? "bg-white/20" : "bg-primary-bg"
        )}
      >
        <FileText
          size={20}
          className={isOwn ? "text-white" : "text-primary-light"}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={clsx(
            "text-sm font-semibold truncate",
            isOwn ? "text-white" : "text-text"
          )}
        >
          {name}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span
            className={clsx(
              "text-[10px] font-bold px-[7px] py-[3px] rounded-full text-white",
              isOwn ? "bg-white/25" : "bg-primary-light"
            )}
          >
            {getFileLabel(type)}
          </span>

          <span
            className={clsx(
              "text-xs",
              isOwn ? "text-white/70" : "text-text-muted"
            )}
          >
            {formatSize(size)}
          </span>
        </div>
      </div>
    </div>
  );
};

const Message = ({ message, isOwn }) => {
  const [preview, setPreview] = useState(null);
  const [previewType, setPreviewType] = useState(null);

  const closePreview = () => {
    setPreview(null);
    setPreviewType(null);
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        closePreview();
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <>
      {/* PREVIEW MODAL */}
      {preview && (
        <div
          onClick={closePreview}
          className="fixed inset-0 bg-black/88 backdrop-blur-md flex items-center justify-center z-[9999] p-5 animate-fade-in"
        >
          {/* CLOSE BUTTON */}
          <button
            title="Close"
            onClick={(e) => {
              e.stopPropagation();
              closePreview();
            }}
            className="absolute top-5 right-5 w-[46px] h-[46px] rounded-full border-none bg-white/12 text-white cursor-pointer backdrop-blur-sm flex items-center justify-center transition-all duration-200 z-[10000] hover:bg-white/22"
          >
            <X size={22} />
          </button>

          {/* IMAGE PREVIEW */}
          {previewType === "image" && (
            <img
              src={preview}
              alt="Preview"
              onClick={(e) => e.stopPropagation()}
              className="max-w-[92%] max-h-[92%] rounded-lg object-contain shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
            />
          )}

          {/* PDF PREVIEW */}
          {previewType === "pdf" && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-[92%] h-[92%] rounded-[18px] overflow-hidden bg-white shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
            >
              <iframe
                src={preview}
                title="PDF Preview"
                className="w-full h-full border-none"
              />
            </div>
          )}
        </div>
      )}

      {/* MESSAGE */}
      <div
        className={clsx(
          "flex items-end gap-2.5 mb-4",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* AVATAR */}
        <img
          src={message.avatar}
          alt=""
          className="w-[34px] h-[34px] rounded-full object-cover border-2 border-border shrink-0"
        />

        {/* MESSAGE BOX */}
        <div
          className={clsx(
            "message-bubble max-w-[72%] px-4 py-3 rounded-[20px]",
            isOwn
              ? "bg-gradient-to-br from-primary to-primary-light text-white rounded-br-[6px] shadow-[0_2px_8px_rgba(79,70,229,0.2)]"
              : "bg-msg-other text-text rounded-bl-[6px] shadow-[0_2px_6px_rgba(0,0,0,0.04)]"
          )}
        >
          {/* IMAGE */}
          {message.file_url && message.file_type?.startsWith("image/") ? (
            <div>
              <div
                onClick={() => {
                  setPreview(message.file_url);
                  setPreviewType("image");
                }}
                className="overflow-hidden rounded-[14px] cursor-pointer"
              >
                <img
                  src={message.file_url}
                  alt={message.file_name || "Image"}
                  className="max-w-full max-h-[320px] block transition-transform duration-200"
                />
              </div>

              {message.file_name && (
                <div
                  className={clsx(
                    "flex items-center gap-1.5 mt-2 text-xs",
                    isOwn ? "text-white/70" : "text-text-muted"
                  )}
                >
                  <ImageIcon size={14} />

                  <span>
                    {message.file_name}

                    {message.file_size
                      ? ` (${formatSize(message.file_size)})`
                      : ""}
                  </span>
                </div>
              )}
            </div>
          ) : message.file_url ? (
            /* FILE / PDF */
            <FileAttachment
              isOwn={isOwn}
              name={message.file_name || "File"}
              size={message.file_size}
              type={message.file_type}
              onClick={() => {
                const isPdf = message.file_type === "application/pdf";

                setPreview(message.file_url);
                setPreviewType(isPdf ? "pdf" : "image");
              }}
            />
          ) : null}

          {/* TEXT */}
          {message.content && (
            <p
              className={clsx(
                "text-base leading-relaxed break-words",
                message.file_url ? "mt-2.5" : "m-0"
              )}
            >
              {message.content}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Message;
