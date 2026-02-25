require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: process.env.SESSION_SECRET || "fallback_secret",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 8 * 60 * 60 * 1000 },
    })
);

app.use("/public", express.static(path.join(__dirname, "public")));

function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) return next();
    res.redirect("/login");
}

app.get("/login", (req, res) => {
    if (req.session && req.session.authenticated) return res.redirect("/");
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (
        username === process.env.ADMIN_USER &&
        password === process.env.ADMIN_PASS
    ) {
        req.session.authenticated = true;
        return res.redirect("/");
    }
    res.redirect("/login?error=1");
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/login"));
});

app.use(requireAuth);
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/users", async (req, res) => {
    try {
        const { name, nationality, job, location, age, photos } = req.body;
        if (!name || !nationality || !job || !location || !age) {
            return res.status(400).json({ error: "All fields are required." });
        }
        if (!photos || !Array.isArray(photos) || photos.length < 1) {
            return res.status(400).json({ error: "At least 1 photo URL is required." });
        }
        if (photos.length > 5) {
            return res.status(400).json({ error: "Maximum 5 photos allowed." });
        }
        const user = await prisma.user.create({
            data: { name, nationality, job, location, age: parseInt(age), photos },
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
        await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: "User deleted." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete user." });
    }
});

app.put("/api/users/:id", async (req, res) => {
    try {
        const { name, nationality, job, location, age, photos } = req.body;
        if (!name || !nationality || !job || !location || !age) {
            return res.status(400).json({ error: "All fields are required." });
        }
        if (!photos || !Array.isArray(photos) || photos.length < 1) {
            return res.status(400).json({ error: "At least 1 photo URL is required." });
        }
        const user = await prisma.user.update({
            where: { id: parseInt(req.params.id) },
            data: { name, nationality, job, location, age: parseInt(age), photos },
        });
        res.json({ message: "User updated!", user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update user." });
    }
});


app.post("/api/posts", async (req, res) => {
    try {
        const { remarks, photoUrl, userId } = req.body;
        if (!remarks || !userId) {
            return res.status(400).json({ error: "Remarks and userId are required." });
        }
        const userExists = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
        });
        if (!userExists) return res.status(404).json({ error: "User not found." });
        const post = await prisma.post.create({
            data: { remarks, photoUrl: photoUrl || null, userId: parseInt(userId) },
        });
        res.status(201).json({ message: "Post created successfully!", post });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create post." });
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
        await prisma.post.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: "Post deleted." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete post." });
    }
});

app.put("/api/posts/:id", async (req, res) => {
    try {
        const { remarks, photoUrl } = req.body;
        if (!remarks) return res.status(400).json({ error: "Remarks are required." });
        const post = await prisma.post.update({
            where: { id: parseInt(req.params.id) },
            data: { remarks, photoUrl: photoUrl || null },
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
