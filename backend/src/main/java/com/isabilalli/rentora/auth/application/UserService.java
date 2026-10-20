package com.isabilalli.rentora.auth.application;

import com.isabilalli.rentora.shared.api.ConflictException;
import com.isabilalli.rentora.shared.api.NotFoundException;
import com.isabilalli.rentora.auth.api.dto.CreateUserRequest;
import com.isabilalli.rentora.auth.domain.User;
import com.isabilalli.rentora.auth.infrastructure.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("An account with this email already exists");
        }
        String passwordHash = passwordEncoder.encode(request.password());
        User user = new User(
                request.firstName(),
                request.lastName(),
                request.email(),
                passwordHash
        );
        return userRepository.save(user);
    }
    
    public User findById(Long userId){
        return userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
    }

    // Exact match, as at login.
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}