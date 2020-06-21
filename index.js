const express = require('express');
const axios = require('axios') 
const bodyParser = require("body-parser");
const app = express();
const { base64encode, base64decode } = require('nodejs-base64');
const Parser = require("fast-xml-parser").j2xParser;
 
// Just some repeated variables in a few utilities that are simliar
const heading = '<h1>Conversion Results</h1>';
const separator = '<br><hr><br>';
const h2Json = '<h2>JSON Data</h2>';
const h2Xml = '<h2>XML Data</h2>';
const h2Orig = '<h2>Original Data</h2>';
const h2Base64 = '<h2>Base 64 Encoded</h2>';
const h2Base64Decoded = '<h2>Base 64 Decoded</h2>';
const start = '<textarea rows="15" cols="80" style=border:none;">';
const end = '</textarea>';
const back = '<br><br><a href="https://xpress--sbatester.repl.co/tdt">back</a>';
const apikey = 'rfkpBK4J7V9vJxZCq6Y9R4MRjlZ1NpT25wa8urCd';
const tdturl = 'https://pdt.test.compliancesystems.cloud/api/Translate';
const defaultOptions = {
  attributeNamePrefix : "@_",
  attrNodeName: "@", //default is false
  textNodeName : "#text",
  ignoreAttributes : true,
  cdataTagName: "__cdata", //default is false
  cdataPositionChar: "\\c",
  format: false,
  indentBy: "  ",
  supressEmptyNode: false
};

// Configure and Launch the Express Server
app.use(bodyParser.json({limit: '15mb'})); // extended size for Insomnia
app.use(bodyParser.text({ type: 'text/plain' }))
app.use(bodyParser.urlencoded({ extended: true })) // support form data
app.use(express.static('public')); // load files from public directory
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.listen(process.env.PORT || 3000, function() {
  console.log('Express server listening on port %d in %s mode', this.address().port, app.settings.env);
});

//*************************************
// GET Requests
//*************************************
app.get("/", function(req, res) {
  res.sendFile('public/index.html'); // no need to specify dir off root
});

app.get("/tdt", function(req, res) {
  res.sendFile('public/tdt.html' , { root : __dirname}); 
});

app.get("/jsontools", function(req, res) {
  res.sendFile('public/jsontools.html' , { root : __dirname}); 
});

app.get("/test", function(req, res) {
  res.sendFile('public/test.html', { root : __dirname});
});

//*************************************
// POST Requests
//*************************************

//******* Call TDT 
app.post("/tdt", function(req, res) {
  let receivedData; 
  let boolForm = false; 
  let postBody = {"translatorCode":"json","partnerData":"","mappingData":{"location":"1","data":"cunexus_leadsapi_v1.json"}};

  //Deal with data coming in differently from FORM vs normal POST
  if (req.body.payload != null) {
    boolForm = true;
    receivedData = JSON.parse(req.body.payload); // comes in escaped from FORM
  } else {
    receivedData = req.body; // comes directly in body of POST
  }

  //Encode partner data, then update the postBody
  base64data = Buffer.from(JSON.stringify(receivedData)).toString('base64');
  postBody.partnerData = base64data;
  postBody = JSON.stringify(postBody);
  //console.log('\n' + 'Post Body = ' + postBody);
  
  //Construct and send request 
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apikey
  }
  axios.post(tdturl, postBody, {
      headers: headers
  })
  .then((resp) => {
    let buff = Buffer.from(resp.data.txl, 'base64');
    let text = buff.toString('ascii');
    if (boolForm) {
      let heading = '<h1>TDT Results</h1>';
      res.send(heading + start + text + end + back);
    } else {
      res.send(text); // came from direct POST
    }
  })
  .catch((error) => {
    console.log('Error: ' + error)
  })
});

////******* Used by insomnia to parse via chaining
app.post("/echo", function(req, res) {
  res.send(req.body.data);
});

////******* Convert JSON to XML 
app.post("/converttoxml", function(req, res) {
  let receivedData = JSON.parse(req.body.payload); // comes in escaped
  let parser = new Parser(defaultOptions);
  let testXML = parser.parse(receivedData);
  res.send(heading + separator + h2Json + start + JSON.stringify(receivedData) + end + separator + h2Xml + start + testXML + end + back);
});

////******* Convert JSON to XML 
app.post("/base64encode", function(req, res) {
  let receivedData = JSON.parse(req.body.payload); // comes in escaped
  receivedData = JSON.stringify(receivedData);
  let encoded = base64encode(receivedData); // "aGV5ICB0aGVyZQ=="
  res.send(heading + separator + h2Orig + start + receivedData + end + separator + h2Base64 + start + encoded + end + back);
});

////******* Convert JSON to XML 
app.post("/base64decode", function(req, res) {
  let receivedData = JSON.parse(req.body.payload); // comes in escaped
  receivedData = JSON.stringify(receivedData);
  let decoded = base64decode(receivedData); // "hey there"
  res.send(heading + separator + h2Orig + start + receivedData + end + separator + h2Base64Decoded + start + decoded + end + back);
});
