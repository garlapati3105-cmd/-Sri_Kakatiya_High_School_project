// ============================================================
//  Sri Kakatiya School Management Platform – student/notifications.js
//  Notification Center and Notices Feed Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // Only run if user is student
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') return;

    loadNotifications();

    // Listen to data syncs to update notification feed
    window.addEventListener('skhs_db_synced', loadNotifications);

    // Filter Listeners
    const searchInput = document.getElementById('notification-search');
    const priorityFilter = document.getElementById('notification-priority');

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (priorityFilter) priorityFilter.addEventListener('change', applyFilters);
  });

  function loadNotifications() {
    applyFilters();
  }

  function applyFilters() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const feedList = document.getElementById('notifications-feed-list');
    if (!feedList) return;

    const searchVal = (document.getElementById('notification-search')?.value || '').toLowerCase().trim();
    const priorityVal = document.getElementById('notification-priority')?.value || 'all';

    // FIX: use camelCase 'userId'
    let ntfs = window.skhs_db.find('notifications', 'userId', currentUser.userId || currentUser.id);

    // Apply Filter Criteria
    if (priorityVal !== 'all') {
      ntfs = ntfs.filter(n => n.type === priorityVal);
    }
    if (searchVal !== '') {
      ntfs = ntfs.filter(n => n.title.toLowerCase().includes(searchVal) || (n.message && n.message.toLowerCase().includes(searchVal)));
    }

    // Sort by created timestamp descending
    ntfs.sort((a, b) => (b.createdAt || b.created_at || 0) - (a.createdAt || a.created_at || 0));

    // Render using skhs_dom
    window.skhs_dom.renderNotifications(feedList, ntfs, markNotificationRead, { colorByType: true });
  }

  async function markNotificationRead(id) {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    // FIX: use camelCase 'notificationId'
    const notification = window.skhs_db.findOne('notifications', 'notificationId', id)
                      || window.skhs_db.findOne('notifications', 'notification_id', id);
    if (!notification || (notification.userId || notification.user_id) !== (currentUser.userId || currentUser.id)) return;

    // Update in database
    // FIX: use camelCase 'notificationId' and 'isRead'
    const res = await window.skhs_db.update('notifications', 'notificationId', id, { isRead: true });
    if (res) {
      // Re-trigger load
      loadNotifications();
      // Dispatch sync event or global event to update KPI stats on dashboard
      window.dispatchEvent(new Event('skhs_db_synced'));
    }
  }
})();
