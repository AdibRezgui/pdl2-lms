package com.eduai.lms.service;

import com.eduai.lms.dto.request.ChangePasswordRequest;
import com.eduai.lms.dto.request.UpdateProfileRequest;
import com.eduai.lms.dto.response.UserResponse;
import com.eduai.lms.model.User;
import com.eduai.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse updateProfile(User user, UpdateProfileRequest request) {
        user.setName(request.getName());
        user.setAvatar(request.getAvatar());
        user.setBio(request.getBio());
        return UserResponse.from(userRepository.save(user));
    }

    public void updateAvatar(User user, String avatarUrl) {
        user.setAvatar(avatarUrl);
        userRepository.save(user);
    }

    public void changePassword(User user, ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Mot de passe actuel incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
