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

/*body共三行 第一行为十六进制的body长度  第二行为body内容 第三行为0结束*/
class TrunkedBodyParser{
  constructor(){
    this.length = 0;
    this.content = [];
    this.isFinished = false;
    this.current = this.WAITING_LENGTH;
  }
  receiveChar(char){
    let fun = this.current(char)
    if(fun){
      this.current = fun;
    }
  }
  WAITING_LENGTH(char){ //判断新的一行是 body还是 16进制 通过\r判断?
    if(char === '\r'){ //判断新的一行的内容 \r是内容 否则就是16进制
      if(this.length === 0) this.isFinished = true;//当body的长度为0 则body解析结束
      return this.WAITING_LENGTH_LINE_END; //判断结束
    }else{ //进入十六进制的字符获取body的内容字符长度 第一行处理 最后一行处理
      this.length *= 16; //16进制 进一位 *16
      this.length += parseInt(char,16); //将16进制的字符转为10进制
    }
  }
  WAITING_LENGTH_LINE_END(char){ //判断当前行结束
    if(char ==='\n'){
      return this.READING_TRUNK;//进入body字符解析阶段
    }
  }
  READING_TRUNK(char){//解析 body 内容 新的一行的内容
    this.content.push(char); //存入每一个字符
    this.length--;    //每次执行 自长度减一  当等于0时代表body解析结束
    if(this.length === 0){
      return this.WAITING_NEW_LINK;//进入新的一行
    }
  }
  WAITING_NEW_LINK(char){ //准备进入第新的一行
    if(char === '\r'){
      return this.WAITING_NEW_LINK_END;
    }
  }
  WAITING_NEW_LINK_END(char){ //进入新的一行
    if(char === '\n'){
      return this.WAITING_LENGTH;
    }
  }
}
class ResponseParser{
  constructor(){
    this.statusLine = "";
    this.headers = {};
    this.headerName = "";
    this.headerValue = "";
    this.bodyParser = null;
    this.current = this.WAITING_STATUS_LINE;
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
      let fun = this.current(string.charAt(i))
      if(fun){
        this.current = fun;
      }
    }
  }
  
  WAITING_STATUS_LINE(char){ //响应体的第一行状态码
    if(char === '\r'){
      return this.WAITING_STATUS_LINE_END;
    }else{
      this.statusLine += char;
    }
  };
  WAITING_STATUS_LINE_END(char){ //第一行状态解析结束
    if(char === '\n'){
      return this.WAITING_HEADER_NAME;
    }
  };
  WAITING_HEADER_NAME(char){ //进入到header体内
    if(char === ':'){
      return this.WAITING_HEADER_SPACE;       //遇到：则进入空格判断
    }else if(char === '\r'){
      if(this.headers['Transfer-Encoding'] == "chunked"){
        this.bodyParser = new TrunkedBodyParser();
      }
      return this.WAITING_HEADER_BLOCK_END;  //遇到\r就是到了整个headers结束的地方了
    }else{
      this.headerName+=char;
    }
  };
  WAITING_HEADER_SPACE(char){ //header后边有一个空格 再记录header的val
    if(char === ' '){
      return this.WAITING_HEADER_VALUE;
    }
  };
  WAITING_HEADER_VALUE(char){
    if(char === '\r'){
      this.headers[this.headerName] = this.headerValue;
      this.headerName = "";
      this.headerValue = "";
      return this.WAITING_HEADER_LINE_END;
    }else{
      this.headerValue+=char;
    }
  };
  WAITING_HEADER_LINE_END(char){ //head的当前行结束
    if(char === '\n'){
      return this.WAITING_HEADER_NAME
    }
  };
  WAITING_HEADER_BLOCK_END(char){ //header 结束
    if(char === '\n'){
      return this.WAITING_BODY
    }
  };
  WAITING_BODY(char){
    this.bodyParser&&this.bodyParser.receiveChar(char); //处理body的方法
  };

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
