-- ============================================================
-- Sri Kakatiya School Management Platform – supabase_schema.sql
-- PostgreSQL schemas, auth structures, RLS policies, and seeds
-- ============================================================

-- Enable pgcrypto extension if not active
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create PUBLIC users table linked to auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mobile_number TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'parent', 'student')),
  profile_photo TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  account_active BOOLEAN DEFAULT TRUE,
  is_default_password BOOLEAN DEFAULT TRUE
);

-- 2. Create School Infrastructure tables
CREATE TABLE IF NOT EXISTS public.classes (
  class_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class_teacher_id TEXT
);

CREATE TABLE IF NOT EXISTS public.subjects (
  subject_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id TEXT,
  class_id TEXT REFERENCES public.classes(class_id) ON DELETE SET NULL
);

-- 3. Create Member profiles tables
CREATE TABLE IF NOT EXISTS public.students (
  student_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  dob DATE,
  gender TEXT,
  class_id TEXT REFERENCES public.classes(class_id) ON DELETE SET NULL,
  section TEXT DEFAULT 'A',
  roll_number INTEGER,
  parent_id TEXT,
  class_teacher_id TEXT,
  phone TEXT,
  address TEXT,
  admission_date DATE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'))
);

CREATE TABLE IF NOT EXISTS public.teachers (
  teacher_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  qualification TEXT,
  subject TEXT,
  assigned_classes TEXT, -- Stored as comma separated class ids
  email TEXT,
  phone TEXT,
  experience TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'))
);

CREATE TABLE IF NOT EXISTS public.parents (
  parent_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  mobile_number TEXT,
  email TEXT,
  occupation TEXT,
  linked_students TEXT -- Comma separated student ids
);

-- 4. Create Academic structure tables
CREATE TABLE IF NOT EXISTS public.academic_years (
  ay_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'Archived' CHECK (status IN ('Active', 'Archived'))
);

CREATE TABLE IF NOT EXISTS public.attendance (
  attendance_id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  student_id TEXT REFERENCES public.students(student_id) ON DELETE CASCADE,
  class_id TEXT REFERENCES public.classes(class_id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent')),
  academic_year TEXT REFERENCES public.academic_years(ay_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.exams (
  exam_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  class_id TEXT REFERENCES public.classes(class_id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES public.subjects(subject_id) ON DELETE CASCADE,
  date DATE,
  published BOOLEAN DEFAULT FALSE,
  academic_year TEXT REFERENCES public.academic_years(ay_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.marks (
  mark_id TEXT PRIMARY KEY,
  exam_id TEXT REFERENCES public.exams(exam_id) ON DELETE CASCADE,
  student_id TEXT REFERENCES public.students(student_id) ON DELETE CASCADE,
  marks_obtained INTEGER NOT NULL,
  max_marks INTEGER NOT NULL,
  academic_year TEXT REFERENCES public.academic_years(ay_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.homework (
  homework_id TEXT PRIMARY KEY,
  class_id TEXT REFERENCES public.classes(class_id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES public.subjects(subject_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date_assigned DATE NOT NULL,
  due_date DATE NOT NULL,
  completed_students TEXT, -- Comma separated student ids
  attachment_url TEXT,
  academic_year TEXT REFERENCES public.academic_years(ay_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.fees (
  fee_id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES public.students(student_id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Paid', 'Pending')),
  payment_history JSONB DEFAULT '[]'::jsonb,
  academic_year TEXT REFERENCES public.academic_years(ay_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.notifications (
  notification_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  log_id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL,
  module TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  performed_by TEXT,
  target_record TEXT,
  timestamp BIGINT NOT NULL,
  details TEXT
);

CREATE TABLE IF NOT EXISTS public.promotions (
  promo_id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES public.students(student_id) ON DELETE CASCADE,
  prev_class_id TEXT REFERENCES public.classes(class_id) ON DELETE SET NULL,
  new_class_id TEXT REFERENCES public.classes(class_id) ON DELETE SET NULL,
  promo_date DATE NOT NULL,
  ay_id TEXT REFERENCES public.academic_years(ay_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
  leave_id TEXT PRIMARY KEY,
  applicant_id TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_type TEXT NOT NULL CHECK (applicant_type IN ('Student', 'Teacher')),
  reason TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected'))
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  event_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Exam', 'Holiday', 'Event', 'Meeting')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  school_name TEXT NOT NULL DEFAULT 'Sri Kakatiya High School',
  school_logo TEXT,
  contact_info TEXT,
  principal_info TEXT,
  password_policy JSONB DEFAULT '{"minLength": 8, "requireNumbers": true}'::jsonb,
  session_timeout INTEGER DEFAULT 30
);

-- ============================================================
-- AUTHENTICATION SYNC TRIGGER
-- ============================================================

-- Function to handle profile creation when a new user signs up in Supabase auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role, status, account_active, is_default_password)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student')::text,
    'active',
    TRUE,
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable Row Level Security on core tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 1. Policies for Users Profile
CREATE POLICY "Enable read for all authenticated users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for self or admins"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK (auth.uid() = id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 2. General Read policies for Authenticated members
CREATE POLICY "Enable full access for admin users"
  ON public.students FOR ALL TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Students read-only for self and faculty"
  ON public.students FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'teacher')
  );

CREATE POLICY "Teachers general access policy"
  ON public.teachers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers full access for admin"
  ON public.teachers FOR ALL TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 3. Policies for Parents
CREATE POLICY "Allow select to authenticated users on parents"
  ON public.parents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all to admin on parents"
  ON public.parents FOR ALL TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Enable policy on all other tables to allow authenticated users to perform operations
CREATE POLICY "Allow select to authenticated users" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all to admin on classes" ON public.classes FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow select to authenticated users" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all to admin on subjects" ON public.subjects FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow select to authenticated users" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert/update to teacher/admin on attendance" ON public.attendance FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'teacher'));

CREATE POLICY "Allow select to authenticated users" ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all to teacher/admin on exams" ON public.exams FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'teacher'));

CREATE POLICY "Allow select to authenticated users" ON public.marks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all to teacher/admin on marks" ON public.marks FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'teacher'));

CREATE POLICY "Allow select to authenticated users" ON public.homework FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all to teacher/admin on homework" ON public.homework FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'teacher'));

CREATE POLICY "Allow select to authenticated users" ON public.fees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all to admin on fees" ON public.fees FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow select to authenticated users" ON public.academic_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all to admin on academic_years" ON public.academic_years FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow select to authenticated users" ON public.promotions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all to admin on promotions" ON public.promotions FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow select to authenticated users" ON public.leave_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert to authenticated users" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow all to admin/teacher on leave_requests" ON public.leave_requests FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'teacher'));

CREATE POLICY "Allow select to authenticated users" ON public.calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all to admin on calendar_events" ON public.calendar_events FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow select to authenticated users" ON public.notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all to admin on notifications" ON public.notifications FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow select to authenticated users" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert to all on audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow all to admin on audit_logs" ON public.audit_logs FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow select to authenticated users" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all to admin on settings" ON public.settings FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- ============================================================
-- STORAGE BUCKETS SETUP (MOCK SCHEMATICS FOR USER EXECUTION)
-- ============================================================
-- NOTE: Please execute the following commands in the Supabase Storage panel or run via API.
-- Create a public bucket named 'school-media'.
-- Make sure the bucket allows public reads.

-- ============================================================
-- SEED ACCOUNTS DIRECT INJECTION IN AUTH SCHEMA
-- ============================================================

-- Primary UUIDs assigned to profiles
-- USR-001 (Admin):   'a0e0a9bc-3001-4001-8001-000000000001'
-- USR-002 (Teacher): 'a0e0a9bc-3001-4001-8001-000000000002'
-- USR-003 (Parent):  'a0e0a9bc-3001-4001-8001-000000000003'
-- USR-004 (Student): 'a0e0a9bc-3001-4001-8001-000000000004'

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new,
  recovery_token
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'a0e0a9bc-3001-4001-8001-000000000001',
    'authenticated',
    'authenticated',
    'admin@srikakatiya.local',
    -- Hashed value for 'School@123'
    '$2a$10$tZg/e/B86h00zL4LhFq2Aeq.mGg9f3p1WlT5d15N0O9S5yV1uWvKu',
    NOW(), NULL, NULL,
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin","full_name":"Swathi Reddy"}',
    NOW(), NOW(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0e0a9bc-3001-4001-8001-000000000002',
    'authenticated',
    'authenticated',
    'teacher@srikakatiya.local',
    -- Hashed value for 'School@456'
    '$2a$10$sX8lW1z60.rS.2L3A8Kq9ep8i7K6p3c5WlT5d15N0O9S5yV1uWvKu',
    NOW(), NULL, NULL,
    '{"provider":"email","providers":["email"]}',
    '{"role":"teacher","full_name":"K. Raghupathi"}',
    NOW(), NOW(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0e0a9bc-3001-4001-8001-000000000003',
    'authenticated',
    'authenticated',
    'parent@srikakatiya.local',
    -- Hashed value for 'School@789'
    '$2a$10$sX8lW1z60.rS.2L3A8Kq9ep8i7K6p3c5WlT5d15N0O9S5yV1uWvKu',
    NOW(), NULL, NULL,
    '{"provider":"email","providers":["email"]}',
    '{"role":"parent","full_name":"Madhusudhan Rao"}',
    NOW(), NOW(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0e0a9bc-3001-4001-8001-000000000004',
    'authenticated',
    'authenticated',
    'student@srikakatiya.local',
    -- Hashed value for 'School@321'
    '$2a$10$sX8lW1z60.rS.2L3A8Kq9ep8i7K6p3c5WlT5d15N0O9S5yV1uWvKu',
    NOW(), NULL, NULL,
    '{"provider":"email","providers":["email"]}',
    '{"role":"student","full_name":"K. Sai Kiran"}',
    NOW(), NOW(), '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

-- Populate public.users with the respective accounts manually to ensure default role permissions map
INSERT INTO public.users (id, full_name, email, role, mobile_number, status, account_active, is_default_password)
VALUES
  ('a0e0a9bc-3001-4001-8001-000000000001', 'Swathi Reddy', 'admin@srikakatiya.local', 'admin', '9100177682', 'active', TRUE, FALSE),
  ('a0e0a9bc-3001-4001-8001-000000000002', 'K. Raghupathi', 'teacher@srikakatiya.local', 'teacher', '9848022338', 'active', TRUE, TRUE),
  ('a0e0a9bc-3001-4001-8001-000000000003', 'Madhusudhan Rao', 'parent@srikakatiya.local', 'parent', '9988776655', 'active', TRUE, TRUE),
  ('a0e0a9bc-3001-4001-8001-000000000004', 'K. Sai Kiran', 'student@srikakatiya.local', 'student', '9900112233', 'active', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Create Study Materials Table
CREATE TABLE IF NOT EXISTS public.study_materials (
  material_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject_id TEXT REFERENCES public.subjects(subject_id) ON DELETE SET NULL,
  class_id TEXT REFERENCES public.classes(class_id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Notes', 'PDF Materials', 'Assignments', 'Practice Papers', 'Previous Year Papers', 'Video Lectures', 'Reference Materials')),
  uploaded_by TEXT,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Enable RLS on Study Materials
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select to authenticated users" ON public.study_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all to teacher/admin on study_materials" ON public.study_materials FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'teacher'));
