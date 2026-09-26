package com.isabilalli.rentora.auth.application;

import com.isabilalli.rentora.auth.api.dto.CreateUserRequest;
import com.isabilalli.rentora.auth.api.dto.UserResponse;
import com.isabilalli.rentora.auth.domain.User;
import com.isabilalli.rentora.auth.infrastructure.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(CreateUserRequest request) {

        String passwordHash = passwordEncoder.encode(request.password());

        User user = new User(
                request.firstName(),
                request.lastName(),
                request.email(),
                passwordHash
        );
        toResponse(user);
        return userRepository.save(user);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail()
        );
    }
}