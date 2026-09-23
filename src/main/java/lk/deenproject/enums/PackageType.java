package lk.deenproject.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum PackageType {

    SALON("SALON"),
    BRIDAL("BRIDAL");

    private final String value;

    PackageType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @Override
    public String toString() {
        return value;
    }
}