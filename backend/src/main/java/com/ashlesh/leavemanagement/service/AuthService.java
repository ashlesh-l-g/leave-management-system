package com.ashlesh.leavemanagement.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.ashlesh.leavemanagement.dto.AuthResponse;
import com.ashlesh.leavemanagement.dto.LoginRequest;
import com.ashlesh.leavemanagement.dto.RegisterRequest;
import com.ashlesh.leavemanagement.entity.LeaveBalance;
import com.ashlesh.leavemanagement.entity.LeaveType;
import com.ashlesh.leavemanagement.entity.Role;
import com.ashlesh.leavemanagement.entity.User;
import com.ashlesh.leavemanagement.repository.LeaveBalanceRepository;
import com.ashlesh.leavemanagement.repository.UserRepository;
import com.ashlesh.leavemanagement.security.JwtService;

/**
 * Registration and login.
 *
 * @Service means "this class holds business logic". Spring creates one instance
 * (a bean) and injects it wherever it is needed - that is dependency injection.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       LeaveBalanceRepository leaveBalanceRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    /**
     * Creates a new employee, gives them the default leave balances and returns a token
     * so the frontend can log the user straight in. Managers are created by DataInitializer.
     */
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already registered: " + email);
        }

        User user = new User(request.name(), email, passwordEncoder.encode(request.password()), Role.EMPLOYEE);
        userRepository.save(user);
        createDefaultBalances(user);

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getName(), user.getEmail(), user.getRole());
    }

    /** Checks the password with Spring Security and returns a fresh token. */
    public AuthResponse login(LoginRequest request) {
        String email = request.email().toLowerCase();

        // Throws BadCredentialsException when the email/password pair is wrong.
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Incorrect email or password"));

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getName(), user.getEmail(), user.getRole());
    }

    /** One balance row per leave type, e.g. 12 CASUAL days. */
    public void createDefaultBalances(User user) {
        for (LeaveType type : LeaveType.values()) {
            leaveBalanceRepository.save(new LeaveBalance(user, type, type.getDefaultDays(), 0));
        }
    }
}
