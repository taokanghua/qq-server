const mongoose = require('mongoose')
const Schema = mongoose.Schema

const usrDataSchema = new Schema({
	id: {
		required: true,
		type: String
	},
	nickname: String,
	gender:String,
	borndate: String,
	selfdesc:String,
	img: String
})
module.exports = mongoose.model('userdata', usrDataSchema)