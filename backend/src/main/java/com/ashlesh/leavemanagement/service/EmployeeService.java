package com.ashlesh.leavemanagement.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.ashlesh.leavemanagement.dto.LeaveBalanceResponse;
import com.ashlesh.leavemanagement.dto.UserProfileResponse;
import com.ashlesh.leavemanagement.entity.Role;
import com.ashlesh.leavemanagement.entity.User;
import com.ashlesh.leavemanagement.repository.LeaveBalanceRepository;
import com.ashlesh.leavemanagement.repository.UserRepository;

/** Reads employee data: profile, leave balances and the employee list. */
@Service
public class EmployeeService {

    private final UserRepository userRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;

    public EmployeeService(UserRepository userRepository, LeaveBalanceRepository leaveBalanceRepository) {
        this.userRepository = userRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
    }

    /** The logged-in user, looked up by the email stored in the JWT. */
    public User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
    }

    public UserProfileResponse getProfile(String email) {
        return UserProfileResponse.from(findUser(email));
    }

    public List<LeaveBalanceResponse> getBalances(String email) {
        User user = findUser(email);
        return leaveBalanceRepository.findByUserId(user.getId())
                .stream()
                .map(LeaveBalanceResponse::from)
                .toList();
    }

    /** Used by the manager dashboard. */
    public List<UserProfileResponse> getAllEmployees() {
        return userRepository.findByRole(Role.EMPLOYEE)
                .stream()
                .map(UserProfileResponse::from)
                .toList();
    }
}
