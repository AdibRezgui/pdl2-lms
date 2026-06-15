-- EduAI LMS — Security events table
-- Auto-created by Hibernate in dev/test (H2, ddl-auto=update/create-drop).
-- Applied by Flyway in production (PostgreSQL, ddl-auto=validate).

CREATE TABLE IF NOT EXISTS security_events (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    type         VARCHAR(30)  NOT NULL,
    severity     VARCHAR(10)  NOT NULL,
    source_ip    VARCHAR(45),
    request_path VARCHAR(500),
    http_method  VARCHAR(10),
    payload      TEXT,
    user_agent   TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_type       ON security_events(type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity   ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
