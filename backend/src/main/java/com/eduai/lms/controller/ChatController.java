package com.eduai.lms.controller;

import com.eduai.lms.dto.request.ChatRequest;
import com.eduai.lms.dto.response.ApiResponse;
import com.eduai.lms.model.ChatMessage;
import com.eduai.lms.model.User;
import com.eduai.lms.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ApiResponse<ChatMessage>> sendMessage(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(
            chatService.saveAndRespond(request.getMessage(), user)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<ChatMessage>>> getHistory(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(chatService.getHistory(user)));
    }
}
