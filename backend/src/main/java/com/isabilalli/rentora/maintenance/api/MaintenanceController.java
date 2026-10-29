package com.isabilalli.rentora.maintenance.api;

import com.isabilalli.rentora.maintenance.api.dto.CreateMaintenanceRequest;
import com.isabilalli.rentora.maintenance.api.dto.MaintenanceCount;
import com.isabilalli.rentora.maintenance.api.dto.MaintenanceListItem;
import com.isabilalli.rentora.maintenance.api.dto.MaintenanceSortField;
import com.isabilalli.rentora.maintenance.api.dto.MaintenanceResponse;
import com.isabilalli.rentora.maintenance.api.dto.UpdateMaintenanceRequest;
import com.isabilalli.rentora.maintenance.application.MaintenanceService;
import com.isabilalli.rentora.maintenance.domain.MaintenancePriority;
import com.isabilalli.rentora.maintenance.domain.MaintenanceStatus;
import com.isabilalli.rentora.shared.api.PageResponse;

import jakarta.validation.Valid;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;



@RestController
@RequestMapping("/api/organizations/{organizationId}/maintenance")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    public MaintenanceController(
            MaintenanceService maintenanceService
    ) {
        this.maintenanceService = maintenanceService;
    }

    @PostMapping
    public ResponseEntity<MaintenanceResponse> createMaintenanceRequest(@PathVariable Long organizationId, @Valid @RequestBody CreateMaintenanceRequest request) {
        return ResponseEntity.ok(maintenanceService.createMaintenanceRequest( organizationId, request));
    }

    @PostMapping("/{maintenanceId}/start")
    public ResponseEntity<MaintenanceResponse> startProgress(@PathVariable Long organizationId, @PathVariable Long maintenanceId) {
        return ResponseEntity.ok(maintenanceService.startProgress(organizationId, maintenanceId));
    }

    @PostMapping("/{maintenanceId}/resolve")
    public ResponseEntity<MaintenanceResponse> resolveMaintenance(@PathVariable Long organizationId, @PathVariable Long maintenanceId) {
        return ResponseEntity.ok(maintenanceService.resolveMaintenance(organizationId, maintenanceId));
    }

    @PostMapping("/{maintenanceId}/cancel")
    public ResponseEntity<MaintenanceResponse> cancelMaintenance(@PathVariable Long organizationId, @PathVariable Long maintenanceId) {
        return ResponseEntity.ok(maintenanceService.cancelMaintenance(organizationId, maintenanceId));
    }

    @GetMapping
    public ResponseEntity<List<MaintenanceResponse>> getAllMaintenanceRequests(@PathVariable Long organizationId) {
        return ResponseEntity.ok(maintenanceService.getAllMaintenanceRequests(organizationId));
    }
 
    // One page of the Maintenance page, e.g. ?status=OPEN&priority=URGENT&page=0&size=25&sort=RESOLVED&direction=DESC.
    // Every filter is optional; without sort, what needs attention first.
    @GetMapping("/page")
    public ResponseEntity<PageResponse<MaintenanceListItem>> getMaintenancePage(
            @PathVariable Long organizationId,
            @RequestParam(required = false) MaintenanceStatus status,
            @RequestParam(required = false) MaintenancePriority priority,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) MaintenanceSortField sort,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction
    ) {
        return ResponseEntity.ok(maintenanceService.getMaintenancePage(organizationId, status, priority, page, size, sort, direction));
    }

    // How many requests have each status and priority, for the Maintenance page's filters.
    @GetMapping("/summary")
    public ResponseEntity<List<MaintenanceCount>> getMaintenanceSummary(@PathVariable Long organizationId) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceSummary(organizationId));
    }

    @GetMapping("/properties/{propertyId}")
    public ResponseEntity<List<MaintenanceResponse>> getMaintenanceByProperty(@PathVariable Long organizationId, @PathVariable Long propertyId) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceByProperty(organizationId, propertyId));
    }
    
    @GetMapping("/properties/{propertyId}/spaces/{spaceId}")
    public ResponseEntity<List<MaintenanceResponse>> getMaintenanceByProperty(@PathVariable Long organizationId, @PathVariable Long propertyId, @PathVariable Long spaceId) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceBySpace(organizationId, propertyId, spaceId));
    }

    @GetMapping("/{maintenanceId}")
    public ResponseEntity<MaintenanceResponse> getMaintenanceRequest(@PathVariable Long organizationId, @PathVariable Long maintenanceId) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceRequest(organizationId, maintenanceId));
    }

    @GetMapping("/status")
    public ResponseEntity<List<MaintenanceResponse>> getMaintenanceByStatus(@PathVariable Long organizationId ,@RequestParam MaintenanceStatus status) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceByStatus(organizationId, status));
    }
    
    @GetMapping("/priority")
    public ResponseEntity<List<MaintenanceResponse>> getMaintenanceByPriority(@PathVariable Long organizationId ,@RequestParam MaintenancePriority priority) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceByPriority(organizationId, priority));
    }
    

    @PatchMapping("/{maintenanceId}")
    public ResponseEntity<MaintenanceResponse> updateMaintenanceRequest(@PathVariable Long organizationId, @PathVariable Long maintenanceId, @Valid  @RequestBody UpdateMaintenanceRequest request ){
        return ResponseEntity.ok(maintenanceService.updateMaintenanceRequest(organizationId, maintenanceId, request));
    }
}