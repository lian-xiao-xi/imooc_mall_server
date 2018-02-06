var express = require('express');
var router = express.Router();
const User = require('../models/users.js');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('这里是 users router');
});


// 登录接口
router.post('/login', function(req, res, next) {
	let param = {
		userName: req.body.userName,
		userPwd: req.body.userPwd
	}
	console.log(`routes/users.js 15:，userName: ${param.userName}, userPwd: ${param.userPwd}`)

	User.findOne(param, function(err, doc) {
		if(err) {
			res.json({
				status: '1',
				msg: err.message
			})
		} else {
			if(doc) {
				console.log('routes/users.js 25: 在数据库中找到了此userName和userPwd')
				// 向客户端存储cookie
				res.cookie('userId', doc.userId, {
					path: '/',
					maxAge: 1000*60*60 // 一个小时
				})
				res.cookie('userName', doc.userName, {
					path: '/',
					maxAge: 1000*60*60 // 一个小时
				})
				// 向服务端写session
				// req.session.user = doc;

				res.json({
					status: '0',
					msg: '账号密码正确',
					result: {
						userName: doc.userName
					}
				})
			}
			
		}
	})
})


// 登出接口
router.post('/logout', function(req, res, next) {
	res.clearCookie('userId', {
		path: '/',
		maxAge: 0
	})
	res.clearCookie('userName', {
		path: '/',
		maxAge: 0
	})
	res.json({
		status: '0',
		msg: '',
		result: ''
	})
})

// 校验
router.get('/checkLogin', function(req, res, next) {
	if(req.cookies.userId) { // 已登录
		res.json({
			status: '0',
			msg: '',
			result: req.cookies.userName
		})
	} else { // 未登录
		res.json({
			status: '1',
			msg: '未登录',
			result: ''
		})
	}
})

module.exports = router;
