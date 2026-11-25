// src/pages/Store Owner/StoreOwner_Staff.jsx
import { useCallback, useEffect, useState } from "react";
import "../../Style/Store Owner/StoreOwnerInventory.css";
import "../../Style/Store Owner/StoreOwner_Staff.css";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import StoreOwner_AddStaff_popup from "../../components/Store Owner/StoreOwner_AddStaff_popup";
import StoreOwner_ConfirmModal from "../../components/Store Owner/StoreOwner_ConfirmModal";
import { STORES } from "../../data/stores";

const TOAST_MS = 3000;

// "0820000011" -> "082 000 0011"
const formatMobile = (digits) => {
  if (!digits) return "N/A";
  const clean = digits.replace(/\D/g, "");
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
};

const fullName = (s) => `${s.name} ${s.surname}`;

const StoreOwner_Staff = () => {
  // --- State ---
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [storeId, setStoreId] = useState(() => localStorage.getItem("activeStoreId") || 1);
  const [popup, setPopup] = useState(null); // { mode: "add" } | { mode: "edit", member }
  const [confirm, setConfirm] = useState(null); // { member, action: "disable" | "enable" }
  const [toast, setToast] = useState("");

  const token = localStorage.getItem("token");

  // --- 1. FETCH STAFF FROM BACKEND ---
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/staff?storeId=${storeId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load staff");

      const formatted = data.map((s) => ({
        id: s.id,
        name: s.name,
        surname: s.surname,
        email: s.email,
        mobile: s.mobile,
        role: s.role,
        status: s.IsActive ? "Active" : "Disabled", 
        storeId: storeId 
      }));

      setStaff(formatted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [storeId]);

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

  // --- 2. HANDLE ADD / EDIT STAFF ---
  const handleSave = async (member) => {
    try {
      let response;
      
      const payload = {
        storeId: storeId,
        name: member.name,
        surname: member.surname,
        email: member.email,
        mobile: member.mobile,
        gender: member.gender,
        hasDisability: member.hasDisability,
        disabilityType: member.disabilityType,
        role: member.role,
        password: member.code 
      };

      if (member.id) {
        // Edit existing staff
        response = await fetch(`http://localhost:5000/api/staff/${member.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Add new staff
        response = await fetch("http://localhost:5000/api/staff", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();
      
      // CRITICAL FIX: Throw the error back to the popup
      if (!response.ok) {
        const err = new Error(data.message || "Failed to save staff");
        err.field = data.field; // Pass the field name ("email" or "mobile")
        throw err;
      }

      setToast(member.id ? `${fullName(member)}'s details were updated.` : `${fullName(member)} was added.`);
      closePopup();
      fetchStaff(); 

    } catch (err) {
      // Re-throw so the popup's catch block can handle it and show the red text
      throw err;
    }
  };

  // --- 3. HANDLE DISABLE / ENABLE ---
  const handleConfirm = async () => {
    const { member, action } = confirm;
    const isActive = action === "enable";

    try {
      const response = await fetch(`http://localhost:5000/api/staff/${member.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ isActive, storeId }) 
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update status");

      setToast(`${fullName(member)} was ${action}d successfully.`);
      closeConfirm();
      fetchStaff(); 

    } catch (err) {
      alert(err.message);
      closeConfirm();
    }
  };

  if (loading && staff.length === 0) return <div style={{ padding: '50px' }}>Loading staff...</div>;

  return (
    <div className="so-layout">
      <StoreOwnerSidebar notificationCount={3} />

      <main className="so-main">
        {/* Page header */}
        <header className="so-header">
          <h1 className="so-page-title">Staff</h1>

          <div className="so-header-actions">
            <StoreOwner_StoreSwitcher key={storeId} onChange={(store) => setStoreId(store.id)} />
            <button type="button" className="so-btn so-btn-primary" onClick={() => setPopup({ mode: "add" })}>
              Add staff
            </button>
            <StoreOwner_UserMenu />
          </div>
        </header>

        {error && (
          <div style={{ color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
            {error}
          </div>
        )}

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
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="st-empty" style={{ textAlign: "center", padding: "20px" }}>
                      No staff at this store yet. Use <strong>Add staff</strong> to add someone.
                    </td>
                  </tr>
                ) : (
                  staff.map((member) => {
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
                            >
                              Edit
                            </button>
                            {isActive ? (
                              <button
                                type="button"
                                className="st-btn st-btn-disable"
                                onClick={() => setConfirm({ member, action: "disable" })}
                              >
                                Disable
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="st-btn st-btn-enable"
                                onClick={() => setConfirm({ member, action: "enable" })}
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

      {/* ADD / EDIT STAFF POPUP */}
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

      {/* DISABLE / ENABLE CONFIRMATION */}
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