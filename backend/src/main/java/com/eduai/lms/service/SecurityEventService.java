package com.eduai.lms.service;

import com.eduai.lms.model.SecurityEvent;
import com.eduai.lms.model.enums.EventSeverity;
import com.eduai.lms.model.enums.EventType;
import com.eduai.lms.repository.SecurityEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityEventService {

    private final SecurityEventRepository repository;

    private static final int MAX_PAYLOAD = 500;

    @Transactional
    public void record(EventType type, EventSeverity severity,
                       String sourceIp, String requestPath,
                       String httpMethod, String payload, String userAgent) {
        try {
            String truncated = payload != null && payload.length() > MAX_PAYLOAD
                    ? payload.substring(0, MAX_PAYLOAD) + "…"
                    : payload;

            SecurityEvent event = SecurityEvent.builder()
                    .type(type)
                    .severity(severity)
                    .sourceIp(sourceIp)
                    .requestPath(requestPath)
                    .httpMethod(httpMethod)
                    .payload(truncated)
                    .userAgent(userAgent)
                    .build();
            repository.save(event);
        } catch (Exception e) {
            log.error("[SECURITY] Échec persistance événement type={}: {}", type, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<SecurityEvent> getEvents(EventType type, EventSeverity severity, Pageable pageable) {
        if (type != null && severity != null) return repository.findByTypeAndSeverity(type, severity, pageable);
        if (type != null)     return repository.findByType(type, pageable);
        if (severity != null) return repository.findBySeverity(severity, pageable);
        return repository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("total", repository.count());
        stats.put("HIGH",  repository.countBySeverity(EventSeverity.HIGH));
        stats.put("MEDIUM", repository.countBySeverity(EventSeverity.MEDIUM));
        for (EventType type : EventType.values()) {
            stats.put(type.name(), repository.countByType(type));
        }
        return stats;
    }
}
