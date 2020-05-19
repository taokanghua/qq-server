const mongoose = require('mongoose')
const Schema = mongoose.Schema

const personalSchema = new Schema({
	id: String,
	friends: Array,
	chat: Array,
	online: Boolean,
	pushmsg:Array
})

module.exports = mongoose.model('pensonal', personalSchema)