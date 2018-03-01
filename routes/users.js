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
		if (err) {
			res.json({
				status: '1',
				msg: err.message
			})
		} else {
			if (doc) { // 数据库中存在此用户
				console.log('routes/users.js 25: 在数据库中找到了此userName和userPwd')
				// 向客户端存储cookie
				res.cookie('userId', doc.userId, {
					path: '/',
					maxAge: 1000 * 60 * 60 // 一个小时
				})
				res.cookie('userName', doc.userName, {
					path: '/',
					maxAge: 1000 * 60 * 60 // 一个小时
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
			} else { // 数据库中不存在此用户
				res.json({
					status: '1',
					msg: '数据库中不存在此用户',
					result: ''
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

// 登录校验
router.get('/checkLogin', function(req, res, next) {
	if (req.cookies.userId) { // 已登录
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

// 当前用户购物车商品数据接口
router.get('/cartList', function(req, res, next) {
	let userId = req.cookies.userId;
	User.findOne({
		userId: userId
	}, function(err, doc) {
		if (err) {
			res.json({
				status: '1',
				msg: err.message
			})
		} else {
			if (doc) {
				res.json({
					status: '0',
					msg: '',
					result: doc.cartList

				})
			}
		}
	})
})

// 删除用户购物车中商品
router.post('/cartDel', function(req, res, next) {
	let userId = req.cookies.userId;
	let productId = req.body.productId;

	User.update({
		userId: userId
	}, {
		$pull: {
			'cartList': {
				'productId': productId
			}
		}
	}, function(err, doc) {
		if (err) {
			res.json({
				status: '1',
				msg: err.message,
				result: ''
			})
		} else {
			res.json({
				status: '0',
				msg: 'suc',
				result: 'suc'
			})
		}
	})

})

// 修改用户购物车中商品的数量和是否选中
router.post('/cartEdit', function(req, res, next) {
	let userId = req.cookies.userId;
	let productId = req.body.productId;
	let productNum = req.body.productNum;
	let checked = req.body.checked;

	User.update({
		'userId': userId,
		'cartList.productId': productId
	}, {
		'cartList.$.productNum': productNum,
		'cartList.$.checked': checked,
	}, function(err, doc) {
		if (err) {
			res.json({
				status: '1',
				msg: err.message,
				result: ''
			})
		} else {
			res.json({
				status: '0',
				msg: 'suc',
				result: 'suc'
			})
		}
	})
})

// 购物车商品全选
router.post('/editCheckAll', function(req, res, next) {
	let userId = req.cookies.userId;
	let checkAll = req.body.checkAll ? '1' : '0';

	// 批量更新
	User.findOne({
		userId: userId
	}, function(err, userDoc) {
		if (err) {
			res.json({
				status: '1',
				msg: err.message,
				result: ''
			})
		} else {
			if (userDoc) {
				userDoc.cartList.forEach((item, index) => {
					item.checked = checkAll;
				})
				userDoc.save((err1, doc) => {
					if (err1) {
						res.json({
							status: '1',
							msg: err1.message,
							result: ''
						})
					} else {
						res.json({
							status: '0',
							msg: 'suc',
							result: 'suc'
						})
					}
				})

			}

		}
	})
})

// 查询用户地址接口
router.get('/addressList', function(req, res, next) {
	let userId = req.cookies.userId;
	User.findOne({userId: userId}, function(err, doc) {
		if(err) {
			res.json({
				status: '1',
				msg: err.message
			})
		} else {
			if(doc) {
				res.json({
					status: '0',
					msg: '',
					result: doc.addressList
				})
			}
		}
	})
})

router.post('/setDefault', function(req, res, next) {
	let userId = req.cookies.userId;
	let addressId = req.body.addressId;
	if(!addressId) {
		res.json({
				status: '1003',
				msg: '没有向后端传递 addressId 的数据'
			});
		return;
	}
	User.findOne({userId: userId}, function(err, userDoc) {
		if(err) {
			res.json({
				status: '1',
				msg: err.message
			})
		} else {
			if(userDoc) {
				let addressList = userDoc.addressList;
				addressList.forEach((item) => {
					if(item.addressId === addressId) {
						item.isDefault = true;
					} else {
						item.isDefault = false;
					}
				})

				userDoc.save((err1, doc) => {
					if(err1) {
						res.json({
				status: '1',
				msg: err.message
			})
					} else {
						res.json({
							status: '0',
							msg: '设置默认地址成功',
							result: '设置默认地址成功'
						})
					}
				})
			}
		}
	})
})

module.exports = router;