const express = require("express");
const router = express.Router();
const { ROLES } = require("../config");
const User = require("../models/user");

/**
 * @openapi
 *  tags:
 *    name: Authentication
 *    description: API endpoints for user authentication
 * 
 * /api/auth/signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *               password:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 255
 *               role:
 *                 type: string
 *                 enum: ["LIBRARIAN", "REGULAR"]
 *     responses:
 *       '200':
 *         description: User account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: success
 *                 session:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # JWT session token
 *       '401':
 *         description: Invalid role or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Please provide all required fields or Invalid Role
 *       '409':
 *         description: Username already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Username already exists
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal Server Error
 * 
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: success
 *                 session:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # JWT session token
 *       '401':
 *         description: Invalid credentials or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Please provide all required fields or Invalid Credentials
 * 
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 */


router.post("/signup", async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    console.log(req.body);
    return res
      .status(401)
      .json({ message: "Please provide all required fields" });
  }
  if (!ROLES.includes(role)) {
    return res.status(401).json({ message: "Invalid Role" });
  }

  try {
    const user = new User({
      username,
      password,
      role,
    });
    await user.save();
    const session = user.generateSessionToken();
    res.json({
      state: "success",
      session,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Username already exists" });
    }
    console.error("Error signing up:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res
      .status(401)
      .json({ message: "Please provide all required fields" });
  }
  const user = await User.findOne({ name });
  if (!user) {
    return res.status(401).json({ message: "Invalid Credentials" });
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid Credentials" });
  }
  const session = user.generateSessionToken();
  res.json({
    state: "success",
    session,
  });
});

module.exports = router;
