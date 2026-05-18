// package com.edutech.service;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Service;

// import java.util.Random;

// @Service
// public class OtpService {

//     @Autowired
//     private EmailService emailService;

//     @Autowired
//     private OtpStore otpStore;

//     // ✅ ✅ ✅ ADD THIS METHOD BACK (IMPORTANT)
//     public void generateAndSendOtp(String email) {

//         String otp = String.valueOf(100000 + new Random().nextInt(900000));

//         otpStore.saveOtp(email, otp);

//         System.out.println("Generated OTP for " + email + " = " + otp);

//         try {
//             emailService.sendOtp(email, otp);
//             System.out.println("✅ Email sent successfully");
//         } catch (Exception e) {
//             System.out.println("❌ Email FAILED but OTP still generated");
//             e.printStackTrace();

//             // ✅ VERY IMPORTANT: DO NOT THROW EXCEPTION
//             // otherwise your API crashes → 502
//         }
//     }

//     // ✅ VERIFY OTP
//     public boolean verifyOtp(String email, String otp) {

//         try {
//             if (otpStore.isExpired(email)) {
//                 otpStore.clearOtp(email);
//                 return false;
//             }

//             String savedOtp = otpStore.getOtp(email);

//             if (savedOtp == null) {
//                 return false;
//             }

//             if (savedOtp.equals(otp)) {
//                 otpStore.clearOtp(email);
//                 return true;
//             }

//             return false;

//         } catch (Exception e) {
//             e.printStackTrace();
//             return false;
//         }
//     }
// }