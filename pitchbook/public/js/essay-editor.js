
(function($){
	$.fn.essay_editor = function(){
		var editor = this,
			selectedRange,
			default_options = {
				buttons:"a[data-edit]"
			},
			execCommand = function(cmd, args){
				var state = document.execCommand(cmd,false,args);
				console.log("executing command ");
				console.log(state);
			},
			getCurrentRange = function () {
				var sel = window.getSelection();
				if (sel.getRangeAt && sel.rangeCount) {
					return sel.getRangeAt(0);
				}
			},
			saveRange = function(){
				selectedRange = getCurrentRange();
			},
			showStockPicker = function(e){
				var content = selectedRange.commonAncestorContainer.parentElement.innerHTML;
				var parentElement = selectedRange.commonAncestorContainer.parentElement;
				var offset = selectedRange.getClientRects();
				sel = selectedRange.endOffset;
				var _data = {originRange:selectedRange, pElmt:parentElement};
				var left = offset[0].left;
		        var top = offset[0].top;
		        var prop = {"left":left,"top":top + 22};

		        if (content.slice(-1) == "$")
		        {
		            $(".stock-picker").css(prop).fadeIn("fast").css("z-index","10");
		            $(".stock-picker").data(_data);
		        }else if($(".stock-picker").css("display")!="none"){
		            $(".stock-picker").fadeOut("fast").find("input").val("");
		        }
		        
		        if ($(".stock-picker").css("display")!="none"){
		            if (e.keyCode == 40 )  // if down key was pressed
		            {
		                $(".stock-picker").find("input").focus();
		            }
		        }		
			};

		$(default_options.buttons).each(function(){
			var cmd = $(this).attr("data-edit");
			$(this).on("mousedown",function(e){
				e.preventDefault();
				execCommand(cmd,true);
				console.log("state is ")
				console.log();
				if(document.queryCommandState(cmd))
				{
					if(!$(this).hasClass("on")){
						$(this).addClass("on");
					}
				}else{
					if($(this).hasClass("on")){
						$(this).removeClass("on");
					}
				}
			});
		});
		
		editor.attr("contenteditable","true").on("keyup",function(e){
			saveRange();
			showStockPicker(e);
		});
		return editor;
	};
}(window.jQuery)); 