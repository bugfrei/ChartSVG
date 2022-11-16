
function createDIV() {
    //return document.createElementNS('http://www.w3.org/2000/div', 'div');
    return document.createElement('div');
}
function createSVG() {
    return document.createElementNS('http://www.w3.org/2000/svg', 'svg');
}

function createText() {
    return document.createElementNS('http://www.w3.org/2000/svg', 'text');
}
function createRect() {
    return document.createElementNS('http://www.w3.org/2000/svg', 'rect');
}
function createButton() {
    return document.createElement('button');
}
function createElement(el) {
    return document.createElement(el);
}

class DataManager {
    constructor() {
        this._odataValue = "From HANA!";
    }

    get odataValue() {
        console.log(`[PROPERTY READ: odataValue = ${this._odataValue}`);

        return this._odataValue;
    }
    set odateValue(value) {
        this._odataValue = value;
        console.log(`[PROPERTY CHANGED] odataValue = ${value}`);
    }
}

class SimpleUI {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.div = document.getElementById("chart");
        this.svg = createSVG();
        this.svg.setAttribute('width', 1000);
        this.svg.setAttribute('height', 200);
        this.div.appendChild(this.svg);
        document.onkeydown = this.eventDocument_OnKeyDown;
        document.onmousedown = this.eventDocument_OnMouseDown;
        document.onmousemove = this.eventDocument_OnMouseMove;

        this.div.onmousedown = this.eventDIV_OnMouseDown;
        this.div.onmousemove = this.eventDIV_OnMouseMove;
    }

    eventDocument_OnKeyDown(e) {
        console.log(`[EVENT] Document.keydown: SHIFT = ${e.shiftKey}, CTRL = ${e.ctrlKey}`);
    }
    eventDocument_OnMouseDown(e) {
        console.log(`[EVENT] Document.mouseDown: X = ${e.clientX}, Y = ${e.clientY}`);
    }
    eventDocument_OnMouseMove(e) {
        console.log(`[EVENT] Document.mouseMove: X = ${e.clientX}, Y = ${e.clientY}`);
    }
    eventDIV_OnMouseDown(e) {
        console.log(`[EVENT] DIV.mouseDown: X = ${e.clientX}, Y = ${e.clientY}`);
    }
    eventDIV_OnMouseMove(e) {
        console.log(`[EVENT] DIV.mouseMove: X = ${e.clientX}, Y = ${e.clientY}`);
    }

    addCSS(css) {
        var head = document.getElementsByTagName('head')[0];
        var s = createElement("style");
        s.setAttribute("type", "text/css");
        if (s.styleSheet) {
            s.styleSheet.cssText = css;
        }
        else {
            s.appendChild(document.createTextNode(css));
        }
        head.appendChild(s);
    }
    create() {
        while (this.svg.firstChild) { this.svg.removeChild(this.svg.firstChild); }

        var rect = createRect();
        rect.setAttribute('x', 0);
        rect.setAttribute('y', 0);
        rect.setAttribute('width', 1000);
        rect.setAttribute('height', 200);
        rect.setAttribute("fill", "#EEEEFF");
        this.svg.appendChild(rect);
        this.rect = rect;

        this.text1 = createText();
        this.text1.setAttribute('x', 20);
        this.text1.setAttribute('y', 100);
        this.text1.innerHTML = this.dataManager.odataValue;
        this.text1.setAttribute('fill', "#000000");
        this.text1.setAttribute('style', "font-size:3em;");
        this.svg.appendChild(this.text1);

        this.div.appendChild(createElement("br"));

        this.btn = createButton();
        this.btn.setAttribute("class", "btn");
        this.btn.innerHTML = "click me";
        this.btn.onclick = function () {
            console.log(`[EVENT] Button_Click`);
        }
        this.div.appendChild(this.btn);
    }



}

var ui;

async function start() { // @function Start
    const dataManager = new DataManager();
    ui = new SimpleUI(dataManager);
    ui.addCSS('.selectionDialog{border:1px solid #0854a0;border-radius:5px;color:#0854a0;background-color:#ebf5fe;font-size:16px;font-weight:700;font-family:"Roboto",sans-serif}.btnDialog{background-color:#fff;border:1px solid #0854a0;border-radius:5px;color:#0854a0;padding:0;font-size:12px;cursor:pointer;min-width:60px;min-height:32px;margin:0 5px 0 0}.btnDialog:hover{background-color:#ebf5fe;transition:.7s}.btnDialog:active{background-color:#0854a0;transition:0;color:#fff;fill:#fff}.btnDialog:disabled{color:#9cbbda;border-color:#9cbbda}.btnDialog:focus{outline:1px solid #0854a0}.btn svg{vertical-align:middle;fill:#0854a0;width:28px;height:28px}button,select,label,option,p{color:#0854a0;font-size:18px;font-weight:700;font-family:"Roboto",sans-serif}.label{display:inline-block;box-sizing:border-box;background-color:#fff;color:#0854a0;font-size:18px;min-width:103px;min-height:38px;margin:0 5px 0 0;text-align:center;padding-top:8px}input[type="text"],.select{box-sizing:border-box;background-color:#fff;border:1px solid #0854a0;border-radius:5px;color:#0854a0;padding:0;font-size:18px;cursor:pointer;min-width:103px;min-height:38px;margin:0 5px 0 0}input[type="text"]:focus,.select:focus{outline:1px solid #0854a0}input[type="text"]{padding:0 8px}input[type="checkbox"]{color:#0854a0;min-width:22px;min-height:22px}.btn{background-color:#fff;border:1px solid #0854a0;border-radius:5px;color:#0854a0;padding:0;font-size:18px;cursor:pointer;min-width:103px;min-height:38px;margin:0 5px 0 0}.grpLeft{border-radius:5px 0 0 5px;margin:0}.grpInner{border-left:none;border-radius:0 0 0 0;margin:0}.grpRight{border-left:none;border-radius:0 5px 5px 0}.btn:hover{background-color:#ebf5fe;transition:.7s}.btn:active{background-color:#0854a0;transition:0;color:#fff;fill:#fff}.btn:disabled{color:#9cbbda;border-color:#9cbbda}.btn:focus{outline:1px solid #0854a0}.grpRight:focus{border:1px solid #0854a0;outline:1px solid #0854a0}.grpLeft:focus{border:1px solid #0854a0;outline:1px solid #0854a0}.grpInner:focus{border:1px solid #0854a0;outline:1px solid #0854a0}');
    ui.create();




}


start();
