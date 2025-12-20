package com.taskmanagement.service;

import com.taskmanagement.model.User;
import com.taskmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    public User registerUser(String username, String password, String email) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        User user = new User();
        user.setUsername(username);
        user.setEmail(email); // Save email
        user.setPassword(passwordEncoder.encode(password));
        return userRepository.save(user);
    }

    public void resetPassword(String email) {
        User user = userRepository.findAll().stream()
                .filter(u -> email.equals(u.getEmail()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("User with this email not found"));

        // Generate temp password (8 chars)
        String tempPassword = java.util.UUID.randomUUID().toString().substring(0, 8);

        // Save new password
        user.setPassword(passwordEncoder.encode(tempPassword));
        userRepository.save(user);

        // Send email
        emailService.sendEmail(
                user.getEmail(),
                "Password Reset Request - TaskFlow",
                "Hello " + user.getUsername() + ",\n\nYour password has been reset. \nYour new temporary password is: "
                        + tempPassword + "\n\nPlease login and change it immediately.");
    }
}
