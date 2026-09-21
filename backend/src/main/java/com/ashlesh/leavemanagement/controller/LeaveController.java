package com.ashlesh.leavemanagement.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ashlesh.leavemanagement.dto.ApplyLeaveRequest;
import com.ashlesh.leavemanagement.dto.LeaveRequestResponse;
import com.ashlesh.leavemanagement.service.LeaveService;

import jakarta.validation.Valid;

/** Employee side of the leave workflow. */
@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService leaveService;

    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    /** POST /api/leaves -> 201 Created. */
    @PostMapping
    public ResponseEntity<LeaveRequestResponse> apply(@Valid @RequestBody ApplyLeaveRequest request,
                                                     Authentication authentication) {
        LeaveRequestResponse created = leaveService.apply(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /** GET /api/leaves -> own leave requests. */
    @GetMapping
    public List<LeaveRequestResponse> myLeaves(Authentication authentication) {
        return leaveService.getMyLeaves(authentication.getName());
    }

    /** PATCH /api/leaves/{id}/cancel -> cancels one of your own pending requests. */
    @PatchMapping("/{id}/cancel")
    public LeaveRequestResponse cancel(@PathVariable Long id, Authentication authentication) {
        return leaveService.cancel(id, authentication.getName());
    }
}
