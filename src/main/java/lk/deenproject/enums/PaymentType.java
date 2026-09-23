package lk.deenproject.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum PaymentType {

    ADVANCE("Advance Payment"),
    KEY_MONEY("Key Money"),
    REMAINING("Remaining Balance"),
    FULL("Full Payment");

    private final String displayName;

    PaymentType(String displayName) {
        this.displayName = displayName;
    }


    public String getDisplayName() {
        return displayName;
    }

    public static PaymentType fromDisplayName(String displayName) {

        for (PaymentType p : values()) {

            if (p.displayName.equalsIgnoreCase(displayName)) {
                return p;
            }

        }

        throw new IllegalArgumentException("Unknown PaymentType : " + displayName);

    }

}