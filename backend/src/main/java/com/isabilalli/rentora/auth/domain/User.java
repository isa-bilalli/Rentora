package com.isabilalli.rentora.auth.domain;

import java.time.OffsetDateTime;

import jakarta.persistence.*;;

@Entity 
@Table (name = "users")
public class User {
    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    @Column (nullable = false, length = 100)
    private String firstName;

    @Column (nullable = false, length = 100)
    private String lastName;

    @Column (nullable = false, length = 255)
    private String email;

    @Column (name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column (nullable = false)
    private OffsetDateTime createdAt;

    @Column (nullable = false)
    private OffsetDateTime updatedAt;

    protected User(){

    }

    public User(String firstName, String lastName, String email, String passwordHash){
        this.firstName=firstName;
        this.lastName=lastName;
        this.email=email;
        this.passwordHash=passwordHash;
        this.createdAt=OffsetDateTime.now();
        this.updatedAt=OffsetDateTime.now();
    }

    public Long getId(){
        return id;
    }

    public String getFirstName(){
        return firstName;
    }

    public String getLastName(){
        return lastName;
    }

    public String getEmail(){
        return email;
    }

    public String getPasswordHash(){
        return passwordHash;
    }

    public OffsetDateTime getCreatedAt(){
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt(){
        return updatedAt;
    }
}
