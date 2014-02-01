//used in search.jade,follow.jade

$(function(){
	$(".follow-btn").on("click",function(){
		var userId = $(this).parents(".user-wrapper").attr("id");
		var btn = $(this);
		$.ajax({
	            url:"/follow",
	            type:"POST",
	            data:{
	                toFollowId:userId
	            },
	            dataType:"json",
	            success:function(data){
	                btn.text("followed");
	            }
	       });
	});

	$(".unfollow-btn").on("click",function(){
		var userId = $(this).parents(".user-wrapper").attr("id");
		var btn = $(this);
		$.ajax({
	            url:"/unfollow",
	            type:"POST",
	            data:{
	                unFollowId:userId
	            },
	            dataType:"text",
	            success:function(data){
	            	if(data == "success"){
	                	btn.text("unfollowed");
	                }
	            }
	       });
	});
});