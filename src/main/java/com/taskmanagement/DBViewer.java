package com.taskmanagement;

import com.taskmanagement.model.User;
import com.taskmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DBViewer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("\n\n=============================================");
        System.out.println("       CURRENT REGISTERED USERS (DB DUMP)      ");
        System.out.println("=============================================");

        List<User> users = userRepository.findAll();
        if (users.isEmpty()) {
            System.out.println("No users found in database.");
        } else {
            System.out.printf("%-20s | %-30s | %-15s%n", "USERNAME", "EMAIL", "ROLES");
            System.out.println("-----------------------------------------------------------------");
            for (User u : users) {
                System.out.printf("%-20s | %-30s | %-15s%n",
                        u.getUsername(),
                        (u.getEmail() != null ? u.getEmail() : "N/A"),
                        (u.getRoles() != null ? u.getRoles() : "N/A"));
            }
        }
        System.out.println("=============================================\n\n");
    }
}
