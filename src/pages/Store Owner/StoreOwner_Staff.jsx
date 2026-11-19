// src/pages/Store Owner/StoreOwner_Staff.jsx
import { useCallback, useEffect, useState } from "react";
import "../../Style/Store Owner/StoreOwnerInventory.css";
import "../../Style/Store Owner/StoreOwner_Staff.css";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import StoreOwner_AddStaff_popup from "../../components/Store Owner/StoreOwner_AddStaff_popup";
import StoreOwner_ConfirmModal from "../../components/Store Owner/StoreOwner_ConfirmModal";
import { STORES, readSavedStoreId, saveStoreId } from "../../data/stores";

// Mock data — replace with API data once the backend is connected
const STAFF = [
  { id: 1, name: "Lindiwe", surname: "Ngcobo", email: "", mobile: "0820000011", gender: "female", hasDisability: false, disabilityType: "", role: "Cashier", storeId: "mseleku", status: "Active" },
  { id: 2, name: "Bheki", surname: "Sithole", email: "", mobile: "0820000012", gender: "male", hasDisability: false, disabilityType: "", role: "Cashier", storeId: "mseleku", status: "Active" },
  { id: 3, name: "Zanele", surname: "Cele", email: "", mobile: "0820000013", gender: "female", hasDisability: false, disabilityType: "", role: "Stock clerk", storeId: "mseleku", status: "Disabled" },
  { id: 4, name: "Thabo", surname: "Mkhize", email: "", mobile: "0820000014", gender: "male", hasDisability: false, disabilityType: "", role: "Cashier", storeId: "ezakheni", status: "Active" },
];

const TOAST_MS = 3000;

// "0820000011" -> "082 000 0011"
const formatMobile = (digits) => `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;

const fullName = (s) => `${s.name} ${s.surname}`;

const StoreOwner_Staff = () => {
  const [staff, setStaff] = useState(STAFF);
  const [storeId, setStoreId] = useState(() => readSavedStoreId());
  const [popup, setPopup] = useState(null); // { mode: "add" } | { mode: "edit", member }
  const [confirm, setConfirm] = useState(null); // { member, action: "disable" | "enable" }
  const [toast, setToast] = useState("");

  const storeStaff = staff.filter((s) => s.storeId === storeId);

  // Hide the success message after a few seconds
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const closePopup = useCallback(() => setPopup(null), []);
  const closeConfirm = useCallback(() => setConfirm(null), []);

  const isMobileTaken = (mobile, staffId) =>
    staff.some((s) => s.mobile === mobile && s.id !== staffId);

  const handleSave = (member) => {
    if (member.id) {
      setStaff((current) => current.map((s) => (s.id === member.id ? member : s)));
      setToast(`${fullName(member)}'s details were updated.`);
    } else {
      setStaff((current) => [...current, { ...member, id: Date.now(), status: "Active" }]);
      setToast(`${fullName(member)} was added as a ${member.role.toLowerCase()}.`);
    }
    // Show the store the staff member was saved to
    if (member.storeId !== storeId) {
      saveStoreId(member.storeId);
      setStoreId(member.storeId);
    }
  };

  const handleConfirm = () => {
    const { member, action } = confirm;
    const status = action === "disable" ? "Disabled" : "Active";
    // TODO: update the staff member's status with the API
    setStaff((current) => current.map((s) => (s.id === member.id ? { ...s, status } : s)));
    setToast(`${fullName(member)} was ${action === "disable" ? "disabled" : "enabled"}.`);
    setConfirm(null);
  };

  return (
    <div className="so-layout">
      {/* =========================================
          SIDEBAR
          ========================================= */}
      <StoreOwnerSidebar notificationCount={3} />

      {/* =========================================
          MAIN CONTENT
          ========================================= */}
      <main className="so-main">
        {/* Page header: title, store selector, add staff, user menu */}
        <header className="so-header">
          <h1 className="so-page-title">Staff</h1>

          <div className="so-header-actions">
            {/* key makes the switcher show the store chosen after saving */}
            <StoreOwner_StoreSwitcher key={storeId} onChange={(store) => setStoreId(store.id)} />
            <button type="button" className="so-btn so-btn-primary" onClick={() => setPopup({ mode: "add" })}>
              Add staff
            </button>
            <StoreOwner_UserMenu />
          </div>
        </header>

        {/* Store staff table */}
        <section className="so-card st-card">
          <div className="so-card-header">
            <h2 className="so-card-title">Store staff</h2>
          </div>

          <div className="so-table-wrapper">
            <table className="so-table st-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Mobile</th>
                  <th>Status</th>
                  <th><span className="st-visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {storeStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="st-empty">
                      No staff at this store yet. Use <strong>Add staff</strong> to add someone.
                    </td>
                  </tr>
                ) : (
                  storeStaff.map((member) => {
                    const isActive = member.status === "Active";
                    return (
                      <tr key={member.id}>
                        <td>{fullName(member)}</td>
                        <td>{member.role}</td>
                        <td>{formatMobile(member.mobile)}</td>
                        <td>
                          <span className={`st-status ${isActive ? "st-status-active" : "st-status-disabled"}`}>
                            {member.status}
                          </span>
                        </td>
                        <td>
                          <div className="st-actions">
                            <button
                              type="button"
                              className="st-btn st-btn-edit"
                              onClick={() => setPopup({ mode: "edit", member })}
                              aria-label={`Edit ${fullName(member)}`}
                            >
                              Edit
                            </button>
                            {isActive ? (
                              <button
                                type="button"
                                className="st-btn st-btn-disable"
                                onClick={() => setConfirm({ member, action: "disable" })}
                                aria-label={`Disable ${fullName(member)}`}
                              >
                                Disable
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="st-btn st-btn-enable"
                                onClick={() => setConfirm({ member, action: "enable" })}
                                aria-label={`Enable ${fullName(member)}`}
                              >
                                Enable
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* =========================================
          ADD / EDIT STAFF POPUP
          ========================================= */}
      {popup && (
        <StoreOwner_AddStaff_popup
          stores={STORES}
          defaultStoreId={storeId}
          staffMember={popup.mode === "edit" ? popup.member : undefined}
          isMobileTaken={isMobileTaken}
          onSave={handleSave}
          onClose={closePopup}
        />
      )}

      {/* =========================================
          DISABLE / ENABLE CONFIRMATION
          ========================================= */}
      {confirm?.action === "disable" && (
        <StoreOwner_ConfirmModal
          variant="danger"
          title="Disable staff member?"
          question={<>Are you sure you want to disable <strong>{fullName(confirm.member)}</strong>?</>}
          message="They won't be able to sign in until you enable them again. Their past sales and stock movements stay in your records."
          confirmLabel="Yes, disable"
          onConfirm={handleConfirm}
          onCancel={closeConfirm}
        />
      )}

      {confirm?.action === "enable" && (
        <StoreOwner_ConfirmModal
          variant="primary"
          title="Enable staff member?"
          question={<>Are you sure you want to enable <strong>{fullName(confirm.member)}</strong>?</>}
          message="They will be able to sign in again with their 6-digit user code."
          confirmLabel="Yes, enable"
          onConfirm={handleConfirm}
          onCancel={closeConfirm}
        />
      )}

      {/* Success message */}
      {toast && (
        <div className="st-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
};

export default StoreOwner_Staff;
