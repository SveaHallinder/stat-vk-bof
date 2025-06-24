import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal = ({ open, onClose, children }: ModalProps) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-lg max-w-md w-full relative"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}; 