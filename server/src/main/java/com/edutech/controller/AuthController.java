package com.edutech.controller;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.edutech.dto.LoginRequest;
import com.edutech.dto.LoginResponse;
import com.edutech.dto.OtpRequest;
import com.edutech.dto.OtpResponse;
import com.edutech.entity.User;
import com.edutech.service.UserService;
import com.edutech.service.OtpService;
import com.edutech.service.EmailService;
import com.edutech.util.JwtUtil;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    // ✅ REGISTER → Save user + Send OTP
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody User user) {
        try {

            if (userService.existsByUsername(user.getUsername())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(java.util.Map.of(
                                "field", "username",
                                "message", "Username already exists"));
            }

            if (userService.existsByEmail(user.getEmail())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(java.util.Map.of(
                                "field", "email",
                                "message", "Email already exists"));
            }

            // Save user
            User saved = userService.registerUser(user);

            // ✅ Send OTP to email
            String otp = otpService.generateOtp(saved.getEmail());
            emailService.sendOtpEmail(saved.getEmail(), otp);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(java.util.Map.of(
                            "message", "OTP sent to your email",
                            "email", saved.getEmail(),
                            "username", saved.getUsername(),
                            "otpRequired", true
                    ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(java.util.Map.of("message", "Registration failed"));
        }
    }

    // ✅ VERIFY OTP → Registration
    @PostMapping("/verify-register-otp")
    public ResponseEntity<?> verifyRegisterOtp(@RequestBody OtpRequest request) {
        boolean valid = otpService.verifyOtp(request.getEmail(), request.getOtp());
        if (valid) {
            return ResponseEntity.ok(new OtpResponse("Email verified successfully", true));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new OtpResponse("Invalid or expired OTP", false));
    }

    // ✅ LOGIN → Validate credentials + Send OTP (NO token yet)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(), request.getPassword()));

            User user = userService.findByUsername(request.getUsername());

            // ✅ Send OTP instead of returning token
            String otp = otpService.generateOtp(user.getEmail());
            emailService.sendOtpEmail(user.getEmail(), otp);

            return ResponseEntity.ok(java.util.Map.of(
                    "message", "OTP sent to your email",
                    "email", user.getEmail(),
                    "username", user.getUsername(),
                    "otpRequired", true
            ));

        } catch (Exception e) {
            e.printStackTrace();
            java.util.Map<String, Object> error = new java.util.HashMap<>();
            error.put("status", 401);
            error.put("message", "Invalid username or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    // ✅ VERIFY OTP → Login (returns JWT token)
    @PostMapping("/verify-login-otp")
    public ResponseEntity<?> verifyLoginOtp(@RequestBody OtpRequest request) {
        boolean valid = otpService.verifyOtp(request.getEmail(), request.getOtp());

        if (!valid) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new OtpResponse("Invalid or expired OTP", false));
        }

        // ✅ OTP valid → Generate JWT
        User user = userService.findByEmail(request.getEmail());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new OtpResponse("User not found", false));
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        LoginResponse response = new LoginResponse(
                token, user.getUsername(), user.getEmail(),
                user.getRole(), user.getId());

        return ResponseEntity.ok(response);
    }

    // ✅ RESEND OTP (generic — works for both register & login)
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody OtpRequest request) {
        try {
            String otp = otpService.generateOtp(request.getEmail());
            emailService.sendOtpEmail(request.getEmail(), otp);
            return ResponseEntity.ok(new OtpResponse("OTP sent successfully", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new OtpResponse("Failed to send OTP", false));
        }
    }

    // Return the currently authenticated user's profile
    @GetMapping("/user")
    public ResponseEntity<User> getLoggedInUser(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(user);
    }

    // ✅ REAL-TIME USERNAME CHECK
    @GetMapping("/check-username/{username}")
    public ResponseEntity<Boolean> checkUsername(@PathVariable String username) {
        boolean exists = userService.existsByUsername(username);
        return ResponseEntity.ok(exists);
    }

    // ✅ REAL-TIME EMAIL CHECK
    @GetMapping("/check-email/{email}")
    public ResponseEntity<Boolean> checkEmail(@PathVariable String email) {
        boolean exists = userService.existsByEmail(email);
        return ResponseEntity.ok(exists);
    }
}