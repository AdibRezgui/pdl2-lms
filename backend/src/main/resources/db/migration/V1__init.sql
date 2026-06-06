-- EduAI LMS — Initial schema (PostgreSQL)
-- Applied by Flyway on first startup in production (H2 dev profile disables Flyway)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(120)  NOT NULL,
    email      VARCHAR(255)  NOT NULL UNIQUE,
    password   VARCHAR(255)  NOT NULL,
    role       VARCHAR(20)   NOT NULL DEFAULT 'STUDENT',
    avatar     TEXT,
    bio        TEXT,
    active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ── Courses ───────────────────────────────────────────────────────────────────
CREATE TABLE courses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255)   NOT NULL,
    description     TEXT,
    thumbnail       TEXT,
    category        VARCHAR(100),
    level           VARCHAR(50),
    duration_hours  INTEGER        DEFAULT 0,
    price           NUMERIC(10,2)  DEFAULT 0,
    language        VARCHAR(50)    DEFAULT 'Français',
    tags            TEXT[],
    trainer_id      UUID           REFERENCES users(id) ON DELETE SET NULL,
    published       BOOLEAN        NOT NULL DEFAULT FALSE,
    students_count  INTEGER        DEFAULT 0,
    rating          DOUBLE PRECISION DEFAULT 0,
    ratings_count   INTEGER        DEFAULT 0,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_trainer    ON courses(trainer_id);
CREATE INDEX idx_courses_published  ON courses(published);
CREATE INDEX idx_courses_category   ON courses(category);

-- ── Course modules ────────────────────────────────────────────────────────────
CREATE TABLE course_modules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    position    INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_modules_course ON course_modules(course_id);

-- ── Lessons ───────────────────────────────────────────────────────────────────
CREATE TABLE lessons (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id    UUID         NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    content      TEXT,
    video_url    TEXT,
    file_url     TEXT,
    lesson_type  VARCHAR(30)  NOT NULL DEFAULT 'TEXT',
    duration_min INTEGER      DEFAULT 0,
    position     INTEGER      NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lessons_module ON lessons(module_id);

-- ── Enrollments ───────────────────────────────────────────────────────────────
CREATE TABLE enrollments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id       UUID         NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress        INTEGER      NOT NULL DEFAULT 0,
    completed       BOOLEAN      NOT NULL DEFAULT FALSE,
    certificate_url TEXT,
    enrolled_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    UNIQUE(student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course  ON enrollments(course_id);

-- ── Quizzes ───────────────────────────────────────────────────────────────────
CREATE TABLE quizzes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID         NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    time_limit  INTEGER,
    pass_score  INTEGER      DEFAULT 70,
    published   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE questions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id       UUID         NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT         NOT NULL,
    options       TEXT[],
    correct_index INTEGER      NOT NULL,
    explanation   TEXT,
    points        INTEGER      DEFAULT 1,
    position      INTEGER      DEFAULT 0
);

CREATE TABLE quiz_attempts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id      UUID         NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id   UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score        INTEGER      DEFAULT 0,
    passed       BOOLEAN      DEFAULT FALSE,
    answers      JSONB,
    attempted_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attempts_student ON quiz_attempts(student_id);
CREATE INDEX idx_attempts_quiz    ON quiz_attempts(quiz_id);

-- ── Reviews ───────────────────────────────────────────────────────────────────
CREATE TABLE reviews (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id  UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    rating     INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(course_id, student_id)
);

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    message     TEXT,
    type        VARCHAR(50)  NOT NULL DEFAULT 'INFO',
    read        BOOLEAN      NOT NULL DEFAULT FALSE,
    link        TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);

-- ── Password reset tokens ─────────────────────────────────────────────────────
CREATE TABLE password_reset_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token      VARCHAR(128) NOT NULL UNIQUE,
    email      VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_prt_token ON password_reset_tokens(token);
CREATE INDEX idx_prt_email ON password_reset_tokens(email);

-- ── Chat messages ─────────────────────────────────────────────────────────────
CREATE TABLE chat_messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       VARCHAR(20)  NOT NULL,
    content    TEXT         NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_user ON chat_messages(user_id);
