package com.ashlesh.leavemanagement.dto;

import com.ashlesh.leavemanagement.entity.Role;
import com.ashlesh.leavemanagement.entity.User;

/** Basic profile information. The password is never included. */
public record UserProfileResponse(
        Long id,
        String name,
        String email,
        Role role) {

    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}
