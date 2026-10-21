package com.isabilalli.rentora.property.api;

import com.isabilalli.rentora.property.api.dto.SpaceResponse;
import com.isabilalli.rentora.property.application.SpaceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Spaces across the whole organization, for callers that don't know a space's property: every space at once,
// as the lists of leases and payments need, or one by ID alone, as the lease page does.
@RestController
@RequestMapping("/api/organizations/{organizationId}/spaces")
public class OrganizationSpaceController {
    private final SpaceService spaceService;

    public OrganizationSpaceController(SpaceService spaceService){
        this.spaceService=spaceService;
    }

    @GetMapping
    public ResponseEntity<List<SpaceResponse>> getSpaces(@PathVariable Long organizationId) {
        return ResponseEntity.ok(spaceService.getOrganizationSpaces(organizationId));
    }

    @GetMapping("/{spaceId}")
    public ResponseEntity<SpaceResponse> getSpace(@PathVariable Long organizationId, @PathVariable Long spaceId) {
        return ResponseEntity.ok(spaceService.getSpace(organizationId, spaceId));
    }
}
