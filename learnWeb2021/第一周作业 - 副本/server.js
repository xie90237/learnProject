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
    responst.end("Request End!");
  })
}).listen(8000);

console.warn("server start!")