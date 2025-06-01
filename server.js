const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 