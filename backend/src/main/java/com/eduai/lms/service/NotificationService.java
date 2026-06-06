package com.eduai.lms.service;

import com.eduai.lms.exception.ResourceNotFoundException;
import com.eduai.lms.model.Notification;
import com.eduai.lms.model.User;
import com.eduai.lms.model.enums.NotificationType;
import com.eduai.lms.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public List<Notification> getMyNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public long countUnread(User user) {
        return notificationRepository.countByUserAndReadFalse(user);
    }

    public Notification markRead(UUID id, User user) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification non trouvée"));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public void markAllRead(User user) {
        notificationRepository.markAllReadByUser(user);
    }

    public void deleteNotification(UUID id, User user) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification non trouvée"));
        notificationRepository.delete(notification);
    }

    public Notification send(User recipient, String title, String message, NotificationType type, String link) {
        Notification n = Notification.builder()
                .user(recipient)
                .title(title)
                .message(message)
                .type(type)
                .link(link)
                .build();
        return notificationRepository.save(n);
    }
}
