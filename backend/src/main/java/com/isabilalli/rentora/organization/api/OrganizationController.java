package com.isabilalli.rentora.organization.api;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.isabilalli.rentora.organization.api.dto.AddMemberRequest;
import com.isabilalli.rentora.organization.api.dto.MemberResponse;
import com.isabilalli.rentora.organization.api.dto.OrganizationResponse;
import com.isabilalli.rentora.organization.application.OrganizationService;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

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

    @GetMapping("/{organizationId}/members")
    public ResponseEntity<List<MemberResponse>> getMembers(@PathVariable Long organizationId) {
        return ResponseEntity.ok(organizationService.getMembers(organizationId));
    }

    @PostMapping("/{organizationId}/members")
    public ResponseEntity<MemberResponse> addMember(@PathVariable Long organizationId, @Valid @RequestBody AddMemberRequest request) {
        MemberResponse response = organizationService.addMember(organizationId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
