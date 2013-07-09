// JavaScript Document
var lexicon = lexicon || {};

function resizeEditor() {
	if (!lexicon.editor) return;
	var footer = document.getElementById("main-box-footer");
	var header = document.getElementById("main-box-header");
	lexicon.editor.resize( '100%', footer.offsetTop - header.offsetHeight);
}
			
$(document).on("pageinit","#editor",function (event) {
	
	lexicon.editor = CKEDITOR.replace( 'editor1', {
		resize_enabled : false,
		on : {
            instanceReady : function() {
				resizeEditor();
            }
        }
	});

	
	$(window).resize(function(event) {
		resizeEditor();
	});
});

// Wait for Cordova to load
//
document.addEventListener("deviceready", onDeviceReady, false);

// Cordova is ready
//
function onDeviceReady() {
	console.log('deviceready');
	document.addEventListener("backbutton", handleBackButton, false);
}

function handleBackButton() {
  	console.log("Back Button Pressed!");
    navigator.app.exitApp();
}