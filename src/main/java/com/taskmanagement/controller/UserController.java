package com.taskmanagement.controller;

import com.taskmanagement.model.User;
import com.taskmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<String> getAllUsernames() {
        return userRepository.findAll().stream()
                .map(User::getUsername)
                .collect(Collectors.toList());
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        return userRepository.findByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers() {
        // Return clear list for admin viewing (masking passwords)
        List<User> users = userRepository.findAll();
        users.forEach(u -> u.setPassword("********"));
        return ResponseEntity.ok(users);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody User updatedUser) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));

        if (updatedUser.getEmail() != null)
            user.setEmail(updatedUser.getEmail());
        if (updatedUser.getDesignation() != null)
            user.setDesignation(updatedUser.getDesignation());

        // Preferences
        if (updatedUser.getTheme() != null)
            user.setTheme(updatedUser.getTheme());
        if (updatedUser.getLanguage() != null)
            user.setLanguage(updatedUser.getLanguage());
        if (updatedUser.getPrimaryColor() != null)
            user.setPrimaryColor(updatedUser.getPrimaryColor());

        userRepository.save(user);
        return ResponseEntity.ok(user);
    }
}
