function enableLoading(el) {
	stopLoading();
	el.append("<div id='loading'></div>");
	el.append("<div id='loading-transparant-bg'></div>")
}


function stopLoading() {
    $('#loading').remove();
    $('#loading-transparant-bg').remove();
}