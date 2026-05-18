package com.edutech.service;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OtpStore {

    private Map<String, String> otpMap = new ConcurrentHashMap<>();
    private Map<String, LocalDateTime> otpExpiry = new ConcurrentHashMap<>();

    // Save OTP with 5 min expiry
    public void saveOtp(String email, String otp) {
        otpMap.put(email, otp);
        otpExpiry.put(email, LocalDateTime.now().plusMinutes(5));
    }

    // Get OTP
    public String getOtp(String email) {
        return otpMap.get(email);
    }

    // Check if OTP is expired
    public boolean isExpired(String email) {
        LocalDateTime expiry = otpExpiry.get(email);
        if (expiry == null)
            return true;
        return LocalDateTime.now().isAfter(expiry);
    }

    // Clear OTP after use
    public void clearOtp(String email) {
        otpMap.remove(email);
        otpExpiry.remove(email);
    }
}