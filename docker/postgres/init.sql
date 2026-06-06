-- EduAI Pro — Initial Database Schema
-- Runs once on first container start

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search

-- ── Users ──────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'trainer', 'student')),
    avatar      TEXT,
    bio         TEXT,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ── Courses ────────────────────────────────────────────────────────────────────
CREATE TABLE courses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    thumbnail       TEXT,
    category        VARCHAR(100),
    level           VARCHAR(50) CHECK (level IN ('Débutant', 'Intermédiaire', 'Avancé')),
    duration        INTEGER DEFAULT 0,  -- in hours
    price           DECIMAL(10,2) DEFAULT 0,
    language        VARCHAR(50) DEFAULT 'Français',
    tags            TEXT[],
    trainer_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    is_published    BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_trainer ON courses(trainer_id);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_title ON courses USING gin(title gin_trgm_ops);

-- ── Modules ────────────────────────────────────────────────────────────────────
CREATE TABLE modules (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id   UUID REFERENCES courses(id) ON DELETE CASCADE,
    title       VARCHAR(500) NOT NULL,
    description TEXT,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Lessons ────────────────────────────────────────────────────────────────────
CREATE TABLE lessons (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id   UUID REFERENCES modules(id) ON DELETE CASCADE,
    course_id   UUID REFERENCES courses(id) ON DELETE CASCADE,
    title       VARCHAR(500) NOT NULL,
    type        VARCHAR(20) CHECK (type IN ('video', 'pdf', 'quiz', 'text')),
    content     TEXT,
    video_url   TEXT,
    pdf_url     TEXT,
    duration    INTEGER DEFAULT 0,  -- in minutes
    sort_order  INTEGER DEFAULT 0,
    is_free     BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Enrollments ────────────────────────────────────────────────────────────────
CREATE TABLE enrollments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id           UUID REFERENCES courses(id) ON DELETE CASCADE,
    progress            INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    is_completed        BOOLEAN DEFAULT false,
    completed_at        TIMESTAMPTZ,
    certificate_url     TEXT,
    last_accessed_at    TIMESTAMPTZ DEFAULT NOW(),
    enrolled_at         TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- ── Lesson progress ────────────────────────────────────────────────────────────
CREATE TABLE lesson_progress (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id   UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE,
    is_completed    BOOLEAN DEFAULT false,
    watch_time      INTEGER DEFAULT 0,  -- in seconds
    completed_at    TIMESTAMPTZ,
    UNIQUE(enrollment_id, lesson_id)
);

-- ── Quizzes ────────────────────────────────────────────────────────────────────
CREATE TABLE quizzes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE,
    course_id       UUID REFERENCES courses(id) ON DELETE CASCADE,
    title           VARCHAR(500) NOT NULL,
    time_limit      INTEGER DEFAULT 15,  -- in minutes
    passing_score   INTEGER DEFAULT 70,
    max_attempts    INTEGER DEFAULT 3,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE questions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id         UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    text            TEXT NOT NULL,
    type            VARCHAR(30) DEFAULT 'multiple_choice',
    options         JSONB,
    correct_answer  JSONB,
    explanation     TEXT,
    points          INTEGER DEFAULT 1,
    sort_order      INTEGER DEFAULT 0
);

CREATE TABLE quiz_attempts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id         UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    score           INTEGER DEFAULT 0,
    passed          BOOLEAN DEFAULT false,
    answers         JSONB,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    time_taken      INTEGER  -- in seconds
);

-- ── Reviews ────────────────────────────────────────────────────────────────────
CREATE TABLE reviews (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id   UUID REFERENCES courses(id) ON DELETE CASCADE,
    rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- ── Chat messages ──────────────────────────────────────────────────────────────
CREATE TABLE chat_messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(20) CHECK (role IN ('user', 'assistant')),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_user ON chat_messages(user_id, created_at DESC);

-- ── Notifications ──────────────────────────────────────────────────────────────
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    message     TEXT,
    type        VARCHAR(20) DEFAULT 'info',
    is_read     BOOLEAN DEFAULT false,
    link        TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifs_user ON notifications(user_id, is_read, created_at DESC);

-- ── Seed: Admin user ───────────────────────────────────────────────────────────
-- Password: Admin@1234 (bcrypt hashed — change in production!)
INSERT INTO users (name, email, password, role) VALUES
('Sami Trabelsi', 'admin@eduai.tn', '$2b$12$placeholder_hash_change_me', 'admin');

COMMENT ON DATABASE eduai_db IS 'EduAI Pro — Intelligent Learning Management System';
