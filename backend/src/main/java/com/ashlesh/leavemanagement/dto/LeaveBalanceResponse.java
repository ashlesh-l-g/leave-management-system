package com.ashlesh.leavemanagement.dto;

import com.ashlesh.leavemanagement.entity.LeaveBalance;
import com.ashlesh.leavemanagement.entity.LeaveType;

/** One row of the leave balance table shown on the dashboards. */
public record LeaveBalanceResponse(
        LeaveType leaveType,
        int totalDays,
        int usedDays,
        int remainingDays) {

    public static LeaveBalanceResponse from(LeaveBalance balance) {
        return new LeaveBalanceResponse(
                balance.getLeaveType(),
                balance.getTotalDays(),
                balance.getUsedDays(),
                balance.getRemainingDays());
    }
}
