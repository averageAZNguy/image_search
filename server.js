var express = require('express'),
	app = express(),
	bodyparser = require('body-parser'),
	googleImages = require('google-images'),
	google = new googleImages(process.env.CSE_ID,process.env.G_API_KEY),
	port = 8080,
	mongoose = require('mongoose'),
	urldb = process.env.MONGOLAB_URI;

app.use(bodyparser.urlencoded({extended: true}))
app.use(express.static('css'));
app.set('view engine','ejs');

// SETUP & CONNECT TO MONGODB
mongoose.connect(urldb);

var imgSchema = new mongoose.Schema({
	query: String,
	timestamp: {type: Date, default: Date.now}
})
var ImageSearch = mongoose.model('ImageSearch',imgSchema);

// MAIN INDEX PAGE
app.get('/',function(req,res){
	 var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	res.render('index',{url:fullUrl})
})
// RECENT SEARCH QUERIES
app.get('/api/recentsearchresults',function(req,res){
	var q = ImageSearch.find({}).sort({timestamp: -1}).select("query timestamp -_id").limit(10);
	q.exec(function(err,recentSearches){
		if(err){
			console.log("There's been an error", err)
			res.redirect('/')
		} else {
			res.send(recentSearches);
		}
	})
})

// RETURNS IMAGE URLS QUERIES
app.get('/api/imagesearch/:query',function(req,res){
	var query = req.params.query;
	queryStorage(query);
	console.log(query,"added to db")
	var p_str = req._parsedUrl.query
	var pages = p_str.slice(p_str.indexOf('=')+1,p_str.length)
	var options = {page: pages}
	google.search(query, options)
	.then(images=> {
		res.send(images)
	})
})

app.listen(port,process.env.IP,function(){
	console.log("Server has connected with port:",port)
})

// FUNCTIONS
// STORE RECENT SEARCH RESULTS
function queryStorage(s_term){
	ImageSearch.create({
		query: s_term
	}, function(err,term){
		if(err){
			console.log(err)
		} else {
			console.log("Search term added",term)
		}
	})
}
