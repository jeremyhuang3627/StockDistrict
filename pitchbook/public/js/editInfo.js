
$(function(){

	$(".password-change input").on("focus",function(){
		$(".password-change .server-msg").html("");
	})

	$(".save-info").on("click",function(){
		var _abt = $(".self_description_body textarea").val();
		var _name = $(".p-info-wrapper input.username").val();
		if (_name.length != 0){
			$.ajax({
				url:"/updateInfo",
				data:{
					abt:_abt,
					name:_name
				},
				beforeSend:function(){
					$("#block1.content-tab .ajax-loader").fadeIn("fast");
				},
				type:"POST",
				dataType:"json",
				success:function(data){
					console.log("data");
					console.log(data);
					$("#block1.content-tab .ajax-loader").fadeOut("fast",function(){
						if(data){
							$(".response").html("<p>You information has been saved.</p>");
						}else{
							$(".response").html("<p>Saving failure.</p>")
						}
					});
					
				}
			});
		}
	});

	$("button.pw-change").on("click",function(){
		var btn = $(this);
		var new_pass = $(".new_pw").val();
		var new_pass_repeat = $(".new_pw_repeat").val();
		var curr_pass = $(".curr_pw").val();

		$(".err-msg.new_password,.err-msg.new_password_repeat,.err-msg.current-password").html("");
		if(!new_pass){
			$(".err-msg.new_password").html("This part cannot be empty");
		}

		if (!new_pass_repeat){
			$(".err-msg.new_password_repeat").html("This part cannot be empty");
		}
				
		if(!curr_pass){
			$(".err-msg.current-password").html("This part cannot be empty");
		}

		if(new_pass != new_pass_repeat)
		{
			$(".err-msg.new_password").html("Passwords do not match");
		}else{
			$.ajax({
				url:"/changePassword",
				data:{
					oldPass:curr_pass,
					newPass:new_pass
				},
				type:"POST",
				dataType:"text",
				success:function(data){
					if (data == "incorrect")
					{
						$(".err-msg.current-password").html("Password incorrect");
					}else if(data=="success"){
						$("<span>Successsful!</span>").hide().appendTo(".password-change .server-msg").fadeIn("slow");
					}
				}
			});
		}
	
	});
	
	$("button.pw-reset").on("click",function(e){
		var _email = $(".email").val().trim();
		if (validateEmail(_email))
		{
			$.ajax({
				url:"/forgetPassword",
				type:"POST",
				data:{
					email:_email,
				},
				dataType:"text",
				success:function(data){
					if(data == "success")
					{
						$("<span>Email sent !</span>").hide().appendTo(".password-reset .server-msg").fadeIn("slow");
					}
				}
			});
		}	
	});

	$(".password-reset input").on("focus",function(){
		$(".password-reset .server-msg").html("");
	})

	$(".email-input input").on("focus",function(){
		$(".email-input .server-msg").html("");
	})

	$(".email-change-btn").on("click",function(){
		var curr_pass = $(".email-change-pass").val();
		var email = $(".email-change-input").val();
		var ok = true;
		

		if(!curr_pass)
		{
			$(".err-msg.email-change-pass-err").html("This part cannot be empty.");
			ok = false;
		}

		if(!validateEmail(email))
		{
			$(".err-msg.email-change-err").html("This does not look like a valid email TT");
			ok = false;
		}

		if(ok){
			$.ajax({
				url:"/changeEmail",
				type:"POST",
				data:{
					password:curr_pass,
					email:email
				},
				dataType:"text",
				success:function(data){
					if(data == "success")
					{
						$("<p>Success!</p>").hide().appendTo($(".email-input .server-msg")).fadeIn("fast");
					}else if(data == "incorrect"){
						$(".err-msg.email-change-pass-err").html("Incorrect password");
					}
				}
			});
		}
	});

	$('.tabs').tabslet();
    Dropzone.options.myAwesomeDropzone = {
      paramName: "file", // The name that will be used to transfer the file
      maxFilesize: 2, // MB
      accept: function(file, done) {
        if (file.name == "justinbieber.jpg") {
          done("Naha, you don't.");
        }
        else { done(); }
      },
      dictDefaultMessage:"Drop your awesome profile pic here to upload",
      maxFiles:1,
      clickable:false,
      init: function(){
        this.on("addedfile", function(file) {  
            $(".dz-message").hide();
        });
      }
    };
});