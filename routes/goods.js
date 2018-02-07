var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
const Goods = require('../models/goods.js')
const User = require('../models/users.js');

// 连接mongodb数据库
mongoose.connect('mongodb://localhost:27017/imooc_mall')

// 连接成功
mongoose.connection.on('connected', function () {
	console.log('MongoDB connected success');
})
// 连接失败
mongoose.connection.on('error', function (error) {
	console.log('MongoDB connection error ' + error);
})
// 连接断开
mongoose.connection.on('disconnected', function () {
	console.log('MongoDB connection disconnected');
})

// ******* 查询商品列表 ********
router.get('/list', function(req, res, next) {
	// 从网址url中获取相关参数
	let page = parseInt(req.query.page); // 第几页
	let pageSize = parseInt(req.query.pageSize); // 一页几个商品数据
	let sort = req.query.sort; // 升or降序排序
	let skip = (page-1)*pageSize;
	let priceLevel = req.query.priceLevel; // 价格区间

	let param = {};
	let priceGt='',priceLte='';
	// 条件查询
	if(priceLevel !== 'all') {
		switch(priceLevel) {
			case '0': priceGt = 0;priceLte = 100; break;
			case '1': priceGt = 100;priceLte = 500; break;
			case '2': priceGt = 500;priceLte = 1000; break;
			case '3': priceGt = 1000;priceLte = 2000; break;
		}

		param = {
			'salePrice': {
				$gt: priceGt,
				$lte: priceLte
			}
		}
	}

	console.log(`routes/goods.js 51: page:${page}, pageSize:${pageSize}, sort: ${sort}, priceLevel: ${priceLevel}, priceGt-priceLte: ${priceGt}-${priceLte}`)

	// 当查询时同时使用sort,skip,limit，无论位置先后，执行顺序sort再skip再limit。
	let goodsModel = Goods.find(param).skip(skip).limit(pageSize);
	goodsModel.sort({'salePrice': sort});
	

	goodsModel.exec(function (err, doc) {
		if(err) {
			res.json({
				status: '1',
				msg: err.message
			})
		} else {
			res.json({
				status: '0',
				msg: '成功接收到客户端的get请求',
				result: {
					count: doc.length,
					list: doc
				}
			})
			// console.log(doc)
		}
	})
});
// *******end 查询商品列表 end********

// ******* 加入到购物车 ********
router.post('/addCart', function(req, res) {
	// const userId = '100000077';
	let userId = req.cookies.userId || '';
	// 从req中取productId参数（post和get取参数方式不同）
	let productId = req.body.productId;

	User.findOne({userId: userId}, function(err, userDoc) {
		if(err) {
			res.json({
				status: '1',
				msg: err.message
			})
		} else {
			// console.log(`代码第100行, userDoc: `, userDoc);
			if(userDoc) {
				let goodItem = false; // 用于标识前端点击添加的商品数据库cartList中是否存在
				userDoc.cartList.forEach((item) => {
					if(item.productId === productId) {
						// 数据库cartList中的此商品的productNum+1
						item.productNum++;
						goodItem = true;
					}
				})

				// 前端点击添加的商品数据库cartList中已经存在
				if(goodItem) {
					// 更新并保存数据库cartList
					userDoc.save(function (errSave, doc2) {
								if(errSave) {
									res.json({
										status: '1',
										msg: errSave.message
									})
								} else {
									console.log("用户购物车中已经存在此商品，购物车中此商品数量将+1")
									res.json({
										status: '0',
										msg: '用户购物车中已经存在此商品，购物车中此商品数量将+1',
										result: ''
									})
								}
							})
				} else { // 前端点击添加的商品数据库cartList中并不存在
					// 在数据库goods表中查找此productId的商品
					Goods.findOne({productId: productId}, function (err, goodDoc) {
					if(err) {
						res.json({
							status: '1',
							msg: err.message
						})
					} else {
						// 插入此物品到用户购物车列表
						if(goodDoc) {
							console.log('routes/goods.js 第111行，goodDoc: ', goodDoc)
							goodDoc.productNum = 1;
							goodDoc.checked = 1;
							userDoc.cartList.push(goodDoc);
							userDoc.save(function (errSave, doc2) {
								if(errSave) {
									res.json({
										status: '1',
										msg: errSave.message
									})
								} else {
									console.log("将商品添加到用户购物车数据库成功")
									res.json({
										status: '0',
										msg: '将商品添加到用户购物车数据库成功',
										result: ''
									})
								}
							})
							
						}
					}
				})
				}
				
			}
		}
	})
})
// *******end 加入到购物车 end********

module.exports = router;