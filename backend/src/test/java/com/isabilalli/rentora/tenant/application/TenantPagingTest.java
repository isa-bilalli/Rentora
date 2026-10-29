package com.isabilalli.rentora.tenant.application;

import com.isabilalli.rentora.TestcontainersConfiguration;
import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.lease.api.LeaseStatusAccess;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.organization.domain.Organization;
import com.isabilalli.rentora.organization.infrastructure.OrganizationRepository;
import com.isabilalli.rentora.shared.api.PageResponse;
import com.isabilalli.rentora.tenant.api.dto.TenantResponse;
import com.isabilalli.rentora.tenant.api.dto.TenantSortField;
import com.isabilalli.rentora.tenant.domain.Tenant;
import com.isabilalli.rentora.tenant.domain.TenantType;
import com.isabilalli.rentora.tenant.infrastructure.TenantRepository;
import jakarta.persistence.EntityManager;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

// The Tenants page's queries, on the throwaway PostgreSQL from TestcontainersConfiguration. @DataJpaTest also
// rolls each test back. Another organization has a tenant with the same name, which must never show up.
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class TenantPagingTest {

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private EntityManager entityManager;

    private TenantService tenantService;
    private Long organizationId;

    // Added in this order, so newest first is the reverse.
    private Tenant aoife;
    private Tenant northwind;
    private Tenant liam;
    private Tenant brightline;
    private Tenant sofia;

    @BeforeEach
    void setUp() {
        // Access checks are covered by AccessRulesApiTest; here they let every call through.
        tenantService = new TenantService(tenantRepository, mock(CurrentUserService.class), mock(OrganizationAccessService.class), mock(LeaseStatusAccess.class));

        organizationId = organizationRepository.save(new Organization("Tenant paging test")).getId();
        aoife = save(organizationId, TenantType.INDIVIDUAL, "Aoife", "Murphy", null, "aoife@example.test", "+353 1 555 0101");
        northwind = save(organizationId, TenantType.COMPANY, null, null, "Northwind Coffee", "accounts@northwind.test", null);
        liam = save(organizationId, TenantType.INDIVIDUAL, "Liam", "O'Brien", null, null, null);
        brightline = save(organizationId, TenantType.COMPANY, null, null, "Brightline Studio", null, null);
        sofia = save(organizationId, TenantType.INDIVIDUAL, "Sofia", "Rossi", null, null, "087 555 0199");

        Long otherOrganization = organizationRepository.save(new Organization("Someone else")).getId();
        save(otherOrganization, TenantType.INDIVIDUAL, "Liam", "O'Brien", null, null, null);
    }

    @Test
    void pagesNewestAddedFirst() {
        PageResponse<TenantResponse> first = page(null, 0, 2, null, null);
        PageResponse<TenantResponse> second = page(null, 1, 2, null, null);
        PageResponse<TenantResponse> third = page(null, 2, 2, null, null);

        assertEquals(ids(sofia, brightline), ids(first));
        assertEquals(ids(liam, northwind), ids(second));
        assertEquals(ids(aoife), ids(third));
        assertEquals(5, first.totalItems());
        assertEquals(3, first.totalPages());
    }

    @Test
    void sortsByAddedOldestFirst() {
        assertEquals(ids(aoife, northwind, liam, brightline, sofia),
                ids(page(null, 0, 25, TenantSortField.ADDED, Sort.Direction.ASC)));
    }

    // Tenants added together can share a timestamp; the ID then keeps them in the order they were added.
    @Test
    void tenantsAddedAtTheSameMomentKeepTheOrderTheyWereAddedIn() {
        // now() is when the test's transaction began, the same for every row.
        entityManager.createNativeQuery("UPDATE tenants SET created_at = now() WHERE organization_id = :organizationId")
                .setParameter("organizationId", organizationId)
                .executeUpdate();
        entityManager.clear();

        assertEquals(ids(aoife, northwind, liam, brightline, sofia),
                ids(page(null, 0, 25, TenantSortField.ADDED, Sort.Direction.ASC)));
        assertEquals(ids(sofia, brightline, liam, northwind, aoife),
                ids(page(null, 0, 25, TenantSortField.ADDED, Sort.Direction.DESC)));
        assertEquals(ids(sofia, brightline, liam, northwind, aoife), ids(page(null)));
    }

    @Test
    void searchesNamesEmailPhoneAndTypeIgnoringCase() {
        assertEquals(ids(liam), ids(page("o'BRIEN")));
        assertEquals(ids(northwind), ids(page("northwind")));
        assertEquals(ids(aoife), ids(page("aoife murphy")));
        assertEquals(ids(aoife), ids(page("@example.test")));
        assertEquals(ids(sofia), ids(page("555 0199")));
        assertEquals(ids(brightline, northwind), ids(page("Company")));
        // Typed wildcards are just characters.
        assertEquals(List.of(), ids(page("%")));
    }

    @Test
    void searchesTheTenantsNumber() {
        assertTrue(ids(page(String.valueOf(aoife.getId()))).contains(aoife.getId()));
    }

    @Test
    void summaryCountsEachTypeOfThisOrganizationOnly() {
        assertEquals(Map.of(TenantType.INDIVIDUAL, 3L, TenantType.COMPANY, 2L), tenantService.getTenantSummary(organizationId));
    }

    @Test
    void summaryOfAnOrganizationWithoutTenantsIsAllZeros() {
        Long empty = organizationRepository.save(new Organization("No tenants")).getId();

        assertEquals(Map.of(TenantType.INDIVIDUAL, 0L, TenantType.COMPANY, 0L), tenantService.getTenantSummary(empty));
    }

    private PageResponse<TenantResponse> page(String search) {
        return page(search, 0, 25, null, null);
    }

    private PageResponse<TenantResponse> page(String search, int page, int size, TenantSortField sort, Sort.Direction direction) {
        return tenantService.getTenantPage(organizationId, search, page, size, sort, direction);
    }

    private Tenant save(Long owner, TenantType type, String firstName, String lastName, String companyName, String email, String phone) {
        return tenantRepository.saveAndFlush(new Tenant(owner, type, firstName, lastName, companyName, email, phone));
    }

    private static List<Long> ids(Tenant... tenants) {
        return Arrays.stream(tenants).map(Tenant::getId).toList();
    }

    private static List<Long> ids(PageResponse<TenantResponse> page) {
        return page.items().stream().map(TenantResponse::id).toList();
    }
}
