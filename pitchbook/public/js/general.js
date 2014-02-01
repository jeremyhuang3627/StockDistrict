var yqlURL="http://query.yahooapis.com/v1/public/yql?q=";
var dataFormat="&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";

function updateWatchList(){
        console.log("update function called");
        if ($(".stock-item").length != 0){
            $(".stock-item").each(function(i){
                var item = $(this);
                var symbol = $(this).find(".symbol").text();
                var realtimeQ = yqlURL+"select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22" + symbol + "%22)%0A%09%09&"+ dataFormat;
                $.getJSON(realtimeQ, function(json) {//YQL Requesthttp://stackoverflow.com/questions/1520178/jquery-using-append-with-effects?answertab=votes#tab-top
                    console.log(json);
                    var symbol = json.query.results.quote.symbol;
                    var bid = json.query.results.quote.BidRealtime;
                    var ask = json.query.results.quote.AskRealtime;
                    var change = json.query.results.quote.ChangeinPercent;
                    var vol = json.query.results.quote.Volume;
                    item.find(".bid").html(bid);
                    item.find(".ask").html(ask);
                    item.find(".change").html(change);
                    item.find(".vol").html(vol);
                });
            })
        }
    };

function validateEmail(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
} 

function OpenInNewTab(url)
{
  var win=window.open(url, '_blank');
  win.focus();
}

function attach(data_type,p,pre_p,option){ // helper function for attachStatus
    if (data_type == "like" || data_type == "comment" || data_type == "share" || data_type == "pitch"){
        if (option == "prepend")
        {   
            $(p).hide().prependTo('#post-wrapper').slideDown("fast",function(){
                collapseTxt.call($(this));
                $(pre_p).hide().prependTo('#post-wrapper').slideDown("fast");
                            });
        }else if(option=="append"){
            $(pre_p).hide().appendTo('#post-wrapper').slideDown("fast",function(){
                $(p).hide().appendTo('#post-wrapper').slideDown("fast",function(){
                    collapseTxt.call($(this));
                        });
            });
        }
    }else if(data_type == "delete_stock" || data_type == "add_stock")
    {
        if (option == "prepend")
        {   
            $(pre_p).hide().prependTo('#post-wrapper').slideDown("fast");
        }else if(option=="append"){
            $(pre_p).hide().appendTo('#post-wrapper').slideDown("fast");
        }
    }else if(data_type == "publish")
    {
        if (option == "prepend")
        {   
            $(p).hide().prependTo('#post-wrapper').slideDown("fast",function(){
                collapseTxt.call($(this));
            });
        }else if(option=="append"){
            $(p).hide().appendTo('#post-wrapper').slideDown("fast",function(){
                collapseTxt.call($(this));
            });
        }
    }
}


function pre_pTemplate(activity_id,image_dir,user_id,user_fn,type,message){
    var pre_p = '<div class="post pre_post">' +
                    '<div class="header-pic">' + 
                        '<img src="' + image_dir + '" class="shadow">' + 
                    '</div>' + 
                    '<div class="status" id="' + activity_id + '" data-type="' + type+'">' +
                    '<div class="post-owner">' + 
                        '<a href="/user?' + user_id +'">' + user_fn +'</a>' +
                         message +
                    '</div>' + 
                '</div>';
    return pre_p;
}

function postTemplate(data,insert,comments)
{
    var post = '<div class="post full_post">\
                    <div class="header-pic">\
                        <img src="' + data.user_image_dir_resized + '" class="shadow">\
                    </div>\
                    <div class="status" id="' + data._id + '" data-type="' + data.type +'">\
                        <div class="post-owner">\
                            <a href="/user?' + data.origin_user_id +'">' + data.origin_user_fn +'</a>\
                        </div>\
                        <div class="post-body wrapword">'+
                            insert + 
                        '</div>\
                        <div class="expand">\
                            <a>Expand</a>\
                        </div>\
                        <div class="collapse">\
                            <a>Collapse</a>\
                        </div>\
                        <div class="meta">\
                            <div class="time-stamp">\
                                <span>' + data.time_stamp + '</span>\
                            </div>\
                            <div class="ops">\
                                <a class="share-post">Share</a>\
                                <a class="comment">Comment</a>\
                                <a class="like">Like</a>\
                                <a class="fav">Add to Favorites</a>\
                            </div>\
                        </div>\
                        <div class="comments-append">\
                            <ul>'+ comments +'</ul>\
                        </div>\
                        <div style="display:none;" class="comment-box-wrapper">\
                            <div class="input-wrapper">\
                                <textarea placeholder="Leave a comment" class="comment-box"></textarea>\
                            </div>\
                            <div class="msg-controls">\
                                <a class="ticker">\
                                    <!-- overlay with #b0b0b0-->\
                                    <img src="/images/icons/png/ticker.png">\
                                </a>\
                                <a class="sticker">\
                                    <img src="/images/icons/png/pitch.png">\
                                </a>\
                                <a class="tag">\
                                    <img src="/images/icons/png/add_user.png">\
                                </a>\
                                <button class="btn btn-info send-comment">send</button>\
                            </div>\
                        </div>\
                    </div>\
                </div>';
    return post;
}

function attachStatus(data,option){
    var insert_pre = "";
    var insert = "";
    var comments = "";

    switch(data.type){
        case "comment":
            insert_pre = " commented on this";
            insert = data.post.body;
            for(var i = 0;i<data.post.comments.length;i++)
            {
                comments += commentTemplate(data.user_id,data.user_fn,data.post.comments[i].body);
            }
            break;
        case "like":
            insert_pre = " liked this";
            insert = data.post.body;
            for(var i = 0;i<data.post.comments.length;i++)
            {
                comments += commentTemplate(data.user_id,data.user_fn,data.post.comments[i].body);
            }
            break;
        case "share":
            insert_pre = " shared this";
            insert = data.post.body;
            for(var i = 0;i<data.post.comments.length;i++)
            {
                comments += commentTemplate(data.user_id,data.user_fn,data.post.comments[i].body);
            }
            break;
        case "delete_stock":
            insert_pre = " removed " + data.stock + " from watchlist";
            break;
        case "add_stock":
            insert_pre = " added " + data.stock + " into watchlist";
            break;
        case "publish":
            insert = data.post.body;
            break;
        case "pitch":
            insert_pre = " gave a pitch";
            insert = data.post.body;
            break;
    }
    var pre_p = pre_pTemplate(data._id,data.user_image_dir_resized,data.user_id,data.user_fn,data.type,insert_pre);
    var p = postTemplate(data,insert,comments);
    attach(data.type,p,pre_p,option);
}

function commentTemplate(user_id,user_fn,comment){  // data should be activity
    var template = "<li>\
                    <div class='comment-append-pic'>\
                        <img src='/images/icons/png/avatar.png' class='shadow'>\
                    </div>\
                    <div class='comment-append-wrapper'>\
                        <div class='comment-owner'>\
                            <span id='"+ user_id +"'>"+ user_fn +"</span>\
                        </div>\
                        <div class='comment-body'>\
                            <span>"+ comment +"</span>\
                        </div>\
                    </div>\
                </li>";
    return template;
}

function collapseTxt(){
    console.log("collapseTxt called");
    var post = this;
    var offsetHeight = post.find(".post-body")[0].offsetHeight;
    var scrollHeight = post.find(".post-body")[0].scrollHeight;
    if (offsetHeight < scrollHeight)
    {
        this.find(".expand").css("display","block");
    }
}

$(function(){

    $(".contactFormLink").on("click",function(){
        $("#contact-form").slideToggle("fast");
    });

    $(".close-contact-form").on("click",function(){
        $(this).parent("#contact-form").slideUp("fast");
    });

    $(".contactForm button").on("click",function(e){
        e.preventDefault();
        var feedback = $(".contactForm textarea").val();
        console.log("feedback" + feedback );
        if (feedback.length !=0)
        {
            $(".contactForm").ajaxSubmit({
                dataType:"text",
                beforeSend:function(){
                    $(".contactForm .ajax-loader").fadeIn("fast");
                },
                success:function(data){
                    if (data == "success"){
                        $(".contactForm .ajax-loader").fadeOut("fast",function(){
                            $("#contact-form").slideUp("fast");
                        });
                    }
                }
            });
        }else{
            $("#contact-form .response").html("<p>Well.. the feedback is empty.</p>");
        }
    });

    $(".post").each(function(){
        collapseTxt.call($(this));
    });

    var interval = 1000 * 10; 
    updateWatchList();// interval is in milli seconds.
    setInterval(updateWatchList, interval);

    var currMousePos = { x: -1, y: -1 };
    $(document).on("mouseenter",".symbol,.ticker",function(e){
        currMousePos.x = event.clientX;
        currMousePos.y = event.clientY;
        var obj = {"top":currMousePos.y + 8,"left":currMousePos.x + 8,"z-index":10,"display":"block"}; 
        var patt = new RegExp("\\$","g");
        var ticker = $(this).html().replace(patt,"");
        var yahooChartUrl = "http://chart.finance.yahoo.com/z?s="+ticker+"&t=6m&q=l&l=on&z=s&p=m50,m200";
        var yhooUrl = "http://finance.yahoo.com/q?s="+ticker;
        var gglUrl = "http://www.google.com/finance?q=" + ticker;
        var skAlphaUrl = "http://seekingalpha.com/symbol/"+ticker;
        var nasdaq = "http://www.nasdaq.com/symbol/" + ticker;
        var innerTemplate ='<div class="stock-links">'+
                               '<div class="des">'+
                                    '<span>Look up ' + ticker +' in: </span>' +
                                '</div>'+
                                '<div class="yahoo-google">'+
                                    '<a href="'+ yhooUrl +'" target="_blank">Yahoo Finance</a>'+
                                    '<a href="'+ gglUrl +'" target="_blank">Google Finance</a>'+
                                '</div>'+
                                '<div class="ska-ndq">'+
                                    '<a href="'+ skAlphaUrl +'" target="_blank">Seeking Alpha</a>'+
                                    '<a href="'+ nasdaq +'" target="_blank">Nasdaq.com</a>'+
                                '</div>'+
                            '</div>' +
                            '<div class="chart">'+
                                 '<img src="'+yahooChartUrl+'">' +  
                            '</div>';
        $(".tooltip-info-box").html(innerTemplate).css(obj);
    });

    var timer;
    $(document).on("mouseleave",".symbol,.ticker,.tooltip-info-box",function() {
            timer=setTimeout("$('.tooltip-info-box').fadeOut('fast');",1000);
    });

    $(document).on("mouseenter",".symbol,.ticker,.tooltip-info-box",function() {
            clearTimeout(timer);
    });

    $("body").on("click","span.symbol",function(){
        var ticker = $(this).html();
        window.location.replace("http://localhost:3000/stock?t=" + ticker);
    });
    
    $('#post-wrapper').on('click','.comment',function(e){
        e.preventDefault();
        var box = $(this).parents(".meta").siblings(".comment-box-wrapper");
        if (box.css("display")=="none"){
            box.slideDown("fast");
        }else{
            box.slideUp("fast");
        }
    });

    $('#post-wrapper').on("click",".expand a",function(e){
        e.preventDefault();
        $(this).parents(".expand").css("display","none").siblings(".post-body").css({"max-height":"none"}).siblings(".collapse").css("display","block");
    })

    $('#post-wrapper').on("click",".collapse a",function(e){
        e.preventDefault();
        $(this).parents(".collapse").css("display","none").siblings(".post-body").css({"max-height":"200px"}).siblings(".expand").css("display","block");
    })

    $('#post-wrapper').on('click','.share-post',function(e){
        e.preventDefault();
        $(this).html("Shared");
        var _activity_id = $(this).parents(".status").attr("id");
        $.ajax({
            url:"/sharePost",
            type:"POST",
            data:{
                activity_id : _activity_id
            },
            dataType:"json",
            success:function(data){
                console.log("shared data");
                console.log(data);
                attachStatus(data,"prepend");
            }
        });
    });
    
    $('input.add-stock-bar,input.add-stock-in-text-bar').autocomplete({
    source: function (request, response) {
        // faking the presence of the YAHOO library bc the callback will only work with
        // "callback=YAHOO.Finance.SymbolSuggest.ssCallback"
        var YAHOO = window.YAHOO = {Finance: {SymbolSuggest: {}}};
        YAHOO.Finance.SymbolSuggest.ssCallback = function (data) {
            var mapped = $.map(data.ResultSet.Result, function (e, i) {
                return {
                    label: e.symbol + ' (' + e.name + ')',
                    value: e.symbol
                };
            });
            response(mapped);
        }; 
        var url = [
            "http://d.yimg.com/autoc.finance.yahoo.com/autoc?",
            "query=" + request.term,
            "&callback=YAHOO.Finance.SymbolSuggest.ssCallback"];
        $.getScript(url.join(""));
    },
    minLength: 2
    });

    $('#post-wrapper').on('click','a.like',function(){
        $(this).html('Liked');
        var _activity_id = $(this).parents(".status").attr("id");
        $.ajax({
            url:"/like",
            type:"POST",
            data:{
                activity_id : _activity_id
            },
            dataType:"json",
            success:function(data){
                console.log("liked");
                //attachStatus(data,"prepend");
            }
        });
    });


    $('#post-wrapper').on('click','a.fav',function(){
        $(this).html('Added');
        var _activity_id = $(this).parents(".status").attr("id");
        $.ajax({
            url:"/addFav",
            type:"POST",
            data:{
                activity_id : _activity_id
            },
            dataType:"json",
            success:function(data){
                console.log(data);
            }
        });
    });

    $('#post-wrapper').on('click','button.send-comment',function(){
        var btn = $(this); 
        var _activity_id = btn.parents(".status").attr("id");
        var _cmt = btn.parent().siblings(".input-wrapper").children(".comment-box").val();  
        $.ajax({
            url:"/commentHandler",
            type:"POST",
            data:{
                cmt:_cmt,
                activity_id:_activity_id
            },
            dataType:'json',
            success:function(data){
            var comments = data.post.comments;
            console.log(comments);
            var template = commentTemplate(data.user_id,data.user_fn,comments[comments.length-1].body);
            $(template).hide().appendTo(btn.parents(".comment-box-wrapper").siblings(".comments-append").children("ul")).slideDown("fast");
            }
        });
    });
    
    $('button.send,button.send-essay').on('click',function(){
        var classArr = $(this).attr("class").split(" ");

        if (classArr[classArr.length-1] =="send"){
        var txt =  $('.msg').text().trim();
        }else{
        var title = $(this).parent(".send-essay").siblings(".essay-title-editor").html();
        var txt = $(this).parent(".send-essay").siblings(".editor").html().trim();
        txt = "<span class='essay-title'>" + title + "</span><br ><br >" + txt;  
        }
        if (txt.length>0){
           $.ajax({
            url: '/msgHandler',
            type:'POST',
            data:{
                type:"publish",
                msg:txt
            },
            dataType:'json',
            success:function(data){
                attachStatus(data,"prepend");
            }
          });
        }
    });
});
