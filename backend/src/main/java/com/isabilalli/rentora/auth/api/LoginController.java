package com.isabilalli.rentora.auth.api;

import com.isabilalli.rentora.auth.api.dto.LoginRequest;
import com.isabilalli.rentora.auth.api.dto.LoginResponse;
import com.isabilalli.rentora.auth.api.dto.UserResponse;
import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.application.LoginService;
import com.isabilalli.rentora.auth.application.UserService;
import com.isabilalli.rentora.auth.domain.User;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;


@RestController 
@RequestMapping("/api/auth") 
public class LoginController {
    private final CurrentUserService currentUserService;
    private final LoginService loginService;
    private final UserService userService;

    public LoginController(LoginService loginService, CurrentUserService currentUserService, UserService userService){
        this.loginService=loginService;
        this.currentUserService = currentUserService;
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(loginService.login(request));
    }
    
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        AuthenticatedUser currentUser = currentUserService.getCurrentUser();
        User user = userService.findById(currentUser.userId());
        return ResponseEntity.ok(UserResponse.from(user));
    }
    
}
