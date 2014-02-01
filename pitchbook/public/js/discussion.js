$(function(){
	$(".discussion-cmt-btn").on("click",function(e){
		var _cmt = $(this).parents(".send-discussion-cmt").siblings(".editor").html();
		var _dis_id = $(".host-topic").attr("id");
		$.ajax({
			url:"/addDisCmt",
			type:"POST",
			data:{
				cmt:_cmt,
				dis_id:_dis_id
			},
			dataType:"json",
			success:function(data){
				console.log(data);
				var template = '<div id="' + data._id + '" class="cmt">' +
									'<div class="cmt-main">' +  
										'<div class="user-info">' + 
											'<div class="user-img">' + 
												'<img src="/images/icons/png/avatar.png" class="shadow">' + 
											'</div>' +
											'<div class="user-fn" id = "' + data.user_id + '">' + data.user_fn + '</div>' + 
										'</div>' + 
										'<div class="cmt-content">' + 
											'<div class="cmt-body">' + data.body + '</div>' + 
										'</div>' + 
									'</div>' + 
									'<div class="meta">' + 
										'<div class="time-stamp">' + data.time_stamp + '</div>'+ 
										'<a id="add" class="reply-link">Add comment</a>' + 
									'</div>' + 
									'<div class="reply-box">' + 
										'<div class="editor-wrapper">' + 
											'<div contenteditable="true" class="reply-editor border">' + 
											'</div>' + 
										'</div>' + 
										'<a class="send-reply">Send</a>' + 
									'</div>' + 
								'</div>';
				$(template).hide().prependTo($("#discussion-posts")).slideDown("fast");
			}
		});
	});

	$("a.reply-link").on("click",function(){
		$(this).parents(".meta").siblings(".reply-box").slideToggle("fast");
		if ($(this).attr("id") == "add")
		{
			$(this).html("close").attr("id","close");
		}else{
			$(this).html("Add Comment").attr("id","add");
		}
	});

	$("a.send-reply").on("click",function(){
		var _dis_reply = $(this).prev(".editor-wrapper").find(".reply-editor").html();
		var _cmt_id = $(this).parents(".cmt").attr("id");
		var cmt_reply = $(this).parents(".reply-box").siblings(".cmt-reply");
		if(_dis_reply.length > 0){
			$.ajax({
				url:"/addDisCmtReply",
				type:"POST",
				data:{
					dis_reply:_dis_reply,
					cmt_id:_cmt_id
				},
				dataType:"json",
				success:function(data){
					console.log("time_stamp type " + typeof data.time_stamp);
					var date = new Date(data.time_stamp);
					var template =  '<div class="reply">' + 
											data.body + 
											'<a href="/user?id=' + data.user_id + '"> -' + 
											 data.user_fn  +'</a>' + 
											'<span class="reply-time">' +
											 date.toLocaleDateString() + " " + date.toLocaleTimeString() + 
											'</span>' + 
									'</div>';
					$(template).hide().appendTo(cmt_reply).slideDown("fast");
				}
			});
		}
	});
});