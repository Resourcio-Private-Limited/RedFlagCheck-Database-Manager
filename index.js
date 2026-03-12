require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const bcrypt = require("bcrypt");

const app = express();

// Trust proxy for secure cookies on Render/Vercel
app.set("trust proxy", 1);

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: "https://redflagcheck.vercel.app",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: process.env.SESSION_SECRET || "fallback_secret",
        resave: false,
        saveUninitialized: false,
        proxy: true, // Trust the proxy for cookie transmission
        cookie: { 
            maxAge: 8 * 60 * 60 * 1000,
            secure: true,      // Must be true for sameSite: 'none'
            sameSite: 'none',  // Required for cross-origin (Vercel -> Render)
        },
    })
);

// Pure API Backend - No static serving needed

/**
 * Extracts the S3 Key from a URL (S3 or CloudFront)
 */
function getS3KeyFromUrl(url) {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        // Pathname usually starts with /
        let key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
        return decodeURIComponent(key);
    } catch (e) {
        // If it's already a key or invalid URL
        return url;
    }
}

async function deleteFromS3(url) {
    const key = getS3KeyFromUrl(url);
    if (!key) return;

    try {
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
        });
        await s3Client.send(command);
        console.log(`Successfully deleted from S3: ${key}`);
    } catch (err) {
        console.error(`Failed to delete S3 object (${key}):`, err.message);
    }
}

/**
 * Deletes all objects under a specific prefix (folder)
 */
async function deletePrefixFromS3(prefix) {
    if (!prefix || prefix === "users/" || prefix === "posts/" || prefix === "profiles/") {
        console.warn(`Dangerous prefix deletion attempted: ${prefix}`);
        return;
    }

    try {
        const listCommand = new ListObjectsV2Command({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Prefix: prefix,
        });

        const listResponse = await s3Client.send(listCommand);
        if (!listResponse.Contents || listResponse.Contents.length === 0) return;

        const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Delete: {
                Objects: listResponse.Contents.map(obj => ({ Key: obj.Key })),
            },
        };

        await s3Client.send(new DeleteObjectsCommand(deleteParams));
        console.log(`Successfully deleted prefix from S3: ${prefix} (${listResponse.Contents.length} objects)`);
    } catch (err) {
        console.error(`Failed to delete S3 prefix (${prefix}):`, err.message);
    }
}

function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) return next();
    res.status(401).json({ error: "Session expired. Please login again." });
}

// Legacy HTML routes removed

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        // Handle AJAX login
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

        req.session.authenticated = true;
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        res.json({ message: "Login successful", user: { email: user.email, id: user.id } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/register", async (req, res) => {
    try {
        const { fullname, username, email, password, profileImage } = req.body;
        if (!fullname || !username || !email || !password) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { fullname, username, email, password: hashedPassword, profileImage },
        });

        res.status(201).json({ message: "User registered successfully!", userId: user.id });
    } catch (err) {
        if (err.code === "P2002") {
            return res.status(400).json({ error: "Email or Username already exists." });
        }
        console.error(err);
        res.status(500).json({ error: "Failed to register user." });
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => res.json({ message: "Logged out successfully" }));
});

// Protected API Routes
app.use(requireAuth);

app.get("/api/s3/presigned-url", async (req, res) => {
    try {
        const { filename, contentType, folder, uid } = req.query;

        if (!filename || !contentType) {
            return res.status(400).json({ error: "filename and contentType are required." });
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(contentType)) {
            return res.status(400).json({ error: "Invalid file type. Only JPEGs, PNGs, and WEBPs are allowed." });
        }

        const dir = folder === "posts" ? "posts" : "profiles";
        // Optimized path structure: users/{uid}/{posts|profiles}/{timestamp}-{filename}
        const userPath = uid ? `users/${uid}/` : "";
        const key = `${userPath}${dir}/${Date.now()}-${filename}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

        const cfDomain = process.env.CLOUDFRONT_DOMAIN;
        const publicUrl = cfDomain
            ? `https://${cfDomain}/${key}`
            : `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        res.json({ presignedUrl, publicUrl });
    } catch (err) {
        console.error("Error generating presigned URL:", err);
        res.status(500).json({ error: "Failed to generate upload URL." });
    }
});

app.post("/api/users", async (req, res) => {
    // This endpoint might be redundant with /register but kept for admin use if needed
    try {
        const { fullname, email, password, profileImage } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { fullname, email, password: hashedPassword, profileImage },
        });
        res.status(201).json({ message: "User created successfully!", user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create user." });
    }
});

app.get("/api/users", async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            include: { posts: true },
        });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch users." });
    }
});

app.get("/api/users/me", requireAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.session.userId },
            select: { id: true, email: true, fullname: true, username: true, profileImage: true }
        });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/api/users/:id", async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { posts: { orderBy: { createdAt: "desc" } } },
        });
        if (!user) return res.status(404).json({ error: "User not found." });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch user." });
    }
});

app.delete("/api/users/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const user = await prisma.user.findUnique({
            where: { id },
            include: { posts: true }
        });
        if (!user) return res.status(404).json({ error: "User not found." });

        // 1. Bulk delete user-specific folder using UID (Stable)
        if (user.uid) {
            await deletePrefixFromS3(`users/${user.uid}/`);
        } else {
            // Fallback to integer ID if UID is missing (legacy)
            await deletePrefixFromS3(`users/${req.params.id}/`);
        }

        // 2. Individual Cleanup (Backward Compatibility or if files were outside UID folder)
        // Cleanup S3 photos for the user
        if (user.photos && user.photos.length > 0) {
            await Promise.all(user.photos.map(photo => deleteFromS3(photo)));
        }

        // Cleanup S3 photos for all user's posts
        if (user.posts && user.posts.length > 0) {
            for (const post of user.posts) {
                if (post.photos && post.photos.length > 0) {
                    await Promise.all(post.photos.map(photo => deleteFromS3(photo)));
                }
            }
        }

        await prisma.user.delete({ where: { id } });
        res.json({ message: "User and all related S3 content deleted." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete user." });
    }
});

app.put("/api/users/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { fullname, email, password, profileImage } = req.body;

        const data = { fullname, email, profileImage };
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) return res.status(404).json({ error: "User not found." });

        if (existingUser.profileImage && existingUser.profileImage !== profileImage) {
            await deleteFromS3(existingUser.profileImage);
        }

        const user = await prisma.user.update({
            where: { id },
            data,
        });
        res.json({ message: "User updated!", user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update user." });
    }
});


app.post("/api/posts", async (req, res) => {
    console.log("Incoming Post Request:", req.body);
    try {
        const { type, title, name, nationality, jobProfile, currentLivingIn, age, photos, content } = req.body;
        const userId = req.session.userId;

        if (!type || !title || title.trim() === '' || !name || !photos || photos.length === 0 || !userId || !age) {
            return res.status(400).json({ error: "Missing required fields (Type, Title, Name, Photos, Age)." });
        }
        if (type === 'REDFLAG' && (!content || content.trim() === '')) {
            return res.status(400).json({ error: "Content is required for Red Flag posts." });
        }

        const parsedAge = parseInt(age);
        if (isNaN(parsedAge)) {
            return res.status(400).json({ error: "Age must be a valid number." });
        }

        const post = await prisma.post.create({
            data: {
                type,
                title,
                name,
                nationality: nationality || "N/A",
                jobProfile: jobProfile || "N/A",
                currentLivingIn: currentLivingIn || "N/A",
                age: parsedAge,
                photos,
                content: type === 'REDFLAG' ? content : null,
                userId
            },
        });
        res.status(201).json({ message: "Post created successfully!", post });
    } catch (err) {
        console.error("Post Creation Error:", err);
        res.status(500).json({ error: "Failed to create post. System error logged." });
    }
});

app.get("/api/posts", async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            orderBy: { createdAt: "desc" },
            include: { user: true },
        });
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch posts." });
    }
});

app.delete("/api/posts/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ error: "Post not found." });

        if (post.photos && post.photos.length > 0) {
            await Promise.all(post.photos.map(photo => deleteFromS3(photo)));
        }

        await prisma.post.delete({ where: { id } });
        res.json({ message: "Post and its S3 images deleted." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete post." });
    }
});

app.put("/api/posts/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { type, title, name, nationality, jobProfile, currentLivingIn, age, photos, content } = req.body;

        const existingPost = await prisma.post.findUnique({ where: { id } });
        if (!existingPost) return res.status(404).json({ error: "Post not found." });

        // Identify photos that were removed
        const removedPhotos = existingPost.photos.filter(p => !photos.includes(p));
        if (removedPhotos.length > 0) {
            await Promise.all(removedPhotos.map(p => deleteFromS3(p)));
        }

        const post = await prisma.post.update({
            where: { id },
            data: {
                type,
                title,
                name,
                nationality,
                jobProfile,
                currentLivingIn,
                age: parseInt(age),
                photos,
                content: type === 'REDFLAG' ? content : null
            },
        });
        res.json({ message: "Post updated!", post });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update post." });
    }
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
