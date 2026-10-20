package com.isabilalli.rentora.organization.domain;

// Listed from most to least access: each role may do everything the roles below it may.
// docs/ROLES.md lists which actions need which role.
public enum OrganizationRole {
    OWNER,
    MANAGER,
    MEMBER;

    public boolean isAtLeast(OrganizationRole minimum) {
        return ordinal() <= minimum.ordinal();
    }
}
