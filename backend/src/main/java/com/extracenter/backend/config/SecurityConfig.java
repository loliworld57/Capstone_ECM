package com.extracenter.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import jakarta.servlet.DispatcherType;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

        @Autowired
        private JwtAuthenticationFilter jwtAuthenticationFilter;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

                http
                                // disable CSRF for REST API
                                .csrf(csrf -> csrf.disable())

                                // enable CORS (default config or you can customize later)
                                .cors(cors -> cors.configure(http))

                                .authorizeHttpRequests(auth -> auth

                                                // allow error + forward requests
                                                .dispatcherTypeMatchers(
                                                                DispatcherType.ERROR,
                                                                DispatcherType.FORWARD)
                                                .permitAll()

                                                // allow preflight
                                                .requestMatchers("/", "/api", "/api/").permitAll()
                                                // PUBLIC APIs
                                                .requestMatchers(
                                                                "/api/users/login",
                                                                "/api/users/register-teacher",
                                                                "/api/users/verify-otp",
                                                                "/api/users/resend-otp",
                                                                "/api/health",
                                                                "/api/status",
                                                                "/error")
                                                .permitAll()

                                                // PUBLIC SWAGGER/API DOCUMENTATION
                                                .requestMatchers(
                                                                "/swagger-ui.html",
                                                                "/swagger-ui/**",
                                                                "/v3/api-docs",
                                                                "/v3/api-docs/**",
                                                                "/swagger-resources",
                                                                "/swagger-resources/**")
                                                .permitAll()

                                                // ADMIN ONLY
                                                .requestMatchers("/api/users/admin/**")
                                                .hasRole("ADMIN")

                                                // TEACHER / MANAGER / ADMIN
                                                .requestMatchers(
                                                                "/api/users/teacher/**",
                                                                "/api/users/create-student",
                                                                "/api/users/search")
                                                .hasAnyRole("TEACHER", "MANAGER", "ADMIN")

                                                // TEACHER / MANAGER / ADMIN (courses, schedule, centers)
                                                .requestMatchers(
                                                                "/api/schedule/teacher/**",
                                                                "/api/courses/teacher/**",
                                                                "/api/courses/invitations/**",
                                                                "/api/centers/teacher/**",
                                                                "/api/centers/teaching/**",
                                                                "/api/tuition/**")
                                                .hasAnyRole("TEACHER", "MANAGER", "ADMIN")

                                                // CENTERS ACCESS
                                                .requestMatchers("/api/centers/**")
                                                .hasAnyRole("TEACHER", "MANAGER", "ADMIN")

                                                // STUDENT ACCESS
                                                .requestMatchers(
                                                                "/api/schedule/student/**",
                                                                "/api/courses/student/**",
                                                                "/api/assignments/student/**",
                                                                "/api/tuition/student/**")
                                                .hasAnyRole("STUDENT", "ADMIN")

                                                // COURSE WRITE OPERATIONS
                                                .requestMatchers(HttpMethod.POST, "/api/courses/**")
                                                .hasAnyRole("TEACHER", "MANAGER", "ADMIN")

                                                .requestMatchers(HttpMethod.PUT, "/api/courses/**")
                                                .hasAnyRole("TEACHER", "MANAGER", "ADMIN")

                                                .requestMatchers(HttpMethod.DELETE, "/api/courses/**")
                                                .hasAnyRole("TEACHER", "MANAGER", "ADMIN")

                                                // MATERIALS
                                                .requestMatchers("/api/materials/**")
                                                .hasAnyRole("TEACHER", "MANAGER", "ADMIN", "STUDENT")

                                                // ASSIGNMENTS
                                                .requestMatchers("/api/assignments/**")
                                                .hasAnyRole("TEACHER", "MANAGER", "ADMIN", "STUDENT")

                                                // everything else must be authenticated
                                                .anyRequest().authenticated())

                                // JWT filter
                                .addFilterBefore(
                                                jwtAuthenticationFilter,
                                                UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }
}