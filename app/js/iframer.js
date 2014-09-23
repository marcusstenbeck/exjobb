'use strict';

(function() {

	function createIframe() {
		var iframe = document.createElement('iframe');
		iframe.width = 512;
		iframe.height = 512;

		iframe.src = 'shadow-mapping.html';

		document.body.appendChild(iframe);

		return iframe;
	}

	function destroyIframe(iframe) {
		document.body.removeChild(iframe);
	}

	// ----------------------------------------------------------

	var myIframe = createIframe();

	
	setTimeout(function() {
		var im = new Image();
		im.src = myIframe.contentWindow.document.body.getElementsByTagName('canvas')[0].toDataURL('image/png');
		document.body.appendChild(im);
		//destroyIframe(myIframe);
	}, 3000);


}).call(this);