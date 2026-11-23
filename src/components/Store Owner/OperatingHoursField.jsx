import "./OperatingHoursField.css";

const DAYS_OF_WEEK = [
  { value: "Monday", label: "Mon" },
  { value: "Tuesday", label: "Tue" },
  { value: "Wednesday", label: "Wed" },
  { value: "Thursday", label: "Thu" },
  { value: "Friday", label: "Fri" },
  { value: "Saturday", label: "Sat" },
  { value: "Sunday", label: "Sun" },
];

const TIMES = Array.from({ length: 48 }, (_, index) => {
  const hour = String(Math.floor(index / 2)).padStart(2, "0");
  const minute = index % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

const OperatingHoursField = ({ value, onChange, error }) => {
  const fromDayIndex = DAYS_OF_WEEK.findIndex(({ value: day }) => day === value.fromDay);
  const openTime = value.openTime ?? "";
  const closeTime = value.closeTime ?? "";

  const updateValue = (updates) => onChange({ ...value, ...updates });

  return (
    <fieldset className="operating-hours-field">
      <legend>Operating hours *</legend>
      <p className="operating-hours-hint">Choose a day range and one time range for those days.</p>
      <div className="operating-hours-range">
        <label>
          From day
          <select
            className="form-input select-input"
            value={value.fromDay ?? ""}
            onChange={(event) => {
              const fromDay = event.target.value;
              const toDayIndex = DAYS_OF_WEEK.findIndex(({ value: day }) => day === value.toDay);
              updateValue({
                fromDay,
                toDay: toDayIndex >= DAYS_OF_WEEK.findIndex(({ value: day }) => day === fromDay)
                  ? value.toDay
                  : "",
              });
            }}
            required
          >
            <option value="" disabled>Select day</option>
            {DAYS_OF_WEEK.map(({ value: day, label }) => (
              <option key={day} value={day}>{label}</option>
            ))}
          </select>
        </label>
        <span aria-hidden="true">to</span>
        <label>
          To day
          <select
            className="form-input select-input"
            value={value.toDay ?? ""}
            onChange={(event) => updateValue({ toDay: event.target.value })}
            disabled={!value.fromDay}
            required
          >
            <option value="" disabled>Select day</option>
            {DAYS_OF_WEEK.slice(Math.max(fromDayIndex, 0)).map(({ value: day, label }) => (
              <option key={day} value={day}>{label}</option>
            ))}
          </select>
        </label>
      </div>
      {value.fromDay && value.toDay && (
        <div className="operating-hours-range operating-time-range">
          <label>
            Opening time
            <select
              className="form-input select-input"
              value={openTime}
              onChange={(event) => {
                const nextOpenTime = event.target.value;
                updateValue({
                  openTime: nextOpenTime,
                  closeTime: closeTime > nextOpenTime ? closeTime : "",
                });
              }}
              required
            >
              <option value="" disabled>Select time</option>
              {TIMES.map((time) => <option key={time}>{time}</option>)}
            </select>
          </label>
          <span aria-hidden="true">to</span>
          <label>
            Closing time
            <select
              className="form-input select-input"
              value={closeTime}
              onChange={(event) => updateValue({ closeTime: event.target.value })}
              required
            >
              <option value="" disabled>Select time</option>
              {TIMES.filter((time) => !openTime || time > openTime).map((time) => (
                <option key={time}>{time}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      {error && <span className="operating-hours-error" role="alert">{error}</span>}
    </fieldset>
  );
};

export default OperatingHoursField;
