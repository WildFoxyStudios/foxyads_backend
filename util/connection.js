//mongoose
const mongoose = require("mongoose");

// mongoose.connect(process.env.MongoDb_Connection_String, {});

// const db = mongoose.connection;
// module.exports = db;

const EventEmitter = require('events');
const dbMock = new EventEmitter();
setTimeout(() => dbMock.emit('open'), 100); // Simulate open event
module.exports = dbMock;
