package com.taskmanagement.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "tasks")
public class Task {
    @Id
    private String id;

    private String title;
    private String description;
    private String status; // TODO, IN_PROGRESS, DONE
    private String priority; // LOW, MEDIUM, HIGH
    private String assignedTo; // username
    private LocalDateTime dueDate;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt;

    // New fields
    private java.util.List<Comment> comments = new java.util.ArrayList<>();
    private java.util.List<SubTask> subtasks = new java.util.ArrayList<>();

    // Bitrix24 Features
    private long timeSpentMilliseconds; // For Time Tracking
    private java.util.List<String> dependencyIds = new java.util.ArrayList<>(); // For Task Blocking

    // Todoist Features
    private String project = "Inbox";
}
