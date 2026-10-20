package com.isabilalli.rentora.organization.api.dto;

import com.isabilalli.rentora.organization.domain.OrganizationRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

// Adds someone who already has a Rentora account, found by the email they signed up with.
public record AddMemberRequest(
        @NotBlank
        @Email
        String email,

        // MANAGER or MEMBER; ownership is never handed out this way.
        @NotNull
        OrganizationRole role
) {
}
