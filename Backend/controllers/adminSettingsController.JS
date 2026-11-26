// Backend/controllers/adminSettingsController.js
//
// Notification preferences are stored in the EXISTING `notifications` table (no database changes).
// Each saved choice is one row per admin per event:
//   Admin_id         = the admin
//   NotificationType = 'SETTING:<EVENT_KEY>'   (e.g. SETTING:SYNC_PROBLEMS)
//   Title            = 'Notification setting'
//   Message          = JSON, e.g. {"inApp":true,"email":false}
//   IsRead           = 1  (so it is never counted as unread)
//
// IMPORTANT: every query that lists or counts an admin's notifications must exclude these rows:
//   AND NotificationType NOT LIKE 'SETTING:%'
const db = require('../config/db');

// Works whether config/db exports a callback pool or a promise pool
const pool = typeof db.promise === 'function' ? db.promise() : db;

const SETTING_PREFIX = 'SETTING:';

// The events an admin can choose notifications for.
// emailAvailable: false means the event can only be shown in the app.
const EVENTS = [
  { key: 'NEW_STORE_APPLICATION', label: 'New store application', emailAvailable: true, defaults: { inApp: true, email: true } },
  { key: 'NEW_SUPPLIER_APPLICATION', label: 'New supplier application', emailAvailable: true, defaults: { inApp: true, email: true } },
  { key: 'SYNC_PROBLEMS', label: 'Sync problems', emailAvailable: true, defaults: { inApp: true, email: false } },
  { key: 'SYSTEM_ANNOUNCEMENTS', label: 'System announcements sent', emailAvailable: false, defaults: { inApp: true, email: false } },
];

const loadPreferences = async (adminId) => {
  const [rows] = await pool.query(
    'SELECT NotificationType, Message FROM notifications WHERE Admin_id = ? AND NotificationType LIKE ?',
    [adminId, `${SETTING_PREFIX}%`]
  );

  const saved = {};
  rows.forEach((row) => {
    try {
      const value = JSON.parse(row.Message);
      saved[row.NotificationType.slice(SETTING_PREFIX.length)] = {
        inApp: !!value.inApp,
        email: !!value.email,
      };
    } catch {
      // Unreadable row: ignore it and fall back to the default for that event
    }
  });

  return EVENTS.map((event) => {
    const choice = saved[event.key] || event.defaults;
    return {
      key: event.key,
      event: event.label,
      inApp: choice.inApp,
      email: event.emailAvailable ? choice.email : null,
    };
  });
};

// GET /api/admin/settings/notifications
const getNotificationPreferences = async (req, res) => {
  try {
    const preferences = await loadPreferences(req.user.id);
    return res.json({ preferences });
  } catch (err) {
    console.error('getNotificationPreferences error:', err);
    return res.status(500).json({ message: 'Could not load your settings.' });
  }
};

// PUT /api/admin/settings/notifications
// Body: { preferences: [{ key, inApp, email }] }
const saveNotificationPreferences = async (req, res) => {
  try {
    const { preferences } = req.body;

    if (!Array.isArray(preferences) || preferences.length === 0) {
      return res.status(400).json({ message: 'No preferences were sent.' });
    }

    const choices = [];
    const seen = new Set();

    for (const item of preferences) {
      const event = EVENTS.find((e) => e.key === item.key);
      if (!event) {
        return res.status(400).json({ message: `Unknown notification event: ${item.key}` });
      }
      if (seen.has(item.key)) {
        return res.status(400).json({ message: `Duplicate notification event: ${item.key}` });
      }
      seen.add(item.key);

      if (typeof item.inApp !== 'boolean') {
        return res.status(400).json({ message: `Choose On or Off for "${event.label}" in the app.` });
      }
      if (event.emailAvailable && typeof item.email !== 'boolean') {
        return res.status(400).json({ message: `Choose On or Off for "${event.label}" by email.` });
      }

      choices.push({
        type: `${SETTING_PREFIX}${event.key}`,
        message: JSON.stringify({
          inApp: item.inApp,
          email: event.emailAvailable ? item.email : false,
        }),
      });
    }

    for (const choice of choices) {
      const [existing] = await pool.query(
        'SELECT Notification_id FROM notifications WHERE Admin_id = ? AND NotificationType = ? ORDER BY Notification_id LIMIT 1',
        [req.user.id, choice.type]
      );

      if (existing.length > 0) {
        await pool.query(
          'UPDATE notifications SET Message = ?, IsRead = 1 WHERE Notification_id = ?',
          [choice.message, existing[0].Notification_id]
        );
      } else {
        await pool.query(
          `INSERT INTO notifications (Admin_id, Title, Message, NotificationType, IsRead)
           VALUES (?, 'Notification setting', ?, ?, 1)`,
          [req.user.id, choice.message, choice.type]
        );
      }
    }

    const saved = await loadPreferences(req.user.id);
    return res.json({ message: 'Preferences saved.', preferences: saved });
  } catch (err) {
    console.error('saveNotificationPreferences error:', err);
    return res.status(500).json({ message: 'Could not save your settings.' });
  }
};

module.exports = { getNotificationPreferences, saveNotificationPreferences, SETTING_PREFIX };