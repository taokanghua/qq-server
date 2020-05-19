const mongoose = require('mongoose')
const Schema = mongoose.Schema

const chatlogSchema = new Schema({
	roomid: String,
	content:Array
})

module.exports = mongoose.model('chatlog', chatlogSchema)