package com.mindswipe;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * mindSwipe backend — Phase 2, build-1.
 *
 * Goal of build-1: serve the swipe feed and capture every user input
 * (answer choice, like/dislike, view) into Postgres. No auth/RLS yet — a stub
 * demo user stands in until Supabase Auth lands in a later build.
 */
@SpringBootApplication
public class MindSwipeApplication {
    public static void main(String[] args) {
        SpringApplication.run(MindSwipeApplication.class, args);
    }
}
