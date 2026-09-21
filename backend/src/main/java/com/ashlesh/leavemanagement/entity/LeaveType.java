package com.ashlesh.leavemanagement.entity;

/**
 * Types of leave an employee can apply for.
 * Each user gets one LeaveBalance row per type.
 *
 * defaultDays is the yearly allowance given to a new user.
 */
public enum LeaveType {

    CASUAL(12),
    SICK(8),
    EARNED(15);

    private final int defaultDays;

    LeaveType(int defaultDays) {
        this.defaultDays = defaultDays;
    }

    public int getDefaultDays() {
        return defaultDays;
    }
}
