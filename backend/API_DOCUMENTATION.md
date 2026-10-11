# API Documentation Guide

## Overview
Your Education Center Management API now includes comprehensive API documentation and health check endpoints. This guide shows you how to access and use them.

## Access Points

### 1. **Health Check Endpoint** (Simple Status Check)
```
GET http://localhost:8080/api/health
```
**Purpose**: Quick verification that the API is running  
**Response**: Simple JSON with status "UP"

**Example Response**:
```json
{
  "status": "UP",
  "message": "Education Center Management API is running",
  "timestamp": "2026-05-05T10:30:45.123456",
  "service": "EducationCenterBackend"
}
```

### 2. **API Status Endpoint** (Detailed Information)
```
GET http://localhost:8080/api/status
```
**Purpose**: Get detailed status and list of available endpoints  
**Response**: Service version, build info, and available endpoints

**Example Response**:
```json
{
  "status": "OPERATIONAL",
  "service": "Education Center Management System",
  "version": "1.0.0",
  "timestamp": "2026-05-05T10:30:45.123456",
  "buildVersion": "0.0.1-SNAPSHOT",
  "availableEndpoints": {
    "Health Check": "/api/health",
    "API Documentation (Swagger UI)": "/swagger-ui.html",
    "API Docs JSON": "/v3/api-docs",
    "Users": "/api/users",
    "Centers": "/api/centers",
    "Courses": "/api/courses",
    "Enrollments": "/api/enrollments"
  }
}
```

### 3. **Welcome Endpoint** (API Information)
```
GET http://localhost:8080/api/
```
**Purpose**: Welcome message with API information and links  
**Response**: Description and quick links to all documentation

### 4. **Swagger UI** (Interactive API Documentation)
```
http://localhost:8080/swagger-ui.html
```
**Purpose**: Interactive web interface to explore and test all API endpoints  
**Features**:
- View all endpoints with descriptions
- See request/response schemas
- Try out endpoints directly from the browser
- View authentication requirements
- Test with different parameters

### 5. **OpenAPI JSON** (Machine-readable API spec)
```
GET http://localhost:8080/v3/api-docs
```
**Purpose**: Raw OpenAPI 3.0 specification in JSON format  
**Use case**: Import into API testing tools like Postman, Insomnia, etc.

---

## How to Use

### Option 1: Simple Health Check (Command Line)
```bash
# Using curl
curl http://localhost:8080/api/health

# Using PowerShell
Invoke-WebRequest -Uri "http://localhost:8080/api/health" | Select-Object -ExpandProperty Content
```

### Option 2: Detailed Status Check
```bash
curl http://localhost:8080/api/status
```

### Option 3: Interactive Swagger UI (Browser)
1. Start your Spring Boot application
2. Open browser: `http://localhost:8080/swagger-ui.html`
3. Browse through all available endpoints
4. Click on any endpoint to see details
5. Use "Try it out" button to test endpoints

### Option 4: Import to Postman
1. Open Postman
2. File → Import → URL
3. Enter: `http://localhost:8080/v3/api-docs`
4. All endpoints will be imported automatically

---

## What Changed?

### New Dependencies
- **springdoc-openapi-starter-webmvc-ui**: Provides automatic API documentation generation

### New Files Created
- `ApiStatusController.java`: Health check and API information endpoints

### Configuration Updates
- `application.properties`: SpringDoc configuration for Swagger UI
- `SecurityConfig.java`: Added public access to health/status/Swagger UI endpoints

---

## API Endpoints Available

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Health check - verify API is running |
| GET | `/api/status` | Detailed API status and available endpoints |
| GET | `/api/` | Welcome message with links |
| GET | `/swagger-ui.html` | Interactive API documentation (Swagger UI) |
| GET | `/v3/api-docs` | OpenAPI 3.0 specification (JSON) |

---

## Testing the API

### Using cURL
```bash
# Test if API is running
curl -X GET "http://localhost:8080/api/health"

# Get detailed status
curl -X GET "http://localhost:8080/api/status"

# Get welcome message
curl -X GET "http://localhost:8080/api/"
```

### Using Postman
1. Create a new GET request
2. Enter URL: `http://localhost:8080/api/health`
3. Click "Send"
4. View the response

### Using Insomnia
1. Create a new request
2. Method: GET
3. URL: `http://localhost:8080/api/health`
4. Send

---

## Next Steps

1. **Build & Run** the application:
   ```bash
   mvn clean build
   mvn spring-boot:run
   ```

2. **Access Swagger UI**: Open `http://localhost:8080/swagger-ui.html` in your browser

3. **Test endpoints**: Use Swagger UI or Postman to test your API

4. **View documentation**: All your existing controllers (UserController, CourseController, etc.) are automatically documented in Swagger UI

---

## Security Note

The following endpoints are publicly accessible (no authentication required):
- `/api/health`
- `/api/status`
- `/api/`
- `/swagger-ui.html`
- `/v3/api-docs`

All other endpoints still require proper authentication (JWT token).

