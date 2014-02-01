function hiLiTxt(qArr,text)
{
	if (text != undefined){
	    for(var i = 0;i <qArr.length;i++)
	    {
	        var patt = new RegExp(qArr[i],"gi");
	        text = text.replace(patt,function(match){
	            return "<strong>" + match + "</strong>";
	        })
	    }
	    
	}

	return text;	
}

$(function(){
	$("input.searchbar").keyup(function(){
	        var YAHOO = window.YAHOO = {Finance: {SymbolSuggest: {}}};
	        var s = $(this).val().trim();
	        if (s!=""){
	                var qArr = s.split(/\s+/);
	                YAHOO.Finance.SymbolSuggest.ssCallback = function (data) {
	                    $.ajax({
	                        url:"/suggest",
	                        type:"get",
	                        data:{
	                            q:qArr
	                        },
	                        dataType:"json",
	                        success:function(_data)
	                        {
	                            var template = "<ul class='suggest'><div class='stocks-sgest'><span class='cat'>Stocks</span>";
	                            for(var i = 0;i < data.ResultSet.Result.length;i++){
	  
	                            		console.log("symbol");
	                            		console.log(data.ResultSet.Result[i].symbol);
		                            	var symbol = data.ResultSet.Result[i].symbol;
		                            	var name = data.ResultSet.Result[i].name;
		                                var li = "<li><a href='/stock?t=" + symbol + "'>" + hiLiTxt(qArr,symbol) + 
		                                                     " (" + hiLiTxt(qArr,name) + ") " + 
		                                                     "</a></li>";
		                                template += li;
	                  
	                            }
	                            var users_length = _data.users.length;
	                            template += "</div><div class='users-sgest'><span class='cat'><a href='/search?t=users&q=" + s + "'>Found " + users_length + " users</a></span>";
	                            for(var i = 0;i < _data.users.length; i++){
			                            var li = "<li><a href='/user?id=" + _data.users[i]._id + "'>" + hiLiTxt(qArr,_data.users[i].fn) + 
			                                                 "</a></li>";
			                            template += li;
	                            }

	                          	var act_length = _data.activities.length;

	                            template += "</div><div class='posts-sgest'><span class='cat'><a href='/search?t=activities&q=" + s + "'>Found " + act_length + " posts</span></div></ul>";
	                            $(".suggestion-box").html(template);
	                        }
	                    })
	                }; 
	                 var url = [
	                    "http://d.yimg.com/autoc.finance.yahoo.com/autoc?",
	                    "query=" + s,
	                    "&callback=YAHOO.Finance.SymbolSuggest.ssCallback"];
	                $.getScript(url.join(""));
	        }else{
	        	$(".suggestion-box").html('');
	        }
	    });
});
