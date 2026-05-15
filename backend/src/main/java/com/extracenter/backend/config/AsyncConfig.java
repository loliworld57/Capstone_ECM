package com.extracenter.backend.config;

import java.util.concurrent.Executor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class AsyncConfig {

    /**
     * Configure thread pool for @Async tasks (like email sending).
     * Prevents blocking the main request thread while sending emails via SMTP.
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);         
        executor.setMaxPoolSize(10);          
        executor.setQueueCapacity(100);         
        executor.setThreadNamePrefix("email-task-");
        executor.initialize();
        return executor;
    }
}