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
        // Multi-tenancy Isolation: Only show tasks for user's company
        Optional<com.taskmanagement.model.User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            String company = userOpt.get().getCompany();
            if (company == null)
                company = "Freelancers"; // Fallback

            final String targetCompany = company; // Effective final for lambda
            // Filter tasks
            return taskRepository.findAll().stream()
                    .filter(t -> targetCompany.equals(t.getCompany()))
                    .collect(java.util.stream.Collectors.toList());
        }
        return java.util.Collections.emptyList();
    }

    public Task createTask(Task task, String username) {
        // Assign company from creator
        userRepository.findByUsername(username).ifPresent(user -> {
            String company = user.getCompany();
            task.setCompany(company != null ? company : "Freelancers");
        });

        task.setCreatedAt(LocalDateTime.now());
        Task savedTask = taskRepository.save(task);

        // Send Email Notification (Mock)
        if (task.getAssignedTo() != null && !task.getAssignedTo().isEmpty()) {
            userRepository.findByUsername(task.getAssignedTo()).ifPresent(user -> {
                System.out.println("--- [MOCK EMAIL] To: " + user.getEmail() + " | Subject: New Task Assigned | Task: "
                        + task.getTitle() + " ---");
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
