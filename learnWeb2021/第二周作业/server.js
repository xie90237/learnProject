//引入http模块
const http = require("http");
//创建服务器
http.createServer((request,responst)=>{
  let body = [];
  request.on("error",(err)=>{
    console.error("请求错误:",err)
  }).on("data",(chunk)=>{ //???数据流、字节包?？？
    console.warn("数据包:",chunk);
    body.push(chunk.toString());
  }).on("end",()=>{
    console.log("body:",body);
    // body = Buffer.concat(body).toString();
    responst.writeHead(200,{"Content-Type":"text/html"});
    responst.end(`
    <html lang="en" content="IE=edge">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body #d{
            width:20px;
            height:20px;
            background:#fff;
          }
          body .xyz {
            color:blue;
            background:red;
          }
          body div {
            color:red;
            background:blue;
          }
        </style>
        <title>Document</title>
      </head>
      <body>
        <div>test</div>
        <span id="d">test</span>
        <ul class="xyz">test</ul>
      </body>
    </html>
`);
  })
}).listen(8000);

console.warn("server start!")