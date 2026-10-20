package com.isabilalli.rentora.organization.api.dto;

import com.isabilalli.rentora.organization.domain.OrganizationMembership;
import com.isabilalli.rentora.organization.domain.OrganizationRole;

import java.time.OffsetDateTime;

public record MemberResponse(
        Long userId,
        String firstName,
        String lastName,
        String email,
        OrganizationRole role,
        OffsetDateTime joinedAt
) {
    public static MemberResponse from(OrganizationMembership membership) {
        return new MemberResponse(
                membership.getUser().getId(),
                membership.getUser().getFirstName(),
                membership.getUser().getLastName(),
                membership.getUser().getEmail(),
                membership.getRole(),
                membership.getCreatedAt()
        );
    }
}
