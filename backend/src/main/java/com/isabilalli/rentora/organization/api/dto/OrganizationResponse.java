package com.isabilalli.rentora.organization.api.dto;

import com.isabilalli.rentora.organization.domain.OrganizationRole;

// An organization the current user belongs to, with their role in it so the app can show what that role allows.
public record OrganizationResponse(
    Long id, String name, OrganizationRole role
) {
}