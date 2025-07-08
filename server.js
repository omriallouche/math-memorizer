const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Add CORS headers to allow cross-origin requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Endpoint to list images
app.get('/list-images', (req, res) => {
    const imagesDir = path.join(__dirname, 'images');
    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            console.error('Error reading images directory:', err);
            res.status(500).json({ error: 'Failed to read images directory' });
            return;
        }
        // Filter for image files only
        const imageFiles = files.filter(file => 
            file.toLowerCase().endsWith('.jpg') || 
            file.toLowerCase().endsWith('.jpeg') || 
            file.toLowerCase().endsWith('.png')
        );
        res.json(imageFiles);
    });
});

// Endpoint to list available games (YAML configs)
app.get('/list-games', (req, res) => {
    const configsDir = path.join(__dirname, 'configs');
    fs.readdir(configsDir, async (err, files) => {
        if (err) {
            // Fallback: serve static JSON file
            try {
                const fallback = fs.readFileSync(path.join(configsDir, 'list-games.json'), 'utf8');
                res.setHeader('Content-Type', 'application/json');
                res.send(fallback);
            } catch (e) {
                console.error('Error reading fallback list-games.json:', e);
                res.status(500).json({ error: 'Failed to read configs directory and fallback file' });
            }
            return;
        }
        // Filter for YAML files only
        const yamlFiles = files.filter(file => file.toLowerCase().endsWith('.yaml'));
        // Try to extract display name from each YAML file (if possible)
        const games = await Promise.all(yamlFiles.map(async file => {
            const filePath = path.join(configsDir, file);
            let displayName = file.replace(/\.yaml$/i, '');
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                // Try to extract the 'name' field from the YAML (first occurrence)
                const match = content.match(/name:\s*['"]?([^\n'"]+)/);
                if (match && match[1]) {
                    displayName = match[1].trim();
                }
            } catch (e) {
                // Ignore errors, fallback to filename
            }
            return {
                type: file.replace(/\.yaml$/i, ''),
                name: displayName,
                config: `configs/${file}`
            };
        }));
        if (!games || games.length === 0) {
            // Fallback: serve static JSON file
            try {
                const fallback = fs.readFileSync(path.join(configsDir, 'list-games.json'), 'utf8');
                res.setHeader('Content-Type', 'application/json');
                res.send(fallback);
            } catch (e) {
                console.error('Error reading fallback list-games.json:', e);
                res.status(500).json({ error: 'No games found and failed to read fallback file' });
            }
            return;
        }
        res.json(games);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 