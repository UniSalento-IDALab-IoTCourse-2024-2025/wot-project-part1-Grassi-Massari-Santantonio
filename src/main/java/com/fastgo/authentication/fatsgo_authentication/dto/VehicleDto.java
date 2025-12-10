package com.fastgo.authentication.fatsgo_authentication.dto;

public class VehicleDto {
    private String value; 
    private String label; 

    public VehicleDto(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public VehicleDto() {
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }
}