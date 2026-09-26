package com.isabilalli.rentora.tenant.api.dto;

import com.isabilalli.rentora.tenant.domain.TenantType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTenantRequest(

        @NotNull
        TenantType type,

        @Size(max = 100)
        String firstName,

        @Size(max = 100)
        String lastName,

        @Size(max = 150)
        String companyName,

        @Email
        @Size(max = 255)
        String email,

        @Size(max = 50)
        String phone
) {
}