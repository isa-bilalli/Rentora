package com.isabilalli.rentora.tenant.api;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TenantDisplayNameTest {

    @Test
    void usesThePersonsNameFirst() {
        assertEquals("Liam O'Brien", TenantDisplayName.of(" Liam ", "O'Brien", "Ignored Ltd", 7L));
        assertEquals("Aoife", TenantDisplayName.of("Aoife", "  ", null, 7L));
    }

    @Test
    void fallsBackToTheCompanyThenTheNumber() {
        assertEquals("Northwind Coffee", TenantDisplayName.of(null, null, " Northwind Coffee ", 7L));
        assertEquals("Tenant #7", TenantDisplayName.of(null, "", " ", 7L));
    }
}
