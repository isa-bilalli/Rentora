package com.isabilalli.rentora.tenant.api;

import java.util.stream.Collectors;
import java.util.stream.Stream;

// A tenant's name as the app shows it, the same rule as the frontend's getTenantDisplayName: the person's name,
// else the company's, else the tenant's number. For lists that read a tenant's name fields beside their own rows.
public final class TenantDisplayName {

    private TenantDisplayName() {
    }

    public static String of(String firstName, String lastName, String companyName, Long tenantId) {
        String person = Stream.of(firstName, lastName)
                .filter(part -> part != null && !part.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(" "));
        if (!person.isEmpty()) {
            return person;
        }
        if (companyName != null && !companyName.isBlank()) {
            return companyName.trim();
        }
        return "Tenant #" + tenantId;
    }
}
