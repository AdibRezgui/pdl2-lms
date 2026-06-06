package com.eduai.lms.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
        "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final Set<String> ALLOWED_DOC_TYPES = Set.of(
        "application/pdf", "video/mp4", "video/webm"
    );
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5 MB
    private static final long MAX_DOC_SIZE   = 50 * 1024 * 1024; // 50 MB

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @PostConstruct
    public void init() throws IOException {
        Files.createDirectories(Paths.get(uploadDir, "avatars"));
        Files.createDirectories(Paths.get(uploadDir, "thumbnails"));
        Files.createDirectories(Paths.get(uploadDir, "courses"));
        Files.createDirectories(Paths.get(uploadDir, "certificates"));
        log.info("Upload directories initialized at {}", uploadDir);
    }

    public String storeAvatar(MultipartFile file) {
        validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
        return store(file, "avatars");
    }

    public String storeThumbnail(MultipartFile file) {
        validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
        return store(file, "thumbnails");
    }

    public String storeCourseFile(MultipartFile file) {
        validateFile(file, ALLOWED_DOC_TYPES, MAX_DOC_SIZE);
        return store(file, "courses");
    }

    public String storeCertificate(byte[] pdfBytes, String filename) {
        try {
            Path dest = Paths.get(uploadDir, "certificates", filename);
            Files.write(dest, pdfBytes);
            return "/uploads/certificates/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Impossible de sauvegarder le certificat", e);
        }
    }

    public void delete(String relativePath) {
        try {
            if (relativePath == null || relativePath.isBlank()) return;
            Path file = Paths.get(uploadDir).resolve(
                relativePath.replaceFirst("^/uploads/", "")
            ).normalize();
            if (file.startsWith(Paths.get(uploadDir))) {
                Files.deleteIfExists(file);
            }
        } catch (IOException e) {
            log.warn("Could not delete file {}: {}", relativePath, e.getMessage());
        }
    }

    private String store(MultipartFile file, String subDir) {
        String ext = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + ext;
        try {
            Path dest = Paths.get(uploadDir, subDir, filename);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + subDir + "/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Impossible de stocker le fichier: " + e.getMessage(), e);
        }
    }

    private void validateFile(MultipartFile file, Set<String> allowed, long maxSize) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier est vide");
        }
        if (!allowed.contains(file.getContentType())) {
            throw new IllegalArgumentException("Type de fichier non autorisé: " + file.getContentType());
        }
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("Fichier trop volumineux (max " + (maxSize / 1024 / 1024) + " MB)");
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int idx = filename.lastIndexOf('.');
        return idx >= 0 ? filename.substring(idx).toLowerCase() : "";
    }
}
