package lk.deenproject.leaveplan;

import java.time.LocalTime;

import lk.deenproject.enums.LeaveType;

public final class LeaveSlot {

    public static final LocalTime MORNING_START = LocalTime.of(9, 0);
    public static final LocalTime MORNING_END   = LocalTime.of(13, 0);
    public static final LocalTime AFTERNOON_START = LocalTime.of(13, 0);
    public static final LocalTime AFTERNOON_END   = LocalTime.of(18, 0);
    public static final LocalTime FULL_DAY_START = LocalTime.of(0, 0);
    public static final LocalTime FULL_DAY_END   = LocalTime.of(23, 59);

    private LeaveSlot() {
    }

    public static LocalTime startFor(LeaveType type) {
        if (type == null) {
            return FULL_DAY_START;
        }
        return switch (type) {
            case FULL_DAY -> FULL_DAY_START;
            case HALF_DAY_MORNING -> MORNING_START;
            case HALF_DAY_AFTERNOON -> AFTERNOON_START;
        };
    }

    public static LocalTime endFor(LeaveType type) {
        if (type == null) {
            return FULL_DAY_END;
        }
        return switch (type) {
            case FULL_DAY -> FULL_DAY_END;
            case HALF_DAY_MORNING -> MORNING_END;
            case HALF_DAY_AFTERNOON -> AFTERNOON_END;
        };
    }

    public static boolean isFullDay(LeaveType type) {
        return type == LeaveType.FULL_DAY;
    }
}
