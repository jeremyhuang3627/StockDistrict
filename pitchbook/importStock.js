var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var db = mongoose.connection;
var fs = require("fs");

var file = "ticker_list_m.csv";

var stockSchema = new Schema({
	tickers:[String]
});

mongoose.connect('mongodb://localhost/mydb');

fs.readFile(file,"utf8",function(err,data){
	if (err){
		return console.log("error " + err);
	}
	var _data = data.split("\n");
	var tickerObject = mongoose.model('stocks', stockSchema);
	var ticker = new tickerObject({tickers:_data});
	ticker.save(function (err, ticker,numberAffected){
  			if (err)
  			{
  				console.log(err);
  			}else{
  				console.log("success");
  				console.log(ticker);
  			}
  	});
});