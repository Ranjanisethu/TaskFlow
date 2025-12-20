package com.taskmanagement.model;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class Comment {
    private String id = UUID.randomUUID().toString();
    private String author; // Username
    private String content;
    private LocalDateTime createdAt = LocalDateTime.now();
}
