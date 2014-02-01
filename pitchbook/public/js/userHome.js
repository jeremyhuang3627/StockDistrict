function showMsg(unreadActivities)
{
    $("#news-feed-notification").fadeIn().find(".unreadMsg").html(" You have " + unreadActivities.length+ " unread News.");
}

function userLinkTemp(user){
     var template = '<div class="user-link">' + 
                                '<div id="' + user._id + '" class="name">'+
                                    '<div class="user-img">'+
                                        '<img src="' + user.image_dir_resized + '" class="shadow">' + 
                                    '</div>' + 
                                    '<div class="user-info">'+
                                        '<div class="user-fn">' + 
                                        '<span>' + user.fn + '</span>'+
                                        '</div>' + 
                                        '<div class="user-rep">' +
                                            '<span class="rep">Rep ' + user.popularity + '</span>' + 
                                        '</div>' + 
                                    '</div>'+
                                '</div>'+
                                '<button class="btn btn-info follow">follow</button>' + 
                            '</div>';
        return template;
}

function getNewUsers()
{
    console.log("getting new users");
    $.ajax({
        url:"/getNewUsers",
        type:"GET",
        dataType:"json",
        beforeSend:function(){
            $("#social-box .ajax-loader").show();
        },
        success:function(data)
        {
            var template = "";
            for(var i=0;i<data.length;i++)
            {
                template += userLinkTemp(data[i]);
            }
            $("#social-box .ajax-loader").hide();
            $("#social-box .users-wrapper").html(template);
        }
    })
}

$(function(){
    var unreadActivities = [];
	var user_fn = $(document).find("#profile a.username span").text();
    var user_id = $("a.username").attr("id");
    socket.emit("addUser",{uid:user_id});
    socket.on('news', function (data) {
        unreadActivities.push(data);
        showMsg(unreadActivities);
    });
    socket.on('rep_update',function(notification){
        switch(notification.type){
            case "rep_up":
                var rep = $(".reputation span.count").html();
                $(".reputation span.count").html(parseInt(rep,10) + notification.amount);
                break;
        }
    });

    setInterval(getNewUsers,60 * 5 * 1000);

    $("#news-feed-notification").on("click",function(){
        for(var i=0;i<unreadActivities.length;i++)
        {
            var data = unreadActivities.shift();
            attachStatus(data,"prepend");
        }
        $(this).fadeOut().find(".unreadMsg").html("");
    });

	//infinite loading
    var disTraveled = 0;
    var loadComplete = false;
    window.onscroll = function(){
        var currDis = $(document).scrollTop() + $(window).height();
        if (currDis>disTraveled){
            var height = $(document).height();
            var ratio = currDis/height;
            console.log("ratio " + ratio);
            disTraveled = currDis;
            if (ratio > 0.95 && !loadComplete){
                console.log("autoloading");
                var _lastTimeStamp = $(".post").find(".time-stamp span").last().text();
                $.ajax({
                    url:"/scrollLoad",
                    type:"POST",
                    data:{
                        lastTimeStamp:_lastTimeStamp 
                    },
                    dataType:"json",
                    success:function(data){
                        alert("load success !");
                        if (data.length != 0){
                            console.log(data);
                            for (var i = 0;i<data.length;i++){
                                attachStatus(data[i],"append");
                            }
                        }else{
                            loadComplete = true;
                        }
                    }
                });
            }
        }
    };
})