(function () {

	var verts = [
			-1.0,  0.125,  0.0,  0.0,  0.0, 0.0, 0.125,
			 1.0,  1.0,  0.0,  1.0,  0.0, 0.0, 1.0,
			 1.0, -1.0,  0.0,  1.0,  1.0, 0.0, 1.0,
			-1.0, -0.125,  0.0,  0.0,  0.125, 0.0, 0.125
		];

	var idx = [
		0, 1, 3,
		3, 1, 2
	];

	var shaderBoilerPlate = '\n\
#ifdef GL_ES  \n\
precision mediump float;  \n\
#endif \n\
';

	var srcVertexShader = shaderBoilerPlate + '\n\
attribute vec3 aVertexPosition;  \n\
attribute vec4 aTextureCoordinate;  \n\
\n\
varying vec4 vTextureCoordinate;  \n\
\n\
void main(void) {  \n\
	gl_Position = vec4(aVertexPosition, 1.0);  \n\
	vTextureCoordinate = aTextureCoordinate; \n\
}  \n\
';

	var srcFragmentShader = shaderBoilerPlate + '\n\
uniform sampler2D uSampler;  \n\
\n\
varying vec4 vTextureCoordinate;  \n\
\n\
void main(void) {  \n\
	gl_FragColor = texture2DProj(uSampler, vTextureCoordinate);  \n\
}  \n\
';



	function loadShader(src, type) {
		var shader = gl.createShader(type);

		gl.shaderSource(shader, src);

		gl.compileShader(shader);

		if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
			console.error('Error compiling shader\n', 'Type: ' + type + '\n' , gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}

		return shader;
	}

	function initShaders(gl, vSrc, fSrc) {
		var vs = loadShader(vSrc, gl.VERTEX_SHADER);		
		var fs = loadShader(fSrc, gl.FRAGMENT_SHADER);		

		var shaderProgram = gl.createProgram();
		
		gl.attachShader(shaderProgram, vs);
		gl.attachShader(shaderProgram, fs);


		gl.linkProgram(shaderProgram);

		if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) && !gl.isContextLost()) {
			console.error('Error linking shader program\n', gl.getProgramInfoLog(shaderProgram));
			gl.deleteProgram(shaderProgram);
			return null;
		}


		gl.validateProgram(shaderProgram);

		if(!gl.getProgramParameter(shaderProgram, gl.VALIDATE_STATUS) && !gl.isContextLost()) {
			console.error('Error validating shader program\n', gl.getProgramInfoLog(shaderProgram));
			gl.deleteProgram(shaderProgram);
			return null;
		}

		return shaderProgram;
	}


	function init() {
		var canvasWidth = 512;
		var canvasHeight = 512;
		document.write('<canvas width="' + canvasWidth + '" height="' + canvasHeight + '"></canvas>')

		var canv = document.getElementsByTagName('canvas')[0];

		var requestedContextAttributes = {
			antialias: false
		};

		try {
			var gl = canv.getContext('webgl', requestedContextAttributes);
		} catch (e) {
			console.error('WebGL is not supported');
		}

		if(gl) {
			console.log('WebGL context created', gl.getContextAttributes());

			var contextAttributes = gl.getContextAttributes();

			// GLboolean alpha = true;
			console.log('alpha: ', contextAttributes.alpha);
			// GLboolean depth = true;
			console.log('depth: ', contextAttributes.depth);
			// GLboolean stencil = false;
			console.log('stencil: ', contextAttributes.stencil);
			// GLboolean antialias = true;
			console.log('antialias: ', contextAttributes.antialias);
			// GLboolean premultipliedAlpha = true;
			console.log('premultipliedAlpha: ', contextAttributes.premultipliedAlpha);
			// GLboolean preserveDrawingBuffer = false;
			console.log('preserveDrawingBuffer: ', contextAttributes.preserveDrawingBuffer);
			// GLboolean preferLowPowerToHighPerformance = false;
			console.log('preferLowPowerToHighPerformance: ', contextAttributes.preferLowPowerToHighPerformance);
			// GLboolean failIfMajorPerformanceCaveat = false;
			console.log('failIfMajorPerformanceCaveat: ', contextAttributes.failIfMajorPerformanceCaveat);

			gl._createBuffer = gl.createBuffer;
			gl.createBuffer = function() {
				var ret = this._createBuffer();
				console.log('gl.createBuffer() ->', ret);
				return ret;
			}

			return gl;
		}

		return null;
	}


	var red = 0;
	var time = 0;
	function update(tpf) {
		time = time + tpf;

		gl.clearColor(0.5, 0.5, 0.5, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.uniform1f(shaderProgram.uTime, time);

		document.getElementById('tpf').innerHTML = Math.floor(tpf);
	}


	function draw(tpf) {
		gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
	}

	


	var gl = init();
	

	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);


	var shaderProgram = initShaders(gl, srcVertexShader, srcFragmentShader);
	gl.useProgram(shaderProgram);

	shaderProgram.uTime = gl.getUniformLocation(shaderProgram, 'uTime');
	gl.uniform1f(shaderProgram.uTime, 0.0);

	shaderProgram.aVertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
	gl.enableVertexAttribArray(shaderProgram.aVertexPosition);
	gl.vertexAttribPointer(
							shaderProgram.aVertexPosition,
							3,
							gl.FLOAT,
							false,
							7 * 4,
							0
						);

	shaderProgram.aTextureCoordinate = gl.getAttribLocation(shaderProgram, 'aTextureCoordinate');
	gl.enableVertexAttribArray(shaderProgram.aTextureCoordinate);
	gl.vertexAttribPointer(
							shaderProgram.aTextureCoordinate,
							4,
							gl.FLOAT,
							false,
							7 * 4,
							3 * 4
						);

	var iBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(idx), gl.STATIC_DRAW);



	// Create texture
	var im = new Image();
	im.src = 'js/assets/32768x2048-checkers-f.png';
	im.onload = function() {
		gl.activeTexture(gl.TEXTURE0);
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);

		shaderProgram.uSampler = gl.getUniformLocation(shaderProgram, 'uSampler');
		gl.uniform1i(shaderProgram.uSampler, 0);
	}



	var lastTime = 0;
	var tpf = 0;
	document.write('<div id="tpf"></div>');
	(function loop(time) {
		window.requestAnimationFrame(loop);
		tpf = time - lastTime || 0;
		lastTime = time;
		
		update(tpf);
		draw();
	})();

	window.gl = gl;

}).call(this)