package com.taskmanagement.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "users")
public class User {
    @Id
    private String id;

    @Indexed(unique = true)
    private String username;

    private String password;
    private String roles; // e.g., "ROLE_USER"

    // Profile
    private String email;
    private String designation;
    private String company; // For Multi-tenancy Isolation
    private String department;

    // Preferences
    private String theme = "light"; // light, dark
    private String language = "en"; // en, es, de
    private String primaryColor = "#6366f1";

    // Gamification
    private int karmaPoints = 0;
}
