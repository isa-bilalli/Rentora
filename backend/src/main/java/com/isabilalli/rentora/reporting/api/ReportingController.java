package com.isabilalli.rentora.reporting.api;

import com.isabilalli.rentora.reporting.api.dto.FinancialReportRequest;
import com.isabilalli.rentora.reporting.api.dto.FinancialReportResponse;
import com.isabilalli.rentora.reporting.application.ReportingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/organizations/{organizationId}/reports")
public class ReportingController {

    private final ReportingService reportingService;

    public ReportingController(ReportingService reportingService) {
        this.reportingService = reportingService;
    }

    @PostMapping("/financial")
    public ResponseEntity<FinancialReportResponse> getFinancialReport(@PathVariable Long organizationId, @Valid @RequestBody FinancialReportRequest request) {
        return ResponseEntity.ok(reportingService.getFinancialReport(organizationId, request));
    }

    @PostMapping("/properties/{propertyId}/financial")
    public ResponseEntity<FinancialReportResponse> getPropertyFinancialReport(@PathVariable Long organizationId, @PathVariable Long propertyId, @Valid @RequestBody FinancialReportRequest request) {
        return ResponseEntity.ok(reportingService.getPropertyFinancialReport(organizationId, propertyId, request));
    }
}