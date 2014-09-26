'use strict';

var UP_VECTOR = vec3.fromValues(0, 1, 0);
var time = 0;
var overrideTime = getParameterByName('t') !== '' && +getParameterByName('t') ? +getParameterByName('t') : undefined;
var webglProfile = getChoke();


function getChoke() {
	var str = getParameterByName('choke');
	if(!str) return;
	
	var toChoke = str.split(',')

	var profile = {};
	for (var i = toChoke.length - 1; i >= 0; i--) {
		var key = toChoke[i].split(':')[0].toUpperCase();
		var value = +toChoke[i].split(':')[1] || false;
		
		profile[key] = value;
	};
	
	return profile;
}

// http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}


function bindScene(gl, shader, vData) {

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vData.vertices), gl.STATIC_DRAW);
	
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(vData.indices), gl.STATIC_DRAW);
	
	var FLOAT_WIDTH = 4;
	var theStride = (3+2+3) * FLOAT_WIDTH; // lol hardcode much lol
	
	shader.attribute.aVertexPosition = gl.getAttribLocation(shader.program, 'aVertexPosition');
	shader.attribute.aVertexTexCoord = gl.getAttribLocation(shader.program, 'aVertexTexCoord');
	shader.attribute.aVertexNormal = gl.getAttribLocation(shader.program, 'aVertexNormal');
	

	if(shader.attribute.aVertexPosition != -1) {
		gl.enableVertexAttribArray(shader.attribute.aVertexPosition);
		gl.vertexAttribPointer(
			shader.attribute.aVertexPosition,
			3,
			gl.FLOAT,
			false,
			theStride,
			0
		);
	}
	
	if(shader.attribute.aVertexTexCoord != -1) {
		gl.enableVertexAttribArray(shader.attribute.aVertexTexCoord);
		gl.vertexAttribPointer(
			shader.attribute.aVertexTexCoord,
			2,
			gl.FLOAT,
			false,
			theStride,
			3 * FLOAT_WIDTH
		);
	}

	
	if(shader.attribute.aVertexNormal != -1) {
		gl.enableVertexAttribArray(shader.attribute.aVertexNormal);
		gl.vertexAttribPointer(
			shader.attribute.aVertexNormal,
			3,
			gl.FLOAT,
			false,
			theStride,
			(2+3) * FLOAT_WIDTH
		);
	}
}

function init(canvasWidth, canvasHeight) {
	document.write('<canvas width="' + canvasWidth + '" height="' + canvasHeight + '"></canvas>')

	var canv = document.getElementsByTagName('canvas')[0];

	var requestedContextAttributes = {
		antialias: false,
		preserveDrawingBuffer: true
	};

	try {
		var gl = canv.getContext('webgl', requestedContextAttributes);
	} catch (e) {
		console.error('WebGL is not supported', e);
	}

	if(gl) {
		return gl;
	}

	return null;
}


function loop(time) {
	window.requestAnimationFrame(loop);

	if(typeof overrideTime === 'number') time = overrideTime;

	update(time);
	draw();
}