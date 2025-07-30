// server.js

/*
================================================================================
|                                                                              |
|                           BACKEND SERVER SETUP                               |
|                                                                              |
================================================================================
This file contains the complete code for your backend server. This server will
handle requests from your React admin panel to create, read, update, and
delete blog posts from your Firestore database.

--------------------------------------------------------------------------------
-- HOW TO RUN THIS SERVER --
--------------------------------------------------------------------------------
1.  Create a new folder for your backend (e.g., "blog-backend").
2.  Inside that folder, create a new file and name it `server.js`. Copy all the
    code from this document into that file.
3.  Create another file in the same folder and name it `serviceAccountKey.json`.
    You will get the content for this file from your Firebase project settings
    (instructions below).
4.  Open a terminal or command prompt in the "blog-backend" folder.
5.  Run `npm init -y` to create a package.json file.
6.  Run `npm install express firebase-admin cors` to install the necessary packages.
7.  Run `node server.js` to start the server.

--------------------------------------------------------------------------------
-- HOW TO GET YOUR serviceAccountKey.json --
--------------------------------------------------------------------------------
1.  Go to your Firebase project console.
2.  Click the gear icon next to "Project Overview" and select "Project settings".
3.  Go to the "Service accounts" tab.
4.  Click the "Generate new private key" button. A confirmation dialog will
    appear.
5.  Click "Generate key". A JSON file will be downloaded to your computer.
6.  Rename this downloaded file to `serviceAccountKey.json` and place it in your
    "blog-backend" folder alongside `server.js`.

**IMPORTANT: Treat this serviceAccountKey.json file like a password. Do not
share it or commit it to a public code repository like GitHub.**
*/

// 1. Import necessary packages
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// 2. Initialize Express app
const app = express();
const port = 5001; // You can use any port you like

// 3. Middleware Setup
// This allows your server to accept JSON data in requests
app.use(express.json());
// This enables Cross-Origin Resource Sharing (CORS), allowing your React app
// (which runs on a different port) to make requests to this server.
app.use(cors());

// 4. Firebase Admin SDK Initialization
// Get the service account key you downloaded from Firebase
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Get a reference to the Firestore database
const db = admin.firestore();

//==============================================================================
// API ENDPOINTS
//==============================================================================

/*
--------------------------------------------------------------------------------
-- GET ALL BLOG POSTS --
URL: GET /api/posts
Description: Fetches all documents from the 'posts' collection in Firestore.
Response: An array of blog post objects.
--------------------------------------------------------------------------------
*/
app.get('/api/posts', async (req, res) => {
  try {
    const postsCollection = db.collection('posts');
    const snapshot = await postsCollection.orderBy('publishDate', 'desc').get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const posts = [];
    snapshot.forEach(doc => {
      posts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).send("Error fetching posts from database.");
  }
});


/*
--------------------------------------------------------------------------------
-- CREATE A NEW BLOG POST --
URL: POST /api/posts
Description: Creates a new document in the 'posts' collection.
Body: A JSON object with `title`, `content`, and `author`.
Response: The newly created blog post object with its ID.
--------------------------------------------------------------------------------
*/
app.post('/api/posts', async (req, res) => {
  try {
    const { title, content, author } = req.body;

    // Basic validation
    if (!title || !content) {
      return res.status(400).send("Title and content are required.");
    }

    const newPost = {
      title,
      content,
      author: author || "Admin", // Default author to "Admin" if not provided
      publishDate: new Date()
    };

    const docRef = await db.collection('posts').add(newPost);

    res.status(201).json({
      id: docRef.id,
      ...newPost
    });

  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send("Error creating post.");
  }
});

/*
--------------------------------------------------------------------------------
-- ADMIN LOGIN (SIMPLE) --
URL: POST /api/login
Description: A very basic login check.
**NOTE: This is NOT secure for production. It's a placeholder.**
Body: A JSON object with `username` and `password`.
Response: A success message or an error.
--------------------------------------------------------------------------------
*/
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // IMPORTANT: In a real application, you would check these credentials
    // against a database and return a secure token (like a JWT).
    // For now, we are just hardcoding them.
    if (username === 'admin' && password === 'password123') {
        res.status(200).json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});


// 5. Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
