function getNews(){
	console.log("getNews function called ");
	$.ajax({
		url:'/getNews',
		type:'POST',
		dataType:'xml',
		success:function(data){
			alert('data');
			var newsJSON = $.xml2json(data);
			console.log(newsJSON);
			var template = "";
			for(var prop in newsJSON.channel.item){
				if (newsJSON.channel.item.hasOwnProperty(prop)){
					var title = newsJSON.channel.item[prop].title;
					var link = newsJSON.channel.item[prop].link;
					var des = newsJSON.channel.item[prop].description;
					var pubDate = newsJSON.channel.item[prop].description;
					template += "<li><a href='"+link+"'>"+title+"</a><li>";
				}
			}
			$(".col1 ul").append(template);
		},
		error:function(err){
			console.log(err);
		}
	})
}

$(function(){
	getNews();
	var interval = 1000 * 10; 
    setInterval(getNews, interval);
});