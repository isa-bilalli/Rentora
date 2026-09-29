package com.isabilalli.rentora.expense.api;

import com.isabilalli.rentora.expense.api.dto.CreateExpenseRequest;
import com.isabilalli.rentora.expense.api.dto.ExpenseResponse;
import com.isabilalli.rentora.expense.api.dto.UpdateExpenseRequest;
import com.isabilalli.rentora.expense.application.ExpenseService;
import jakarta.validation.Valid;

import java.util.List;

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