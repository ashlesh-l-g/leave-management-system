package com.ashlesh.leavemanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ashlesh.leavemanagement.entity.LeaveRequest;
import com.ashlesh.leavemanagement.entity.LeaveStatus;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    /** All requests of one employee, newest first. */
    List<LeaveRequest> findByUserIdOrderByAppliedAtDesc(Long userId);

    /** All requests in a given status (used by the manager screen). */
    List<LeaveRequest> findByStatusOrderByAppliedAtAsc(LeaveStatus status);
}
