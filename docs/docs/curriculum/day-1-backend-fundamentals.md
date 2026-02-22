---
sidebar_position: 1
---

# Day 1: Backend Fundamentals with Node.js & Express

Welcome to Day 1 of the Web Dev Bootcamp! Today you'll learn how to build a backend server from scratch. Follow each step carefully - we'll start simple and gradually add more features.

---

## 🎯 What You'll Build Today

By the end of this session, you'll have built a fully functional REST API that:
- ✅ Handles multiple routes (URLs)
- ✅ Accepts data from users
- ✅ Connects to a database
- ✅ Saves and retrieves data

---

## 📚 Part 1: Understanding the Basics

Before we write any code, let's understand the key concepts.

### What is a Server?

Think of a server like a **restaurant waiter**:
- You (the client/browser) make a request: "I want pizza"
- The waiter (server) takes your order to the kitchen (database)
- The waiter brings back your pizza (response)

A **backend server** does exactly this - it receives requests, processes them, and sends back responses.

### What is Node.js?

**Node.js** is a JavaScript runtime that lets you run JavaScript **outside the browser**. 

Before Node.js:
- JavaScript could only run in browsers
- Backend was written in PHP, Python, Java, etc.

After Node.js:
- JavaScript can run on servers
- You can use one language for both frontend AND backend!

### What is npm?

**npm (Node Package Manager)** helps you:
- Install libraries/packages other developers created
- Manage your project dependencies
- Share your own packages

Think of it like an **app store for JavaScript code**.

### What is Express?

**Express** is a web framework for Node.js that makes it easy to:
- Create a server
- Handle different URLs (routes)
- Process incoming data
- Send responses

Without Express, you'd write 100+ lines of code. With Express, it's just 10 lines!

---

## 🛠️ Part 2: Project Setup

### Step 2.1: Create Your Project Folder

Open your terminal and run:

```bash
mkdir demo_practice
cd demo_practice
```

**What this does:**
- `mkdir` = "make directory" (creates a folder)
- `cd` = "change directory" (enters the folder)

### Step 2.2: Initialize npm

```bash
npm init -y
```

**What this does:**
- Creates a `package.json` file
- The `-y` flag accepts all default settings
- `package.json` tracks your project info and dependencies

### Step 2.3: Enable ES6 Modules

Open `package.json` and add the `"type": "module"` line:

```json title="package.json"
{
  "name": "demo_practice",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js"
}
```

**Why?** This lets us use modern `import/export` syntax instead of old `require()` syntax.

### Step 2.4: Install Express

```bash
npm install express
```

**What this does:**
- Downloads Express from npm
- Adds it to `node_modules/` folder
- Records it in `package.json` under dependencies

### Your Project Structure Now:

```
demo_practice/
  ├── node_modules/      ← All installed packages
  ├── package.json       ← Project configuration
  └── package-lock.json  ← Exact versions of packages
```

---

## 🚀 Part 3: Your First Express Server

### Step 3.1: Create the Server File

Create a new file called `index.js`:

```javascript title="index.js"
import express from 'express';

const app = express();
const PORT = 8000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

**Line-by-line explanation:**

| Line | What it does |
|------|--------------|
| `import express from 'express'` | Imports the Express library |
| `const app = express()` | Creates an Express application |
| `const PORT = 8000` | Defines which port to use |
| `app.listen(PORT, ...)` | Starts the server on that port |

### Step 3.2: Run Your Server

```bash
node index.js
```

You should see:
```
Server is running on http://localhost:8000
```

🎉 **Congratulations!** You've created your first server!

:::tip
To stop the server, press `Ctrl + C` in your terminal.
:::

### Step 3.3: Test in Browser

Open your browser and visit: `http://localhost:8000`

You'll see: **"Cannot GET /"**

This is expected! The server is running, but we haven't told it what to do when someone visits. Let's fix that!

---

## 🛤️ Part 4: Creating Routes

### What is a Route?

A **route** tells the server: "When someone visits THIS URL, do THIS action."

Routes have two parts:
1. **Path** - The URL (e.g., `/`, `/about`, `/contact`)
2. **Handler** - The function that runs when that URL is visited

### HTTP Methods

Before creating routes, understand the 4 main HTTP methods:

| Method | Purpose | Example Use |
|--------|---------|-------------|
| **GET** | Retrieve/read data | View a webpage, fetch user list |
| **POST** | Create new data | Submit a form, create account |
| **PUT** | Update existing data | Edit profile, update settings |
| **DELETE** | Remove data | Delete a post, remove account |

Today we'll focus on **GET** and **POST**.

---

### Step 4.1: Create Your First Route

Update `index.js`:

```javascript title="index.js"
import express from 'express';

const app = express();
const PORT = 8000;

// ✅ NEW: Our first route
app.get('/', (req, res) => {
  res.send('Hello! Welcome to my server!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

**Understanding the route:**

```javascript
app.get('/', (req, res) => {
  res.send('Hello! Welcome to my server!');
});
```

| Part | Meaning |
|------|---------|
| `app.get` | Handle GET requests |
| `'/'` | The URL path (root/homepage) |
| `req` | Request object (info FROM the user) |
| `res` | Response object (send data TO the user) |
| `res.send()` | Send a response back |

### Step 4.2: Restart and Test

1. Stop the server (`Ctrl + C`)
2. Start again: `node index.js`
3. Visit `http://localhost:8000`

You should now see: **"Hello! Welcome to my server!"** 🎉

---

### Step 4.3: Add More Routes

Let's add `/about` and `/contact` pages:

```javascript title="index.js"
import express from 'express';

const app = express();
const PORT = 8000;

// Route 1: Homepage
app.get('/', (req, res) => {
  res.send('Hello! Welcome to my server!');
});

// Route 2: About page
app.get('/about', (req, res) => {
  res.send('This is the About page. We are learning Express!');
});

// Route 3: Contact page
app.get('/contact', (req, res) => {
  res.send('Contact us at: hello@example.com');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

### Step 4.4: Test All Routes

Restart your server and visit:
- `http://localhost:8000/` → Homepage
- `http://localhost:8000/about` → About page
- `http://localhost:8000/contact` → Contact page

✅ **Checkpoint:** You now have a server with 3 working routes!

---

## 🎭 Part 5: Dynamic Routes (URL Parameters)

### The Problem

What if we want to greet users by name?

We could create routes like:
```javascript
app.get('/user/john', ...)
app.get('/user/sarah', ...)
app.get('/user/mike', ...)
```

But that's impossible for thousands of users! We need **dynamic routes**.

### The Solution: URL Parameters

Use `:paramName` to capture dynamic values from the URL.

### Step 5.1: Create a Dynamic Route

Add this route to your `index.js`:

```javascript title="index.js"
import express from 'express';

const app = express();
const PORT = 8000;

// Static routes
app.get('/', (req, res) => {
  res.send('Hello! Welcome to my server!');
});

app.get('/about', (req, res) => {
  res.send('This is the About page.');
});

// ✅ NEW: Dynamic route with URL parameter
app.get('/user/:username', (req, res) => {
  const username = req.params.username;
  res.send(`Hello ${username}! Welcome to your profile.`);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

**How it works:**

```
URL: /user/ashish
         ↓
    :username captures "ashish"
         ↓
    req.params.username = "ashish"
```

### Step 5.2: Test Dynamic Routes

Restart and try:
- `http://localhost:8000/user/ashish` → "Hello ashish!"
- `http://localhost:8000/user/john` → "Hello john!"
- `http://localhost:8000/user/yourname` → "Hello yourname!"

Same route handles ALL usernames! 🎉

---

### Step 5.3: Multiple URL Parameters

You can have multiple parameters:

```javascript
// Route with multiple parameters
app.get('/user/:username/post/:postId', (req, res) => {
  const { username, postId } = req.params;
  res.send(`Viewing post #${postId} by ${username}`);
});
```

**Test:** `http://localhost:8000/user/ashish/post/42`

---

## 🔍 Part 6: Query Parameters

### What are Query Parameters?

Query parameters are **optional** data passed in the URL after a `?` symbol.

```
http://localhost:8000/search?keyword=javascript&page=1
                             └──────────────────────┘
                                  Query parameters
```

### When to Use What?

| Type | Format | Use Case |
|------|--------|----------|
| URL Parameters | `/user/:id` | Required, identifies a resource |
| Query Parameters | `/search?q=term` | Optional, filters or settings |

### Step 6.1: Create a Search Route

```javascript title="index.js"
// Search route with query parameters
app.get('/search', (req, res) => {
  const keyword = req.query.keyword;
  const page = req.query.page || 1;  // Default to page 1
  
  res.send(`Searching for: "${keyword}" on page ${page}`);
});
```

**How it works:**

```
URL: /search?keyword=express&page=2
                   ↓
    req.query = { keyword: "express", page: "2" }
```

### Step 6.2: Test Query Parameters

- `http://localhost:8000/search?keyword=javascript` → "Searching for: javascript on page 1"
- `http://localhost:8000/search?keyword=node&page=3` → "Searching for: node on page 3"

---

## ✅ Part 6 Checkpoint: Complete Routes Code

Your `index.js` should now look like this:

```javascript title="index.js - Complete Routes"
import express from 'express';

const app = express();
const PORT = 8000;

// ========== STATIC ROUTES ==========

// Homepage
app.get('/', (req, res) => {
  res.send('Hello! Welcome to my server!');
});

// About page
app.get('/about', (req, res) => {
  res.send('This is the About page.');
});

// Contact page
app.get('/contact', (req, res) => {
  res.send('Contact us at: hello@example.com');
});

// ========== DYNAMIC ROUTES ==========

// User profile (URL parameter)
app.get('/user/:username', (req, res) => {
  const username = req.params.username;
  res.send(`Hello ${username}! Welcome to your profile.`);
});

// ========== QUERY PARAMETERS ==========

// Search with optional filters
app.get('/search', (req, res) => {
  const keyword = req.query.keyword;
  const page = req.query.page || 1;
  res.send(`Searching for: "${keyword}" on page ${page}`);
});

// ========== START SERVER ==========

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

---

## 📨 Part 7: Handling POST Requests

### GET vs POST

| GET | POST |
|-----|------|
| Retrieve data | Send/create data |
| Data in URL | Data in request body |
| Visible in browser | Hidden from URL |
| Example: View profile | Example: Submit form |

### The Problem

When users submit a form (login, signup, etc.), they send data IN the request body. We need to:
1. Tell Express to parse this data
2. Access it in our route

### Step 7.1: Add Middleware

**Middleware** is code that runs BEFORE your routes. We need `express.json()` to parse JSON data.

```javascript title="index.js"
import express from 'express';

const app = express();
const PORT = 8000;

// ✅ MIDDLEWARE - Add this BEFORE routes
app.use(express.json());

// ... your routes here
```

:::warning Important
Always add middleware BEFORE your routes, or it won't work!
:::

### Step 7.2: Create a POST Route

```javascript
// POST route to receive user data
app.post('/register', (req, res) => {
  const { name, email, age } = req.body;
  
  console.log('Received data:', req.body);
  
  res.json({
    message: 'User registered successfully!',
    user: { name, email, age }
  });
});
```

**Understanding req.body:**

```
POST request with body: { "name": "Ashish", "email": "a@b.com", "age": 22 }
                                              ↓
                                    req.body = { name: "Ashish", email: "a@b.com", age: 22 }
```

### Step 7.3: Test with Postman

Since browsers can only make GET requests easily, we use **Postman** for testing POST requests.

1. Download [Postman](https://www.postman.com/downloads/)
2. Create a new request
3. Set method to **POST**
4. Enter URL: `http://localhost:8000/register`
5. Go to **Body** tab → Select **raw** → Choose **JSON**
6. Enter:
   ```json
   {
     "name": "Ashish",
     "email": "ashish@example.com",
     "age": 22
   }
   ```
7. Click **Send**

**Expected Response:**
```json
{
  "message": "User registered successfully!",
  "user": {
    "name": "Ashish",
    "email": "ashish@example.com",
    "age": 22
  }
}
```

---

## ✅ Part 7 Checkpoint: Routes + POST

```javascript title="index.js - With POST"
import express from 'express';

const app = express();
const PORT = 8000;

// ========== MIDDLEWARE ==========
app.use(express.json());

// ========== GET ROUTES ==========

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

app.get('/user/:username', (req, res) => {
  const username = req.params.username;
  res.send(`Hello ${username}!`);
});

// ========== POST ROUTES ==========

app.post('/register', (req, res) => {
  const { name, email, age } = req.body;
  
  res.json({
    message: 'User registered successfully!',
    user: { name, email, age }
  });
});

// ========== START SERVER ==========

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

---

## 💾 Part 8: Introduction to MongoDB

Now let's add a **database** to store data permanently!

### What is a Database?

A database is like a **digital filing cabinet** that stores data even when the server restarts.

Without database: Data lost when server stops ❌
With database: Data saved permanently ✅

### SQL vs NoSQL Databases

| Aspect | SQL (MySQL, PostgreSQL) | NoSQL (MongoDB) |
|--------|-------------------------|-----------------|
| Structure | Tables with rows & columns | Collections with documents |
| Schema | Fixed (must define columns) | Flexible (can vary) |
| Data Format | Rows | JSON-like documents |
| Best For | Structured data, complex queries | Flexible data, rapid development |

### MongoDB Terminology

| SQL Term | MongoDB Term |
|----------|--------------|
| Database | Database |
| Table | Collection |
| Row | Document |
| Column | Field |

### MongoDB Document Example

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Ashish",
  "email": "ashish@example.com",
  "age": 22,
  "skills": ["JavaScript", "React", "Node.js"]
}
```

**Key points:**
- `_id` is auto-generated (unique identifier)
- Documents are like JSON objects
- Fields can hold arrays, nested objects, etc.

---

## ☁️ Part 9: Setting Up MongoDB Atlas

**MongoDB Atlas** is a free cloud database service.

### Step 9.1: Create an Atlas Account

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click **Try Free** and create an account
3. Choose the **FREE** tier (M0 Sandbox)

### Step 9.2: Create a Cluster

1. Click **Build a Database**
2. Choose **M0 FREE** tier
3. Select a region close to you
4. Click **Create**

### Step 9.3: Create Database User

1. Go to **Database Access** (left sidebar)
2. Click **Add New Database User**
3. Enter username and password (SAVE THESE!)
4. Click **Add User**

### Step 9.4: Allow Network Access

1. Go to **Network Access** (left sidebar)
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (for development)
4. Click **Confirm**

### Step 9.5: Get Connection String

1. Go to **Database** → Click **Connect**
2. Choose **Connect your application**
3. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database>
   ```
4. Replace `<username>`, `<password>`, and `<database>` with your values

:::warning Security
Never share your connection string or commit it to GitHub!
:::

---

## 🔗 Part 10: Connecting Express to MongoDB

### What is Mongoose?

**Mongoose** is a library that makes working with MongoDB in Node.js much easier:
- Defines data structure (schemas)
- Validates data
- Provides easy methods (find, save, delete, etc.)

### Step 10.1: Install Mongoose

```bash
npm install mongoose
```

### Step 10.2: Connect to MongoDB

Update your `index.js`:

```javascript title="index.js"
import express from 'express';
import mongoose from 'mongoose';  // ✅ NEW

const app = express();
const PORT = 8000;

// ✅ NEW: MongoDB connection string
const MONGO_URI = 'mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/bootcamp_db';

// Middleware
app.use(express.json());

// ✅ NEW: Connect to MongoDB
const connectDb = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Database connected successfully!');
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
};

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

// Start server AND connect to database
app.listen(PORT, () => {
  connectDb();  // ✅ Connect when server starts
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

### Step 10.3: Test Connection

Restart your server:
```bash
node index.js
```

You should see:
```
Server is running on http://localhost:8000
✅ Database connected successfully!
```

If you see an error, check:
- Username and password are correct
- IP address is whitelisted
- Connection string format is correct

---

## 📋 Part 11: Creating a Schema & Model

### What is a Schema?

A **schema** defines the structure of documents in a collection:
- What fields exist
- What type each field is
- Which fields are required
- Default values

Think of it like a **template** for your data.

### What is a Model?

A **model** is like a **class** that lets you create, read, update, and delete documents based on the schema.

### Step 11.1: Create Models Folder

```bash
mkdir models
```

### Step 11.2: Create User Model

Create `models/user.model.js`:

```javascript title="models/user.model.js"
import mongoose from 'mongoose';

// Define the schema (structure)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true   // Must have a name
  },
  email: {
    type: String,
    required: true,
    unique: true     // No duplicate emails
  },
  age: {
    type: Number,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true     // No duplicate usernames
  }
}, { 
  timestamps: true   // Adds createdAt and updatedAt automatically
});

// Create and export the model
export const User = mongoose.model('User', userSchema);
```

### Schema Field Options Explained

| Option | What it does | Example |
|--------|--------------|---------|
| `type` | Data type | `String`, `Number`, `Boolean`, `Date` |
| `required: true` | Field must have a value | Won't save without it |
| `unique: true` | No duplicates allowed | Two users can't have same email |
| `default: value` | Default if not provided | `default: 'Active'` |
| `timestamps: true` | Auto-add createdAt/updatedAt | Tracks when created/modified |

### Project Structure Now:

```
demo_practice/
  ├── models/
  │   └── user.model.js   ← NEW
  ├── node_modules/
  ├── index.js
  ├── package.json
  └── package-lock.json
```

---

## 💾 Part 12: Creating Data (POST to Database)

Now let's save user data to MongoDB!

### Step 12.1: Import the User Model

Update `index.js`:

```javascript title="index.js"
import express from 'express';
import mongoose from 'mongoose';
import { User } from './models/user.model.js';  // ✅ Import model

// ... rest of your code
```

### Step 12.2: Create POST Route to Save User

```javascript
// POST - Create a new user
app.post('/create', async (req, res) => {
  try {
    // 1. Get data from request body
    const { name, email, age, username } = req.body;
    
    // 2. Create new user in database
    const newUser = await User.create({
      name,
      email,
      age,
      username
    });
    
    // 3. Send success response
    res.status(201).json({
      success: true,
      message: 'User created successfully!',
      user: newUser
    });
    
  } catch (error) {
    // 4. Handle errors
    console.log('Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});
```

**Understanding the code:**

| Part | Purpose |
|------|---------|
| `async/await` | Handle database operations (they take time) |
| `try/catch` | Handle errors gracefully |
| `User.create()` | Mongoose method to create & save document |
| `res.status(201)` | HTTP status 201 = Created successfully |
| `res.status(500)` | HTTP status 500 = Server error |

### Step 12.3: Test Creating a User

Use Postman:
1. **POST** `http://localhost:8000/create`
2. Body (JSON):
   ```json
   {
     "name": "Ashish",
     "email": "ashish@example.com",
     "age": 22,
     "username": "ashish1"
   }
   ```
3. Click **Send**

**Expected Response:**
```json
{
  "success": true,
  "message": "User created successfully!",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Ashish",
    "email": "ashish@example.com",
    "age": 22,
    "username": "ashish1",
    "createdAt": "2024-02-22T10:30:00.000Z",
    "updatedAt": "2024-02-22T10:30:00.000Z"
  }
}
```

🎉 **The user is now saved in MongoDB!**

Check MongoDB Atlas → Browse Collections to see your data!

---

## 📖 Part 13: Reading Data (GET from Database)

### Step 13.1: Get All Users

```javascript
// GET - Fetch all users
app.get('/users', async (req, res) => {
  try {
    const allUsers = await User.find();  // Get all documents
    
    res.status(200).json({
      success: true,
      count: allUsers.length,
      users: allUsers
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});
```

**Test:** GET `http://localhost:8000/users`

### Step 13.2: Get One User by Username

```javascript
// GET - Fetch single user by username
app.get('/users/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username });  // Find one document
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user: user
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});
```

**Test:** GET `http://localhost:8000/users/ashish1`

### Mongoose Query Methods

| Method | What it does | Returns |
|--------|--------------|---------|
| `User.find()` | Get ALL documents | Array `[{...}, {...}]` |
| `User.findOne({field: value})` | Get first matching doc | Object `{...}` or `null` |
| `User.findById(id)` | Get by MongoDB `_id` | Object `{...}` or `null` |

---

## ✅ Part 13 Checkpoint: Complete Code

```javascript title="index.js - Complete with MongoDB"
import express from 'express';
import mongoose from 'mongoose';
import { User } from './models/user.model.js';

const app = express();
const PORT = 8000;
const MONGO_URI = 'mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/bootcamp_db';

// ========== MIDDLEWARE ==========
app.use(express.json());

// ========== DATABASE CONNECTION ==========
const connectDb = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Database connected!');
  } catch (error) {
    console.log('❌ DB Error:', error.message);
  }
};

// ========== ROUTES ==========

// Home
app.get('/', (req, res) => {
  res.send('Welcome to the User API!');
});

// Create user
app.post('/create', async (req, res) => {
  try {
    const { name, email, age, username } = req.body;
    const newUser = await User.create({ name, email, age, username });
    
    res.status(201).json({
      success: true,
      message: 'User created!',
      user: newUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all users
app.get('/users', async (req, res) => {
  try {
    const allUsers = await User.find();
    res.status(200).json({
      success: true,
      count: allUsers.length,
      users: allUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user by username
app.get('/users/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  connectDb();
  console.log(`Server running on http://localhost:${PORT}`);
});
```

---

## 📁 Part 14: Code Organization (Optional but Recommended)

As your project grows, keeping all code in one file becomes messy. Let's organize it!

### The MVC Pattern

| Folder | Purpose |
|--------|---------|
| `models/` | Database schemas |
| `controllers/` | Route handler logic |
| `routes/` | Route definitions |

### Step 14.1: Create Controller

Create `controllers/user.controller.js`:

```javascript title="controllers/user.controller.js"
import { User } from '../models/user.model.js';

// Create user
export const createUser = async (req, res) => {
  try {
    const { name, email, age, username } = req.body;
    const newUser = await User.create({ name, email, age, username });
    
    res.status(201).json({
      success: true,
      message: 'User created!',
      user: newUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get user by username
export const getUserByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

### Step 14.2: Create Routes File

Create `routes/user.routes.js`:

```javascript title="routes/user.routes.js"
import express from 'express';
import { 
  createUser, 
  getAllUsers, 
  getUserByUsername 
} from '../controllers/user.controller.js';

const router = express.Router();

router.post('/create', createUser);
router.get('/', getAllUsers);
router.get('/:username', getUserByUsername);

export default router;
```

### Step 14.3: Use in Main File

Update `index.js`:

```javascript title="index.js - Organized"
import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './routes/user.routes.js';

const app = express();
const PORT = 8000;
const MONGO_URI = 'your-connection-string';

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => res.send('Welcome to the API!'));
app.use('/users', userRoutes);  // All /users routes

// Database & Server
const connectDb = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Database connected!');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

app.listen(PORT, () => {
  connectDb();
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### Final Project Structure

```
demo_practice/
  ├── controllers/
  │   └── user.controller.js
  ├── models/
  │   └── user.model.js
  ├── routes/
  │   └── user.routes.js
  ├── node_modules/
  ├── index.js
  ├── package.json
  └── package-lock.json
```

**Benefits:**
- ✅ Clean, organized code
- ✅ Easy to find and update
- ✅ Reusable components
- ✅ Professional structure

---

## 🎯 Summary: What You Learned Today

### Concepts Mastered

| Concept | What You Learned |
|---------|------------------|
| **Node.js** | JavaScript runtime for server-side code |
| **npm** | Package manager for installing libraries |
| **Express** | Web framework for creating servers |
| **Routes** | Handling different URLs |
| **HTTP Methods** | GET (read), POST (create) |
| **URL Parameters** | Dynamic routes with `:param` |
| **Query Parameters** | Optional data with `?key=value` |
| **Middleware** | Code that runs before routes |
| **MongoDB** | NoSQL database for storing data |
| **Mongoose** | Library to interact with MongoDB |
| **Schema/Model** | Define data structure |
| **CRUD** | Create and Read operations |

### Your API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | Welcome message |
| POST | `/users/create` | Create new user |
| GET | `/users` | Get all users |
| GET | `/users/:username` | Get specific user |

---

## 📚 Quick Reference

### Common HTTP Status Codes

| Code | Meaning | When to use |
|------|---------|-------------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST (created resource) |
| 400 | Bad Request | Invalid data from client |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Something broke on server |

### Mongoose Cheat Sheet

```javascript
// CREATE
await User.create({ name, email });

// READ
await User.find();                    // All
await User.findOne({ email });        // One by field
await User.findById(id);              // One by ID

// UPDATE
await User.findByIdAndUpdate(id, { name: 'New Name' });

// DELETE
await User.findByIdAndDelete(id);
```

---

## 🚀 What's Next?

On **Day 2**, you'll learn:
- PUT & DELETE operations (Update & Delete)
- User authentication (login/signup)
- Password hashing
- JWT tokens
- Protected routes

---

## 📖 Additional Resources

- [Express.js Official Docs](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Postman Learning Center](https://learning.postman.com/)
- [HTTP Status Codes](https://httpstatuses.com/)

---

:::tip Key Takeaways
1. **Start simple** - Begin with basic routes, then add complexity
2. **Test often** - Use Postman to test every endpoint
3. **Handle errors** - Always use try-catch for async operations
4. **Organize code** - Use controllers and routes for clean architecture
5. **Secure secrets** - Never commit database credentials to Git
:::

Happy coding! 🎉
