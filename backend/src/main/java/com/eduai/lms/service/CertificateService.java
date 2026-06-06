package com.eduai.lms.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificateService {

    private final FileStorageService fileStorageService;

    public byte[] generateCertificate(String studentName, String courseTitle, String trainerName) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4.rotate(), 40, 40, 40, 40);
            PdfWriter writer = PdfWriter.getInstance(doc, out);
            doc.open();

            PdfContentByte cb = writer.getDirectContent();

            // Outer border
            cb.setColorStroke(new Color(99, 102, 241));
            cb.setLineWidth(4f);
            cb.rectangle(20, 20, doc.getPageSize().getWidth() - 40, doc.getPageSize().getHeight() - 40);
            cb.stroke();

            // Inner border
            cb.setColorStroke(new Color(139, 92, 246));
            cb.setLineWidth(1.5f);
            cb.rectangle(30, 30, doc.getPageSize().getWidth() - 60, doc.getPageSize().getHeight() - 60);
            cb.stroke();

            // Gradient-like header bar
            cb.setColorFill(new Color(99, 102, 241));
            cb.rectangle(20, doc.getPageSize().getHeight() - 120, doc.getPageSize().getWidth() - 40, 100);
            cb.fill();

            BaseFont bold    = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, false);
            BaseFont regular = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, false);
            BaseFont italic  = BaseFont.createFont(BaseFont.HELVETICA_OBLIQUE, BaseFont.CP1252, false);

            float pageW = doc.getPageSize().getWidth();
            float pageH = doc.getPageSize().getHeight();

            // Header text
            cb.beginText();
            cb.setColorFill(Color.WHITE);
            cb.setFontAndSize(bold, 28);
            centerText(cb, "CERTIFICAT DE RÉUSSITE", pageW, pageH - 80);
            cb.endText();

            cb.beginText();
            cb.setColorFill(Color.WHITE);
            cb.setFontAndSize(regular, 13);
            centerText(cb, "EduAI Platform · Formation Professionnelle", pageW, pageH - 105);
            cb.endText();

            // "est décerné à"
            cb.beginText();
            cb.setColorFill(new Color(100, 116, 139));
            cb.setFontAndSize(regular, 14);
            centerText(cb, "Ce certificat est décerné à", pageW, pageH - 155);
            cb.endText();

            // Student name — large
            cb.beginText();
            cb.setColorFill(new Color(15, 23, 42));
            cb.setFontAndSize(bold, 36);
            centerText(cb, studentName, pageW, pageH - 210);
            cb.endText();

            // Separator line
            cb.setColorStroke(new Color(99, 102, 241));
            cb.setLineWidth(1.5f);
            float sepW = 200;
            cb.moveTo((pageW - sepW) / 2, pageH - 230);
            cb.lineTo((pageW + sepW) / 2, pageH - 230);
            cb.stroke();

            // "pour avoir complété"
            cb.beginText();
            cb.setColorFill(new Color(100, 116, 139));
            cb.setFontAndSize(italic, 14);
            centerText(cb, "pour avoir complété avec succès le cours", pageW, pageH - 265);
            cb.endText();

            // Course title
            cb.beginText();
            cb.setColorFill(new Color(99, 102, 241));
            cb.setFontAndSize(bold, 20);
            centerText(cb, courseTitle, pageW, pageH - 300);
            cb.endText();

            // Date + trainer
            String dateStr = LocalDate.now().format(
                DateTimeFormatter.ofPattern("dd MMMM yyyy", Locale.FRENCH)
            );

            // Left: trainer
            cb.beginText();
            cb.setColorFill(new Color(71, 85, 105));
            cb.setFontAndSize(regular, 11);
            cb.moveText(60, 90);
            cb.showText("Formateur : " + trainerName);
            cb.endText();

            // Right: date
            cb.beginText();
            cb.setColorFill(new Color(71, 85, 105));
            cb.setFontAndSize(regular, 11);
            cb.moveText(pageW - 280, 90);
            cb.showText("Délivré le : " + dateStr);
            cb.endText();

            // Bottom signature line
            cb.setColorStroke(new Color(203, 213, 225));
            cb.setLineWidth(0.8f);
            cb.moveTo(60, 110);
            cb.lineTo(200, 110);
            cb.stroke();
            cb.moveTo(pageW - 220, 110);
            cb.lineTo(pageW - 60, 110);
            cb.stroke();

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate certificate for {}", studentName, e);
            throw new RuntimeException("Impossible de générer le certificat PDF", e);
        }
    }

    public String generateAndStore(String studentName, String courseTitle, String trainerName, String enrollmentId) {
        byte[] pdf = generateCertificate(studentName, courseTitle, trainerName);
        String filename = "cert-" + enrollmentId + ".pdf";
        return fileStorageService.storeCertificate(pdf, filename);
    }

    private void centerText(PdfContentByte cb, String text, float pageW, float y) {
        cb.moveText(0, 0);
        // Use showTextAligned on the canvas directly
        cb.endText();
        cb.beginText();
        cb.setTextMatrix(pageW / 2, y);
        cb.showTextAligned(PdfContentByte.ALIGN_CENTER, text, pageW / 2, y, 0);
    }
}
