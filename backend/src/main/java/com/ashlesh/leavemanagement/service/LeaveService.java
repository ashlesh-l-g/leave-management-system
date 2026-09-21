package com.ashlesh.leavemanagement.service;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ashlesh.leavemanagement.dto.ApplyLeaveRequest;
import com.ashlesh.leavemanagement.dto.LeaveRequestResponse;
import com.ashlesh.leavemanagement.entity.LeaveBalance;
import com.ashlesh.leavemanagement.entity.LeaveRequest;
import com.ashlesh.leavemanagement.entity.LeaveStatus;
import com.ashlesh.leavemanagement.entity.User;
import com.ashlesh.leavemanagement.repository.LeaveBalanceRepository;
import com.ashlesh.leavemanagement.repository.LeaveRequestRepository;

/**
 * All leave rules live here:
 * - only pending requests can be cancelled / approved / rejected
 * - a request must fit in the remaining balance of that leave type
 * - an employee can only touch their own requests
 */
@Service
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final EmployeeService employeeService;

    public LeaveService(LeaveRequestRepository leaveRequestRepository,
                        LeaveBalanceRepository leaveBalanceRepository,
                        EmployeeService employeeService) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.employeeService = employeeService;
    }

    /** Employee applies for leave. */
    @Transactional
    public LeaveRequestResponse apply(ApplyLeaveRequest request, String email) {
        User user = employeeService.findUser(email);

        if (request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("endDate cannot be before startDate");
        }

        long days = ChronoUnit.DAYS.between(request.startDate(), request.endDate()) + 1;

        LeaveBalance balance = leaveBalanceRepository
                .findByUserIdAndLeaveType(user.getId(), request.leaveType())
                .orElseThrow(() -> new IllegalStateException("No " + request.leaveType() + " balance for this user"));

        if (days > balance.getRemainingDays()) {
            throw new IllegalArgumentException("Not enough " + request.leaveType() + " leave: requested "
                    + days + " day(s) but only " + balance.getRemainingDays() + " remaining");
        }

        LeaveRequest leave = new LeaveRequest(
                user, request.leaveType(), request.startDate(), request.endDate(), request.reason());
        return LeaveRequestResponse.from(leaveRequestRepository.save(leave));
    }

    /**
     * The employee's own requests.
     * readOnly = true keeps the Hibernate session open while we read the
     * employee name from the lazy @ManyToOne, which would otherwise fail.
     */
    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> getMyLeaves(String email) {
        User user = employeeService.findUser(email);
        return leaveRequestRepository.findByUserIdOrderByAppliedAtDesc(user.getId())
                .stream()
                .map(LeaveRequestResponse::from)
                .toList();
    }

    /** Employee cancels one of their own pending requests. */
    @Transactional
    public LeaveRequestResponse cancel(Long leaveId, String email) {
        User user = employeeService.findUser(email);
        LeaveRequest leave = findLeave(leaveId);

        if (!leave.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You can only cancel your own leave requests");
        }
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be cancelled");
        }

        leave.setStatus(LeaveStatus.CANCELLED);
        return LeaveRequestResponse.from(leaveRequestRepository.save(leave));
    }

    /** Manager: every request that is still waiting for a decision. */
    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> getPendingLeaves() {
        return leaveRequestRepository.findByStatusOrderByAppliedAtAsc(LeaveStatus.PENDING)
                .stream()
                .map(LeaveRequestResponse::from)
                .toList();
    }

    /** Manager approves a pending request and books the days against the balance. */
    @Transactional
    public LeaveRequestResponse approve(Long leaveId) {
        LeaveRequest leave = findLeave(leaveId);
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be approved");
        }

        LeaveBalance balance = leaveBalanceRepository
                .findByUserIdAndLeaveType(leave.getUser().getId(), leave.getLeaveType())
                .orElseThrow(() -> new IllegalStateException("No balance found for this employee"));

        balance.setUsedDays(balance.getUsedDays() + (int) leave.getDays());
        leaveBalanceRepository.save(balance);

        leave.setStatus(LeaveStatus.APPROVED);
        return LeaveRequestResponse.from(leaveRequestRepository.save(leave));
    }

    /** Manager rejects a pending request. The balance is left untouched. */
    @Transactional
    public LeaveRequestResponse reject(Long leaveId) {
        LeaveRequest leave = findLeave(leaveId);
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be rejected");
        }

        leave.setStatus(LeaveStatus.REJECTED);
        return LeaveRequestResponse.from(leaveRequestRepository.save(leave));
    }

    private LeaveRequest findLeave(Long leaveId) {
        return leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new NoSuchElementException("Leave request not found: " + leaveId));
    }
}
