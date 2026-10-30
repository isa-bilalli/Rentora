package com.isabilalli.rentora.lease.application;

import com.isabilalli.rentora.TestcontainersConfiguration;
import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.lease.api.dto.LeaseDisplayStatus;
import com.isabilalli.rentora.lease.api.dto.LeaseListItem;
import com.isabilalli.rentora.lease.api.dto.LeaseSortField;
import com.isabilalli.rentora.lease.domain.Lease;
import com.isabilalli.rentora.lease.infrastructure.LeaseRepository;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.organization.domain.Organization;
import com.isabilalli.rentora.organization.infrastructure.OrganizationRepository;
import com.isabilalli.rentora.property.api.SpaceAccess;
import com.isabilalli.rentora.property.domain.Property;
import com.isabilalli.rentora.property.domain.Space;
import com.isabilalli.rentora.property.domain.SpaceStatus;
import com.isabilalli.rentora.property.domain.SpaceType;
import com.isabilalli.rentora.property.infrastructure.PropertyRepository;
import com.isabilalli.rentora.property.infrastructure.SpaceRepository;
import com.isabilalli.rentora.shared.api.PageResponse;
import com.isabilalli.rentora.tenant.api.TenantAccess;
import com.isabilalli.rentora.tenant.domain.Tenant;
import com.isabilalli.rentora.tenant.domain.TenantType;
import com.isabilalli.rentora.tenant.infrastructure.TenantRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

// The Leases page's queries, on the throwaway PostgreSQL from TestcontainersConfiguration. @DataJpaTest also
// rolls each test back. One organization has a lease in every state; another has a lease with the same names,
// which must never show up.
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class LeasePagingTest {

    private static final LocalDate TODAY = LocalDate.now();

    @Autowired
    private LeaseRepository leaseRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private SpaceRepository spaceRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private LeaseService leaseService;
    private Long organizationId;

    // Newest start first: cancelled (in two months), upcoming (next month), startsToday, startedLastYear, ended.
    private Lease startedLastYear;
    private Lease startsToday;
    private Lease upcoming;
    private Lease ended;
    private Lease cancelled;

    @BeforeEach
    void setUp() {
        // Access checks are covered by AccessRulesApiTest; here they let every call through.
        leaseService = new LeaseService(leaseRepository, mock(TenantAccess.class), mock(SpaceAccess.class),
                mock(CurrentUserService.class), mock(OrganizationAccessService.class), mock(ApplicationEventPublisher.class), Clock.systemDefaultZone());

        organizationId = organizationRepository.save(new Organization("Lease paging test")).getId();
        Long harbourView = property(organizationId, "Harbour View");
        Long marketSquare = property(organizationId, "Market Square");
        Long liam = person(organizationId, "Liam", "O'Brien");
        Long aoife = person(organizationId, "Aoife", "Murphy");
        Long sofia = person(organizationId, "Sofia", "Rossi");
        Long northwind = tenantRepository.save(new Tenant(organizationId, TenantType.COMPANY, null, null, "Northwind Coffee", null, null)).getId();

        startedLastYear = lease(organizationId, liam, space(harbourView, "Unit A"), TODAY.minusYears(1), 100_000);
        startsToday = lease(organizationId, aoife, space(harbourView, "Unit B"), TODAY, 300_000);
        upcoming = lease(organizationId, northwind, space(marketSquare, "Office 1"), TODAY.plusMonths(1), 300_000);
        ended = lease(organizationId, sofia, space(harbourView, "Unit C"), TODAY.minusYears(2), 50_000);
        ended.end(ended.getEndDate());
        leaseRepository.saveAndFlush(ended);
        cancelled = lease(organizationId, liam, space(harbourView, "Shop 1"), TODAY.plusMonths(2), 200_000);
        cancelled.cancel();
        leaseRepository.saveAndFlush(cancelled);

        Long otherOrganization = organizationRepository.save(new Organization("Someone else")).getId();
        lease(otherOrganization, person(otherOrganization, "Liam", "O'Brien"),
                space(property(otherOrganization, "Harbour View"), "Unit A"), TODAY, 300_000);
    }

    @Test
    void pagesTheWholeListNewestStartFirst() {
        PageResponse<LeaseListItem> first = page(null, null, 0, 2, null, null);
        PageResponse<LeaseListItem> second = page(null, null, 1, 2, null, null);
        PageResponse<LeaseListItem> third = page(null, null, 2, 2, null, null);

        assertEquals(ids(cancelled, upcoming), ids(first));
        assertEquals(ids(startsToday, startedLastYear), ids(second));
        assertEquals(ids(ended), ids(third));
        assertEquals(5, first.totalItems());
        assertEquals(3, first.totalPages());
    }

    // A lease starting today is active; one starting tomorrow or later is upcoming.
    @Test
    void filtersByTheStatusThePageShows() {
        assertEquals(ids(upcoming), ids(page(LeaseDisplayStatus.UPCOMING, null)));
        assertEquals(ids(startsToday, startedLastYear), ids(page(LeaseDisplayStatus.ACTIVE, null)));
        assertEquals(ids(ended), ids(page(LeaseDisplayStatus.ENDED, null)));
        assertEquals(ids(cancelled), ids(page(LeaseDisplayStatus.CANCELLED, null)));
    }

    @Test
    void searchesTenantPropertyAndSpaceNamesIgnoringCase() {
        assertEquals(ids(cancelled, startedLastYear), ids(page(null, "o'BRIEN")));
        assertEquals(ids(cancelled, startedLastYear), ids(page(null, "liam o'b")));
        assertEquals(ids(upcoming), ids(page(null, "northwind")));
        assertEquals(ids(upcoming), ids(page(null, "MARKET square")));
        assertEquals(ids(ended), ids(page(null, " unit c ")));
        assertEquals(ids(startedLastYear), ids(page(LeaseDisplayStatus.ACTIVE, "o'brien")));
        // Typed wildcards are just characters.
        assertEquals(List.of(), ids(page(null, "%")));
        assertEquals(List.of(), ids(page(null, "unit_")));
    }

    // 300 000 is shared by upcoming and startsToday; the newer start comes first either way.
    @Test
    void sortsByRentWithTiesNewestStartFirst() {
        assertEquals(ids(upcoming, startsToday, cancelled, startedLastYear, ended),
                ids(page(null, null, 0, 25, LeaseSortField.RENT, Sort.Direction.DESC)));
        assertEquals(ids(ended, startedLastYear, cancelled, upcoming, startsToday),
                ids(page(null, null, 0, 25, LeaseSortField.RENT, Sort.Direction.ASC)));
    }

    @Test
    void sortsByStartDateEarliestFirst() {
        assertEquals(ids(ended, startedLastYear, startsToday, upcoming, cancelled),
                ids(page(null, null, 0, 25, LeaseSortField.START_DATE, Sort.Direction.ASC)));
    }

    @Test
    void rowsCarryTheNamesThePageShows() {
        LeaseListItem company = page(LeaseDisplayStatus.UPCOMING, null).items().getFirst();
        LeaseListItem person = page(LeaseDisplayStatus.ACTIVE, "unit a").items().getFirst();

        assertEquals("Northwind Coffee", company.tenantName());
        assertEquals("Market Square", company.propertyName());
        assertEquals("Office 1", company.spaceName());
        assertEquals(LeaseDisplayStatus.UPCOMING, company.status());
        assertEquals("Liam O'Brien", person.tenantName());
        assertEquals("Harbour View", person.propertyName());
        assertEquals(100_000L, person.lease().monthlyRentCents());
    }

    @Test
    void summaryCountsEachStatusOfThisOrganizationOnly() {
        Map<LeaseDisplayStatus, Long> summary = leaseService.getLeaseSummary(organizationId);

        assertEquals(Map.of(
                LeaseDisplayStatus.UPCOMING, 1L,
                LeaseDisplayStatus.ACTIVE, 2L,
                LeaseDisplayStatus.ENDED, 1L,
                LeaseDisplayStatus.CANCELLED, 1L), summary);
    }

    @Test
    void summaryOfAnOrganizationWithoutLeasesIsAllZeros() {
        Long empty = organizationRepository.save(new Organization("No leases")).getId();

        Map<LeaseDisplayStatus, Long> summary = leaseService.getLeaseSummary(empty);

        for (LeaseDisplayStatus status : LeaseDisplayStatus.values()) {
            assertEquals(0L, summary.get(status));
        }
    }

    private PageResponse<LeaseListItem> page(LeaseDisplayStatus status, String search) {
        return page(status, search, 0, 25, null, null);
    }

    private PageResponse<LeaseListItem> page(LeaseDisplayStatus status, String search, int page, int size, LeaseSortField sort, Sort.Direction direction) {
        return leaseService.getLeasePage(organizationId, status, search, page, size, sort, direction);
    }

    private Long property(Long owner, String name) {
        return propertyRepository.save(new Property(owner, name, "1 Test Street", "Dublin", null, "Ireland")).getId();
    }

    private Long space(Long propertyId, String name) {
        return spaceRepository.save(new Space(propertyId, name, SpaceType.RESIDENTIAL, 1, new BigDecimal("50.00"), SpaceStatus.VACANT)).getId();
    }

    private Long person(Long owner, String firstName, String lastName) {
        return tenantRepository.save(new Tenant(owner, TenantType.INDIVIDUAL, firstName, lastName, null, null, null)).getId();
    }

    private Lease lease(Long owner, Long tenantId, Long spaceId, LocalDate start, long rentCents) {
        return leaseRepository.saveAndFlush(new Lease(owner, tenantId, spaceId, start, start.plusYears(1).minusDays(1), rentCents, 0L));
    }

    private static List<Long> ids(Lease... leases) {
        return java.util.Arrays.stream(leases).map(Lease::getId).toList();
    }

    private static List<Long> ids(PageResponse<LeaseListItem> page) {
        return page.items().stream().map(item -> item.lease().id()).toList();
    }
}
