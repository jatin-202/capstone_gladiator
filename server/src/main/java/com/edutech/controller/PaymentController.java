package com.edutech.controller;

import com.edutech.service.RazorpayService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/payment")
@CrossOrigin(origins = "*")

public class PaymentController {

    @Autowired
    private RazorpayService razorpayService;

    @PostMapping("/create-order")
    public String createOrder(@RequestBody Map<String, Object> data) {
        try {
            int amount = Integer.parseInt(data.get("amount").toString());

            RazorpayClient client = razorpayService.getClient();

            JSONObject options = new JSONObject();
            options.put("amount", amount * 100);
            options.put("currency", "INR");
            options.put("receipt", "txn_" + System.currentTimeMillis());

            Order order = client.orders.create(options);

            return order.toString();

        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }
}