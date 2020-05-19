const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dynamicSchema = new Schema({
	uniq: String,
	id: String,
	ip:String,
	name: String,
	avatar: String,
	time: String,
	content: String,
	personal: String,
	show: Boolean,
	imgs: Array,
	local: String,
	looknum: Number,
	comment: Array,
	goods: Array
})

module.exports = mongoose.model('dynamic', dynamicSchema)