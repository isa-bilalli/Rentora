package com.isabilalli.rentora.property.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.isabilalli.rentora.property.api.dto.CreatePropertyRequest;
import com.isabilalli.rentora.property.api.dto.PropertyResponse;
import com.isabilalli.rentora.property.application.PropertyService;

import jakarta.validation.Valid;

@RestController 
@RequestMapping("/api/organizations/{organizationId}/properties")
public class PropertyController {
    private final PropertyService propertyService;

    public PropertyController(PropertyService propertyService){
        this.propertyService=propertyService;
    }

    @PostMapping
    public ResponseEntity<PropertyResponse> createProperty(@PathVariable Long organizationId, @Valid @RequestBody CreatePropertyRequest request){
        PropertyResponse response = propertyService.createProperty(organizationId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping 
    public ResponseEntity<List<PropertyResponse>> getProperties(@PathVariable Long organizationId){
        return ResponseEntity.ok(propertyService.getProperties(organizationId));
    }
}
