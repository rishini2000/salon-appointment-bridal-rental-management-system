package lk.deenproject.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum LeaveType {

    FULL_DAY("Full Day"),
    HALF_DAY_MORNING("Half Day Morning"),
    HALF_DAY_AFTERNOON("Half Day Afternoon");

    private final String displayName;

    LeaveType(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    public static LeaveType fromDisplayName(String displayName) {
        if (displayName == null) {
            return null;
        }
        String normalized = displayName.trim();
        for (LeaveType t : values()) {
            if (t.displayName.equalsIgnoreCase(normalized) || t.name().equalsIgnoreCase(normalized)) {
                return t;
            }
        }
        return null;
    }

    public boolean isHalfDay() {
        return this == HALF_DAY_MORNING || this == HALF_DAY_AFTERNOON;
    }
}
