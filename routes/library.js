const express = require("express");
const router = express.Router();
const Book = require("../models/book");
const { validateSessionToken } = require("../utils/helpers");

router.get("/", async (req, res) => {
  const books = await Book.find();
  res.json(books);
});

router.post("/", validateSessionToken, async (req, res) => {
  const user = req.user;
  const { role } = user;
  if (role !== "LIBRARIAN") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { title, author, isbn, quantity } = req.body;
  if (!title || !author || !isbn || !quantity) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }
  try {
    const book = new Book({
      title,
      author,
      isbn,
      quantity,
      available: quantity,
    });
    await book.save();
    res.json({
      state: "success",
      book,
    });
  } catch (error) {
    console.log("Error adding book:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/:id", validateSessionToken, async (req, res) => {
  const user = req.user;
  const { role } = user;
  if (role !== "LIBRARIAN") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Please provide book id" });
  }
  const { title, author, isbn, quantity } = req.body;
  const book = await Book.findById(id);
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }
  if (title) book.title = title;
  if (author) book.author = author;
  if (isbn) book.isbn = isbn;
  if (quantity) {
    book.quantity = quantity;
    book.available = quantity - (book.quantity - book.available);
  }
  await book.save();
  res.json({
    state: "success",
    book,
  });
});

router.delete("/:id", validateSessionToken, async (req, res) => {
  const user = req.user;
  const { role } = user;
  if (role !== "LIBRARIAN") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Please provide book id" });
  }
  const book = await Book.findById(id);
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }
  await book.remove();
  res.json({
    state: "success",
    book,
  });
});

router.post("/:id/borrow", validateSessionToken, async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Please provide book id" });
  }
  const book = await Book.findById(id);
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }
  if (book.available === 0) {
    return res.status(400).json({ message: "Book not available" });
  }
  book.available--;
  if (!book.borrowers) {
    book.borrowers = [];
  }
  if (book.borrowers.includes(user.id)) {
    return res
      .status(400)
      .json({ message: "You have already borrowed this book" });
  }
  book.borrowers.push(user.id);
  await book.save();
  res.json({
    state: "success",
    book,
  });
});

router.post("/:id/return", validateSessionToken, async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Please provide book id" });
  }
  let book
  try {
    book = await Book.findById(id);
  } catch (error) {
    return res.status(404).json({ message: "Book not found" });   
  }

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }
  if (!book.borrowers.includes(user.id)) {
    return res.status(400).json({ message: "You have not borrowed this book" });
  }
  book.available++;
  book.borrowers = book.borrowers.filter(
    (borrower) => borrower.toString() !== user.id.toString()
  );
  await book.save();
  res.json({
    state: "success",
    book,
  });
});

module.exports = router;

/**
 * @openapi
 * tags:
 *   - name: Library Management
 *     description: API endpoints for managing a library
 * 
 * /api/library:
 *   get:
 *     summary: Get all books
 *     tags: [Library Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 * 
 *   post:
 *     summary: Add a new book
 *     tags: [Library Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewBook'
 *     responses:
 *       '200':
 *         description: Book added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: success
 *                 book:
 *                   $ref: '#/components/schemas/Book'
 *       '400':
 *         description: Invalid request or missing required fields
 *       '401':
 *         description: Unauthorized access or missing session token
 *       '500':
 *         description: Internal Server Error
 * 
 * /api/library/{id}:
 *   put:
 *     summary: Update book details
 *     tags: [Library Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the book to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBook'
 *     responses:
 *       '200':
 *         description: Book updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: success
 *                 book:
 *                   $ref: '#/components/schemas/Book'
 *       '400':
 *         description: Invalid request or missing required fields
 *       '401':
 *         description: Unauthorized access or missing session token
 *       '404':
 *         description: Book not found
 *
 *   delete:
 *     summary: Remove a book
 *     tags: [Library Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the book to remove
 *     responses:
 *       '200':
 *         description: Book removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: success
 *                 book:
 *                   $ref: '#/components/schemas/Book'
 *       '400':
 *         description: Invalid request or missing required fields
 *       '401':
 *         description: Unauthorized access or missing session token
 *       '404':
 *         description: Book not found
 *
 * /api/library/{id}/borrow:
 *   post:
 *     summary: Borrow a book
 *     tags: [Library Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the book to borrow
 *     responses:
 *       '200':
 *         description: Book borrowed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: success
 *                 book:
 *                   $ref: '#/components/schemas/Book'
 *       '400':
 *         description: Invalid request or book not available
 *       '401':
 *         description: Unauthorized access or missing session token
 *       '404':
 *         description: Book not found
 *
 * /api/library/{id}/return:
 *   post:
 *     summary: Return a book
 *     tags: [Library Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the book to return
 *     responses:
 *       '200':
 *         description: Book returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: success
 *                 book:
 *                   $ref: '#/components/schemas/Book'
 *       '400':
 *         description: Invalid request or book not borrowed by user
 *       '401':
 *         description: Unauthorized access or missing session token
 *       '404':
 *         description: Book not found
 * 
 * components:
 *   securitySchemes:
 *     bearerAuth:           
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT 
 *   schemas:
 *     Book:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The ID of the book
 *           example: 1234567890abcdef12345678
 *         title:
 *           type: string
 *           description: The title of the book
 *           example: To Kill a Mockingbird
 *         author:
 *           type: string
 *           description: The author of the book
 *           example: Harper Lee
 *         isbn:
 *           type: string
 *           description: The ISBN of the book
 *           example: 978-0446310789
 *         quantity:
 *           type: number
 *           description: The total quantity of the book
 *           example: 5
 *         available:
 *           type: number
 *           description: The number of available copies
 *           example: 3
 *         borrowers:
 *           type: array
 *           items:
 *             type: string
 *           description: The IDs of users who have borrowed the book
 *           example: ["1234567890abcdef12345678", "2345678901abcdef23456789"]
 *     NewBook:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the book
 *           example: To Kill a Mockingbird
 *         author:
 *           type: string
 *           description: The author of the book
 *           example: Harper Lee
 *         isbn:
 *           type: string
 *           description: The ISBN of the book
 *           example: 978-0446310789
 *         quantity:
 *           type: number
 *           description: The total quantity of the book
 *           example: 5
 *     UpdateBook:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the book
 *         author:
 *           type: string
 *           description: The author of the book
 *         isbn:
 *           type: string
 *           description: The ISBN of the book
 *         quantity:
 *           type: number
 *           description: The total quantity of the book
 */