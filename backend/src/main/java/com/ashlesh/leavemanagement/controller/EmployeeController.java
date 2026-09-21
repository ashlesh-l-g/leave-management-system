package com.ashlesh.leavemanagement.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ashlesh.leavemanagement.dto.LeaveBalanceResponse;
import com.ashlesh.leavemanagement.dto.UserProfileResponse;
import com.ashlesh.leavemanagement.service.EmployeeService;

/**
 * Endpoints about the logged-in user.
 * "Authentication" is filled in by Spring Security from the JWT; getName()
 * returns the email that JwtAuthFilter put into the security context.
 */
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    /** GET /api/employees/me -> the profile of the logged-in user. */
    @GetMapping("/me")
    public UserProfileResponse me(Authentication authentication) {
        return employeeService.getProfile(authentication.getName());
    }

    /** GET /api/employees/me/balances -> remaining days per leave type. */
    @GetMapping("/me/balances")
    public List<LeaveBalanceResponse> myBalances(Authentication authentication) {
        return employeeService.getBalances(authentication.getName());
    }
}
