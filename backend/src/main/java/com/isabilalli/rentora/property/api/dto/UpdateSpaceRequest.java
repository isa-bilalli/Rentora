
package com.isabilalli.rentora.property.api.dto;

import com.fasterxml.jackson.annotation.JsonSetter;
import com.isabilalli.rentora.property.domain.SpaceType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class UpdateSpaceRequest {

    @Size(max = 100)
    private String name;

    private SpaceType type;

    private Integer floor;

    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal area;

    private boolean nameProvided;
    private boolean typeProvided;
    private boolean floorProvided;
    private boolean areaProvided;

    public UpdateSpaceRequest() {
    }

    @JsonSetter("name")
    public void setName(String name) {
        this.name = name;
        this.nameProvided = true;
    }

    @JsonSetter("type")
    public void setType(SpaceType type) {
        this.type = type;
        this.typeProvided = true;
    }

    @JsonSetter("floor")
    public void setFloor(Integer floor) {
        this.floor = floor;
        this.floorProvided = true;
    }

    @JsonSetter("area")
    public void setArea(BigDecimal area) {
        this.area = area;
        this.areaProvided = true;
    }

    public String name() {
        return name;
    }

    public SpaceType type() {
        return type;
    }

    public Integer floor() {
        return floor;
    }

    public BigDecimal area() {
        return area;
    }

    public boolean hasName() {
        return nameProvided;
    }

    public boolean hasType() {
        return typeProvided;
    }

    public boolean hasFloor() {
        return floorProvided;
    }

    public boolean hasArea() {
        return areaProvided;
    }
}
