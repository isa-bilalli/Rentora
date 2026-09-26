package com.isabilalli.rentora.test.api;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;

@RestController 
public class SecurityTestController {
    @GetMapping("/api/test/protected")
    public String protectedEndpoint(Authentication auth) {
        return "Authenticated as user ID: " + auth.getPrincipal();
    }
        
}
