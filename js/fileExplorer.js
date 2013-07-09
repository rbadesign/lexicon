// handling document ready and phonegap deviceready
var fileExplorer = fileExplorer || {};

fileExplorer.deviceReadyDeferred = $.Deferred();
fileExplorer.jqmReadyDeferred = $.Deferred();

$.when(fileExplorer.deviceReadyDeferred, fileExplorer.jqmReadyDeferred).then(function() {
	console.log('when(deviceReadyDeferred, jqmReadyDeferred).then','start');
	$('#backBtn').hide();
	
	fileExplorer.getFileSystem();
	fileExplorer.clickItemAction();
	console.log('when(deviceReadyDeferred, jqmReadyDeferred).then','end');
});
$(document).one( 'pageinit',function(event){
	console.log('pageinit');
	fileExplorer.jqmReadyDeferred.resolve();
});

// Wait for Cordova to load
//
document.addEventListener("deviceready", onDeviceReady, false);


fileExplorer.root = null; // File System fileExplorer.root variable
fileExplorer.currentDir = null; // Current DirectoryEntry listed
fileExplorer.parentDir = null; // Parent of the current directory

fileExplorer.activeItem = null; // The clicked item
fileExplorer.activeItemType = null; // d-directory, f-file
fileExplorer.clipboardItem = null; // file or directory for copy or move 
fileExplorer.clipboardAction = null; // c-copy, m-move
 
// Phonegap is loaded and can be used
fileExplorer.onDeviceReady = function (){
	fileExplorer.deviceReadyDeferred.resolve();
}


/* get the fileExplorer.root file system */
fileExplorer.getFileSystem = function (){
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
		function(fileSystem){ // success get file system
			fileExplorer.root = fileSystem.fileExplorer.root;
			fileExplorer.listDir(fileExplorer.root);
		}, function(evt){ // error get file system
			console.log("File System Error: "+evt.target.error.code);
		}
	);
}


/* show the content of a directory */
fileExplorer.listDir = function (directoryEntry){
	if( !directoryEntry.isDirectory ) console.log('fileExplorer.listDir incorrect type');
	$.mobile.showPageLoadingMsg(); // show loading message
	
	fileExplorer.currentDir = directoryEntry; // set current directory
	directoryEntry.getParent(function(par){ // success get parent
		fileExplorer.parentDir = par; // set parent directory
		if( (fileExplorer.parentDir.name == 'sdcard' && fileExplorer.currentDir.name != 'sdcard') || fileExplorer.parentDir.name != 'sdcard' ) $('#backBtn').show();
	}, function(error){ // error get parent
		console.log('Get parent error: '+error.code);
	});
	
	var directoryReader = directoryEntry.createReader();
	directoryReader.readEntries(function(entries){
		var dirContent = $('#dirContent');
		dirContent.empty();
		
		var dirArr = new Array();
		var fileArr = new Array();
		for(var i=0; i<entries.length; ++i){ // sort entries
			var entry = entries[i];
			if( entry.isDirectory && entry.name[0] != '.' ) dirArr.push(entry);
			else if( entry.isFile && entry.name[0] != '.' ) fileArr.push(entry);
		}
		
		var sortedArr = dirArr.concat(fileArr); // sorted entries
		var uiBlock = ['a','b','c','d'];
		
		for(var i=0; i<sortedArr.length; ++i){ // show directories
			var entry = sortedArr[i];
			var blockLetter = uiBlock[i%4];
			//console.log(entry.name);
			if( entry.isDirectory )
				dirContent.append('<div class="ui-block-'+blockLetter+'"><div class="folder"><p>'+entry.name+'</p></div></div>');
			else if( entry.isFile )
				dirContent.append('<div class="ui-block-'+blockLetter+'"><div class="file"><p>'+entry.name+'</p></div></div>');
		}
		$.mobile.hidePageLoadingMsg(); // hide loading message
	}, function(error){
		console.log('fileExplorer.listDir readEntries error: '+error.code);
	});
}

/* read from file */
fileExplorer.readFile = function (fileEntry){
	if( !fileEntry.isFile ) console.log('fileExplorer.readFile incorrect type');
	$.mobile.showPageLoadingMsg(); // show loading message
	
	fileEntry.file(function(file){
		var reader = new FileReader();
		reader.onloadend = function(evt) {
            console.log("Read as data URL");
            console.log(evt.target.result); // show data from file into console
        };
        reader.readAsDataURL(file);
        
        $.mobile.hidePageLoadingMsg(); // hide loading message
        
        // dialog with file details
        $('#file_details').html('<p><strong>Name:</strong> '+file.name+
        						'</p><p><strong>Type:</strong> '+file.type+
        						'</p><p><strong>Last Modified:</strong> '+new Date(file.lastModifiedDate)+
        						'</p><p><strong>Size:</strong> '+file.size);
        $('#get_file_details').trigger('click');
	}, function(error){
		console.log(evt.target.error.code);
	});
}

/* open item */
fileExplorer.openItem = function (type){
	if( type == 'd' ){
		fileExplorer.listDir(fileExplorer.activeItem);
	} else if(type == 'f'){
		fileExplorer.readFile(fileExplorer.activeItem);
	}
}

/* get active item  */
fileExplorer.getActiveItem = function (name, type){
	if( type == 'd' && fileExplorer.currentDir != null ){
		fileExplorer.currentDir.getDirectory(name, {create:false},
			function(dir){ // success find directory
				fileExplorer.activeItem = dir;
				fileExplorer.activeItemType = type;
			}, 
			function(error){ // error find directory
				console.log('Unable to find directory: '+error.code);
			}
		);
	} else if(type == 'f' && fileExplorer.currentDir != null){
		fileExplorer.currentDir.getFile(name, {create:false},
			function(file){ // success find file
				fileExplorer.activeItem = file;
				fileExplorer.activeItemType = type;
			},
			function(error){ // error find file
				console.log('Unable to find file: '+error.code);
			}
		);
	}
}

/* get clipboard item for copy or move */
fileExplorer.getClipboardItem = function (action){
	if( fileExplorer.activeItem != null) {
		fileExplorer.clipboardItem = fileExplorer.activeItem;
		fileExplorer.clipboardAction = action;
	}
}

/* click actions */
fileExplorer.clickItemAction = function (){
	var folders = $('.folder');
	var files = $('.file');
	var backBtn = $('#backBtn');
	var homeBtn = $('#homeBtn');
	/* menu buttons */
	var menuDialog = $('#menuOptions');
	var openBtn = $('#openBtn');
	var copyBtn = $('#copyBtn');
	var moveBtn = $('#moveBtn');
	var pasteBtn = $('#pasteBtn');
	var deleteBtn = $('#deleteBtn');  
	
	folders.live('click', function(){
		var name = $(this).text();
		fileExplorer.getActiveItem(name, 'd');
		$('#menu').trigger('click'); // menu dialog box
	});
	
	files.live('click', function(){
		var name = $(this).text();
		fileExplorer.getActiveItem(name, 'f');
		$('#menu').trigger('click'); // menu dialog box
		// paste button always disabled for files
		pasteBtn.button('disable');
		pasteBtn.button('refresh');
	});
	
	backBtn.click(function(){ // go one level up
		if( fileExplorer.parentDir != null ) fileExplorer.listDir(fileExplorer.parentDir);
	});
	
	homeBtn.click(function(){ // go to fileExplorer.root
		if( fileExplorer.root != null ) fileExplorer.listDir(fileExplorer.root);
	});
	
	openBtn.click(function(){
		fileExplorer.openItem(fileExplorer.activeItemType);
		menuDialog.dialog('close');
	});
	
	copyBtn.click(function(){
		fileExplorer.getClipboardItem('c');
		menuDialog.dialog('close');
		pasteBtn.button('enable');
		pasteBtn.button('refresh');
	});
	
	moveBtn.click(function(){
		fileExplorer.getClipboardItem('m');
		menuDialog.dialog('close');
		pasteBtn.button('enable');
		pasteBtn.button('refresh');
	});
	
	pasteBtn.click(function(){
		if( fileExplorer.clipboardItem != null && fileExplorer.clipboardAction != null ){
			if(fileExplorer.clipboardAction == 'c'){ // copy item
				console.log('copy: '+fileExplorer.clipboardItem.name + ' to: '+fileExplorer.activeItem.name);
				fileExplorer.clipboardItem.copyTo(fileExplorer.activeItem,fileExplorer.clipboardItem.name,
					function(fileCopy){
						console.log('copy success! '+fileCopy.name);
						openBtn.trigger('click');
					}, function(error){
						console.log('copy error: '+error.code);
					}
				);
			} else if(fileExplorer.clipboardAction == 'm'){ // move item
				console.log('move: '+fileExplorer.clipboardItem.name + ' to: '+fileExplorer.activeItem.name);
				fileExplorer.clipboardItem.moveTo(fileExplorer.activeItem,fileExplorer.clipboardItem.name,
					function(fileCopy){
						console.log('move success! '+fileCopy.name);
						openBtn.trigger('click');
					}, function(error){
						console.log('move error: '+error.code);
					}
				);
			}
		}
	});
	
	deleteBtn.click(function(){
		if( fileExplorer.activeItem != null && fileExplorer.activeItemType != null){
			if(fileExplorer.activeItemType=='d'){
				fileExplorer.activeItem.removeRecursively(function(){
					console.log('removed recursively with success');
					menuDialog.dialog('close');
					fileExplorer.listDir(fileExplorer.currentDir);
				}, function(error){
					console.log('remove recursively error: '+error.code);
				});
			} else if(fileExplorer.activeItemType=='f'){
				fileExplorer.activeItem.remove(function(){
					console.log('removed recursively with success');
					menuDialog.dialog('close');
					fileExplorer.listDir(fileExplorer.currentDir);
				}, function(error){
					console.log('remove recursively error: '+error.code);
				});
			}
		}
	});
}
