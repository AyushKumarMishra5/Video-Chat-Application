const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const userModel = require('./model/user');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'auth')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth', 'signup.html'))
})

app.get('/home', (req, res) => {
  res.render('home')
})

app.get('/room/:room', (req, res) => {
  res.render('room', { roomId: req.params.room });
});

app.post('/user', (req, res) => {
  userModel.create(req.body)
    .then((data) => res.json(data))
    .catch((err) => res.json(err))
})
app.patch('/user-update', (req, res) => {
  const { email, newUsername } = req.body;

  if (!email || !newUsername) {
    return res.status(400).json({ success: false, message: "Email and new username are required." });
  }

  userModel.findOneAndUpdate(
    { email: email },
    { username: newUsername },
    { new: true }
  )
    .then((updatedUser) => {
      if (!updatedUser) {
        return res.status(404).json({ success: false, message: "User not found." });
      }
      res.status(200).json({ success: true, user: updatedUser });
    })
    .catch((err) => {
      console.log("Error updating username:", err);
      res.status(500).json({ success: false, message: "Server error", error: err });
    });
});


io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    if (!roomId || !userId) return;

    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

const Mongo_URL = process.env.MONGO_URL
mongoose.connect(Mongo_URL)
  .then(() => console.log("Connected to the Database."))
  .catch((err) => console.log("Error connecting to the database", err))

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

