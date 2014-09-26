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
	'shadow-mapping.html?t=6600',
	'shadow-mapping.html?t=6600&choke=webgl_depth_texture',

	'float-texture-color.html?t=6600',
	'float-texture-color.html?t=6600&choke=oes_texture_float',
	'float-texture-color.html?t=6600&choke=oes_texture_half_float',
	'float-texture-color.html?t=6600&choke=oes_texture_float,oes_texture_half_float',

	'float-texture.html?t=6600',
	'float-texture.html?t=6600&choke=oes_texture_float',
	'float-texture.html?t=6600&choke=oes_texture_half_float',
	'float-texture.html?t=6600&choke=oes_texture_float,oes_texture_half_float',

	'hdr-colors.html?t=500',
	'hdr-colors.html?t=500&choke=oes_texture_float',
	'hdr-colors.html?t=500&choke=oes_texture_half_float',
	'hdr-colors.html?t=500&choke=oes_texture_float,oes_texture_half_float',
];

var myIframe = createIframe();
var testResults = [];

var dumpImage = function() {
	var canv = myIframe.contentWindow.document.body.getElementsByTagName('canvas')[0];
	var imData = canv.toDataURL('image/png');

	var gl = myIframe.contentWindow.gl;
	testResults.push({
		log: myIframe.contentWindow.log,
		implementationValues: gl.getImplementationValues(),
		imageData: imData,
	});

	if(i < sequence.length) {
		reloadIframe(myIframe, sequence[i]);
	//	setTimeout(dumpImage, 10);
	}

	if(i == sequence.length) {
		done();
	}

	i++;
}

var i = 1;
reloadIframe(myIframe, sequence[0]);
myIframe.addEventListener('load', function() {
	setTimeout(dumpImage, 10);
});

function done() {
	console.log('Test run done, removing iframe');
	destroyIframe(myIframe);
	
	console.log('Test run data', testResults);

	var p = document.createElement('p');
	p.innerHTML = 'Test run was successful!'
	document.body.appendChild(p);

	var im;
	for(var i = 0; i < testResults.length; i++) {
		im = new Image();
		im.src = testResults[i].imageData;
		im.width = 128;
		im.height = 128;
		im.className = 'pancake-ocean image-' + (i - 1);
		document.body.appendChild(im);
	}
}
