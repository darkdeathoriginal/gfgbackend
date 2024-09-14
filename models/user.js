const mongoose = require("mongoose");
const { ROLES, JWT_SECRET } = require("../config");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const saltRounds = 10; 

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
  role: {
    type: String,
    required: true,
    enum: ROLES,
  },
});
userSchema.pre('save', async function(next) {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(this.password, salt);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateSessionToken = function() {
    return jwt.sign({
        id: this._id,
        name: this.name,
        role: this.role,
    }, JWT_SECRET, { expiresIn: "24h" });
};


const User = mongoose.model("User", userSchema);

module.exports = User;
