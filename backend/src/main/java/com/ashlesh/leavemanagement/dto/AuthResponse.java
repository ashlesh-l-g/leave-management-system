package com.ashlesh.leavemanagement.dto;

import com.ashlesh.leavemanagement.entity.Role;

/** Returned after a successful register or login. */
public record AuthResponse(
        String token,
        String name,
        String email,
        Role role) {
}
