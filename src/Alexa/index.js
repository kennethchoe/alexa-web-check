'use strict';

const dns = require("dns")
const http = require('http');
const https = require('https');
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();
const request = require('request');

exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        console.log("event:", JSON.stringify(event));
        console.log("context:", JSON.stringify(context));
        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    console.log("sessionAttributes:", JSON.stringify(sessionAttributes));
                    console.log("speechletResponse:", JSON.stringify(speechletResponse));
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

function onLaunch(launchRequest, session, callback) {
    respondWelcome(session, callback);
}

function respondWelcome(session, callback) {
  callback(session.attributes, buildSpeechletResponse("Welcome. You can check any websites if they are running or not. Try check google", "", false));
}

function respondHelp(session, callback) {
  callback(session.attributes, buildSpeechletResponse("Try check google. You can also input your websites using browser. Try check my sites.", "", false));
}

function onIntent(intentRequest, session, callback) {
    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    if ("CheckMySitesIntent" === intentName) {
        handleCheckMySitesIntent(intent, session, callback);
    } else if ("CheckIntent" === intentName) {
        handleCheckIntent(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        handleHelpIntent(intent, session, callback);
    } else if ("AMAZON.StopIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else if ("AMAZON.CancelIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else {
        throw "Invalid intent";
    }
}

function isQuestionSlotValid(intent) {
    var hostnameSlotFilled = intent.slots && intent.slots.Hostname && intent.slots.Hostname.value;
    return hostnameSlotFilled;
}

function handleHelpIntent(intent, session, callback) {
    respondHelp(session, callback);
}

function handleCheckIntent(intent, session, callback) {
    if (!isQuestionSlotValid(intent)) {
      respondHelp(session, callback);
      return;
    }

    var hostname = intent.slots.Hostname.value.replace(" ", "");
    hostname += ".com";
    checkWebSite(hostname, function(result) {
      callback(session.attributes, buildSpeechletResponse(result, false));
    });
}

function handleCheckMySitesIntent(intent, session, callback) {
  if (!session.user.accessToken)  {
	var response = buildSpeechletResponse("To check your sites, please use the Alexa app to link your account.", false);
	response.card = { "type": "LinkAccount" }
    callback(session.attributes, response);
  }
  var amznProfileURL = 'https://api.amazon.com/user/profile?access_token=';
  amznProfileURL += session.user.accessToken;
  request(amznProfileURL, function(error, response, body) {
    if (response.statusCode == 200) {
        checkMySites(JSON.parse(body), session, callback);
    } else {
        callback(session.attributes, buildSpeechletResponse("Access Token error.", false));
    }
  });
}

function checkMySites(profile, session, callback) {
  var params = {
    TableName : 'AlexaWebSite',
    FilterExpression : 'Email = :Email',
    ExpressionAttributeValues : {':Email' : profile.email}
  };

  var result = dynamo.scan(params,
    (err, res) => {
        if (err) {
          console.log("err: ", err);
          callback(session.attributes, buildSpeechletResponse("Not sure what happened. I will ask the developer to check the log.", false));
        }

        var webSites = getWebSites(res);
        if (webSites.length === 0)
          callback(session.attributes, buildSpeechletResponse("You don't have any web sites registered. Visit alexa.agilesalt.com to type your sites. That is, alexa, dot, a g i l e, s a l t, dot com. This is free service.", false));
        else {
          var results = "";
          var chain = function(i) {
            checkWebSite(webSites[i], function(result) {
              results += result + ". ";
              var next = i + 1;
              if (next === webSites.length)
                callback(session.attributes, buildSpeechletResponse(results, false));
              else
                chain(next);
            });
          };

          chain(0);
        }

      });
}

var getWebSites = function(res) {
  try {
    var obj = res.Items[0].WebSites.contents;
    var arr = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            arr.push(obj[key]);
        }
    };
    return arr;

  } catch(e) {
    return [];
  }
}

function handleFinishSessionRequest(intent, session, callback) {
    callback(session.attributes,
        buildSpeechletResponse("Good bye!", "", true));
}

function buildSpeechletResponse(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function checkWebSite(hostname, handleResult) {
  console.log('checkWebSite: ', hostname)
  checkRegistered(hostname, (result) => {
      if (!result) {
        handleResult(hostname + " is not registered");
        return;
      }
      checkHeartbeat(hostname, function(result) {
              handleResult(hostname + " is " + result);
      });
  });
}
function checkRegistered(name, callback) {
  dns.resolve(name, function(e) {
    if (e)
      callback(false);
    else
      callback(true);
  })
}

var checkHeartbeat = (hostname, callback) => {
    check('HTTP', hostname, function(result) {
        check('HTTPS', hostname, function(result2) {
            if (result == "down" && result2 == "down")
                callback("down");
            else if (result == "up" && result2 == "down")
                callback("up on HTTP")
            else if (result == "down" && result2 == "up")
                callback("up on HTTPS")
            else
                callback("up on HTTP and HTTPS")
        })
    })
}

var check = (protocol, hostname, callback) => {
    var protocolObject = protocol == 'HTTPS' ? https : http;

    var options = {
      hostname: hostname,
      port: (protocol == "HTTPS" ? 443 : 80),
      path: '/',
      method: 'GET'
    }

    const req = protocolObject.request(options, (res) => {
        res.on('data', (d) => {
            //
          });
        res.on('end', () => {
            callback("up");
        });
    });
    req.on('error', (e) => {callback("down")});
    req.end();
};

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
