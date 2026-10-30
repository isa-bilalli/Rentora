package com.isabilalli.rentora.dashboard.application;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.dashboard.api.dto.DashboardResponse;
import com.isabilalli.rentora.expense.api.ExpenseAccess;
import com.isabilalli.rentora.lease.api.LeaseAccess;
import com.isabilalli.rentora.maintenance.api.MaintenanceAccess;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.payment.api.PaymentAccess;
import com.isabilalli.rentora.property.api.PropertyAccess;
import com.isabilalli.rentora.property.api.SpaceAccess;
import com.isabilalli.rentora.property.domain.SpaceStatus;

import java.time.Clock;
import java.time.LocalDate;

import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final CurrentUserService currentUserService;
    private final OrganizationAccessService organizationAccessService;
    private final PropertyAccess propertyAccess;
    private final SpaceAccess spaceAccess;
    private final PaymentAccess paymentAccess;
    private final ExpenseAccess expenseAccess;
    private final LeaseAccess leaseAccess;
    private final MaintenanceAccess maintenanceAccess;
    private final Clock clock;

    public DashboardService(
            CurrentUserService currentUserService,
            OrganizationAccessService organizationAccessService,
            PropertyAccess propertyAccess,
            SpaceAccess spaceAccess,
            PaymentAccess paymentAccess,
            ExpenseAccess expenseAccess,
            LeaseAccess leaseAccess,
            MaintenanceAccess maintenanceAccess,
            Clock clock
    ) {
        this.currentUserService = currentUserService;
        this.organizationAccessService = organizationAccessService;
        this.propertyAccess = propertyAccess;
        this.spaceAccess = spaceAccess;
        this.paymentAccess = paymentAccess;
        this.expenseAccess = expenseAccess;
        this.leaseAccess = leaseAccess;
        this.maintenanceAccess = maintenanceAccess;
        this.clock = clock;
    }

    private void organizationAuthorization(Long organizationId) {
        AuthenticatedUser currentUser =
                currentUserService.getCurrentUser();

        organizationAccessService.requireAccess(
                currentUser,
                organizationId
        );
    }

    private long zeroIfNull(Long value) {
        return value == null ? 0L : value;
    }

    public DashboardResponse.Portfolio getPortfolio(
            Long organizationId
    ) {
        organizationAuthorization(organizationId);
        return calculatePortfolio(organizationId);
    }

    private DashboardResponse.Portfolio calculatePortfolio(
            Long organizationId
    ) {
        long totalProperties =
                propertyAccess.countByOrganizationId(organizationId);

        long totalSpaces =
                spaceAccess.countByOrganizationId(organizationId);

        long occupiedSpaces =
                spaceAccess.countByOrganizationIdAndStatus(
                        organizationId,
                        SpaceStatus.OCCUPIED
                );

        long reservedSpaces =
                spaceAccess.countByOrganizationIdAndStatus(
                        organizationId,
                        SpaceStatus.RESERVED
                );

        long vacantSpaces =
                spaceAccess.countByOrganizationIdAndStatus(
                        organizationId,
                        SpaceStatus.VACANT
                );

        long maintenanceSpaces =
                spaceAccess.countByOrganizationIdAndStatus(
                        organizationId,
                        SpaceStatus.MAINTENANCE
                );

        return new DashboardResponse.Portfolio(
                totalProperties,
                totalSpaces,
                occupiedSpaces,
                reservedSpaces,
                vacantSpaces,
                maintenanceSpaces
        );
    }

    public DashboardResponse.Financial getFinancial(
            Long organizationId
    ) {
        organizationAuthorization(organizationId);
        return calculateFinancial(organizationId);
    }

    private DashboardResponse.Financial calculateFinancial(
            Long organizationId
    ) {
        LocalDate today = LocalDate.now(clock);
        LocalDate startDate = today.withDayOfMonth(1);
        LocalDate endDate =
                today.withDayOfMonth(today.lengthOfMonth());

        long expectedRent = zeroIfNull(
                paymentAccess.sumExpectedRent(
                        organizationId,
                        startDate,
                        endDate,
                        null
                )
        );

        long collectedRent = zeroIfNull(
                paymentAccess.sumPaidRent(
                        organizationId,
                        startDate,
                        endDate,
                        null
                )
        );

        long outstandingRent = zeroIfNull(
                paymentAccess.sumOutstandingRent(
                        organizationId,
                        startDate,
                        endDate,
                        null
                )
        );

        long overdueRent = zeroIfNull(
                paymentAccess.sumOverdueRent(
                        organizationId,
                        today,
                        null
                )
        );

        long paidExpenses = zeroIfNull(
                expenseAccess.sumPaidExpenses(
                        organizationId,
                        startDate,
                        endDate,
                        null
                )
        );

        long unpaidExpenses = zeroIfNull(
                expenseAccess.sumUnpaidExpenses(
                        organizationId,
                        startDate,
                        endDate,
                        null
                )
        );

        long netIncome = collectedRent - paidExpenses;

        return new DashboardResponse.Financial(
                expectedRent,
                collectedRent,
                outstandingRent,
                overdueRent,
                paidExpenses,
                unpaidExpenses,
                netIncome
        );
    }

    public DashboardResponse.Operations getOperations(
            Long organizationId
    ) {
        organizationAuthorization(organizationId);
        return calculateOperations(organizationId);
    }

    private DashboardResponse.Operations calculateOperations(
            Long organizationId
    ) {
        LocalDate today = LocalDate.now(clock);
        LocalDate thirtyDaysFromNow = today.plusDays(30);

        long activeLeases = zeroIfNull(
                leaseAccess.countActiveLeases(organizationId)
        );

        long leasesExpiringSoon = zeroIfNull(
                leaseAccess.countLeasesExpiring(
                        organizationId,
                        today,
                        thirtyDaysFromNow
                )
        );

        long overduePayments = zeroIfNull(
                paymentAccess.countOverduePayments(
                        organizationId,
                        today
                )
        );

        long openMaintenanceRequests = zeroIfNull(
                maintenanceAccess.countOpenRequests(organizationId)
        );

        return new DashboardResponse.Operations(
                activeLeases,
                leasesExpiringSoon,
                overduePayments,
                openMaintenanceRequests
        );
    }
    
    public DashboardResponse getDashboard(Long organizationId) {
        organizationAuthorization(organizationId);
        return new DashboardResponse(calculatePortfolio(organizationId), calculateFinancial(organizationId), calculateOperations(organizationId));
    }
}