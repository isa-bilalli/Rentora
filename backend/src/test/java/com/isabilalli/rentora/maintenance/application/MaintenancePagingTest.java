package com.isabilalli.rentora.maintenance.application;

import com.isabilalli.rentora.TestcontainersConfiguration;
import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.maintenance.api.dto.MaintenanceCount;
import com.isabilalli.rentora.maintenance.api.dto.MaintenanceListItem;
import com.isabilalli.rentora.maintenance.api.dto.MaintenanceSortField;
import com.isabilalli.rentora.maintenance.domain.MaintenancePriority;
import com.isabilalli.rentora.maintenance.domain.MaintenanceRequest;
import com.isabilalli.rentora.maintenance.domain.MaintenanceStatus;
import com.isabilalli.rentora.maintenance.infrastructure.MaintenanceRepository;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.organization.domain.Organization;
import com.isabilalli.rentora.organization.infrastructure.OrganizationRepository;
import com.isabilalli.rentora.property.api.PropertyAccess;
import com.isabilalli.rentora.property.api.SpaceAccess;
import com.isabilalli.rentora.property.domain.Property;
import com.isabilalli.rentora.property.domain.Space;
import com.isabilalli.rentora.property.domain.SpaceStatus;
import com.isabilalli.rentora.property.domain.SpaceType;
import com.isabilalli.rentora.property.infrastructure.PropertyRepository;
import com.isabilalli.rentora.property.infrastructure.SpaceRepository;
import com.isabilalli.rentora.shared.api.PageResponse;
import jakarta.persistence.EntityManager;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;

// The Maintenance page's queries, on the throwaway PostgreSQL from TestcontainersConfiguration. @DataJpaTest also
// rolls each test back. Requests are reported in the order they're saved here; another organization has one
// too, which must never show up.
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class MaintenancePagingTest {

    @Autowired
    private MaintenanceRepository maintenanceRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private SpaceRepository spaceRepository;

    @Autowired
    private EntityManager entityManager;

    private MaintenanceService maintenanceService;
    private Long organizationId;

    private MaintenanceRequest lowOpen;
    private MaintenanceRequest urgentOpenOlder;
    private MaintenanceRequest highInProgress;
    private MaintenanceRequest urgentResolvedFirst;
    private MaintenanceRequest mediumResolvedLater;
    private MaintenanceRequest highCancelled;
    private MaintenanceRequest urgentOpenNewer;

    @BeforeEach
    void setUp() {
        // Access checks are covered by AccessRulesApiTest; here they let every call through.
        maintenanceService = new MaintenanceService(maintenanceRepository, mock(CurrentUserService.class),
                mock(OrganizationAccessService.class), mock(PropertyAccess.class), mock(SpaceAccess.class));

        organizationId = organizationRepository.save(new Organization("Maintenance paging test")).getId();
        Long harbourView = property(organizationId, "Harbour View");
        Long unitA = space(harbourView, "Unit A");
        Long marketSquare = property(organizationId, "Market Square");
        Long office1 = space(marketSquare, "Office 1");

        lowOpen = report(organizationId, harbourView, unitA, MaintenancePriority.LOW);
        urgentOpenOlder = report(organizationId, harbourView, null, MaintenancePriority.URGENT);
        highInProgress = report(organizationId, marketSquare, office1, MaintenancePriority.HIGH);
        highInProgress.startProgress();
        urgentResolvedFirst = report(organizationId, marketSquare, null, MaintenancePriority.URGENT);
        urgentResolvedFirst.startProgress();
        urgentResolvedFirst.resolve();
        mediumResolvedLater = report(organizationId, harbourView, unitA, MaintenancePriority.MEDIUM);
        mediumResolvedLater.startProgress();
        mediumResolvedLater.resolve();
        highCancelled = report(organizationId, harbourView, null, MaintenancePriority.HIGH);
        highCancelled.cancel();
        urgentOpenNewer = report(organizationId, harbourView, unitA, MaintenancePriority.URGENT);
        maintenanceRepository.saveAllAndFlush(List.of(highInProgress, urgentResolvedFirst, mediumResolvedLater, highCancelled));

        Long otherOrganization = organizationRepository.save(new Organization("Someone else")).getId();
        report(otherOrganization, property(otherOrganization, "Harbour View"), null, MaintenancePriority.URGENT);
    }

    // Open and in progress first, urgent before high before low, newest reported first; then the closed ones.
    @Test
    void pagesWhatNeedsAttentionFirst() {
        PageResponse<MaintenanceListItem> first = page(null, null, 0, 3, null, null);
        PageResponse<MaintenanceListItem> second = page(null, null, 1, 3, null, null);
        PageResponse<MaintenanceListItem> third = page(null, null, 2, 3, null, null);

        assertEquals(ids(urgentOpenNewer, urgentOpenOlder, highInProgress), ids(first));
        assertEquals(ids(lowOpen, urgentResolvedFirst, highCancelled), ids(second));
        assertEquals(ids(mediumResolvedLater), ids(third));
        assertEquals(7, first.totalItems());
    }

    @Test
    void filtersByStatusPriorityOrBoth() {
        assertEquals(ids(urgentOpenNewer, urgentOpenOlder, lowOpen), ids(page(MaintenanceStatus.OPEN, null)));
        assertEquals(ids(urgentOpenNewer, urgentOpenOlder, urgentResolvedFirst), ids(page(null, MaintenancePriority.URGENT)));
        assertEquals(ids(urgentOpenNewer, urgentOpenOlder), ids(page(MaintenanceStatus.OPEN, MaintenancePriority.URGENT)));
        assertEquals(List.of(), ids(page(MaintenanceStatus.CANCELLED, MaintenancePriority.LOW)));
    }

    // Requests without a resolved date come last either way, in the needs-attention order.
    @Test
    void sortsByResolvedWithUnresolvedLast() {
        OffsetDateTime now = OffsetDateTime.now();
        resolvedAt(urgentResolvedFirst, now.minusHours(1));
        resolvedAt(mediumResolvedLater, now);

        assertEquals(ids(mediumResolvedLater, urgentResolvedFirst, urgentOpenNewer, urgentOpenOlder, highInProgress, lowOpen, highCancelled),
                ids(page(null, null, 0, 25, MaintenanceSortField.RESOLVED, Sort.Direction.DESC)));
        assertEquals(ids(urgentResolvedFirst, mediumResolvedLater, urgentOpenNewer, urgentOpenOlder, highInProgress, lowOpen, highCancelled),
                ids(page(null, null, 0, 25, MaintenanceSortField.RESOLVED, Sort.Direction.ASC)));
    }

    // Resolved at the same moment, two requests keep the needs-attention order: the urgent one first, either way.
    @Test
    void requestsResolvedAtTheSameMomentPutWhatNeedsAttentionFirst() {
        OffsetDateTime sameMoment = OffsetDateTime.now();
        resolvedAt(urgentResolvedFirst, sameMoment);
        resolvedAt(mediumResolvedLater, sameMoment);

        assertEquals(ids(urgentResolvedFirst, mediumResolvedLater),
                ids(page(null, null, 0, 25, MaintenanceSortField.RESOLVED, Sort.Direction.DESC)).subList(0, 2));
        assertEquals(ids(urgentResolvedFirst, mediumResolvedLater),
                ids(page(null, null, 0, 25, MaintenanceSortField.RESOLVED, Sort.Direction.ASC)).subList(0, 2));
    }

    @Test
    void sortsByReportedEarliestFirst() {
        assertEquals(ids(lowOpen, urgentOpenOlder, highInProgress, urgentResolvedFirst, mediumResolvedLater, highCancelled, urgentOpenNewer),
                ids(page(null, null, 0, 25, MaintenanceSortField.REPORTED, Sort.Direction.ASC)));
    }

    // Requests saved one after another can be reported at the same moment; the ID then keeps the order they were
    // reported in.
    @Test
    void requestsReportedAtTheSameMomentKeepTheOrderTheyWereReportedIn() {
        // now() is when the test's transaction began, the same for every row.
        entityManager.createNativeQuery("UPDATE maintenance_requests SET reported_at = now() WHERE organization_id = :organizationId")
                .setParameter("organizationId", organizationId)
                .executeUpdate();
        entityManager.clear();

        List<Long> reportedOrder = ids(lowOpen, urgentOpenOlder, highInProgress, urgentResolvedFirst, mediumResolvedLater, highCancelled, urgentOpenNewer);
        assertEquals(reportedOrder, ids(page(null, null, 0, 25, MaintenanceSortField.REPORTED, Sort.Direction.ASC)));
        assertEquals(reportedOrder.reversed(), ids(page(null, null, 0, 25, MaintenanceSortField.REPORTED, Sort.Direction.DESC)));
    }

    @Test
    void rowsCarryThePropertyAndSpaceNames() {
        List<MaintenanceListItem> rows = page(MaintenanceStatus.IN_PROGRESS, null).items();
        MaintenanceListItem wholeProperty = page(MaintenanceStatus.CANCELLED, null).items().getFirst();

        assertEquals("Market Square", rows.getFirst().propertyName());
        assertEquals("Office 1", rows.getFirst().spaceName());
        assertEquals("Harbour View", wholeProperty.propertyName());
        assertNull(wholeProperty.spaceName());
    }

    @Test
    void summaryCountsEachStatusAndPriorityOfThisOrganizationOnly() {
        Set<MaintenanceCount> expected = Set.of(
                new MaintenanceCount(MaintenanceStatus.OPEN, MaintenancePriority.LOW, 1),
                new MaintenanceCount(MaintenanceStatus.OPEN, MaintenancePriority.URGENT, 2),
                new MaintenanceCount(MaintenanceStatus.IN_PROGRESS, MaintenancePriority.HIGH, 1),
                new MaintenanceCount(MaintenanceStatus.RESOLVED, MaintenancePriority.URGENT, 1),
                new MaintenanceCount(MaintenanceStatus.RESOLVED, MaintenancePriority.MEDIUM, 1),
                new MaintenanceCount(MaintenanceStatus.CANCELLED, MaintenancePriority.HIGH, 1));

        assertEquals(expected, new HashSet<>(maintenanceService.getMaintenanceSummary(organizationId)));
    }

    private PageResponse<MaintenanceListItem> page(MaintenanceStatus status, MaintenancePriority priority) {
        return page(status, priority, 0, 25, null, null);
    }

    private PageResponse<MaintenanceListItem> page(MaintenanceStatus status, MaintenancePriority priority, int page, int size, MaintenanceSortField sort, Sort.Direction direction) {
        return maintenanceService.getMaintenancePage(organizationId, status, priority, page, size, sort, direction);
    }

    private Long property(Long owner, String name) {
        return propertyRepository.save(new Property(owner, name, "1 Test Street", "Dublin", null, "Ireland")).getId();
    }

    private Long space(Long propertyId, String name) {
        return spaceRepository.save(new Space(propertyId, name, SpaceType.RESIDENTIAL, 1, new BigDecimal("50.00"), SpaceStatus.VACANT)).getId();
    }

    // resolve() stamps the clock, and two requests resolved one after another can get the same time, so tests
    // that depend on which was resolved first set it here.
    private void resolvedAt(MaintenanceRequest request, OffsetDateTime time) {
        entityManager.createNativeQuery("UPDATE maintenance_requests SET resolved_at = :time WHERE id = :id")
                .setParameter("time", time)
                .setParameter("id", request.getId())
                .executeUpdate();
        entityManager.clear();
    }

    private MaintenanceRequest report(Long owner, Long propertyId, Long spaceId, MaintenancePriority priority) {
        return maintenanceRepository.saveAndFlush(new MaintenanceRequest(owner, propertyId, spaceId, "Request", null, priority, null));
    }

    private static List<Long> ids(MaintenanceRequest... requests) {
        return Arrays.stream(requests).map(MaintenanceRequest::getId).toList();
    }

    private static List<Long> ids(PageResponse<MaintenanceListItem> page) {
        return page.items().stream().map(item -> item.request().id()).toList();
    }
}
