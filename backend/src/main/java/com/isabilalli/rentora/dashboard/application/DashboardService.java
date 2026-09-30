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

    public DashboardService(CurrentUserService currentUserService, OrganizationAccessService organizationAccessService, PropertyAccess propertyAccess, SpaceAccess spaceAccess, PaymentAccess paymentAccess, ExpenseAccess expenseAccess, LeaseAccess leaseAccess, MaintenanceAccess maintenanceAccess) {
        this.currentUserService = currentUserService;
        this.organizationAccessService = organizationAccessService;
        this.propertyAccess = propertyAccess;
        this.spaceAccess = spaceAccess;
        this.paymentAccess = paymentAccess;
        this.expenseAccess = expenseAccess;
        this.leaseAccess = leaseAccess;
        this.maintenanceAccess = maintenanceAccess;
    }

    public DashboardResponse.Portfolio getPortfolio(Long organizationId) {
        organizationAuthorization(organizationId);
        long totalProperties = propertyAccess.countByOrganizationId(organizationId);
        long totalSpaces = spaceAccess.countByOrganizationId(organizationId);
        long occupiedSpaces = spaceAccess.countByOrganizationIdAndStatus(organizationId, SpaceStatus.OCCUPIED);
        long reservedSpaces = spaceAccess.countByOrganizationIdAndStatus(organizationId, SpaceStatus.RESERVED);
        long vacantSpaces = spaceAccess.countByOrganizationIdAndStatus(organizationId, SpaceStatus.VACANT);
        long maintenanceSpaces = spaceAccess.countByOrganizationIdAndStatus(organizationId, SpaceStatus.MAINTENANCE);
        return new DashboardResponse.Portfolio(totalProperties, totalSpaces, occupiedSpaces, reservedSpaces, vacantSpaces, maintenanceSpaces);
    }

    public DashboardResponse.Financial getFinancial(Long organizationId){
        organizationAuthorization(organizationId);
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.withDayOfMonth(1);
        LocalDate endDate = today.withDayOfMonth(today.lengthOfMonth());
        Long expectedRent = paymentAccess.sumExpectedRent(organizationId, startDate, endDate, null);
        Long collectedRent = paymentAccess.sumPaidRent(organizationId, startDate, endDate, null);
        Long outstandingRent = paymentAccess.sumOutstandingRent(organizationId, startDate, endDate,null);
        Long overdueRent = paymentAccess.sumOverdueRent(organizationId, today,null);
        Long paidExpenses = expenseAccess.sumPaidExpenses(organizationId, startDate, endDate);
        Long unpaidExpenses = expenseAccess.sumUnpaidExpenses( organizationId, startDate, endDate);
        Long netIncome = collectedRent - paidExpenses;
        return new DashboardResponse.Financial(expectedRent, collectedRent, outstandingRent, overdueRent, paidExpenses, unpaidExpenses, netIncome);
    }

    private AuthenticatedUser organizationAuthorization(Long organizationId) {
        AuthenticatedUser currentUser = currentUserService.getCurrentUser();
        organizationAccessService.requireAccess(currentUser, organizationId);
        return currentUser;
    }

    public DashboardResponse.Operations getOperations(Long organizationId){
        organizationAuthorization(organizationId);
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysFromNow = today.plusDays(30);
        Long activeLeases = leaseAccess.countActiveLeases(organizationId);
        Long leasesExpiringSoon = leaseAccess.countLeasesExpiring(organizationId, today, thirtyDaysFromNow);
        Long overduePayments = paymentAccess.countOverduePayments(organizationId, today);
        Long openMaintenanceRequests = maintenanceAccess.countOpenRequests(organizationId);
        return new DashboardResponse.Operations(activeLeases, leasesExpiringSoon, overduePayments, openMaintenanceRequests);
    }

    public DashboardResponse getDashboard(Long organizationId){
        return new DashboardResponse(getPortfolio(organizationId), getFinancial(organizationId), getOperations(organizationId));
    }
}