package com.isabilalli.rentora.maintenance.api.dto;

// One row of the Maintenance page: the request, with the property's and space's names, so the page needn't
// load every property and space to find them. spaceName is null for a request about the whole property.
public record MaintenanceListItem(
        MaintenanceResponse request,
        String propertyName,
        String spaceName
) {
}
