package com.eduai.lms.security;

import com.eduai.lms.model.enums.EventSeverity;
import com.eduai.lms.model.enums.EventType;
import com.eduai.lms.service.SecurityEventService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${app.rate-limit.capacity:30}")
    private int capacity;

    @Value("${app.rate-limit.refill-per-minute:30}")
    private int refillPerMinute;

    private final SecurityEventService securityEventService;

    public RateLimitFilter(SecurityEventService securityEventService) {
        this.securityEventService = securityEventService;
    }

    private final Cache<String, AtomicInteger> requestCounts = Caffeine.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .maximumSize(10_000)
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        // Only rate-limit auth endpoints (to block brute-force)
        String path = req.getServletPath();
        if (!path.startsWith("/auth/login") && !path.startsWith("/auth/forgot")) {
            chain.doFilter(req, res);
            return;
        }

        String key = getClientKey(req);
        AtomicInteger count = requestCounts.get(key, k -> new AtomicInteger(0));

        if (count.incrementAndGet() > capacity) {
            log.warn("Rate limit exceeded for IP {} on path {}", key, path);
            securityEventService.record(
                    EventType.BRUTE_FORCE, EventSeverity.HIGH,
                    key, path, req.getMethod(),
                    count.get() + " tentatives en 1 min depuis " + key,
                    req.getHeader("User-Agent"));
            res.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            res.setContentType(MediaType.APPLICATION_JSON_VALUE);
            res.setHeader("Retry-After", "60");
            res.getWriter().write(objectMapper.writeValueAsString(Map.of(
                "success", false,
                "message", "Trop de tentatives. Réessayez dans 1 minute.",
                "status", 429
            )));
            return;
        }

        chain.doFilter(req, res);
    }

    private String getClientKey(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
