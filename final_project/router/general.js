const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');


public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (users.some(user => user.username === username)) {
    return res.status(400).json({ message: "User already exists" });
  }if (!username || !password) {
    return res.status(400).json({ message: "Missing username or password" });
  }

  users.push({ username, password });
  return res.status(201).json({ message: "User registered successfully" });
});


// Get the book list available in the shop
public_users.get('/', async function (req, res) {
  try {
    // Replace with the actual URL of your book service or API
    const apiUrl = "https://api.example.com/books"; 

    // Fetch books data using Axios
    const response = await axios.get(apiUrl);

    // Send the fetched data as the response
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching books:", error.message);

    // Handle errors gracefully
    return res.status(500).json({ message: "Failed to fetch books", error: error.message });
  }
});


// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = parseInt(req.params.isbn, 10);
  const book = books[isbn]; // Access the book directly by ISBN key

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json(book);
});


// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  const author = req.params.author;
  const booksByAuthor = Object.values(books).filter(book => book.author === author);

  if (booksByAuthor.length === 0) {
    return res.status(404).json({ message: "No books found by this author" });
  }

  return res.status(200).json(booksByAuthor);
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
  const title = req.params.title;
  const booksByTitle = Object.values(books).filter(book => book.title.toLowerCase().includes(title.toLowerCase()));

  if (booksByTitle.length === 0) {
    return res.status(404).json({ message: "No books found with this title" });
  }

  return res.status(200).json(booksByTitle);
});


//  Get book review
public_users.get('/review/:isbn', function (req, res) {
  const isbn = parseInt(req.params.isbn, 10);
  const book = books[isbn]; // Access the book directly by ISBN key

  if (!book || !book.reviews) {
    return res.status(404).json({ message: "Reviews not found for this book" });
  }

  return res.status(200).json(book.reviews);
});


module.exports.general = public_users;
