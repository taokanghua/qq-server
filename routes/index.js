const router = require('koa-router')()
const axios = require('axios')
const jwt = require('jsonwebtoken')
const pagination = require('mongoose-sex-page')
const secret = 'kanghuat'

// 导入模型对象
const login = require('../modules/login.js')
const checkac = require('../modules/checkac.js')
const questionlist = require('../modules/question.js')
const userdata = require('../modules/userdata.js')
const personal = require('../modules/personal.js')
const notify = require('../modules/notify.js')
const dynamic = require('../modules/dynamic.js')

const adminAcc = require('../modules/adminAcc.js')


const {parse} = require('path')

// test page

router.get('/home', async ctx=>{
	ctx.body = 'hello Koa'
})
// router.get('/test', async ctx=>{
// 	let res = await login.findOne({id:'10002'}, 'question answer')
// 	ctx.body = res
// })


// 路由中间件
router.use(async (ctx, next) => {
	//无需验证token的页面
	let accessList = ['/loginin', '/loginup', '/forget', '/questions', '/test', '/question', '/adminloginin', '/getlocal','/getbaseinfo','/updatedata']
	if(accessList.includes(ctx.request.path) || ctx.request.path.includes('question') ){
		await next()
	}else{//需要验证token'
		const token = ctx.get('Authorization')
		if(token.length <= 0){ //没有token
			ctx.body = {
				content: '你还没有登陆哦！',
				meta:{
					status: 401,
					msg:'请登录账号！'
				}
			}
		}else{
			// 有token时候 还要验证token
			try{
				const res = await jwt.verify(token.split(" ")[1], secret)
				// ctx.body = {
				// 	content: '验证通过',
				// 	meta:{
				// 		status: 200,
				// 		msg: 'token正确'
				// 	}
				// }
				await next()
			}catch(err){
				//错误token
				ctx.body = {
					content: 'token有误',
					err,
					meta:{
						status:401,
						msg: '请重新登陆！'
					}
				}
			}
		}
		
	}
})


// 注册接口
router.post('/loginup', async ctx => {
	// 每次先从数据库获取账号
	
	let res = await checkac.findOne({getac: 'ac'})
	// console.log(res.account)
	// 生成的账号
	let curNumber = parseInt(res.account)+1
	await checkac.update({getac: 'ac'},{account:curNumber})

	let mbody = ctx.request.body
	let cimg = Math.floor(Math.random()*(28-1+1)+1)
	
	let data = {
		id: curNumber,
		password: mbody.password,
		question: mbody.question,
		answer: mbody.answer,
		local: mbody.local,
		img: 'http://taokanghua.cn/sources/avatar/'+cimg+'.jpg',
		logindate: new Date().toString()
	}
	try{// try必填字段没填的情况下
		const res = new login(data)
		await res.save()
		ctx.body = {
			id:curNumber,
			meta:{
				status: 200,
				msg: '恭喜你！注册成功!'
			}
		}
	}catch(err){
		ctx.body = {
			meta: {
				status:501,
				msg: '自己看错误信息',
				err
			}
		}
	} 

})

// 登录接口
router.post('/loginin', async ctx =>{
	let account = ctx.request.body.account
	let password = ctx.request.body.password
	let res = await login.findOne({id:account})
	// console.log(res)
	if(res=== null){ // 没有此用户的时候
		ctx.body = {
			content: '没有此用户',
			meta:{
				status: 400,
				msg: res
			}
		}
	}else{// 登录成功 返回token
		if(password == res.password){ //密码也正确的情况
			let payload = {
				account,
				password
			}
			// 在个人数据库中注册信息
			let res2 = await personal.findOne({id:account})
			let personlist = null
			if(res2 === null){
				let data = {
					id: account,
					friends:[account, '10001'],
					chat:[],
					online:true,
					pushmsg:[]
				}
				let t = new personal(data)
				personlist = await t.save()
			}else{
				personlist = res2
			}
			//生成token
			const token = jwt.sign(payload, secret, {expiresIn: '6h'})
			ctx.body = {
				token:'Bearer '+token,
				userinfo:{
					id: res.id,
					img: res.img,
					personlist
				},
				meta:{
					status:200,
					msg:'登录成功'
				}
			}
		}else{
			//密码错误
			ctx.body = {
				content: '密码错误了',
				meta: {
					status:'400',
					msg:'error'
				}
			}
		}
	}
})

//新增接口 注册后获取用户信息
router.post('/getbaseinfo', async ctx =>{
	let id = ctx.request.body.id
	let res = await login.findOne({id})
	ctx.body = res
})

//找回密码
//获取账号问题
router.get('/question/:id', async ctx=>{
	let id = ctx.params.id
	let res = await login.findOne({id}, 'question')
	if(res ==null){
		ctx.body = {
			content: '这个账号还没被注册过哦!',
			meta:{
				status:400,
				msg:'无此用户!'
			}
		}
	}else{
		ctx.body = {
			res,
			meta:{
				status:200,
				msg:'获取成功!'
			}
		}
	}
})
// 验证账号密保问题
router.post('/question/answer', async ctx =>{
	let id = ctx.request.body.account
	let answer = ctx.request.body.answer
	let res = await login.findOne({id}, 'answer')
	if(res.answer != answer){
		ctx.body = {
			content: '密保答案错了',
			meta:{
				status:400,
				msg:'答案错误'
			}
		}
	}else{
		ctx.body = {
			content: '答案正确',
			meta:{
				status:200,
				msg:'获取成功!'
			}
		}
	}
})
// 修改密码接口
router.post('/question/changepwd', async ctx =>{
	let id = ctx.request.body.account
	let password = ctx.request.body.password
	let res = await login.update({id},{password})
	if(res.n >= 1){
		//修改成功
		ctx.body = {
			content: '恭喜, 密码修改成功',
			meta:{
				status: 200,
				msg: '修改成功'
			}
		}
	}else{
		ctx.body = {
			content: '密码修改失败',
			meta:{
				status:503,
				msg: '我也不知道哪里问题',
				err: res
			}
		}
	}
})
// 获取用户头像
router.post('/question/getavatar', async ctx=>{
	let id = ctx.request.body.account
	let res = await login.findOne({id}, 'img')
	if(res == null) return false
	ctx.body = {
		res,
		meta:{
			status:200,
			msg: '获取用户头像成功'
		}
	}
})
// 获取用户在线状态
router.get('/getstatus/:id', async ctx=>{
	let id = ctx.params.id
	const res = await personal.findOne({id}, 'online')

		if(res != null){
			ctx.body = {
				online: res.online,
				meta:{
					status:200,
					msg: '成功'
				}
			}
		}else{
			ctx.body = {
				content:'获取失败',
				meta:{
					status: 400,
					msg:'失败'
				}
			}
		}
})
// 更新用户状态
router.get('/goonline/:id', async ctx=>{
	let id = ctx.params.id
	const res = await personal.updateOne({id}, {online:true})
	ctx.body = res
})
router.get('/offline/:id', async ctx=>{
	let id = ctx.params.id
	const res = await personal.updateOne({id}, {online: false})
	ctx.body = res
})

// 更新用户资料接口
router.post('/updatedata', async ctx => {
	let handle = ctx.request.body
	let data = {
		id: handle.account,
		nickname: handle.nickname,
		gender: handle.gender,
		borndate: handle.borndate,
		selfdesc: handle.setmyself,
		img: handle.img
	}
	const res = await userdata.findOne({id:data.id})
	ctx.body = ctx.request.body.account
	if(res == null){
		const t = new userdata(data)
		t.save()
	}else{
		userdata.updateOne({id:data.id}, data, err=>{
			if(err) throw err
		})
	}
	ctx.body = {
				content: '更新成功！',
				meta:{
					status:200,
					msg:'成功'
				}
			}
})
// 更新用户朋友列表
router.post('/updatefriend', async ctx => {
	let id = ctx.request.body.id
	let list = ctx.request.body.list
	let res = await personal.updateOne({id}, {$push:{friends:list}})
	ctx.body = res
})
// 获取所有已注册用户列表
router.get('/allusers', async ctx => {
	const res = await userdata.find({})
	if(res){
		ctx.body = {
		res,
		meta:{
			status:200,
			msg:'获取用户列表成功'
		}
	}
	}else{
	ctx.body = {
		content:'获取用户列表失败！',
		meta:{
			status:500,
			msg:'失败'
		}
	}
}
})
// 更新用户会话接口
router.post('/updateSession', async ctx => {
	let id = ctx.request.body.id
	let session = ctx.request.body.session
	const res = await personal.updateOne({id},{chat:session})
	ctx.body = res
})


// 按id查询用户
router.get('/checkuser/:id', async ctx => {
	let id = ctx.params.id
	const res = await userdata.findOne({id})
	if(res == null){
		ctx.body = {
			content: '改账号还未注册！',
			meta:{
				status: 400,
				msg:'无此用户'
			}
		}
	}else{
		ctx.body = {
			res,
			meta:{
				status: 200,
				msg:'查找用户成功'
			}
		}
	}
})


//其他
//获取密保问题接口
router.get('/questions', async ctx=>{
	let res = await questionlist.findById('5e8dbed9921a3d3ec4f0dbea')
	ctx.body = res


	// let res = new questionlist({
	// 	questionList: [
	// 	'这个世界上你认为最帅的人是?', 
	// 	'你最想养什么宠物?', 
	// 	'你的理想是什么呢?',
	// 	'怎么让麻雀安静下来?',
	// 	'你配偶的名字是?',
	// 	'你老妈的生日是?',
	// 	'你自己的生日是?'
	// 	]
	// })
	// res.save(err=>{
	// 	if(err) throw err
	// 	ctx.body = 'success'
	// })
})
// 获取系统通知信息和滚动通告
router.get('/getsysnotify', async ctx=>{
	let res = await notify.findOne({})
	ctx.body = res
	if(res == null){
		ctx.body = {
			content:'请求失败！',
			meta:{
				status: 400,
				msg:'fail'
			}
		}
	}else{
		ctx.body = {
			res,
			meta:{
				status: 200,
				msg:'请求成功'
			}
		}
	}
})
//上传图片接口
router.post('/upload', async ctx => {
	let imglist = []
	for(let i in ctx.request.files){
		const filetype = ctx.request.files[i].type
						.substring(ctx.request.files[i].type.lastIndexOf('/')+1)
						.toLowerCase()
		// const filepath = 'http://localhost:3000/myupload/'+parse(ctx.request.files[i].path).base
		// imglist.push(filepath)
		// ctx.body = imglist
		if(!/(gif|jpe?g|png|bmp)$/.test(filetype)){
			ctx.body = {
				content:'格式必须为图片',
				meta:{
					status:503,
					msg:'上传失败'
				}
			}
			
		}else{
			const filepath = 'http://taokanghua.cn:3004/myupload/'+parse(ctx.request.files[i].path).base
			imglist.push(filepath)
		}
	}
	ctx.body = {
				content:'上传成功',
				path: imglist,
				meta:{
					status: 200,
					msg:'上传成功'
				}
			}
})
//获取用户地点的接口
router.post('/getlocal', async ctx =>{
	let ip = ctx.request.body.ip
	let res = await axios.get('http://api.map.baidu.com/location/ip?ak=M3B9pqIiudRwvfseTW30uHSzT8DDZ3xj&ip='+ip+'&coor=bd09ll')
	// console.log(res.data)
	ctx.body = res.data
})
// 上传动态接口 （待优化）
router.post('/postdynamic', async ctx=>{
	// 待优化 处理用户头像和昵称
	let handle = ctx.request.body
	let data = {
		uniq: handle.uniq,
		id: handle.id,
		ip: handle.ip,
		name: handle.name,
		avatar: handle.avatar,
		time: handle.time,
		content: handle.content,
		personal: handle.personal,
		show: true,
		imgs: handle.imgs,
		local: handle.local,
		looknum: 0,
		comment: [],
		goods:[]
	}
	let t = new dynamic(data)
	let res  = await t.save()
	ctx.body = {
		dynamic: res,
		meta:{
			status: 200,
			msg:'成功'
		}
	}
})
// 获取动态页(只能获取没有被删除的动态)
router.get('/getdynamic', async ctx=>{
	let res = await dynamic.find({show:{$ne:false}})
	ctx.body = {
		dynamic: res,
		meta:{
			status:200,
			msg:'获取成功！'
		}
	}
})
// 删除动态接口
router.post('/deletedynamic', async ctx=>{
	let uniq = ctx.request.body.uniq
	let res = await dynamic.updateOne({uniq},{show:false})
	if(res){
		ctx.body = {
			content: '删除成功！',
			meta:{
				status:200,
				msg: 'successful'
			}
		}
	}else{
		ctx.body = {
			content: '删除失败',
			meta:{
				status:501,
				msg:'fail'
			}
		}
	}
})
// 阅览次数接口
router.get('/dynamic/:uniq', async ctx=>{
	let uniq = ctx.params.uniq
	let res = await dynamic.updateOne({uniq}, {$inc:{looknum:1}})
	ctx.body = {
		res,
		meta:{
			status:200,
			msg:'成功'
		}
	}
})
// 点赞接口
router.post('/dynamic/zan', async (ctx, next) =>{
	let uniq = ctx.request.body.uniq
	let id = ctx.request.body.id
	let name = ctx.request.body.name
	let check = await dynamic.findOne({uniq}, 'goods')
	let flag = false // 默认设置没有
	check.goods.some(item=>{
		if(item.id == id){
			ctx.body = {
				content: '你已经点过赞了！',
				meta:{
					status:502,
					msg:'fail'
				}
			}
			flag = true
			return true
		}
	})
	
	if(!flag){
	let res = await dynamic.updateOne({uniq},{$push:{goods:{id, name}}})
	ctx.body = {
		res,
		meta: {
			status:200,
			msg:'成功'
		}
	}
	}
})
//发送评论接口
router.post('/postcomment', async ctx=>{
	let handle = ctx.request.body
	let uniq = handle.uniq
	let data = {
		id: handle.id,
		name: handle.name,
		comment: handle.comment
	}
	let res = await dynamic.updateOne({uniq}, {$push:{comment:data}})
	ctx.body = {
		res,
		meta:{
			status:200,
			msg:'评论成功'
		}
	}
})

/************************************************新增后台接口***************************************************/

// 后台管理员登陆接口
router.post('/adminloginin', async ctx => {
	let name = ctx.request.body.name
	let password = ctx.request.body.password
	let res = await adminAcc.findOne({name}, 'password avatar enable')
	if(res){
		if(res.enable == false){
			ctx.body = {
				content:'此用户已经被禁用！请联系管理员处理！',
				meta:{
					status:503,
					msg:'登陆失败'
				}
			}
			return
		}
		if(res.password == password){
			// 生成token
		let payload = {
				name,
				password
			}
		const token = jwt.sign(payload, secret, {expiresIn: '6h'})
		res.password = null
		ctx.body = {
			token:'Bearer '+token,
			res,
			meta:{
				status:200,
				msg:'登录成功'
			}
		}
		}else{
			ctx.body = {
				content: '密码错误',
				meta:{
					status:503,
					msg:'fail'
				}
			}
		}
	}else{
		ctx.body = {
			content: '请联系管理员申请账号！',
			meta:{
				status: 403,
				msg:'登陆失败'
			}
		}
	}

})
// 获取管理员列表
router.get('/adminlist', async ctx =>{
	let res = await adminAcc.find({})
	if(res != []){
		ctx.body = {
			list: res,
			meta:{
				status:200,
				msg:'成功'
			}
		}
	}else{
		ctx.body = {
			content:'获取失败!',
			meta:{
				status: 501,
				msg:'失败'
			}
		}
	}
})
// 后台删除用户接口
router.get('/deleteuser/:id', async ctx => {
	let id = ctx.params.id
	let res1 = await login.deleteOne({id})
	let res2 = await userdata.deleteOne({id})
	if(res1 && res2){
		ctx.body = {
			content:'删除成功',
			meta:{
				status: 200,
				msg:'成功'
			}
		}
	}else if(res1 || res2){
		ctx.body = {
			content: '成功删除了一个',
			meta: {
				status:201,
				msg:'半成功'			}
		}
	}else{
		ctx.body = {
			content:'删除用户失败！',
			meta:{
				status: 502,
				msg:'失败'
			}
		}
	}
})
//分页接口
router.post('/getpagination', async ctx => {
	/*
		page 当前页
		size 每页显示数据条数
		total 总共 数据条数
		page 总共的页数
		display 客户端显示的页面
	 */
	let size1 = ctx.request.body.size
	let page1 = ctx.request.body.page
	let display1 = ctx.request.body.display
	ctx.body = await pagination(userdata).find().page(page1).size(size1).display(display1).exec()
})
// 根据用户名获取管理员信息接口
router.get('/getadmininfo/:name', async ctx => {
	let name = ctx.params.name
	let res = await adminAcc.findOne({name})
	if(res){
		ctx.body = {
			info: res,
			meta:{
				status:200,
				msg:'successful'
			}
		}
	}else{
		ctx.body = {
			content:'获取管理员信息失败',
			meta:{
				status:501,
				msg:'fail'
			}
		}
	}
})
// 修改管理员信息接口
router.post('/updateadmininfo', async ctx=>{
	let handle = ctx.request.body
	let data = {
		name: handle.name,
		password: handle.password,
		email: handle.email,
		phone: handle.phone
	}
	let res = await adminAcc.updateOne({name:data.name}, data)
	if(res.n == 0){
		ctx.body = {
			content:'更改管理员信息失败',
			meta:{
				status: 501,
				msg:'失败'
			}
		}
	}else{
		ctx.body = {
			content:'更改管理员信息成功！',
			meta:{
				status:200,
				msg:'成功'
			}
		}
	}
})
// 更改管理员账号状态的接口
router.post('/changestatus', async ctx =>{
	let name = ctx.request.body.name
	let sta = ctx.request.body.status
	if(name == 'admin'){
		ctx.body = {
			content: '此账号不允许禁用！',
			meta:{
				status:503,
				msg:'fail'
			}
		}
	}else{
		let res = await adminAcc.updateOne({name}, {enable:sta})
		if(res.n == 0){
			ctx.body = {
				content:'切换状态失败！',
				meta:{
					status: 501,
					msg:'失败'
				}
			}
		}else{
			ctx.body = {
				content:'切换管理员状态成功！',
				meta:{
					status: 200,
					msg:'成功'
				}
			}
		}
	}
})
// 添加管理员接口
router.post('/addadmin', async ctx=>{
	let handle = ctx.request.body
	let res = await adminAcc.findOne({name:handle.name})
	if(res){
		ctx.body = {
			content:'用户名已存在！',
			meta:{
				status: 403,
				msg:'失败'
			}
		}
	}else{
		let data = {
			name: handle.name,
			email: handle.email,
			phone: handle.phone,
			password: handle.password,
			avatar: handle.avatar || 'http://taokanghua.cn/sources/avatar/9.jpg',
			role: handle.role || '超级管理员',
			enable: true
		}
		let t = new adminAcc(data)
		let res = await t.save()
		if(res){
			ctx.body = {
				content:'添加管理员成功！',
				meta:{
					status:200,
					msg:'成功'
				}	
			}
		}else{
			ctx.body = {
				content: '保存失败！',
				meta:{
					status:501,
					msg:'失败'
				}	
			}
		}
	}
	
})
// 修改滚动标题接口
router.post('/updateNotify', async ctx =>{
	let content = ctx.request.body.content
	let res = await notify.updateOne({_id:'5e9c564b361bd51878aa9f0d'}, {scrollnotify:content})
	if(res){
		ctx.body = {
			connect:'更改滚动消息成功！',
			meta:{
				status:200,
				msg:'successful'
			}
		}
	}else{
		ctx.body = {
			connect:'更新失败!',
			meta:{
				status:500,
				msg:'fail'
			}
		}
	}
})
//测试接口：删除集合接口  开发专用
router.get('/deleteD', async ctx=>{
	dynamic.remove({show:true}, (err, res)=>{
		if(err) throw err
		ctx.body = res
	})
})
module.exports = router