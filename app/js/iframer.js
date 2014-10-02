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
		url: myIframe.src,
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
	

	console.log(testResults);

	$('#test-run-and-done').show();

	$('#save-to-db').click(function() {

		console.log('Saving ' + testResults.length + ' results to database ...');

		$('html').addClass('is-uploading');
		saveResults(testResults);
	});



	var im;
	for(var i = 0; i < testResults.length; i++) {
		createImage(testResults[i].imageData);
	}
}

function saveResults(results) {
	if(results.length === 0) {
		console.log('Nothing left. Upload done.');
		$('html').removeClass('is-uploading');
		return;
	} else {
		console.log(results.length + ' left');
	}

	// Pop and save one of the results
	var result = results.pop();

	// Add comment
	result.comment = $('#input-comments').val();


	$.ajax({
			type: "POST",
			url: '/api/1/collect',
			data: JSON.stringify(result),
			contentType: 'application/json'
		})
	.done(function(response) {
			saveResults(results);
		})
	.fail(function(response, textStatus) {
			console.log('Failed. Canceling upload.');
			console.log(response, textStatus);
		});
}

function createImage(src) {
	var im = new Image();
	im.src = src;
	im.width = 128;
	im.height = 128;
	document.body.appendChild(im);
}
