package com.isabilalli.rentora.auth.infrastructure;

import com.isabilalli.rentora.auth.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
}
