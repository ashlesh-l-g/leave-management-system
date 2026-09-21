package com.ashlesh.leavemanagement.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.ashlesh.leavemanagement.dto.RegisterRequest;
import com.ashlesh.leavemanagement.entity.Role;
import com.ashlesh.leavemanagement.entity.User;
import com.ashlesh.leavemanagement.repository.UserRepository;
import com.ashlesh.leavemanagement.service.AuthService;

/**
 * Runs once on startup and creates two demo accounts so the app can be tried out
 * immediately. Registration through the UI always creates EMPLOYEE accounts, so
 * this is also the way to get a MANAGER account.
 *
 * Runs only when the users are missing, so restarting does not duplicate them.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private static final String MANAGER_EMAIL = "manager@leave.com";
    private static final String MANAGER_PASSWORD = "manager123";
    private static final String EMPLOYEE_EMAIL = "employee@leave.com";
    private static final String EMPLOYEE_PASSWORD = "employee123";

    private final UserRepository userRepository;
    private final AuthService authService;

    public DataInitializer(UserRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail(MANAGER_EMAIL)) {
            authService.register(new RegisterRequest("Meera Manager", MANAGER_EMAIL, MANAGER_PASSWORD));
            // register() creates employees, so promote this one to manager.
            User manager = userRepository.findByEmail(MANAGER_EMAIL).orElseThrow();
            manager.setRole(Role.MANAGER);
            userRepository.save(manager);
            log.info("Demo manager created -> {} / {}", MANAGER_EMAIL, MANAGER_PASSWORD);
        }

        if (!userRepository.existsByEmail(EMPLOYEE_EMAIL)) {
            authService.register(new RegisterRequest("Evan Employee", EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD));
            log.info("Demo employee created -> {} / {}", EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);
        }
    }
}
