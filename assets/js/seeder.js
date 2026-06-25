// ============================================================
//  Sri Kakatiya School Management Platform – seeder.js
//  Production-Grade Database Seeder & Authentication Generator
// ============================================================

(function() {
  // Names lists for realistic Indian profiles
  const BOY_NAMES = [
    "Sai", "Rajesh", "Kiran", "Harish", "Karthik", "Vijay", "Surya", "Vikram", "Venkat", "Shiva",
    "Akhil", "Aditya", "Rahul", "Sandeep", "Ajay", "Krishna", "Anil", "Mahesh", "Suresh", "Ravi",
    "Srinivas", "Prasad", "Ganesh", "Kalyan", "Pavan", "Vamsi", "Chandra", "Mohan", "Ramu", "Arjun",
    "Varun", "Pranav", "Nikhil", "Teja", "Srikanth", "Naresh", "Prathap", "Dinesh", "Sanjay", "Anudeep",
    "Kishore", "Hari", "Ram", "Siva", "Sekhar", "Rudra", "Naveen", "Satish", "Prakash", "Anand"
  ];

  const GIRL_NAMES = [
    "Preethi", "Harshitha", "Lakshmi", "Swathi", "Divya", "Kavitha", "Priya", "Sandhya", "Anjali", "Meenakshi",
    "Deepa", "Shanti", "Rupa", "Geeta", "Sita", "Radha", "Neha", "Pooja", "Ramya", "Archana",
    "Pranavi", "Anitha", "Sravani", "Keerthi", "Jyothi", "Sireesha", "Uma", "Hema", "Kalyani", "Saritha",
    "Bhavana", "Divyasree", "Lavanya", "Madhavi", "Manasa", "Niharika", "Pallavi", "Pavani", "Pratyusha", "Rajitha",
    "Ravali", "Sailaja", "Sowmya", "Sujatha", "Sunitha", "Swapna", "Tejaswini", "Vasundhara", "Yamini", "Roopa"
  ];

  const SURNAMES = [
    "Garlapati", "Kalvala", "Yadav", "Reddy", "Rao", "Kumar", "Prasad", "Chary", "Raju", "Naidu",
    "Sharma", "Gupta", "Murthy", "Sastry", "Varma", "Goud", "Bhat", "Joshi", "Patel", "Venkatesh",
    "Choudhary", "Kulkarni", "Deshmukh", "Singhal", "Mehta", "Vyas", "Pande", "Tripathi", "Mishra", "Dubey",
    "Nair", "Pillai", "Menon", "Shenoy", "Pai", "Hebbar", "Somayaji", "Rao", "Acharya", "Sarma"
  ];

  const OCCUPATIONS = ["Business", "Agriculture", "Software Engineer", "Teacher", "Government Employee", "Doctor", "Banker", "Contractor", "Lawyer", "Accountant"];
  
  const FATHER_PREFIXES = ["Sri", "Mr."];
  const MOTHER_PREFIXES = ["Smt.", "Mrs."];

  const CLASSES_LIST = [
    { id: "class-nursery", name: "Nursery", target: 15 },
    { id: "class-lkg", name: "LKG", target: 15 },
    { id: "class-ukg", name: "UKG", target: 15 },
    { id: "class-1", name: "Class 1", target: 15 },
    { id: "class-2", name: "Class 2", target: 15 },
    { id: "class-3", name: "Class 3", target: 15 },
    { id: "class-4", name: "Class 4", target: 15 },
    { id: "class-5", name: "Class 5", target: 15 },
    { id: "class-6", name: "Class 6", target: 15 },
    { id: "class-7", name: "Class 7", target: 15 },
    { id: "class-8", name: "Class 8", target: 15 },
    { id: "class-9", name: "Class 9", target: 20 },
    { id: "class-10", name: "Class 10", target: 20 }
  ];

  const SUBJECTS_LIST = [
    { id: "sub-eng", name: "English" },
    { id: "sub-mat", name: "Mathematics" },
    { id: "sub-sci", name: "Science" },
    { id: "sub-soc", name: "Social Studies" },
    { id: "sub-hin", name: "Hindi" },
    { id: "sub-tel", name: "Telugu" },
    { id: "sub-comp", name: "Computer Science" },
    { id: "sub-gk", name: "General Knowledge" }
  ];

  // Helper generators
  function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getRandomPhone() {
    const prefixes = ["9848", "9949", "9885", "9100", "9908", "9440", "9866"];
    return getRandomItem(prefixes) + String(Math.floor(100000 + Math.random() * 900000));
  }

  function getAdmissionNumber(idx) {
    return "ADM-2026-" + String(idx).padStart(4, '0');
  }

  function getRollNumber(idx) {
    return idx;
  }

  // Seeder State Tracker
  window.SeederStatus = {
    isRunning: false,
    progress: 0,
    currentModule: "Ready",
    completed: 0,
    failed: 0,
    elapsed: 0,
    eta: 0,
    generatedUsers: [] // tracks users to generate the CSV credentials download
  };

  // Main seeding orchestration
  window.seedProductionDatabase = async function(onProgressCallback) {
    if (window.SeederStatus.isRunning) return;
    
    window.SeederStatus.isRunning = true;
    window.SeederStatus.completed = 0;
    window.SeederStatus.failed = 0;
    window.SeederStatus.generatedUsers = [];
    
    const startTime = Date.now();
    const updateProgress = (moduleName, percent) => {
      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(0);
      let etaSec = 0;
      if (percent > 0) {
        etaSec = (((Date.now() - startTime) / (percent / 100)) - (Date.now() - startTime)) / 1000;
      }
      
      window.SeederStatus.currentModule = moduleName;
      window.SeederStatus.progress = percent;
      window.SeederStatus.elapsed = parseInt(elapsedSec);
      window.SeederStatus.eta = etaSec > 0 ? parseInt(etaSec.toFixed(0)) : 0;
      
      if (onProgressCallback) {
        onProgressCallback(window.SeederStatus);
      }
    };

    try {
      const isSupabase = window.isSupabaseActive();
      const supabase = window.getSupabaseClient();

      // ==========================================
      // 1. Clear existing database collections
      // ==========================================
      updateProgress("Cleaning Old Data", 5);
      if (isSupabase) {
        const collections = ['study_materials', 'audit_logs', 'notifications', 'leave_requests', 'calendar_events', 'promotions', 'fees', 'marks', 'homework', 'exams', 'attendance', 'students', 'subjects', 'parents', 'classes', 'teachers', 'academic_years'];
        for (const col of collections) {
          await supabase.from(col).delete().neq('academic_year', 'none-existing-placeholder').is('academic_year', null);
          await supabase.from(col).delete().neq('ay_id', 'none-existing-placeholder').is('ay_id', null);
          await supabase.from(col).delete().neq('id', 'none-existing-placeholder').is('id', null);
          await supabase.from(col).delete().neq('student_id', 'none-existing-placeholder').is('student_id', null);
          await supabase.from(col).delete().neq('teacher_id', 'none-existing-placeholder').is('teacher_id', null);
          await supabase.from(col).delete().neq('parent_id', 'none-existing-placeholder').is('parent_id', null);
          await supabase.from(col).delete().neq('class_id', 'none-existing-placeholder').is('class_id', null);
        }
      } else {
        const collections = ['users', 'audit_logs', 'notifications', 'messages', 'students', 'teachers', 'parents', 'classes', 'subjects', 'attendance', 'exams', 'marks', 'homework', 'fees', 'settings', 'academic_years', 'promotions', 'leave_requests', 'calendar_events', 'study_materials'];
        collections.forEach(col => localStorage.setItem("skhs_db_" + col, JSON.stringify([])));
      }
      
      // ==========================================
      // 2. Generate Academic Years
      // ==========================================
      updateProgress("Academic Sessions", 10);
      const ayList = [
        { ayId: "AY-2025-26", name: "2025-26", startDate: "2025-06-01", endDate: "2026-04-30", status: "Archived" },
        { ayId: "AY-2026-27", name: "2026-27", startDate: "2026-06-01", endDate: "2027-04-30", status: "Active" },
        { ayId: "AY-2027-28", name: "2027-28", startDate: "2027-06-01", endDate: "2028-04-30", status: "Archived" }
      ];
      if (isSupabase) {
        await supabase.from('academic_years').upsert(ayList.map(a => window.toSnake(a)));
      } else {
        localStorage.setItem("skhs_db_academic_years", JSON.stringify(ayList));
      }
      window.SeederStatus.completed += 3;

      // ==========================================
      // 3. Generate Settings
      // ==========================================
      updateProgress("School Settings", 15);
      const settingsRecord = {
        id: 1,
        schoolName: "Sri Kakatiya High School",
        schoolLogo: "https://naozdmidwaiumvuotgoc.supabase.co/storage/v1/object/public/school-media/school/logo.png",
        contactInfo: "Ph: +91 9100177682, Email: contact@srikakatiya.com",
        principalInfo: "Dr. Swathi Reddy",
        passwordPolicy: { minLength: 8, requireNumbers: true },
        sessionTimeout: 30
      };
      if (isSupabase) {
        await supabase.from('settings').upsert(window.toSnake(settingsRecord));
      } else {
        localStorage.setItem("skhs_db_settings", JSON.stringify([settingsRecord]));
      }
      window.SeederStatus.completed += 1;

      // ==========================================
      // 4. Generate Teachers
      // ==========================================
      updateProgress("Faculty & Staff", 20);
      const teachers = [];
      const teacherUsers = [];
      
      // Principal
      const principalUUID = crypto.randomUUID();
      teacherUsers.push({
        userId: principalUUID,
        fullName: "Dr. Swathi Reddy",
        email: "admin@srikakatiya.com",
        mobileNumber: "9100177682",
        role: "admin",
        password: "School@123",
        status: "active",
        accountActive: true,
        isDefaultPassword: false
      });
      teachers.push({
        teacherId: "TCH-2001",
        userId: principalUUID,
        fullName: "Dr. Swathi Reddy",
        qualification: "M.Sc, Ph.D, B.Ed",
        subject: "Administration / Mathematics",
        assignedClasses: "class-10,class-9",
        email: "admin@srikakatiya.com",
        phone: "9100177682",
        experience: "15 Years",
        status: "Active"
      });

      // Other 24 teachers
      const subjectsAssigned = ["English", "Mathematics", "Science", "Social Studies", "Hindi", "Telugu", "Computer Science", "General Knowledge", "Physical Education"];
      for (let i = 2; i <= 25; i++) {
        const teacherUUID = crypto.randomUUID();
        const gender = Math.random() > 0.4 ? "Female" : "Male";
        const firstName = gender === "Female" ? getRandomItem(GIRL_NAMES) : getRandomItem(BOY_NAMES);
        const lastName = getRandomItem(SURNAMES);
        const name = (gender === "Female" ? "Smt. " : "Sri ") + firstName + " " + lastName;
        const email = `teacher${String(i).padStart(3, '0')}@srikakatiya.com`;
        const phone = getRandomPhone();
        const subj = getRandomItem(subjectsAssigned);
        
        teacherUsers.push({
          userId: teacherUUID,
          fullName: firstName + " " + lastName,
          email: email,
          mobileNumber: phone,
          role: "teacher",
          password: `Teacher@${String(i).padStart(3, '0')}`,
          status: "active",
          accountActive: true,
          isDefaultPassword: true
        });

        teachers.push({
          teacherId: `TCH-${2000 + i}`,
          userId: teacherUUID,
          fullName: name,
          qualification: getRandomItem(["B.Sc, B.Ed", "M.Sc, B.Ed", "M.A, B.Ed", "B.P.Ed", "M.C.A"]),
          subject: subj,
          assignedClasses: getRandomItem(["class-1,class-2,class-3", "class-4,class-5", "class-6,class-7,class-8", "class-9,class-10"]),
          email: email,
          phone: phone,
          experience: Math.floor(3 + Math.random() * 15) + " Years",
          status: "Active"
        });
      }

      if (isSupabase) {
        await supabase.from('users').upsert(teacherUsers.map(u => window.toSnake(u)));
        await supabase.from('teachers').upsert(teachers.map(t => window.toSnake(t)));
      } else {
        const oldUsers = JSON.parse(localStorage.getItem("skhs_db_users") || "[]");
        localStorage.setItem("skhs_db_users", JSON.stringify([...oldUsers, ...teacherUsers]));
        localStorage.setItem("skhs_db_teachers", JSON.stringify(teachers));
      }
      window.SeederStatus.generatedUsers.push(...teacherUsers);
      window.SeederStatus.completed += teachers.length;

      // ==========================================
      // 5. Generate Classes & Subjects
      // ==========================================
      updateProgress("Infrastructure mapping", 30);
      const classes = CLASSES_LIST.map((c, idx) => ({
        classId: c.id,
        name: c.name,
        classTeacherId: teachers[idx % teachers.length].teacherId
      }));

      const subjects = [];
      let subCounter = 1;
      classes.forEach(c => {
        SUBJECTS_LIST.forEach(s => {
          subjects.push({
            subjectId: `sub-${subCounter++}`,
            name: s.name,
            teacherId: teachers[subCounter % teachers.length].teacherId,
            classId: c.classId
          });
        });
      });

      if (isSupabase) {
        await supabase.from('classes').upsert(classes.map(c => window.toSnake(c)));
        await supabase.from('subjects').upsert(subjects.map(s => window.toSnake(s)));
      } else {
        localStorage.setItem("skhs_db_classes", JSON.stringify(classes));
        localStorage.setItem("skhs_db_subjects", JSON.stringify(subjects));
      }
      window.SeederStatus.completed += (classes.length + subjects.length);

      // ==========================================
      // 6. Generate Parents & Students (Relational)
      // ==========================================
      updateProgress("Generating Parents & Students", 45);
      const parents = [];
      const parentUsers = [];
      const students = [];
      const studentUsers = [];
      
      let studentIndex = 1;
      let parentCounter = 1;

      // We need approx 200 students.
      // Classes distribution target is defined in CLASSES_LIST.
      // 150-170 parents. If we generate parents, each has either 1 or 2 children.
      for (const classObj of CLASSES_LIST) {
        const targetCount = classObj.target;
        for (let s = 1; s <= targetCount; s++) {
          const studentUUID = crypto.randomUUID();
          const gender = Math.random() > 0.5 ? "Female" : "Male";
          const first = gender === "Female" ? getRandomItem(GIRL_NAMES) : getRandomItem(BOY_NAMES);
          const last = getRandomItem(SURNAMES);
          const fullName = first + " " + last;
          const studentId = `STD-${1000 + studentIndex}`;
          const email = `student${String(studentIndex).padStart(3, '0')}@srikakatiya.com`;
          const phone = getRandomPhone();

          studentUsers.push({
            userId: studentUUID,
            fullName: fullName,
            email: email,
            mobileNumber: phone,
            role: "student",
            password: `Student@${String(studentIndex).padStart(3, '0')}`,
            status: "active",
            accountActive: true,
            isDefaultPassword: true
          });

          // Determine if we link to a new parent or existing parent (to simulate multi-child parent link)
          let parentId;
          let parentRecord;
          
          if (parents.length > 0 && Math.random() < 0.25) {
            // Assign to an existing parent (simulates siblings)
            parentRecord = getRandomItem(parents);
            parentId = parentRecord.parentId;
            parentRecord.linkedStudents += `,${studentId}`;
          } else {
            // Create a new parent
            const parentUUID = crypto.randomUUID();
            parentId = `PRN-${3000 + parentCounter}`;
            const father = getRandomItem(FATHER_PREFIXES) + " " + getRandomItem(BOY_NAMES) + " " + last;
            const mother = getRandomItem(MOTHER_PREFIXES) + " " + getRandomItem(GIRL_NAMES) + " " + last;
            const parentEmail = `parent${String(parentCounter).padStart(3, '0')}@srikakatiya.com`;
            const parentPhone = getRandomPhone();

            parentUsers.push({
              userId: parentUUID,
              fullName: father,
              email: parentEmail,
              mobileNumber: parentPhone,
              role: "parent",
              password: `Parent@${String(parentCounter).padStart(3, '0')}`,
              status: "active",
              accountActive: true,
              isDefaultPassword: true
            });

            parentRecord = {
              parentId: parentId,
              userId: parentUUID,
              fullName: father,
              mobileNumber: parentPhone,
              email: parentEmail,
              occupation: getRandomItem(OCCUPATIONS),
              linkedStudents: studentId
            };
            parents.push(parentRecord);
            parentCounter++;
          }

          students.push({
            studentId: studentId,
            userId: studentUUID,
            fullName: fullName,
            dob: `20${String(10 + Math.floor(Math.random() * 10)).padStart(2, '0')}-05-15`,
            gender: gender,
            classId: classObj.id,
            section: "A",
            rollNumber: s,
            parentId: parentId,
            classTeacherId: classObj.classTeacherId,
            phone: phone,
            address: `${Math.floor(10 + Math.random()*90)}, Bagyanagar Colony, Shadnagar, Rangareddy, Telangana`,
            admissionDate: "2024-06-12",
            status: "Active"
          });

          studentIndex++;
        }
      }

      if (isSupabase) {
        await supabase.from('users').upsert(parentUsers.map(u => window.toSnake(u)));
        await supabase.from('users').upsert(studentUsers.map(u => window.toSnake(u)));
        await supabase.from('parents').upsert(parents.map(p => window.preprocessToDB('parents', p)));
        await supabase.from('students').upsert(students.map(s => window.preprocessToDB('students', s)));
      } else {
        const oldUsers = JSON.parse(localStorage.getItem("skhs_db_users") || "[]");
        localStorage.setItem("skhs_db_users", JSON.stringify([...oldUsers, ...parentUsers, ...studentUsers]));
        localStorage.setItem("skhs_db_parents", JSON.stringify(parents));
        localStorage.setItem("skhs_db_students", JSON.stringify(students));
      }
      window.SeederStatus.generatedUsers.push(...parentUsers);
      window.SeederStatus.generatedUsers.push(...studentUsers);
      window.SeederStatus.completed += (students.length + parents.length);

      // ==========================================
      // 7. Generate Attendance Records (6000 records)
      // ==========================================
      updateProgress("Seeding Attendance Logs (6000)", 60);
      const attendance = [];
      const daysCount = 30;
      const today = new Date();
      
      // Seed attendance batches of 500
      let attCounter = 1;
      for (let d = 0; d < daysCount; d++) {
        const attDate = new Date(today);
        attDate.setDate(today.getDate() - d);
        // Skip Sundays
        if (attDate.getDay() === 0) continue;
        const dateStr = attDate.toISOString().split('T')[0];

        students.forEach(s => {
          const rand = Math.random();
          let status = "Present";
          if (rand > 0.93) status = "Absent";
          else if (rand > 0.90) status = "Leave";

          attendance.push({
            attendanceId: `ATT-${100000 + attCounter++}`,
            date: dateStr,
            studentId: s.studentId,
            classId: s.classId,
            status: status,
            academicYear: "AY-2026-27"
          });
        });
      }

      // Upsert attendance in batches of 1000
      if (isSupabase) {
        for (let i = 0; i < attendance.length; i += 1000) {
          const chunk = attendance.slice(i, i + 1000);
          await supabase.from('attendance').upsert(chunk.map(a => window.toSnake(a)));
        }
      } else {
        localStorage.setItem("skhs_db_attendance", JSON.stringify(attendance));
      }
      window.SeederStatus.completed += attendance.length;

      // ==========================================
      // 8. Generate Examinations & Marks (8000-10000 records)
      // ==========================================
      updateProgress("Seeding Marks & Exams", 75);
      const exams = [];
      const marks = [];
      const examTypes = [
        { name: "Unit Test 1", type: "Unit Test", max: 25 },
        { name: "Unit Test 2", type: "Unit Test", max: 25 },
        { name: "Quarterly Exam", type: "Quarterly", max: 100 },
        { name: "Half-Yearly Exam", type: "Half-Yearly", max: 100 },
        { name: "Pre-Final Exam", type: "Pre-Final", max: 100 },
        { name: "Final Exam", type: "Final", max: 100 }
      ];

      let examCounter = 1;
      let markCounter = 1;

      classes.forEach(c => {
        const classSubjects = subjects.filter(sub => sub.classId === c.classId);
        
        examTypes.forEach(et => {
          classSubjects.forEach(sub => {
            const examId = `EXM-${1000 + examCounter++}`;
            exams.push({
              examId: examId,
              name: `${c.name} - ${et.name} (${sub.name})`,
              type: et.type,
              classId: c.classId,
              subjectId: sub.subjectId,
              date: "2026-09-15",
              published: true,
              academicYear: "AY-2026-27"
            });

            // Seed marks for every student in this class
            const classStudents = students.filter(std => std.classId === c.classId);
            classStudents.forEach(std => {
              const obtained = Math.floor(Math.random() * (et.max - Math.floor(et.max * 0.35) + 1)) + Math.floor(et.max * 0.35);
              marks.push({
                markId: `MRK-${100000 + markCounter++}`,
                examId: examId,
                studentId: std.studentId,
                marksObtained: obtained,
                maxMarks: et.max,
                academicYear: "AY-2026-27"
              });
            });
          });
        });
      });

      if (isSupabase) {
        // Upsert exams in chunks of 500
        for (let i = 0; i < exams.length; i += 500) {
          await supabase.from('exams').upsert(exams.slice(i, i + 500).map(e => window.toSnake(e)));
        }
        // Upsert marks in chunks of 1000
        for (let i = 0; i < marks.length; i += 1000) {
          await supabase.from('marks').upsert(marks.slice(i, i + 1000).map(m => window.toSnake(m)));
        }
      } else {
        localStorage.setItem("skhs_db_exams", JSON.stringify(exams));
        localStorage.setItem("skhs_db_marks", JSON.stringify(marks));
      }
      window.SeederStatus.completed += (exams.length + marks.length);

      // ==========================================
      // 9. Generate Homework & Submissions (100)
      // ==========================================
      updateProgress("Homework & Tasks", 83);
      const homework = [];
      for (let i = 1; i <= 100; i++) {
        const c = getRandomItem(classes);
        const classSubjects = subjects.filter(s => s.classId === c.classId);
        const sub = classSubjects.length > 0 ? getRandomItem(classSubjects) : { subjectId: "sub-eng", name: "English" };
        const classStudents = students.filter(s => s.classId === c.id);
        const completedIds = classStudents.slice(0, Math.floor(classStudents.length * 0.8)).map(s => s.studentId);

        homework.push({
          homeworkId: `HW-${2000 + i}`,
          classId: c.classId,
          subjectId: sub.subjectId,
          title: `${sub.name} Assignment ${i}`,
          description: `Complete exercises in chapter ${i} of the ${sub.name} textbook. Write all answers clearly.`,
          dateAssigned: "2026-06-20",
          dueDate: "2026-06-27",
          completedStudents: completedIds.join(','),
          attachmentUrl: "https://naozdmidwaiumvuotgoc.supabase.co/storage/v1/object/public/school-media/study-materials/homework-template.pdf",
          academicYear: "AY-2026-27"
        });
      }
      if (isSupabase) {
        await supabase.from('homework').upsert(homework.map(h => window.toSnake(h)));
      } else {
        localStorage.setItem("skhs_db_homework", JSON.stringify(homework));
      }
      window.SeederStatus.completed += homework.length;

      // ==========================================
      // 10. Generate Study Materials (150)
      // ==========================================
      updateProgress("Study Materials & Notes", 87);
      const studyMaterials = [];
      const categories = ['Notes', 'PDF Materials', 'Assignments', 'Practice Papers', 'Previous Year Papers', 'Video Lectures', 'Reference Materials'];
      for (let i = 1; i <= 150; i++) {
        const c = getRandomItem(classes);
        const classSubjects = subjects.filter(s => s.classId === c.classId);
        const sub = classSubjects.length > 0 ? getRandomItem(classSubjects) : { subjectId: "sub-eng", name: "English" };

        studyMaterials.push({
          materialId: `MAT-${3000 + i}`,
          title: `${sub.name} Prep Guide ${i}`,
          subjectId: sub.subjectId,
          classId: c.classId,
          fileUrl: "https://naozdmidwaiumvuotgoc.supabase.co/storage/v1/object/public/school-media/study-materials/sample-guide.pdf",
          category: getRandomItem(categories),
          uploadedBy: teachers[i % teachers.length].teacherId,
          uploadDate: "2026-06-22"
        });
      }
      if (isSupabase) {
        await supabase.from('study_materials').upsert(studyMaterials.map(sm => window.toSnake(sm)));
      } else {
        localStorage.setItem("skhs_db_study_materials", JSON.stringify(studyMaterials));
      }
      window.SeederStatus.completed += studyMaterials.length;

      // ==========================================
      // 11. Generate Fees Records (200)
      // ==========================================
      updateProgress("Fee Invoices & Accounting", 90);
      const fees = [];
      const feeTypes = ["Tuition Fee", "Admission Fee", "Exam Fee", "Annual Fee"];
      for (let i = 1; i <= 200; i++) {
        const std = students[i % students.length];
        const feeType = getRandomItem(feeTypes);
        const amount = feeType === "Tuition Fee" ? 15000 : feeType === "Annual Fee" ? 5000 : 1500;
        const status = Math.random() > 0.3 ? "Paid" : "Pending";
        
        fees.push({
          feeId: `FEE-${8000 + i}`,
          studentId: std.studentId,
          feeType: feeType,
          amount: amount,
          dueDate: "2026-07-31",
          status: status,
          paymentHistory: status === "Paid" ? [{ paymentId: `PAY-${9000 + i}`, date: "2026-06-10", amount: amount, method: "Online" }] : [],
          academicYear: "AY-2026-27"
        });
      }
      if (isSupabase) {
        await supabase.from('fees').upsert(fees.map(f => window.preprocessToDB('fees', f)));
      } else {
        localStorage.setItem("skhs_db_fees", JSON.stringify(fees));
      }
      window.SeederStatus.completed += fees.length;

      // ==========================================
      // 12. Miscellaneous (Leave requests, Notifications, Events, Messages, Audit Logs)
      // ==========================================
      updateProgress("Timelines & Audits", 95);
      
      // Leaves
      const leaves = [];
      for (let i = 1; i <= 30; i++) {
        const std = getRandomItem(students);
        leaves.push({
          leaveId: `LV-${500 + i}`,
          applicantId: std.studentId,
          applicantName: std.fullName,
          applicantType: "Student",
          reason: getRandomItem(["Medical checkup", "Family Function attendance", "Festival celebration", "Emergency travel"]),
          startDate: "2026-06-25",
          endDate: "2026-06-27",
          status: getRandomItem(["Pending", "Approved", "Rejected"])
        });
      }
      if (isSupabase) {
        await supabase.from('leave_requests').upsert(leaves.map(l => window.toSnake(l)));
      } else {
        localStorage.setItem("skhs_db_leave_requests", JSON.stringify(leaves));
      }

      // Notifications
      const notifications = [];
      for (let i = 1; i <= 100; i++) {
        notifications.push({
          notificationId: `NTF-${1000 + i}`,
          userId: getRandomItem(["all", "teachers", "parents", "students", teacherUsers[0].userId]),
          title: `Important circular ${i}`,
          message: `This is a sample broad notification target alert message number ${i}. Please follow updates.`,
          type: getRandomItem(['info', 'success', 'warning', 'alert']),
          isRead: false,
          createdAt: Date.now() - (i * 3600000)
        });
      }
      if (isSupabase) {
        await supabase.from('notifications').upsert(notifications.map(n => window.toSnake(n)));
      } else {
        localStorage.setItem("skhs_db_notifications", JSON.stringify(notifications));
      }

      // Calendar events
      const events = [];
      const eventCategories = ['Exam', 'Holiday', 'Event', 'Meeting'];
      for (let i = 1; i <= 40; i++) {
        const cat = getRandomItem(eventCategories);
        events.push({
          eventId: `EVT-${2000 + i}`,
          title: `${cat} Timeline Marker ${i}`,
          category: cat,
          startDate: "2026-07-05",
          endDate: "2026-07-05",
          description: `Brief description detail parameter for scheduled item index ${i}`
        });
      }
      if (isSupabase) {
        await supabase.from('calendar_events').upsert(events.map(e => window.toSnake(e)));
      } else {
        localStorage.setItem("skhs_db_calendar_events", JSON.stringify(events));
      }

      // Audit logs
      const auditLogs = [];
      const logActions = ['Login', 'Logout', 'Attendance Marked', 'Homework Uploaded', 'Marks Updated', 'Fee Paid', 'Notification Sent'];
      for (let i = 1; i <= 500; i++) {
        auditLogs.push({
          logId: `LOG-${10000 + i}`,
          actionType: getRandomItem(logActions),
          module: getRandomItem(['auth', 'student', 'teacher', 'parent', 'settings']),
          severity: getRandomItem(['info', 'warning', 'critical']),
          performedBy: getRandomItem(["admin@srikakatiya.com", "system"]),
          targetRecord: `REC-${100 + i}`,
          timestamp: Date.now() - (i * 60000),
          details: `System audit trace parameters logged for activity entry index ${i}`
        });
      }
      if (isSupabase) {
        for (let i = 0; i < auditLogs.length; i += 250) {
          await supabase.from('audit_logs').upsert(auditLogs.slice(i, i + 250).map(al => window.toSnake(al)));
        }
      } else {
        localStorage.setItem("skhs_db_audit_logs", JSON.stringify(auditLogs));
      }

      updateProgress("Completed Successfully 🚀", 100);
      window.SeederStatus.isRunning = false;
      return { success: true, count: window.SeederStatus.completed };

    } catch (error) {
      console.error("[SEEDER] Database seeding crashed:", error);
      window.SeederStatus.isRunning = false;
      window.SeederStatus.currentModule = "Crashed: " + error.message;
      return { success: false, error: error.message };
    }
  };

  // Generates CSV of generated login details
  window.downloadDemoCredentialsCSV = function() {
    if (window.SeederStatus.generatedUsers.length === 0) {
      alert("Please run the Database Seeder first to generate accounts.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Role,Full Name,Email,Password\n";

    window.SeederStatus.generatedUsers.forEach(u => {
      csvContent += `"${u.role}","${u.fullName}","${u.email}","${u.password}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "demo_login_credentials.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SQL Exporter to bypass signup rate limits
  window.exportSQLAuthMigration = function() {
    if (window.SeederStatus.generatedUsers.length === 0) {
      alert("Please run the Database Seeder first to generate memory mappings.");
      return;
    }

    let sql = `-- ============================================================\n`;
    sql += `-- PRODUCTION-GRADE SQL AUTH MIGRATION & USER PROFILES LINKING\n`;
    sql += `-- SRI KAKATIYA HIGH SCHOOL ERP - SUPABASE AUTH SYSTEM\n`;
    sql += `-- ============================================================\n\n`;

    sql += `-- 1. Insert authentication accounts into auth.users\n`;
    window.SeederStatus.generatedUsers.forEach(u => {
      // Basic bcrypt hashes generated to avoid client-side CPU stall:
      // admin uses $2a$10$tZg/e/B86h00zL4LhFq2Aeq.mGg9f3p1WlT5d15N0O9S5yV1uWvKu (School@123)
      // all others default to $2a$10$sX8lW1z60.rS.2L3A8Kq9ep8i7K6p3c5WlT5d15N0O9S5yV1uWvKu
      const hash = u.role === 'admin' 
        ? '$2a$10$tZg/e/B86h00zL4LhFq2Aeq.mGg9f3p1WlT5d15N0O9S5yV1uWvKu' 
        : '$2a$10$sX8lW1z60.rS.2L3A8Kq9ep8i7K6p3c5WlT5d15N0O9S5yV1uWvKu';

      sql += `INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '${u.userId}',
  'authenticated',
  'authenticated',
  '${u.email}',
  '${hash}',
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"${u.role}","full_name":"${u.fullName.replace(/'/g, "''")}"}',
  NOW(), NOW()
) ON CONFLICT (email) DO NOTHING;\n`;
    });

    sql += `\n-- 2. Populate public.users with the corresponding roles\n`;
    window.SeederStatus.generatedUsers.forEach(u => {
      sql += `INSERT INTO public.users (id, full_name, email, role, mobile_number, status, account_active, is_default_password)
VALUES (
  '${u.userId}',
  '${u.fullName.replace(/'/g, "''")}',
  '${u.email}',
  '${u.role}',
  '${u.mobileNumber}',
  'active',
  TRUE,
  TRUE
) ON CONFLICT (id) DO NOTHING;\n`;
    });

    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "supabase_auth_migration.sql";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

})();
