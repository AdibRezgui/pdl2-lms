package com.eduai.lms.controller;

import com.eduai.lms.dto.response.ApiResponse;
import com.eduai.lms.dto.response.PageResponse;
import com.eduai.lms.dto.response.SecurityEventResponse;
import com.eduai.lms.model.SecurityEvent;
import com.eduai.lms.model.enums.EventSeverity;
import com.eduai.lms.model.enums.EventType;
import com.eduai.lms.service.SecurityEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/security-events")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class SecurityEventController {

    private final SecurityEventService securityEventService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<SecurityEventResponse>>> list(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String severity) {

        EventType   eventType     = type     != null ? EventType.valueOf(type.toUpperCase())         : null;
        EventSeverity eventSev    = severity != null ? EventSeverity.valueOf(severity.toUpperCase())  : null;

        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<SecurityEvent> events = securityEventService.getEvents(eventType, eventSev, pageable);

        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(events.map(SecurityEventResponse::from))));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> stats() {
        return ResponseEntity.ok(ApiResponse.ok(securityEventService.getStats()));
    }
}
