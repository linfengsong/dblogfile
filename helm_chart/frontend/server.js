const express = require('express');
const path = require('path');

const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Start server on port 3000
app.listen(3000, () => {
    console.log('Frontend server is running on http://localhost:3000');
});