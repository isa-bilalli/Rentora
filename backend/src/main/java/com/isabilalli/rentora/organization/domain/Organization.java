package com.isabilalli.rentora.organization.domain;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table (name="organizations")
public class Organization {
    
    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;
    @Column (nullable = false, length = 150)
    private String name;
    @Column (nullable = false)
    private OffsetDateTime createdAt;
    @Column (nullable = false)
    private OffsetDateTime updatedAt;

    protected Organization(){

    }

    public Organization(String name){
        this.name=name;
        createdAt=OffsetDateTime.now();
        updatedAt=OffsetDateTime.now();
    }

    public Long getId(){
        return id;
    }

    public String getName(){
        return name;
    }

    public void rename(String name){
        this.name=name;
    }

    public OffsetDateTime getCreatedAt(){
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt(){
        return updatedAt;
    }

}
