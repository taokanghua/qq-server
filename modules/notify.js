const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const notifySchema = new Schema({
	notify: Object,
	scrollnotify: String
})

module.exports = mongoose.model('sysnotify', notifySchema)