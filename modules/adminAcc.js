const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AdminAccSchema = new Schema({
	name: String,
	email: String,
	phone:String,
	role: String,
	enable: Boolean,
	password: String,
	avatar: String
})

module.exports = mongoose.model('adminAcc', AdminAccSchema)