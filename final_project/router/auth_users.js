const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  // Check if the username already exists in the users array
  return users.some(user => user.username === username);
};


const authenticatedUser = (username, password) => {
  // Check if the username and password match any user in the users array
  return users.some(user => user.username === username && user.password === password);
};


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const session = req.session;

  // Extract token from session
  const tokenFromSession = session && session.authorization ? session.authorization.accessToken : null;

  // Extract token from header (ensure "Bearer" scheme)
  const tokenFromHeader = authHeader ? authHeader.split(' ')[1] : null;

  // Determine the token source
  const token = tokenFromSession || tokenFromHeader;

  // Debug logs (remove in production)
  console.log("Auth Header:", authHeader);
  console.log("Token from Session:", tokenFromSession);
  console.log("Token from Header:", tokenFromHeader);

  // Handle missing token
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No Access Token Found!" });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
    if (err) {
      console.error("Token verification failed:", err.message); // Debug log
      return res.status(403).json({ message: "Forbidden: Invalid or Expired Token!" });
    }

    // Attach decoded user info to the request
    req.user = decoded;
    next(); // Proceed to the next middleware or route
  });
};




//only registered users can login
regd_users.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Check if username or password is missing
  if (!username || !password) {
      return res.status(404).json({ message: "Error logging in" });
  }

  // Authenticate user
  if (authenticatedUser(username, password)) {
      // Generate JWT access token
      const accessToken = jwt.sign(
        { data: password },
        process.env.JWT_SECRET || "fallback_secret", // Use this secret key
        { expiresIn: 60 * 60 } // Token expires in 1 hour
    );
    req.session.authorization = { accessToken, username };

      // Store access token and username in session
      req.session.authorization = {
          accessToken, username
      }
      return res.status(200).send({ message: "User successfully logged in"});
  } else {
      return res.status(208).json({ message: "Invalid Login. Check username and password" });
  }
});


// Add a book review
regd_users.put("/auth/review/:isbn", authenticateToken, (req, res) => {
  const isbn = parseInt(req.params.isbn, 10);
  const { review } = req.body;
  const user = req.user.username;

  // Find the book by ISBN
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Ensure the book has a reviews array
  if (!book.reviews) {
    book.reviews = {};
  }

  // Add the review to the book
  book.reviews[user] = { review };

  return res.status(200).json({ message: "Review added successfully", book });
});


// Delete a book review
regd_users.delete("/auth/review/:isbn", authenticateToken, (req, res) => {
  const isbn = parseInt(req.params.isbn, 10); // Get the ISBN from the URL
  const user = req.user.username; // Get the username from the authenticated token

  // Find the book by ISBN
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Check if the book has a reviews object
  if (!book.reviews || !book.reviews[user]) {
    return res.status(404).json({ message: "Review not found for this user" });
  }

  // Delete the user's review
  delete book.reviews[user];

  return res.status(200).json({ message: "Review deleted successfully", book });
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
