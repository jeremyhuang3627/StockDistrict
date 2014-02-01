var chatQueue = {};  // lets just call it a queue even though its an obj
var notificationQueue = [];
function updateUnreadCount(){
	count = 0;
	for(var id in chatQueue){
		for(var i=0;i<chatQueue[id].length;i++){
			if (!chatQueue[id][i].read){
				count += 1;
			}
		}
	}
	$(".chat-status .unread_count").html(count);
}

function getCount(chatQueue){
	var count = 0; 
	for(var id in chatQueue){
		for(var i=0;i<chatQueue[id].length;i++){
			count += 1;
		}
	}
	return count;
}

function attachChat(data,type,toUserId,option){  //type is either send or receive  toUserId is the userId of the other user that the current user is chatting with
	if (type == "send"){
	var temp = "<div class='chat-msg-wrapper'>" + 
									"<div class='arrow right'></div><div class='chat-msg send' data-time ='" + data.time_stamp + "'><span>" + 
										data.body +
									"</span></div>"+ 
								"</div>";
	}else if(type == "receive"){
		var temp = "<div class='chat-msg-wrapper'>" + 
									"<div class='arrow left'></div><div class='chat-msg receive' data-time ='" + data.time_stamp + "'><span>" + 
										data.body +
									"</span></div>"+ 
								"</div>";
	}
	if(option=="append"){
		$(temp).hide().appendTo($(".chat-box[id='" + toUserId + "']").find(".chat-area")).fadeIn("fast");
	}else if(option == "prepend"){
		$(temp).hide().prependTo($(".chat-box[id='" + toUserId + "']").find(".chat-area")).fadeIn("fast");
	}
}

function setScrollBtm(chatarea){
	var scrollHeight = chatarea[0].scrollHeight;
	var visibleHeight = chatarea.height();
	chatarea.scrollTop(scrollHeight - visibleHeight);
}

$.fn.bindChatScrollHandler = function(){
	var disTraveled = 0;
	var loadComplete = false;
	$(this).on('scroll', function(){
		var chatarea = $(this);
        var scrollHeight = chatarea.get(0).scrollHeight;
		var scrollTop = chatarea.scrollTop();
		var scrollBtm = scrollHeight - scrollTop;
		if (scrollBtm > disTraveled){
			var remoteUserId = chatarea.parents(".chat-box").attr("id");
			var chatMsgs = chatarea.find(".chat-msg");
			var _last_time_stamp = $(chatMsgs[0]).attr("data-time");
			disTraveled = scrollBtm;
			if (scrollTop/scrollHeight < 0.05 && !loadComplete){
				maxScrollBtm = scrollBtm;
				$.ajax({
					url:"/loadChat",
					type:"POST",
					data:{
						id:remoteUserId,
						last_time_stamp:_last_time_stamp
					},
					dataType:"json",
					success:function(data){
						if (data.length == 0){
							loadComplete = true;
						};

						for(var i = data.length-1;i >= 0;i--)
						{
							if (data[i].sendId == remoteUserId){
								attachChat(data[i],"receive",remoteUserId,"prepend");
							}else{
								attachChat(data[i],"send",remoteUserId,"prepend");
							}
						}
						var newScrollHeight = chatarea.get(0).scrollHeight;
						var newScrollTop = newScrollHeight - scrollBtm;
						chatarea.scrollTop(newScrollTop);
					}
				})
			}
		}
    });
}

function chatUserTemplate(user)
{
	var template = "<div class='subscribe_to_wrapper'>"+ 
						"<div class='user-link'>" + 
							"<div class='profile-img'>" + 
								"<img src='" + user.image_dir_resized + "' class='shadow'>" + 
								"<div class='state offline'>" + 
								"</div>" + 
							"</div>" + 
							"<div id='" + user._id + "' class='user-info'>" + 
								"<div class='name'>" + 
									user.fn	+ 
								"</div>" + 
								"<div class='rep'>" + 
									"Rep " + user.reputation +   
								"</div>" + 
							"</div>" + 
						"</div>" + 
					"</div>";

		return template;
}

function suggestChatUsers(data)
{
	var template = "";
	for(var i=0;i<data.length;i++)
	{
		template += chatUserTemplate(data[i]);
	}
	$("#slidePanel").html(template);
}

function updateOnlineUsers(data)
{
	for(var i=0;i<data.uids.length;i++)
	{
		$(".user-info[id='"+data.uids[i]+"']").parents(".user-box").siblings(".profile-img").find(".state").attr("class","state online");
	}
}

function cacheChat(chat,chatQueue){
        if (typeof chatQueue[chat.sendId] != "undefined"){
            chatQueue[chat.sendId].push(chat);
        }else{
            chatQueue[chat.sendId] = [];
            chatQueue[chat.sendId].push(chat);
        }
};

function singleChatHandler(data)
{
	if ($(".chat-box[id='"+data.sendId+"']").length > 0){  // if there is a chat box open
	       		attachChat(data,"receive",data.sendId,"append");
	       		var chatarea = $(".chat-box[id='"+data.sendId+"']").find(".chat-area");
	       		setScrollBtm(chatarea);
	}else{  // cache it
	       		cacheChat(data,chatQueue); //defined in topbar.jade
	       		updateUnreadCount();
	}
}

$(function(){
	var user_id = $("a.username").attr("id");
	socket.emit("getChats",{uid:user_id});
	socket.on('chat', function(data){
		if(data.length != undefined){
			for(var i=0;i<data.length;i++)
			{
				singleChatHandler(data[i]);
			}
		}else{
			singleChatHandler(data);
		}	
    });
	
	socket.emit("getNotificationCount",{uid:user_id});
	socket.on("notificationCount",function(count){
		$(".user-status .unread_count").html(count);
	});
	socket.on("notification",function(){
		$(".user-status .unread_count").html(parseInt($(".user-status .unread_count").html()) + 1);
	})

	socket.emit("getOnlineUsers",{uid:user_id});
	socket.on("online",function(data){
		updateOnlineUsers(data);
	});

	$("input.search-user-input").on("keyup",function(e){
		var _term = $(this).val();
		var _qArr = _term.split(" ");
		console.log(_term);
		$.ajax({
			url:"/searchUser",
			data:{
				qArr:_qArr
			},
			type:"GET",
			dataType:"json",
			success:function(data){
				suggestChatUsers(data);
			}
		});
	});

	$("#slideHandle").on("click",function(){
		var state = $(this).attr("data-state");
		var wrapper = $(this).parent("#slidePanel_wrapper")
		var width = wrapper.css("width");
		if (state == "off"){
			$(this).attr("data-state","on").css("background-image","url('/images/icons/png/slide_in.png')");
			wrapper.animate({right:"+="+width},100);
		}else if (state == "on"){
			$(this).attr("data-state","off").css("background-image","url('/images/icons/png/slide_out.png')");
			wrapper.animate({right:"-="+width},100);
		}
	});

	$("body").on("click",".subscribe_to_wrapper .user-link, .chat-drop-down-item",function(){
		var user_fn = $(this).find(".user-info").html();
		var remoteUserId = $(this).find(".user-info").attr("id");
		var numChatBox = $(".chat-box").length;
		var rightOffset = (numChatBox) * 280 + 230;   //assumes width of chat box is 250px; 
		var template = "<div class='chat-box border' id='" + remoteUserId + "'>"+
							"<div class='chat-user'><span>" + user_fn + "</span><a class='close-chat'><img src='/images/icons/png/cross_silver.png'></a></div>" + 
							"<div class='chat-area border'>" +
							"</div>" + 
							"<div class='chat-input-wrapper'>" + 
								"<textarea class='chat-input'></textarea>" +
							"</div>" +
						"</div>";
		$(template).appendTo($("#contentCol")).css("right",rightOffset);
		var chatarea = $(".chat-box[id='" + remoteUserId + "']").find(".chat-area");
		chatarea.bindChatScrollHandler();
		$.ajax({
			url:"/loadChat",
			type:"POST",
			data:{
				id:remoteUserId,
				last_time_stamp:(new Date()).toString()
			},
			dataType:"json",
			success:function(data){
				console.log(data);
				for(var i = data.length-1;i >= 0;i--)
				{
					if (data[i].sendId == remoteUserId){
						attachChat(data[i],"receive",remoteUserId,"append");
					}else{
						attachChat(data[i],"send",remoteUserId,"append");
					}
				}
				setScrollBtm(chatarea);
				for(var i=0;i<chatQueue[remoteUserId].length;i++)
				{
					chatQueue[remoteUserId][i].read = true;
				}
				updateUnreadCount();
			}
		});
	});

	$("#contentCol").on("keypress",".chat-input",function(e){
		console.log(e);
		if (e.which == 13)
		{	
			e.preventDefault();
			var _toId = $(this).parents(".chat-box").attr("id");
			var content = $(this).val();
			var chat_input_wrapper = $(this).parent(".chat-input-wrapper");
			var _toFn = $(this).parents(".chat-box").find(".chat-user span").html();
			$(this).val("");
			$.ajax({
				url:"/chat",
				type:"POST",
				data:{
					chatContent:content,
					toId:_toId,
					toFn:_toFn
				},
				dataType:"json",
				success:function(data){
				  attachChat(data,"send",_toId,"append");
				  var chatarea = $(".chat-box[id='" + _toId + "']").find(".chat-area");  // user_id is remoteUserId
				  setScrollBtm(chatarea);
				}
			}); 
		}
	});

	$("#contentCol").on("click",".close-chat",function(){
		$(this).parents(".chat-box").remove();
	});

	/* topbar */
	$(".chat-status").on("click",function(){
		$(this).addClass("icon-on");
		var count = getCount(chatQueue);
		if ($(".drop-down-status-box").css("display") == "none"){
			var template = "";
			if (count >0){
				for(var id in chatQueue){
					var last = chatQueue[id][chatQueue[id].length-1];
					template += "<li><div class='chat-drop-down-item'>" + 
									"<div class='chat-icon'><img class='shadow' src='" + last.send_image_dir + "'></div>" + 
										"<div class='chat-body' >" + 
											"<div class='user-info' id='" + last.sendId+ "'>" +
												last.sendFn +
											"</div>"+ 
											"<div class='chat-drop-down-body'>" +
												last.body +
											"</div>"+ 
										"</div>"+
								"</div></li>";
				}

				template += "<li><div class='see-all-noti'><a href='/notification?t=chats'>See all</a></div></li>";
			}else{
				template += "<li><div class='no-drop-down-item'>"+
								"You don't have any new messages."
							"</div></li>";
			}
			$(".drop-down-status-box").html(template).fadeIn("fast");
		}else {
			$(".drop-down-status-box").hide();
		}
	});

	$(".user-status").on("click",function(){
		$(this).addClass("icon-on");
		$.ajax({
			url:"/getNotifications",
			type:"GET",
			data:{
				uid:user_id,
				time_stamp:(new Date()).toString()
			},
			dataType:"json",
			success:function(data){
				$(".user-status").find(".unread_count").html("0");
				if (data.length>0){
					var template = "";
					for(var i=0;i<data.length;i++)
					{
						switch(data[i].type){
							case "comment":
								var msg = "commented on your <a href='/status?" + data[i].activity_id + "'>post</a>. (Rep + 0)";
								break;
							case "like":
								var msg = "liked on your <a href='/status?" + data[i].activity_id + "'>post</a>. (Rep + 5)";
								break;
							case "share":
								var msg = "shared your <a href='/status?" + data[i].activity_id + "'>post</a>. (Rep + 5)";
								break;
							case "fav":
								var msg = "added your <a href='/status?" + data[i].activity_id + "'>post</a> to favorites. (Rep + 15)";
								break;
						}
						template += "<li><div class='noti-drop-down-item'>" + 
										"<a href='/user?id=" + data[i].remote_user_id + "'>" + data[i].remote_user_fn+ " </a> " + 
										msg + 
										"</div></li>";
					}

					template += "<li><div class='see-all-noti'><a href='/notification?t=noti'>See all</a></div></li>";
				}else{
					var template = "<li><div class='noti-drop-down-item'>You do not have any notifications</div></li>";
				}
					if ($(".drop-down-status-box").css("display") == "none"){
						$(".drop-down-status-box").html(template).fadeIn("fast");
					}else{
						$(".drop-down-status-box").hide();
					}
			}
		});
	});

	$(document).mouseup(function (e)
	{
	    var icon = $(".icon-on");
	    var dropDownBox = $(".drop-down-status-box");
	    if (!icon.is(e.target) // if the target of the click isn't the container...
	        && icon.has(e.target).length === 0 && !dropDownBox.is(e.target) && dropDownBox.has(e.target).length === 0) // ... nor a descendant of the container
	    {
	       	icon.removeClass("icon-on");
	    }
	    
	    if (!dropDownBox.is(e.target) // if the target of the click isn't the container...
	        && dropDownBox.has(e.target).length === 0) // ... nor a descendant of the container
	    {
	       	dropDownBox.hide();
	    }
	});

});