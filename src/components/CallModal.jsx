import { useEffect, useRef } from "react";
import clsx from "clsx";
import { Phone, PhoneOff, Video, VideoOff, X } from "lucide-react";

const CallModal = ({
  callState,
  localStream,
  remoteStream,
  callerInfo,
  isVideo,
  onAnswer,
  onReject,
  onEndCall,
  onCancelCall,
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!callState || callState === "idle") return null;

  return (
    <div className="call-modal-overlay fixed inset-0 z-[9999] bg-[rgba(15,23,42,0.92)] backdrop-blur-md flex items-center justify-center">
      <div className="call-modal w-full max-w-[420px] bg-gradient-to-b from-[#1e293b] to-[#0f172a] rounded-2xl p-9 text-center text-white relative shadow-[0_20px_60px_rgba(0,0,0,0.6),_0_0_40px_rgba(79,70,229,0.15)] border border-white/6">
        {/* Avatar / Name */}
        <div className="mb-6">
          {callerInfo?.avatar ? (
            <img
              src={callerInfo.avatar}
              alt=""
              className="w-[88px] h-[88px] rounded-full border-[3px] border-primary-light/50 object-cover mb-3 shadow-[0_0_30px_rgba(99,102,241,0.2)] mx-auto"
            />
          ) : (
            <div className="w-[88px] h-[88px] rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-4xl font-bold mx-auto mb-3 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
              {callerInfo?.username?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <h2 className="text-2xl font-bold mb-1 tracking-tight">
            {callerInfo?.username || "Unknown"}
          </h2>
          <p className="text-text-muted text-sm">
            {callState === "incoming"
              ? isVideo
                ? "Incoming video call..."
                : "Incoming audio call..."
              : callState === "calling"
                ? "Calling..."
                : callState === "connected"
                  ? isVideo
                    ? "Video call"
                    : "Audio call"
                  : ""}
          </p>
        </div>

        {/* Remote video (active call) */}
        {callState === "connected" && remoteStream && (
          <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-black mb-4 border border-white/6">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Local PIP */}
            {localStream && (
              <div className="absolute bottom-3 right-3 w-[30%] aspect-square rounded-[10px] overflow-hidden border-2 border-white/20 bg-black shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        )}

        {/* Audio-only animation */}
        {callState === "connected" && !isVideo && (
          <div className="w-full h-20 rounded-lg bg-primary-light/8 mb-4 flex items-center justify-center gap-1 border border-white/4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="audio-bar w-[6px] bg-gradient-to-t from-primary to-primary-light rounded-[3px] animate-audio-bounce"
                style={{
                  height: 30 + Math.random() * 30,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Buttons */}
        <div
          className={clsx(
            "flex justify-center gap-5",
            callState === "connected" ? "mt-0" : "mt-2"
          )}
        >
          {callState === "incoming" && (
            <>
              <button
                onClick={onReject}
                className="w-16 h-16 rounded-full border-none bg-gradient-to-br from-call-red to-red-600 text-white cursor-pointer flex items-center justify-center transition-all duration-200 shadow-[0_6px_20px_rgba(239,68,68,0.4)] hover:scale-105 hover:shadow-[0_8px_28px_rgba(239,68,68,0.5)]"
              >
                <PhoneOff size={26} />
              </button>
              <button
                onClick={onAnswer}
                className="w-16 h-16 rounded-full border-none bg-gradient-to-br from-call-green to-green-600 text-white cursor-pointer flex items-center justify-center transition-all duration-200 shadow-[0_6px_20px_rgba(34,197,94,0.4)] hover:scale-105 hover:shadow-[0_8px_28px_rgba(34,197,94,0.5)]"
              >
                {isVideo ? <Video size={26} /> : <Phone size={26} />}
              </button>
            </>
          )}

          {callState === "calling" && (
            <button
              onClick={onCancelCall}
              className="w-16 h-16 rounded-full border-none bg-gradient-to-br from-call-red to-red-600 text-white cursor-pointer flex items-center justify-center transition-all duration-200 shadow-[0_6px_20px_rgba(239,68,68,0.4)] hover:scale-105 hover:shadow-[0_8px_28px_rgba(239,68,68,0.5)]"
            >
              <PhoneOff size={26} />
            </button>
          )}

          {callState === "connected" && (
            <button
              onClick={onEndCall}
              className="w-16 h-16 rounded-full border-none bg-gradient-to-br from-call-red to-red-600 text-white cursor-pointer flex items-center justify-center transition-all duration-200 shadow-[0_6px_20px_rgba(239,68,68,0.4)] hover:scale-105 hover:shadow-[0_8px_28px_rgba(239,68,68,0.5)]"
            >
              <PhoneOff size={26} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallModal;
