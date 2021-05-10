const images = require("images")
function render(viewport,element){
    if(element.style){
        let width = 0;
        let height = 0;
        if(element.style.width || element.style.height){
            width = element.style.width;
            height = element.style.height||element.parent.style.height;
        }
        var img = images(width,height);
        if(element.style["background-color"]){
            let color = element.style["background-color"] || "rgb(0,0,0)";
            color.match(/rgb\((\d+),(\d+),(\d+)\)/);
            img.fill(Number(RegExp.$1),Number(RegExp.$2),Number(RegExp.$3),Number(RegExp.$4));
            viewport.draw(img,element.style.left||0,element.style.top||0);
        }
    }

    if(element.children){
        for(var child of element.children){
            render(viewport,child);
        }
    }
}
module.exports = render;