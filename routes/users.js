var express = require('express');
var router = express.Router();
const User = require('../models/users.js');
require('../util/util.js')

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
			status: '10001',
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

// 查看购物车商品数量
router.get('/getCartCount', function(req, res, next) {
	if(req.cookies && req.cookies.userId) {
		let userId = req.cookies.userId;
		User.findOne({userId: userId}, function(err, doc) {
			if(err) {
				res.json({
					status: '1',
					msg: err,message,
					result: ''
				})
			} else {
				let cartList = doc.cartList;
				let cartCount = 0;
				cartList.forEach((item, index) => {
					cartCount += parseInt(item.productNum)
				})
				res.json({
					status: '0',
					msg: '',
					result: cartCount
				})
			}
	})
	}
	
})

// 删除用户购物车中商品
router.post('/cartDel', function(req, res, next) {
	let userId = req.cookies.userId;
	let productId = req.body.productId;
	console.log(`productId ${productId}`)

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
				let copyAddress;
				let copyIndex;

				let addressList = userDoc.addressList;
				addressList.forEach((item, index) => {
					if(item.addressId === addressId) {
						item.isDefault = true;
						copyAddress = item;
						copyIndex = index;
					} else {
						item.isDefault = false;
					}
				})
				
				// 使默认的地址在第一个
				// addressList.splice(copyIndex, 1);
				// addressList.unshift(copyAddress);

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

// 删除地址
router.post('/delAddress', function(req, res, next) {
	let userId = req.cookies.userId;
	let addressId = req.body.addressId;

	User.update({
		userId: userId
	}, {
		$pull: {
			'addressList': {
				'addressId': addressId
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
				msg: 'del address suc',
				result: 'del address suc'
			})
		}
	})
})

// 创建订单页面 **********************************************
// 创建订单功能
router.post('/payMent', function(req,res,next){
    // 前端传参：订单的地址id;订单最终的总金额
    var userId = req.cookies.userId,
        addressId = req.body.addressId,
        orderTotal = req.body.orderTotal;
    User.findOne({userId:userId}, function(err,doc){
        if(err){
            res.json({
                status:'1',
                msg:err.message,
                result:''
            })
        }else{
            var address = '',goodsList = [];
            // 获取当前用户的地址信息
            doc.addressList.forEach((item)=>{
                if(addressId === item.addressId){
                    address = item;
                }
            })
            // 获取当前用户的购物车的购买商品
            doc.cartList.forEach((item)=>{
                if(item.checked == '1'){
                    goodsList.push(item);
                }
            })
            console.log(goodsList)
            // doc.cartList.filter((item)=>{
            //     if(item.checked == '1'){
            //         goodsList.push(item);
            //     }
            // })

            //创建订单Id
            var platform = '622'; // 平台系统架构码
            var r1 = Math.floor(Math.random()*10);
            var r2 = Math.floor(Math.random()*10);

            var sysDate = new Date().Format('yyyyMMddhhmmss');  // 系统时间：年月日时分秒
            var orderId = platform+r1+sysDate+r2;  // 21位

            // 订单创建时间
            var createDate = new Date().Format('yyyy-MM-dd hh:mm:ss');

            // 生成订单
            var order = {
                orderId:orderId,           // 订单id
                orderTotal:orderTotal,     // 订单总金额(直接拿前端传过来的参数)
                addressInfo:address,       // 地址信息
                goodsList:goodsList,       // 购买的商品信息
                orderStatus:'1',           // 订单状态，1成功
                createDate:createDate      // 订单创建时间
            }

            // 订单信息存储到数据库
            doc.orderList.push(order);

            doc.save(function (err1,doc1) {
                if(err1){
                    res.json({
                        status:"1",
                        msg:err.message,
                        result:''
                    });
                }else{
                    // 返回订单的id和订单的总金额给前端，下一个页面要用到
                    res.json({
                        status:"0",
                        msg:'',
                        result:{
                            orderId:order.orderId,
                            orderTotal:order.orderTotal
                        }
                    });
                }
            });
        }
    })
})

// 订单成功页面 **********************************************
// 根据订单Id查询订单信息
router.get('/orderDetail', (req, res, next) => {
	let userId = req.cookies.userId;
	// let orderId = req.query.orderId;
	let orderId = req.param('orderId');
	User.findOne({userId: userId}, (err, userDoc) => {
		if(err) {
			res.json({
				status: '1',
				msg: err.message,
				result: ''
			})
		}else {
			let orderList = userDoc.orderList;
			
			if(orderList.length > 0) {
				let orderTotal = 0;
				orderList.forEach((item, index) => {
					if(item.orderId === orderId) {
						orderTotal = item.orderTotal;
					}
				});
				if(orderTotal > 0) {
					res.json({
						status: '0',
						msg: '',
						result: {
							orderId: orderId,
							orderTotal: orderTotal
						}
					})
				} else {
					res.json({
						status: '120002',
						msg: '无此订单',
						result: ''
					})
				}
			} else { 
				res.json({
                    status:'120001',
                    msg:'当前用户未创建订单',
                    result:''
                });
			}
		}
	})
})
module.exports = router;