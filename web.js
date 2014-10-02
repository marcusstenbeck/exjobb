// web.js
var express = require('express');
var logfmt = require('logfmt');
var bodyParser = require('body-parser');
var app = express();


app.use(logfmt.requestLogger());

// Add parsing for JSON in POST requests
app.use(bodyParser.json({
	limit: '50mb'
}));

// Add parsing for URL encoded in POST requests
app.use(bodyParser.urlencoded({
	limit: '50mb',
	extended: true
}));


// Static file serving
app.use(express.static(__dirname + '/app'));


// Database setup
var mongo = require('mongodb');
var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/mydb';

mongo.MongoClient.connect(mongoUri, function (err, db) {
	if(!err) {
		console.log('Connected to \'webgl_info_db\' database');
		db.collection('webgl_info', {strict: true}, function(err, collection) {
			if(err) {
				console.log('The \'webgl_info\' collection does not exist');
				console.log('Creating empty collection \'webgl_info\'');
				
				db.createCollection('webgl_info', function(err, collection) {});
			}
		});
	}
});



// API Routes

var apiPrefix = '/api/1';

app.post(apiPrefix + '/collect', function(req, res) {
	// Try storing in the database
	mongo.MongoClient.connect(mongoUri, function (err, db) {
		db.collection('webgl_info', function(err, collection) {
			console.log(req.body);
			collection.insert(req.body, {w:1}, function(err, result) {
				if(err) {
					res.send({ error: 'An error has occured' });
				} else {
					console.log('Success', JSON.stringify(result[0]));
					res.send(result[0]);
				}
			});
		});
	});
});


app.get(apiPrefix + '/list', function(req, res) {
	// 
	mongo.MongoClient.connect(mongoUri, function (err, db) {
		db.collection('webgl_info', function(err, collection) {
			collection.find().toArray(function(err, items) {
				res.send({message: 'success', items: items});
			});
		});
	});
});



// Start listening

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});


