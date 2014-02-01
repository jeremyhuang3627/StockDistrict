function updateHotStocks(data)
{
    var template = "<div class='hotStocks'><ul>";
    for(var i=0;i<data.length;i++)
    {
        template += "<li><div class='hot_stock'><div class='hot_stock_symbol'><span class='symbol'>" + data[i].symbol+ 
                    "</span></div><div class='hotness'>" + data[i].count + "</div></li>";
    }
    template += "</ul></div>";
    console.log("templatea");
    console.log(template);
    $(template).hide().appendTo($("#news-box")).fadeIn("fast");
}

$(function(){
    socket.emit("getStocksRank");
    socket.on("stocksRank",function(data){
        console.log(data);
        updateHotStocks(data.stocks_array);
    });

    $("button.follow").on("click",function(){
        var userId = $(this).siblings(".name").attr("id");
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
});