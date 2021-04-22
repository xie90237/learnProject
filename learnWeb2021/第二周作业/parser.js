const css = require("css")
const EOF = Symbol("EOF");

let currentToken = null;
let currentAttribute = null;
let currentTextNode = null;
let stack = [{type:"document",children:[]}]

let rules = [];//css规则
function setCSSRoles(cssContext){
    let ast = css.parse(cssContext);
    rules.push(...ast.stylesheet.rules);
}

function specificity(selector){
    let result = [0,0,0,0];
    var selectorParts = selector.split(" ");
    selectorParts.forEach(item => {
        switch(true){
            case item.charAt(0) === "#":{result[1]++}break;
            case item.charAt(0) === ".":{result[2]++}break;
            default:{
                result[3]++
            }
        }
    });
    return result;
}
function compare(sp1,sp2){
    let result = sp1.find((sp,index) => {
        return sp - sp2[index];
    });
    return result||0;
}

function match(element,selector){
    if(!selector || !element.attributes)return false;
    
    if(selector.charAt(0) == "#"){
        var attr = element.attributes.find(attr => attr.name == "id");
        if(attr && attr.value ==selector.replace("#","")) return true;
    }else if(selector.charAt(0) == "."){
        var attr = element.attributes.find(attr => attr.name == "class");
        if(attr && attr.value ==selector.replace(".","")) return true;
    }else{
        if(element.tagName == selector) return true;
    }
    return false;
}

function computedCSS(element){
    var elementList = stack.slice().reverse();
    if(!element.computedStyle){
        element.computedStyle = {};
    }
    for(let rule of rules){
        var selectorParts = rule.selectors[0].split(" ").reverse();
        if(!match(element,selectorParts[0])) continue;
        let matched = false;
        j = 1;
        for (let i = 0; i < elementList.length; i++) {
            if(!match(elementList[i],selectorParts[j])){
                j++;
            }
        }
        if(j >= selectorParts.length) matched = true;
        if(matched){
            //如果匹配  就往当前dom添加css element rule
            let sp = specificity(rule.selectors[0]);
            let computedStyle = element.computedStyle;
            for (const declaration of rule.declarations) {
                if(!computedStyle[declaration.property]) computedStyle[declaration.property] = {};
                
                computedStyle[declaration.property].value = declaration.value
                
                if(!computedStyle[declaration.property].specificity || compare(computedStyle[declaration.property].specificity,sp)<0){
                    computedStyle[declaration.property].specificity = sp;
                }
            }
        }

    }
}


function emit(token){
    let top = stack[stack.length - 1];
    
    if(token.type == "startTag"){
        let element = {
            type:"element",
            children:[],
            attributes:[],
        }

        element.tagName = token.tagName;

        for (const key in token) {
            if (key != "tagName" && key != "type") {
                element.attributes.push({
                    name:key,
                    value:token[key]
                })
            }
        }
        computedCSS(element);
        top.children.push(element);
        element.parent = top;

        if(!token.isSelfClosing){
            stack.push(element);
        }
        currentTextNode = null;
    }else if(token.type == "endTag"){
        if(top.tagName != token.tagName && !token.isSelfClosing){
            throw new Error(top.tagName + "标签不配对");
        }else{
            if(top.tagName == "style"){
                setCSSRoles(top.children[0].context);
            }
            stack.pop();
        }
        currentTextNode = null;
    }else if(token.type == "text"){
        if(currentTextNode == null){
            currentTextNode = {
                type:"text",
                context:""
            }
            top.children.push(currentTextNode);
        }else{
            currentTextNode.context += token.context;
        }
    }
}

function data(char){
    if(char === "<") return tagStart;
    if(char === EOF) {
        emit({
            type:"EOF"
        })
        return ;
    }
    emit({
        type:"text",
        context:char
    })
    return data;
}
function tagStart(char){
    if(char === "/")return tagEnd;
    if(char.match(/^[a-zA-Z]$/)){
        currentToken = {
            type:"startTag",
            tagName:""
        };
        return tagName(char)
    };
    return ;
}
function tagEnd(char){
    if(char.match(/^[a-zA-Z]$/)){
        currentToken = {
            type:"endTag",
            tagName:""
        };
        return tagName(char)
    }
    if(char === ">") return ;
    if(char === EOF) return ;
    return ;
}
function tagName(char){
    if(char.match(/^[\t\n\f ]$/)) return beforeAttributName;
    if(char === "/") return setClosingTag;
    if(char.match(/^[a-zA-Z]$/)){
        currentToken.tagName += char;
        return tagName;
    }
    if(char === ">") {
        emit(currentToken);
        return data;
    }
    return tagName;
}
function beforeAttributName(char){
    if(char.match(/^[\t\n\f ]$/)) return beforeAttributName;
    if(char === ">" || char === "/" || char == EOF) {
        return afterAttributName(char);
    }
    if(char === "=") {

    }else {
        currentAttribute = {
            name:"",
            value:""
        }
        return setAttributName(char);
    }
}
function setAttributName(char){
    if(char.match(/^[\t\n\f ]$/) || char === ">" || char === "/" || char == EOF){
        return afterAttributName;
    }
    if(char === "=") return beforeAttributValue;
    if(char == "\u0000"){

    }else if(char === "\"" || char === "'" || char === "<"){

    }else{
        currentAttribute.name += char;
        return setAttributName
    }
}
function beforeAttributValue(char){
    if(char.match(/^[\t\n\f ]$/) || char == "/" || char == ">" || char == EOF){
        return beforeAttributValue;
    }
    if(char =="\"")return doudleQuotedAttrbuteValue;
    if(char =="\'")return singleQuotedAttrbuteValue;
    if(char ==">"){};
    return unQuotedAttrbuteValue(char);
}
function afterQuotedAttrbuteValue(char){
    switch(true){
        case Boolean(char.match(/^[\t\n\f ]$/)):{
            return beforeAttributName;
        }break;
        case char == "/":{
            return setClosingTag;
        }break;
        case char == ">":{
            currentToken[currentAttribute.name] = currentAttribute.value;
            emit(currentToken);
            return data;
        }break;
        case char == EOF:{}break;
        default:{
            currentAttribute.value += char;
            return doudleQuotedAttrbuteValue;
        }break;
    }
}
function doudleQuotedAttrbuteValue(char){
    switch(char){
        case "\"":{
            currentToken[currentAttribute.name] = currentAttribute.value;
            return afterQuotedAttrbuteValue;
        }break;
        case "\u0000":{}break;
        case EOF:{}break;
        default:{
            currentAttribute.value += char;
            return doudleQuotedAttrbuteValue;
        }
    }
}
function singleQuotedAttrbuteValue(char){
    switch(char){
        case "\'":{
            currentToken[currentAttribute.name] = currentAttribute.value;
            return afterQuotedAttrbuteValue;
        }break;
        case "\u0000":{}break;
        case EOF:{}break;
        default:{
            currentAttribute.value += char;
            return singleQuotedAttrbuteValue;
        }
    }
}
function unQuotedAttrbuteValue(char){
    switch(true){
        case Boolean(char.match(/^[\t\n\f ]$/)):{
            currentToken[currentAttribute.name] = currentAttribute.value;
            return beforeAttributName;
        }break;
        case char=="/":{
            currentToken[currentAttribute.name] = currentAttribute.value;
            return setClosingTag;
        }break;
        case char==">":{
            currentToken[currentAttribute.name] = currentAttribute.value;
            emit(currentToken);
            return data;
        }break;
        case ( char == "\"" || char == "\'" || char == "<" || char == "=" || char == "`"):{}break;
        case char == "\u0000":{}break;
        case char == EOF:{}break;
        default:{
            currentAttribute.value += char;
            return unQuotedAttrbuteValue;
        }
    }
}
function afterAttributName(char){
    switch(true){
        case Boolean(char.match(/^[\t\n\f ]$/)):{
            return afterAttributName;
        }break;
        case char=="/":{
            return setClosingTag;
        }break;
        case char=="=":{
            return beforeAttributValue;
        }break;
        case char==">":{
            currentToken[currentAttribute.name] = currentAttribute.value;
            emit(currentToken);
            return data;
        }break;
        case char == EOF:{}break;
        default:{
            currentToken[currentAttribute.name] = currentAttribute.value;
            currentAttribute = {
                name:"",
                value:""
            }
            return setAttributName(char);
        }
    }
}
function setClosingTag(char){
    if(char === ">"){
        currentToken.isSelfClosing = true;
        emit(currentToken);
        return data;
    }
    if(char === EOF) return ;
    return ;
}

module.exports.parserHTML = function(html){
    let state = data;
    for (const char of html) {
        state = state(char);
    }
    state = state(EOF)
    return stack[0];
}