package com.isabilalli.rentora.auth.api;

import com.isabilalli.rentora.auth.api.dto.LoginRequest;
import com.isabilalli.rentora.auth.api.dto.LoginResponse;
import com.isabilalli.rentora.auth.application.LoginService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController 
@RequestMapping("/api/auth") 
public class LoginController {
    private final LoginService loginService;

    public LoginController(LoginService loginService){
        this.loginService=loginService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(loginService.login(request));
    }
    
}
