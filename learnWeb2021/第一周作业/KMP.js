
//在研究研究  暂时有了想法  但是具体实现没有悟透
function findStr(str,attr){
  for(let i = 0; i < str.length;i++){
    if(str[i] === attr[0]){
      for(let j = 0; j < attr.length; j++){
        if(j === (attr.length - 1)&&str[i+j] === attr[j]){
          return i
        }
        if(str[i+j] != attr[j])break;
      }
    }
  }
  return false;
}