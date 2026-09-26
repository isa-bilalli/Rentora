package com.isabilalli.rentora.property.api;

import com.isabilalli.rentora.property.api.dto.CreateSpaceRequest;
import com.isabilalli.rentora.property.api.dto.SpaceResponse;
import com.isabilalli.rentora.property.api.dto.UpdateSpaceRequest;
import com.isabilalli.rentora.property.application.SpaceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/organizations/{organizationId}/properties/{propertyId}/spaces")
public class SpaceController {
    private final SpaceService spaceService;

    public SpaceController(SpaceService spaceService){
        this.spaceService=spaceService;
    }

    @PostMapping
    public ResponseEntity<SpaceResponse> createSpace(@PathVariable Long organizationId, @PathVariable Long propertyId, @Valid @RequestBody CreateSpaceRequest request) {
        System.out.println("CONTROLLER REACHED");
        SpaceResponse response = spaceService.createSpace(organizationId, propertyId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{spaceId}")
    public ResponseEntity<SpaceResponse> updateSpace(@PathVariable Long organizationId, @PathVariable Long propertyId, @PathVariable Long spaceId, @Valid @RequestBody UpdateSpaceRequest request){
        return ResponseEntity.ok(spaceService.updateSpace(organizationId, propertyId, spaceId, request));
    }
    
    
    @GetMapping
    public ResponseEntity<List<SpaceResponse>> getSpaces(@PathVariable Long organizationId, @PathVariable Long propertyId) {
        return ResponseEntity.ok(spaceService.getSpaces(organizationId, propertyId));
    }

    @GetMapping("/{spaceId}")
    public ResponseEntity<SpaceResponse> getSpaceById(@PathVariable Long organizationId, @PathVariable Long propertyId, @PathVariable Long spaceId) {
        return ResponseEntity.ok(spaceService.getSpaceById(organizationId, propertyId, spaceId));
    }
    
    @DeleteMapping("/{spaceId}")
    public void deleteSpace(@PathVariable Long organizationId, @PathVariable Long propertyId, @PathVariable Long spaceId){
        spaceService.deleteSpace(organizationId, propertyId, spaceId);
    } 
}
