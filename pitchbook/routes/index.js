var crypto = require('crypto');
var path = require('path');
var emailTemplates = require('email-templates');

exports.index = function(req,res){
	 res.render('index',{login_err:req.flash("error")[0]});
}

exports.signup = function(nodemailer,User,bcrypt){
	return function(req,res){
		var p = req.body.pass,
			e = req.body.email,
			first_n = req.body.fn,
			last_n = req.body.ln;
		console.log("email");
		console.log(e);
		User.count({email:e},function(err,count){
			console.log("email count");
			console.log(count);
			if(count == 0){
				bcrypt.genSalt(10,function(err,salt){
					bcrypt.hash(p, salt, function(err, hash){
						crypto.randomBytes(32, function(ex, buf){
							var _token = buf.toString('hex');
							var timeNow = new Date();
							var n_user = new User({fn:first_n + " " + last_n,
													email:e,
													password:hash,
													reputation:0,
													image_dir_resized:"/images/icons/png/avatar.png",
													abt:"I am a new user",
													token:_token,
													time_stamp:timeNow,
													validated:false
												 });
							n_user.save(function(err,user){
								if (err){
									console.log(err);
								}

								var templateDir = path.join(__dirname,"../views/email_templates");
								var address = e;
								emailTemplates(templateDir,function(err,template){
									if(err){
										console.log(err);
									}else{
										var smtpTransport = nodemailer.createTransport("SMTP",{
												    service: "Gmail",
												    auth: {
												        user: "wecleanyourdorm@gmail.com",
												        pass: "wecleanyourdorm0426"
												    }
										});
										var _url = "http://localhost:3000/validate?id=" + user._id + "&token=" + _token ;
										var locals = {
													     url: _url
													  };
										template('validation',locals,function(err,html,text){
											if(err)
											{
												console.log(err);
											}else{
												smtpTransport.sendMail({
															from:"Stock Notes <wecleanyourdorm@gmail.com>",
															to:address,
															subject:"Please validate your email",
															html:html,
															text:text
														},function(err,responseStatus){
															if(err)
															{
																console.log(err);
															}else{
																console.log(responseStatus.message);
																res.send("email_sent");
															}
												});
											}
										});
									}						
								});
							});
						});
					});
				});
			}else{
				res.send("email_repeat");
			}
		});
			
		
	}
}

exports.validate = function(User){
	return function(req,res){
		var uid = req.query.id;
		var _token = req.query.token;
		var timeNow = new Date();
		var validTimeDiff = 24 * 60 * 60 ; 
		console.log("uid " + uid + " _token " + _token);
		User.find({_id:uid,token:_token},function(err,user){
			if(err){console.log(err)}
			else{
				console.log(user);
				if(user.length == 1){
					console.log("user");
					console.log(user);
					console.log("user.time_stamp");
					console.log(user[0].time_stamp);
					if(checkDate(timeNow,user[0].time_stamp,validTimeDiff)){
						User.findOneAndUpdate({_id:uid,token:_token,validated:false},{validated:true},function(err,_user){
							if(err){console.log(err)}
							if(user){
								console.log("success validating ");
								res.render("validate");
							}
						});
					}else{
						console.log("timeout !!");
						res.render("failure",{msg:"You token has expired."});
					}
				}else{
					console.log("failure !! ");
					res.render("failure",{msg:"Yo,trying to be naughty huh? "});
				}
			}
		})
	}	
}

function checkDate(date1,date2,timeDelta){  // timeDelta in seconds
	var timeMilliDelta = timeDelta * 1000;
	var time1 = date1.getTime();
	var time2 = date2.getTime();
	var diff = Math.abs(time1 - time2);
	if (diff<timeMilliDelta){
		return true;
	}
	return false;
}

