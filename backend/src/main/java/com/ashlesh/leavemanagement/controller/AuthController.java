package com.ashlesh.leavemanagement.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ashlesh.leavemanagement.dto.AuthResponse;
import com.ashlesh.leavemanagement.dto.LoginRequest;
import com.ashlesh.leavemanagement.dto.RegisterRequest;
import com.ashlesh.leavemanagement.service.AuthService;

import jakarta.validation.Valid;

/**
 * @RestController = @Controller + @ResponseBody: the returned object is written
 * into the HTTP response body as JSON.
 *
 * A controller's only job is to translate HTTP into a service call and back.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** POST /api/auth/register -> 201 Created with a JWT. */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /** POST /api/auth/login -> 200 OK with a JWT, or 401 if the credentials are wrong. */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
