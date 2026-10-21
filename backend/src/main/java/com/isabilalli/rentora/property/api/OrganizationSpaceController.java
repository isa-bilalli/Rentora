package com.isabilalli.rentora.property.api;

import com.isabilalli.rentora.property.api.dto.SpaceResponse;
import com.isabilalli.rentora.property.application.SpaceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Spaces looked up by ID alone, for callers that don't know the space's property, such as the lease page.
@RestController
@RequestMapping("/api/organizations/{organizationId}/spaces")
public class OrganizationSpaceController {
    private final SpaceService spaceService;

    public OrganizationSpaceController(SpaceService spaceService){
        this.spaceService=spaceService;
    }

    @GetMapping("/{spaceId}")
    public ResponseEntity<SpaceResponse> getSpace(@PathVariable Long organizationId, @PathVariable Long spaceId) {
        return ResponseEntity.ok(spaceService.getSpace(organizationId, spaceId));
    }
}
