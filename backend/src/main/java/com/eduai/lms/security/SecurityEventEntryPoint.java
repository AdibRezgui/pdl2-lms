package com.eduai.lms.security;

import com.eduai.lms.model.enums.EventSeverity;
import com.eduai.lms.model.enums.EventType;
import com.eduai.lms.service.SecurityEventService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Renvoie HTTP 401 pour toute requête non authentifiée sur un endpoint protégé
 * et enregistre un SecurityEvent de type UNAUTHORIZED_ACCESS.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class SecurityEventEntryPoint implements AuthenticationEntryPoint {

    private final SecurityEventService securityEventService;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        String ip = getIp(request);
        log.warn("[SECURITY] UNAUTHORIZED_ACCESS | IP={} | Path={}", ip, request.getServletPath());
        securityEventService.record(
                EventType.UNAUTHORIZED_ACCESS, EventSeverity.MEDIUM,
                ip, request.getServletPath(),
                request.getMethod(),
                authException.getMessage(),
                request.getHeader("User-Agent"));
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
    }

    private String getIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",")[0].trim();
        return req.getRemoteAddr();
    }
}
