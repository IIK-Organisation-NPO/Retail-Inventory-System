import { PopupShell } from "../Store Owner/StoreOwner_StockIn_popup";
import formatRand from "../../utils/formatRand";
import "../../Style/Staff/StaffSaleRecordedPopup.css";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatRecordedAt = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const StaffSaleRecordedPopup = ({ sale, onClose, onNewSale }) => (
  <PopupShell title="Sale recorded" onClose={onClose}>
    <div className="staff-sale-recorded">
      <div className="staff-sale-recorded-check" aria-label="Sale successful" role="img">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m5 12 4.5 4.5L19 7" />
        </svg>
      </div>

      <p className="staff-sale-recorded-date">{formatRecordedAt(sale.recordedAt)}</p>

      <div className="staff-sale-recorded-summary">
        <div>
          <span>Total</span>
          <strong>{formatRand(sale.total)}</strong>
        </div>
        {sale.payment === "Cash" ? (
          <>
            <div>
              <span>Cash received</span>
              <strong>{formatRand(sale.received)}</strong>
            </div>
            <div>
              <span>Change</span>
              <strong>{formatRand(sale.change)}</strong>
            </div>
          </>
        ) : (
          <div>
            <span>Payment</span>
            <strong>{sale.payment}</strong>
          </div>
        )}
      </div>

      <p className="staff-sale-recorded-stock">
        Stock updated: {sale.stockUpdated.map(({ product, onHand }) => `${product} ${onHand}`).join(", ")}.
      </p>

      <button type="button" className="staff-sale-recorded-new" onClick={onNewSale}>
        New sale
      </button>
    </div>
  </PopupShell>
);

export default StaffSaleRecordedPopup;
