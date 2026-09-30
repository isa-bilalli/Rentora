package com.isabilalli.rentora.expense.application;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.expense.api.ExpenseAccess;
import com.isabilalli.rentora.expense.api.dto.CreateExpenseRequest;
import com.isabilalli.rentora.expense.api.dto.ExpenseResponse;
import com.isabilalli.rentora.expense.api.dto.UpdateExpenseRequest;
import com.isabilalli.rentora.expense.domain.Expense;
import com.isabilalli.rentora.expense.domain.ExpenseStatus;
import com.isabilalli.rentora.expense.infrastructure.ExpenseRepository;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.property.api.PropertyAccess;
import com.isabilalli.rentora.property.api.SpaceAccess;

import java.time.LocalDate;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExpenseService implements ExpenseAccess {

    private final ExpenseRepository expenseRepository;
    private final CurrentUserService currentUserService;
    private final OrganizationAccessService organizationAccessService;
    private final PropertyAccess propertyAccess;
    private final SpaceAccess spaceAccess;

    public ExpenseService(ExpenseRepository expenseRepository, CurrentUserService currentUserService, OrganizationAccessService organizationAccessService, PropertyAccess propertyAccess, SpaceAccess spaceAccess) {
        this.expenseRepository = expenseRepository;
        this.currentUserService = currentUserService;
        this.organizationAccessService = organizationAccessService;
        this.propertyAccess = propertyAccess;
        this.spaceAccess = spaceAccess;
    }
    private AuthenticatedUser organizationAuthorization(Long organizationId){
        AuthenticatedUser currentUser = currentUserService.getCurrentUser();
        organizationAccessService.requireAccess(currentUser, organizationId);
        return currentUser;
    }

    private Expense validateExpense(Long organizationId, Long expenseId){
        Expense expense = expenseRepository.findById(expenseId).orElseThrow(()-> new IllegalArgumentException("Expense not found"));
        if(!expense.getOrganizationId().equals(organizationId)){
            throw new AccessDeniedException("Expense does not belong to this organization");
        }
        return expense;
    }

    @Transactional
    public ExpenseResponse createExpense(Long organizationId, CreateExpenseRequest request){
        AuthenticatedUser currentUser = organizationAuthorization(organizationId);
        propertyAccess.requireBelongsToOrganization(request.propertyId(), organizationId);
        if(request.spaceId() != null){
            spaceAccess.requireBelongsToProperty(request.spaceId(), request.propertyId());
        }

        Expense expense = new Expense(organizationId, request.propertyId(), request.spaceId(), request.category(), request.vendorName(), request.description(), request.amountCents(), request.expenseDate(), currentUser.userId());

        return ExpenseResponse.from(expenseRepository.save(expense));
    }

    public List<ExpenseResponse> getAllExpenses(Long organizationId){
        organizationAuthorization(organizationId);
        return expenseRepository.findAllByOrganizationId(organizationId).stream().map(ExpenseResponse::from).toList();
    }

    public List<ExpenseResponse> getAllByPropertyId(Long organizationId, Long propertyId){
        organizationAuthorization(organizationId);
        propertyAccess.requireBelongsToOrganization(propertyId, organizationId);
        return expenseRepository.findAllByPropertyId(propertyId).stream().map(ExpenseResponse::from).toList();
    }

    @Transactional 
    public ExpenseResponse markExpensePaid(Long organizationId, Long expenseId){
        organizationAuthorization(organizationId);
        Expense expense = validateExpense(organizationId, expenseId);
        expense.markPaid();
        return ExpenseResponse.from(expenseRepository.save(expense));
    }

    @Transactional 
    public ExpenseResponse voidExpense(Long organizationId, Long expenseId){
        organizationAuthorization(organizationId);
        Expense expense = validateExpense(organizationId, expenseId);
        expense.voidExpense();
        return ExpenseResponse.from(expenseRepository.save(expense));
    }

    public ExpenseResponse getExpense(Long organizationId, Long expenseId){
        organizationAuthorization(organizationId);
        Expense expense = validateExpense(organizationId, expenseId);
        return ExpenseResponse.from(expense);
    }

    @Transactional 
    public ExpenseResponse updateExpense(Long organizationId, Long expenseId, UpdateExpenseRequest request){
        organizationAuthorization(organizationId);
        Expense expense = validateExpense(organizationId, expenseId);
    
        expense.update(request.category(), request.vendorName(), request.description(), request.amountCents(), request.expenseDate());
        return ExpenseResponse.from(expense);
    }

    public List<ExpenseResponse> getExpensesByPaidStatus(Long organizationId, boolean paid){
        organizationAuthorization(organizationId);
        return expenseRepository.findAllByOrganizationIdAndPaid(organizationId, paid, ExpenseStatus.RECORDED).stream().map(ExpenseResponse::from).toList();
    }

    @Override 
    public Long sumPaidExpenses(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId){
        return expenseRepository.sumByOrganizationAndPeriodAndPaid(organizationId, startDate, endDate, ExpenseStatus.RECORDED, true, propertyId);
    }

    @Override 
    public Long sumUnpaidExpenses(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId){
        return expenseRepository.sumByOrganizationAndPeriodAndPaid(organizationId, startDate, endDate, ExpenseStatus.RECORDED, false, propertyId);
    }

    @Override 
    public List<ExpenseAccess.ExpenseCategoryTotal> sumExpensesByCategory(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId){
        return expenseRepository.sumByCategory(organizationId, startDate, endDate, ExpenseStatus.RECORDED, propertyId).stream().map(result -> new ExpenseAccess.ExpenseCategoryTotal(result.getCategory(), result.getAmountCents())).toList();
    }

}