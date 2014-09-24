'use strict';


function createIframe(src) {
	var iframe = document.createElement('iframe');
	iframe.width = 512;
	iframe.height = 512;

	iframe.src = src;

	document.body.appendChild(iframe);

	return iframe;
}

function reloadIframe(iframe, src) {
	iframe.src = src;
}

function destroyIframe(iframe) {
	document.body.removeChild(iframe);
}

// ----------------------------------------------------------


var sequence = [
	'shadow-mapping.html?t=4000',
	'shadow-mapping.html?t=4000',
	'shadow-mapping.html?t=4000',
	'shadow-mapping.html?t=4000&webgl_depth_texture=0',
	'shadow-mapping.html?t=4000&webgl_depth_texture=1',
	'shadow-mapping.html?t=4000',
	'shadow-mapping.html?t=4000',
	'shadow-mapping.html?t=4000',
	'shadow-mapping.html?t=4000&webgl_depth_texture=0',
	'shadow-mapping.html?t=4000&webgl_depth_texture=1',
	'shadow-mapping.html',
];

var myIframe = createIframe();

var dumpImage = function() {
	var im = new Image();
	im.src = myIframe.contentWindow.document.body.getElementsByTagName('canvas')[0].toDataURL('image/png');
	im.width = 128;
	im.height = 128;
	im.className = 'pancake-ocean image-' + (i - 1);
	document.body.appendChild(im);
	
	if(i < sequence.length) {
		reloadIframe(myIframe, sequence[i]);
	//	setTimeout(dumpImage, 10);
	}

	i++;
}

var i = 1;
reloadIframe(myIframe, sequence[0]);
myIframe.addEventListener('load', function() {
	setTimeout(dumpImage, 10);
});
