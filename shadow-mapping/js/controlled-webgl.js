'use strict';

var strBoilerplate = [
		'',
		'################################',
		'##  CONTROLLED WEBGL CONTEXT  ##',
		'###################### 0.0.1 ###',
		''
	].join('\n');


	// Create a map of stuff that we're gonna choke
var choke = {
	'MAX_VERTEX_ATTRIBS' : 8,
	'WEBGL_depth_texture': false
};

// Shim the canvas
var getContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(name) {
	if(name == 'webgl') {
		
		console.log(strBoilerplate);
		
		console.log('Implementation Limits\n', choke);

		var gl = getContext.apply(this, arguments);

		gl = makeControlledWebGLContext(gl);

		logContextAttributes(gl);

		return gl;
	}
	return getContext.apply(this, arguments);
}

function logContextAttributes(gl) {
	var contextAttributes = gl.getContextAttributes();

	var strAttrs = [
		'',
		'Context Attributes',
		'',

		// GLboolean alpha = true;
		'alpha: ' + contextAttributes.alpha,

		// GLboolean depth = true;
		'depth: ' + contextAttributes.depth,

		// GLboolean stencil = false;
		'stencil: ' + contextAttributes.stencil,

		// GLboolean antialias = true;
		'antialias: ' + contextAttributes.antialias,

		// GLboolean premultipliedAlpha = true;
		'premultipliedAlpha: ' + contextAttributes.premultipliedAlpha,

		// GLboolean preserveDrawingBuffer = false;
		'preserveDrawingBuffer: ' + contextAttributes.preserveDrawingBuffer,

		// GLboolean preferLowPowerToHighPerformance = false;
		'preferLowPowerToHighPerformance: ' + contextAttributes.preferLowPowerToHighPerformance,

		// GLboolean failIfMajorPerformanceCaveat = false;
		'failIfMajorPerformanceCaveat: ' + contextAttributes.failIfMajorPerformanceCaveat,

	].join('\n');

	console.log(strAttrs);
}

function makeControlledWebGLContext(gl) {

	// Make a function that calls a WebGL function and
	// then calls getError()
	function makeFunctionWrapper(gl, functionName) {
		gl['_'+functionName] = gl[functionName];
		return function() {
			var result = gl['_'+functionName].apply(gl, arguments);
			var err = gl.getError();
			if(err != 0) {
				//console.error('WebGL:', err, functionName);
			}
			return result;
		}
	}

	
	var wrapper = {};
	for(var propertyName in gl) {
		if(typeof gl[propertyName] === 'function') {
			if(propertyName !== 'getError') {
				wrapper[propertyName] = makeFunctionWrapper(gl, propertyName);
			}
		} else {
			wrapper[propertyName] = gl[propertyName];
		}
	}

	// ###  ONLY USE wrapper (NOT gl) AFTER THIS POINT  ###

	/**
	 *  Override max vertex attribs
	 */

	// Replace the getParameter function
	var getParameter = wrapper.getParameter;
	wrapper.getParameter = (function() {
		return function() {
			var parameterEnum = arguments[0];

			var enumName = getGlEnumName(parameterEnum);

			// Is it a choke parameter?
			if(choke[enumName]) {
				return choke[enumName];
			}
			
			// Not handled in any other way?
			// Pass to original function
			return getParameter.apply(wrapper, arguments);
		}
	})();


	// Enforce limit when trying to exceed it
	var linkProgram = wrapper.linkProgram;
	wrapper.linkProgram = (function() {
		return function() {
			// Start by linking program so we can check it
			var rtn = linkProgram.apply(wrapper, arguments);
			
			// First argument shall be a WebGLProgram
			var program = arguments[0];
			if(program.constructor !== WebGLProgram) {
				// The first argument is not a WebGLProgram
				// so there should already be webgl errors
				// from trying to link it
				return rtn;
			}

			// Get the number of active attributes
			var activeAttributes = wrapper.getProgramParameter(program, wrapper.ACTIVE_ATTRIBUTES);

			// Be angry when active attribs exceed choke
			if(activeAttributes > choke['MAX_VERTEX_ATTRIBS']) {
				throw new Error('\n###  ENFORCE VIRTUAL LIMIT  ###\n\
ERROR: Implementation limit of ' + choke[wrapper.MAX_VERTEX_ATTRIBS] + ' MAX_VERTEX_ATTRIBS (e.g., number of generic plus conventional active vec4 attributes) exceeded, shader uses up to vec4 attribute ' + (activeAttributes-1) + '.\n');
			}

			return rtn;
		}
	})();


	/**
	 *  Override getExtension()
	 */
	var getExtension = wrapper.getExtension;
	wrapper.getExtension = (function() {
		return function() {
			var extensionName = arguments[0];

			// Is the extension blocked?
			if(typeof choke[extensionName] !== 'undefined' && !choke[extensionName]) {
				console.warn('Blocked request to activate extension', extensionName);
				return null;
			}
			
			// Not blocked?
			// Pass to original function
			console.log('Allowed request to activate extension', extensionName);
			return getExtension.apply(wrapper, arguments);
		}
	})();

	return wrapper;
}

var glEnumNames = {
	34921: 'MAX_VERTEX_ATTRIBS'
};
function getGlEnumName(number) {
	return glEnumNames[number];
}