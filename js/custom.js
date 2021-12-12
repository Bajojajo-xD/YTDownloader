/*
	Rocket Internet by TEMPLATE STOCK
    templatestock.co @templatestock
*/

fetch("https://raw.githubusercontent.com/Bajojajo-xD/YTDownloader/main/package.json")
  .then(response => response.json())
  .then(data => {document.getElementById("dwnld-ver").innerHTML = `Download version ${data.version} for:`;});

/* Header Full Screen */
$(document).ready(function() {
	$('#homeFullScreen').css({height:$(window).height(),width:$(window).width()});
	$(window).resize(function(){
        $('#homeFullScreen').css({height:$(window).height(),width:$(window).width()});
    });

});