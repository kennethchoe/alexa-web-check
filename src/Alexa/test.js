'use strict';

const dns = require("dns")

function checkRegistered(name, callback) {
  dns.resolve(name, function(e) {
    if (e)
      callback(false);
    else
      callback(true);
  })
}

checkRegistered("koreanalive.com", function(value) { console.log(value); })
