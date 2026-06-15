package com.eduai.lms.model;

import com.eduai.lms.model.enums.EventSeverity;
import com.eduai.lms.model.enums.EventType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "security_events", indexes = {
    @Index(name = "idx_security_events_type",     columnList = "type"),
    @Index(name = "idx_security_events_severity",  columnList = "severity"),
    @Index(name = "idx_security_events_created_at", columnList = "created_at"),
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EventType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private EventSeverity severity;

    @Column(name = "source_ip", length = 45)
    private String sourceIp;

    @Column(name = "request_path")
    private String requestPath;

    @Column(name = "http_method", length = 10)
    private String httpMethod;

    /** Contenu suspect tronqué à 500 caractères */
    @Column(columnDefinition = "TEXT")
    private String payload;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
