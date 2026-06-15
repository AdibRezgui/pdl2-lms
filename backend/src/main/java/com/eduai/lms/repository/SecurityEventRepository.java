package com.eduai.lms.repository;

import com.eduai.lms.model.SecurityEvent;
import com.eduai.lms.model.enums.EventSeverity;
import com.eduai.lms.model.enums.EventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, UUID> {

    Page<SecurityEvent> findByType(EventType type, Pageable pageable);

    Page<SecurityEvent> findBySeverity(EventSeverity severity, Pageable pageable);

    Page<SecurityEvent> findByTypeAndSeverity(EventType type, EventSeverity severity, Pageable pageable);

    long countByType(EventType type);

    long countBySeverity(EventSeverity severity);
}
