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