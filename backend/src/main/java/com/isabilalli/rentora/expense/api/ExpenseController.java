package com.isabilalli.rentora.expense.api;

import com.isabilalli.rentora.expense.api.dto.CreateExpenseRequest;
import com.isabilalli.rentora.expense.api.dto.ExpenseListItem;
import com.isabilalli.rentora.expense.api.dto.ExpenseResponse;
import com.isabilalli.rentora.expense.api.dto.ExpenseSortField;
import com.isabilalli.rentora.expense.api.dto.ExpenseState;
import com.isabilalli.rentora.expense.api.dto.ExpenseStateTotal;
import com.isabilalli.rentora.expense.api.dto.UpdateExpenseRequest;
import com.isabilalli.rentora.expense.application.ExpenseService;
import com.isabilalli.rentora.shared.api.PageResponse;
import jakarta.validation.Valid;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;




@RestController
@RequestMapping("/api/organizations/{organizationId}/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    public ResponseEntity<ExpenseResponse> createExpense(@PathVariable Long organizationId, @Valid @RequestBody CreateExpenseRequest request) {
        return ResponseEntity.ok(expenseService.createExpense(organizationId, request));
    }

    @PostMapping("/{expenseId}/pay")
    public ResponseEntity<ExpenseResponse> markExpensePaid(@PathVariable Long organizationId, @PathVariable Long expenseId) {
        return ResponseEntity.ok(expenseService.markExpensePaid(organizationId, expenseId));
    }
    
    @PostMapping("/{expenseId}/void")
    public ResponseEntity<ExpenseResponse> voidExpense(@PathVariable Long organizationId, @PathVariable Long expenseId) {
        return ResponseEntity.ok(expenseService.voidExpense(organizationId, expenseId));
    }

    @GetMapping
    public ResponseEntity<List<ExpenseResponse>> getAllExpenses(@PathVariable Long organizationId) {
        return ResponseEntity.ok(expenseService.getAllExpenses(organizationId));
    }

    // One page of the Expenses page, e.g. ?state=UNPAID&propertyId=4&page=0&size=25&sort=AMOUNT&direction=DESC.
    // Every filter is optional; without sort, newest expense first.
    @GetMapping("/page")
    public ResponseEntity<PageResponse<ExpenseListItem>> getExpensePage(
            @PathVariable Long organizationId,
            @RequestParam(required = false) ExpenseState state,
            @RequestParam(required = false) Long propertyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) ExpenseSortField sort,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction
    ) {
        return ResponseEntity.ok(expenseService.getExpensePage(organizationId, state, propertyId, page, size, sort, direction));
    }

    // Count and sum per state and property, for the Expenses page's filter counts and total.
    @GetMapping("/summary")
    public ResponseEntity<List<ExpenseStateTotal>> getExpenseSummary(@PathVariable Long organizationId) {
        return ResponseEntity.ok(expenseService.getExpenseSummary(organizationId));
    }

    @GetMapping("/properties/{propertyId}")
    public ResponseEntity<List<ExpenseResponse>> getAllExpensesByProperty(@PathVariable Long organizationId, @PathVariable Long propertyId) {
        return ResponseEntity.ok(expenseService.getAllByPropertyId(organizationId, propertyId));
    }

    @GetMapping("/{expenseId}")
    public ResponseEntity<ExpenseResponse> getExpense(@PathVariable Long organizationId, @PathVariable Long expenseId) {
        return ResponseEntity.ok(expenseService.getExpense(organizationId, expenseId));
    }

    @GetMapping("/paid")
    public ResponseEntity<List<ExpenseResponse>> getExpensesByPaidStatus(@PathVariable Long organizationId, @RequestParam boolean paid) {
        return ResponseEntity.ok(expenseService.getExpensesByPaidStatus(organizationId, paid));
    }
    
    
    @PatchMapping("/{expenseId}")
    public ResponseEntity<ExpenseResponse> updateExpense(@PathVariable Long organizationId, @PathVariable Long expenseId, @Valid @RequestBody UpdateExpenseRequest request){
        return ResponseEntity.ok(expenseService.updateExpense(organizationId, expenseId, request));
    }
}