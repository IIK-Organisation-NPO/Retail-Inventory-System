import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Style/Admin/AdminUserMenu.css";

const AdminUserMenu = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="admin-user-menu" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        className="admin-user-menu-trigger"
        aria-label="Administrator menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        IA
      </button>

      {isOpen && (
        <div className="admin-user-menu-panel" role="menu" aria-label="Administrator menu">
          <div className="admin-user-menu-identity">
            <strong>IIK Administrator</strong>
            <span>Administrator</span>
          </div>
          <Link className="admin-user-menu-item" role="menuitem" to="/admin/profile" onClick={closeMenu}>
            <strong>Profile</strong>
            <span>Your details and password</span>
          </Link>
          <Link className="admin-user-menu-item" role="menuitem" to="/admin/settings" onClick={closeMenu}>
            <strong>Settings</strong>
            <span>Notification preferences</span>
          </Link>
          <button
            type="button"
            className="admin-user-menu-item admin-user-menu-signout"
            role="menuitem"
            onClick={() => {
              closeMenu();
              navigate("/login");
            }}
          >
            <strong>Sign out</strong>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUserMenu;
