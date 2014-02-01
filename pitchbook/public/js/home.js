// js for the home/login page

$(function(){

    $(".login-btn").on("click",function(e){
        e.preventDefault();
        var email = $("input.login-user").val();
        var pass = $("input.login-pass").val();
        var ok = true;

        $(".login-email-err-msg,.login-pass-err-msg").html("");

        if(email.length == 0){
            $(".login-email-err-msg").html("<span>Email empty.</span>");
            ok = false;
        }else if(!validateEmail(email))
        {
            $(".login-email-err-msg").html("<span>Invalid email.</span>");
            ok = false;
        }

        if(pass.length == 0)
        {
            $(".login-pass-err-msg").html("<span>Password empty.</span>");
            ok = false;
        }

        if(ok){
            $(".loginform").submit();
        }

    });

    $(".signup-btn").on("click",function(){
        var fn = $("input.firstname").val();
        var ln = $("input.lastname").val();
        var email = $("input.signup-email").val();
        var pass = $("input.signup-pass").val();
        var ok = true;

        $(".err-msg").html("");

        if(fn.length == 0){
            $(".fn-input .err-msg").html("First name cannot be empty.");
            ok = false; 
        }

        if(ln.length == 0){
            $(".ln-input .err-msg").html("Last name cannot be empty.");
            ok = false;
        }

        if(email.length == 0){
            $(".email-input .err-msg").html("Email cannot be empty.");
            ok = false;
        }else if(!validateEmail(email)){
            $(".email-input .err-msg").html("This does not look like an email address :P");
            ok = false;
        }

        if(pass.length < 5)
        {
            $(".pw-input .err-msg").html("Password must be longer than 5 characters");
            ok = false;
        }

        if(ok)
        {
            $(".signup-form").ajaxSubmit({
                beforeSend:function(){
                    $(".signup-pb .ajax-loader").fadeIn("fast");
                    $(".server-res").html("");
                },
                dataType:"text",
                success:function(data){
                    $(".signup-pb .ajax-loader").fadeOut("fast",function(){
                        if(data == "email_sent"){
                            var msg = "<p style ='font-size:12px;'>An confirmation email has been sent to your email address.</p>";
                        }else if(data == "email_repeat"){
                            var msg = "<p style ='font-size:12px;'>This email has already been registered.</p>"
                        }
                        $(".server-res").html(msg);
                    });
                   
                }
            });
        }

    })
});