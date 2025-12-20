package com.taskmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TaskManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(TaskManagementApplication.class, args);
	}

	@org.springframework.context.annotation.Bean
	public org.springframework.boot.CommandLineRunner onStart() {
		return args -> {
			System.out.println("\n\n\t----------------------------------------------------------");
			System.out.println("\t\tApplication is running! Access it here:");
			System.out.println("\t\thttp://localhost:8080");
			System.out.println("\t----------------------------------------------------------\n\n");
		};
	}

}
