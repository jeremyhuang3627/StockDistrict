function setEndOfContenteditable(contentEditableElement)
{
    var range,selection;
    if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
    {
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
    }
    else if(document.selection)//IE 8 and lower
    { 
        range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
        range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        range.select();//Select the range (make it the visible selection
    }
}

function restoreSelection(range){
    var selection = window.getSelection();
    if (range) {
        try {
            selection.removeAllRanges();
        } catch (ex) {
            document.body.createTextRange().select();
            document.selection.empty();
        }
        selection.addRange(range);
    }
}

$(function(){
    $('.tabs').tabslet();
    $(".overlay").on("click",function(){
        $(this).fadeOut("fast");
    });  

    $("a.image").on("mousedown",function(e){
        e.preventDefault();
    });

    $("#imageInput").on("change",function(e){
        $("form.imageForm").ajaxSubmit({
            url:"/imageUpload",
            dataType:"json",
            success:function(data){
                document.execCommand("insertImage",false,data.resizedPicPath);
                $("img[src='" + data.resizedPicPath + "']").wrap("<a rel='prettyPhoto' href='"+ data.originPicPath +"'></a>").prettyPhoto();
            }
        });
    })

    $(".msg,.editor,.essay-title-editor,.pitch-editor,.pitch-stock").essay_editor();
    $(".essay-box,.pitch-box").draggable({cancel:".editor,.essay-title-editor"}).resizable();
    $(".pitch-box").draggable({cancel:".pitch-editor,.pitch-editor-wrapper,.pitch-stock"}).resizable();
    $(".stock-picker").find(".add-stock-in-text-bar").keyup(function(e){
            console.log(e.keyCode);
            if(e.keyCode == 13 )
            {   
                console.log("clicking");
                $(".add-stock-in-text").click();
            }else if(e.keyCode == 38 && $(".stock-picker").find("input").is(":focus"))
            {
                console.log("going back to msg");
                var originRange = $(".stock-picker").data().originRange;
                console.log(originRange);
                restoreSelection(originRange);
            }
    });

    $(".stock-picker").find(".add-stock-in-text").on("click",function(){
            var val = $("input.add-stock-in-text-bar").val();
            var originRange = $(".stock-picker").data().originRange;
            console.log("before range");
            console.log(originRange);
            var startOffset = originRange.startOffset;
            var node = originRange.commonAncestorContainer;
            originRange.commonAncestorContainer.nodeValue +=  val + "$";
            originRange.setStart(node,startOffset+val.length+1);
            originRange.collapse(true);
            restoreSelection(originRange);
        if($(".stock-picker").css("display")!="none"){
            $(".stock-picker").fadeOut("fast").find("input").val("");
        }
    });

    $(".close-editor-wrapper").on("click",function(){
        $(".editor-box").fadeOut("fast");
    });

    $('a.essay').on('click',function(e){
        e.preventDefault();
        var txt = $(this).parents(".msg-controls").siblings(".msg-wrapper").children(".msg").text();
        $(".essay-box").fadeIn("fast").css("z-index","9").find(".editor").text(txt).focus();
    });

    $('a.pitch').on('click',function(e){
        e.preventDefault();
        $(".pitch-box").fadeIn("fast").css("z-index","9").find(".pitch-stock").focus();
    });

    $('button.send-pitch').on('click',function(e){
        var txt = "";
        var _stock = $(this).parent(".send-pitch").siblings(".pitch-stock").html();
        $(this).parent(".send-pitch").siblings(".pitch-editor-wrapper").find(".tabs").children("div").each(function(){
            switch($(this).attr("id")){
                case "recommendation":
                    txt += "<div class='pitch-header'>Recommendation</div><br><br>" + $(this).html();
                    break;
                case "background":
                    txt += "<div class='pitch-header'>Company Background</div><br><br>" + $(this).html();
                    break;
                case "thesis":
                    txt += "<div class='pitch-header'>Investment Thesis</div><br><br>" + $(this).html();
                    break;
                case "catalysts":
                    txt += "<div class='pitch-header'>Catalysts</div><br><br>" + $(this).html();
                    break;
                case "valuation":
                    txt += "<div class='pitch-header'>Valuation</div><br><br>" + $(this).html();
                    break;
                case "risks":
                    txt += "<div class='pitch-header'>Risk Factors</div><br><br>" + $(this).html();
                    break;
            }
        });
        $.ajax({
            url:"/msgHandler",
            type:"POST",
            data:{
                type:"pitch",
                stock:_stock,
                msg:txt
            },
            dataType:"json",
            success:function(data){
                attachStatus(data,"prepend");
            }
        });
    });
});
