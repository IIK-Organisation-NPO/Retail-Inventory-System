import { useEffect, useRef, useState } from "react";
import "../../Style/Store Owner/StoreOwner_ExportReportPopup.css";

const StoreOwner_ExportReportPopup = ({ reportName, periodLabel, onDownload, onClose }) => {
  const [fileType, setFileType] = useState("pdf");
  const [includeGraphs, setIncludeGraphs] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const popupRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    const handlePointerDown = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [onClose]);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError("");
    try {
      await onDownload({ fileType, includeGraphs });
      onClose();
    } catch (downloadError) {
      console.error("Report export failed:", downloadError);
      setError("The export failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section
      ref={popupRef}
      className="export-report-popup"
      role="dialog"
      aria-modal="false"
      aria-labelledby="export-report-title"
    >
        <header className="export-report-header">
          <h2 id="export-report-title">Export report</h2>
          <button type="button" className="export-report-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </header>

        <p className="export-report-description">{reportName} report, {periodLabel.toLowerCase()}</p>

        <fieldset className="export-report-types">
          <legend>File type</legend>
          <div className="export-report-type-options">
            <button
              type="button"
              className={fileType === "pdf" ? "selected" : ""}
              aria-pressed={fileType === "pdf"}
              onClick={() => setFileType("pdf")}
            >
              PDF
            </button>
            <button
              type="button"
              className={fileType === "excel" ? "selected" : ""}
              aria-pressed={fileType === "excel"}
              onClick={() => setFileType("excel")}
            >
              Excel
            </button>
          </div>
        </fieldset>

        {fileType === "pdf" && (
          <label className="export-report-graphs">
            <input
              type="checkbox"
              checked={includeGraphs}
              onChange={(event) => setIncludeGraphs(event.target.checked)}
            />
            <span>Include the graphs (PDF only)</span>
          </label>
        )}

        <p className="export-report-notice">The file is saved on your device.</p>
        {error && <p className="export-report-error" role="alert">{error}</p>}

        <footer className="export-report-actions">
          <button
            type="button"
            className="export-report-download"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? "Preparing…" : "Download"}
          </button>
          <button type="button" className="export-report-cancel" onClick={onClose}>
            Cancel
          </button>
        </footer>
    </section>
  );
};

export default StoreOwner_ExportReportPopup;
