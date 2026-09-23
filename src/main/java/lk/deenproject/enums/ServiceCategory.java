package lk.deenproject.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ServiceCategory {
    HAIR_COLORING("Hair Coloring"),
    HAIR_TREATMENT("Hair Treatment"),
    HAIR_SPA("Hair Spa"),
    HAIR_STRAIGHTENING("Hair Straightening"),
    HAIR_REBONDING("Hair Rebonding"),

    FACIAL("Facial"),
    FACIAL_MASSAGE("Facial Massage"),
    CLEAN_UP("Clean-Up"),

    HAIR_CUT("Hair Cut"),
    HAIR_WASH("Hair Wash"),
    SCALP_MASSAGE("Scalp Massage"),

    PEDICURE("Pedicure"),
    MANICURE("Manicure"),
    NAIL_ART("Nail Art"),

    MAKEUP("Makeup"),
    MAKEUP_TRIAL("Makeup Trial"),
    EYELASH_EXTENSION("Eyelash Extension"),

    WAXING("Waxing"),
    THREADING("Threading");

    private final String displayName;

    ServiceCategory(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    public static ServiceCategory fromDisplayName(String displayName) {
        for (ServiceCategory c : values()) {
            if (c.displayName.equalsIgnoreCase(displayName))
                return c;
        }
        throw new IllegalArgumentException("Unknown ServiceCategory: " + displayName);
    }
}
