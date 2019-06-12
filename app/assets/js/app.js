"use strict";
const electron = require('electron');
const remote = electron.remote;
const win = remote.getCurrentWindow();
const { ipcRenderer } = electron;

let appData = null ;

	
$( document ).ready(function() {

	createAppData("index");
	
	$( "#app-close" ).click(function() { closeWindow() });

	$( ".tab-button" ).click(function() {
		let el = $( this );

		//Visual effect
		$( ".tab-button" ).removeClass("active");
		el.addClass("active");

		let tab = el.attr("data-tab");
		if(tab.localeCompare(appData["currentTab"]) == 0) return; //Requested tab is already displayed

		let callback = null;
		//Which callback call ?
		switch(tab) {
			case "ftp" :
				callback = bindFTPContent();
				break;
		}


		if(appData[tab] != null) {
		//There tab has already been created, we only get back the data and display it
			$("#content-displayer").html(appData[tab]).promise().done(callback);
			appData["currentTab"] = tab;
		} else {
		//There this tab has never been created, so we need to do it

			//Clear content and display new one, and call callback when successfully displayed
			saveAndClearContentDisplayer(tab);
			$("#content-displayer").load("assets/views/" + el.attr("data-tab") + ".html", callback);
		}


		
		
	});





});

function closeWindow() { win.close(); }

function createAppData(initialTab) {
	appData = new Object();
	appData["currentTab"] = initialTab;

	console.log(appData);
}

function saveAndClearContentDisplayer (newTab) {
	let el = $("#content-displayer");
	appData[appData["currentTab"]] = el.html(); //Save data into appData
	appData["currentTab"] = newTab;
	el.empty(); //Clear content
}