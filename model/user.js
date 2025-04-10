const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    phone: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    confirmPassword: {type: String, required: true}
})

module.exports = mongoose.model("user", userSchema)