// ============================================================
//  Sri Kakatiya School Management Platform – parent/notifications.js
//  Parent Circulars & Notification Feed Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'parent') return;

    loadNotifications();
    window.addEventListener('skhs_db_synced', loadNotifications);
  });

  function loadNotifications() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const feedList = document.getElementById('notifications-feed-list');
    if (!feedList) return;

    const ntfs = window.skhs_db.find('notifications', 'userId', currentUser.userId || currentUser.id);
    ntfs.sort((a, b) => b.createdAt - a.createdAt);

    window.skhs_dom.renderNotifications(feedList, ntfs, markNotificationRead);
  }

  async function markNotificationRead(id) {
    const currentUser = window.skhs_auth.getCurrentUser();
    const notification = window.skhs_db.findOne('notifications', 'notificationId', id);
    if (!notification || notification.userId !== (currentUser.userId || currentUser.id)) return;
    await window.skhs_db.update('notifications', 'notificationId', id, { isRead: true });
    window.dispatchEvent(new Event('skhs_db_synced'));
  }
})();
