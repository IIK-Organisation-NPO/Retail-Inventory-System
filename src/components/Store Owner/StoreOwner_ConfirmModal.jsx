// src/components/Store Owner/StoreOwner_ConfirmModal.jsx
// Reusable "Are you sure?" confirmation popup
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../../Style/Store Owner/StoreOwner_ConfirmModal.css";

/**
 * variant:      "danger" (red, e.g. disable) or "primary" (blue, e.g. enable)
 * title:        "Disable staff member?"
 * question:     "Are you sure you want to disable Lindiwe Ngcobo?"
 * message:      extra explanation shown in the coloured box
 * confirmLabel: "Yes, disable"
 */
const StoreOwner_ConfirmModal = ({
  variant = "danger",
  title,
  question,
  message,
  confirmLabel = "Yes, continue",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) => {
  const cancelRef = useRef(null);

  // Focus "Cancel" (the safe choice), close on Escape, stop the page scrolling
  useEffect(() => {
    cancelRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);

  return createPortal(
    <div
      className="cm-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className={`cm-modal cm-${variant}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cm-title"
        aria-describedby="cm-question"
      >
        {/* Icon */}
        <div className="cm-icon" aria-hidden="true">
          {variant === "danger" ? (
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path d="M12 8v5M12 16.5v.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="m8 12.5 2.7 2.7L16.5 9.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        <h2 id="cm-title" className="cm-title">{title}</h2>
        <p id="cm-question" className="cm-question">{question}</p>
        {message && <p className="cm-message">{message}</p>}

        <div className="cm-actions">
          <button ref={cancelRef} type="button" className="cm-btn cm-btn-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="cm-btn cm-btn-confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StoreOwner_ConfirmModal;
