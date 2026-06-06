package com.eduai.lms.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.mail.from-name}")
    private String fromName;

    @Value("${app.mail.base-url}")
    private String baseUrl;

    @Async
    public void sendPasswordResetEmail(String toEmail, String userName, String resetToken) {
        String resetLink = baseUrl + "/reset-password?token=" + resetToken;
        String html = """
            <!DOCTYPE html>
            <html>
            <body style="font-family:'Segoe UI',Arial,sans-serif;background:#07091a;margin:0;padding:40px 20px;">
              <div style="max-width:520px;margin:0 auto;background:#101528;border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,.2)">
                <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center">
                  <h1 style="margin:0;color:white;font-size:24px;font-weight:800">EduAI Platform</h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,.75);font-size:14px">Réinitialisation du mot de passe</p>
                </div>
                <div style="padding:32px">
                  <p style="color:#e2e8f0;font-size:15px;margin:0 0 16px">Bonjour <strong>%s</strong>,</p>
                  <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;line-height:1.6">
                    Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
                  </p>
                  <div style="text-align:center;margin:28px 0">
                    <a href="%s" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px">
                      Réinitialiser mon mot de passe
                    </a>
                  </div>
                  <p style="color:#475569;font-size:12px;margin:24px 0 0;text-align:center">
                    Ce lien expire dans <strong style="color:#fbbf24">15 minutes</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                  </p>
                </div>
                <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,.05);text-align:center">
                  <p style="color:#334155;font-size:12px;margin:0">© 2026 EduAI Platform. Tous droits réservés.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(userName, resetLink);

        sendHtmlEmail(toEmail, "Réinitialisation de votre mot de passe — EduAI", html);
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String userName) {
        String html = """
            <!DOCTYPE html>
            <html>
            <body style="font-family:'Segoe UI',Arial,sans-serif;background:#07091a;margin:0;padding:40px 20px;">
              <div style="max-width:520px;margin:0 auto;background:#101528;border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,.2)">
                <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center">
                  <h1 style="margin:0;color:white;font-size:24px;font-weight:800">Bienvenue sur EduAI !</h1>
                </div>
                <div style="padding:32px">
                  <p style="color:#e2e8f0;font-size:15px;margin:0 0 16px">Bonjour <strong>%s</strong>,</p>
                  <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
                    Votre compte a bien été créé sur la plateforme EduAI. Vous pouvez maintenant accéder à tous nos cours et commencer votre apprentissage.
                  </p>
                  <div style="text-align:center">
                    <a href="%s/login" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px">
                      Accéder à la plateforme
                    </a>
                  </div>
                </div>
              </div>
            </body>
            </html>
            """.formatted(userName, baseUrl);

        sendHtmlEmail(toEmail, "Bienvenue sur EduAI Platform !", html);
    }

    @Async
    public void sendCertificateEmail(String toEmail, String userName, String courseTitle) {
        String html = """
            <!DOCTYPE html>
            <html>
            <body style="font-family:'Segoe UI',Arial,sans-serif;background:#07091a;margin:0;padding:40px 20px;">
              <div style="max-width:520px;margin:0 auto;background:#101528;border-radius:16px;overflow:hidden;border:1px solid rgba(52,211,153,.2)">
                <div style="background:linear-gradient(135deg,#059669,#34d399);padding:32px;text-align:center">
                  <h1 style="margin:0;color:white;font-size:24px;font-weight:800">Félicitations !</h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,.85);font-size:14px">Vous avez terminé votre cours</p>
                </div>
                <div style="padding:32px">
                  <p style="color:#e2e8f0;font-size:15px;margin:0 0 16px">Bonjour <strong>%s</strong>,</p>
                  <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 8px">
                    Votre certificat de réussite pour le cours <strong style="color:#34d399">%s</strong> est disponible dans votre espace personnel.
                  </p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(userName, courseTitle);

        sendHtmlEmail(toEmail, "Votre certificat EduAI est prêt !", html);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {}: {}", to, subject);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
