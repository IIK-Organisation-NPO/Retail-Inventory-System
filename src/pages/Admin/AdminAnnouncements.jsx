import { useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminUserMenu from "../../components/Admin/AdminUserMenu";
import "../../Style/Admin/AdminAnnouncements.css";

const INITIAL_ANNOUNCEMENTS = [
  {
    id: 1,
    title: "Welcome to the pilot.",
    message: "Please record every sale.",
    audience: "All users",
    sent: "10 Nov, 09:00",
    showInApp: true,
    sendByEmail: false,
  },
];

const AUDIENCES = ["All users", "Store owners", "Store staff", "Suppliers"];

const EMPTY_FORM = {
  title: "",
  message: "",
  audience: "All users",
  showInApp: true,
  sendByEmail: false,
};

const formatSentTime = () => {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(now);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);

  return `${date}, ${time}`;
};

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");

  const openModal = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  const sendAnnouncement = (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setFormError("Enter both a title and a message.");
      return;
    }
    if (!form.showInApp && !form.sendByEmail) {
      setFormError("Choose at least one delivery method.");
      return;
    }

    setAnnouncements((current) => [
      {
        id: Date.now(),
        ...form,
        title: form.title.trim(),
        message: form.message.trim(),
        sent: formatSentTime(),
      },
      ...current,
    ]);
    setFeedback("Announcement sent.");
    closeModal();
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError("");
  };

  return (
    <div className="admin-announcements-layout">
      <AdminSidebar />

      <main className="admin-announcements-main">
        <header className="admin-announcements-header">
          <h1>Announcements</h1>
          <div className="admin-announcements-header-actions">
            <button type="button" className="admin-announcements-new" onClick={openModal}>
              New announcement
            </button>
            <AdminUserMenu />
          </div>
        </header>

        {feedback && (
          <p className="admin-announcements-feedback" role="status">{feedback}</p>
        )}

        <section className="admin-announcements-card">
          <h2>Sent announcements</h2>
          <div className="admin-announcements-table-scroll">
            <table className="admin-announcements-table">
              <thead>
                <tr>
                  <th scope="col">Message</th>
                  <th scope="col">Audience</th>
                  <th scope="col">Sent</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((announcement) => (
                  <tr key={announcement.id}>
                    <td>
                      <strong>{announcement.title}</strong>{" "}
                      {announcement.message}
                    </td>
                    <td>{announcement.audience}</td>
                    <td>{announcement.sent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="admin-announcements-note">
            In-app announcements appear in users’ Notifications and Alerts.
          </p>
        </section>
      </main>

      {isModalOpen && (
        <div
          className="admin-announcements-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <form
            className="admin-announcements-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-announcements-modal-title"
            onSubmit={sendAnnouncement}
          >
            <header className="admin-announcements-modal-header">
              <h2 id="admin-announcements-modal-title">New announcement</h2>
              <button
                type="button"
                className="admin-announcements-close"
                aria-label="Close"
                onClick={closeModal}
              >
                ×
              </button>
            </header>

            <label className="admin-announcements-field">
              <span>Title</span>
              <input
                required
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
              />
            </label>

            <label className="admin-announcements-field">
              <span>Message</span>
              <textarea
                required
                value={form.message}
                onChange={(event) => updateForm("message", event.target.value)}
              />
            </label>

            <label className="admin-announcements-field">
              <span>Send to</span>
              <select
                value={form.audience}
                onChange={(event) => updateForm("audience", event.target.value)}
              >
                {AUDIENCES.map((audience) => <option key={audience}>{audience}</option>)}
              </select>
            </label>

            <label className="admin-announcements-checkbox">
              <input
                type="checkbox"
                checked={form.showInApp}
                onChange={(event) => updateForm("showInApp", event.target.checked)}
              />
              <span>Show in the app</span>
            </label>

            <label className="admin-announcements-checkbox">
              <input
                type="checkbox"
                checked={form.sendByEmail}
                onChange={(event) => updateForm("sendByEmail", event.target.checked)}
              />
              <span>Also send by email</span>
            </label>

            {formError && <p className="admin-announcements-error" role="alert">{formError}</p>}

            <div className="admin-announcements-modal-actions">
              <button type="submit" className="admin-announcements-send">
                Send announcement
              </button>
              <button type="button" className="admin-announcements-cancel" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;