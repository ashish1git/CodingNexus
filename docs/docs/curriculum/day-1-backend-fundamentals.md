---
sidebar_position: 1
---

# Day 1: Backend Fundamentals with Node.js & Express

Learn the core concepts of building a backend server using Node.js and Express, connecting it to MongoDB, and implementing basic CRUD operations.

## Overview

On Day 1, you'll build a fully functional Express server connected to MongoDB. By the end of this session, you'll have:
- ✅ Set up a Node.js project
- ✅ Created an Express server with multiple routes
- ✅ Connected to MongoDB using Mongoose
- ✅ Implemented a data model (schema)
- ✅ Built POST and GET endpoints to save and retrieve data

---

## Section 1: Node.js & npm

### What is Node.js?

Node.js is a JavaScript runtime that allows you to run JavaScript outside the browser. It's the foundation for building server-side applications using JavaScript.

### What is npm?

npm (Node Package Manager) is the package manager for Node.js. It helps you install, manage, and use third-party libraries (packages) in your project.

---

## Section 2: Introduction to MERN Stack & Client-Server Architecture

### What is MERN?

MERN is an acronym for four powerful JavaScript technologies:

| Technology | Role |
|-----------|------|
| **MongoDB** | NoSQL database for storing data |
| **Express** | Web framework for building the backend server |
| **React** | Frontend library for building user interfaces |
| **Node.js** | JavaScript runtime for running the backend |

### Client-Server Architecture

```
┌─────────────────────────────────────────────┐
│          CLIENT (Browser)                   │
│  - React Frontend                           │
│  - User Interface                           │
└─────────────┬───────────────────────────────┘
              │
              │ HTTP Requests/Responses
              │
┌─────────────▼───────────────────────────────┐
│          SERVER (Node.js + Express)         │
│  - Backend Logic                            │
│  - Route Handling                           │
│  - Database Interaction                     │
└─────────────┬───────────────────────────────┘
              │
              │ Database Queries
              │
┌─────────────▼───────────────────────────────┐
│       DATABASE (MongoDB)                    │
│  - Data Storage                             │
│  - Collections & Documents                  │
└─────────────────────────────────────────────┘
```

### The Backend's Role

The backend server is responsible for:
- Receiving requests from the frontend
- Processing business logic
- Interacting with the database
- Sending responses back to the frontend

---

## Section 3: Project Setup

### Creating a New Project

Create a new directory for your project:

```bash
mkdir demo_practice
cd demo_practice
```

Initialize npm in your project:

```bash
npm init -y
```

This creates a `package.json` file that tracks your project dependencies.

### Installing Express

Install the Express framework:

```bash
npm install express
```

### Project Structure

Your project directory should look like this:

```
demo_practice/
  ├── node_modules/          (packages installed)
  ├── package.json            (project metadata)
  ├── package-lock.json       (dependency lock file)
  └── server.js              (we'll create this next)
```

---

## Section 4: Creating an Express Server

### Your First Express Server

Create a file called `index.js` in your project root:

```javascript title="index.js"
import express from 'express';
import mongoose from 'mongoose';

const app = express();
const PORT = 8000;

const MONGO_URI = 'mongodb+srv://your-username:your-password@cluster.mongodb.net/your-database-name';

// Connect to MongoDB
const connectDb = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('DB is Connected');
  } catch (error) {
    console.log('DB error:', error);
  }
};

// Basic routes
app.get('/', (req, res) => {
  res.send('Hello I am Express js ....');
});

app.get('/contact', (req, res) => {
  res.send('I am contact page ...');
});

app.get('/about', (req, res) => {
  res.send('I am about page ...');
});

// Start the server
app.listen(PORT, (req, res) => {
  connectDb();
  console.log(`Server is running on localhost:${PORT}`);
});
```

### Understanding the Code

```javascript
import express from 'express';
```
This imports the Express library into your project using ES6 modules.

```javascript
const app = express();
```
This creates an Express application instance.

```javascript
app.get('/', (req, res) => {
  res.send('Hello I am Express js ....');
});
```
This defines a GET route for the root path (`/`). The callback function receives:
- `req` - the incoming request
- `res` - the response object to send back

```javascript
app.listen(PORT, (req, res) => {
  connectDb();
  console.log(`Server is running on localhost:${PORT}`);
});
```
This starts the server on port 8000 and connects to MongoDB.

### Running Your Server

Execute your server:

```bash
node index.js
```

You should see:
```
DB is Connected
Server is running on localhost:8000
```

Visit `http://localhost:8000` in your browser to see the response!

:::tip
To stop the server, press `Ctrl+C` in your terminal.
:::

---

## Section 5: Understanding Routes & HTTP Methods

### What are Routes?

Routes are endpoints that handle specific URLs and HTTP methods. They define what happens when a client makes a request.

### HTTP Methods

| Method | Purpose | Example |
|--------|---------|---------|
| **GET** | Retrieve data | Fetch user information |
| **POST** | Create new data | Submit a form |
| **PUT** | Update existing data | Edit user profile |
| **DELETE** | Remove data | Delete a user |

### Implementing Multiple Routes

Update your `index.js` with more routes:

```javascript title="index.js"
import express from 'express';

const app = express();
const PORT = 8000;

// GET - Root route
app.get('/', (req, res) => {
  res.send('Hello I am Express js ....');
});

// GET - Contact route
app.get('/contact', (req, res) => {
  res.send('I am contact page ...');
});

// GET - About route
app.get('/about', (req, res) => {
  res.send('I am about page ...');
});

// GET - Route with URL parameter (dynamic route)
app.get('/user/:username', (req, res) => {
  const username = req.params.username;
  res.send(`Hello ${username}...`);
});

// GET - Route with query parameters
app.get('/search', (req, res) => {
  const keyword = req.query.keyword;
  res.send(`Searching for keyword: ${keyword}`);
});

app.listen(PORT, () => {
  console.log(`Server is running on localhost:${PORT}`);
});
```

### Key Concepts

- **Dynamic Routes:** Use `:paramName` to capture URL parameters (e.g., `/user/:username`)
- **Query Parameters:** Extract values from URLs like `/search?keyword=javascript` using `req.query`
- **URL Parameters:** Access dynamic values using `req.params`

### Testing Routes

You can test these routes using:
1. Browser (for GET requests)
2. [Postman](https://www.postman.com/) - API testing tool
3. cURL command line tool

**Example URLs to test:**

```
GET  http://localhost:8000/
GET  http://localhost:8000/contact
GET  http://localhost:8000/about
GET  http://localhost:8000/user/ashish
GET  http://localhost:8000/search?keyword=bootcamp
```

Example with cURL:
```bash
# GET request with URL parameter
curl http://localhost:8000/user/john

# GET request with query parameter
curl http://localhost:8000/search?keyword=javascript
```

---

## Section 6: Handling Request Data

### Middleware: express.json()

Middleware is software that processes requests before they reach your route handlers. `express.json()` parses incoming JSON data from the request body.

### Processing POST Data

Update your `index.js` to handle JSON data:

```javascript title="index.js"
import express from 'express';

const app = express();
const PORT = 8000;

// Middleware to parse JSON
app.use(express.json());

// GET - Root route
app.get('/', (req, res) => {
  res.send('Welcome to Web Dev Bootcamp API');
});

// POST - Receive and log data
app.post('/detail', (req, res) => {
  const { name, age } = req.body;
  console.log(req.body);
  
  res.json({
    message: `User name is ${name} and age is ${age}`
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on localhost:${PORT}`);
});
```

### Request Data Properties

| Property | Description | Example |
|----------|-------------|---------|
| `req.body` | Data sent in request body (POST/PUT) | `{ name: "John", age: 25 }` |
| `req.params` | URL parameters | `/user/:id` → `req.params.id` |
| `req.query` | Query string parameters | `?name=john&age=25` → `req.query.name` |
| `req.headers` | Request headers | Authorization, Content-Type, etc. |

### Example: Destructuring and Handling Data

```javascript
// POST request with body
app.post('/detail', (req, res) => {
  // Destructure name and age from request body
  const { name, age } = req.body;

  console.log('Received name:', name);
  console.log('Received age:', age);

  res.json({
    message: 'Data received successfully',
    user: { name, age }
  });
});

// GET request with query parameters
app.get('/search', (req, res) => {
  const searchTerm = req.query.keyword;
  res.json({ searchResults: `Results for "${searchTerm}"` });
});

// GET request with URL parameters
app.get('/user/:username', (req, res) => {
  const username = req.params.username;
  res.json({ message: `Hello ${username}` });
});
```

### Testing POST with Postman

1. Open Postman
2. Create a new POST request to `http://localhost:8000/detail`
3. Go to the **Body** tab, select **raw** → **JSON**
4. Enter:
   ```json
   {
     "name": "Ashish",
     "age": 22
   }
   ```
5. Click **Send**

You should receive:
```json
{
  "message": "User name is Ashish and age is 22"
}
```

:::info
Always add `app.use(express.json())` BEFORE defining routes that handle POST data.
:::

---

## Section 7: Introduction to MongoDB

### What is MongoDB?

MongoDB is a **NoSQL database** that stores data in flexible, JSON-like documents instead of rigid tables.

### SQL vs NoSQL

| Aspect | SQL | NoSQL |
|--------|-----|-------|
| **Structure** | Tables with rows & columns | Collections with documents |
| **Schema** | Fixed schema | Flexible schema |
| **Scalability** | Vertical scaling | Horizontal scaling |
| **Example** | PostgreSQL, MySQL | MongoDB, Redis |

### MongoDB Document Structure

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "age": 28,
  "skills": ["JavaScript", "React", "Node.js"]
}
```

Each document has:
- **Fields** (keys) and values
- An automatic `_id` field (unique identifier)
- Flexible schema (different documents can have different fields)

### Collections

A **collection** is a group of related documents. For example:
- `users` collection - stores user documents
- `items` collection - stores product documents
- `posts` collection - stores blog post documents

### Setting Up MongoDB Atlas

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (select the free tier)
4. Create a database user (save username & password)
5. Add your IP address to the whitelist
6. Get your connection string - it will look like:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database-name
   ```

:::warning
**Never share your connection string** - treat it like a password!
:::

---

## Section 8: Connecting with Mongoose

### What is Mongoose?

Mongoose is an **ODM (Object Document Mapper)** that provides a structured way to interact with MongoDB from Node.js. It helps you:
- Define schemas
- Validate data
- Manage relationships between data

### Installation

Install Mongoose:

```bash
npm install mongoose
```

Also install `dotenv` to safely store your connection string:

```bash
npm install dotenv
```

### Setting Up Connection

Create a `.env` file in your project root:

```bash title=".env"
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bootcamp_db
```

Update your `server.js`:

```javascript title="server.js"
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB successfully');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to Web Dev Bootcamp API');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

:::tip
Add `.env` to your `.gitignore` file to prevent accidentally pushing your credentials to GitHub.
:::

---

## Section 9: Defining a Schema & Model

### Understanding Schemas

A **schema** defines the structure of documents in a collection. It specifies:
- Field names
- Data types
- Validation rules (required, unique, etc.)
- Default values
- Timestamps

### Creating a User Model

Create a new folder and file:

```bash
mkdir models
touch models/user.model.js
```

Define your User schema:

```javascript title="models/user.model.js"
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
```

### Schema Field Options

| Option | Description | Example |
|--------|-------------|---------|
| `type` | The data type (String, Number, Boolean, etc.) | `type: String` |
| `required` | Field must have a value | `required: true` |
| `unique` | No duplicate values allowed | `unique: true` |
| `default` | Default value if not provided | `default: 'Active'` |
| `min` / `max` | Minimum/maximum values | `min: 0, max: 100` |
| `timestamps` | Auto add createdAt & updatedAt | `{ timestamps: true }` |

### How the Model Works

```javascript
// Creating a new user
const newUser = new User({
  name: 'Ashish',
  age: 22,
  email: 'ashish@example.com',
  username: 'ashish1'
});

// Saving to database
await newUser.save();
```

The model provides methods to:
- **Create** new documents
- **Read** documents from the database
- **Update** existing documents
- **Delete** documents

---

## Section 10: POST Route – Save Data to MongoDB

### Creating the Create User Endpoint

Update your `index.js` to import the User model and create a POST route:

```javascript title="index.js"
import express from 'express';
import mongoose from 'mongoose';
import { User } from './models/user.model.js';

const app = express();
const PORT = 8000;

const MONGO_URI = 'mongodb+srv://your-username:your-password@cluster.mongodb.net/your-db';

// Middleware
app.use(express.json());

// MongoDB Connection
const connectDb = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('DB is Connected');
  } catch (error) {
    console.log('DB error:', error);
  }
};

// POST - Create a new user
app.post('/create', async (req, res) => {
  try {
    const { name, age, email, username } = req.body;

    // Mongoose will automatically validate required fields and unique constraints
    const newUser = await User.create({
      name: name,
      age: age,
      email: email,
      username: username
    });

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Something went wrong',
      error: error.message
    });
  }
});

// Start the server
app.listen(PORT, (req, res) => {
  connectDb();
  console.log(`Server is running on localhost:${PORT}`);
});
```

### Key Points

- **async/await:** Used for asynchronous operations like database calls
- **try-catch:** Wraps the code to handle errors gracefully
- **User.create():** Mongoose method that creates and saves a document in one step
- **HTTP Status Codes:** 
  - `201` - Resource created successfully
  - `500` - Server error

### Testing with Postman

1. Open Postman
2. Create a new POST request to `http://localhost:8000/create`
3. Go to the **Body** tab, select **raw** → **JSON**
4. Enter:
   ```json
   {
     "name": "Ashish",
     "age": 22,
     "email": "ashish@example.com",
     "username": "ashish1"
   }
   ```
5. Click **Send**

**Success Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Ashish",
    "age": 22,
    "email": "ashish@example.com",
    "username": "ashish1",
    "createdAt": "2024-02-22T10:30:00.000Z",
    "updatedAt": "2024-02-22T10:30:00.000Z"
  }
}
```

The user is now saved in MongoDB! Notice the `_id` (auto-generated), `createdAt`, and `updatedAt` fields.

---

## Section 11: GET Route – Fetch All Data

### Retrieve All Users

Add GET endpoints to fetch users:

```javascript title="index.js"
// GET - Fetch all users
app.get('/getallusers', async (req, res) => {
  try {
    const allUsers = await User.find();
    
    res.status(200).json({
      message: 'All users fetched successfully',
      count: allUsers.length,
      users: allUsers
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Something went wrong',
      error: error.message
    });
  }
});

// GET - Fetch a single user by username
app.get('/getallusers/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      message: 'User retrieved successfully',
      user: user
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'User not found',
      error: error.message
    });
  }
});
```

### Key Mongoose Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `User.find()` | Get all users from collection | Array of documents |
| `User.findOne({ username })` | Get one user by field | Single document or null |
| `User.findById(id)` | Get user by MongoDB ID | Single document or null |
| `User.findByIdAndUpdate()` | Update and return updated doc | Updated document |
| `User.findByIdAndDelete()` | Delete and return deleted doc | Deleted document |

### Testing GET Endpoints with Postman

**Fetch All Users:**
```
GET http://localhost:8000/getallusers
```

**Response:**
```json
{
  "message": "All users fetched successfully",
  "count": 2,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Ashish",
      "age": 22,
      "email": "ashish@example.com",
      "username": "ashish1",
      "createdAt": "2024-02-22T10:30:00.000Z",
      "updatedAt": "2024-02-22T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John",
      "age": 25,
      "email": "john@example.com",
      "username": "john123",
      "createdAt": "2024-02-22T10:35:00.000Z",
      "updatedAt": "2024-02-22T10:35:00.000Z"
    }
  ]
}
```

**Fetch Single User:**
```
GET http://localhost:8000/getallusers/ashish1
```

**Response:**
```json
{
  "message": "User retrieved successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Ashish",
    "age": 22,
    "email": "ashish@example.com",
    "username": "ashish1",
    "createdAt": "2024-02-22T10:30:00.000Z",
    "updatedAt": "2024-02-22T10:30:00.000Z"
  }
}
```

### Query vs Find

- **`find({})` or `find()`** - Returns all documents as an array
- **`findOne({ username })`** - Returns the first matching document as an object

```javascript
// Find all users
const users = await User.find();  // Returns array: [{...}, {...}]

// Find one specific user
const user = await User.findOne({ username: 'ashish1' });  // Returns object: {...}
```

---

## Section 12: Code Organization - Controllers & Routes

### What are Controllers?

Controllers are separate files that contain the logic for handling requests. They keep your code organized and reusable.

### Creating a Controller File

Create a new file `controller.js`:

```javascript title="controller.js"
import { User } from './models/user.model.js';

// Controller for handling user by username
export const userController = (req, res) => {
  const username = req.params.username;
  res.send(`Hello ${username}...`);
};

// Controller for login
export const logincontroller = (req, res) => {
  res.send('This is the login page');
};

// Controller for signup
export const signupcontroller = (req, res) => {
  res.send('This is the signup page');
};
```

### Creating a Routes File

Create a new file `route.js`:

```javascript title="route.js"
import express from 'express';
import { logincontroller, signupcontroller } from './controller.js';

const router = express.Router();

// Define routes using controllers
router.get('/login', logincontroller);
router.get('/signup', signupcontroller);

export default router;
```

### Using Routes in Your Main File

Update `index.js` to use the router:

```javascript title="index.js (excerpt)"
import express from 'express';
import router from './route.js';
import { userController } from './controller.js';

const app = express();

// Routes
app.get('/user/:username', userController);

// Use the router for a specific prefix
app.use('/user', router);

app.listen(8000, () => {
  console.log('Server is running on localhost:8000');
});
```

### Benefits of This Structure

✅ **Separation of Concerns** - Keep route logic separate from main file  
✅ **Reusability** - Use the same controller in multiple routes  
✅ **Maintainability** - Easy to find and update controller logic  
✅ **Scalability** - As your project grows, this structure scales well  

### Project Structure with Controllers & Routes

```
demo_practice/
  ├── models/
  │   └── user.model.js
  ├── controller.js        (route handlers)
  ├── route.js             (route definitions)
  ├── index.js             (main server file)
  ├── .env
  ├── package.json
  └── package-lock.json
```

---

## Summary of Day 1

By now, you've learned:

✅ **Node.js & npm** - JavaScript runtime and package manager  
✅ **MERN Stack Overview** - The four technologies that make up the stack  
✅ **Express Basics** - Building a server with routes  
✅ **HTTP Methods** - GET, POST, PUT, DELETE  
✅ **Request Handling** - Extracting data from requests  
✅ **MongoDB & Mongoose** - Database connection and modeling  
✅ **CRUD Operations** - Create and Read operations (POST & GET)  
✅ **Code Organization** - Controllers and routes for clean architecture  

### Your Accomplishments

You've built a fully functional backend API that:
- Listens on a port and handles multiple routes
- Receives JSON data from clients
- Validates and saves data to MongoDB
- Retrieves data from the database
- Provides proper error handling
- Follows professional code organization patterns

### Final Project Structure

```
demo_practice/
  ├── node_modules/
  ├── models/
  │   └── user.model.js
  ├── controller.js
  ├── route.js
  ├── index.js
  ├── .env
  ├── .gitignore
  ├── package.json
  └── package-lock.json
```

### Next Steps

On **Day 2**, we'll cover:
- Advanced routing patterns
- User authentication & authorization
- Middleware creation
- Error handling best practices
- Complete REST API implementation

---

## Key Takeaways

:::note
- **Separate concerns** - Keep route logic in controllers
- **Use ES6 modules** - Modern JavaScript syntax with import/export
- **Validate all inputs** - Never trust user data
- **Handle errors gracefully** - Always use try-catch for async operations
- **Test thoroughly** - Use Postman for API testing
- **Keep code DRY** - Don't Repeat Yourself - reuse controllers
:::

---

## Useful Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Mongoose Documentation](https://mongoosejs.com/)
- [HTTP Status Codes](https://httpwg.org/specs/rfc9110.html#status.codes)
- [Postman Desktop App](https://www.postman.com/downloads/)
- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

Happy learning! 🚀
