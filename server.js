const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

// Store user names and socket IDs
const users = {};



io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle user joining with a name
    socket.on('join', (name) => {
        users[socket.id] = name; // Store the user's name
        console.log(users);
        console.log(`${name} has joined`);
        io.emit('update user list', Object.values(users)); // Notify all users
    });

    // Handle private messages
    socket.on('private message', ({ recipientName, message }) => {
        const senderName = users[socket.id];
        const recipientSocketId = Object.keys(users).find(id => users[id] === recipientName);
        if (recipientSocketId) {
            socket.to(recipientSocketId).emit('private message', { message, senderName });
        }
    });

    // Handle video call requests
    socket.on('video call', ({ recipientName }) => {
        const senderName = users[socket.id];
        const recipientSocketId = Object.keys(users).find(id => users[id] === recipientName);
        if (recipientSocketId) {
            socket.to(recipientSocketId).emit('video call', { from: senderName });
        }
    });

    // Handle video offers
    socket.on('video offer', ({ offer, to }) => {
        const recipientSocketId = Object.keys(users).find(id => users[id] === to);
        if (recipientSocketId) {
            socket.to(recipientSocketId).emit('video offer', { offer, from: users[socket.id] });
        }
    });

    // Handle video answers
    socket.on('video answer', ({ answer, to }) => {
        const recipientSocketId = Object.keys(users).find(id => users[id] === to);
        if (recipientSocketId) {
            socket.to(recipientSocketId).emit('video answer', { answer, from: users[socket.id] });
        }
    });

    // Handle ICE candidates
    socket.on('ice candidate', ({ candidate, to }) => {
        const recipientSocketId = Object.keys(users).find(id => users[id] === to);
        if (recipientSocketId) {
            socket.to(recipientSocketId).emit('ice candidate', { candidate, from: users[socket.id] });
        }
    });

    socket.on('disconnect', () => {
        const name = users[socket.id];
        delete users[socket.id]; // Clean up on disconnect
        console.log(`${name} has disconnected`);
        io.emit('update user list', Object.values(users)); // Notify all users
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
