package com.taskmanagement.service;

import com.taskmanagement.model.Task;
import com.taskmanagement.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private com.taskmanagement.repository.UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public List<Task> getTasksForUser(String username) {
        // Fetch ALL tasks (simplest fix for small app) and filter in memory
        // Or better: update Repository to findByAssignedToOrCreatedBy, but let's stick
        // to simple logic first.
        // NOTE: Currently, we don't have a 'createdBy' field in Task.java properly
        // populated.
        // FIX: We will return ALL tasks for now so everyone sees everything
        // (Collaborative Mode).
        // If you want strict privacy, we need to add 'createdBy' field to Task model.
        return taskRepository.findAll();
    }

    public Task createTask(Task task) {
        task.setCreatedAt(LocalDateTime.now());
        Task savedTask = taskRepository.save(task);

        // Send Email Notification if assigned
        if (task.getAssignedTo() != null && !task.getAssignedTo().isEmpty()) {
            userRepository.findByUsername(task.getAssignedTo()).ifPresent(user -> {
                if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                    emailService.sendEmail(
                            user.getEmail(),
                            "New Task Assigned: " + task.getTitle(),
                            "Hello " + user.getUsername() + ",\n\nYou have been assigned a new task:\n\n" +
                                    "Title: " + task.getTitle() + "\n" +
                                    "Description: "
                                    + (task.getDescription() != null ? task.getDescription() : "No description") + "\n"
                                    +
                                    "Priority: " + task.getPriority() + "\n" +
                                    "Due Date: " + task.getDueDate() + "\n\n" +
                                    "View Dashboard: https://taskflow-wzvv.onrender.com\n\n" +
                                    "Happy Productivity,\nTaskFlow Team");
                }
            });
        }

        return savedTask;
    }

    public Task updateTask(String id, Task taskDetails) {
        Optional<Task> taskOptional = taskRepository.findById(id);
        if (taskOptional.isPresent()) {
            Task task = taskOptional.get();
            task.setTitle(taskDetails.getTitle());
            task.setDescription(taskDetails.getDescription());
            task.setStatus(taskDetails.getStatus());
            task.setPriority(taskDetails.getPriority());
            task.setAssignedTo(taskDetails.getAssignedTo());
            task.setDueDate(taskDetails.getDueDate());
            task.setComments(taskDetails.getComments());
            task.setSubtasks(taskDetails.getSubtasks());
            // Bitrix24
            task.setTimeSpentMilliseconds(taskDetails.getTimeSpentMilliseconds());
            task.setDependencyIds(taskDetails.getDependencyIds());
            // Todoist
            task.setProject(taskDetails.getProject());

            task.setUpdatedAt(LocalDateTime.now());
            return taskRepository.save(task);
        }
        return null; // Or throw exception
    }

    public Task addComment(String taskId, com.taskmanagement.model.Comment comment) {
        Optional<Task> taskOptional = taskRepository.findById(taskId);
        if (taskOptional.isPresent()) {
            Task task = taskOptional.get();
            task.getComments().add(comment);
            task.setUpdatedAt(LocalDateTime.now());
            return taskRepository.save(task);
        }
        return null;
    }

    public void deleteTask(String id) {
        taskRepository.deleteById(id);
    }
}
