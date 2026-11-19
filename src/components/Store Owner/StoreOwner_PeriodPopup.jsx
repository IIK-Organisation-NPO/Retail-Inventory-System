import { useEffect, useRef, useState } from "react";
import "../../Style/Store Owner/StoreOwner_PeriodPopup.css";

const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
];

const StoreOwner_PeriodPopup = ({
  value,
  buttonLabel,
  onApply,
  onClose,
  includeAllTime = false,
  customRange,
  defaultRange,
}) => {
  const [draft, setDraft] = useState(value || "7");
  const [draftFrom, setDraftFrom] = useState(customRange?.from || defaultRange?.from || "");
  const [draftTo, setDraftTo] = useState(customRange?.to || defaultRange?.to || "");
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    const handlePointerDown = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [onClose]);

  const options = includeAllTime
    ? [...PERIOD_OPTIONS.slice(0, 3), { value: "all", label: "All time" }, PERIOD_OPTIONS[3]]
    : PERIOD_OPTIONS;

  const handleApply = () => {
    if (draft === "custom" && (!draftFrom || !draftTo || draftFrom > draftTo)) return;
    onApply({
      value: draft,
      from: draft === "custom" ? draftFrom : null,
      to: draft === "custom" ? draftTo : null,
    });
  };

  const rangeIsInvalid =
    draft === "custom" && Boolean(draftFrom && draftTo && draftFrom > draftTo);

  return (
    <div
      ref={popoverRef}
      className="period-popover"
      role="dialog"
      aria-modal="false"
      aria-label="Choose a period"
    >
      <div className="period-modal-header">
        <h2 id="period-modal-title">Choose a period</h2>
      </div>

      <div className="period-options" role="radiogroup" aria-label="Period">
        {options.map((option) => (
          <label
            key={option.value}
            className={`period-option ${draft === option.value ? "selected" : ""}`}
          >
            <input
              type="radio"
              name="period"
              value={option.value}
              checked={draft === option.value}
              onChange={() => setDraft(option.value)}
            />
            <span className="period-radio" aria-hidden="true" />
            <span>{option.label}</span>
          </label>
        ))}
      </div>

      {draft === "custom" && (
        <div className="period-custom-range">
          <label>
            <span>From</span>
            <input
              type="date"
              value={draftFrom}
              max={draftTo || undefined}
              onChange={(event) => setDraftFrom(event.target.value)}
            />
          </label>
          <label>
            <span>To</span>
            <input
              type="date"
              value={draftTo}
              min={draftFrom || undefined}
              onChange={(event) => setDraftTo(event.target.value)}
            />
          </label>
        </div>
      )}

      {rangeIsInvalid && (
        <p className="period-range-error" role="alert">
          The end date must be on or after the start date.
        </p>
      )}

      <div className="period-modal-actions">
        <button
          type="button"
          className="period-apply"
          onClick={handleApply}
          disabled={draft === "custom" && (!draftFrom || !draftTo || rangeIsInvalid)}
        >
          Apply
        </button>
        <button type="button" className="period-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default StoreOwner_PeriodPopup;
