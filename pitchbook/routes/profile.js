var fs = require("fs");
var easyimg = require('easyimage');
var async = require("async");
var mkdirp = require('mkdirp');
var crypto = require('crypto');
var emailTemplates = require('email-templates');
var path = require('path');
var _und = require('../utilities/underscore.min.js');
var DisListNum = 20; // Number of discussions per page on discussionList
var searchPerPage = 20;
var usersPerPage = 10;
var chatPerPage = 20;
var notiPerPage = 30;

exports.home = function(User,Activity,Chat){
	return function(req, res){
		var user_id = req.user._id;
		var stocks_array = req.user.watch_list;
		var subscribe_to_arr = req.user.subscribe_to;
		User.find({_id:{$ne:req.user._id, $nin:subscribe_to_arr}}).sort('-_id').limit(5).exec(function(err_user, users){
			Activity.find({$or:[{user_id : {$in :subscribe_to_arr}},{user_id:req.user._id}]}).sort('-time_stamp').limit(20).exec(function(err_post,activities){
		  		 activities = shareFavLikeUpdate(user_id,activities);
		  		 User.find({_id:{$in:subscribe_to_arr}},function(err,subscribe_to_users){
		  		 	res.render('home',{user:req.user, activities:activities, stocks:JSON.stringify(stocks_array), other_users:JSON.stringify(users),subscribe_to:JSON.stringify(subscribe_to_users)});
		  		 });
			}); 
		});
	}
}

exports.getNewUsers = function(User)
{
	return function(req,res){
		User.count({},function(err,count){
			var rand = Math.floor(count * Math.random());
			User.find({_id:{$ne:req.user._id, $nin:req.user.subscribe_to}}).sort("-_id").skip(rand).limit(5).exec(function(err,_users){
				if(err){console.log(err)}
				else{
					res.send(_users);
				}
			});
		});
	}
}

exports.scrollLoad = function(Activity){
	return function(req,res){
		var user_id = req.user._id;
		var subscribe_to_arr = req.user.subscribe_to;
		var lastTimeStamp = req.body.lastTimeStamp;
		Activity.find({time_stamp:{$lt:new Date(lastTimeStamp)},$or:[{owner_id : {$in :subscribe_to_arr}},{owner_id:req.user._id}]}).sort('-time_stamp').limit(20).exec(function(err_post,activities){
			if (err_post) {
				console.log(err_post);
			}
			activities = shareFavLikeUpdate(user_id,activities);
			for(var i in activities){
				activities[i].post.body = processMsg(activities[i].post.body);
			} 
			res.send(activities);
		});
	}
}

exports.account = function(Activity,User){
	return function(req,res){
			var stocks_array = req.user.watch_list;
			Activity.find({user_id : req.user._id}).sort('-_id').exec(function(err_act,activities){
				for (var i in activities)
				{
					activities[i].post.body = processMsg(activities[i].post.body);
				}
				User.find({_id:{$in:req.user.subscribe_to}},function(err,subscribe_to_users){
					res.render('account',{user:req.user,type:"self",stocks:stocks_array,activities:activities,subscribe_to:JSON.stringify(subscribe_to_users)});
				});
			});
		}
}

exports.user = function(User,Activity){
	return function(req,res)
	{
		var postPerPage = 10;
		var uid = req.query.id;
		var p = req.query.p;
		if(p == undefined || p < 0)
		{
			p = 1;
		}

		if (uid == req.user._id || uid == undefined)
		{
			return res.redirect("/account");
		}

		User.find({_id:uid},function(err,_user){
			var stocks_array = _user[0].watch_list;
			Activity.find({user_id:uid}).sort("-_id").skip((p-1) * postPerPage).limit(postPerPage).exec(function(err,acts){
				for (var i in acts)
				{
					acts[i].post.body = processMsg(acts[i].post.body);
				}
				User.find({_id:{$in:req.user.subscribe_to}},function(err,subscribe_to_users){
					res.render('user',{user:_user[0],page:p,type:"others",stocks:stocks_array,activities:acts,subscribe_to:JSON.stringify(subscribe_to_users)});
				});
			});
		});
	}
}

exports.commentHandler = function(Activity,Notification,clients,io){
	return function(req,res){
		var c = req.body.cmt;
		var uid = req.user._id;
		var aid = req.body.activity_id;

		if(c.length > 0 ){
			Activity.findOneAndUpdate({_id:aid},  //update the post directly
									{$push:
											{"post.comments":{body:c,
															  time_stamp:new Date(),
															  owner_id:req.user._id,
															  owner_fn:req.user.fn,
															  owner_image_dir_resized:req.user.image_dir_resized
															}
											}
									},function(err,act){
										var n_activity = new Activity({user_id:req.user._id,  //create a new 'comment' activity
																		   user_fn:req.user.fn,
																		   type:"comment",
																		   post:JSON.parse(JSON.stringify(act.post)),
																		   time_stamp:new Date(),
																		   origin_user_fn:act.origin_user_fn,
																		   origin_user_id:act.origin_user_id,
																		   origin_act_id:act.origin_act_id,
																		   user_image_dir_resized:req.user.image_dir_resized,
																		   popularity:0
																		});
										n_activity.save(function(err,_act,numberAffected){
												var n_notification = new Notification({   //create a notification
																			user_id:act.origin_user_id,
																			remote_user_id:req.user._id,
																			remote_user_fn:req.user.fn,
																			type:"comment",
																			activity_id:act.origin_act_id,
																			read:false,
																			time_stamp:new Date()
													});
												n_notification.save(function(err,notification,numberAffected){  
													if (aid !=act.origin_act_id){  //if the activity is shared update the original one as well.
														Activity.findOneAndUpdate({_id:act.origin_act_id},{$push:
																{"post.comments":{body:c,
																				  time_stamp:new Date(),
																				  owner_id:req.user._id,
																				  owner_fn:req.user.fn,
																				  owner_image_dir_resized:req.user.image_dir_resized
																				}
																}
															},function(err,old_act){
																io.sockets.socket(clients[act.origin_user_id]).emit("notification");
																res.send(act);
															});
													}else{
														io.sockets.socket(clients[act.origin_user_id]).emit("notification");
														res.send(act);
													}
												});			
										});	
								});
		}
	}
}

exports.msgHandler = function(Activity,User,io,clients){
	return function(req,res){
		var followers = req.user.followed_by;
		var _msg = req.body.msg;
		if(_msg.length > 0 ){
			var n_activity = new Activity({user_id:req.user._id,
											user_fn:req.user.fn,
											origin_user_id:req.user._id,
											origin_user_fn:req.user.fn,
											type:req.body.type,
											stock:req.body.stock,
											post:{body:req.body.msg},
											time_stamp:new Date(),
											user_image_dir_resized:req.user.image_dir_resized,
											popularity:0
										});
			n_activity.save(function (err, activity, numberAffected) {
	  			if (err)
	  			{
	  				console.log(err);
	  			}else{
	  				Activity.findOneAndUpdate({_id:activity._id},{origin_act_id:activity._id},function(err,activity){
	  					if(err){console.log(err)}
	  					else{
							activity.post.body = processMsg(activity.post.body);
							for(var i = 0;i<followers.length;i++)
							{
								io.sockets.socket(clients[followers[i]]).emit("news", activity);
							}
							res.send(activity);
						    res.end;
					   	}
	  				});
	  			}
	  		});
	  	}
	}
}

exports.addStock = function(User,Activity,io,clients,Stock){
	return function(req,res){
		var followers = req.user.followed_by;
		var symbol = req.body.stock;
		if(symbol.length > 0){
			symbol = symbol.toUpperCase();
			User.findOneAndUpdate({_id:req.user._id},{$push:{watch_list:symbol}}, function(err,user){
				if(err){
					console.log("gets and error");
				}else{
					Stock.findOneAndUpdate({symbol:symbol},{$inc:{count:1}},{upsert:true},function(err,stock){
						var n_activity = new Activity({type:"add_stock",
												   stock:req.body.stock,
												   time_stamp:new Date(),
												   user_id:req.user._id,
												   user_fn:req.user.fn,
												   user_image_dir_resized:req.user.image_dir_resized,
												   popularity:0
												});
						n_activity.save(function(err,activity,numberAffected){
							for(var i = 0;i<followers.length;i++)
		  					{
								io.sockets.socket(clients[followers[i]]).emit("news", activity);
		  					}
		  					io.sockets.socket(clients[req.user._id]).emit("news", activity);
						});
					});
				}
			});
		};
	}
}

exports.deleteStock = function(User,Activity,io,clients,Stock){
	return function(req,res){
		var followers = req.user.followed_by;
		var symbol = req.body.stock;
		User.findOneAndUpdate({_id:req.user._id, watch_list:symbol},{$pull:{watch_list:symbol}}, function(err,user){
			if(err){
				console.log("gets and error");
			}else if(user != undefined){
				Stock.findOneAndUpdate({symbol:symbol},{$inc:{count:-1}},{upsert:false},function(err,stock){
					if(err){console.log(err)}
					else{
						var n_activity = new Activity({type:"delete_stock",
												stock:req.body.stock,
												time_stamp:new Date(),
												user_id:req.user._id,
												user_fn:req.user.fn,
												user_image_dir_resized:req.user.image_dir_resized,
												popularity:0
											});
						n_activity.save(function(err,activity,numberAffected){
							for(var i = 0;i<followers.length;i++)
		  					{
								io.sockets.socket(clients[followers[i]]).emit("news", activity);
		  					}
		  					io.sockets.socket(clients[req.user._id]).emit("news", activity);
							res.send("deletion_success");
						});
					}
				})
			}
		});
	};
};

exports.getNews = function(http){
	console.log("getting news");
	return function(req,res){
		var options = {
			  hostname:'feeds.finance.yahoo.com',
			  port: 80,
			  path: '/rss/2.0/headline?s=yhoo&region=US&lang=en-US',
			  method: 'GET'
		};
		var _req = http.request(options, function(_res) {
		  console.log('STATUS: ' + res.statusCode);
		  console.log('HEADERS: ' + JSON.stringify(res.headers));
		  _res.setEncoding('utf8');
		  var data = "";
		  _res.on('data', function (chunk) {
		    console.log('BODY: ' + chunk);
		    data += chunk;
		  }).on('end',function(){
		  	res.send(data);
		  });
		});

		_req.on('error', function(e) {
		  console.log('problem with request: ' + e.message);
		});

		// write data to request body
		_req.write('data\n');
		_req.write('data\n');
		_req.end();
	}
}

exports.getChartData = function(http){
	return function(req,res){
		var symbol = req.body.symbol;
		console.log("Symbol " + symbol);
		getHisData(symbol,http,function(out_array){
		
			res.send(JSON.stringify(out_array));
		})
	}
}

exports.editInfo = function(req,res){
	if (!req.user)
	{
		res.writeHead(302, {
		'Location': '/'
		});
		res.end();
		return;
	}
	res.render("editInfo",{user:req.user});
}

exports.updateInfo = function(User){
	return function(req,res)
	{	
		var _name = req.body.name;
		var _abt = req.body.abt;
		if (_name.length > 0 ){
			User.findOneAndUpdate({_id:req.user._id},{fn:_name,abt:_abt},function(err,user){	
				if(err){
					console.log(err);
				}else{
					res.send(user);
				}
			})
		}
	}
}

exports.imageUpload = function(User){
	return function(req,res){  // for profile pic only
		if(req.files.image != undefined){
			var fileObj = req.files.image;
			var resizeHeight = 300;
			var resizeWidth = 300;
			var allowedTypes = ["png","jpeg","jpg"];
			var time_stamp = new Date();
			var user_id = req.user._id;
			var fTypeArr = fileObj.type.split("/");
			var fileType = fTypeArr[fTypeArr.length-1];
			if (allowedTypes.indexOf(fileType) != -1){
				var originFileName = user_id + time_stamp + "_origin_." + fileType;
				var resizedFileName = user_id + time_stamp + "_resized_." + fileType;
				var userDir = __dirname + "/../public/uploads/" + user_id;
				var newPath = userDir + "/" + originFileName;
				var resizePath = userDir + "/" + resizedFileName;
				mkdirp(userDir,function(err){
					fs.readFile(fileObj.path,function(err, data){
						  var path = {};
						  path.resizedPicPath = "/uploads/" + user_id + "/" + resizedFileName;
						  path.originPicPath = "/uploads/"+ user_id + "/" + originFileName;
						  fs.writeFile(newPath, data, function (err) {
							    if (err){
								    console.log("error !");
								    console.log(err);
								}else{
							   		easyimg.resize({src:newPath, dst:resizePath, width:resizeWidth, height:resizeHeight}, function(err, image) {
								        if (err) console.log(err);
								        res.send(path);
									});	
								}
						  });
					});
				});
			}
		}
	}
}

exports.proPicUpload = function(User){
	return function(req,res){
		if (req.files.file != undefined){
			var fileObj = req.files.file;
			var resizeHeight = 100;
			var resizeWidth = 100;
			var time_stamp = "";
			var allowedTypes = ["png","jpeg","jpg"];
			var user_id = req.user._id;
			var fTypeArr = fileObj.type.split("/");
			var fileType = fTypeArr[fTypeArr.length-1];
			if (allowedTypes.indexOf(fileType) != -1){
				var originFileName = user_id + "profile_origin_." + fileType;
				var resizedFileName = user_id + "profile_resized_." + fileType;
				var userDir = __dirname + "/../public/uploads/" + user_id;
				var newPath = userDir + "/" + originFileName;
				var resizePath = userDir + "/" + resizedFileName;
				mkdirp(userDir,function(err){
					if(err){console.log("err making dir " + err)};
					fs.readFile(fileObj.path,function(err, data){
						  var path = {};
						  path.resizedPicPath = "/uploads/" + user_id + "/" + resizedFileName;
						  path.originPicPath = "/uploads/" + user_id + "/" + originFileName;
						  fs.writeFile(newPath, data, function (err) {
							    if (err){
								    console.log("error !");
								    console.log(err);
								}else{
								   	console.log("success, resizing image");
								   	User.findOneAndUpdate({_id:req.user._id},{image_dir_resized:path.resizedPicPath,image_dir_original:path.originPicPath},function(err,user){
								   		easyimg.resize({src:newPath, dst:resizePath, width:resizeWidth, height:resizeHeight}, function(err, image) {
									        if (err) console.log(err);
									        res.send(path);
										});
								   	});	
								}
						  });
					});
				});
			}
		}
	}
}

exports.addFollower = function(User,Activity){
	return function(req,res){
		var userId = req.user._id;
		var userFollowId = req.body.toFollowId; 
		User.find({_id:userId,subscribe_to:userFollowId}).count(function(err,count){
			if ( count == 0){ 
				User.findOneAndUpdate({_id:userId},{$push:{subscribe_to:userFollowId}},function(err,user){
					if(err){console.log("local user err " + err)}
					else{
						User.findOneAndUpdate({_id:userFollowId},{$push:{followed_by:userId}},function(_err,_user){
							if(_err){console.log("remote user err " + _err)}
							else{
								var n_activity = new Activity({type:"follow",
															   followed_user:{followed_user_id:_user._id,followed_user_fn:_user.fn},
															   time_stamp:new Date(),
															   user_id:req.user._id,
															   user_fn:req.user.fn
															});
								n_activity.save(function(err,activity,numberAffected){
									res.send(activity);
								});
							}
						});
					}
				});	
			}else{
				console.log("Count" + count);
			}	
		});
	}
}

exports.unfollow = function(User){
	return function(req,res){
		var userId = req.user._id;
		var unFollowId = req.body.unFollowId;
		console.log("unFollowId");
		console.log(unFollowId);
		User.findOneAndUpdate({_id:userId},{$pull:{subscribe_to:unFollowId}},function(err,user){
			if(err){console.log(err)}
			if(user){
				res.send("success");
			}else{
				res.send("failure");
			}
		});
	}
}

exports.suggest = function(User,Activity){
	console.log("calling search");
	return function(req,res){
		var qArr = req.query.q;
		var reg = getSearchReg(qArr);
		User.find({fn:{$regex:reg}}).limit(5).exec(function(user_err,_users){
			if(user_err)console.log(user_err);
			else{
				Activity.find({"post.body":{$regex:reg}}).sort("-time_stamp").limit(5).exec(function(post_err,_activities){
					if(post_err)console.log(post_err);
					else{
						var result = {
								users:_users,
								activities:_activities
										}
						res.send(result);
					}
				})
			}
		})
	}
}

exports.search = function(User,Activity,Discussion)
{
	return function(req,res){
		var s = req.query.q;
		var type = req.query.t;
		var currPage = req.query.p;
		var good_types = ["activities","users"];
		if(good_types.indexOf(type) == -1){
			type = "activities";
		}

		console.log("pos 1");
		if(s == undefined)
		{
			s = "";
		}
		console.log("pos 2");
		if(currPage == undefined || currPage < 0)
		{
			currPage = 1;
		}
		var qArr = s.split(" ");
		var reg = getSearchReg(qArr);
		switch(type){
			case "activities":
				var query = {"post.body":{$regex:reg},$or:[{type:"publish"},{type:"pitch"}]};
				Activity.count(query,function(err,count){
					var numPage = Math.ceil(count/searchPerPage);
					console.log("act numPage " + numPage);
					Activity.find(query).sort("-popularity -_id").skip((currPage-1)*searchPerPage).limit(searchPerPage).exec(function(err,activities){
						if(err){console.log(err)}
						else{
							console.log("type activities");
							User.find({_id:{$in:req.user.subscribe_to}},function(err,subscribe_to_users){
								res.render("search",{user:req.user,
												 type:"activities",
												 activities:activities,
												 subscribe_to:JSON.stringify(subscribe_to_users), 
												 pageData:{query:s,
												 		   end:numPage,
												 		   url:"/search",
												 		   searchtype:type,
												 		   current:currPage}
												 }
									 );
							});
						}
					});
				});
				break;
			case "users":
				var query = {fn:{$regex:reg},_id:{$ne:req.user._id}};
				User.count(query,function(err,count){
					var numPage = Math.ceil(count/searchPerPage);
					console.log("user numPage " + numPage);
					User.find(query).sort("-popularity -_id").skip((currPage-1) * searchPerPage).limit(searchPerPage).exec(function(err,_users){
						if(err){console.log(err)}
						else{
							console.log("user");
							console.log(_users);
							_users = markFollowedUsers(_users,req.user.subscribe_to);
							User.find({_id:{$in:req.user.subscribe_to}},function(err,subscribe_to_users){
								res.render("search",{user:req.user, 
													type:"users", 
													users:_users,
													subscribe_to:JSON.stringify(subscribe_to_users),
													pageData:{query:s,
															  url:"/search",
															  end:numPage,
															  searchtype:type,
															  current:currPage}
													}
										  );
							});
						}
					});
				});	
				break;
		}
	}
}


exports.stock = function(Activity){
	return function(req,res){
		var _ticker = req.query.t;
		var patt = ".*" + _ticker + ".*";
		var reg = new RegExp(patt,"gi");
		Activity.find({"post.body":{$regex:reg}},function(err,activities){
			if(err){console.log(err)}
			else{
				res.render("stock",{user:req.user,ticker:_ticker,activities:JSON.stringify(activities),subscribe_to:JSON.stringify(req.user.subscribe_to)});
			}
		});
	}
}

exports.sharePost = function(Activity,User,Notification,io,clients){
	return function(req,res){
		var act_id = req.body.activity_id;
		Activity.find({_id:act_id},function(err,act){  //the activity that is shared
			Activity.find({_id:act[0].origin_act_id,shared_by:req.user._id},function(err,activities){ // original activity that is shared check the original activity has already been shared
				console.log("shared activities " + activities);
				if(activities.length == 0){
					User.findOneAndUpdate({_id:act[0].origin_user_id},{$inc:{popularity:5}},function(err,user){
						var n_activity = new Activity({type:"share",
													   post:JSON.parse(JSON.stringify(act[0].post)),
													   time_stamp:new Date(),
													   user_id:req.user._id,
													   user_fn:req.user.fn,
													   origin_user_id:act[0].origin_user_id,
													   origin_user_fn:act[0].origin_user_fn,
													   origin_act_id:act[0].origin_act_id,
													   user_image_dir_resized:req.user.image_dir_resized,
													   popularity:0
													});
						n_activity.save(function(err,activity,numberAffected){
							if (err){console.log(err)}
							else{
								Activity.findOneAndUpdate({_id:act[0].origin_act_id},{$push:{shared_by:req.user._id},$inc:{popularity:1}},function(err,_activity){
									var n_notification = new Notification({
											user_id:act[0].origin_user_id,
											remote_user_id:req.user._id,
											remote_user_fn:req.user.fn,
											type:"share",
											activity_id:act[0].origin_act_id,
											read:false,
											time_stamp:new Date()
									});
									n_notification.save(function(err,notification){
										var rep_update = {type:"rep_up",amount:5};
										console.log("sending notification to socket " + clients[user._id]);
										io.sockets.socket(clients[user._id]).emit("rep_update",rep_update);
										io.sockets.socket(clients[user._id]).emit("notification");
										res.send(activity);
									});
								});
							}
						});
					});
				}
			});
		});
	}
}

exports.like = function(Activity,User,Notification,io,clients){
	return function(req,res){
		var act_id = req.body.activity_id;
		Activity.find({_id:act_id}, function(err,act){
			if (err){console.log(err)}
			Activity.find({_id:act[0].origin_act_id,liked_by:req.user._id},function(err,activities){
				console.log("activities liked " + activities);
				if(activities.length == 0){
					 User.findOneAndUpdate({_id:act[0].origin_user_id},{$inc:{popularity:5}},function(err,user){
						if (err){console.log(err)}
						var n_activity = new Activity({type:"like",
													   post:JSON.parse(JSON.stringify(act[0].post)),
													   time_stamp:new Date(),
													   user_id:req.user._id,
													   user_fn:req.user.fn,
													   origin_user_id:act[0].origin_user_id,
													   origin_user_fn:act[0].origin_user_fn,
													   origin_act_id:act[0].origin_act_id,
													   user_image_dir_resized:req.user.image_dir_resized,
													   popularity:0
													});
						n_activity.save(function(err,activity,numberAffected){
							Activity.findOneAndUpdate({_id:act[0].origin_act_id},{$push:{liked_by:req.user._id},$inc:{popularity:1}},function(err,activity){
								var n_notification = new Notification({
										user_id:act[0].origin_user_id,
										remote_user_id:req.user._id,
										remote_user_fn:req.user.fn,
										type:"like",
										activity_id:act[0].origin_act_id,
										read:false,
										time_stamp:new Date()
								});
								n_notification.save(function(err,notification){
									var rep_update = {type:"rep_up",amount:5};
									console.log("sending notification to socket " + clients[user._id]);
									io.sockets.socket(clients[user._id]).emit("rep_update",rep_update);
									io.sockets.socket(clients[user._id]).emit("notification");
									res.send(activity);
								});
							});
						});
					});
				}
			})
			
		});
	}
}

exports.fav = function(Activity,User)
{
	return function(req,res)
	{
		var id = req.user._id;
		Activity.find({user_id:req.user._id,type:"fav",time_stamp:{$lt:new Date()}}).sort("-time_stamp").limit(15).exec(function(err,_activities){
			User.find({_id:req.user._id},function(err,subscribe_to_users){
				res.render("fav",{user:req.user,activities:_activities,subscribe_to:JSON.stringify(subscribe_to_users)});
			});
		})
	}
}

exports.addFav = function(Activity,User,Notification,io,clients,_type){
	return function(req,res){
		var act_id = req.body.activity_id;
		Activity.find({_id:act_id}, function(err,act){
			if (err){console.log(err)}
			Activity.find({_id:act[0].origin_act_id,addFav_by:req.user._id},function(err,activities){
				console.log("activities fav " + activities);
				if(activities.length == 0){
					 User.findOneAndUpdate({_id:act[0].origin_user_id},{$inc:{popularity:15}},function(err,user){
						if (err){console.log(err)}
						var n_activity = new Activity({type:"fav",
													   post:JSON.parse(JSON.stringify(act[0].post)),
													   time_stamp:new Date(),
													   user_id:req.user._id,
													   user_fn:req.user.fn,
													   origin_user_id:act[0].origin_user_id,
													   origin_user_fn:act[0].origin_user_fn,
													   origin_act_id:act[0].origin_act_id,
													   user_image_dir_resized:req.user.image_dir_resized,
													   popularity:0
													});
						n_activity.save(function(err,activity,numberAffected){
							Activity.findOneAndUpdate({_id:act[0].origin_act_id},{$push:{addFav_by:req.user._id},$inc:{popularity:1}},function(err,activity){
								var n_notification = new Notification({
										user_id:act[0].origin_user_id,
										remote_user_id:req.user._id,
										remote_user_fn:req.user.fn,
										type:"fav",
										activity_id:act[0].origin_act_id,
										read:false,
										time_stamp:new Date()
								});
								n_notification.save(function(err,notification){
									var rep_update = {type:"rep_up",amount:15};
									console.log("sending notification to socket " + clients[user._id]);
									io.sockets.socket(clients[user._id]).emit("rep_update",rep_update);
									io.sockets.socket(clients[user._id]).emit("notification");
									res.send(activity);
								});
							});
						});
					});
				}
			})
			
		});
	}
}


exports.chatHandler = function(User,Chat,clients,io){
	return function(req,res){
		var _body = req.body.chatContent;
		var _toId = req.body.toId;
		var _toFn = req.body.toFn;
		User.find({_id:_toId},function(err,toUser){
			if(err){console.log(err)}
			else{
				Chat.findOneAndUpdate({sendId:_toId,receiveId:req.user._id,read:false},{read:true},{upsert:false,multi:true},function(err){
					var n_chat = new Chat({sendId:req.user._id,
											sendFn:req.user.fn,
											send_image_dir:req.user.image_dir_resized,
											receiveId:_toId,
											receiveFn:_toFn,
											receive_image_dir:toUser[0].image_dir_resized,
											body:_body,
											time_stamp:new Date(),
											read:false});
					n_chat.save(function(err,chat){
						if(err){console.log(err)}
						else{
							io.sockets.socket(clients[_toId]).emit("chat", chat);
							res.send(chat);
						}
					});
				});
			}
		});
		
	}
}

exports.loadChat = function(Chat,io,clients){
	return function(req,res){
		var localId = req.user._id;
		var remoteId = req.body.id;
		Chat.find({$or:[{sendId:localId,receiveId:remoteId},{sendId:remoteId,receiveId:localId}],time_stamp:{$lt:new Date(req.body.last_time_stamp)}}).sort("-time_stamp").limit(10).exec(function(err,chats){
			if(err){console.log(err)}
			else{
				Chat.update({sendId:remoteId,receiveId:localId,read:false},{read:true},{upsert:false,multi:true},function(err,numberAffected,raw){
					res.send(chats);
				});
			}
		});
	}
}

exports.googleNews = function(http){
	return function(req,res){
		var symbol = req.query.symbol;
		getGoogleNews(symbol,100,http,function(news){
		res.send(news);
		});
	}
}

exports.changePassword = function(User,bcrypt){
	return function(req,res)
	{
		var oldPass = req.body.oldPass;
		var newPass = req.body.newPass;
		bcrypt.compare(oldPass,req.user.password,function(err,result){
			if(!result){
				return res.send("incorrect");
			}
			bcrypt.genSalt(10,function(err,salt){
				bcrypt.hash(newPass,salt,function(err,hash){
					User.findOneAndUpdate({_id:req.user._id},{password:hash},function(err,user){
						if(err){console.log(err)}
						else{
							return res.send("success");
						}
					});	
				});
			})
		});
	}
}

exports.forgetPassPage = function(req,res)
{
	res.render("forgetPass");
}

exports.forgetPassword = function(nodemailer,User,bcrypt){
	return function(req,res)
	{	
		var templateDir = path.join(__dirname,"../views/email_templates");
		var address = req.body.email;
		emailTemplates(templateDir,function(err,template){
			if(err){
				console.log(err);
			}else{
					User.find({email:address},function(err,user){
						if (user.length > 0){
							var user_id = user[0]._id;
							crypto.randomBytes(8, function(ex, buf){
						    	var _token = buf.toString('hex');
						    	bcrypt.genSalt(10,function(err, salt){
						    		bcrypt.hash(_token,salt,function(err,hash){
						    			var smtpTransport = nodemailer.createTransport("SMTP",{
										    service: "Gmail",
										    auth: {
										        user: "wecleanyourdorm@gmail.com",
										        pass: "wecleanyourdorm0426"
										    }
										});
											
										var locals = {
											     token: _token
											  };

										template('password_change',locals,function(err,html,text){
											if(err)
											{
												console.log(err);
											}else{
												smtpTransport.sendMail({
													from:"Stock Notes <wecleanyourdorm@gmail.com>",
													to:address,
													subject:"Password Reset",
													html:html,
													text:text
												},function(err,responseStatus){
													if(err)
													{
														console.log(err);
													}else{
														User.findOneAndUpdate({_id:user_id},{password:hash},function(err,user){
															if(err){console.log(err)}
															else{
																res.send("success");
															}
														});
													}
												});
											}
						    			});
						    		});
								
								});
							});
						}
					});	
			}
		});	 
	}
}

exports.changeEmail = function(User,bcrypt)
{
	return function(req,res)
	{
		var templateDir = path.join(__dirname,"../views/email_templates");
		var address = req.body.email;
		var pass = req.body.password;
		bcrypt.compare(pass,req.user.password,function(err,user){
			if(!user){
				return res.send("incorrect");
			}
			if(err){
				console.log(err);
			}
			User.findOneAndUpdate({_id:req.user._id},{email:address},function(err,user){
				if(err){console.log(err)}
				else{
					res.send("success");
				}
			});
		});
	}
}

exports.getHotStocks = function(Stock,callback){
	Stock.find({}).sort("-count").limit(10).exec(function(err,stocks){
		callback(stocks);
	});
}

exports.searchUser = function(User){
	return function(req,res){
		var subscribe_to = req.user.subscribe_to;
		console.log("subscribe_to ");
		console.log(subscribe_to);
		var qArr = req.query.qArr;
		var reg = getSearchReg(qArr);
		User.find({fn:{$regex:reg},_id:{$in:subscribe_to}},function(err,users){
			if(err){console.log(err)}
			else{
				console.log("users");
				console.log(users);
				res.send(users);
			}
		});
	}
}

exports.addDisCmt = function(Discussion,mongoose){
	return function(req,res){
		var _cmt = req.body.cmt;
		var _dis_id = req.body.dis_id;
		var _discussion = {
							_id:mongoose.Types.ObjectId(),
							user_id:req.user._id,
							user_fn:req.user.fn,
							user_image_dir_resized:req.user.image_dir_resized,
							body:_cmt,
							time_stamp:new Date()
						}
		console.log("id");
		console.log(_discussion);
		Discussion.findOneAndUpdate({_id:_dis_id},{$push:{discussion:_discussion
														  },
													$inc:{popularity:1}
													},function(err,discussion){
													if(err){console.log(err)}
													else{
														console.log
														res.send(_discussion);
													}
		});
	}
}

exports.addDisCmtReply = function(Discussion,mongoose){
	return function(req,res)
	{	
		var _cmt_id = req.body.cmt_id;
		var reply = req.body.dis_reply;
		var comment = {
			_id:mongoose.Types.ObjectId,
			user_id:req.user._id,
			user_fn:req.user.fn,
			time_stamp:new Date(),
			body:reply
		}
		Discussion.findOneAndUpdate({'discussion._id':_cmt_id},{$push:{'discussion.$.comments':comment
																	  },
																$inc:{popularity:1}
																}, function(err,_discussion){
																	if(err){console.log(err)}
																	else{
																		res.send(comment);
																	}
																});
	}
}

exports.addDiscussion = function(Discussion){
	return function(req,res){
		var topic = req.body.topic;
		var opening = req.body.opening;
		var n_discussion = new Discussion({
				user_id:req.user._id,
				user_fn:req.user.fn,
				user_image_dir_resized:req.user.image_dir_resized,
				topic:topic,
				opening:opening,
				time_stamp:new Date(),
				popularity:0
		});
		n_discussion.save(function(err,discussion){
			if(err){console.log(err)}
			else{
				res.send(discussion);
			}
		});
	}
}

exports.discussion = function(Discussion,User){
	return function(req,res)
	{
		var dis_id = req.query.id;
		Discussion.find({_id:dis_id},function(err,_discussion){
			console.log(_discussion);
			User.find({_id:{$in:req.user.subscribe_to}},function(err,subscribe_to_users){
				res.render("discussion",{discussion:_discussion[0],subscribe_to:JSON.stringify(subscribe_to_users)});
			});
			
		})
	}
}

exports.discussionsList = function(Discussion,User){
	return function(req,res){
		var q = req.query.q;
		var currPage = req.query.p;
		if(q==undefined || q.length == 0 ){
			q = "";
		}

		if(currPage == undefined || currPage.length == 0 || currPage <=0){
			currPage = 1;
		}
		var qArr = q.split(" ");
		var reg = getSearchReg(qArr);
		var query = {$or:[{topic:{$regex:reg}}, {opening:{$regex:reg}}]};
		Discussion.count(query,function(err,disCount){
			Discussion.find(query).sort("-popularity -_id").skip(DisListNum * (currPage - 1)).limit(DisListNum).exec(function(err,discussions){
				var numPage = Math.ceil(disCount/DisListNum);
				User.find({_id:{$in:req.user.subscribe_to}},function(err,subscribe_to_users){
					res.render("discussionsList",{user:req.user,
												  discussions:JSON.stringify(discussions),
												  subscribe_to:JSON.stringify(subscribe_to_users),
												  pageData:{query:q,
												  			end:numPage,
												  			url:"/discussions-list",
												  			current:currPage
												  			}
												  }
							  );
					});
			});
		})
	}
}

exports.getChats = function(Chat,uid,callback){
	Chat.find({receiveId:uid},function(err,chats){
	 		if(err){console.log(err)}
	 		else{
	 			callback(chats);
	 		}
	});
}

exports.getNotifications = function(Notification){
	return function(req,res)
	{
		var uid = req.query.uid;
		var time_stamp = req.query.time_stamp;
		Notification.find({user_id:uid,time_stamp:{$lt:new Date(time_stamp)}}).sort("-time_stamp").limit(5).exec(function(err,notifications){
			if(err){console.log(err)}
			else{
				console.log(notifications);
				Notification.update({user_id:uid},{read:true},{upsert:false,multi:true},function(err,numberAffected,raw){
					res.send(notifications);
				});
			}
		});
	}
}

exports.rankings = function(User,Stock,Activity)
{
	return function(req,res){
		User.find({}).sort("-popularity").limit(20).exec(function(err,users){
			if(err){console.log(err)}
			else{
				Stock.find({}).sort("-count").limit(20).exec(function(err,stocks){
					if(err){console.log(err)}
					else{
						Activity.find({type:"publish"}).sort("-popularity").limit(20).exec(function(err,_activities){
							if(err){console.log(err)}
							else{
								User.find({_id:{$in:req.user.subscribe_to}},function(err,subscribe_to_users){
								res.render("rank",{user:req.user,users_list:users,stocks_list:stocks,activities:_activities,subscribe_to:JSON.stringify(subscribe_to_users)});
								});
							}
						})
					}
				})
			}
		})
	}
}

exports.follow = function(User){
	return function(req,res){
		var currPage = req.query.p;
		var _type = req.query.t;
		var goodTypes = ["following","follower"];
		if (!isNumber(currPage))
		{
			currPage = 1;
		}

		if(goodTypes.indexOf(_type) == -1)
		{
			_type = "following";
		}

		if(_type=="following"){
		var usersArr = req.user.subscribe_to;
		}else if(_type=="follower")
		{
		var usersArr = req.user.followed_by;
		}
		var query = {_id:{$in:usersArr}};
		User.count(query,function(err,count){
			var numPage = Math.ceil(count/usersPerPage);
			User.find(query).sort("-popularity -_id").skip((currPage-1) * usersPerPage).limit(usersPerPage).exec(function(err,_users){
				User.find({_id:{$in:req.user.subscribe_to}},function(err,subscribe_to_users){
					res.render("follow",{user:req.user,type:_type,subscribe_to:JSON.stringify(subscribe_to_users),users:_users,pageData:{
														 		   end:numPage,
														 		   url:"/follow",
														 		   current:currPage}
														 });
				});
			});
		});
	}
}

exports.chatNotifications = function(User,Notification,Chat){
	return function(req,res)
	{
		var type = req.query.t;
		var p = req.query.p;
		var goodTypes = ["notifications","chats"];
		if(goodTypes.indexOf(type) == -1)
		{
			type = "notifications";
		}

		if(p == undefined || p <= 0)
		{
			p = 1;
		}
		User.find({_id:{$in:req.user.subscribe_to}},function(err,subscribe_to_users){
			switch(type){
				case "notifications":
					Notification.find({user_id:req.user._id}).skip((p-1) * notiPerPage).limit(notiPerPage).exec(function(err,_notifications){
						if(err){
							console.log(err);
						}else{
							res.render("chatNotifications",{user:req.user,subscribe_to:JSON.stringify(subscribe_to_users),type:"notifications",notifications:_notifications,page:p});
						}
					});
					break;
				case "chats":
					Chat.aggregate(
							[{$match:{receiveId:req.user._id}},
							{$group:{_id:"$sendId",msg:{$last:"$body"},fn:{$last:"$sendFn"},image_dir:{$last:"$send_image_dir"},time_stamp:{$last:"$time_stamp"}}},
							{$sort:{_id:-1}},
							{$skip:(p-1) * chatPerPage},
							{$limit:chatPerPage} 
							],function(err,_chatGroups){
								if(err){console.log(err)}
								else{
									res.render("chatNotifications",{user:req.user,subscribe_to:JSON.stringify(subscribe_to_users),type:"chats",chatsGroups:_chatGroups,page:p});
								}
							}
						)
			}
		});
	}
}

exports.contact = function(nodemailer){
	return function(req,res){
		var feedback = req.query.feedback;
		console.log("feedback.length " + feedback.length);
		if (feedback.length != 0){
			var smtpTransport = nodemailer.createTransport("SMTP",{
			    service: "Gmail",
			    auth: {
			        user: "wecleanyourdorm@gmail.com",
			        pass: "wecleanyourdorm0426"
			    }
			});

			var mailOptions = {
			    from: req.user.email, // sender address
			    to: "jh3627@stern.nyu.edu", // list of receivers
			    subject: "Stock Notes feedback ✔", // Subject line
			    text: req.user.email + " " + feedback, // plaintext body
			    html: "<p>" + feedback + "</p>" // html body
			}

			smtpTransport.sendMail(mailOptions, function(error, response){
			    if(error){
			        console.log(error);
			    }else{
			        console.log("Message sent: " + response.message);
			        res.send("success");
			    }
			});
		}
	}
}

function markFollowedUsers(_users,subscribe_to)
{
	var temp = [];
	for(var i=0;i<_users.length;i++)
	{
		var user = JSON.parse(JSON.stringify(_users[i]));
		user.followed = false;
		if (subscribe_to.indexOf(user._id) != -1)
		{
			user.followed = true;
		}
		temp.push(user);
	}
	return temp;
}

function isNumber(n){
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function getSearchReg(qArr)  //takes an array of queries as args
{
	var reg_str = ".*";
		for(var i = 0;i<qArr.length;i++)
		{
			reg_str += qArr[i] + ".*";
		}
	var reg = new RegExp(reg_str,"gi");
	return reg;
}

function getGoogleNews(symbol,numItems,http,callback)
{
	var options = {
	  host: 'www.google.com',
	  port: 80,
	  path: '/finance/company_news?q=' + symbol.trim() + '&num=' + numItems,
	};

	var req = http.get(options, function(res) {
	  console.log(options.path);
	  console.log('STATUS: ' + res.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');
	  var data = "";

	  res.on('data', function (chunk) {
	  	data += chunk;
	  }).on('end',function(){
	  	callback(data);
	  });
	});

	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});
}


function getHisData(symbol,http,callback){
	var options = {
	  host: 'ichart.finance.yahoo.com',
	  port: 80,
	  path: '/table.csv?s='+symbol+'&ignore=.csv',
	};

	var req = http.get(options, function(res) {
		console.log(options.path);
	  console.log('STATUS: ' + res.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');
	  var data = "";
	  res.on('data', function (chunk) {
	  	data += chunk;
	  //	console.log("data \n" + chunk);
	  }).on('end',function(){
	  	var lines = data.split("\n");
	  	var out_array = [];
	  	for(var i in lines){
	  		var fields = lines[i].split(",");
	  		var in_array = [];
	  		if (!isNaN(Date.parse(fields[0])) && !isNaN(parseFloat(fields[4])) && Date.parse(fields[0]) != null && fields[4] != null){
	  		in_array.push(Date.parse(fields[0]));// push date UTC into the first field of in_array;
	  		in_array.push(parseFloat(fields[4]));
	  		out_array.unshift(in_array);
	  		}	
	  	}
	  	if (callback && typeof(callback) === "function") {
		  	callback(out_array); 
		}
	  });
	});

	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});
}

function shareFavLikeUpdate(user_id,activities){
    var temp = [];
    for(var i=0;i<activities.length;i++)
    {	
    	var temp_act = JSON.parse(JSON.stringify(activities[i]))
        if(activities[i].liked_by.indexOf(user_id) != -1){
            temp_act.liked = true;
        }else{
            temp_act.liked = false;
        }

        if(activities[i].shared_by.indexOf(user_id) != -1){
            temp_act.shared = true;
        }else{
            temp_act.shared = false;
        }

        if(activities[i].addFav_by.indexOf(user_id) != -1){
            temp_act.fav = true;
        }else{
            temp_act.fav = false;
        }

        temp_act.time_stamp = new Date(temp_act.time_stamp);
        temp.push(temp_act);
    }
    return temp;
}

function processMsg(body){
	if(body != undefined){
	    var patt = new RegExp("\\$[A-Z^/.]{1,7}\\$","gi");
	    var t = body.replace(patt,function(match){
	        var patt2 = new RegExp("\\$","g");
	        var ticker = match.replace(patt2,"");
	        return "<a href='http://finance.yahoo.com/q?s="+ ticker +"'' ><span class='symbol'>"+match+"</span></a>";
	    }); 
	    return t;
	}
}