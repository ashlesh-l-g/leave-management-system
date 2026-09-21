package com.ashlesh.leavemanagement.entity;

/**
 * The two roles in this application.
 * Spring Security expects role names to be prefixed with "ROLE_" when used
 * with hasRole(...) checks - that prefix is added automatically in
 * CustomUserDetailsService.
 */
public enum Role {
    EMPLOYEE,
    MANAGER
}
