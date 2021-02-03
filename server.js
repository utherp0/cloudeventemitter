//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var app     = express();
var eps     = require('ejs');
var got     = require('got');
var bodyParser = require("body-parser");

var axios   = require('axios').default;
const { HTTP, CloudEvent } = require("cloudevents");

app.engine('html', require('ejs').renderFile);

app.use( '/scripts', express.static('scripts'));
app.use( '/styles', express.static('styles'));
app.use( '/images', express.static('images'));

app.use(bodyParser.urlencoded({extended: false }));
app.use(bodyParser.json());

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

// Emit an event
app.post('/emit', function (req,res)
{
  // Extract the parameters from the request
  var broker = req.body().broker;
  var cetype = req.body().cetype;
  var payload = req.body().payload;

  console.log( "Type: " + cetype );
  console.log( "Broker: " + broker );
  console.log( "Payload: " + payload );

  const cloudevent = new CloudEvent({
    type: cetype,
    data: {
      payload
    },
    source: 'cloudeventemitter'
  });

  const message = HTTP.binary(cloudevent);

  axios({
     method: "post",
     url: broker,
     data: message.body,
     headers: message.headers,
  });

  console.log( "Emitted cloud event " + cloudevent.type );

  res.sendStatus(200);
});

// Serve the input page
app.get('/', function (req, res)
{
  console.log( "Serving request to " + req.ip);
 
  res.render('emitter.html');
});

// Return the default broker ENV if present
app.get('/broker', function (req,res)
{
  // Do I have an ENV with that name?
  var envoutput = process.env["CEBROKERURI"];

  if( envoutput == null )
  {
    res.send("http://broker-ingress.knative-eventing.svc.cluster.local/{TARGET_NAMESPACE}/default")
  }
  else
  {
    res.send(envoutput);
  }
});

app.listen(port, ip);
console.log('Server running on ' + ip + ':' + port);

