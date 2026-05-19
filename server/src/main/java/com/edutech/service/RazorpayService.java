package com.edutech.service;

import org.springframework.stereotype.Service;
import com.razorpay.RazorpayClient;

@Service
public class RazorpayService {

    private RazorpayClient client;

    public RazorpayService() throws Exception {
        this.client = new RazorpayClient("rzp_test_SrA14PhZjbcV0H", "cBJlc9pYPEmbeEALN02nB2yj");
    }

    public RazorpayClient getClient() {
        return client;
    }
}