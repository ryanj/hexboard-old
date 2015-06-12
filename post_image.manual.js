'use strict';

var request = require('request')
  , fs = require('fs')
  ;

var proxy = process.env.PROXY || "localhost:8080";

var readStream = fs.createReadStream('./static/img/cherries.png');
var id = process.env.POD_ID || '';
var url = process.env.POD_URL || 'http://'+proxy+'/demo/'+ id;
var qs = '?username=John%20Doe&cuid=test&submission=123';
// var url = 'http://beacon.jbosskeynote.com/api/sketch/' + id + '?name=John%20Doe&cuid=test&submission_id=123';
console.log(url+qs)
var req = request.post(url+qs, function (err, res, body) {
  if (err) {
    throw new Error(err);
  }
  console.log('res', res.body);
});
 //
readStream.pipe(req);
