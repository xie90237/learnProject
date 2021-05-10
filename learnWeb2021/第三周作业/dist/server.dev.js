"use strict";

//引入http模块
var http = require("http"); //创建服务器


http.createServer(function (request, responst) {
  var body = [];
  request.on("error", function (err) {
    console.error("请求错误:", err);
  }).on("data", function (chunk) {
    //???数据流、字节包?？？
    console.warn("数据包:", chunk);
    body.push(chunk.toString());
  }).on("end", function () {
    console.log("body:", body); // body = Buffer.concat(body).toString();

    responst.writeHead(200, {
      "Content-Type": "text/html"
    });
    responst.end("\n    <html lang=\"en\" content=\"IE=edge\">\n      <head>\n        <meta charset=\"UTF-8\" />\n        <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\" />\n        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n        <style>\n         #container {\n            display:flex;\n            width:500px;\n            height:300px;\n            background-color:rgb(255,255,255);\n         }\n         #container #myid{\n           width:200px;\n           height:100px;\n           background-color:rgb(255,0,0);\n         }\n         #container .c1{\n           flex:1;\n           background-color:rgb(0,0,255);\n         }\n        </style>\n        <title>Document</title>\n      </head>\n      <body>\n       <div id=\"container\">\n          <div id=\"myid\"></div>\n          <div class=\"c1\"></div>\n       </div>\n      </body>\n    </html>\n");
  });
}).listen(8000);
console.warn("server start!");