// ============================================================
//  Sri Kakatiya School Management Platform – teacher/notifications.js
//  Teacher Circulars & Announcements Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'teacher') return;

    populateTargets();
    loadNotifications();
    setupListeners();

    window.addEventListener('skhs_db_synced', () => {
      populateTargets();
      loadNotifications();
    });
  });

  function populateTargets() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const teacher = window.skhs_db.findOne('teachers', 'userId', currentUser.userId || currentUser.id);
    if (!teacher) return;

    const targetSelect = document.getElementById('ntf-target-class');
    if (!targetSelect) return;

    const assignedClasses = Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses : [];
    targetSelect.innerHTML = '';
    assignedClasses.forEach(classId => {
      const classRecord = window.skhs_db.findOne('classes', 'classId', classId);
      const option = document.createElement('option');
      option.value = classId;
      option.textContent = classRecord ? classRecord.name : classId;
      targetSelect.appendChild(option);
    });
  }

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

  function setupListeners() {
    const form = document.getElementById('announcement-form');
    const alertContainer = document.getElementById('dashboard-alert-container');
    const showAlert = (msg, type) => window.skhs_dom.showAlert(alertContainer, msg, type, 4000);

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const classId = document.getElementById('ntf-target-class').value;
        const title = document.getElementById('ntf-title').value.trim();
        const message = document.getElementById('ntf-message').value.trim();

        const students = window.skhs_db.find('students', 'classId', classId);
        if (students.length === 0) {
          showAlert("No students registered in the target class to notify.", "error");
          return;
        }

        let sentCount = 0;
        for (const student of students) {
          if (student.userId) {
            await window.skhs_db.insert('notifications', {
              notificationId: window.createId('NTF'),
              userId: student.userId,
              title: title,
              message: message,
              type: 'info',
              isRead: false,
              createdAt: Date.now()
            });
            sentCount++;
          }
        }

        showAlert(`Notice broadcasted successfully to ${sentCount} students in class.`, "success");
        form.reset();
        window.dispatchEvent(new Event('skhs_db_synced'));
      });
    }
  }
})();
