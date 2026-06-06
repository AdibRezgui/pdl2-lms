package com.eduai.lms.repository;

import com.eduai.lms.model.ChatMessage;
import com.eduai.lms.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findByUserOrderByCreatedAtAsc(User user);
    List<ChatMessage> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
}
