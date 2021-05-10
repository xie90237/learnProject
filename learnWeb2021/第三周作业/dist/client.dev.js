"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

//模块
var net = require("net");

var parser = require("./parser.js");

var images = require("images");

var render = require("./render.js");

var Request =
/*#__PURE__*/
function () {
  function Request(options) {
    var _this = this;

    _classCallCheck(this, Request);

    this.method = options.method || "GET";
    this.host = options.host;
    this.port = options.port || 80;
    this.path = options.path || "/";
    this.body = options.body || {};
    this.headers = _objectSpread({
      "Content-Type": "application/x-www-form-urlencoded"
    }, options.headers);

    if (this.headers["Content-Type"] === "application/json") {
      this.bodyText = JSON.stringify(this.body);
    } else if (this.headers["Content-Type"] === "application/x-www-form-urlencoded") {
      this.bodyText = Object.keys(this.body).map(function (key) {
        return "".concat(key, "=").concat(encodeURIComponent(_this.body[key]));
      }).join("&");
    }

    this.headers["Content-Length"] = this.bodyText.length;
  }

  _createClass(Request, [{
    key: "send",
    value: function send(connection) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var parser = new ResponseParser();

        if (connection) {
          connection.write(_this2.toString());
        } else {
          connection = net.createConnection({
            host: _this2.host,
            port: _this2.port
          }, function () {
            connection.write(_this2.toString());
          });
        }

        connection.on("data", function (data) {
          parser.receive(data.toString());

          if (parser.isFinished) {
            resolve(parser.response);
            connection.end();
          }
        });
        connection.on("error", function (error) {
          reject(error);
          connection.end();
        });
      });
    }
  }, {
    key: "toString",
    value: function toString() {
      var _this3 = this;

      return "".concat(this.method, " ").concat(this.path, " HTTP/1.1\r\n").concat(Object.keys(this.headers).map(function (key) {
        return "".concat(key, ": ").concat(_this3.headers[key]);
      }).join('\r\n'), "\r\n\n").concat(this.bodyText);
    }
  }]);

  return Request;
}();
/*body共三行 第一行为十六进制的body长度  第二行为body内容 第三行为0结束*/


var TrunkedBodyParser =
/*#__PURE__*/
function () {
  function TrunkedBodyParser() {
    _classCallCheck(this, TrunkedBodyParser);

    this.length = 0;
    this.content = [];
    this.isFinished = false;
    this.current = this.WAITING_LENGTH;
  }

  _createClass(TrunkedBodyParser, [{
    key: "receiveChar",
    value: function receiveChar(_char) {
      var fun = this.current(_char);

      if (fun) {
        this.current = fun;
      }
    }
  }, {
    key: "WAITING_LENGTH",
    value: function WAITING_LENGTH(_char2) {
      //判断新的一行是 body还是 16进制 通过\r判断?
      if (_char2 === '\r') {
        //判断新的一行的内容 \r是内容 否则就是16进制
        if (this.length === 0) this.isFinished = true; //当body的长度为0 则body解析结束

        return this.WAITING_LENGTH_LINE_END; //判断结束
      } else {
        //进入十六进制的字符获取body的内容字符长度 第一行处理 最后一行处理
        this.length *= 16; //16进制 进一位 *16

        this.length += parseInt(_char2, 16); //将16进制的字符转为10进制
      }
    }
  }, {
    key: "WAITING_LENGTH_LINE_END",
    value: function WAITING_LENGTH_LINE_END(_char3) {
      //判断当前行结束
      if (_char3 === '\n') {
        return this.READING_TRUNK; //进入body字符解析阶段
      }
    }
  }, {
    key: "READING_TRUNK",
    value: function READING_TRUNK(_char4) {
      //解析 body 内容 新的一行的内容
      this.content.push(_char4); //存入每一个字符

      this.length--; //每次执行 自长度减一  当等于0时代表body解析结束

      if (this.length === 0) {
        return this.WAITING_NEW_LINK; //进入新的一行
      }
    }
  }, {
    key: "WAITING_NEW_LINK",
    value: function WAITING_NEW_LINK(_char5) {
      //准备进入第新的一行
      if (_char5 === '\r') {
        return this.WAITING_NEW_LINK_END;
      }
    }
  }, {
    key: "WAITING_NEW_LINK_END",
    value: function WAITING_NEW_LINK_END(_char6) {
      //进入新的一行
      if (_char6 === '\n') {
        return this.WAITING_LENGTH;
      }
    }
  }]);

  return TrunkedBodyParser;
}();

var ResponseParser =
/*#__PURE__*/
function () {
  function ResponseParser() {
    _classCallCheck(this, ResponseParser);

    this.statusLine = "";
    this.headers = {};
    this.headerName = "";
    this.headerValue = "";
    this.bodyParser = null;
    this.current = this.WAITING_STATUS_LINE;
  }

  _createClass(ResponseParser, [{
    key: "receive",
    value: function receive(string) {
      for (var i = 0; i < string.length; i++) {
        var fun = this.current(string.charAt(i));

        if (fun) {
          this.current = fun;
        }
      }
    }
  }, {
    key: "WAITING_STATUS_LINE",
    value: function WAITING_STATUS_LINE(_char7) {
      //响应体的第一行状态码
      if (_char7 === '\r') {
        return this.WAITING_STATUS_LINE_END;
      } else {
        this.statusLine += _char7;
      }
    }
  }, {
    key: "WAITING_STATUS_LINE_END",
    value: function WAITING_STATUS_LINE_END(_char8) {
      //第一行状态解析结束
      if (_char8 === '\n') {
        return this.WAITING_HEADER_NAME;
      }
    }
  }, {
    key: "WAITING_HEADER_NAME",
    value: function WAITING_HEADER_NAME(_char9) {
      //进入到header体内
      if (_char9 === ':') {
        return this.WAITING_HEADER_SPACE; //遇到：则进入空格判断
      } else if (_char9 === '\r') {
        if (this.headers['Transfer-Encoding'] == "chunked") {
          this.bodyParser = new TrunkedBodyParser();
        }

        return this.WAITING_HEADER_BLOCK_END; //遇到\r就是到了整个headers结束的地方了
      } else {
        this.headerName += _char9;
      }
    }
  }, {
    key: "WAITING_HEADER_SPACE",
    value: function WAITING_HEADER_SPACE(_char10) {
      //header后边有一个空格 再记录header的val
      if (_char10 === ' ') {
        return this.WAITING_HEADER_VALUE;
      }
    }
  }, {
    key: "WAITING_HEADER_VALUE",
    value: function WAITING_HEADER_VALUE(_char11) {
      if (_char11 === '\r') {
        this.headers[this.headerName] = this.headerValue;
        this.headerName = "";
        this.headerValue = "";
        return this.WAITING_HEADER_LINE_END;
      } else {
        this.headerValue += _char11;
      }
    }
  }, {
    key: "WAITING_HEADER_LINE_END",
    value: function WAITING_HEADER_LINE_END(_char12) {
      //head的当前行结束
      if (_char12 === '\n') {
        return this.WAITING_HEADER_NAME;
      }
    }
  }, {
    key: "WAITING_HEADER_BLOCK_END",
    value: function WAITING_HEADER_BLOCK_END(_char13) {
      //header 结束
      if (_char13 === '\n') {
        return this.WAITING_BODY;
      }
    }
  }, {
    key: "WAITING_BODY",
    value: function WAITING_BODY(_char14) {
      this.bodyParser && this.bodyParser.receiveChar(_char14); //处理body的方法
    }
  }, {
    key: "isFinished",
    get: function get() {
      return this.bodyParser && this.bodyParser.isFinished;
    }
  }, {
    key: "response",
    get: function get() {
      this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);
      return {
        statusCode: RegExp.$1,
        statusText: RegExp.$2,
        headers: this.headers,
        body: this.bodyParser.content.join('')
      };
    }
  }]);

  return ResponseParser;
}();

void function _callee() {
  var request, response, dom, viewport;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          request = new Request({
            method: "POST",
            host: "127.0.0.1",
            port: "8000",
            path: "/",
            headers: _defineProperty({}, "X-Foo2", "customer"),
            body: {
              name: "emmmm",
              age: 165,
              sex: 1,
              aaa: 2222
            }
          });
          _context.next = 3;
          return regeneratorRuntime.awrap(request.send());

        case 3:
          response = _context.sent;
          dom = parser.parserHTML(response.body);
          viewport = images(800, 600);
          render(viewport, dom);
          viewport.save("aaa.jpg");
          console.log(dom);

        case 9:
        case "end":
          return _context.stop();
      }
    }
  });
}();