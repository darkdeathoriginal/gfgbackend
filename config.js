require("dotenv").config();

module.exports = {
    PORT : process.env.PORT || 3000,
    ROLES:['LIBRARIAN','REGULAR'],
    MONGODB_URI : process.env.MONGODB_URI,
    JWT_SECRET : process.env.JWT_SECRET || "secret",
    SITE_URL : process.env.SITE_URL || "http://localhost:3000"
}