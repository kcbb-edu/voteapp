// var app = require('express')();
// var http = require('http').Server(app);
// var io = require('socket.io')(http);

//ES6
import express from 'express';
import http from 'http';
import socketio from 'socket.io';

const app = express(),
    httpServer = http.Server(app),
    io = socketio(httpServer);

let scoredUsers = [];
// Generate a random 4-digit numeric string
let sessionCode = Math.floor(1000 + Math.random() * 9000).toString();

app.use(express.static('dest'));

app.get('/', (request, response) => {
    // response.send('<h1>Hello World!</h1>');
    response.sendFile(__dirname + '/dest/index.html');
});

app.get('/display', (request, response) => {
    // response.send('<h1>Hello World!</h1>');
    response.sendFile(__dirname + '/dest/display.html');
});

app.get('/admin', (request, response) => {
    // response.send('<h1>Hello World!</h1>');
    response.sendFile(__dirname + '/dest/admin.html');
});

io.on('connection', (socket) => {
    console.log('A user is connected: ' + socket.id);

    socket.on('disconnect', (socket) => {
        console.log('A user disconnected: ' + socket.id);
    });

    // Send session code to display/admin
    socket.emit('sessionCode', sessionCode);

    socket.on('score', (data, confirmation) => {
        if (data.code !== sessionCode) {
            confirmation('Error: Incorrect Code');
            return;
        }
        scoredUsers.push(data.userId)
        io.emit('pushScore', data.score);
        confirmation('Scored: ' + data.score);
    });

    socket.on('reset', (message) => {
        scoredUsers = [];
        // Optional: Regenerate code on reset? 
        // Let's keep it simple and stable for now.
        // sessionCode = Math.floor(1000 + Math.random() * 9000).toString();
        // io.emit('sessionCode', sessionCode);
        io.emit('reset', message);
        console.log('System Reset');
    });

    socket.on('authUser', (data, confirmation) => {
        console.log(data);
        io.emit('authUser', { 'withData': data.withData, 'socreClicked': data.socreClicked, 'scoredUsers': scoredUsers });
        confirmation(data);
    });
    io.emit('authUser', { scoredUsers });

    const total = io.engine.clientsCount;

    io.emit('onlineUserCount', total);
});

let port = process.env.PORT || 3000;

httpServer.listen(port, () => {
    console.log('listening on *: 3000');
});

