const mongoose = require('mongoose')
const Schema = mongoose.Schema

const LoginUpSchema = new Schema({
	id: String,
	password: {
		required: true,
		type: String
	},
	question: {
		required: true,
		type: String
	},
	answer: {
		required: true,
		type: String
	},
	img: String,
	logindate: String,
	local:Object
})
module.exports = mongoose.model('account', LoginUpSchema)