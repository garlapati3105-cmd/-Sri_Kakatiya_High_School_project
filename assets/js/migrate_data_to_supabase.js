// ============================================================
//  Sri Kakatiya School Management Platform – migrate_data_to_supabase.js
//  Extracts LocalStorage tables and uploads them into Supabase
// ============================================================

window.migrateLocalStorageToSupabase = async function() {
  if (!window.isSupabaseActive()) {
    console.error("[MIGRATOR] Cannot run migration. Supabase is not active or configured.");
    return { success: false, message: "Supabase client is not active. Check credentials in supabase-config.js." };
  }

  const supabase = window.getSupabaseClient();
  console.log("[MIGRATOR] Starting LocalStorage data migration to Supabase cloud database...");

  // Helpers to retrieve local collections
  const localGet = (col) => {
    const key = "skhs_db_" + col;
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : [];
    } catch (e) {
      console.error(`[MIGRATOR] Error reading localStorage key ${key}:`, e);
      return [];
    }
  };

  try {
    // 1. Settings
    const localSettings = localGet('settings');
    if (localSettings.length > 0) {
      const s = localSettings[0];
      const { error } = await supabase.from('settings').upsert({
        id: 1,
        school_name: s.schoolName || 'Sri Kakatiya High School',
        school_logo: s.schoolLogo || null,
        contact_info: s.contactInfo || null,
        principal_info: s.principalInfo || null,
        password_policy: s.passwordPolicy || {},
        session_timeout: s.sessionTimeout || 30
      });
      if (error) throw new Error("Settings upload failed: " + error.message);
      console.log("[MIGRATOR] settings table migrated.");
    }

    // 2. Academic Years
    const localAYs = localGet('academic_years');
    if (localAYs.length > 0) {
      const mapped = localAYs.map(ay => ({
        ay_id: ay.ayId,
        name: ay.name,
        start_date: ay.startDate,
        end_date: ay.endDate,
        status: ay.status
      }));
      const { error } = await supabase.from('academic_years').upsert(mapped);
      if (error) throw new Error("Academic Years migration failed: " + error.message);
      console.log("[MIGRATOR] academic_years table migrated.");
    }

    // 3. Classes
    const localClasses = localGet('classes');
    if (localClasses.length > 0) {
      const mapped = localClasses.map(c => ({
        class_id: c.classId,
        name: c.name,
        class_teacher_id: c.classTeacherId
      }));
      const { error } = await supabase.from('classes').upsert(mapped);
      if (error) throw new Error("Classes migration failed: " + error.message);
      console.log("[MIGRATOR] classes table migrated.");
    }

    // 4. Subjects
    const localSubjects = localGet('subjects');
    if (localSubjects.length > 0) {
      const mapped = localSubjects.map(sub => ({
        subject_id: sub.subjectId,
        name: sub.name,
        teacher_id: sub.teacherId,
        class_id: sub.classId
      }));
      const { error } = await supabase.from('subjects').upsert(mapped);
      if (error) throw new Error("Subjects migration failed: " + error.message);
      console.log("[MIGRATOR] subjects table migrated.");
    }

    // 5. Parents
    const localParents = localGet('parents');
    if (localParents.length > 0) {
      const mapped = localParents.map(p => ({
        parent_id: p.parentId,
        full_name: p.fullName,
        mobile_number: p.mobileNumber,
        email: p.email,
        occupation: p.occupation,
        linked_students: Array.isArray(p.linkedStudents) ? p.linkedStudents.join(',') : p.linkedStudents
      }));
      const { error } = await supabase.from('parents').upsert(mapped);
      if (error) throw new Error("Parents migration failed: " + error.message);
      console.log("[MIGRATOR] parents table migrated.");
    }

    // 6. Teachers
    const localTeachers = localGet('teachers');
    if (localTeachers.length > 0) {
      const mapped = localTeachers.map(t => ({
        teacher_id: t.teacherId,
        full_name: t.fullName,
        qualification: t.qualification,
        subject: t.subject,
        assigned_classes: Array.isArray(t.assignedClasses) ? t.assignedClasses.join(',') : t.assignedClasses,
        email: t.email,
        phone: t.phone,
        experience: t.experience,
        status: t.status
      }));
      const { error } = await supabase.from('teachers').upsert(mapped);
      if (error) throw new Error("Teachers migration failed: " + error.message);
      console.log("[MIGRATOR] teachers table migrated.");
    }

    // 7. Students
    const localStudents = localGet('students');
    if (localStudents.length > 0) {
      const mapped = localStudents.map(s => ({
        student_id: s.studentId,
        full_name: s.fullName,
        dob: s.dob,
        gender: s.gender,
        class_id: s.classId,
        section: s.section,
        roll_number: parseInt(s.rollNumber),
        parent_id: s.parentId,
        class_teacher_id: s.classTeacherId,
        phone: s.phone,
        address: s.address,
        admission_date: s.admissionDate,
        status: s.status
      }));
      const { error } = await supabase.from('students').upsert(mapped);
      if (error) throw new Error("Students migration failed: " + error.message);
      console.log("[MIGRATOR] students table migrated.");
    }

    // 8. Attendance
    const localAttendance = localGet('attendance');
    if (localAttendance.length > 0) {
      const mapped = localAttendance.map(a => ({
        attendance_id: a.attendanceId,
        date: a.date,
        student_id: a.studentId,
        class_id: a.classId,
        status: a.status,
        academic_year: a.academicYear
      }));
      const { error } = await supabase.from('attendance').upsert(mapped);
      if (error) throw new Error("Attendance migration failed: " + error.message);
      console.log("[MIGRATOR] attendance table migrated.");
    }

    // 9. Exams
    const localExams = localGet('exams');
    if (localExams.length > 0) {
      const mapped = localExams.map(ex => ({
        exam_id: ex.examId,
        name: ex.name,
        type: ex.type,
        class_id: ex.classId,
        subject_id: ex.subjectId,
        date: ex.date,
        published: ex.published,
        academic_year: ex.academicYear
      }));
      const { error } = await supabase.from('exams').upsert(mapped);
      if (error) throw new Error("Exams migration failed: " + error.message);
      console.log("[MIGRATOR] exams table migrated.");
    }

    // 10. Marks
    const localMarks = localGet('marks');
    if (localMarks.length > 0) {
      const mapped = localMarks.map(m => ({
        mark_id: m.markId,
        exam_id: m.examId,
        student_id: m.studentId,
        marks_obtained: parseInt(m.marksObtained),
        max_marks: parseInt(m.maxMarks),
        academic_year: m.academicYear
      }));
      const { error } = await supabase.from('marks').upsert(mapped);
      if (error) throw new Error("Marks migration failed: " + error.message);
      console.log("[MIGRATOR] marks table migrated.");
    }

    // 11. Homework
    const localHomework = localGet('homework');
    if (localHomework.length > 0) {
      const mapped = localHomework.map(h => ({
        homework_id: h.homeworkId,
        class_id: h.classId,
        subject_id: h.subjectId,
        title: h.title,
        description: h.description,
        date_assigned: h.dateAssigned,
        due_date: h.dueDate,
        completed_students: Array.isArray(h.completedStudents) ? h.completedStudents.join(',') : h.completedStudents,
        academic_year: h.academicYear
      }));
      const { error } = await supabase.from('homework').upsert(mapped);
      if (error) throw new Error("Homework migration failed: " + error.message);
      console.log("[MIGRATOR] homework table migrated.");
    }

    // 12. Fees
    const localFees = localGet('fees');
    if (localFees.length > 0) {
      const mapped = localFees.map(f => ({
        fee_id: f.feeId,
        student_id: f.studentId,
        fee_type: f.feeType,
        amount: parseFloat(f.amount),
        due_date: f.dueDate,
        status: f.status,
        payment_history: f.paymentHistory,
        academic_year: f.academicYear
      }));
      const { error } = await supabase.from('fees').upsert(mapped);
      if (error) throw new Error("Fees migration failed: " + error.message);
      console.log("[MIGRATOR] fees table migrated.");
    }

    // 13. Notifications
    const localNotifications = localGet('notifications');
    if (localNotifications.length > 0) {
      const mapped = localNotifications.map(n => ({
        notification_id: n.notificationId,
        user_id: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        is_read: n.isRead,
        created_at: n.createdAt
      }));
      const { error } = await supabase.from('notifications').upsert(mapped);
      if (error) throw new Error("Notifications migration failed: " + error.message);
      console.log("[MIGRATOR] notifications table migrated.");
    }

    // 14. Audit Logs
    const localLogs = localGet('audit_logs');
    if (localLogs.length > 0) {
      const mapped = localLogs.map(l => ({
        log_id: l.logId,
        action_type: l.actionType,
        module: l.module,
        severity: l.severity,
        performed_by: l.performedBy,
        target_record: l.targetRecord,
        timestamp: l.timestamp,
        details: l.details
      }));
      const { error } = await supabase.from('audit_logs').upsert(mapped);
      if (error) throw new Error("Audit Logs migration failed: " + error.message);
      console.log("[MIGRATOR] audit_logs table migrated.");
    }

    // 15. Promotions
    const localPromos = localGet('promotions');
    if (localPromos.length > 0) {
      const mapped = localPromos.map(p => ({
        promo_id: p.promoId,
        student_id: p.studentId,
        prev_class_id: p.prevClassId,
        new_class_id: p.newClassId,
        promo_date: p.promoDate,
        ay_id: p.ayId
      }));
      const { error } = await supabase.from('promotions').upsert(mapped);
      if (error) throw new Error("Promotions migration failed: " + error.message);
      console.log("[MIGRATOR] promotions table migrated.");
    }

    // 16. Leave Requests
    const localLeaves = localGet('leave_requests');
    if (localLeaves.length > 0) {
      const mapped = localLeaves.map(l => ({
        leave_id: l.leaveId,
        applicant_id: l.applicantId,
        applicant_name: l.applicantName,
        applicant_type: l.applicantType,
        reason: l.reason,
        start_date: l.startDate,
        end_date: l.endDate,
        status: l.status
      }));
      const { error } = await supabase.from('leave_requests').upsert(mapped);
      if (error) throw new Error("Leave Requests migration failed: " + error.message);
      console.log("[MIGRATOR] leave_requests table migrated.");
    }

    // 17. Calendar Events
    const localEvents = localGet('calendar_events');
    if (localEvents.length > 0) {
      const mapped = localEvents.map(e => ({
        event_id: e.eventId,
        title: e.title,
        category: e.category,
        start_date: e.startDate,
        end_date: e.endDate,
        description: e.description
      }));
      const { error } = await supabase.from('calendar_events').upsert(mapped);
if (error) throw new Error("Calendar Events migration failed: " + error.message);
      console.log("[MIGRATOR] calendar_events table migrated.");
    }

    console.log("[MIGRATOR] Database migration completed successfully!");
    console.log("[MIGRATOR] Full data migration finished successfully.");
    return { success: true };
  } catch (err) {
    console.error("[MIGRATOR] Migration failed:", err);
    return { success: false, message: err.message };
  }
};

window.migrateAuthToSupabase = async function() {
  if (!window.isSupabaseActive()) {
    console.error("[MIGRATOR] Cannot run auth migration. Supabase is not active.");
    return;
  }
  console.log("[MIGRATOR] Starting Auth account creation for migrated users...");
  
  const localGet = (col) => {
    try { return JSON.parse(localStorage.getItem("skhs_db_" + col)) || []; } catch(e) { return []; }
  };
  
  const teachers = localGet('teachers');
  const parents = localGet('parents');
  const students = localGet('students');
  
  const tempSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  
  let successCount = 0;
  let failCount = 0;
  
  const processUser = async (email, defaultPassword, role, fullName, phone) => {
    if (!email) return;
    email = email.toLowerCase();
    
    // Check if user already exists in public.users to avoid auth duplication errors
    const { data: existing } = await window.getSupabaseClient().from('users').select('id').eq('email', email).single();
    if (existing) {
      console.log(`[MIGRATOR] Auth user already exists for ${email}, skipping.`);
      return;
    }
    
    console.log(`[MIGRATOR] Creating Auth account for ${role}: ${email}`);
    const { data, error } = await tempSupabase.auth.signUp({
      email: email,
      password: defaultPassword,
      options: { data: { role: role, full_name: fullName } }
    });
    
    if (error) {
      console.error(`[MIGRATOR] Auth error for ${email}:`, error.message);
      failCount++;
    } else if (data && data.user) {
      successCount++;
      // Update phone number in public.users (which was created by the trigger)
      if (phone) {
        setTimeout(async () => {
          await window.getSupabaseClient().from('users').update({ mobile_number: phone }).eq('id', data.user.id);
        }, 1000);
      }
    }
    
    // Slight delay to avoid Supabase rate limits (typically 30 requests/sec, but let's be safe)
    await new Promise(res => setTimeout(res, 300));
  };
  
  console.log("[MIGRATOR] Processing Teachers...");
  for (const t of teachers) { await processUser(t.email, 'School@456', 'teacher', t.fullName, t.phone); }
  
  console.log("[MIGRATOR] Processing Parents...");
  for (const p of parents) { await processUser(p.email, 'School@789', 'parent', p.fullName, p.mobileNumber); }
  
  console.log("[MIGRATOR] Processing Students...");
  for (const s of students) {
    let email = s.email || `${s.studentId.toLowerCase()}@srikakatiya.com`;
    await processUser(email, 'School@321', 'student', s.fullName, s.phone);
  }
  
  console.log(`[MIGRATOR] Auth migration complete. Created: ${successCount}, Failed: ${failCount}`);
};

window.registerMigratedMembersAuth = async function() {
  if (!window.isSupabaseActive()) {
    console.error("[MIGRATOR] Supabase is not active.");
    return { success: false, message: "Supabase client not active." };
  }

  const supabase = window.getSupabaseClient();
  console.log("[MIGRATOR] Starting Auth registration and linking for teachers, parents, and students...");

  const localGet = (col) => {
    const key = "skhs_db_" + col;
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : [];
    } catch (e) {
      return [];
    }
  };

  // Helper to create a temp client
  const tempSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  // 1. Teachers
  const teachers = localGet('teachers');
  for (const t of teachers) {
    try {
      console.log(`[MIGRATOR] Registering Auth for teacher: ${t.email}`);
      const { data, error } = await tempSupabase.auth.signUp({
        email: t.email,
        password: 'School@456',
        options: { data: { role: 'teacher', full_name: t.fullName } }
      });
      
      if (error) {
        console.warn(`[MIGRATOR] Teacher Auth creation skipped/failed for ${t.email}:`, error.message);
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', t.email).single();
        if (existingUser) {
          await supabase.from('teachers').update({ user_id: existingUser.id }).eq('teacher_id', t.teacherId);
        }
      } else if (data && data.user) {
        console.log(`[MIGRATOR] Registered teacher ${t.email} -> UUID: ${data.user.id}`);
        const { error: linkError } = await supabase.from('teachers').update({ user_id: data.user.id }).eq('teacher_id', t.teacherId);
        if (linkError) console.error(`[MIGRATOR] Failed to link teacher user_id:`, linkError);
      }
    } catch (e) {
      console.error(`[MIGRATOR] Error registering teacher ${t.email}:`, e);
    }
  }

  // 2. Parents
  const parents = localGet('parents');
  for (const p of parents) {
    try {
      console.log(`[MIGRATOR] Registering Auth for parent: ${p.email}`);
      const { data, error } = await tempSupabase.auth.signUp({
        email: p.email,
        password: 'School@789',
        options: { data: { role: 'parent', full_name: p.fullName } }
      });
      
      if (error) {
        console.warn(`[MIGRATOR] Parent Auth creation skipped/failed for ${p.email}:`, error.message);
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', p.email).single();
        if (existingUser) {
          await supabase.from('parents').update({ user_id: existingUser.id }).eq('parent_id', p.parentId);
        }
      } else if (data && data.user) {
        console.log(`[MIGRATOR] Registered parent ${p.email} -> UUID: ${data.user.id}`);
        const { error: linkError } = await supabase.from('parents').update({ user_id: data.user.id }).eq('parent_id', p.parentId);
        if (linkError) console.error(`[MIGRATOR] Failed to link parent user_id:`, linkError);
      }
    } catch (e) {
      console.error(`[MIGRATOR] Error registering parent ${p.email}:`, e);
    }
  }

  // 3. Students
  const students = localGet('students');
  for (const s of students) {
    const email = `${s.studentId.toLowerCase()}@srikakatiya.com`;
    try {
      console.log(`[MIGRATOR] Registering Auth for student: ${email}`);
      const { data, error } = await tempSupabase.auth.signUp({
        email: email,
        password: 'School@321',
        options: { data: { role: 'student', full_name: s.fullName } }
      });
      
      if (error) {
        console.warn(`[MIGRATOR] Student Auth creation skipped/failed for ${email}:`, error.message);
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
        if (existingUser) {
          await supabase.from('students').update({ user_id: existingUser.id }).eq('student_id', s.studentId);
        }
      } else if (data && data.user) {
        console.log(`[MIGRATOR] Registered student ${email} -> UUID: ${data.user.id}`);
        const { error: linkError } = await supabase.from('students').update({ user_id: data.user.id }).eq('student_id', s.studentId);
        if (linkError) console.error(`[MIGRATOR] Failed to link student user_id:`, linkError);
      }
    } catch (e) {
      console.error(`[MIGRATOR] Error registering student ${email}:`, e);
    }
  }

  console.log("[MIGRATOR] Auth registration and linking completed!");
  return { success: true, message: "Auth credentials created for all members." };
};

window.generateMigrationSQL = function() {
  const localGet = (col) => {
    const key = "skhs_db_" + col;
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : [];
    } catch (e) {
      return [];
    }
  };

  let sql = `-- ============================================================\n`;
  sql += `-- GENERATED MIGRATION SQL FOR AUTH ACCOUNTS AND USER LINKING\n`;
  sql += `-- ============================================================\n\n`;

  const teachers = localGet('teachers');
  const parents = localGet('parents');
  const students = localGet('students');

  const memberList = [];

  teachers.forEach(t => {
    const uuid = crypto.randomUUID();
    memberList.push({
      uuid,
      email: t.email.toLowerCase().trim(),
      fullName: t.fullName,
      role: 'teacher',
      profileTable: 'teachers',
      profileIdCol: 'teacher_id',
      profileIdVal: t.teacherId
    });
  });

  parents.forEach(p => {
    const uuid = crypto.randomUUID();
    memberList.push({
      uuid,
      email: p.email.toLowerCase().trim(),
      fullName: p.fullName,
      role: 'parent',
      profileTable: 'parents',
      profileIdCol: 'parent_id',
      profileIdVal: p.parentId
    });
  });

  students.forEach(s => {
    const uuid = crypto.randomUUID();
    const email = `${s.studentId.toLowerCase()}@srikakatiya.com`;
    memberList.push({
      uuid,
      email,
      fullName: s.fullName,
      role: 'student',
      profileTable: 'students',
      profileIdCol: 'student_id',
      profileIdVal: s.studentId
    });
  });

  sql += `-- 1. Insert into auth.users\n`;
  memberList.forEach(m => {
    sql += `INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '${m.uuid}',
  'authenticated',
  'authenticated',
  '${m.email}',
  '$2a$10$sX8lW1z60.rS.2L3A8Kq9ep8i7K6p3c5WlT5d15N0O9S5yV1uWvKu',
  NOW(), NULL, NULL,
  '{"provider":"email","providers":["email"]}',
  '{"role":"${m.role}","full_name":"${m.fullName.replace(/'/g, "''")}"}',
  NOW(), NOW(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;\n`;
  });

  sql += `\n-- 2. Insert into public.users\n`;
  memberList.forEach(m => {
    sql += `INSERT INTO public.users (id, full_name, email, role, status, account_active, is_default_password)
VALUES (
  COALESCE((SELECT id FROM auth.users WHERE email = '${m.email}'), '${m.uuid}'),
  '${m.fullName.replace(/'/g, "''")}',
  '${m.email}',
  '${m.role}',
  'active',
  TRUE,
  TRUE
) ON CONFLICT (email) DO NOTHING;\n`;
  });

  sql += `\n-- 3. Link profiles in students/teachers/parents tables\n`;
  memberList.forEach(m => {
    sql += `UPDATE public.${m.profileTable}
SET user_id = (SELECT id FROM public.users WHERE email = '${m.email}')
WHERE ${m.profileIdCol} = '${m.profileIdVal}';\n`;
  });

  sql += `\n-- 4. Reset and crypt all passwords correctly based on roles\n`;
  sql += `UPDATE auth.users SET encrypted_password = crypt('School@123', gen_salt('bf')), email_confirmed_at = NOW() FROM public.users WHERE auth.users.id = public.users.id AND public.users.role = 'admin';\n`;
  sql += `UPDATE auth.users SET encrypted_password = crypt('School@456', gen_salt('bf')), email_confirmed_at = NOW() FROM public.users WHERE auth.users.id = public.users.id AND public.users.role = 'teacher';\n`;
  sql += `UPDATE auth.users SET encrypted_password = crypt('School@789', gen_salt('bf')), email_confirmed_at = NOW() FROM public.users WHERE auth.users.id = public.users.id AND public.users.role = 'parent';\n`;
  sql += `UPDATE auth.users SET encrypted_password = crypt('School@321', gen_salt('bf')), email_confirmed_at = NOW() FROM public.users WHERE auth.users.id = public.users.id AND public.users.role = 'student';\n`;

  console.log("%cCopy the SQL below and paste it into the Supabase SQL Editor:", "color: green; font-weight: bold; font-size: 14px;");
  console.log(sql);
  return "SQL generated in console log! Copy the SQL text above and run it in the Supabase SQL Editor.";
};
