
To implement the described example of a Java backend service and a Node.js frontend that communicates with each other, follow these steps:

### 1. Set Up the Java Backend Service Using Spring Boot

**a. Create a New Spring Boot Project:**
   - Use [Spring Initializr](https://start.spring.io/) to generate a new project.
   - Select "Web" as the dependency.

**b. Create the Controller Class (`ValueController.java`):**

```java
package com.example.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ValueController {
    
    @GetMapping("/api/value")
    public String getValue() {
        return "Hello from Java Backend!";
    }
}
```

**c. Create the Main Application Class (`MainApplication.java`):**

```java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MainApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(MainApplication.class, args);
    }
}
```

**d. Run the Java Backend Service:**
   - Open a terminal and navigate to the project directory.
   - Execute the following command:
     ```bash
     mvn spring-boot:run
     ```
   - The backend service will be available at `http://localhost:8081`.

### 2. Set Up the Node.js Frontend Web Application

**a. Create a New Node.js Project:**
   - Open a terminal and create a new directory for your frontend project.
     ```bash
     mkdir frontend && cd frontend
     ```
   - Initialize a new Node.js project:
     ```bash
     npm init -y
     ```

**b. Install Required Dependencies:**
   - Install Express and EJS:
     ```bash
     npm install express ejs
     ```

**c. Create the Express Server (`server.js`):**

```javascript
const express = require('express');
const path = require('path');

const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Start server on port 3000
app.listen(3000, () => {
    console.log('Frontend server is running on http://localhost:3000');
});
```

**d. Create the Frontend HTML Page (`public/index.html`):**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Java-Node Example</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f0f0f0;
        }
        
        .container {
            text-align: center;
            padding: 2rem;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #333;
            margin-bottom: 1rem;
        }
        
        #value {
            font-size: 1.2rem;
            color: #666;
            min-height: 2rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Java-Node Communication Example</h1>
        <p id="value">Loading...</p>
    </div>

    <script>
        // Fetch data from Java backend
        fetch('http://localhost:8081/api/value')
            .then(response => response.text())
            .then(value => {
                document.getElementById('value').textContent = value;
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('value').textContent = 'Error fetching data';
            });
    </script>
</body>
</html>
```

**e. Start the Node.js Frontend Server:**
   - In your terminal, execute:
     ```bash
     node server.js
     ```
   - The frontend will be accessible at `http://localhost:3000`.

### 3. Verify the Setup

1. **Run the Java Backend Service:**
   - Ensure it's running on port `8081` by checking your terminal.

2. **Run the Node.js Frontend Server:**
   - Make sure it's active on port `3000`.

3. **Access the Application:**
   - Open a web browser and navigate to `http://localhost:3000`.
   - You should see a webpage displaying "Hello from Java Backend!".

### 4. Project Structure

```
backend/
├── src/
│   └── main/
│       └── java/
│           └── com/
│               └── example/
│                   └── demo/
│                       ├── MainApplication.java
│                       └── controller/
│                           └── ValueController.java
├── pom.xml
frontend/
├── server.js
└── public/
    └── index.html
```

### 5. Explanation

- **Java Backend:**
  - Runs on port `8081`.
  - Provides a REST API endpoint `/api/value` that returns "Hello from Java Backend!".

- **Node.js Frontend:**
  - Runs on port `3000`.
  - Serves static files from the `public` directory.
  - Makes a GET request to `http://localhost:8081/api/value` when the page loads and displays the result on the webpage.

This example demonstrates how a Node.js frontend can communicate with a Java backend service, fetching data and displaying it.