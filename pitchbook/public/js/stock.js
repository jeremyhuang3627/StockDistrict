
google.load('visualization', '1', {'packages':['annotatedtimeline']});

function drawChart(_data) {
					convertData(_data);
					console.log("after conversion");
					console.log(_data);
			        var data = new google.visualization.DataTable();
			        data.addColumn('date', 'Date');
			        data.addColumn('number', 'Open');
			        data.addRows(_data);
			        var chart = new google.visualization.AnnotatedTimeLine(document.getElementById('chart_div'));
			        chart.draw(data, {displayAnnotations: true});
			      }

function convertData(_data){
	for(var i=0;i<_data.length;i++)
	{
		_data[i][0] = new Date(_data[i][0]);
	}
}

function getChart(_symbol){
    if ($("#chart_div").css("display")=="none"){
                $("#chart_div").slideDown("slow");
    }
    var img = "<img src='/images/icons/gif/ajax-loader.gif'>";
    $(img).appendTo($("#chart_div"));
    $.ajax({
        url:'/getChartData',
        type:'POST',
        data:{
            symbol:_symbol
        },
        dataType:"json",
        success:function(_data){
            console.log(_data);
            drawChart(_data);
        }
     });
}

function updateStockData(symbol){
    console.log("updating stock data");
    var infoBox = this;
    var yqlURL="http://query.yahooapis.com/v1/public/yql?q=";
    var dataFormat="&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";
    var realtimeQ = yqlURL+"select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22" + symbol + "%22)%0A%09%09&"+ dataFormat;
    $.getJSON(realtimeQ, function(json) {//YQL Requesthttp://stackoverflow.com/questions/1520178/jquery-using-append-with-effects?answertab=votes#tab-top
                    console.log(json);
                    var avgVol = json.query.results.quote.AverageDailyVolume;
                    var bookval = json.query.results.quote.BookValue;
                    var perChgMA50 = json.query.results.quote.PercentChangeFromFiftydayMovingAverage;
                    var perChgMA200 = json.query.results.quote.PercentChangeFromTwoHundreddayMovingAverage;
                    var MA50 = json.query.results.quote.FiftydayMovingAverage;
                    var MA200 = json.query.results.quote.TwoHundreddayMovingAverage;
                    var dividend_share = json.query.results.quote.DividendShare;
                    var peg = json.query.results.quote.PEGRatio;
                    var pe = json.query.results.quote.PERatio;
                    var ebitda = json.query.results.quote.EBITDA;
                    var eps = json.query.results.quote.EarningsShare;
                    var eps_curr_y_est = json.query.results.quote.EPSEstimateCurrentYear;
                    var eps_next_y_est = json.query.results.quote.EPSEstimateNextYear;
                    var eps_next_q_est = json.query.results.quote.EPSEstimateNextQuarter;
                    var dvd_date = json.query.results.quote.DividendPayDate;
                    var dvd_yld = json.query.results.quote.DividendYield;
                    var dvd_s = json.query.results.quote.DividendShare;
                    var market_cap = json.query.results.quote.MarketCapitalization;
                    var price_sales = json.query.results.quote.PriceSales;
                    var short_ratio = json.query.results.quote.ShortRatio;
                    var bid = json.query.results.quote.BidRealtime;
                    var ask = json.query.results.quote.AskRealtime;
                    var change = json.query.results.quote.ChangeinPercent;
                    var open = json.query.results.quote.Open;
                    var prev_close = json.query.results.quote.PreviousClose;
                    var price_book = json.query.results.quote.PriceBook;
                    var dayrange = json.query.results.quote.DaysRange;
                    var vol = json.query.results.quote.Volume;
                    var last_trading_date = json.query.results.quote.LastTradeDate;
                    var company = json.query.results.quote.Name;
                    infoBox.find(".ask").html(ask);
                    infoBox.find(".bid").html(bid);
                    infoBox.find(".company").html(company);
                    infoBox.find(".open .value").html(open);
                    infoBox.find(".prev-close .value").html(prev_close);
                    infoBox.find(".avg-vol .value").html(avgVol);
                    infoBox.find(".changeInPercentage .value").html(change);
                    infoBox.find(".last_trading_date .value").html(last_trading_date);
                    infoBox.find(".eps .value").html(eps);
                    infoBox.find(".dividend-share .value").html(dvd_s);
                    infoBox.find(".peg .value").html(peg);
                    infoBox.find(".pe .value").html(pe);
                    infoBox.find(".ebitda .value").html(ebitda);
                    infoBox.find(".eps_curr_y_est .value").html(eps_curr_y_est);
                    infoBox.find(".dvd-date .value").html(dvd_date);
                    infoBox.find(".dvd-yld .value").html(dvd_yld);
                    infoBox.find(".market-cap .value").html(market_cap);
                    infoBox.find(".price-sales .value").html(price_sales);
                    infoBox.find(".price-book .value").html(price_book);
                    infoBox.find(".eps_next_q_est .value").html(eps_next_q_est);
                    infoBox.find(".short-ratio .value").html(short_ratio);
                    infoBox.find(".perChg50MA .value").html(perChgMA50);
                    infoBox.find(".perChg200MA .value").html(perChgMA200);
                    infoBox.find(".dayrange .value").html(avgVol);
                    infoBox.find(".eps_next_y_est .value").html(eps_next_y_est);
                    infoBox.find(".MA50 .value").html(MA50);
                    infoBox.find(".MA200 .value").html(MA200);   
    });
}

$(function(){
    if ($(location).attr("pathname")=="/stock"){
        ticker = $(location).attr("href").split("=")[1];
        getChart(ticker);
        console.log("ticker " + ticker);
        updateStockData.call($(".stock-info"),ticker);
        var interval = 1000 * 1; 
        setInterval(function(){updateStockData.call($(".stock-info"),ticker)}, interval);
    };

    $('.getChart-btn').on("click",function(){

        console.log("this " + this);
        console.log("symbol " + $(this).parents("tr").find(".symbol").text());
        var _symbol = $(this).parents("tr").find(".symbol").text();
        getChart(_symbol);
    });
});