package com.taskmanagement.controller;

import com.taskmanagement.model.Task;
import com.taskmanagement.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public List<Task> getAllTasks(java.security.Principal principal) {
        if (principal == null) {
            // For testing or unauthenticated (should be blocked by SecurityConfig, but
            // fallback)
            return java.util.Collections.emptyList();
        }
        return taskService.getTasksForUser(principal.getName());
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        Task createdTask = taskService.createTask(task);
        messagingTemplate.convertAndSend("/topic/tasks", createdTask); // Real-time update
        return createdTask;
    }

    @PutMapping("/{id}")
    public Task updateTask(@PathVariable String id, @RequestBody Task task) {
        Task updatedTask = taskService.updateTask(id, task);
        messagingTemplate.convertAndSend("/topic/tasks", updatedTask); // Real-time update
        return updatedTask;
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable String id) {
        taskService.deleteTask(id);
        messagingTemplate.convertAndSend("/topic/tasks/delete", id); // Real-time deletion
    }

    @PostMapping("/{id}/comments")
    public Task addComment(@PathVariable String id, @RequestBody com.taskmanagement.model.Comment comment) {
        Task updatedTask = taskService.addComment(id, comment);
        if (updatedTask != null) {
            messagingTemplate.convertAndSend("/topic/tasks", updatedTask);
        }
        return updatedTask;
    }
}
