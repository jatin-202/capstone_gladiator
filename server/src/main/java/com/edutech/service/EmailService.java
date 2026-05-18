package com.edutech.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("✈️ Gladiator Airlines - Your OTP Code");
        message.setText(
            "Hello,\n\n" +
            "Your OTP verification code is: " + otp + "\n\n" +
            "This code is valid for 5 minutes.\n\n" +
            "— Gladiator Airlines Team"
        );
        mailSender.send(message);
    }
}