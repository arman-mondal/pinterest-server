const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const app = express();
const cors = require('cors');
const prisma = new PrismaClient()
const jwt = require('jsonwebtoken');
const multer = require('multer');
const uuid = require('uuid');
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
app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Please provide the email' });
        }
        if (!password) {
            return res.status(400).json({ error: 'Please provide the password' });
        }

        const user = await prisma.user.create({
            data: {
                name:'Admin',
                email,
                password
            }
        });

        return res.json({ message: 'User created successfully',user });


        

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
});
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Please provide the email' });
        }
        if (!password) {
            return res.status(400).json({ error: 'Please provide the password' });
        }

        const user = await prisma.user.findFirst({
            where: {
                email,
                password
            },
            
        });
        if(!user){
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        const token=jwt.sign({email,password,id:user.id},'ArmanMondal',{expiresIn:'1h'});
        const userdata=await prisma.user.update({
            where: {
                email,
                password
            },
            data: {
                token:token
            }
        });


        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        return res.json({ message: 'User logged in successfully', userdata });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}
);
app.get('/sync', async (req, res) => {
    try {
        const tokenData=req.headers.authorization;
        const token=tokenData.split(' ')[1];
        const decoded=jwt.verify(token,'ArmanMondal');
        const userId=decoded.id;
        if(!userId){
            return res.status(400).json({ error: 'Please provide the user ID' });
        }
        const user = await prisma.user.findFirst({
            where:{
                id:userId
            }
        });
        if(!user){
            return res.status(400).json({ error: 'Invalid user' });
        }


        return res.json({ message: 'Database connected successfully', user });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}
);
app.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        return res.json(users);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
});
app.get('/test',async(req,res)=>{
    const tokenData=req.headers.authorization;
    const token=tokenData.split(' ')[1];
    const decoded=jwt.verify(token,'ArmanMondal');
    console.log(decoded);
    res.json({message:'Hello World',decoded});
}
)
app.post('/create-post', async (req, res) => {
    try {
        const { title, content ,banner} = req.body;
        const tokenData=req.headers.authorization;
        const token=tokenData.split(' ')[1];
        const decoded=jwt.verify(token,'ArmanMondal');
        const userId=decoded.id;
        if(!userId){
            return res.status(400).json({ error: 'Please provide the user ID' });
        }
        


        if (!title) {
            return res.status(400).json({ error: 'Please provide the title' });
        }
        if (!content) {
            return res.status(400).json({ error: 'Please provide the content' });
        }
        if (!userId) {
            return res.status(400).json({ error: 'Please provide the user ID' });
        }

        const post = await prisma.post.create({
            data: {
                title,
                content,
                banner,
                authorId: userId
            }
        });

        return res.json({ message: 'Post created successfully', post });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}
);
app.get('/posts', async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            include: {
                author: true
            }
        });
        return res.json(posts);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}
);
app.get('/posts/:id', async (req, res) => {
    try {
        const {id}=req.params;
        const posts = await prisma.post.findMany({
            where:{
                id:parseInt(id)

            },
            include: {
                author: true
            }

        });
        if(posts.length===0){
            return res.status(400).json({ error: 'Post not found' });
        }

        return res.json(posts[0]);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}
);
app.delete('/posts/:id', async (req, res) => {  
    
    try {
        const {id}=req.params;
        
        const tokenData=req.headers.authorization;
        const token=tokenData.split(' ')[1];
        const decoded=jwt.verify(token,'ArmanMondal');
        const userId=decoded.id;
        if(!userId){
            return res.status(400).json({ error: 'Please provide the user ID' });
        }
        const post = await prisma.post.findFirst({
            where:{
                id:parseInt(id),
                authorId:userId
            }
        });
        if(!post){
            return res.status(400).json({ error: 'Post not found' });
        }
        await prisma.post.delete({
            where:{
                id:parseInt(id)
            }
        });
        return res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Something went wrong' });
    }
}
);
app.put('/posts/:id', async (req, res) => { 
    try{
        const {id}=req.params;
        const { title, content ,banner} = req.body;
        const tokenData=req.headers.authorization;
        const token=tokenData.split(' ')[1];
        const decoded=jwt.verify(token,'ArmanMondal');
        const userId=decoded.id;
        if(!userId){
            return res.status(400).json({ error: 'Please provide the user ID' });
        }
        const post = await prisma.post.findFirst({
            where:{
                id:parseInt(id),
                authorId:userId
            }
        });
        if(!post){
            return res.status(400).json({ error: 'Post not found' });
        }
        await prisma.post.update({
            where:{
                id:parseInt(id)
            },
            data:{
                title,
                content,
                banner
            }
        });
        return res.json({ message: 'Post updated successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Something went wrong' });

    }
});
app.use('/uploads',express.static('upload'));
// Set up multer storage
const uniqueId=uuid.v4();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'upload'); // Replace with the actual path to your upload directory
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const renamedFile = `${uniqueId}_${file.originalname}`;
        cb(null, renamedFile);
    }
});

// Create multer upload instance
const upload = multer({ storage: storage });

// Define the route for image uploading
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please provide an image file' });
        }

        // Access the uploaded file details
        const { originalname, size } = req.file;
        const timestamp = Date.now();
        const filename = `${uniqueId}_${originalname}`;

        // Process the uploaded image as needed
        // ...

        // Generate the URL for the uploaded image
        const imageUrl = `http://localhost:3004/uploads/${filename}`;

        return res.json({ message: 'Image uploaded successfully', originalname, filename, size, imageUrl });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
});






app.listen(3004, () => {
    console.log('Pinterest Image Downloader API is running on port 3000');
});