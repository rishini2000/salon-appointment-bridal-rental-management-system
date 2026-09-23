package lk.deenproject.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum Designation {

    MANAGER("Manager"),
    RECEPTIONIST("Receptionist"),
    BEAUTICIAN("Beautician"),
    RENTAL_MANAGER("Rental Manager");

    private final String displayName;

    Designation(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    public static Designation fromDisplayName(String displayName) {
        for (Designation d : values()) {
            if (d.displayName.equalsIgnoreCase(displayName)) {
                return d;
            }
        }
        throw new IllegalArgumentException("Unknown Designation: " + displayName);
    }

}
