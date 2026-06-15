package com.eduai.lms.security;

import com.eduai.lms.model.enums.EventSeverity;
import com.eduai.lms.model.enums.EventType;
import com.eduai.lms.service.SecurityEventService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Filtre de détection des attaques en mode observabilité : détecte SQLi, XSS, path traversal
 * et les enregistre en base. Ne bloque PAS la requête (en production on pourrait renvoyer 400).
 *
 * S'auto-enregistre comme filtre servlet standard (avant la chaîne Spring Security)
 * et wrappe la requête dans ContentCachingRequestWrapper pour lire le body APRÈS le contrôleur.
 */
@Component
@Order(1)
@Slf4j
@RequiredArgsConstructor
public class SecurityMonitoringFilter extends OncePerRequestFilter {

    private final SecurityEventService securityEventService;

    // ── Patterns de détection ─────────────────────────────────────────────────

    private static final Pattern SQLI = Pattern.compile(
            "(?:'\\s*(?:OR|AND)\\s*[\\d'\"=])|"   // ' OR 1=1 / ' OR 'x'='x
          + "(?:UNION\\s+(?:ALL\\s+)?SELECT)|"      // UNION SELECT
          + "(?:--\\s)|"                             // -- commentaire SQL
          + "(?:/\\*.*?\\*/)|"                       // /* commentaire */
          + "(?:;\\s*(?:DROP|DELETE|TRUNCATE)\\s+(?:TABLE|FROM|DATABASE))|" // ; DROP TABLE
          + "(?:EXEC\\s*\\()|"                       // EXEC(
          + "(?:(?:INSERT\\s+INTO|UPDATE\\s+\\w+\\s+SET|DELETE\\s+FROM)\\s+\\w+)", // DML
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    private static final Pattern XSS = Pattern.compile(
            "(?:<\\s*script[^>]*>)|"                // <script>
          + "(?:javascript\\s*:)|"                  // javascript:
          + "(?:on(?:error|load|click|mouse\\w+|key\\w+|focus|blur)\\s*=)|" // onerror=…
          + "(?:<\\s*img[^>]+src\\s*=\\s*[\"']?\\s*x\\s*[\"']?)|" // <img src=x>
          + "(?:<\\s*iframe[^>]*>)|"                // <iframe>
          + "(?:eval\\s*\\()|"                      // eval(
          + "(?:document\\.(?:cookie|location|write))", // document.cookie…
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    private static final Pattern PATH_TRAVERSAL = Pattern.compile(
            "(?:\\.{2}[/\\\\])|"                   // ../ ou ..\
          + "(?:/etc/(?:passwd|shadow|hosts))|"     // /etc/passwd
          + "(?:/proc/[a-z])|"
          + "(?:(?:file|jar|zip)://)",
            Pattern.CASE_INSENSITIVE);

    // Chemins pour lesquels on n'effectue pas d'analyse (actuator, console H2…)
    private static final Set<String> SKIP_PREFIXES = Set.of("/actuator", "/h2-console");

    // ── Filtre principal ──────────────────────────────────────────────────────

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String path = request.getServletPath();

        if (isSkipped(path) || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        // Inspecter path traversal sur le chemin avant tout traitement
        inspectPathTraversal(path, request);

        // Inspecter query string avant le contrôleur
        String qs = request.getQueryString();
        if (qs != null) inspectInjections(qs, "query-string", request);

        // Inspecter chaque valeur de paramètre URL
        request.getParameterMap().forEach((k, vals) -> {
            for (String v : vals) inspectInjections(v, "param:" + k, request);
        });

        // Wrapper pour cacher le body (lu par le contrôleur — inspecté après la chaîne)
        ContentCachingRequestWrapper cached = new ContentCachingRequestWrapper(request);

        try {
            chain.doFilter(cached, response);
        } finally {
            // Body disponible ici après que le contrôleur l'ait lu
            String body = new String(cached.getContentAsByteArray(), StandardCharsets.UTF_8);
            if (!body.isBlank() && !isBinary(request.getContentType())) {
                inspectInjections(body, "request-body", request);
            }
        }
    }

    // ── Méthodes de détection ─────────────────────────────────────────────────

    private void inspectPathTraversal(String content, HttpServletRequest req) {
        if (content == null || content.isBlank()) return;
        if (PATH_TRAVERSAL.matcher(content).find()) {
            log.warn("[SECURITY] PATH_TRAVERSAL | IP={} | Path={} | payload={}",
                    getIp(req), req.getServletPath(), truncate(content));
            save(EventType.PATH_TRAVERSAL, EventSeverity.HIGH, req, truncate(content));
        }
    }

    private void inspectInjections(String content, String source, HttpServletRequest req) {
        if (content == null || content.isBlank()) return;

        if (SQLI.matcher(content).find()) {
            log.warn("[SECURITY] SQL_INJECTION | IP={} | Path={} | source={} | payload={}",
                    getIp(req), req.getServletPath(), source, truncate(content));
            save(EventType.SQL_INJECTION, EventSeverity.HIGH, req, truncate(content));
        }

        if (XSS.matcher(content).find()) {
            log.warn("[SECURITY] XSS | IP={} | Path={} | source={} | payload={}",
                    getIp(req), req.getServletPath(), source, truncate(content));
            save(EventType.XSS, EventSeverity.HIGH, req, truncate(content));
        }
    }

    private void save(EventType type, EventSeverity severity, HttpServletRequest req, String payload) {
        securityEventService.record(type, severity,
                getIp(req), req.getServletPath(),
                req.getMethod(), payload,
                req.getHeader("User-Agent"));
    }

    // ── Utilitaires ───────────────────────────────────────────────────────────

    private boolean isSkipped(String path) {
        return SKIP_PREFIXES.stream().anyMatch(path::startsWith);
    }

    private boolean isBinary(String contentType) {
        if (contentType == null) return false;
        return contentType.startsWith("image/")
            || contentType.startsWith("video/")
            || contentType.startsWith("audio/")
            || contentType.equals("application/octet-stream");
    }

    private String getIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",")[0].trim();
        return req.getRemoteAddr();
    }

    private String truncate(String s) {
        return s != null && s.length() > 500 ? s.substring(0, 500) + "…" : s;
    }
}
