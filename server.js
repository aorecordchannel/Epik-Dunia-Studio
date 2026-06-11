const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse incoming request bodies as text to pass to Netlify functions
app.use('/.netlify/functions', express.text({ type: '*/*' }));

// Handle Netlify function routes
app.all('/.netlify/functions/:name', async (req, res) => {
    const functionName = req.params.name;
    const functionPath = path.join(__dirname, 'netlify', 'functions', `${functionName}.js`);
    
    if (!fs.existsSync(functionPath)) {
        console.error(`Function not found: ${functionPath}`);
        return res.status(404).json({ error: 'Function not found' });
    }

    try {
        const handler = require(functionPath).handler;
        
        // Mock Netlify event object
        const event = {
            path: req.path,
            httpMethod: req.method,
            headers: req.headers,
            queryStringParameters: req.query,
            // Express text parser returns string or empty object. Default to string.
            body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}),
            isBase64Encoded: false
        };
        
        const context = {};
        
        // Execute the handler
        const result = await handler(event, context);
        
        // Set HTTP status code
        res.status(result.statusCode || 200);
        
        // Set response headers
        if (result.headers) {
            for (const [key, value] of Object.entries(result.headers)) {
                res.setHeader(key, value);
            }
        }
        
        // Send response body
        if (result.body) {
            res.send(result.body);
        } else {
            res.end();
        }
        
    } catch (error) {
        console.error(`Error executing function ${functionName}:`, error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});

// Handle redirects defined in netlify.toml
app.get('/Dashboard', (req, res) => res.redirect('/Dashboard/index.html'));
app.get('/Dashboard/', (req, res) => res.redirect('/Dashboard/index.html'));

// Serve static files (the "publish" directory in netlify.toml is ".")
app.use(express.static(path.join(__dirname, '.')));

// Fallback to index.html for single-page applications if needed
// Not explicitly defined in netlify.toml, but common behavior:
// app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Netlify functions are mapped to http://localhost:${PORT}/.netlify/functions/`);
});
