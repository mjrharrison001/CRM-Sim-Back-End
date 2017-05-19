/**
 * Module dependencies.
 */
var express  = require('express');
var logger   = require('morgan');
var http     = require('http');
var request  = require('request');
var datetime = require('node-datetime');
var fs       = require('fs');
var bodyParser = require('body-parser');
var app       = express();
var parseXml = require('xml2js').parseString;
var util = require('util');

 // all environments
app.set('port', (process.env.PORT || 5000));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.listen(app.get('port'), function() {
  console.log('CRM Simulation running on port ', app.get('port'));
});

//CRM back-end Lead Table connection goes here.
//For the purpose of this demo I will create a temp array.
var CRM_scans = [];
var lastValidDate;

//Daemon
var interval = 15; //15 second interval
//updateScans();
setInterval(updateScans, interval * 1000);

app.get('/users', function(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(CRM_scans));
});

app.get('/users/lastUpdated', function(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  var date = {
    'date': lastValidDate
  };
  res.send(JSON.stringify(date));
});

function updateScans (){
  console.log("Dameon tick ...");
  var postData = {
    UserName: 'mjrharrison001@gmail.com',
    Password: '5e1443c1'
  }
  var formData = {
    UserName: 'mjrharrison001@gmail.com',
    Password: '5e1443c1'
  }
  var url = 'https://veriscanonline.com/Authorize';
  var options = {
    method: 'POST',
    jar : true,
    form: formData,
    body: postData,
    followAllRedirects : true,
    removeRefererHeader : true,
    json: true,
    url: url
  }
  request(options, function (err, res, body) {
    if (err) {
      console.error('error posting json: ', err)
      throw err
    }
    var headers = res.headers;
    var statusCode = res.statusCode;
    var pastTime = '2017-01-01 00:00:00';     //dynamically set dates
    var currentTime = '2017-05-31 00:00:00';  //dynamically set dates
    var link = 'https://veriscanonline.com/Export/History?from=' +
    pastTime + '&to=' + currentTime;
    var options = {
      method: 'POST',
      json: true,
      jar : true,
      form: formData,
      body: postData,
      followAllRedirects : true,
      removeRefererHeader : true,
      url: link
    }
    request(options, function (err, res, body) {
      if (err) {
        console.error('error posting json: ', err)
        throw err
      }
      if (res.statusCode == 200){
        lastValidDate = new Date();
        console.log("Dameon tock PASSED at: " + lastValidDate);
      }
      else{
        var errRes = "Demeon tock FAILED. ";
        errRes += " Last succesful API call was: " + lastValidDate;
        console.log("Demeon tock FAILED. Last");
      }
      var token = body.HistoryItems;
      if(typeof token != 'undefined')
        token.sort(compare);

      for (var i = (token.length - CRM_scans.length) -1; i >= 0 ; i--){
        CRM_scans.push(token[token.length - i - 1]);
      }
    });
  });
}

function compare(a,b) {
  if (a.Scanned.replace(/\D/g,'') < b.Scanned.replace(/\D/g,''))
    return -1;
  if (a.Scanned.replace(/\D/g,'') > b.Scanned.replace(/\D/g,''))
    return 1;
  return 0;
}
