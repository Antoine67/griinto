const electron = require('electron');
const remote = electron.remote;
const win = remote.getCurrentWindow();
const { ipcRenderer } = electron;

//Webview loading
onload = () => {
	const webview = document.querySelector('webview')
	
	const loadstart = () => {
		enableLoading($("#content-displayer"))
	}

	const loadstop = () => {
		stopLoading($("#content-displayer"))
	}

	webview.addEventListener('did-start-loading', loadstart)
	webview.addEventListener('did-stop-loading', loadstop)
}
 
	
$( document ).ready(function() {
	
	$( "#app-close" ).click(function() { closeWindow() });

	$( ".tab-button" ).click(function() {
		let el = $( this );
		$( ".tab-button" ).removeClass("active");
		el.addClass("active");
	  });





});

function closeWindow() { win.close(); }

