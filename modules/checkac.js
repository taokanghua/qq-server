const mongoose = require('mongoose')
const Schema = mongoose.Schema

const checkAcSchema = new Schema({
	account: String,
	getac: String
})
module.exports = mongoose.model('singnac', checkAcSchema)