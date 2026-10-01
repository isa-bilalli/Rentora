package com.isabilalli.rentora.reporting.application;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.expense.api.ExpenseAccess;
import com.isabilalli.rentora.lease.api.LeaseAccess;
import com.isabilalli.rentora.maintenance.api.MaintenanceAccess;
import com.isabilalli.rentora.payment.api.PaymentAccess;
import com.isabilalli.rentora.property.api.PropertyAccess;
import com.isabilalli.rentora.property.api.SpaceAccess;
import com.isabilalli.rentora.reporting.api.dto.FinancialReportRequest;
import com.isabilalli.rentora.reporting.api.dto.FinancialReportResponse;
import com.isabilalli.rentora.reporting.api.dto.LeaseReportRequest;
import com.isabilalli.rentora.reporting.api.dto.LeaseReportResponse;
import com.isabilalli.rentora.reporting.api.dto.MaintenanceReportRequest;
import com.isabilalli.rentora.reporting.api.dto.MaintenanceReportResponse;
import com.isabilalli.rentora.reporting.api.dto.OccupancyReportRequest;
import com.isabilalli.rentora.reporting.api.dto.OccupancyReportResponse;
import com.isabilalli.rentora.reporting.domain.ReportRange;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReportingService {

    private final CurrentUserService currentUserService;
    private final OrganizationAccessService organizationAccessService;
    private final ReportRangeResolver reportRangeResolver;
    private final PaymentAccess paymentAccess;
    private final ExpenseAccess expenseAccess;
    private final PropertyAccess propertyAccess;
    private final SpaceAccess spaceAccess;
    private final LeaseAccess leaseAccess;
    private final MaintenanceAccess maintenanceAccess;

    public ReportingService(CurrentUserService currentUserService, OrganizationAccessService organizationAccessService, ReportRangeResolver reportRangeResolver, PaymentAccess paymentAccess, ExpenseAccess expenseAccess, PropertyAccess propertyAccess, SpaceAccess spaceAccess, LeaseAccess leaseAccess, MaintenanceAccess maintenanceAccess) {
        this.currentUserService = currentUserService;
        this.organizationAccessService = organizationAccessService;
        this.reportRangeResolver = reportRangeResolver;
        this.paymentAccess = paymentAccess;
        this.expenseAccess = expenseAccess;
        this.propertyAccess = propertyAccess;
        this.spaceAccess = spaceAccess;
        this.leaseAccess = leaseAccess;
        this.maintenanceAccess = maintenanceAccess;
    }

    public FinancialReportResponse getFinancialReport(Long organizationId, FinancialReportRequest request) {
        authorizeOrganization(organizationId);
        ReportRange range = reportRangeResolver.resolve(request.period(), request.referenceDate(), request.from(), request.to());
        Long expectedRent = paymentAccess.sumExpectedRent(organizationId, range.startDate(), range.endDate(), null);
        Long collectedRent = paymentAccess.sumPaidRent(organizationId, range.startDate(), range.endDate(), null);
        Long outstandingRent = paymentAccess.sumOutstandingRent(organizationId, range.startDate(), range.endDate(), null);
        Long overdueRent = paymentAccess.sumOverdueRent(organizationId, range.endDate().plusDays(1), null);
        Long paidExpenses = expenseAccess.sumPaidExpenses(organizationId, range.startDate(), range.endDate(), null);
        Long unpaidExpenses = expenseAccess.sumUnpaidExpenses(organizationId, range.startDate(), range.endDate(), null);
        Long netIncome = collectedRent - paidExpenses;
        double collectionRate = expectedRent == 0 ? 0.0 : ((double) collectedRent / expectedRent) * 100.0;
        List<FinancialReportResponse.ExpenseCategoryTotal> expensesByCategory = expenseAccess.sumExpensesByCategory(organizationId, range.startDate(), range.endDate(), request.propertyId()).stream().map(category -> new FinancialReportResponse.ExpenseCategoryTotal(category.category(), category.amountCents())).toList();
        return new FinancialReportResponse(expectedRent, collectedRent, outstandingRent, overdueRent, collectionRate, paidExpenses, unpaidExpenses, netIncome, expensesByCategory);
    }

    private AuthenticatedUser authorizeOrganization(Long organizationId) {
        AuthenticatedUser currentUser = currentUserService.getCurrentUser();
        organizationAccessService.requireAccess(currentUser, organizationId);
        return currentUser;
    }

    public FinancialReportResponse getPropertyFinancialReport(Long organizationId, Long propertyId, FinancialReportRequest request){
        authorizeOrganization(propertyId);
        propertyAccess.requireBelongsToOrganization(propertyId, organizationId);
        ReportRange range = reportRangeResolver.resolve(request.period(), request.referenceDate(), request.from(), request.to());
        Long expectedRent = paymentAccess.sumExpectedRent(organizationId, range.startDate(), range.endDate(), propertyId);
        Long collectedRent = paymentAccess.sumPaidRent(organizationId, range.startDate(), range.endDate(), propertyId);
        Long outstandingRent = paymentAccess.sumOutstandingRent(organizationId, range.startDate(), range.endDate(), propertyId);
        Long overdueRent = paymentAccess.sumOverdueRent(organizationId, range.endDate().plusDays(1), propertyId);
        Long paidExpenses = expenseAccess.sumPaidExpenses(organizationId, range.startDate(), range.endDate(), propertyId);
        Long unpaidExpenses = expenseAccess.sumUnpaidExpenses(organizationId, range.startDate(), range.endDate(), propertyId);
        Long netIncome = collectedRent - paidExpenses;
        double collectionRate = expectedRent == 0 ? 0.0 : ((double) collectedRent / expectedRent) * 100.0;
        List<FinancialReportResponse.ExpenseCategoryTotal> expensesByCategory = expenseAccess.sumExpensesByCategory(organizationId, range.startDate(), range.endDate(), propertyId).stream().map(category -> new FinancialReportResponse.ExpenseCategoryTotal(category.category(), category.amountCents())).toList();
        return new FinancialReportResponse(expectedRent, collectedRent, outstandingRent, overdueRent, collectionRate, paidExpenses, unpaidExpenses, netIncome, expensesByCategory);
    }

    public OccupancyReportResponse getOccupancyReport(Long organizationId, OccupancyReportRequest request){
        authorizeOrganization(organizationId);
        ReportRange range = reportRangeResolver.resolve(request.period(), request.referenceDate(), request.from(), request.to());
        Long totalSpaces = spaceAccess.countSpaces(organizationId, request.propertyId());
        Long totalDays = range.endDate().toEpochDay() - range.startDate().toEpochDay() + 1;
        Long occupiedSpaceDays = leaseAccess.sumOccupiedSpaceDays(organizationId, range.startDate(), range.endDate(), request.propertyId());
        double averageOccupiedSpaces = totalDays == 0 ? 0.0 : (double) occupiedSpaceDays / totalDays;
        double totalPossibleSpaceDays = (double) totalSpaces * totalDays;
        double occupancyRate = totalPossibleSpaceDays == 0 ? 0.0 : (occupiedSpaceDays / totalPossibleSpaceDays) * 100.0;
        return new OccupancyReportResponse(totalSpaces, totalDays, occupiedSpaceDays, averageOccupiedSpaces, occupancyRate);
    }

    public LeaseReportResponse getLeaseReport(Long organizationId, LeaseReportRequest request){
        authorizeOrganization(organizationId);
        ReportRange range = reportRangeResolver.resolve(request.period(), request.referenceDate(), request.from(), request.to());
        Long leasesStarted = leaseAccess.countStartedLeases(organizationId, range.startDate(), range.endDate(), request.propertyId());
        Long leasesEnded = leaseAccess.countEndedLeases(organizationId, range.startDate(), range.endDate(), request.propertyId());
        Long leasesRenewed = leaseAccess.countRenewedLeases(organizationId, range.startDate(), range.endDate(), request.propertyId());
        Long leasesExpiring = leaseAccess.countLeasesExpiringBetween(organizationId, range.startDate(), range.endDate(), request.propertyId());
        return new LeaseReportResponse(leasesStarted, leasesEnded, leasesRenewed, leasesExpiring);
    }

    public MaintenanceReportResponse getMaintenanceReport(Long organizationId, MaintenanceReportRequest request){
        authorizeOrganization(organizationId);
        ReportRange range = reportRangeResolver.resolve(request.period(), request.referenceDate(), request.from(), request.to());
        if (request.propertyId() != null) {
            propertyAccess.requireBelongsToOrganization(request.propertyId(), organizationId);
        }
        Long requestsOpened = maintenanceAccess.countOpenedRequests(organizationId, range.startDate(), range.endDate(), request.propertyId());
        Long requestsResolved = maintenanceAccess.countResolvedRequests(organizationId,range.startDate(), range.endDate(), request.propertyId());
        Long requestsCancelled = maintenanceAccess.countCancelledRequests(organizationId,range.startDate(), range.endDate(), request.propertyId());
        double averageResolutionHours = maintenanceAccess.averageResolutionHours(organizationId,range.startDate(), range.endDate(), request.propertyId());
        return new MaintenanceReportResponse(requestsOpened, requestsResolved, requestsCancelled, averageResolutionHours);
    }
}