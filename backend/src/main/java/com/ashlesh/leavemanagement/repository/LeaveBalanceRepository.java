package com.ashlesh.leavemanagement.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ashlesh.leavemanagement.entity.LeaveBalance;
import com.ashlesh.leavemanagement.entity.LeaveType;

public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {

    List<LeaveBalance> findByUserId(Long userId);

    /** "UserId" is resolved against the user.id of the @ManyToOne relationship. */
    Optional<LeaveBalance> findByUserIdAndLeaveType(Long userId, LeaveType leaveType);
}
