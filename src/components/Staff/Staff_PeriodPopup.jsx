// src/components/Staff/Staff_PeriodPopup.jsx
// "Choose a period" popup: Today / Last 7 days / Last 30 days / Custom range
import { useState } from "react";
import { PopupShell } from "./Staff_StockPopups";
import "../../Style/Staff/Staff_PeriodPopup.css";
import { PERIOD_OPTIONS, getPresetRange, formatFullDate } from "../../utils/salesPeriod";

// value: { type, from, to } — the period currently applied
// today: "YYYY-MM-DD" — latest date that can be chosen
const Staff_PeriodPopup = ({ value, today, onApply, onClose }) => {
  const [type, setType] = useState(value.type);
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);
  const [error, setError] = useState("");

  const isCustom = type === "custom";
  const range = isCustom ? { from: customFrom, to: customTo } : getPresetRange(type, today);

  const handleTypeChange = (newType) => {
    // Start a custom range from the dates currently shown
    if (newType === "custom" && !isCustom) {
      setCustomFrom(range.from);
      setCustomTo(range.to);
    }
    setType(newType);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isCustom) {
      if (!customFrom || !customTo) {
        setError("Choose a start and end date.");
        return;
      }
      if (customFrom > customTo) {
        setError("The From date must be on or before the To date.");
        return;
      }
    }
    onApply({ type, ...range });
    onClose();
  };

  return (
    <PopupShell title="Choose a period" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {/* Period choices */}
        <div className="stp-period-options" role="radiogroup" aria-label="Period">
          {PERIOD_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`stp-period-option${type === option.value ? " selected" : ""}`}
            >
              <input
                type="radio"
                name="staff-period"
                value={option.value}
                checked={type === option.value}
                onChange={() => handleTypeChange(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>

        {/* From / To — only editable for a custom range */}
        <div className="stp-row">
          <div className="stp-field">
            <label htmlFor="staff-period-from">From</label>
            {isCustom ? (
              <input
                id="staff-period-from"
                type="date"
                className="stp-input"
                value={customFrom}
                max={today}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            ) : (
              <input
                id="staff-period-from"
                type="text"
                className="stp-input stp-period-locked"
                value={formatFullDate(range.from)}
                disabled
              />
            )}
          </div>

          <div className="stp-field">
            <label htmlFor="staff-period-to">To</label>
            {isCustom ? (
              <input
                id="staff-period-to"
                type="date"
                className="stp-input"
                value={customTo}
                max={today}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            ) : (
              <input
                id="staff-period-to"
                type="text"
                className="stp-input stp-period-locked"
                value={formatFullDate(range.to)}
                disabled
              />
            )}
          </div>
        </div>

        {error && <p className="stp-error">{error}</p>}

        <div className="stp-actions">
          <button type="submit" className="stp-btn stp-btn-primary">Apply</button>
          <button type="button" className="stp-btn stp-btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </PopupShell>
  );
};

export default Staff_PeriodPopup;
