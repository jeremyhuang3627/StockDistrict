function getNews(_symbol)
{
    var temp = "<div class='header'><span class='symbol-news-box pointer'>" + _symbol + " news</span><span class='close-news-item pointer'>Close</span></div><div class='loader hori-margin-equal'><img src='/images/icons/gif/ajax-loader.gif'></div>";
    $(temp).appendTo($("#news-feed-box"));
    $.ajax({
        url:"/googleNews",
        type:"GET",
        data:{
            symbol:_symbol
        },
        dataType:"html",
        success:function(data){
            var iframe = $("<iframe>");
            iframe.append($(data));
            console.log("iframe");
            console.log(iframe[0]);
            var news = $(iframe[0]).find("#news-main .g-section");
            console.log("news");
            console.log(news);
            var newsItem = "<div class='news-item-wrapper hori-margin-equal'><ul>";
            for(var i = 0;i < news.length;i++)
            {
                newsItem += "<li><div class='news-item'>";
                newsItem += $(news[i]).html();
                newsItem += "</div></li>";
                console.log("news item " + i);
                console.log($(news[i]).find(".name").html());
            }
            newsItem += "</div></ul>";
            $(".loader").remove();
            $(newsItem).appendTo($("#news-feed-box")).vTicker({speed:100});  
        }
    });
}
    

$(function(){
    $("table.watch-list").on("click","span.del",function(){
        var popup = $(".popup").bPopup({
            fadeSpeed: 'fast',
            closeClass:'close-diag',
        });
        var thisSpan = $(this);
        var tr = thisSpan.parents(".stock-item");
        var tickerDel = tr.find("span.symbol").html();
        $.ajax({
                    url:"/deleteStock",
                    type:"POST",
                    data:{
                        stock:tickerDel
                    },
                    dataType:"text",
                    success:function(data){
                        tr.slideUp("fast");
                    }
                });
    });

    $('.add-stock').on('click',function(){
        var symbol = $('input.add-stock-bar').val();
        var realtimeQ = yqlURL+"select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22" + symbol + "%22)%0A%09%09&"+ dataFormat;
        $.ajax({
                url:'/addStock',
                data:{
                    stock: symbol
                },
                type:"POST",
                dataType:"json",
                success:function(data){
                    alert(data);
                }
        });
        var template = "<tr class = 'stock-item'><td><span class='symbol'>" + 
                        symbol + "</span></td><td><span class='bid'><img src='/images/icons/gif/ajax-loader.gif'>"+
                        "</span></td><td><span class ='ask'><img src='/images/icons/gif/ajax-loader.gif'></span></td><td><span class ='change' ><img src='/images/icons/gif/ajax-loader.gif'>" + 
                        "</span></td><td><span class = 'vol'><img src='/images/icons/gif/ajax-loader.gif'></span></td><td><span class='del'><img src='/images/icons/png/cross.png'></span></td><td><span class='news-popup'><img src='/images/icons/png/news.png'></span></td></tr>";
        $(template).appendTo('.watch-list');

 /*       $.getJSON(realtimeQ, function(json) {//YQL Requesthttp://stackoverflow.com/questions/1520178/jquery-using-append-with-effects?answertab=votes#tab-top
            console.log(json);
            var symbol = json.query.results.quote.symbol;
            var bid = json.query.results.quote.BidRealtime;
            var ask = json.query.results.quote.AskRealtime;
            var change = json.query.results.quote.ChangeinPercent;
            var vol = json.query.results.quote.Volume;
            
            $(template).appendTo('.watch-list');
            console.log("sending post request");
             
        });  */
    });

    $("table.watch-list").on("click",".news-popup",function(){
        var ticker = $(this).parents(".stock-item").find(".symbol").html();
        getNews(ticker);
    });

    $("#news-feed-box").on("click","a",function(e){
        e.preventDefault();
        var url = $(this).attr("href");
        window.open(url,"_blank");
    });

    $("#news-feed-box").on("click",".symbol-news-box",function(){
        var title = $(this).html();
        var content = $(this).parent(".header").next(".news-item-wrapper").html();
        $(".news-popup-box").fadeIn("fast").css("z-index","10").draggable().resizable().find(".news-content").html(content).end().find(".news-symbol ").html(title);
    });

    $("#news-feed-box").on("click",".close-news-item",function(){
        $(this).parent(".header").next(".news-item-wrapper").remove();
        $(this).parent(".header").remove();
    });

    $(".news-popup-box").on("click",".close-popup-box",function(){
            $(".news-popup-box").fadeOut("fast");
    });

    if ($(location).attr("pathname")=="/stock"){
        var ticker = $(location).attr("href").split("=")[1];
         getNews(ticker);
    }
});