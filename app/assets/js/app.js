const electron = require('electron');
const remote = electron.remote;
const win = remote.getCurrentWindow();
const { ipcRenderer } = electron;


	
$( document ).ready(function() {
	
	$( "#app-close" ).click(function() { closeWindow() });

	$( ".tab-button" ).click(function() {
		let el = $( this );
		$( ".tab-button" ).removeClass("active");
		el.addClass("active");

		let callback = null;
		//Which callback call ?
		switch(el.attr("data-tab")) {
			case "ftp" :
				callback = bindFTPContent();
				break;
		}

		//Clear content and display new one, and call callback when successfully displayed
		$("#content-displayer").empty();
		$("#content-displayer").load("assets/views/" + el.attr("data-tab") + ".html", callback);
		
	});





});

function closeWindow() { win.close(); }

