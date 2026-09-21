package com.ashlesh.leavemanagement.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ashlesh.leavemanagement.dto.LeaveRequestResponse;
import com.ashlesh.leavemanagement.dto.UserProfileResponse;
import com.ashlesh.leavemanagement.service.EmployeeService;
import com.ashlesh.leavemanagement.service.LeaveService;

/**
 * Manager-only endpoints.
 * SecurityConfig protects this whole path with hasRole("MANAGER"), so the
 * methods below never even run for an employee account (they get 403).
 */
@RestController
@RequestMapping("/api/manager")
public class ManagerController {

    private final LeaveService leaveService;
    private final EmployeeService employeeService;

    public ManagerController(LeaveService leaveService, EmployeeService employeeService) {
        this.leaveService = leaveService;
        this.employeeService = employeeService;
    }

    /** GET /api/manager/leaves/pending -> requests waiting for a decision. */
    @GetMapping("/leaves/pending")
    public List<LeaveRequestResponse> pendingLeaves() {
        return leaveService.getPendingLeaves();
    }

    /** PATCH /api/manager/leaves/{id}/approve */
    @PatchMapping("/leaves/{id}/approve")
    public LeaveRequestResponse approve(@PathVariable Long id) {
        return leaveService.approve(id);
    }

    /** PATCH /api/manager/leaves/{id}/reject */
    @PatchMapping("/leaves/{id}/reject")
    public LeaveRequestResponse reject(@PathVariable Long id) {
        return leaveService.reject(id);
    }

    /** GET /api/manager/employees -> all employees. */
    @GetMapping("/employees")
    public List<UserProfileResponse> employees() {
        return employeeService.getAllEmployees();
    }
}
