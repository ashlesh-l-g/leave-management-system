package com.ashlesh.leavemanagement.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.ashlesh.leavemanagement.entity.LeaveRequest;
import com.ashlesh.leavemanagement.entity.LeaveStatus;
import com.ashlesh.leavemanagement.entity.LeaveType;

/**
 * What the API returns for a leave request.
 * Includes the employee name so the manager screen can show who applied.
 */
public record LeaveRequestResponse(
        Long id,
        Long employeeId,
        String employeeName,
        LeaveType leaveType,
        LocalDate startDate,
        LocalDate endDate,
        long days,
        String reason,
        LeaveStatus status,
        LocalDateTime appliedAt) {

    public static LeaveRequestResponse from(LeaveRequest leave) {
        return new LeaveRequestResponse(
                leave.getId(),
                leave.getUser().getId(),
                leave.getUser().getName(),
                leave.getLeaveType(),
                leave.getStartDate(),
                leave.getEndDate(),
                leave.getDays(),
                leave.getReason(),
                leave.getStatus(),
                leave.getAppliedAt());
    }
}
