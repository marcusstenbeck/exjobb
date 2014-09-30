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

	myIframe.contentWindow.update(6600);
	myIframe.contentWindow.draw();
	var imData = myIframe.contentWindow.document.body.getElementsByTagName('canvas')[0].toDataURL('image/png');

	var gl = myIframe.contentWindow.gl;
	testResults.push({
		log: myIframe.contentWindow.log,
		implementationValues: gl.getImplementationValues(),
		imageData: imData,
	});

	if(i < sequence.length) {
		reloadIframe(myIframe, sequence[i]);
	}

	if(i == sequence.length) {
		done();
	}

	i++;
}

var i = 1;
reloadIframe(myIframe, sequence[0]);
myIframe.addEventListener('load', function() {
	dumpImage();
});

function done() {
	// Test run done, remove iframe
	destroyIframe(myIframe);
	
	var p = document.createElement('p');
	p.innerHTML = 'Test run was successful!'
	p.setAttribute('class', 'message-test-done')
	document.body.appendChild(p);

	var btnSave = document.createElement('button');
	btnSave.innerHTML = 'Save Results to Database';
	btnSave.setAttribute('class', 'btn-save');
	btnSave.addEventListener('click', function() {
		console.log('BOOOH-YUUHHHUUAAAHHHH!!!');
		console.log('Test run data', testResults);
	});
	document.body.appendChild(btnSave);


	var im;
	for(var i = 0; i < testResults.length; i++) {
		createImage(testResults[i].imageData);
	}
}

function createImage(src) {
	var im = new Image();
	im.src = src;
	im.width = 128;
	im.height = 128;
	document.body.appendChild(im);
}
