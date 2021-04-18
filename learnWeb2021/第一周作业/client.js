//模块
const net = require("net");
class Request{
  constructor(options){
    this.method = options.method || "GET";
    this.host = options.host;
    this.port = options.port || 80;
    this.path = options.path || "/";
    this.body = options.body || {};
    this.headers = {
      "Content-Type":"application/x-www-form-urlencoded",
      ...options.headers
    };
    if(this.headers["Content-Type"]  === "application/json"){
      this.bodyText = JSON.stringify(this.body);
    }else if(this.headers["Content-Type"]  === "application/x-www-form-urlencoded"){
      this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join("&");
    }
    this.headers["Content-Length"] = this.bodyText.length;
  }

  send(connection){
    return new Promise((resolve,reject)=>{
        const parser = new ResponseParser;
        console.log(this.toString());
        if(connection){
          connection.write(this.toString());
        }else{
          connection = net.createConnection({
            host:this.host,
            port:this.port
          },()=>{
            connection.write(this.toString())
          })
        }
        connection.on("data",(data)=>{
          parser.receive(data.toString());
          if(parser.isFinished){
            resolve(parser.response);
            connection.end();
          }
        });
        connection.on("error",(error) => {
          reject(error);
          connection.end();
        })
    })
  }
  toString(){
     return `${this.method} ${this.path} HTTP/1.1\r
${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}\r\n
${this.bodyText}`
  }
}

class TrunkedBodyParser{
  constructor(){
    this.WAITING_LENGTH = 0;
    this.WAITING_LENGTH_LINE_END = 1;
    this.READING_TRUNK = 2;
    this.WAITING_NEW_LINK = 3;
    this.WAITING_NEW_LINK_END = 4;
    this.length = 0;
    this.content = [];
    this.isFinished = false;
    this.current = this.WAITING_LENGTH;
  }
  receiveChar(char){
    if(this.current === this.WAITING_LENGTH){ //进入trunk  body?
        if(char === '\r'){
          if(this.length === 0) this.isFinished = true;//新的一行字符长度为0 则body结束或开始 当前行结束
          this.current = this.WAITING_LENGTH_LINE_END; //当前行结束
        }else{
          this.length *= 16;
          this.length += parseInt(char,16);
        }
    }else if(this.current === this.WAITING_LENGTH_LINE_END){
        if(char ==='\n'){
          this.current = this.READING_TRUNK;
        }
    }else if(this.current === this.READING_TRUNK){
      this.content.push(char);
      this.length--;
      if(this.length === 0){
        this.current = this.WAITING_NEW_LINK;
      }
    }else if(this.current === this.WAITING_NEW_LINK){
      if(char === '\r'){
        this.current = this.WAITING_NEW_LINK_END;
      }
    }else if(this.current === this.WAITING_NEW_LINK_END){
      if(char === '\n'){
        this.current = this.WAITING_LENGTH;
      }
    }
  }
}
class ResponseParser{
  constructor(){
    this.WAITING_STATUS_LINE = 0;
    this.WAITING_STATUS_LINE_END = 1;
    this.WAITING_HEADER_NAME = 2;
    this.WAITING_HEADER_SPACE = 3;
    this.WAITING_HEADER_VALUE = 4;
    this.WAITING_HEADER_LINE_END = 5;
    this.WAITING_HEADER_BLOCK_END = 6;
    this.WAITING_BODY = 7;
    
    this.current = this.WAITING_STATUS_LINE;
    this.statusLine = "";
    this.headers = {};
    this.headerName = "";
    this.headerValue = "";
    this.bodyParser = null;
  }
  get isFinished(){
    return this.bodyParser && this.bodyParser.isFinished;
  }
  get response(){
    this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/)
    return {
      statusCode:RegExp.$1,
      statusText:RegExp.$2,
      headers:this.headers,
      body:this.bodyParser.content.join('')
    }
  }
  receive(string){
    for (let i = 0; i < string.length; i++) {
      this.receiveChar(string.charAt(i));
    }
  }
  receiveChar(char){
    if(this.current == this.WAITING_STATUS_LINE){ // 请求体的第一行
      if(char === '\r'){
        this.current = this.WAITING_STATUS_LINE_END;
      }else{
        this.statusLine += char;
      }
    }else if(this.current == this.WAITING_STATUS_LINE_END){ //第一行结束
      if(char === '\n'){
        this.current = this.WAITING_HEADER_NAME;
      }
    }else if(this.current == this.WAITING_HEADER_NAME){ //进入到header体内
      if(char === ':'){
        this.current = this.WAITING_HEADER_SPACE;       //遇到：则进入空格判断
      }else if(char === '\r'){
        this.current = this.WAITING_HEADER_BLOCK_END;  //遇到\r就是到了
        if(this.headers['Transfer-Encoding'] == "chunked"){
          this.bodyParser = new TrunkedBodyParser();
        }
      }else{
        this.headerName+=char;
      }
    }else if(this.current == this.WAITING_HEADER_SPACE){ //header后边有一个空格 再记录header的val
      if(char === ' '){
        this.current = this.WAITING_HEADER_VALUE;
      }
    }else if(this.current == this.WAITING_HEADER_VALUE){//进入保存head数据
      if(char === '\r'){
        this.current = this.WAITING_HEADER_LINE_END;
        this.headers[this.headerName] = this.headerValue;
        this.headerName = "";
        this.headerValue = "";
      }else{
        this.headerValue+=char;
      }
    }else if(this.current == this.WAITING_HEADER_LINE_END){ //head的当前行结束
      if(char === '\n'){
        this.current = this.WAITING_HEADER_NAME
      }
    }else if(this.current == this.WAITING_HEADER_BLOCK_END){ //header 结束
      if(char === '\n'){
        this.current = this.WAITING_BODY
      }
    }else if(this.current == this.WAITING_BODY){ //数据
      this.bodyParser.receiveChar(char);
    }
  }

}

void async function (){
  let request = new Request({
    method:"POST",
    host:"127.0.0.1",
    port:"8000",
    path:"/",
    headers:{
      ["X-Foo2"]:"customer"
    },
    body:{
      name:"emmmm",
      age:165,
      sex:1,
      aaa:2222
    }
  });

  let response = await request.send();
  console.log(response);
}();
