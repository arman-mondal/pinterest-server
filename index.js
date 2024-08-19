const express = require('express');
const axios = require('axios');

const app = express();
const cors = require('cors');

app.use(express.json());
const corsOptions = {
    origin: ["*"],
    methods: ["GET", "POST"],

}
app.use(cors());
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
  });
app.post('/', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'Please provide the URL' });
        }

        const response = await axios.get(url);
        const regex = /href="https:\/\/i\.([^"]+)"/;
        const match = response.data.match(regex);

        if (match && match[1]) {
            const imageUrl = `https://i.${match[1]}`;
            return res.json({ imageUrl });
        } else {
            return res.status(400).json({ error: 'Please provide a valid URL' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
});


app.post('/video', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'Please provide the URL' });
        }

        const response = await axios.get(url);
        const regex = /<video[^>]*src="([^"]+)"/;
        const match = response.data.match(regex);

        if (match && match[1]) {
            const videoSrc = match[1];
            return res.json({ videoSrc:videoSrc.replace("m3u8","mp4").replace("hls","720p") });
        } else {
            return res.status(400).json({ error: 'Please provide a valid URL' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
});


app.listen(3004, () => {
    console.log('Pinterest Image Downloader API is running on port 3000');
});