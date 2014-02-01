function discussionTemplate(data){
	var template = '<div class="discussion">'+
						'<a href="/discussion?id=' + data._id + '">' + 
							'<div class="discussion-upper">' + 
								'<div class="host">' + 
									'<div class="host-img">' + 
										'<img src="' + data.user_image_dir_resized + '" class="shadow">' + 
									'</div>' + 
									'<div class="host-info">' + 
										'<div id="' + data.user_id + '" class="user-info">' + data.user_fn + ' </div>' + 
									'</div>'+
								'</div>'+
								'<div class="discussion-details">' + 
									'<div class="discussion-topic">' + 
										'<div style="margin: 0px; padding: 0px; border: 0px;">' + 
											'<span class="topic">Topic:  </span>' + 
											'<span class="topic-detail">' + data.topic + '</span>' + 
										'</div>' + 
									'</div>' + 
									'<div class="discussion-opening">' + 
										'<div style="margin: 0px; padding: 0px; border: 0px;">' + data.opening + '</div>'+
									'</div>' + 
								'</div>' + 
							'</div>' + 
							'<div class="discussion-lower">' + 
								'<div class="popularity">Number of comments : ' + data.popularity +'</div>' + 
							'</div>' + 
						'</a>' + 
					'</div>';

	return template;
}


$(function(){
	$(".discussion-opening,.discussion-topic").ellipsis();
	$(".init-discussion-btn").on("click",function(){
		$("#discussion-builder").slideToggle(700);
	});

	$(".send-discussion-btn").on("click",function(){
		var topic = $(this).parents(".send-discussion").siblings(".essay-title-editor").html();
		var opening = $(this).parents(".send-discussion").siblings(".editor").html();
		if(topic.length != 0 && opening.length != 0){
			$.ajax({
				url:"/addDiscussion",
				data:{
					topic:topic,
					opening:opening
				},
				type:"POST",
				dataType:"json",
				success:function(data){
					var temp = discussionTemplate(data);
					$(temp).hide().prependTo($("#discussion-wrapper")).slideDown("fast");
				}
			});
		}
	});
	
});