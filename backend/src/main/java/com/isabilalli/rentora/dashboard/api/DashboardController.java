package com.isabilalli.rentora.dashboard.api;

import com.isabilalli.rentora.dashboard.api.dto.DashboardResponse;
import com.isabilalli.rentora.dashboard.application.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/organizations/{organizationId}/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/portfolio")
    public ResponseEntity<DashboardResponse.Portfolio> getPortfolio(@PathVariable Long organizationId) {
        return ResponseEntity.ok(dashboardService.getPortfolio(organizationId));
    }

    @GetMapping("/financial")
    public ResponseEntity<DashboardResponse.Financial> getFinancial(@PathVariable Long organizationId) {
        return ResponseEntity.ok(dashboardService.getFinancial(organizationId));
    }

    @GetMapping("/operations")
    public ResponseEntity<DashboardResponse.Operations> getOperations(@PathVariable Long organizationId) {
        return ResponseEntity.ok(dashboardService.getOperations(organizationId));
    }

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(@PathVariable Long organizationId) {
        return ResponseEntity.ok(dashboardService.getDashboard(organizationId));
    }
}