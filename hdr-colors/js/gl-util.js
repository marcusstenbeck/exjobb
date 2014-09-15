'use strict';

// Shader
var quadVS = [
	"attribute vec2 position;",
	"attribute vec2 texture;",

	"varying vec2 texCoord;",

	"void main(void) {",
	"   texCoord = texture;",
	"   gl_Position = vec4(position, 0.0, 1.0);",
	"}"
].join("\n");

var quadFS = [
	"precision mediump float;",

	"uniform sampler2D diffuse;",
	
	"varying vec2 texCoord;",
	
	"void main(void) {",
	"   vec4 color = texture2D(diffuse, texCoord);",
	"   gl_FragColor = vec4(color.rgb, color.a);",
	"}"
].join("\n");

var ShaderWrapper = function(gl, program) {
	var i, attrib, uniform, count, name;

	this.program = program;
	this.attribute = {};
	this.uniform = {};

	count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
	for (i = 0; i < count; i++) {
		attrib = gl.getActiveAttrib(program, i);
		this.attribute[attrib.name] = gl.getAttribLocation(program, attrib.name);
	}

	count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
	for (i = 0; i < count; i++) {
		uniform = gl.getActiveUniform(program, i);
		name = uniform.name.replace("[0]", "");
		this.uniform[name] = gl.getUniformLocation(program, name);
	}
};

function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
	var shaderProgram = gl.createProgram(),
		vs = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER),
		fs = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

	gl.attachShader(shaderProgram, vs);
	gl.attachShader(shaderProgram, fs);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		console.error("Program Link error:", gl.getProgramInfoLog(shaderProgram));
		gl.deleteProgram(shaderProgram);
		gl.deleteShader(vs);
		gl.deleteShader(fs);
		return null;
	}

	return new ShaderWrapper(gl, shaderProgram);
}

function compileShader(gl, source, type) {
	var shaderHeader = "\n";

	var shader = gl.createShader(type);

	gl.shaderSource(shader, shaderHeader + source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		var typeString = "";
		switch(type) {
			case gl.VERTEX_SHADER: typeString = "VERTEX_SHADER"; break;
			case gl.FRAGMENT_SHADER: typeString = "FRAGMENT_SHADER"; break;
		}
		console.error(typeString, gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}

/**
 * Displays the given texture in a quad onscreen
 * This is not intended to be a high performance function, it's primarily for debugging.
 */
function drawTexturedQuad(gl, texture, x, y, width, height) {
	var quadShader = quadShader || undefined;
	var quadVertBuffer = quadShader || undefined;

	if(!quadShader) {
		// Set up the verticies and indices
		var quadVerts = [
			-1,  1,  0, 1,
			-1, -1,  0, 0,
			 1,  1,  1, 1,

			-1, -1,  0, 0,
			 1, -1,  1, 0,
			 1,  1,  1, 1
		];

		quadVertBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, quadVertBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVerts), gl.STATIC_DRAW);
		quadShader = createProgram(gl, quadVS, quadFS);
	}

	// This is a terrible way to do this, use a transform matrix instead
	var viewport = gl.getParameter(gl.VIEWPORT);
	gl.viewport(x, y, width, height);

	gl.disable(gl.DEPTH_TEST);

	gl.useProgram(quadShader.program);

	gl.bindBuffer(gl.ARRAY_BUFFER, quadVertBuffer);
	
	gl.enableVertexAttribArray(quadShader.attribute.position);
	gl.enableVertexAttribArray(quadShader.attribute.texture);
	gl.vertexAttribPointer(quadShader.attribute.position, 2, gl.FLOAT, false, 16, 0);
	gl.vertexAttribPointer(quadShader.attribute.texture, 2, gl.FLOAT, false, 16, 8);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(quadShader.uniform.diffuse, 0);
	gl.bindTexture(gl.TEXTURE_2D, texture);

	gl.drawArrays(gl.TRIANGLES, 0, 6);

	gl.enable(gl.DEPTH_TEST);
	//gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);
}