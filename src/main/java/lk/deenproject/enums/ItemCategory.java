package lk.deenproject.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ItemCategory {

    BRIDAL_SAREE("Bridal Saree"),
    BRIDAL_GOWN("Bridal Gown"),
    CROWN("Crown"),
    JEWELLERY("Jewellery"),
    VEILS("Veils"),
    HEELS("Heels"),
    BOUQUET("Bouquet");

    private final String displayName;

    ItemCategory(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    public static ItemCategory fromDisplayName(String displayName) {

        for (ItemCategory c : values()) {

            if (c.displayName.equalsIgnoreCase(displayName)) {
                return c;
            }

        }

        throw new IllegalArgumentException("Unknown ItemCategory: " + displayName);
    }
}