const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

app.use(express.static('public'));

// Function to read exclusions from the JSON file
function readExclusions() {
    const data = fs.readFileSync('exclusions.json');
    const exclusions = JSON.parse(data);
    return exclusions.exclude;
}

app.get('/api/fox-images', async (req, res) => {
    try {
        const exclusions = readExclusions();
        const response = await axios.get('https://api.pexels.com/v1/search', {
            params: { query: 'fox', per_page: 30 },
            headers: { Authorization: PEXELS_API_KEY }
        });

        const filteredPhotos = response.data.photos.filter(photo => !exclusions.includes(photo.id.toString()));

        res.json({ photos: filteredPhotos });
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).send('Error fetching images');
    }
});

app.listen(PORT, () => {
    console.log();
});

