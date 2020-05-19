const mongoose = require('mongoose')
const Schema = mongoose.Schema

const QuestionSchema = new Schema({
	questionList: Array
})

module.exports = mongoose.model('questionList', QuestionSchema)