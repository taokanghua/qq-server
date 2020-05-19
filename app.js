const Koa = require('koa');
const app = new Koa();
const server = require('http').Server(app.callback());
const io = require('socket.io')(server);
const mongoose = require('mongoose')
const bodyparser = require('koa-bodyparser')
const cors = require('koa-cors')

const static = require('koa-static')
const Body = require('koa-body')
const {join,parse} = require('path')
const port = 3002;


const personal = require('./modules/personal.js')
const chatlog = require('./modules/chatlog.js')
app.use(cors()) //处理跨域
//文件上传  这个不能放在bodyparser后面 会没用 
app.use(Body({
	multipart: true,
	formidable:{
		uploadDir: join(__dirname, '/myupload'),
		keepExtensions: true,
		maxFileSize: 20 * 1024 * 1024
	}
}))
app.use(bodyparser()) //处理post请求来的表单数据
const index = require('./routes/index.js')
app.use(index.routes())
//测试页面
// app.use(async (ctx, next) => {
//      await next();
//      ctx.response.type = 'text/html';
//      ctx.response.body = '<h1>Hello, koa2!</h1>';
//  })

app.use(static('.'))



const db = "mongodb+srv://admin:admin@kanghuat-krijr.mongodb.net/myqq?retryWrites=true&w=majority"
mongoose.connect(db, { useUnifiedTopology: true, useNewUrlParser: true })
    .then(()=>{
      console.log("mongodb connect successful!")
})

server.listen(process.env.PORT || port, () => {
     console.log(`app run at : http://127.0.0.1:${port}`);
})


// old version
/*
let chatcontent = {}
// socket
io.on('connection', socket=>{
	let userinfo = '' //用户信息 包含id和img
	let roomlist = [] //当前已加入了得房间
	let room = ''
	console.log('有小伙伴连接上来了')

	async function fn(){
		let res = await chatlog.find({})
		gethis(res)
	}
	fn()
	function gethis(res){
		// console.log(res)
		res.forEach(item=>{
			chatcontent[item.roomid] = item.content
		})
		// console.log(chatcontent)
		socket.emit('chatroom', chatcontent)
	
	// console.log(chatcontent)
	
	
	socket.on('userinfo', data=>{ //监听用户信息
		userinfo = data
	})
	socket.on('inviteRoom', data=>{ //监听邀请房间
		room = data
		// socket.join(data, ()=>{console.log('我加入了'+data+' 房间')})
		socket.broadcast.emit('inviteone', room)
		if(!roomlist.includes(room)){
			roomlist.push(room)
			// console.log(userinfo, roomlist, 'top')
			socket.join(room, ()=>{console.log(userinfo.id + ' 我加入了'+room+' 房间')})
		} 
		
	})
	socket.on('joinRoom', room=>{
		socket.emit('chatroom', chatcontent)
		
		// console.log(userinfo, roomlist)
		// socket.join(room, ()=>{console.log(userinfo.id + ' 我加入了'+room+' 房间')})
		if(!roomlist.includes(room)){
			roomlist.push(room)
			// console.log(userinfo, roomlist, 'top')
			socket.join(room, ()=>{console.log(userinfo.id + ' 我加入了'+room+' 房间')})
		} 
	})
	socket.on('sendmsg', msg=>{
		msg.room = room
		msg.time = new Date()
		io.sockets.in(room).emit('receivemsg', msg)
		if(!chatcontent[msg.room]){
			chatcontent[msg.room] = []
		}
		chatcontent[msg.room].push(msg)
		// console.log(chatcontent[msg.room])
		io.sockets.in(room).emit('chatroom', chatcontent)
	})
	socket.on('addfriend', data=>{
		// console.log(data)  //{ target: '10002', my: '10003' }
		socket.broadcast.emit('addtoo', data)
	})
	
	socket.on('disconnect', async ()=>{
		let id = userinfo.id
		personal.updateOne({id}, {online: false}, (err, res)=>{
			if(err) throw err
		})
		// ctx.body = res
		if(userinfo.id){
			// 当用户登陆后 并离线了
			console.log('有人离线了' + userinfo.id)
			// console.log(chatcontent)
			// await chatlog.deleteOne({roomid:room})
			for(let i in chatcontent){
				if(i.includes(userinfo.id)){
					//修改
					// let t = new chatlog({
					// 	roomid: i,
					// 	content: chatcontent[i]
					// })
					// t.save()
					let t = {roomid:i, content:chatcontent[i]}
					chatlog.updateOne({roomid:i},t)
					console.log('聊天记录报存成功！')
				}
			}
			// chatlog.findOne({roomid:})
		}
	})
	socket.on('discon', data=>{
		console.log('vue断开事件' + data)
	})

}// gethis end

})
*/
var allChatLog = [] //存放所有用户的聊天记录 -> 房间号:[{xx},{}....]
// new version
io.on('connection', socket => {
	let userinfo = {} //用户信息 id/avatar/nickname
	let rooms = [] //用户已经加入了的房间
	console.log('有用户链接上了')
	//该事件在contack的creted上 获取用户信息
	socket.on('sendInfo', data=>{
		userinfo = data 
	})

	//获取历史聊天记录
	socket.on('getHistroy', roomList=>{
		let d = {}
		roomList.forEach(item=>{
			allChatLog.forEach(i=>{
				if(i[item]){
					console.log('11111')
					d[item] = i[item]
				}
			})
		})
		socket.emit('history', d)
	})
	//该事件在用户点击chatpage触发
	socket.on('inviteRoom', roomid=>{
		// console.log(id)
		
		if(!rooms.includes(roomid)){
			socket.join(roomid, ()=>{console.log(userinfo.id+'加入到了:'+roomid)})
			socket.broadcast.emit('checkAndJoin', roomid)
			rooms.push(roomid)
		}
	})
	// 被加入房间
	socket.on('joinRoom', roomid=>{
		if(!rooms.includes(roomid)){
			socket.join(roomid, ()=>{console.log(userinfo.id+'加入到了:'+roomid)})
			rooms.push(roomid)
		}
	})
	// 接收消息
	socket.on('sendMsg', data=>{
		let isHave = false //默认没有此房间
		allChatLog.some(item=>{
			if(item[data.roomId]){
				//如果allChatLog里面已经有这个房间号了 就加入
				item[data.roomId].push(data)
				isHave = true
				return true
			}
		})
		if(!isHave) {//没有就直接加入到房间
			let obj = {}
			obj[data.roomId] = [data]
			allChatLog.push(obj)
		} 
		io.sockets.in(data.roomId).emit('receiveMsg', data)
	})

	socket.on('addfriend', data=>{
		// console.log(data)
		// console.log(data)  //{ target: '10002', my: '10003' }
		socket.broadcast.emit('addtoo', data)
	})

	socket.on('disconnect', ()=>{
		let id = userinfo.id
		personal.updateOne({id}, {online: false}, (err, res)=>{
			if(err) throw err
		})
		console.log(id+'已经离线了')
	})
	
})