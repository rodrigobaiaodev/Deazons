
import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface TrailerModalProps {
  videoKey: string;
  title: string;
  onClose: () => void;
}

const TrailerModal = ({ videoKey, title, onClose }: TrailerModalProps) => {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    // Prevent background scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      {/* Modal container */}
      <div
        className="relative z-10 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-black/90 px-5 py-3">
          <span className="text-sm font-semibold text-white/80 truncate pr-4">{title}</span>
          <button
            onClick={onClose}
            aria-label="Fechar trailer"
            className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 hover:bg-primary hover:text-white transition-all flex items-center justify-center text-white/70"
          >
            <X size={16} />
          </button>
        </div>

        {/* Video iframe */}
        <div className="aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;
