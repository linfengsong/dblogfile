package com.example.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ValueController {
    
    @GetMapping("/api/value")
    public String getValue() {
        return "Hello from Java Backend!";
    }
}