package com.ashlesh.leavemanagement.dto;

import java.time.LocalDate;

import com.ashlesh.leavemanagement.entity.LeaveType;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Body of POST /api/leaves.
 * startDate/endDate arrive as ISO strings, e.g. "2026-10-05".
 */
public record ApplyLeaveRequest(

        @NotNull(message = "leaveType is required")
        LeaveType leaveType,

        @NotNull(message = "startDate is required")
        LocalDate startDate,

        @NotNull(message = "endDate is required")
        LocalDate endDate,

        @NotBlank(message = "reason is required")
        @Size(max = 500, message = "reason must be at most 500 characters")
        String reason) {
}
