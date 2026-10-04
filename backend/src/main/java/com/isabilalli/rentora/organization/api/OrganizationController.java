package com.isabilalli.rentora.organization.api;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.isabilalli.rentora.organization.api.dto.OrganizationResponse;
import com.isabilalli.rentora.organization.application.OrganizationService;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping("/mine")
    public ResponseEntity<List<OrganizationResponse>> getMyOrganizations() {
        return ResponseEntity.ok(organizationService.getMyOrganizations());
    }
}
