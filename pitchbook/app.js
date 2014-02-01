var express = require('express');
var routes = require('./routes');
var profile = require('./routes/profile');
var http = require('http');
var path = require('path');
var passport = require("passport");
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
var app = express();
var flash = require('connect-flash');
var bcrypt = require('bcrypt');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var db = mongoose.connection;
var async = require('async');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var config = require('./oauth.js');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var nodemailer = require("nodemailer");

//mongoose schema
var userSchema = new Schema({
	oauthId:Number,
	fn:String,
	email : String,
	oauth_email : String,
	password : String,
	watch_list : [String],
	subscribe_to : [Schema.Types.ObjectId],
	followed_by : [Schema.Types.ObjectId],
	popularity:{ type: Number, default: 0 },
	image_dir_original:String,
	image_dir_resized:String,
	tempData:{
		hash:String,
		time_stamp:Date
	},
	abt:String,  //short bio
	token:String,
	time_stamp:{ type: Date, default: Date.now },
	validated:{ type: Boolean, default: false }
});

userSchema.index({popularity: -1, _id: -1 });

var chatSchema = new Schema({
	sendId:Schema.Types.ObjectId,
	sendFn: String,
	send_image_dir:String,
	receiveId:Schema.Types.ObjectId,
	receiveFn:String,
	receive_image_dir:String,
	body:String,
	time_stamp:Date,
	read:Boolean  //read by receiver
});

var activitySchema = new Schema({
	user_image_dir_resized:String,  //resized
	user_id:Schema.Types.ObjectId,
	user_fn:String,
	origin_user_id:Schema.Types.ObjectId,
	origin_user_fn:String,
	origin_act_id:Schema.Types.ObjectId,
	type:String, // comment,like, upvote, downvote, share, publish, 
	post:{    // generic container for content that are posted/shared/liked/commented
		body: String,
		comments :[{
			body: String,
			time_stamp:Date,
			owner_fn:String,
			owner_id:Schema.Types.ObjectId,
			owner_image_dir_resized:String
	    }]
	},
	time_stamp:{ type: Date, default: Date.now },
	stock:String,
	followed_user:{
		followed_user_id:Schema.Types.ObjectId,
		followed_user_fn:String
	},
	liked_by:[Schema.Types.ObjectId],
	shared_by:[Schema.Types.ObjectId],
	addFav_by:[Schema.Types.ObjectId],
	popularity:{ type: Number, default: 0 }
});

activitySchema.index({ popularity: -1, _id: -1 });

var stockSchema = new Schema({
	symbol:String,
	count:Number  //count of the number it is watched and mentioned;
});

var discussionSchema = new Schema({
	user_id:Schema.Types.ObjectId,
	user_fn:String,
	user_image_dir_resized:String,
	topic:String,
	opening:String,
	discussion:[{
		_id:Schema.Types.ObjectId,
		user_id:Schema.Types.ObjectId,
		user_fn:String,
		user_image_dir_resized:String,
		body:String,
		time_stamp:Date,
		comments:[{
			_id:Schema.Types.ObjectId,
			user_fn:String,
			user_id:Schema.Types.ObjectId,
			time_stamp:Date,
			body:String
		}]
	}],
	time_stamp:{ type: Date, default: Date.now },
	popularity:{ type: Number, default: 0 }
});

discussionSchema.index({ popularity: -1, _id: -1 });

var notificationSchema = new Schema({
	user_id:Schema.Types.ObjectId,
	remote_user_id:Schema.Types.ObjectId,
	remote_user_fn:String,
	type:String,
	activity_id:Schema.Types.ObjectId,
	read:Boolean,
	time_stamp:Date
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: 'SECRET' }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

app.use(function(req, res, next){
  // the status option, or res.statusCode = 404
  // are equivalent, however with the option we
  // get the "status" local available as well
  res.render('404');
});


if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

mongoose.connect('mongodb://localhost/mydb');

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback(){
	var User = mongoose.model('user', userSchema);
	var Activity = mongoose.model('activity', activitySchema);
	var Chat = mongoose.model('chat',chatSchema);
	var Stock = mongoose.model('stock',stockSchema);
	var Notification = mongoose.model('notification',notificationSchema);
	var Discussion = mongoose.model('discussion',discussionSchema);

	passport.serializeUser(function(user, done) {
	  done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
	  User.findById(id, function(err, user) {
	    done(err, user);
	  });
	});

	passport.use(new LocalStrategy(
	  function(username, password, done) {
	  	console.log("authenticating");
	    User.findOne({ email: username }, function (err, user) {
	      if (err) { return done(err); }
	      if (!user) {
	        return done(null, false, { message: 'Incorrect username.' });
	      }
	      bcrypt.compare(password, user.password, function(err, res) {
					    if (!res) {
			        		return done(null, false, { message: 'Incorrect password.' });
			      		}
			      		return done(null, user);
		  });
	    });
	  }
	)); 

	passport.use(new FacebookStrategy({
		clientID: config.facebook.clientID,
		clientSecret: config.facebook.clientSecret,
		callbackURL: config.facebook.callbackURL
	}, function(accessToken, refreshToken, profile, done){
			User.findOne({oauthId:profile.id},function(err,oldUser){
				if(oldUser){
					done(null,oldUser);
				}else{
					var newUser = new User({oauthId:profile.id, 
											oauth_email:profile.emails[0].value,
											fn:profile.displayName,reputation:0,
											image_dir_resized:"/images/icons/png/avatar.png",
											abt:"I am a new user"
										}).save(function(err,nUser){
												if(err) throw err;
												done(null,nUser);
											});
				}
			});
	}));

	passport.use(new TwitterStrategy({
		consumerKey: config.twitter.consumerKey,
		consumerSecret: config.twitter.consumerSecret,
		callbackURL: config.twitter.callbackURL
	}, function(accessToken, refreshToken, profile, done){
			User.findOne({oauthId:profile.id},function(err,oldUser){
				if(oldUser){
					done(null,oldUser);
				}else{
					var newUser = new User({oauthId:profile.id, 
											fn:profile.displayName,
											reputation:0,
											image_dir_resized:"/images/icons/png/avatar.png",
											abt:"I am a new user"
										   }).save(function(err,nUser){
												if(err) throw err;
												done(null,nUser);
											});
				}
			});
	}));

	var clients = {};
	io.sockets.on("connection",function(socket){
		console.log("socketid " + socket.id);
		var _uid = "";
		socket.on("addUser",function(data){
			_uid = data.uid;
			clients[data.uid] = socket.id;
			var onlineUsers = [];
			onlineUsers.push(_uid);
			socket.broadcast.emit('online',{uids:onlineUsers});
		});

		socket.on("getChats",function(data){
		 	profile.getChats(Chat,data.uid,function(chats){
		 		socket.emit("chat",chats);
		 	});
		})

		socket.on("getOnlineUsers",function(data){
			console.log("getOnlineUsers data");
			console.log(data);
			User.find({_id:data.uid},function(err,user){
				var subscribe_to = user[0].subscribe_to;
				var onlineUsers = [];
				for(var i=0;i<subscribe_to.length;i++)
				{
					if (clients[subscribe_to[i]] != undefined){
						onlineUsers.push(subscribe_to[i]);
					}
				}
				socket.emit("online",{uids:onlineUsers});
			});
		});

		socket.on("getNotificationCount",function(data){ //count of unread notifications
			Notification.count({user_id:data.uid,read:false},function(err,count){
				if(err){console.log(err)}
				else{
					socket.emit("notificationCount",count);
				}
			});
		});

		socket.on("getStocksRank",function(){
			profile.getHotStocks(Stock,function(stocks){
				socket.emit("stocksRank",{stocks_array:stocks});
			});
		});

		socket.on("disconnect",function(){
						console.log(socket.id + " disconnected");
						delete clients[_uid];
						socket.broadcast.emit('offline',{uid:_uid});
		});
	});

	app.get('/*', function(req, res, next) {
    if (req.headers.host.match(/^www\./) != null) {
      res.redirect("http://" + req.headers.host.slice(4) + req.url, 301);
    } else {
      next();
    }
	});
	
	app.post('/login',passport.authenticate('local',{ successRedirect: '/user-home',
                                 failureRedirect: '/',
                                 failureFlash: true }));

	app.get("/loggedin",ensureLoggedIn('/'), profile.home(User,Activity,Chat))
	app.get("/auth/facebook", passport.authenticate("facebook"));
	app.get("/auth/facebook/callback",
	    passport.authenticate("facebook",{failureRedirect: '/',successRedirect: '/loggedin'})
	);

	app.get("/auth/twitter", passport.authenticate("twitter"));
	app.get("/auth/twitter/callback",
	    passport.authenticate("twitter",{failureRedirect: '/', successRedirect: '/loggedin'})
	);

	app.get('/user-home',ensureLoggedIn('/'),profile.home(User,Activity,Chat));
	app.get('/',routes.index);
	app.get('/validate',routes.validate(User));
	app.get('/account',ensureLoggedIn('/'),profile.account(Activity,User));
	app.get('/editInfo',profile.editInfo);
	app.get('/suggest',profile.suggest(User,Activity));
	app.get('/stock',ensureLoggedIn('/'),profile.stock(Activity));
	app.get('/googleNews',profile.googleNews(http));
	app.get('/searchUser',profile.searchUser(User));
	app.get('/getNotifications',profile.getNotifications(Notification));
	app.get('/discussions-list',ensureLoggedIn('/'),profile.discussionsList(Discussion,User));
	app.get('/discussion',ensureLoggedIn('/'),profile.discussion(Discussion,User));
	app.get('/fav',ensureLoggedIn('/'),profile.fav(Activity,User));
	app.get('/rankings',ensureLoggedIn('/'),profile.rankings(User,Stock,Activity));
	app.get('/search',ensureLoggedIn('/'),profile.search(User,Activity,Discussion));
	app.get('/follow',ensureLoggedIn('/'),profile.follow(User));
	app.get('/user',ensureLoggedIn('/'),profile.user(User,Activity));
	app.get('/notification',ensureLoggedIn('/'),profile.chatNotifications(User,Notification,Chat));
	app.get('/getNewUsers',ensureLoggedIn('/'),profile.getNewUsers(User));
	app.get('/forgetPass',profile.forgetPassPage);  // redirected from index page
	app.get('/contact',ensureLoggedIn('/'),profile.contact(nodemailer)); 
	app.post('/updateInfo',ensureLoggedIn('/'),profile.updateInfo(User));
	app.post('/addDiscussion',ensureLoggedIn('/'),profile.addDiscussion(Discussion));
	app.post('/addDisCmt',ensureLoggedIn('/'),profile.addDisCmt(Discussion,mongoose));
	app.post('/addDisCmtReply',ensureLoggedIn('/'),profile.addDisCmtReply(Discussion,mongoose));
	app.post('/like',ensureLoggedIn('/'),profile.like(Activity,User,Notification,io,clients));
	app.post('/addFav',ensureLoggedIn('/'),profile.addFav(Activity,User,Notification,io,clients));
	app.post('/chat',ensureLoggedIn('/'),profile.chatHandler(User,Chat,clients,io));
	app.post('/loadChat',ensureLoggedIn('/'),profile.loadChat(Chat,io,clients));
	app.post('/sharePost',ensureLoggedIn('/'),profile.sharePost(Activity,User,Notification,io,clients));
	app.post('/getNews',ensureLoggedIn('/'),profile.getNews(http));
	app.post('/signup',routes.signup(nodemailer,User,bcrypt));
	app.post('/msgHandler',ensureLoggedIn('/'),profile.msgHandler(Activity,User,io,clients));
	app.post('/commentHandler',ensureLoggedIn('/'),profile.commentHandler(Activity,Notification,clients,io));
	app.post('/addStock',ensureLoggedIn('/'),profile.addStock(User,Activity,io,clients,Stock));
	app.post('/deleteStock',ensureLoggedIn('/'),profile.deleteStock(User,Activity,io,clients,Stock));
	app.post('/getChartData',ensureLoggedIn('/'),profile.getChartData(http));
	app.post('/imageUpload',ensureLoggedIn('/'),profile.imageUpload(User));
	app.post('/proPicUpload',ensureLoggedIn('/'),profile.proPicUpload(User));
	app.post('/follow',ensureLoggedIn('/'),profile.addFollower(User,Activity)); //i.e. subscribe to
	app.post('/unfollow',ensureLoggedIn('/'),profile.unfollow(User));
	app.post('/scrollLoad',ensureLoggedIn('/'),profile.scrollLoad(Activity));
	app.post('/changePassword',ensureLoggedIn('/'),profile.changePassword(User,bcrypt));
	app.post('/forgetPassword',ensureLoggedIn('/'),profile.forgetPassword(nodemailer,User,bcrypt));
	app.post('/changeEmail',ensureLoggedIn('/'),profile.changeEmail(User,bcrypt));
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});



