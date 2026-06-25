// ============================================================
//  Sri Kakatiya School Management Platform – teacher/reports.js
//  Teacher Reports Generator Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'teacher') return;

    populateParameters();
    setupListeners();

    window.addEventListener('skhs_db_synced', populateParameters);
  });

  function populateParameters() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const teacher = window.skhs_db.findOne('teachers', 'userId', currentUser.userId || currentUser.id);
    if (!teacher) return;

    const classSelect = document.getElementById('report-class');
    const subSelect = document.getElementById('report-subject');
    if (!classSelect || !subSelect) return;

    const assignedClasses = Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses : [];
    classSelect.innerHTML = '';
    assignedClasses.forEach(classId => {
      const classRecord = window.skhs_db.findOne('classes', 'classId', classId);
      const option = document.createElement('option');
      option.value = classId;
      option.textContent = classRecord ? classRecord.name : classId;
      classSelect.appendChild(option);
    });

    const subjects = window.skhs_db.find('subjects', 'teacherId', teacher.teacherId);
    subSelect.innerHTML = '';
    subjects.forEach(s => {
      const option = document.createElement('option');
      option.value = s.subjectId;
      option.textContent = s.name;
      subSelect.appendChild(option);
    });
  }

  function setupListeners() {
    const csvBtn = document.getElementById('btn-export-csv');
    const pdfBtn = document.getElementById('btn-export-pdf');
    const alertContainer = document.getElementById('dashboard-alert-container');
    const showAlert = (msg, type) => window.skhs_dom.showAlert(alertContainer, msg, type, 4000);

    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        const reportType = document.getElementById('report-type').value;
        const classId = document.getElementById('report-class').value;
        const subjectId = document.getElementById('report-subject').value;

        if (!reportType || !classId) {
          showAlert("Please configure export parameters.", "error");
          return;
        }

        const data = generateReportData(reportType, classId, subjectId);
        triggerDownload(data, `${reportType}_report_${classId}.csv`, 'text/csv');
        showAlert("CSV Report downloaded successfully!", "success");
      });
    }

    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => {
        const reportType = document.getElementById('report-type').value;
        const classId = document.getElementById('report-class').value;
        const subjectId = document.getElementById('report-subject').value;

        if (!reportType || !classId) {
          showAlert("Please configure export parameters.", "error");
          return;
        }

        // Simulating PDF binary download with a clean text report
        const data = generateReportData(reportType, classId, subjectId);
        triggerDownload(data, `${reportType}_report_${classId}.pdf`, 'application/pdf');
        showAlert("PDF Report downloaded successfully!", "success");
      });
    }
  }

  function generateReportData(type, classId, subjectId) {
    const students = window.skhs_db.find('students', 'classId', classId);
    const classRecord = window.skhs_db.findOne('classes', 'classId', classId);
    const className = classRecord ? classRecord.name : classId;
    
    let content = `SRI KAKATIYA HIGH SCHOOL REPORT\n`;
    content += `Class: ${className} | Date Generated: ${new Date().toLocaleDateString()}\n`;
    content += `===========================================\n\n`;

    if (type === 'attendance') {
      content += `Student Name, Roll Number, Present Days, Absent Days, Percentage\n`;
      const attRecords = window.skhs_db.getCollection('attendance');

      students.forEach(s => {
        const studentAtts = attRecords.filter(a => a.studentId === s.studentId);
        const presents = studentAtts.filter(a => a.status === 'Present').length;
        const absents = studentAtts.filter(a => a.status === 'Absent').length;
        const pct = studentAtts.length > 0 ? Math.round((presents / studentAtts.length) * 100) : 100;
        content += `"${s.fullName}", "${s.rollNumber || '--'}", ${presents}, ${absents}, ${pct}%\n`;
      });
    } else if (type === 'homework') {
      content += `Student Name, Roll Number, Total Homeworks, Completed, Pending, Submission Rate\n`;
      const hws = window.skhs_db.find('homework', 'classId', classId);

      students.forEach(s => {
        const completed = hws.filter(h => {
          const list = Array.isArray(h.completedStudents) ? h.completedStudents : [];
          return list.includes(s.studentId);
        }).length;
        const pending = hws.length - completed;
        const rate = hws.length > 0 ? Math.round((completed / hws.length) * 100) : 100;
        content += `"${s.fullName}", "${s.rollNumber || '--'}", ${hws.length}, ${completed}, ${pending}, ${rate}%\n`;
      });
    } else if (type === 'marks') {
      content += `Student Name, Roll Number, Subject, Exam Name, Marks Obtained, Max Marks, Remarks\n`;
      const subjects = window.skhs_db.getCollection('subjects');
      const exams = window.skhs_db.getCollection('exams');
      const marks = window.skhs_db.getCollection('marks');

      students.forEach(s => {
        const studentMarks = marks.filter(m => m.studentId === s.studentId);
        studentMarks.forEach(m => {
          const exam = exams.find(e => e.examId === m.examId);
          const sub = exam ? subjects.find(su => su.subjectId === exam.subjectId) : null;
          content += `"${s.fullName}", "${s.rollNumber || '--'}", "${sub ? sub.name : 'General'}", "${exam ? exam.name : 'Exam'}", ${m.marksObtained}, ${m.maxMarks || 100}, "${m.remarks || ''}"\n`;
        });
      });
    }

    return content;
  }

  function triggerDownload(content, fileName, contentType) {
    const blob = new Blob([content], { type: contentType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
})();
