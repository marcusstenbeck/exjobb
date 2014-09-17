'use strict';
(function () {

	var UP_VECTOR = vec3.fromValues(0, 1, 0);
	var canvasWidth = 512;
	var canvasHeight = 512;

	function interleaveData(data) {
		/*
			Expects data in format
			{
				vertexPositions: [x1, y1, z1, x2, y2, z2, ... ],
				vertexNormals: [nx1, ny1, nz1, nx2, ny2, nz2, ... ],
				vertexTextureCoords: [tx1, ty1, tx2, ty2, ... ],
				indices: [tr1_p1, tr1_p2, tr1_p3, tr2_p1, tr2_p2, tr2_p3, ... ]
			}
		*/
		var vCount = data.vertexPositions.length / 3;
		var vertexData = new Array();

		var tempData;
		for (var i = 0; i < vCount; i++) {
			tempData = [
				data.vertexPositions[ i * 3 ],
				data.vertexPositions[ i * 3 + 1 ],
				data.vertexPositions[ i * 3 + 2 ],
				
				data.vertexTextureCoords[ i * 2 ],
				data.vertexTextureCoords[ i * 2 + 1 ],
				
				data.vertexNormals[ i * 3 ],
				data.vertexNormals[ i * 3 + 1 ],
				data.vertexNormals[ i * 3 + 2 ],
			];

			vertexData = vertexData.concat(tempData);
		};

		return {
			vertexData: vertexData,
			indexData: data.indices
		};
	}


	function init() {
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
			return gl;
		}

		return null;
	}


	var time = 0;
	function update(tpf) {
		time = time + tpf;

		sceneUpdate(time);
		lightUpdate(time);
	}



	function draw(uV, uP) {
		bindScene(gl);

		drawScene(gl);//, scene.camera.uV, scene.camera.uP);

		// drawDepthMap(gl);
	}

	// function drawDepthMap(gl) {
	//	// drawTexturedQuad(gl, gl.depthTexture, 0, 0, 128, 128);

	//	// switch back to our shader
	//	gl.useProgram(shader.program);

	//	// make sure the depth texture is
	//	// bound to texture slot 0
	//	gl.activeTexture(gl.TEXTURE0);
	//	gl.bindTexture(gl.TEXTURE_2D, gl.depthTexture);
	// }

//-------------------------------------------------//
//  Setup functions
//-------------------------------------------------//

	function setupScene(gl) {

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.enable(gl.DEPTH_TEST);


		window.scene = {};

		var teapotData = interleaveData(teapot); // Teapot data loaded in index.html

		/**
		 *  Setup and bind vertex buffer
		 */
		scene.model = {};
		scene.model.vertices = teapotData.vertexData;
		// Create vertex buffer
		gl.vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(scene.model.vertices), gl.STATIC_DRAW);


		/**
		 *  Setup index buffer
		 */
		scene.model.indices = teapotData.indexData;
		// Create index buffer
		gl.iBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.iBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(scene.model.indices), gl.STATIC_DRAW);


		/**
		 *  Camera setup
		 */
		scene.camera = {};

		scene.camera.uV = mat4.create();

		scene.camera.uP = mat4.create();
		mat4.perspective(
			scene.camera.uP,
			Math.PI/2,
			1,
			0.01,
			10000
		);


		/**
		 *  Build and setup shader program
		 */
		window.shader = new Shader();

		shader.setBit('fs', 'main', [
			'ambient += vec4(vec3(0.05), 1.0);',
		].join('\n'));

		shader.compileProgram(gl);
		gl.useProgram(shader.program);
	}

	function bindScene(gl) {
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(scene.model.vertices), gl.STATIC_DRAW);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.iBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(scene.model.indices), gl.STATIC_DRAW);
		
		var FLOAT_WIDTH = 4;
		var theStride = (3+2+3) * FLOAT_WIDTH;
		
		shader.attribute.aVertexPosition = gl.getAttribLocation(shader.program, 'aVertexPosition');
		shader.attribute.aVertexTexCoord = gl.getAttribLocation(shader.program, 'aVertexTexCoord');
		shader.attribute.aVertexNormal = gl.getAttribLocation(shader.program, 'aVertexNormal');
		
		gl.enableVertexAttribArray(shader.attribute.aVertexPosition);
		gl.enableVertexAttribArray(shader.attribute.aVertexTexCoord);
		gl.enableVertexAttribArray(shader.attribute.aVertexNormal);

		gl.vertexAttribPointer(
			shader.attribute.aVertexPosition,
			3,
			gl.FLOAT,
			false,
			theStride,
			0
		);
		
		gl.vertexAttribPointer(
			shader.attribute.aVertexTexCoord,
			2,
			gl.FLOAT,
			false,
			theStride,
			3 * FLOAT_WIDTH
		);

		gl.vertexAttribPointer(
			shader.attribute.aVertexNormal,
			3,
			gl.FLOAT,
			false,
			theStride,
			(2+3) * FLOAT_WIDTH
		);
	}

	function sceneUpdate(time) {
		// Model transform
		var uM = mat4.create();
		mat4.scale(uM, uM, vec3.fromValues(2, 2, 2));
		gl.uniformMatrix4fv(shader.uniform.uM, false, uM);

		// View transform
		var dist = 40;
		var timeFactor = time/10000;
		mat4.lookAt(
			scene.camera.uV,
			vec3.fromValues(dist * Math.sin(timeFactor), (1/3) * dist, dist * Math.cos(timeFactor)),
			vec3.fromValues(0, 0, 0),
			UP_VECTOR
		);
		gl.uniformMatrix4fv(shader.uniform.uV, false, scene.camera.uV);

		// Perspective transform
		gl.uniformMatrix4fv(shader.uniform.uP, false, scene.camera.uP);
	}

	function drawScene(gl, uV, uP) {
		// Draw scene
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, canvasWidth, canvasHeight);

		gl.drawElements(gl.TRIANGLES, scene.model.indices.length, gl.UNSIGNED_SHORT, 0);
	}


//--                    ----------------------------------//

	function lightSetup(gl) {

		/**
		 *  Update shader
		 */

		shader.setBit('vs', 'front', [
			'uniform vec3 uLightPosition;',
			'varying vec4 vLightPosition;',
		].join('\n'));

		shader.setBit('vs', 'main', [
			'vLightPosition = uV * vec4(uLightPosition, 1.0);',
		].join('\n'));

		shader.setBit('fs', 'front', [
			'varying vec4 vLightPosition;',
			'uniform vec3 uLightColor;',

			'vec4 calculateLight() {',

			'	float Lr = 2.0;',  // Light radius
			'	float Li = 10.0;',  // Light intensity

			'	vec3 n = normalize(vNormal);',
			'	vec3 v = normalize(-vPos.xyz);',
			'	vec3 Lout = vec3(0.0);',
			
			'	vec3 l = normalize(vLightPosition.xyz - vPos.xyz);',  // Point-to-light
			'	vec3 h = normalize(v + l);',  // Half vector
			'	float cosTh = max(0.0, dot(h, l));',  // specular shenagiggiian, NdotHV
			'	float cosTi = max(0.0, dot(n, l));',  // cos(theta_incident), NdotL
			
			// Attenuation
			'	float dist = length(vLightPosition - vPos);',
			'	float constantAttenuation = 1.0;',
			'	float linearAttenuation = 2.0 / Lr;',
			'	float quadraticAttenuation = 2.0 / (Lr * Lr);',
			'	float attenuation = Li / ( constantAttenuation + (linearAttenuation * dist) + (quadraticAttenuation * dist * dist) );',
			
			'	float m = 1.0;',  // Smoothness from Real-Time Rendering
			'	float Kd = 1.0 / PI;',
			'	float Ks = (m + 8.0) / (8.0 * PI);',

			'	Lout += vec3(Kd + (Ks * pow(cosTh, m)) ) * Li * cosTi * attenuation;',

			'	return vec4(Lout, 1.0);',
			'}',
		].join('\n'));

		shader.setBit('fs', 'main', [
			shader.getBit('fs', 'main'),
			'diffuse += calculateLight();',
		].join('\n'));

		shader.compileProgram(gl);
		gl.useProgram(shader.program);

	}

	// function lightDraw(gl) {
	// }

	function lightUpdate(time) {
		var dist = 10;
		var lightRadius = 5.0;
		var rad = 20;
		var timeFactor = -time/500;
		gl.uniform3fv(shader.uniform.uLightPosition, vec3.fromValues(
			rad * Math.sin( timeFactor ),
			lightRadius + dist + dist * Math.cos(timeFactor/10),
			rad * Math.cos( timeFactor )
		));
	}


//------------------------------------------------------//

	window.gl = init();
	window.scene = {};
	
	setupScene(gl);
	lightSetup(gl);


	var lastTime = 0;
	var tpf = 0;
	document.write('<div id="tpf"></div>');
	(function loop(time) {
		window.requestAnimationFrame(loop);
		tpf = time - lastTime || 0;
		lastTime = time;
		
		update(tpf);
		draw(scene.camera.uV, scene.camera.uP);
	})();

}).call(this)