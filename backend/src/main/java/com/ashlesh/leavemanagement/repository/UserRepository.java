package com.ashlesh.leavemanagement.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ashlesh.leavemanagement.entity.Role;
import com.ashlesh.leavemanagement.entity.User;

/**
 * Spring Data JPA generates the implementation of this interface at runtime.
 * The method names are parsed into SQL queries (derived queries).
 */
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(Role role);
}
