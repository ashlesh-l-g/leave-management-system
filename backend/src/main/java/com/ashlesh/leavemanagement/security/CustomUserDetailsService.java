package com.ashlesh.leavemanagement.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.ashlesh.leavemanagement.repository.UserRepository;

/**
 * Tells Spring Security how to look a user up.
 *
 * Spring Security does not know about our "users" table, so this class loads a
 * User entity with the repository and converts it into a UserDetails object
 * (Spring Security's own view of a user: username, password hash, roles).
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        com.ashlesh.leavemanagement.entity.User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("No user found with email " + email));

        // roles("EMPLOYEE") stores the authority "ROLE_EMPLOYEE", which is what
        // hasRole("EMPLOYEE") checks for in SecurityConfig.
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .roles(user.getRole().name())
                .build();
    }
}
