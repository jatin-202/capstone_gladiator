package com.edutech.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private final Map<String, String> otpStore = new ConcurrentHashMap<>();
    private final Map<String, Long> otpExpiry = new ConcurrentHashMap<>();
    private static final long OTP_VALIDITY = 5 * 60 * 1000;

    // ✅ Generate 6-digit OTP
    public String generateOtp(String email) {
        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStore.put(email, otp);
        otpExpiry.put(email, System.currentTimeMillis() + OTP_VALIDITY);
        return otp;
    }

    // ✅ Verify OTP
    public boolean verifyOtp(String email, String otp) {
        if (!otpStore.containsKey(email)) return false;

        if (System.currentTimeMillis() > otpExpiry.get(email)) {
            otpStore.remove(email);
            otpExpiry.remove(email);
            return false;
        }

        boolean valid = otpStore.get(email).equals(otp);
        if (valid) {
            otpStore.remove(email);
            otpExpiry.remove(email);
        }
        return valid;
    }
}