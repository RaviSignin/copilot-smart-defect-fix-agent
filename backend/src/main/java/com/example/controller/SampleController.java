package com.example.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SampleController {

    @GetMapping({"/sample", "/api/sample"})
    public String sample() {
        return "Sample Response";
    }
}
