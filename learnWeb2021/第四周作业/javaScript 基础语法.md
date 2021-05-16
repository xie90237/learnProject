InputElement ::= WhiteSpace | LineTerminator | Comment | Token

WhiteSpace ::= " " | " " //空白符
LineTerminator ::= SingleLineComment | MultilineComment
SingleLineComment ::= "/" "/" \<any>*

MultilineComment ::= "/" "*" ([^*] | "*"[^/])* "*" "/"

Token ::= Literal | Keywords | Identifier | Punctuator
Literal ::= NumberLiteral | BooleanLiteral | StringLiteral | NullLiteral
Keywords ::= "if" | "else" | "for" | "function" | "var".....
Punctuator ::= "+" | "-" | "*" | "/" | "{" | "}" .....

Program ::= Statement+

Statement ::= ExpressionStatement | IfStatement | ForStatement | WhileStatement | VariableDeclaration | FunctionDeclaration | ClassDeclaration | BreakStatement | CountinueStatement | ReturnStatement | ThrowStatement | TryStatement | Block

IfStatement ::= "if" "(" Expression ")" Statement

Block = "{" Statement "}"

TryStatement ::= "try" "{" Statement+ "}" "catch" "(" Expression ")" "{" Statement+ "}"

ExpressionStatement ::= Expression ";"

Expression ::= AdditiveExpression

AdditiveExpression ::= MultiplicativeExpression | AdditiveExpression ("+" | "-") MultiplicativeExpression

MultiplicativeExpression ::= UnaryExprssion | MultiplicativeExpression ("*" | "/") UnaryExpression

UnaryExpression ::= PrimaryExpression | ("+" | "-" | "typeof") PrimaryExpression

PrimaryExpression ::= "(" Expression ")" | Literal | Identifier
