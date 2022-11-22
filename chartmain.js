//  const DEFAULT_ZOOM_FREQ = 1 * 64;   // Zoomfaktor Default (Anzahl Messwerte je Pixel)
const DEFAULT_ZOOM_FREQ = null;         // Zoomfaktor wird berechnet für vollansicht (Anzahl Messwerte / Window.Width)
//const DIAGRAM_HEIGHT = 88;
const DIAGRAM_HEIGHT = 80;
const DEFAULT_XGAP = 1;
const DIV_DEFAULT_HEIGHT = "150px";
const DIV_DEFAULT_WIDTH = "160px";
const DEFAULT_BACKGROUND = "#FFFFFF";
const DEFAULT_ZOOMOUT_PERCENT = 30;
const SELECTION_LINK_TEXT_COLOR = "#0854a0";
const SELECTION_COLOR = "#0000FF";
const SELECTION_OPACITY = 0.5;
const SELECTION_TITELCOLOR = "#FF0000";
const SELECTION_TITLEOPACITY = 0.3;
const SELECTION_ZOOMCOLOR = "#DDDDDD";
const SELECTION_ZOOMOPACITY = 0.8;
const SELECTION_NOTECOLOR = "#DDDDDD";
const SELECTION_NOTEOPACITY = 0.8;
const SELECTION_REPORTCOLOR = "#DDDDDD";
const SELECTION_REPORTOPACITY = 0.8;
const SELECTION_MIN_VALUES = 100; // Wenn eine Markierung sehr klein ist, wird dieser Wert als min. größe einer Markierung verwendet (ANZAHL DATENWERTE)
const SELECTION_MIN_PIXEL = 20; // Wenn eine Markierung sehr klein ist, wird dieser Wert als min. größe einer Markierung verwendet (ANZAHL PIXEL)
const SELECTION_DIALOG_BACKGROUNDCOLOR = "#DDDDDD";
const SELECTION_DIALOG_WIDTH = "300"; // px
const SELECTION_DIALOG_HEIGHT = "340"; // px
const SELECTION_DIALOG_BORDERCOLOR = "black";
const SELECTION_DIALOG_BORDERWIDTH = "2"; // px
const MARK_DRAGBOX_COLOR = "#000000";
const MARK_DRAGBOX_OPACITY = 0.2;
const MARK_DRAGBOX_WIDTH = 20;
const MARK_SOURCE_DOC = "A";
const MARK_SOURCE_ML = "M";
const MARK_SOURCE_REPORT = "R";
const MARK_OPACITY = 0.5;
const MARK_TEXT_COLOR = "#0854a0";
const HORIZONTAL_SCALE_HEIGHT = 60;
//const HORIZONTAL_SCALE_BACKGROUND = "#FF0000"; // eigentlich #AAAAAA
const HORIZONTAL_SCALE_BACKGROUND = "#dddddd"; // eigentlich #333333
const HSCALE_TEXT_COLOR = "#000000";
const HSCALE_MIN_PIXEL_DISTANCE_X = 5;
const HSCALE_ALIGNMENTS = {
    Top: "top",
    Bottom: "bottom",
    Center: "center"
}
const VSCALE_DEFAULT_WIDTH = "80px";
const VSCALE_LINE_WIDTH = 1;
const VSCALE_LINE_OPACITY = 1;
const VSCALE_LINE_COLOR = "#000000";
const VSCALE_ALIGNMENTS = {
    Left: "left",
    Right: "right"
};
const SHIFTED_SCROLL_FACTOR = 8; // 8 faches Scrollen bei Shift+Rechtsklick+Move
const DIV_TYPES = {
    MenuTop: "menutop",
    MenuLeft: "menuleft",
    MenuRight: "menuright",
    MenuBottom: "menubottom",
    SkalaLeft: "skalaleft",
    SkalaRight: "skalaright"
};
const UI_TYPES = {
    MenuTop: "menutop",
    MenuLeft: "menuleft",
    MenuRight: "menuright",
    MenuBottom: "menubottom",
};
const ELEMENTTYPES = {
    Button: "button",
    ImageButton: "imagebutton",
    SVGButton: "svgbutton",
    Spacer: "spacer",
    Checkbox: "checkbox",
    Number: "number",
    Radio: "radio",
    Range: "range",
    Text: "text",
    Time: "time",
    Label: "label",
    Select: "select"
};
const LABEL_POSITIONS = {
    Left: "left",
    Right: "right"
};
const SCROLL_POSITION = {           // Es wird so gescrollt das
    LeftLeft: "leftleft",           // Scrollbalken links, gewünschte Position links ist
    LeftCenter: "leftCenter",       // Scrollbalken links, gewünschte Position zentriert ist
    Center: "center",               // Scrollbalken zentriert, gewünschten Position zentriert ist
    RightRight: "rightright",            // Scrollbalken rechts, gewünschte Position rechts ist
    RightCenter: "rightcenter"      // Scrollbalken rechts, gewünschte Poisition zentriert ist
};
const MOUSEBUTTONS = {
    Left: 0,
    Middle: 1,
    Right: 2
};
const VIEWTYPES = {
    Undo: "undo",
    Saved: "saved"
};
const HORIZONTAL_SCALE_CAPTION_MINDIST_X = 60;
//const HORIZONTAL_SCAPE_CAPTION_FONTSIZE = "0.8em";
const HORIZONTAL_SCALE_CAPTION_FONTSIZE = "12px";
const MENU_MARGIN_BOTTOM = "1px";

var x;// @warn warnung


var chartManager;

class ChartManager {
    // Default-Values

    constructor(json, dataManager) {
        this.json = json;
        this._partValuesStart = 0; // Default von Anfang an
        this._partValuesCount = this.json.data.length; // Default alles anzeigen (wird beim Änderung von ZoomFreq und MaxFreq berechnet)

        this.allZoom = null; // * 2 notwendig, da Standardansicht IMMER Min/Max verwendet und damit 2 Datenpunkte pro Value anstehen
        this.dataManager = dataManager;
        this._xGap = DEFAULT_XGAP;
        if (DEFAULT_ZOOM_FREQ) {
            this._zoom_freq = DEFAULT_ZOOM_FREQ;
        }
        else {
            this._zoom_freq = this.allZoom;
            // Damit diese Platz haben muss der Zoom halb zu groß sein
        }
        this._maximumXStepDivider = 1;
        this.charts = [];
        this._maxFreq = 0;
        this._dialogNr = 0;         // Fortlaufende Nummer zur identifikation neuer Dialoge
        this._dialogs = [];         // Auflistung der Dialoge
        this._marks = [];           // Auflistung der Markierungen (egal ob Arzt oder ML)
        this._verticalScale = [];   // Auflistungen der vertikalen Skalas (in der Regel nur eine für links)
        this._horizontalScale = []; // Auflistung der horizontalen Skalas (in der Regel nur eine für oben)
        this._uimanagers = [];      // Auflistung der UIs
        this._views = [];           // Auflistung vorheriger Views (für Undo View und gespeicherte Views)
        this.horizontalScaleShowsTime = true;   // zeigt die skala die uhrzeit (true) oder die Zeitdifferenz (false)
        this.visibility = {
            markDoc: true,
            markML: true,
            markReport: true,
            markText: true
        };
        this.HScaleRanges = [       // die Bereiche, die in der Horizontalen Skala dargestellt werden können 
            {
                seconds: 14400,      // 4 Stundenabstände
                minPixelDistForText: HORIZONTAL_SCALE_CAPTION_MINDIST_X,         // Minimum Abstand zwischen 2 Beschriftungen in Pixel
                height: 80,
                color: "#000000",
                width: 1,
                drawText: false
            },
            {
                seconds: 3600,      // Stundenabstände
                minPixelDistForText: HORIZONTAL_SCALE_CAPTION_MINDIST_X,         // Minimum Abstand zwischen 2 Beschriftungen in Pixel
                height: 80,
                color: "#000000",
                width: 1,
                drawText: false
            },
            {
                seconds: 1800,       // 30 Minuten
                minPixelDistForText: HORIZONTAL_SCALE_CAPTION_MINDIST_X,         // Minimum Abstand zwischen 2 Beschriftungen in Pixel
                height: 75,
                color: "#000000",
                width: 1,
                drawText: false
            },
            {
                seconds: 600,       // 10 Minuten
                minPixelDistForText: HORIZONTAL_SCALE_CAPTION_MINDIST_X,         // Minimum Abstand zwischen 2 Beschriftungen in Pixel
                height: 70,
                color: "#000000",
                width: 1,
                drawText: false
            },
            {
                seconds: 300,       // 5 Minuten
                minPixelDistForText: HORIZONTAL_SCALE_CAPTION_MINDIST_X,         // Minimum Abstand zwischen 2 Beschriftungen in Pixel
                height: 50,
                color: "#000000",
                width: 0.8,
                drawText: false
            },
            {
                seconds: 60,        // 1 Minute
                minPixelDistForText: HORIZONTAL_SCALE_CAPTION_MINDIST_X,         // Minimum Abstand zwischen 2 Beschriftungen in Pixel
                height: 30,
                color: "#000000",
                width: 0.6,
                drawText: false
            },
            {
                seconds: 10,        // 10 Sekunden
                minPixelDistForText: HORIZONTAL_SCALE_CAPTION_MINDIST_X,         // Minimum Abstand zwischen 2 Beschriftungen in Pixel
                height: 20,
                color: "#000000",
                width: 0.4,
                drawText: false
            },
            {
                seconds: 1,         // 1 Sekunde
                minPixelDistForText: HORIZONTAL_SCALE_CAPTION_MINDIST_X,         // Minimum Abstand zwischen 2 Beschriftungen in Pixel
                height: 10,
                color: "#000000",
                width: 0.2,
                drawText: false
            }
        ]
        this._resizeData = {        // Zum verarbeiten von Resize (MouseDown...MouseMove...MouseUp)
            dialog: null,
            mark: null,
            oldStart: 0,
            oldEnd: 0,
            anchorLeft: null,
            anchorRight: null,
            nr: 0,
            state: 0,
            offsetX: 0
        };
        this._clickStatus = {      // Zum verarbeiten von einer Auswahl (Start/Ende mit Klicks) 
            clickNumber: 0,
            click1OffsetX: 0,
            click2OffsetX: 0,
            clickChart: null,
            selectionRect: null,
            selectionElements: [],
            get left() {
                return this.click1OffsetX < this.click2OffsetX ? this.click1OffsetX : this.click2OffsetX;
            },
            get right() {
                return this.click1OffsetX < this.click2OffsetX ? this.click2OffsetX : this.click1OffsetX;
            },
            get width() {
                return this.right - this.left;
            },
            removeSelectionRect() {
                console.log("RemoveSel");
                if (this.clickChart != null && this.selectionRect != null) {
                    try {
                        this.clickChart.svg.removeChild(this.selectionRect);
                    }
                    catch (e) { }
                    this.selectionRect = null;
                }
                while (this.selectionElements.length > 0) {
                    try {
                        this.clickChart.svg.removeChild(this.selectionElements.pop());
                    }
                    catch (e) { }
                }
            },
            addSelectionRect() {
                this.removeSelectionRect();
                this.selectionRect = createRect();
                this.selectionRect.setAttribute('x', this.click1OffsetX);
                this.selectionRect.setAttribute('y', 0);
                this.selectionRect.setAttribute('width', 1);
                this.selectionRect.setAttribute('height', DIAGRAM_HEIGHT);
                this.selectionRect.setAttribute("fill", SELECTION_COLOR);
                this.selectionRect.setAttribute("fill-opacity", SELECTION_OPACITY);
                this.clickChart.svg.appendChild(this.selectionRect);
            },
            expandSelectionRect() {
                if (this.selectionRect != null) {
                    var x1 = this.click1OffsetX < this.click2OffsetX ? this.click1OffsetX : this.click2OffsetX;
                    var x2 = this.click1OffsetX < this.click2OffsetX ? this.click2OffsetX : this.click1OffsetX;
                    var difPixel = x2 - x1;
                    var difValues = chartManager.calcRowNumberFromSelectionPosition(difPixel);
                    if (difValues < SELECTION_MIN_VALUES) {
                        // Zu kleiner Bereich, Bereich links und rechts auf SELECTION_MIN_VALUES erweitern
                        var expandValues = SELECTION_MIN_VALUES - difValues;
                        var expandPixel = chartManager.calcPixelFromRowNumber(expandValues);
                        x1 -= expandPixel;
                        x2 += expandPixel;
                        this.click1OffsetX = x1;
                        this.click2OffsetX = x2;
                    }
                    difPixel = x2 - x1;
                    if (difPixel < SELECTION_MIN_PIXEL) {
                        expandPixel = SELECTION_MIN_PIXEL - difPixel;
                        x1 -= (expandPixel / 2);
                        x2 += (expandPixel / 2);
                        this.click1OffsetX = x1;
                        this.click2OffsetX = x2;
                    }

                    // Elementhöhe berechnen (für eine Zeile, Zeit, Zoom, ...)
                    const elementHeight = DIAGRAM_HEIGHT / 6; // 3 Elemente und etwas Abstand

                    this.selectionRect.setAttribute('x', x1);
                    this.selectionRect.setAttribute('width', x2 - x1);
                    // Titel
                    var linkYPos = 5;
                    let anchor = createAnchor();
                    anchor.setAttribute('href', 'javascript:selectionTitleClicked();');
                    anchor.setAttribute('x', x1 + 10);
                    anchor.setAttribute('y', linkYPos);
                    anchor.setAttribute('width', x2 - x1 - 20);
                    anchor.setAttribute('height', elementHeight);
                    anchor.setAttribute('dest', "title");
                    this.clickChart.svg.appendChild(anchor);

                    let title = createRect();
                    title.setAttribute('x', x1 + 10);
                    title.setAttribute('y', linkYPos);
                    title.setAttribute('width', x2 - x1 - 20);
                    title.setAttribute('height', elementHeight);
                    title.setAttribute('fill', SELECTION_TITELCOLOR);
                    title.setAttribute('fill-opacity', SELECTION_TITLEOPACITY);
                    title.setAttribute('dest', "title");

                    let text = createText();
                    text.setAttribute('x', x1 + 20);
                    text.setAttribute('y', linkYPos + (elementHeight * 0.85));
                    text.setAttribute('dest', "title");
                    text.setAttribute('font-size', elementHeight);
                    this.clickChart.svg.appendChild(anchor);
                    const time = dateFormat(chartManager.Time(x1), "HH:MM:SS");
                    const seconds = (chartManager.Seconds(x2 - x1)) - (chartManager.partValuesStart / chartManager.maxFreq);
                    const secondsStr = secondFormat(seconds, "HH:MM:SS");

                    text.innerHTML = time + ` (${secondsStr})`; // TODO i18n Zeitformat!
                    text.setAttribute('fill', 'black');

                    //this.clickChart.svg.appendChild(title);
                    anchor.appendChild(title);
                    anchor.appendChild(text);
                    this.selectionElements.push(anchor);
                    text.setAttribute('x', x1 + 10 + (x2 - x1 - 20) / 2 - (text.getBoundingClientRect().width / 2));
                    var actWidth = title.getAttribute("width");
                    var textWidth = text.getBoundingClientRect().width;
                    if (actWidth < textWidth * 1.2) {
                        title.setAttribute("width", textWidth * 1.2);
                        var textCenterPoint = Number(text.getAttribute("x")) + Number(textWidth / 2);
                        var rectLeftPoint = textCenterPoint - (textWidth * 1.2 / 2);
                        title.setAttribute("x", rectLeftPoint);
                    }

                    // Zoom
                    var elementYPos = 5 + (elementHeight * 1.3);
                    anchor = createAnchor();
                    anchor.setAttribute('href', 'javascript:doZoom();');
                    anchor.setAttribute('x', x1 + 10);
                    anchor.setAttribute('y', elementYPos);
                    anchor.setAttribute('width', x2 - x1 - 20);
                    anchor.setAttribute('height', elementHeight);
                    anchor.setAttribute('dest', "title");
                    this.clickChart.svg.appendChild(anchor);

                    title = createRect();
                    title.setAttribute('x', x1 + 10);
                    title.setAttribute('y', elementYPos);
                    title.setAttribute('width', x2 - x1 - 20);
                    title.setAttribute('height', elementHeight);
                    title.setAttribute('fill', SELECTION_ZOOMCOLOR);
                    title.setAttribute('fill-opacity', SELECTION_ZOOMOPACITY);
                    title.setAttribute('dest', "title");

                    text = createText();
                    text.setAttribute('x', x1 + 20);
                    text.setAttribute('y', elementYPos + (elementHeight * 0.85));
                    text.setAttribute('dest', "title");
                    text.setAttribute('font-size', elementHeight);
                    this.clickChart.svg.appendChild(anchor);

                    text.innerHTML = `Zoom`;  // TODO i18n
                    text.setAttribute('fill', SELECTION_LINK_TEXT_COLOR);

                    //this.clickChart.svg.appendChild(title);
                    anchor.appendChild(title);
                    anchor.appendChild(text);
                    this.selectionElements.push(anchor);
                    text.setAttribute('x', x1 + 10 + (x2 - x1 - 20) / 2 - (text.getBoundingClientRect().width / 2));
                    actWidth = title.getAttribute("width");
                    textWidth = text.getBoundingClientRect().width;
                    if (actWidth < textWidth * 1.2) {
                        title.setAttribute("width", textWidth * 1.2);
                        var textCenterPoint = Number(text.getAttribute("x")) + Number(textWidth / 2);
                        var rectLeftPoint = textCenterPoint - (textWidth * 1.2 / 2);
                        title.setAttribute("x", rectLeftPoint);
                    }

                    // Note / Ereignis
                    elementYPos = 5 + (elementHeight * 2.6);
                    var yPos = this.mouseData.clientY;
                    var xPos = this.mouseData.clientX;
                    //var yPos = this.clickChart.svg.parentElement.offsetTop + this.clickChart.svg.parentElement.parentElement.parentElement.offsetTop + DIAGRAM_HEIGHT;
                    anchor = createAnchor();
                    anchor.setAttribute('href', `javascript:doNote(${xPos}, ${yPos});`);
                    anchor.setAttribute('x', x1 + 10);
                    anchor.setAttribute('y', elementYPos);
                    anchor.setAttribute('width', x2 - x1 - 20);
                    anchor.setAttribute('height', elementHeight);
                    anchor.setAttribute('dest', "title");
                    this.clickChart.svg.appendChild(anchor);

                    title = createRect();
                    title.setAttribute('x', x1 + 10);
                    title.setAttribute('y', elementYPos);
                    title.setAttribute('width', x2 - x1 - 20);
                    title.setAttribute('height', elementHeight);
                    title.setAttribute('fill', SELECTION_NOTECOLOR);
                    title.setAttribute('fill-opacity', SELECTION_NOTEOPACITY);
                    title.setAttribute('dest', "title");

                    text = createText();
                    text.setAttribute('x', x1 + 20);
                    text.setAttribute('y', elementYPos + (elementHeight * 0.85));
                    text.setAttribute('dest', "title");
                    text.setAttribute('font-size', elementHeight);
                    this.clickChart.svg.appendChild(anchor);

                    text.innerHTML = `Ereignis`; // TODO i18n
                    text.setAttribute('fill', SELECTION_LINK_TEXT_COLOR);

                    //this.clickChart.svg.appendChild(title);
                    anchor.appendChild(title);
                    anchor.appendChild(text);
                    this.selectionElements.push(anchor);
                    text.setAttribute('x', x1 + 10 + (x2 - x1 - 20) / 2 - (text.getBoundingClientRect().width / 2));
                    actWidth = title.getAttribute("width");
                    textWidth = text.getBoundingClientRect().width;
                    if (actWidth < textWidth * 1.2) {
                        title.setAttribute("width", textWidth * 1.2);
                        var textCenterPoint = Number(text.getAttribute("x")) + Number(textWidth / 2);
                        var rectLeftPoint = textCenterPoint - (textWidth * 1.2 / 2);
                        title.setAttribute("x", rectLeftPoint);
                    }
                    // Report
                    elementYPos = 5 + (elementHeight * 3.9);
                    var yPos = this.mouseData.clientY;
                    var xPos = this.mouseData.clientX;
                    //var yPos = this.clickChart.svg.parentElement.offsetTop + this.clickChart.svg.parentElement.parentElement.parentElement.offsetTop + DIAGRAM_HEIGHT;
                    anchor = createAnchor();
                    anchor.setAttribute('href', `javascript:doReport(${xPos}, ${yPos});`);
                    anchor.setAttribute('x', x1 + 10);
                    anchor.setAttribute('y', elementYPos);
                    anchor.setAttribute('width', x2 - x1 - 20);
                    anchor.setAttribute('height', elementHeight);
                    anchor.setAttribute('dest', "title");
                    this.clickChart.svg.appendChild(anchor);

                    title = createRect();
                    title.setAttribute('x', x1 + 10);
                    title.setAttribute('y', elementYPos);
                    title.setAttribute('width', x2 - x1 - 20);
                    title.setAttribute('height', elementHeight);
                    title.setAttribute('fill', SELECTION_REPORTCOLOR);
                    title.setAttribute('fill-opacity', SELECTION_REPORTOPACITY);
                    title.setAttribute('dest', "title");

                    text = createText();
                    text.setAttribute('x', x1 + 20);
                    text.setAttribute('y', elementYPos + (elementHeight * 0.85));
                    text.setAttribute('dest', "title");
                    text.setAttribute('font-size', elementHeight);
                    this.clickChart.svg.appendChild(anchor);

                    text.innerHTML = `Report`; // TODO i18n
                    text.setAttribute('fill', SELECTION_LINK_TEXT_COLOR);

                    //this.clickChart.svg.appendChild(title);
                    anchor.appendChild(title);
                    anchor.appendChild(text);
                    this.selectionElements.push(anchor);
                    text.setAttribute('x', x1 + 10 + (x2 - x1 - 20) / 2 - (text.getBoundingClientRect().width / 2));
                    actWidth = title.getAttribute("width");
                    textWidth = text.getBoundingClientRect().width;
                    if (actWidth < textWidth * 1.2) {
                        title.setAttribute("width", textWidth * 1.2);
                        var textCenterPoint = Number(text.getAttribute("x")) + Number(textWidth / 2);
                        var rectLeftPoint = textCenterPoint - (textWidth * 1.2 / 2);
                        title.setAttribute("x", rectLeftPoint);
                    }
                }
            },
            resizeSelectionRect(offsetX) {
                if (this.selectionRect != null) {
                    var x1 = this.click1OffsetX < offsetX ? this.click1OffsetX : offsetX;
                    var x2 = this.click1OffsetX < offsetX ? offsetX : this.click1OffsetX;
                    this.selectionRect.setAttribute('x', x1);
                    this.selectionRect.setAttribute('width', x2 - x1);
                }
            }
        }
        this.markTypes = [
            {
                text: "Normal",     // TODO i18n
                color: "#00FF00"
            },
            {
                text: "Apnoe",       // TODO i18n
                color: "#FF0000",
            },
            {
                text: "Auffällig",  // TODO i18n
                color: "#0000FF"
            },
            {
                text: "Ungültig",   // TODO i18n
                color: "#555555"
            },
            {
                text: "Sonstiges",  // TODO i18n
                color: "#FFFF00"
            }
        ];
        this.reportTypes = [
            {
                text: "Normal",     // TODO i18n
                color: "#00FF00",
                info: "Wird im Report eingefügt."
            },
            {
                text: "Gruppe 1",       // TODO i18n
                color: "#44FF44",
                info: "Wird im Report im Bereich 1 eingefügt."
            },
            {
                text: "Gruppe 2",  // TODO i18n
                color: "#88FF88",
                info: "Wird im Report im Bereich 2 eingefügt."
            },
            {
                text: "Gruppe 3",  // TODO i18n
                color: "#BBFFBB",
                info: "Wird im Report im Bereich 3 eingefügt."
            },
            {
                text: "Priorität 2",  // TODO i18n
                color: "#0000FF",
                info: "Wird im Report eingefügt, bei < 10 Markierungen."
            },
            {
                text: "Priorität 3",  // TODO i18n
                color: "#4444FF",
                info: "Wird im Report eingefügt, bei < 15 Markierungen."
            },
            {
                text: "Priorität 4",  // TODO i18n
                color: "#8888FF",
                info: "Wird im Report eingefügt, bei < 20 Markierungen."
            },
            {
                text: "Nur vormerken",  // TODO i18n
                color: "#FF0000",
                info: "Wird im Report nicht eingefgt."
            }
        ];
        const mainDIV = document.getElementById('chart');
        window.onkeydown = keyDown;
        var wrapperDIV = createDIV();
        wrapperDIV.setAttribute('class', 'chartWrapper');
        wrapperDIV.setAttribute('id', 'fixWrapper');
        this.wrapperDIV = wrapperDIV;
        mainDIV.appendChild(wrapperDIV);


        var areawrapperDIV = createDIV();
        areawrapperDIV.setAttribute('class', 'chartAreaWrapper');
        wrapperDIV.appendChild(areawrapperDIV);
        this.div = areawrapperDIV;
        this.mainDIV = mainDIV;

        document.oncontextmenu = function () { return false; }
        document.onmousedown = this.mousedown_doc;
        document.onmousemove = this.mousemove_doc;
        document.onmouseup = this.mouseup_doc;
        document.onclick = this.mouseclick_doc;
    }
    mouseclick_doc(e) {
        console.log(`CLICK:${e}`);

    }
    mouseup_doc(e) {
        if (e.button == MOUSEBUTTONS.Right) {
            chartManager.rightDownPosition = null;
            if (chartManager.rightDownUpTime) {
                var diffms = (Number(new Date()) - Number(chartManager.rightDownUpTime));
                var difX = e.clientX - chartManager.rightDownX;
                if (diffms < 1000 && Math.abs(difX) < 10) {
                    // Doppelrechtklick
                    var insideDiagram = false;
                    var element = e.toElement;
                    while (true) {
                        if (element.tagName == "BODY") {
                            break;
                        }
                        if (element.className == "chartAreaWrapper") {
                            insideDiagram = true;
                            break;
                        }
                        element = element.parentElement;
                    }
                    if (insideDiagram) {
                        var pos = e.offsetX;
                        var left = chartManager.div.scrollLeft;
                        var dif = pos - left;
                        if (chartManager.getUIElementFromName("Zoom_Modus_1").Value) {
                        }
                        else if (chartManager.getUIElementFromName("Zoom_Modus_2").Value) {
                            dif -= chartManager.pageWidth / 2;
                        }
                        else if (chartManager.getUIElementFromName("Zoom_Modus_3").Value) {
                            dif -= chartManager.pageWidth;
                        }
                        chartManager.div.scrollLeft += dif;
                    }
                    chartManager.rightDownUpTime = null;
                    chartManager.rightDownX = null;
                }
                else {
                    chartManager.rightDownUpTime = new Date();
                    chartManager.rightDownX = e.clientX;
                }
            }
            else {
                chartManager.rightDownUpTime = new Date();
                chartManager.rightDownX = e.clientX;
            }
        }
    }
    mousedown_doc(e) {
        if (e.button == MOUSEBUTTONS.Right) {
            chartManager.rightDownPosition = {
                x: e.clientX,
                y: e.clientY,
                scrollLeft: chartManager.div.scrollLeft,
            };
        }
    }
    mousemove_doc(e) {
        if (chartManager.rightDownPosition && e.buttons == MOUSEBUTTONS.Right) {
            var multi = 1;
            if (e.shiftKey) {
                multi = SHIFTED_SCROLL_FACTOR;
            }
            var newScrollLeft = chartManager.rightDownPosition.scrollLeft - ((e.clientX - chartManager.rightDownPosition.x) * multi);
            chartManager.div.scrollLeft = newScrollLeft;
        }
    }

    get marks() { return this._marks; }
    marksFromDoc() { return this._marks.filter(m => m.source == MARK_SOURCE_DOC) }
    marksFromML() { return this._marks.filter(m => m.source == MARK_SOURCE_ML) }
    marksFromReport() { return this._marks.filter(m => m.source == MARK_SOURCE_REPORT) }

    getUIElementFromName(name) {
        var uielement = null;
        for (var mIdx = 0; mIdx < this._uimanagers.length; mIdx++) {
            var element = this._uimanagers[mIdx].getUIElementFromName(name);
            if (element) {
                uielement = element;
                break;
            }
        }
        return uielement;
    }

    get xGap() {
        return this._xGap;
    }
    set xGap(xgap) {
        const uiElement = chartManager.getUIElementFromName("xGap");
        uiElement.Value = xgap;

        this._xGap = xgap;
    }

    // @pos Views

    get views() { return this._views; }
    saveViewUndo() {
        this.saveView({ viewtype: VIEWTYPES.Undo });
    }
    saveView({ viewtype, zoomFreq, xGap, partValuesCount, partValuesStart, scrollLeft, time, key, name }) {
        if (!viewtype) {
            throw new Error("[ERROR] Undefinierter Viewtype bei chartManager.saveView!");
        }
        if (!zoomFreq) zoomFreq = this.zoomFreq;
        if (!xGap) xGap = this.xGap;
        if (!partValuesCount) partValuesCount = this.partValuesCount;
        if (!partValuesStart) partValuesStart = this.partValuesStart;
        if (!scrollLeft) scrollLeft = this.div.scrollLeft;
        if (!time) time = new Date();
        if (!key) key = "";
        if (!name) name = "";

        var view = {
            type: viewtype,
            zoomFreq: zoomFreq,
            xGap: xGap,
            partValuesStart: partValuesStart,
            partValuesCount: partValuesCount,
            scrollLeft: scrollLeft,
            time: time,
            key: key,
            name: name
        }
        this._views.push(view);
    }
    restoreView(view) {
        chartManager.xGap = view.xGap;
        chartManager.partValuesStart = view.partValuesStart;
        chartManager.partValuesCount = view.partValuesCount;
        chartManager.zoomFreq = view.zoomFreq; // Damit wird das Diagramm gezeichnet
        chartManager.div.scrollLeft = view.scrollLeft;
    }
    restoreViewFromKey(key) {
        const view = this._views.find(v => v.key == key);
        if (view) {
            this.restoreView(view);
        }
    }
    restoreViewFromName(name) {
        const view = this._views.find(v => v.name == name);
        if (view) {
            this.restoreView(view);
        }
    }
    restoreViewLastUndo(remove) {
        const view = this._views.findLast(v => v.type == VIEWTYPES.Undo);
        if (view) {
            if (remove) {
                const idx = this._views.indexOf(view);
                this._views.splice(idx, 1);
            }
            this.restoreView(view);
        }
    }


    get positionLeft() {
        // Alte Position vom Zentrum des Bildschirms aus gesehen
        return (this.partValuesStart + (this.div.scrollLeft * this.zoomFreq / this.maximumXStepDivider));
    }
    get positionCenter() {
        // Alte Position vom Zentrum des Bildschirms aus gesehen
        return (this.partValuesStart + (this.div.scrollLeft * this.zoomFreq / this.maximumXStepDivider) + (this.pageWidth * this.zoomFreq / this.maximumXStepDivider / 2));
    }
    get positionRight() {
        // Alte Position vom Zentrum des Bildschirms aus gesehen
        return (this.partValuesStart + (this.div.scrollLeft * this.zoomFreq / this.maximumXStepDivider) + (this.pageWidth * this.zoomFreq / this.maximumXStepDivider));
    }
    set positionCenter({ values, timeAbsolut, timeRelativ, zoomValues, zoomSeconds, scrollPosition }) {
        var destValues = null;
        var zoomFreq = this.zoomFreq;
        if (timeAbsolut) {
            // Ziel ist die Absolute Uhrzeit
            var msDest = Number(this.combineDates(timeAbsolut));
            var msStart = this.json.header.TimeStampStart / 1000;
            var sDiff = (msDest - msStart) / 1000;
            destValues = sDiff * this.maxFreq;
        }
        else if (timeRelativ) {
            // Ziel ist die relative Zeit
            var destHours = timeRelativ.getHours();
            var destMinutes = timeRelativ.getMinutes();
            var destSeconds = timeRelativ.getSeconds();
            var secondsTotal = (destHours * 3600) + (destMinutes * 60) + destSeconds;

            destValues = secondsTotal * this.maxFreq;
        }
        else if (values != undefined) {
            // Ziel ist eine Values angabe
            destValues = values;
        }

        if (destValues == null) {
            throw new Error("[ERROR] positionCenter ohne gültiges Ziel!");
        }

        // Zoom 
        if (zoomValues != undefined) {
            zoomFreq = zoomValues
        }
        else if (zoomSeconds != undefined) {
            var pixelCount = this.pageWidth;
            zoomFreq = zoomSeconds * this.maxFreq / pixelCount * this.maximumXStepDivider;
        }
        if (zoomFreq >= 1) {
            zoomFreq = Math.ceil(zoomFreq);
        }

        this.calcPartValuesCount(zoomFreq);
        var pvStart = null;
        var scrollLeft = null;
        if (this.partValuesCount == this.json.data.length) {
            // Es wird immer alles geladen, d.h. partValuesStart ist immer 0
            pvStart = 0;
            switch (scrollPosition) {
                case SCROLL_POSITION.LeftLeft:
                    scrollLeft = (destValues / zoomFreq * chartManager.maximumXStepDivider);
                    break;
                case SCROLL_POSITION.LeftCenter:
                    scrollLeft = (destValues / zoomFreq * chartManager.maximumXStepDivider);
                    break;
                case SCROLL_POSITION.Center:
                    scrollLeft = (destValues / zoomFreq * chartManager.maximumXStepDivider) - (this.pageWidth / 2);
                    break;
                case SCROLL_POSITION.RightRight:
                    scrollLeft = (destValues / zoomFreq * chartManager.maximumXStepDivider) - (this.pageWidth);
                    break;
                case SCROLL_POSITION.RightCenter:
                    scrollLeft = (destValues / zoomFreq * chartManager.maximumXStepDivider) - (this.pageWidth);
                    break;
            }
        }
        else {
            switch (scrollPosition) {
                case SCROLL_POSITION.LeftLeft:
                    pvStart = destValues - (this.maxFreq);
                    scrollLeft = 0;
                    break;
                case SCROLL_POSITION.LeftCenter:
                    pvStart = destValues - (this.maxFreq) - (this.pageWidth * zoomFreq / 2 / this.maximumXStepDivider);
                    scrollLeft = 0;
                    break;
                case SCROLL_POSITION.Center:
                    pvStart = destValues - (this.partValuesCount / 2);
                    scrollLeft = ((this.partValuesCount / zoomFreq * this.maximumXStepDivider) / 2) - (this.pageWidth / 2);
                    break;
                case SCROLL_POSITION.RightRight:
                    pvStart = destValues - (this.partValuesCount) + (this.maxFreq);
                    scrollLeft = ((this.partValuesCount / zoomFreq * this.maximumXStepDivider));
                    break;
                case SCROLL_POSITION.RightCenter:
                    pvStart = destValues - (this.partValuesCount) + (this.pageWidth * zoomFreq / 2 / this.maximumXStepDivider);
                    scrollLeft = ((this.partValuesCount / zoomFreq * this.maximumXStepDivider));
                    break;
            }
        }

        this.partValuesStart = pvStart;
        this.zoomFreq = zoomFreq;
        this.div.scrollLeft = scrollLeft;
    }

    get pageWidth() {
        var sideMenues = chartManager._uimanagers.filter(m => m.byside).reduce((a, b) => a += b.div.clientWidth, 0);
        return Number(window.innerWidth) - 28 - chartManager._verticalScale.reduce((a, b) => a += Number(b.width.replace("px", "")), 0) - sideMenues;

    }
    calcAllZoom() {
        this.allZoom = ((this.json.data.length) / this.pageWidth) * 2;
        if (this.zoomFreq == null) {
            this.zoomFreq = this.allZoom;
        }
    }
    addDIV(divtypeAs_DIV_TYPES, data) {
        var { height, backgroundColor, width } = data;
        var div;
        if (!height) height = DIV_DEFAULT_HEIGHT;
        if (!backgroundColor) backgroundColor = DEFAULT_BACKGROUND;
        if (!width) width = DIV_DEFAULT_WIDTH;
        var overflowXToAuto = false;

        if (divtypeAs_DIV_TYPES == DIV_TYPES.MenuTop) {
            div = this.addDIVTop();
            div.setAttribute("style", `float:right;width:100%;height:${height};background-color:${backgroundColor};`);
        }
        else if (divtypeAs_DIV_TYPES == DIV_TYPES.MenuBottom) {
            div = this.addDIVBottom();
            div.setAttribute("style", `width:100%;height:${height};background-color:${backgroundColor};`);
        }
        else if (divtypeAs_DIV_TYPES == DIV_TYPES.MenuLeft) {
            div = this.addDIVTop();
            div.setAttribute("style", `line-height:0.4em;padding-top:0.5em;float:left;width:${width};height:${height};background-color:${backgroundColor}`);
            overflowXToAuto = true;
        }
        else if (divtypeAs_DIV_TYPES == DIV_TYPES.MenuRight) {
            div = this.addDIVTop();
            div.setAttribute("style", `line-height:0.4em;padding-top:0.5em;float:right;width:${width};height:${height};background-color:${backgroundColor}`);
        }
        else if (divtypeAs_DIV_TYPES == DIV_TYPES.SkalaLeft) {
            div = this.addDIVTop();
            div.setAttribute("style", `float:left;width:${width};height:${height};background-color:${backgroundColor}`);
        }
        else if (divtypeAs_DIV_TYPES == DIV_TYPES.SkalaRight) {
            div = this.addDIVTop();
            div.setAttribute("style", `float:right;width:${width};height:${height};background-color:${backgroundColor}`);
        }

        return div;
    }

    addDIVTop() {
        var div = createDIV();
        this.mainDIV.insertBefore(div, this.wrapperDIV);
        return div;
    }
    addDIVBottom() {
        var div = createDIV();
        this.mainDIV.appendChild(div);
        return div;
    }

    //get maximumXStepDivider() { return this._maximumXStepDivider / (1 + this.xGap) * 2; }
    get maximumXStepDivider() { return this._maximumXStepDivider / 2 * (1 + this.xGap); }
    set maximumXStepDivider(d) { this._maximumXStepDivider = d; }
    addHorizontalScale({ before, after, height, align }) {
        var hs = new HorizontalScale({ before, after, height, align });
        this._horizontalScale.push(hs);
        return hs;
    }
    addVerticalScale({ vscale_alignment, width }) {
        var vscale = new Vertical_Scale({ vscale_alignment: vscale_alignment, width: width });
        this._verticalScale.push(vscale);
    }

    addUIManager(data) {
        const uimanager = new UIManager(data);
        this._uimanagers.push(uimanager);
        return uimanager;
    }

    createHorizontalScales() {
        this._horizontalScale.forEach(h => { h.create(); });
    }
    createVerticalScales() {
        this._verticalScale.forEach(v => { v.create(); });
    }


    calcRowNumberFromSelectionPosition(pixelPosition) {
        return pixelPosition * this.zoomFreq / this.maximumXStepDivider;
    }
    calcPixelFromRowNumber(rowNumber) {
        return rowNumber / this.zoomFreq * (this.maximumXStepDivider);
    }
    calcPixelsForSeconds(seconds) {
        const valuesPerSeconds = this.maxFreq;
        const valuesTotal = valuesPerSeconds * seconds;
        const pixelsTotal = valuesTotal / this.zoomFreq;
        return pixelsTotal;
    }
    calcValuesFromSeconds(seconds) {
        const valuesPerSecond = this.maxFreq;
        const valuesTotal = valuesPerSecond * seoncds;
        return valuesTotal;
    }
    calcSecondsFromPixel(pixel) {
        const valuesPerPixel = this.zoomFreq;
        const valuesTotal = valuesPerPixel * pixel;
        const secondsTotal = valuesTotal / this.maxFreq;
        return secondsTotal;
    }

    nextDialogNr() {
        this._dialogNr++;
        return this._dialogNr;
    }

    newDialog(x, y, x1, x2, svg, markSource) {
        var dialog = new SelectionDialog(x, y, x1, x2, svg, markSource);
        dialog.create(x, y);
        this._dialogs.push(dialog);
        return dialog;
    }

    openDialog(x, y, x1, x2, svg, mark) {
        var dialog;
        dialog = chartManager._dialogs.find(d => d.mark == mark);
        if (!dialog) {
            dialog = new SelectionDialog(x, y, x1, x2, svg, mark.source);
            dialog.open(x, y, mark);
            this._dialogs.push(dialog);
        }
        return dialog;
    }

    dialogFromNr(nr) {
        return this._dialogs.find(d => d.Nr == nr);
    }

    markFromNr(nr) {
        return this._marks.find(m => m.nr == nr);
    }
    markFromUUID(uuid) {
        return this._marks.find(m => m.uuid == uuid);
    }

    get clickStatus() { return this._clickStatus; }

    get maxFreq() { return this._maxFreq; }
    set maxFreq(freq) {
        if (this._maxFreq < freq) {
            this._maxFreq = freq;
            this.calcPartValuesCount();
        }
    }
    get zoomFreq() { return this._zoom_freq; }
    set zoomFreq(zoomFreq) {
        if (zoomFreq >= 1) {
            // Muss aufgerundet werden, da Werte > 1 ja besagen: Wieviele Werte entsprechen 1 Pixel
            // 1.5 Werte = 1 Pixel geht ja nicht: 1. Wert, nicht >= 1.5 also addieren
            //                                    2. Wert, ist   >= 1.5 also addieren und durchschnitt berechnen
            this._zoom_freq = Math.ceil(zoomFreq);
        }
        else {
            // Werte < 1 werden nicht gerundet, da diese dann bestimmen, wieviel Pixel sind 1 Wert
            // 0.5: 1. Wert, ist >= 0.5, also addieren und durchschnitt (x / 1 = x)
            // aber Schrittweite der Pixel sind 1 / 0.5 =  2, also 2 Pixel für diesen Wert 2, also 2 Pixel für diesen Wert
            this._zoom_freq = zoomFreq;
        }
        this.calcPartValuesCount();
        this.createAll();
    }

    get partValuesStart() { return this._partValuesStart; }
    set partValuesStart(partValuesStart) {
        this._partValuesStart = partValuesStart;
    }

    get partValuesCount() { return this._partValuesCount; }
    set partValuesCount(partValuesCount) {
        this._partValuesCount = partValuesCount;
    }


    calcPartValuesCount(zoomFreq, maxFreq) {
        if (!zoomFreq) zoomFreq = this.zoomFreq;
        if (!maxFreq) maxFreq = this.maxFreq;

        // Berechnet die Anzahl der angezeigten Werte anhand des Zoom's und der maximalen Frequenz
        const freqZoomFactor = maxFreq / zoomFreq;
        if (freqZoomFactor <= 1.9) {
            // Geringer Zoom, d.h. alles anzeigen
            this.partValuesCount = this.json.data.length; // 32 * (3600 * 8) / 16 = 57600 Pixel 
            this.partValuesStart = 0;
        }
        else if (freqZoomFactor <= 4) {
            // Zoom Faktor zu hoch für alles, auf zwei Stunde reduzieren
            this.partValuesCount = this.maxFreq * 3600 * 2;

        }
        else if (freqZoomFactor <= 16) {
            // Zoom Faktor zu hoch für alles, auf eine Stunde reduzieren
            this.partValuesCount = this.maxFreq * 3600; // 32 * 3600 / 2 = 57600 Pixel

        }
        else if (freqZoomFactor <= 128) {
            // Zoom Faktor sehr hoch, nur noch 10 Minuten anzeigen
            this.partValuesCount = this.maxFreq * 600; // 32 * 60 / 0.25 = 76800 Pixel Width für SVG
        }
        else {
            // Zoom Faktor noch höher, nur noch 1 Minuten anzeigen
            this.partValuesCount = this.maxFreq * 60; // 32 * 60 / 0.125 = 15360 Pixel Width für SVG
        }
    }

    Seconds(offsetX) {
        return ((offsetX * this.zoomFreq / this.maximumXStepDivider) + chartManager.partValuesStart) / this.maxFreq;
    }
    Time(offsetX) {
        // TimeStampStart ist kein Unix Timestamp sondern das 1000 fache (also nanosekunden seit...) Daher / 1000
        var ts = this.json.header.TimeStampStart / 1000;
        // Millisekunden werden benötigt
        var ms = this.Seconds(offsetX) * 1000;

        return new Date(ts + ms);
    }
    SecondsFromRow(row) {
        return row / this.maxFreq;
    }
    TimeFromRow(row) {
        // TimeStampStart ist kein Unix Timestamp sondern das 1000 fache (also nanosekunden seit...) Daher / 1000
        var ts = this.json.header.TimeStampStart / 1000;
        // Millisekunden werden benötigt
        var ms = this.SecondsFromRow(row) * 1000;

        return new Date(ts + ms);
    }

    addChart(titel) {
        var newDiv = createDIV();
        newDiv.setAttribute("type", titel);
        this.div.appendChild(newDiv);
        var newSVG = createSVG();
        newSVG.onmousemove = mouseMove;
        newSVG.onclick = mouseClick;
        newSVG.onmousedown = mouseDown;
        newSVG.onmouseup = mouseUp;
        newSVG.setAttribute('width', '50000');
        newSVG.setAttribute('height', DIAGRAM_HEIGHT.toString());
        newDiv.appendChild(newSVG);

        var newChart = new Chart(this, newDiv, newSVG, this.json, titel);
        this.charts.push(newChart);
        return newChart;
    }

    mouseMove(e) {
        //console.log(this.Time(e.offsetX));
        this.charts.forEach(c => c.setCursor(e.offsetX));
        if (this.clickStatus.clickNumber == 1) {
            this.clickStatus.resizeSelectionRect(e.offsetX);
        }
        // Resize
        if (chartManager._resizeData.state == 1) {
            var newX = e.offsetX;
            var diffX = newX - chartManager._resizeData.offsetX;

            var oldXPixel = chartManager.calcPixelFromRowNumber(chartManager._resizeData.oldStart);
            var oldYPixel = chartManager.calcPixelFromRowNumber(chartManager._resizeData.oldEnd);
            var oldDiffPixel = chartManager.calcPixelFromRowNumber(chartManager._resizeData.oldEnd - chartManager._resizeData.oldStart);
            if (chartManager._resizeData.location == "resizeLeft") {
                chartManager._resizeData.mark.rowStart = chartManager.calcRowNumberFromSelectionPosition(oldXPixel + diffX);
                chartManager._resizeData.anchorLeft.setAttribute("x", oldXPixel + diffX)
            }
            else {
                chartManager._resizeData.mark.rowEnd = chartManager.calcRowNumberFromSelectionPosition(oldYPixel + diffX);
                chartManager._resizeData.anchorRight.setAttribute("x", oldYPixel + diffX - MARK_DRAGBOX_WIDTH)
            }
            chartManager._resizeData.mark.needUpdate = true;
            chartManager._resizeData.mark.create();
            chartManager._resizeData.dialog.refreshTimeData(chartManager._resizeData.mark.rowStart, chartManager._resizeData.mark.rowEnd);


        }
    }
    mouseClick(e) {
        const clickedChart = this.charts.find(c => c.svg == e.currentTarget);

        if (this.clickStatus.clickNumber == 0) {
            // First Click
            this.clickStatus.removeSelectionRect();
            this.clickStatus.clickNumber = 1;
            this.clickStatus.click1OffsetX = e.offsetX;
            this.clickStatus.clickChart = clickedChart;
            this.clickStatus.addSelectionRect();
        }
        else if (this.clickStatus.clickNumber == 1) {
            // Second Click
            if (clickedChart == this.clickStatus.clickChart) {
                this.clickStatus.clickNumber = 0;
                this.clickStatus.click2OffsetX = e.offsetX;
                this.clickStatus.mouseData = e;
                this.clickStatus.expandSelectionRect();
            }
            else {
                // Second click in another chart -> First click
                this.clickStatus.removeSelectionRect();
                this.clickStatus.clickNumber = 1;
                this.clickStatus.click1OffsetX = e.offsetX;
                this.clickStatus.clickChart = clickedChart;
                this.clickStatus.addSelectionRect();
            }
        }
    }



    createAll() {
        if (this.allZoom == null) {
            this.calcAllZoom();
        }
        this.setActualZoom();
        chartManager.maximumXStepDivider = null;
        this.charts.forEach(c => c.drawLines());
        this._marks.forEach(m => { m.needUpdate = true; m.create(); })
        this.createHorizontalScales();
    }
    setActualZoom() {
        const selectOptionActualZoom = document.getElementById("ActualZoom");
        if (selectOptionActualZoom) {
            var asString = "";
            if (chartManager.zoomFreq >= Math.floor(chartManager.allZoom)) {
                asString = "Alles"
            }
            else {
                var totalSeconds = chartManager.pageWidth * chartManager.zoomFreq / chartManager.maxFreq / chartManager.maximumXStepDivider;
                var hours = Math.floor(totalSeconds / 3600);
                totalSeconds -= hours * 3600;
                var minutes = Math.floor(totalSeconds / 60);
                totalSeconds -= minutes * 60;
                var seconds = Math.round(totalSeconds);

                const asDate = new Date(0, 0, 0, hours, minutes, seconds);
                asString = dateFormat(asDate, "HH:MM:SS");
            }

            selectOptionActualZoom.innerHTML = asString;
        }
    }
    combineDates(dateDest) {
        var dateStart = new Date(this.json.header.TimeStampStart / 1000);

        var startDay = dateStart.getDate();
        var startMonth = dateStart.getMonth();
        var startYear = dateStart.getFullYear();

        var destHours = dateDest.getHours();
        var destMinutes = dateDest.getMinutes();
        var destSeconds = dateDest.getSeconds();

        var fullDate = new Date(startYear, startMonth, startDay, destHours, destMinutes, destSeconds);
        if (fullDate < dateStart) {
            fullDate = new Date(startYear, startMonth, startDay + 1, destHours, destMinutes, destSeconds);
        }
        return fullDate;
    }
}



function selectionTitleClicked() {
    // Hat bisjetzt keine Funktion, daher eine leere Funktion
}
function doZoom() { // @function doZoom (Zoom ausführen)
    // Calculate new Zoom
    chartManager.saveViewUndo();
    const selectionPixel = chartManager.clickStatus.width;
    const zoomXValuesFor1Pixel = chartManager.zoomFreq;
    const selectionValues = selectionPixel * zoomXValuesFor1Pixel;

    const clientWidth = chartManager.div.getBoundingClientRect().width;
    const newZoom = selectionValues / clientWidth;

    chartManager.calcPartValuesCount(newZoom);
    // set partValuesStart
    if (chartManager.partValuesCount == chartManager.json.data.length) {
        // Alle Daten werden angezeigt -> von Anfang an anzeigen
        chartManager.partValuesStart = 0;
    }
    else {
        // Nur ein Teil wird angezeigt -> Anfang ermitteln
        chartManager.partValuesStart += chartManager.clickStatus.left * zoomXValuesFor1Pixel / chartManager.maximumXStepDivider;
    }

    chartManager.zoomFreq = newZoom;
    // Calculate new Position (scroll)
    const newPos = ((chartManager.clickStatus.left * zoomXValuesFor1Pixel) - (chartManager.partValuesStart * chartManager.maximumXStepDivider)) / chartManager.zoomFreq;
    chartManager.div.scroll(newPos, 0);
    OUT(chartManager.zoomFreq);
}
function doNote(x, y) {
    var svg = chartManager.clickStatus.clickChart.svg;
    var newDialog = chartManager.newDialog(x, y, chartManager.clickStatus.click1OffsetX, chartManager.clickStatus.click2OffsetX, svg, MARK_SOURCE_DOC);
}
function doReport(x, y) {
    var svg = chartManager.clickStatus.clickChart.svg;
    var newDialog = chartManager.newDialog(x, y, chartManager.clickStatus.click1OffsetX, chartManager.clickStatus.click2OffsetX, svg, MARK_SOURCE_REPORT);
}

function OUT(t) {
    console.log(t);
    //document.getElementById("OUT").innerHTML = t;
}

function mouseMove(e) {
    chartManager.mouseMove(e);
}
function keyDown(obj, e) {
    if (obj.keyCode == 27) // Esc
    {
        chartManager.clickStatus.removeSelectionRect();
        chartManager.clickStatus.clickNumber = 0;
    }
}
function mouseUp(e) {
    if (chartManager._resizeData.state == 1) {
        var mark = chartManager._resizeData.mark;
        mark.rowStart = chartManager.calcRowNumberFromSelectionPosition(mark._rect.getAttribute("x"));
        mark.rowEnd = chartManager.calcRowNumberFromSelectionPosition(Number(mark._rect.getAttribute("x")) + Number(mark._rect.getAttribute("width")));
        mark.needUpdate = true;
        mark.create();
        mark.svg.removeChild(chartManager._resizeData.anchorLeft)
        mark.svg.removeChild(chartManager._resizeData.anchorRight)
        mark.svg.appendChild(chartManager._resizeData.anchorLeft);
        mark.svg.appendChild(chartManager._resizeData.anchorRight);
        chartManager._resizeData.dialog = null;
        chartManager._resizeData.mark = null;
        chartManager._resizeData.oldStart = 0;
        chartManager._resizeData.oldEnd = 0;
        chartManager._resizeData.nr = 0;
        chartManager._resizeData.state = 2;
    }
}
function mouseDown(e) {
    if (e.button == 2) {
        //return false;
    }

    if (e.srcElement.getAttribute('dest') == "resizeLeft" || e.srcElement.getAttribute('dest') == "resizeRight") {
        var nr = e.srcElement.getAttribute("nr");
        var dialog = chartManager.dialogFromNr(nr);
        var mark = dialog.mark;
        chartManager._resizeData.dialog = dialog;
        chartManager._resizeData.mark = mark;
        chartManager._resizeData.oldStart = mark.rowStart;
        chartManager._resizeData.oldEnd = mark.rowEnd;
        chartManager._resizeData.nr = nr;
        chartManager._resizeData.state = 1;
        chartManager._resizeData.offsetX = e.offsetX;
        chartManager._resizeData.location = e.srcElement.getAttribute('dest');
    }
}
function mouseClick(e) {
    if (e.srcElement.getAttribute('dest') == "title") {
        // Title clicked
    }
    else if (e.srcElement.getAttribute('dest') == "mark") {
        // Mark clicked
        var nr = e.srcElement.getAttribute("nr");
        var mark = chartManager.markFromNr(nr);
        /*
        mark.rowStart = 20000;
        mark.needUpdate = true;
        mark.create();
        console.log(mark);
        */
        // x, y, offsetX, offsetY, svg
        var xPos = chartManager.calcPixelFromRowNumber(mark.rowStart) + Number(mark._rect.getAttribute('width'));
        var yPos = mark.svg.parentElement.offsetTop + mark.svg.parentElement.offsetHeight;
        var dialog = chartManager.openDialog(xPos, yPos, chartManager.calcPixelFromRowNumber(mark.rowStart), chartManager.calcPixelFromRowNumber(mark.rowEnd), mark.svg, mark);
    }
    else if (e.srcElement.getAttribute('dest') == "resizeLeft" || e.srcElement.getAttribute('dest') == "resizeRight") {
        // Resize-Rects clicked
    }
    else {
        // Chart clicked
        if (chartManager._resizeData.state != 0) {
            chartManager._resizeData.state = 0;
        }
        else {
            chartManager.mouseClick(e);
        }

    }
}

function createDIV() {
    //return document.createElementNS('http://www.w3.org/2000/div', 'div');
    return document.createElement('div');
}
function createElement(el) {
    return document.createElement(el);
}
function createInput(type) {
    var element = createElement("input");
    element.setAttribute("type", type);
    return element;
}

function createSVG() {
    return document.createElementNS('http://www.w3.org/2000/svg', 'svg');
}

function createText() {
    return document.createElementNS('http://www.w3.org/2000/svg', 'text');
}
function createAnchor(attributes) {
    return document.createElementNS('http://www.w3.org/2000/svg', 'a');
}
function createAnchor2() {
    return document.createElement('a');
}
function createLine() {
    return document.createElementNS('http://www.w3.org/2000/svg', 'line');
}
function createRect() {
    return document.createElementNS('http://www.w3.org/2000/svg', 'rect');
}
function createPolyline() {
    return document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
}
function createPath(attributes) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    if (attributes) {
        Object.entries(attributes).forEach(e => {
            element.setAttribute(e[0], e[1]);
        });
    }
    return element;
}
function createButton() {
    return document.createElement('button');
}
function createSpan() {
    return document.createElement('span');
}
function secondFormat(seconds, format) {
    if (seconds > 1000000) {
        // Unix TimeStamp
        return dateFormat(new Date(seconds * 1000), format);
    }
    var sec = Math.floor(seconds);
    var ms = (seconds - sec) * 1000;
    var date = new Date(2020, 0, 1, 0, 0, sec, ms);
    return dateFormat(date, format);
}
function dateFormat(date, format) {
    /* Formats
        dd      Day             like 0
        d       Day             like 
        mm      Month           like 0
        m       Month           like 
        yy      Year            like 2
        yyyy    Year            like 20
        hh      Hour            like 07
        h       Hour            like 7
        HH      Hour            like 19
        MM      Minute          like 07
        M       Minute          like 7
        SS      Second          like 07
        S       Second          like 7
        XX      Milliseconds    like 7
    */

    var res = format;
    res = res.replace('yyyy', date.getFullYear());
    res = res.replace('dd', ('0' + date.getDate()).slice(-2));
    res = res.replace('mm', ('0' + (date.getMonth() + 1)).slice(-2));
    res = res.replace('yy', ('' + date.getFullYear()).slice(-2));
    res = res.replace('hh', ('0' + date.getHours()).slice(-2));
    res = res.replace('HH', ('0' + date.getHours()).slice(-2));
    res = res.replace('MM', ('0' + date.getMinutes()).slice(-2));
    res = res.replace('SS', ('0' + date.getSeconds()).slice(-2));
    res = res.replace('XX', (date.getMilliseconds()));

    return res;
}
class Chart {
    constructor(manager, div, svg, json, titel) {
        this.chartManager = manager;
        this.titel = titel;
        this.chartLines = [];
        this.zeroLine = false;
        this.div = div;
        this.svg = svg;
        this.json = json;
    }

    addLine(color, data) {
        if (typeof (data) == "string") {
            const dataInformation = this.chartManager.dataManager.dataInformationFromSignalName(data);
            this.chartManager.maxFreq = dataInformation.freq;
            this.zeroLine = this.zeroLine || dataInformation.zeroLine;

            this.chartLines.push(new ChartLine(color, dataInformation));
        }
        else {
            this.chartLines.push(new ChartLine(color, data));
        }
    }
    clearLines() {
        this.chartLines.splice(0, this.chartLines.length);
    }

    setCursor(x) {
        this.cursorLine.setAttribute('x', x);
    }

    drawLines() {
        // Zuerst alles entfernen
        while (this.svg.firstChild) { this.svg.removeChild(this.svg.firstChild); }
        // Cursor-Linie neu erstellen
        var cursorLine = createRect();
        cursorLine.setAttribute('x', 0);
        cursorLine.setAttribute('y', 0);
        cursorLine.setAttribute('width', 1);
        cursorLine.setAttribute('height', DIAGRAM_HEIGHT);
        cursorLine.setAttribute("fill", "#000000");
        this.svg.appendChild(cursorLine);
        this.cursorLine = cursorLine;
        var drawZeroLine = this.zeroLine;

        // xStep: Schrittweite für 1 Messwert. Ist der Zoom >= 1 (d.h. exakt 1 oder mehr Datenwerte liefern 1 Pixel im Diagramm)
        //        dann ist xStep immer 1 (X Werte = 1 Pixel).
        //        Ist der Zoom < 1, dann entspricht immer 1 Wert mehr als 1 Pixel.
        //        Bei z.B. Zoom = 0.5, sind 0.5 Datenpunkte = 1 Pixel, 1 Datenpunkt = 2 Pixel (1 / 0.5 = 2)

        // Bei xGap (Konfigurierten X Abstand der Linien) von 1 wird 1+1=2 verwendet.
        // Die 2 sind notwendig, damit beim Min/Max Wertepaaren ein Gap von 1 (/2) verwendet werden kann. Bei AVG bleibt es bei 2
        const xStepOrig = (chartManager.zoomFreq >= 1 ? 1 : 1 / chartManager.zoomFreq) + chartManager.xGap;

        var maxWidth = 0;
        // Dann neu zeichnen
        this.chartLines.forEach(line => {
            const range = line.data.valueMax - line.data.valueMin;   // 65535
            const yRange = DIAGRAM_HEIGHT / range;         // 1 Messwert = yRange Pixel
            const yOffset = line.data.valueMin * yRange * -1;   // Addierung damit min. Value = 0 ist und nicht -75
            var xStep = xStepOrig
            if (line.data.usePath) {
                // DOPPELT ?!?!    this.chartLines.forEach(line => {
                var path = createPath();
                var x = 1;
                var pth = `M1,${DIAGRAM_HEIGHT}`;
                if (Array.isArray(line.data)) {
                    const pg = new PathGenerator({ SVG: this.svg });
                    pg.addYValuesFromArray(line.data, "#000000");
                    pg.drawPath({ gapPixel: xStep });
                    this.svg.setAttribute("width", pg.maxX);
                    x = pg.maxX;
                }
                else if (typeof line.data === 'string') {
                    pth = line.data;
                    path.setAttribute('d', pth.trim());
                    path.setAttribute('stroke', `#${line.color}`);
                    path.setAttribute('stroke-width', 0.5);
                    path.setAttribute('fill', 'none');
                }
                else {
                    var arr = line.data.dataFunction(this.pickLineData(line.data), this.chartManager.zoomFreq, this.chartManager.maxFreq);
                    const pg = new PathGenerator({ SVG: this.svg, min: line.data.valueMin, max: line.data.valueMax });
                    pg.addYValuesFromArray(arr, line.color);
                    // xGap einfliesen lassen (konfigurierter X-Abstand) unter berücksichtigung von Datenmenge (AVG=/2, Min/Max=*1)
                    // Für Ausgleich das es bei Min/Max 2 Werte gibt wird bei AVG der XAbstand verdoppelt
                    const arrCount = arr.length;
                    const valuesCount = pg.points.reduce((a, b) => a += b.xDistance, 0);
                    const xStepDivider = valuesCount / arrCount;
                    if (chartManager.maximumXStepDivider == null || xStepDivider > chartManager.maximumXStepDivider) {
                        chartManager.maximumXStepDivider = xStepDivider;
                    }
                    xStep /= xStepDivider; // bei AVG sind beide Werte gleich -> /1, bei Min/Max ist valuesCount doppelt so hoch -> /2

                    pg.drawPath({ gapPixel: xStep });
                    // (e => Math.round(e * yRange + yOffset));
                    this.svg.setAttribute("width", pg.maxX);
                    x = pg.maxX;
                }

                if (x > maxWidth) { maxWidth = x; }
                this.svg.appendChild(path);
                // DOPPELT ?!?    })
            }
            else {
                // DOPPELT ?!?    this.chartLines.forEach(line => {
                var polyLine = createPolyline();
                var x = 0;
                var pts = "";
                if (Array.isArray(line.data)) {
                    line.data.forEach(y => { pts += `${x++},${y} ` })
                }
                else if (typeof line.data === 'string') {
                    pts = line.data;
                }
                else {
                    var arr = line.data.dataFunction(this.pickLineData(line.data), this.chartManager.zoomFreq, this.chartManager.maxFreq);
                    arr.forEach(y => { pts += `${x += xStep},${DIAGRAM_HEIGHT - (y * yRange + yOffset)} ` })
                    this.svg.setAttribute("width", x);
                }
                polyLine.setAttribute('points', pts.trim());
                polyLine.setAttribute('stroke', `#${line.color}`);
                polyLine.setAttribute('stroke-width', 0.5);
                polyLine.setAttribute('fill', 'none');

                if (polyLine.points.length > maxWidth) { maxWidth = polyLine.points.length; }
                this.svg.appendChild(polyLine);
                // DOPPELT ?!?    })
            }

            if (drawZeroLine) {
                const { color, opacity, height, style } = drawZeroLine;
                if (style == undefined) {
                    style = "";
                }
                var zeroLineWidth = this.svg.getAttribute("width");
                const zeroLineTotalPoints = line.data.valueMax - line.data.valueMin; // alle -> 100%
                const zeroLineYPercent = 1 / zeroLineTotalPoints * line.data.valueMax; // Max-Wert in x%
                const zeroLineY = (DIAGRAM_HEIGHT * zeroLineYPercent) - (height / 2);  // Diagrammhöhe x% = Y Position der Null-Linie

                // <line x1="0" y1="0" x2="200" y2="200" style="stroke:rgb(255,0,0);stroke-width:2" />

                var zeroLine = createLine();
                zeroLine.setAttribute("x1", 0);
                zeroLine.setAttribute("y1", zeroLineY);
                zeroLine.setAttribute("x2", zeroLineWidth);
                zeroLine.setAttribute("y2", zeroLineY);
                zeroLine.setAttribute("style", `stroke:${color}; stroke-width:${height}; opacity:${opacity}; ${style}`);

                this.svg.appendChild(zeroLine);
            }

            this.svg.setAttribute('width', maxWidth.toString());
        });
    }

    pickLineData(data) {
        /* ALTER VERSUCH - Das komplette JSON aufteilen
        if (this.partValuesCount >= this.json.data.length) {
            return data;
        }
        var returnValue = {};
        Object.keys(this.json).forEach(k => {
            if (k != "data") {
                returnValue[k] = this.json[k];
            }
        });
        returnValue.data = this.json.data.slice(chartManager.partValuesStart, chartManager.partValuesStart + chartManager.partValuesCount - 1);
        return returnValue;
        */
        // NEUER VERSUCH - Nur die Daten der Zeile aufteilen
        if (chartManager.partValuesCount >= data.data.length) {
            return data;
        }
        var returnValue = {};
        Object.keys(data).forEach(k => {
            if (k != "data") {
                returnValue[k] = data[k];
            }
        });
        if (chartManager.partValuesStart < 0) chartManager.partValuesStart = 0;
        returnValue.data = data.data.slice(chartManager.partValuesStart, chartManager.partValuesStart + chartManager.partValuesCount);
        return returnValue;
    }
}

class ChartLine {
    constructor(color, data) {
        this.color = color;
        this.data = data;
    }
}

async function loadJSON() {
    fetch("./part1.json")
        .then(r => {
            return r.json;
        })
}

function startNode() {
    let json = require("/Users/carstenschlegel/Coding/JS/SVG/mittel.json");
    dataManager.json = json;

}

function standardDataFunction(dataInformation, factor, maxFreq) {
    if (factor == 0 || dataInformation.freq == 0) {
        // Alles übergeben wenn kein Faktor oder Frequenz vorhanden
        return dataInformation.data;
    }
    if (factor <= 1) {
        // Exakt 1 zu 1 Faktor (oder kleiner 1) - Alles im original übergeben, kein AVG oder Min/Max Ermittlung nötig
        return dataInformation.data;
    }
    // Interpolierung zur y-Größe der Diagramme erfolgt beim zeichnen
    // ALT MIN/MAX: var newData = dataManager.simpleMinMax(dataInformation.data, factor, maxFreq);
    var newData = dataManager.complexeMinMax(dataInformation.data, factor, maxFreq);
    //if (chartManager.zoomFreq <= 31 && dataInformation.sigName == "Pulsrate") debugger;
    return newData;
}
// @object dataManager (Signal-Definitionen)
const dataManager =
{
    json: null,
    dataInformation: [
        ["Nasaler Druck", { // "a"
            "dataFunction": standardDataFunction,
            "valueMin": -48.3166,
            "valueMax": 48.3166,
            "usePath": true,
            /*
            zeroLine: Objekt mit mindestens 3 Angaben:
                color: string, Farbcode (#rrggbb) oder Farbname (red)
                opacity: number, Transparenzwert (0.3)
                height: number, Höhe (Dicke) der Linie in Pixel (1)
                Optional ist:
                style: string, zusätzliche Style-Angaben (CSS)
            */
            "zeroLine": { color: "#FF0000", opacity: 0.3, height: 1, style: '' }
        }],
        ["Thorax", { // "b"
            "dataFunction": standardDataFunction,
            "valueMin": -17.0449,
            "valueMax": 17.0449,
            "usePath": true,
            "zeroLine": { color: "#FF0000", opacity: 0.3, height: 1, style: '' }
        }],
        ["PSchnarchen", { // "c"
            "dataFunction": standardDataFunction,
            "valueMin": -48.3166,
            "valueMax": 48.3166,
            "usePath": true,
            "zeroLine": { color: "#FF0000", opacity: 0.3, height: 1, style: '' }
        }],
        ["SpO2", { // "d"
            "dataFunction": standardDataFunction,
            "valueMin": -32767,
            "valueMax": 32767,
            "usePath": true,
            "zeroLine": { color: "#FF0000", opacity: 0.3, height: 1, style: '' }
        }],
        ["SpO2 B-B", { // "e"
            "dataFunction": standardDataFunction,
            "valueMin": -32767,
            "valueMax": 32767,
            "usePath": true,
            "zeroLine": false
        }],
        ["Pulsrate", { // "f"
            "dataFunction": standardDataFunction,
            "valueMin": -32767,
            "valueMax": 32767,
            "usePath": true,
            "zeroLine": false
        }],
        ["Plethysmogramm", { // "g"
            "dataFunction": standardDataFunction,
            "valueMin": -32767,
            "valueMax": 32767,
            "usePath": true,
            "zeroLine": false
        }],
        ["Aktivitaet", { // "h"
            "dataFunction": standardDataFunction,
            "valueMin": -10,
            "valueMax": 10,
            "usePath": true,
            "zeroLine": false
        }]
    ],
    simpleAvg(data, factor, freq) {
        var nr = 0;
        var sum = 0;
        var valCount = 0;

        const anz = factor; // Faktor (in Bezugsnehmend zur Frequenz; factor = 1 => jeden Messwert (1:1), factor = 2 => jeden Zweiten (1:2))
        var newData = [];
        console.log("[INFO] simpleAvg data length: " + data.length);
        for (var d of data) {
            nr++;
            if (d != undefined) {
                sum += d;
                valCount++;
            }
            if (nr >= anz) {
                var res = valCount > 0 ? sum / valCount : 0;
                sum = 0;
                nr = 0;
                valCount = 0;
                newData.push(res);
            }
        }
        console.log("[INFO] simpleAvg newData length: " + newData.length);
        return newData;
    },
    // Funktion gibt ein Array eines Punktes zurück. Dieser kann 4 Zustände haben
    // 1. null                         -> es wurde für einen Datenbereich, der ein Pixel darstellt (zoomFreq) KEIN gültiger Wert gefunden
    //                                    In diesem Fall sollte eine Verbindung vom VORHERIGEN Wert erstellt werden (also den alten Wert
    //                                    nochmal verwenden)
    // 2. { point: ... }               -> es wurde für den Datenbereich exakt EIN gültiger Wert gefunden
    //                                    Hier wird diese Pixel mit xGap+1 Abstand gezeichnet und mit einen . versehen
    // 3. { point1: ..., point2: ... } -> es wurde für den Datenbereich exkakt ZWEI gültige Werte gefunden
    //                                    Hier werden beide Pixel mit xGap-1+1 Abstand gezeichnet und mit einem . versehen

    // 4. { min: ..., max: ... }       -> es wurde für den Datenbereich mehr als 2 gültige Werte gefunden
    complexeMinMax(dataArray, factor, freq) {
        const maxIdx = dataArray.length - 1;
        var newData = [];
        var nr = 0;
        var nrWithValue = 0;
        var v1 = null;
        var v2 = null;
        var min = null;
        var max = null;
        for (var idx = 0; idx <= maxIdx; idx++) {
            const d = dataArray[idx];
            nr++;
            if (d != undefined) {
                if (min == null || d < min) min = d;
                if (max == null || d > max) max = d;
                nrWithValue++;
                if (nrWithValue == 1) v1 = d;
                else if (nrWithValue == 2) v2 = d;
            }
            if (nr >= factor || idx == maxIdx) {
                if (nrWithValue == 0) {
                    // Kein Wert in den Daten/Pixel
                    newData.push(null);
                }
                else if (nrWithValue == 1) {
                    // Exakt EIN Wert in den Daten/Pixel
                    newData.push({ point: v1 });
                }
                else if (nrWithValue == 2) {
                    // Exakt ZWEI Werte in den Daten/Pixel
                    newData.push({ point1: v1, point2: v2 })
                }
                else {
                    // > 1 Wert in den Daten/Pixel
                    newData.push({ min: min, max: max });
                }
                nrWithValue = 0;
                nr = 0;
                min = null;
                max = null;
            }
        }
        return newData;
    },
    simpleMinMax(data, factor, freq) {
        var nr = 0;
        var min = null;
        var max = null;
        const anz = factor;
        var newData = [];
        console.log("[INFO] simpleMinMax data length: " + data.length);
        for (var d of data) {
            nr++;
            if (d != undefined) {
                if (min == null || d < min) min = d;
                if (max == null || d > max) max = d;
            }
            if (nr >= anz) {
                nr = 0;
                newData.push({ min: min, max: max }); // color: ... wenn klar ist, wie die grünen Linien erkannt werden
                min = null;
                max = null;
            }
        }
        console.log("[INFO] simpleMinMax newData length: " + newData.length);
        return newData;
    },
    dataInformationFromSignalName(sigName) {
        const re = /\d/;
        const sigNr = Number(re.exec(Object.entries(this.json.header).filter(e => e[1] == sigName)[0][0])[0]);
        const sigChar = String.fromCharCode(sigNr + 96);
        const information = this.dataInformation.find(e => e[0] == sigName)[1];
        const data = this.json.data.map(d => d[sigChar]);

        /* Contains:
            dataFunction: function to generate data for defined zoom factor
            valueMin/valueMax: Min, Max values
            zeroLine: boolen, display zeroLine für this data (by more then 1 line using OR of all lines; having 1 or more the zeroLine = true the Zeroline was displayed)
            freq: Frequenzy (signals per seconds)
            usePath: boolean, if true a svg-path used, if false a svg-polyline used
            data: Dataarray with all data
        */
        return {
            ...information,
            "freq": this.freqFromSignalName(sigName),
            "data": data,
            "sigName": sigName
        };
    },
    freqFromSignalName(sigName) {
        const re = /\d/;
        const sigNr = re.exec(Object.entries(this.json.header).filter(e => e[1] == sigName)[0][0])[0];
        return Object.entries(dataManager.json.header).find(f => f[0] == `Freq${sigNr}`)[1];
    }
}

class SelectionDialog {
    constructor(x, y, x1, x2, svg, markSource) {
        this._nr = chartManager.nextDialogNr();
        this.markSource = markSource;
        this.selectionStart = x1 < x2 ? x1 : x2;
        this.selectionEnd = x1 < x2 ? x2 : x1;
        this.svg = svg;

        this.rowStart = chartManager.calcRowNumberFromSelectionPosition(this.selectionStart);
        this.rowEnd = chartManager.calcRowNumberFromSelectionPosition(this.selectionEnd);
    }

    get Nr() { return this._nr; }
    get type() {
        return this.select_typ.options[this.select_typ.selectedIndex].value;
    }
    get color() {
        switch (this.markSource) {
            case MARK_SOURCE_DOC:
                return this.input_color.value;
                break;
            case MARK_SOURCE_REPORT:
                return this.select_typ.options[this.select_typ.selectedIndex].getAttribute("color");
                break;
        }

    }
    get note() {
        return this.textarea_note.value;
    }
    refreshTimeData(rowStart, rowEnd) {
        var startPix = chartManager.calcPixelFromRowNumber(rowStart);
        var endPix = chartManager.calcPixelFromRowNumber(rowEnd);
        var time1 = dateFormat(chartManager.Time(startPix), "HH:MM:SS");
        var time2 = dateFormat(chartManager.Time(endPix), "HH:MM:SS");
        var timeRange = `${time1} - ${time2}`; // TODO i18n

        var sec = chartManager.Seconds(endPix - startPix);
        var secDate = new Date(2022, 1, 1, 0, 0, sec);

        var timeDiff = dateFormat(secDate, "HH:MM:SS");             // TODO i18n
        this._timeRangeTD.innerHTML = timeRange;
        this._timeDiffTD.innerHTML = timeDiff;
    }
    create(x, y) {
        const parentDIV = chartManager.div;
        const rootDIV = parentDIV.parentElement.parentElement;

        // Y-Position ermitteln (alles was links vor dem Diagramm-DIV (parentDIV) ist)
        // leider keine Array Funktionen nutzbar :-)
        var parentDIVOffsetX = 0;
        for (var idx = 0; idx < rootDIV.childNodes.length; idx++) {
            const node = rootDIV.childNodes[idx];
            if (node.style.getPropertyValue("width") != "100%") {
                // kein Top oder Bottom Node
                if (node.style.getPropertyValue("float") == "left") {
                    // linkes Element
                    parentDIVOffsetX += node.clientWidth;
                }
            }
        }


        this.div = createDIV();
        this.div.setAttribute("class", "selectionDialog");
        var left = x;
        var top = y;
        var parentDIVOffsetY = rootDIV.clientHeight - parentDIV.clientHeight;

        // Prüfen ob es in das Fenster passt
        if (Number(SELECTION_DIALOG_WIDTH) + left + 20 > chartManager.pageWidth) {
            left = chartManager.pageWidth - SELECTION_DIALOG_WIDTH - 40;
        }
        if (Number(SELECTION_DIALOG_HEIGHT) + top + 20 > chartManager.pageWidth) {
            top = chartManager.pageWidth - SELECTION_DIALOG_HEIGHT - 50;
        }
        top -= parentDIVOffsetY;
        left -= parentDIVOffsetX;

        var time1 = dateFormat(chartManager.Time(this.selectionStart), "HH:MM:SS");
        var time2 = dateFormat(chartManager.Time(this.selectionEnd), "HH:MM:SS");
        var timeRange = `${time1} - ${time2}`; // TODO i18n

        var sec = chartManager.Seconds(this.selectionEnd - this.selectionStart) - (chartManager.partValuesStart / chartManager.maxFreq);
        var secDate = new Date(2022, 1, 1, 0, 0, sec);


        var timeDiff = dateFormat(secDate, "HH:MM:SS");             // TODO i18n

        // DIV (Rahmen)
        this.div.setAttribute("style", `position:absolute;left:${left}px;top:${top}px;width: ${SELECTION_DIALOG_WIDTH}px; height: ${SELECTION_DIALOG_HEIGHT}px;`);
        parentDIV.appendChild(this.div);

        // Tabelle für Information
        const table = createElement("table");
        this.div.appendChild(table);
        var tr = createElement("tr");
        table.appendChild(tr);
        // Zeile: Von/Bis
        var td = createElement("td");
        td.innerHTML = "Von/Bis:"; // TODO i18n
        tr.appendChild(td);

        td = createElement("td");
        td.innerHTML = timeRange;
        tr.appendChild(td);
        this._timeRangeTD = td;

        tr = createElement("tr");
        table.appendChild(tr);

        // Zeile: Dauer
        td = createElement("td");
        td.innerHTML = "Dauer:"; // TODO i18n
        tr.appendChild(td);

        td = createElement("td");
        td.innerHTML = timeDiff;
        tr.appendChild(td);
        this._timeDiffTD = td;

        // ------------------------------ 
        var hr = createElement("hr");
        this.div.appendChild(hr);

        // Notiz
        var span = createElement("span");
        span.setAttribute("style", "margin-left:5px;");
        switch (this.markSource) {
            case MARK_SOURCE_DOC:
                span.innerHTML = "Notiz:"; // TODO i18n
                break;
            case MARK_SOURCE_REPORT:
                span.innerHTML = "Anmerkung für Report:"; // TODO i18n
                break;
        }
        this.div.appendChild(span);

        this.textarea_note = createElement("textarea");
        this.textarea_note.setAttribute("id", "text");
        this.textarea_note.setAttribute("style", `width:${SELECTION_DIALOG_WIDTH - 15}px;margin-left: 5px;height:80px;`);
        this.div.appendChild(this.textarea_note);

        // Typ
        span = createElement("span");
        span.setAttribute("style", "margin-left:5px;");
        span.innerHTML = "Typ:"; // TODO i18n
        this.div.appendChild(span);

        this.select_typ = createElement("select");
        this.select_typ.setAttribute("id", "typ");
        this.select_typ.setAttribute("style", `width:${SELECTION_DIALOG_WIDTH - 9}px;margin-left:5px;`);
        this.select_typ.setAttribute("class", "select");
        this.select_typ.setAttribute("onchange", `typSelected(this, ${this.Nr});`);

        var option;

        switch (this.markSource) {
            case MARK_SOURCE_DOC:
                chartManager.markTypes.forEach(t => {
                    option = createElement("option");
                    option.setAttribute("color", t.color);
                    option.innerHTML = t.text;
                    this.select_typ.options.add(option);
                })
                break;
            case MARK_SOURCE_REPORT:
                chartManager.reportTypes.forEach(t => {
                    option = createElement("option");
                    option.setAttribute("color", t.color);
                    option.setAttribute("info", t.info)
                    option.innerHTML = t.text;
                    this.select_typ.options.add(option);
                })
                break;
        }
        this.div.appendChild(this.select_typ);

        this.typInfo;
        switch (this.markSource) {
            case MARK_SOURCE_DOC:
                // Farbe
                span = createElement("span");
                span.setAttribute("style", "margin-left:5px;");
                span.innerHTML = "Farbe:"; // TODO i18n
                this.div.appendChild(span);

                this.input_color = createElement("input");
                this.input_color.setAttribute("type", "color");
                this.input_color.setAttribute("id", "color");
                this.input_color.setAttribute("style", `width: ${SELECTION_DIALOG_WIDTH - 9}px;margin-left:5px;`);
                this.div.appendChild(this.input_color);
                break;
            case MARK_SOURCE_REPORT:
                // Info zum Typ
                this.typInfo = createElement("span");
                this.typInfo.setAttribute("style", "margin-left:5px;font-size:12px;");
                this.typInfo.innerHTML = ""; // TODO i18n
                this.typInfo.id = "typinfo";
                this.div.appendChild(this.typInfo);
                break;
        }

        // ------------------------------ 
        hr = createElement("hr");
        this.div.appendChild(hr);

        // Erstellen-Button
        var input = createElement("input");
        input.setAttribute("type", "button");
        input.setAttribute("id", "create");
        input.setAttribute("style", `margin-left:5px;`);
        input.setAttribute("class", "btnDialog");
        input.setAttribute("onclick", `createMark(${this.Nr}, "${this.markSource}");`);
        input.value = "Erstellen"; // TODO i18n
        this.div.appendChild(input);

        // Abbruch-Button
        input = createElement("input");
        input.setAttribute("type", "button");
        input.setAttribute("id", "cancel");
        input.setAttribute("class", "btnDialog");
        input.setAttribute("style", `float:right;margin-right:5px;`);
        input.setAttribute("onclick", `cancelMark(${this.Nr});`);
        input.value = "Abbruch"; // TODO i18n
        this.div.appendChild(input);

        const sel = this.select_typ;

        switch (this.markSource) {
            case MARK_SOURCE_DOC:
                this.input_color.value = sel.options[sel.selectedIndex].getAttribute("color");
                break;
            case MARK_SOURCE_REPORT:
                // typInfo
                this.typInfo.innerHTML = sel.options[sel.selectedIndex].getAttribute("info");
                break;
        }
    }
    open(x, y, mark) {
        const parentDIV = chartManager.div;

        this.div = createDIV();
        this.div.setAttribute("class", "selectionDialog");
        this.mark = mark;
        var left = x - chartManager.partValuesStart / chartManager.maximumXStepDivider;
        var top = y;

        // Prüfen ob es in das Fenster passt
        if (Number(SELECTION_DIALOG_WIDTH) + left + 20 > chartManager.pageWidth) {
            left = chartManager.pageWidth - SELECTION_DIALOG_WIDTH - 40;
        }
        if (Number(SELECTION_DIALOG_HEIGHT) + top + 20 > chartManager.pageWidth) {
            top = chartManager.pageWidth - SELECTION_DIALOG_HEIGHT - 50;
        }

        var time1 = dateFormat(chartManager.Time(this.selectionStart), "HH:MM:SS");
        var time2 = dateFormat(chartManager.Time(this.selectionEnd), "HH:MM:SS");
        var timeRange = `${time1} - ${time2}`; // TODO i18n

        var sec = chartManager.Seconds(this.selectionEnd - this.selectionStart) - (chartManager.partValuesStart / chartManager.maxFreq);
        var secDate = new Date(2022, 1, 1, 0, 0, sec);


        var timeDiff = dateFormat(secDate, "HH:MM:SS");             // TODO i18n

        // DIV (Rahmen)
        this.div.setAttribute("style", `position:absolute;left:${left}px;top:${top}px;width: ${SELECTION_DIALOG_WIDTH}px; height: ${SELECTION_DIALOG_HEIGHT}px;`);
        parentDIV.appendChild(this.div);

        // Tabelle für Information
        const table = createElement("table");
        this.div.appendChild(table);
        var tr = createElement("tr");
        table.appendChild(tr);
        // Zeile: Von/Bis
        var td = createElement("td");
        td.innerHTML = "Von/Bis:"; // TODO i18n
        tr.appendChild(td);

        td = createElement("td");
        td.innerHTML = timeRange;
        tr.appendChild(td);
        this._timeRangeTD = td;

        tr = createElement("tr");
        table.appendChild(tr);

        // Zeile: Dauer
        td = createElement("td");
        td.innerHTML = "Dauer:"; // TODO i18n
        tr.appendChild(td);

        td = createElement("td");
        td.innerHTML = timeDiff;
        tr.appendChild(td);
        this._timeDiffTD = td;

        // ------------------------------ 
        var hr = createElement("hr");
        this.div.appendChild(hr);

        // Notiz
        var span = createElement("span");
        span.setAttribute("style", "margin-left:5px;");
        span.innerHTML = "Notiz:"; // TODO i18n
        this.div.appendChild(span);

        this.textarea_note = createElement("textarea");
        this.textarea_note.setAttribute("id", "text");
        this.textarea_note.setAttribute("style", `width:${SELECTION_DIALOG_WIDTH - 15}px;margin-left: 5px;height:80px;`);
        this.textarea_note.value = mark.note;
        this.div.appendChild(this.textarea_note);

        // Typ
        span = createElement("span");
        span.setAttribute("style", "margin-left:5px;");
        span.innerHTML = "Typ:"; // TODO i18n
        this.div.appendChild(span);

        this.select_typ = createElement("select");
        this.select_typ.setAttribute("id", "typ");
        this.select_typ.setAttribute("class", "select");
        this.select_typ.setAttribute("style", `width:${SELECTION_DIALOG_WIDTH - 9}px;margin-left:5px;`);
        this.select_typ.setAttribute("onchange", `typSelected(this, ${this.Nr});`);

        var option;
        chartManager.markTypes.forEach(t => {
            option = createElement("option");
            option.setAttribute("color", t.color);
            option.innerHTML = t.text;
            this.select_typ.options.add(option);
        })
        this.div.appendChild(this.select_typ);
        var idx = -1;
        for (var i = 0; i < this.select_typ.options.length; i++) {
            if (this.select_typ.options[i].value == mark.type) {
                idx = i;
                break;
            }
        }
        if (idx > -1) {
            this.select_typ.selectedIndex = idx;
        }


        // Farbe
        span = createElement("span");
        span.setAttribute("style", "margin-left:5px;");
        span.innerHTML = "Farbe:"; // TODO i18n
        this.div.appendChild(span);

        this.input_color = createElement("input");
        this.input_color.setAttribute("type", "color");
        this.input_color.setAttribute("id", "color");
        this.input_color.setAttribute("style", `width: ${SELECTION_DIALOG_WIDTH - 9}px;margin-left:5px;`);
        this.input_color.value = mark.color;
        this.div.appendChild(this.input_color);

        // ------------------------------ 
        hr = createElement("hr");
        this.div.appendChild(hr);

        // Ändern-Button
        var input = createElement("input");
        input.setAttribute("type", "button");
        input.setAttribute("id", "create");
        input.setAttribute("style", `margin-left:5px;`);
        input.setAttribute("class", "btnDialog");
        input.setAttribute("onclick", `changeMark(${this.Nr});`);
        input.value = "Ändern"; // TODO i18n
        this.div.appendChild(input);

        // Resize-Button
        input = createElement("input");
        input.setAttribute("type", "button");
        input.setAttribute("id", "cancel");
        input.setAttribute("style", `position: absolute; left:6.75em;`);
        input.setAttribute("class", "btnDialog");
        input.setAttribute("onclick", `resizeMark(${this.Nr});`);
        input.value = "Start/Ende"; // TODO i18n
        this.div.appendChild(input);

        // Löschen-Button
        input = createElement("input");
        input.setAttribute("type", "button");
        input.setAttribute("id", "cancel");
        input.setAttribute("style", `position: absolute; left:13.2em;`);
        input.setAttribute("class", "btnDialog");
        input.setAttribute("onclick", `deleteMark(${this.Nr});`);
        input.value = "Löschen"; // TODO i18n
        this.div.appendChild(input);

        // Abbruch-Button
        input = createElement("input");
        input.setAttribute("type", "button");
        input.setAttribute("id", "cancel");
        input.setAttribute("style", `float:right;margin-right:5px;`);
        input.setAttribute("class", "btnDialog");
        input.setAttribute("onclick", `cancelMark(${this.Nr});`);
        input.value = "Abbruch"; // TODO i18n
        this.div.appendChild(input);
    }
}

class Mark {
    constructor(uuid, nr, note, color, type, valid, svg, source, rowStart, rowEnd, visible = true) {
        this.nr = nr;
        this.uuid = uuid;
        this.note = note;
        this.color = color;
        this.type = type;
        this.valid = valid;
        this.svg = svg;
        this.visible = visible;         // Entspricht dem löschen bei ML Markierungen (Eintrag wird nicht real gelöscht und nicht mehr angezeigt)
        this._rowStart = rowStart;
        this._rowEnd = rowEnd;
        this.source = source;  // A für Arzt, M für ML, R für Report
        this.needUpdate = true; // Flag das gesetzt wird, wenn create die Markierung erstellen oder updaten muss

        this.create();
    }

    get rowStart() { return this._rowStart; }
    set rowStart(v) {
        this._rowStart = v;
        if (this._rect) {
            this._rect.setAttribute("x", chartManager.calcPixelFromRowNumber(v));
        }
    }
    get rowEnd() { return this._rowEnd; }
    set rowEnd(v) {
        this._rowEnd = v;
        if (this._rect) {
            this._rect.setAttribute("width", chartManager.calcPixelFromRowNumber(v) - chartManager.calcPixelFromRowNumber(this._rowStart));
        }
    }

    create() {
        var visiblity;
        if (this.source == MARK_SOURCE_DOC) visiblity = chartManager.visibility.markDoc;
        if (this.source == MARK_SOURCE_ML) visiblity = chartManager.visibility.markML;
        if (this.source == MARK_SOURCE_REPORT) visiblity = chartManager.visibility.markReport;
        if (this.visible && visiblity) {
            var x = chartManager.calcPixelFromRowNumber(this.rowStart - chartManager.partValuesStart);
            if (x >= 0) {
                var rect = this._rect;
                if (!rect) {
                    rect = createRect();
                    this._rect = rect;
                }
                rect.setAttribute('x', x);
                rect.setAttribute('y', 0);
                var width = this.rowEnd - this.rowStart;
                var pixelWidth = chartManager.calcPixelFromRowNumber(width);
                if (pixelWidth < 1) {
                    pixelWidth = 1;
                }
                rect.setAttribute('width', pixelWidth);
                rect.setAttribute('height', DIAGRAM_HEIGHT);
                rect.setAttribute("fill", this.color);
                rect.setAttribute("fill-opacity", MARK_OPACITY);
                rect.setAttribute("dest", "mark");
                rect.setAttribute("nr", this.nr);
                rect.setAttribute("uuid", this.uuid);
                this.svg.appendChild(rect);
                if (chartManager.visibility.markText) {
                    var time1 = dateFormat(chartManager.TimeFromRow(this.rowStart), "HH:MM:SS");
                    var time2 = dateFormat(chartManager.TimeFromRow(this.rowEnd), "HH:MM:SS");
                    var timeRange = `${time1} - ${time2}`; // TODO i18n

                    var sec = chartManager.SecondsFromRow(this.rowEnd - this.rowStart) * (chartManager.maximumXStepDivider / 2);
                    var secDate = new Date(2022, 1, 1, 0, 0, sec);
                    var timeDiff = dateFormat(secDate, "HH:MM:SS");             // TODO i18n

                    if (!this.text1) {
                        this.text1 = createText();
                    }
                    this.text1.setAttribute('x', x + 20);
                    this.text1.setAttribute('y', 25);
                    this.text1.innerHTML = timeRange; // TODO i18n Zeitformat!
                    this.text1.setAttribute('fill', MARK_TEXT_COLOR);
                    this.text1.setAttribute("dest", "mark");
                    this.text1.setAttribute("nr", this.nr);
                    this.text1.setAttribute("uuid", this.uuid);
                    this.svg.appendChild(this.text1);

                    if (!this.text2) {
                        this.text2 = createText();
                    }
                    this.text2.setAttribute('x', x + 20);
                    this.text2.setAttribute('y', 45);
                    this.text2.innerHTML = "Dauer: " + timeDiff + ")"; // TODO i18n Zeitformat!
                    this.text2.setAttribute('fill', MARK_TEXT_COLOR);
                    this.text2.setAttribute("dest", "mark");
                    this.text2.setAttribute("nr", this.nr);
                    this.text2.setAttribute("uuid", this.uuid);
                    this.svg.appendChild(this.text2);

                    if (!this.text3) {
                        this.text3 = createText();
                    }
                    this.text3.setAttribute('x', x + 20);
                    this.text3.setAttribute('y', 65);
                    this.text3.innerHTML = this.type; // TODO i18n Zeitformat!
                    this.text3.setAttribute('fill', MARK_TEXT_COLOR);
                    this.text3.setAttribute("dest", "mark");
                    this.text3.setAttribute("nr", this.nr);
                    this.text3.setAttribute("uuid", this.uuid);
                    this.svg.appendChild(this.text3);
                }

                chartManager.clickStatus.removeSelectionRect();
            }
        }
    }
}

class PathGenerator {
    constructor({ startPointX, startPointY, SVG, min, max }) {
        this.startPointX = 0;
        this.startPointY = 0;
        this.min = min;
        this.max = max;
        this.range = max - min;
        this.height = 150;
        this.needcalc = true;
        if (startPointX) {
            this.startPointX = startPointX;
        }
        if (startPointY) {
            this.startPointY = startPointY;
        }
        if (SVG) {
            this.startPointY = SVG.clientHeight;
            this.height = this.startPointY;
            this.svg = SVG;
        }
        this.colors = [];
        this.points = [];
        this.maxX = 0;

        // Für Umrechnung von Value zu Pixel (Y)
        this.yFactor = this.range / this.height;
        this.minDiff = this.min / this.yFactor;
    }

    // Fügt einen absoluten Punkt hinzu. 0,0 = links/oben
    addPoint(x, y, color) {
        var col = this.colors.find(c => c.color == color);

        if (!col) {
            col = { color: color, points: [], path: "" };
            this.colors.push(col);
        }
        this.points.push({ x: x, y: y, color: col });
        this.needcalc = true;
    }
    // Fügt einen einzellnen Y-Wert hinzu, 0 = unten
    addYValue(y, color, xDistance, dot) {
        var col = this.colors.find(c => c.color == color);
        var y = (y / this.yFactor) - this.minDiff;

        if (!col) {
            col = { color: color, points: [], path: "" };
            this.colors.push(col);
        }
        this.points.push({ y: this.height - y, color: col, xDistance: xDistance, dot: dot });
        this.needcalc = true;
    }
    // Fügt mehrere einzellne Y-Werte hinzu, 0 = unten
    addYValues(values) {
        values.forEach(v => {
            this.addYValue(v.y, v.color, 1, false);
        });
    }
    addYValuesFromArray(array, color) {
        var oldValue = null;
        array.forEach(vv => {
            var v;
            if (vv == undefined) {
                // TODO Prüfen bei Zoom < 1 warum UNDEFINED vorkommen!!!!!
            }
            else if (vv == null) {
                // kein Wert, alten Wert nutzen
                v = oldValue;
            }
            else {
                v = vv;
            }

            if (v != undefined && v != null) {
                if (!isNaN(v.min) && !isNaN(v.max)) {
                    // Array mit min/max Werten
                    if (v.color) {
                        // und mit Farbangaben
                        this.addYValue(v.min, v.color, 1, false);
                        this.addYValue(v.max, v.color, 1, false);
                    }
                    else {
                        // aber ohne Farbangaben (Parameter nutzen)
                        this.addYValue(v.min, color, 1, false);
                        this.addYValue(v.max, color, 1, false);
                    }
                }
                else {
                    if (!isNaN(v.point)) {
                        // Nur point-Wert
                        // Mit Farbangaben bzw. Parameter nutzen
                        this.addYValue(v.point, v.color ? v.color : color, 2, true);
                    }
                    else if (!isNaN(v.point1) && !isNaN(v.point2)) {
                        // Value1 und Value2
                        this.addYValue(v.point1, color, 1, true);
                        this.addYValue(v.point2, color, 1, true);
                    }
                    else {
                        // Weder min/max, value, value1/2 -> es muss sich um eine einfache Zahl handeln
                        this.addYValue(v, color, 2, true);
                    }
                }
            }
        });
    }


    // Fügt eine einzellne Y-Pos hinzu, 0 = oben
    addYPos(y, color) {
        var col = this.colors.find(c => c.color == color);

        if (!col) {
            col = { color: color, points: [], path: "" };
            this.colors.push(col);
        }
        this.points.push({ y: y, color: col });
        this.needcalc = true;
    }

    makePath(gapPixel) {
        var x = this.startPointX;
        var y = this.startPointY;
        this.points.forEach(p => {
            if (gapPixel) {
                p.color.points.push({ x1: x, y1: y, x2: x + (gapPixel * p.xDistance), y2: p.y, dot: p.dot });
                x += (gapPixel * p.xDistance);
            }
            else {
                p.color.points.push({ x1: x, y1: y, x2: p.x, y2: p.y, dot: false });
                x = p.x;
            }
            y = p.y;
        });
        this.maxX = x;

        this.colors.forEach(c => {
            var path = "";
            var dots = "";
            var x = -1;
            var y = -1;

            c.points.forEach(p => {
                if (p.x1 == x && p.y1 == y) {
                    // Alter Endpunkt entspricht dem neuen Startpunkt, nur eine Linie hinzufügen
                    path += `L${p.x2},${p.y2}`;
                    if (p.dot && gapPixel > 1.4) {
                        dots += `M${p.x2},${p.y2}L${p.x2},${p.y2}`
                    }
                }
                else {
                    // Versetzter Startpunkt, erst dorthin bewegen
                    path += `M${p.x1},${p.y1}L${p.x2},${p.y2}`;
                    if (p.dot && gapPixel > 1.4) {
                        dots += `M${p.x2},${p.y2}L${p.x2},${p.y2}`;
                    }
                }
                x = p.x2;
                y = p.y2;
            });

            c.path = path;
            c.dots = dots;
        });
        this.needcalc = false;
    }
    drawPath({ svg, gapPixel }) {
        if (!svg) {
            svg = this.svg;
        }
        var path = null;
        var dotPath = null;
        if (this.needcalc) {
            this.makePath(gapPixel);
        }

        const dotWidth = gapPixel > 5 ? 4.167 : gapPixel / 1.2;

        this.colors.forEach(c => {
            path = createPath({
                d: c.path,
                style: `stroke:${c.color};stroke-width:1;fill:none;`
            });
            svg.appendChild(path);

            dotPath = createPath({
                d: c.dots,
                style: `stroke:${c.color};stroke-width:${dotWidth}px;stroke-linecap:round;`
            });
            svg.appendChild(dotPath);
        })
    }

    makeBars(width, gapPixel) {
        var x = this.startPointX;
        var y = this.startPointY;
        var l = this.points.length;
        // Damit immer ein [i+1] vorhanden ist:
        l = l - ((l + 1) % 2);
        for (var i = 0; i < l; i += 2) {
            if (width) {
                this.points[i].color.points.push({ x1: x, y1: this.points[i].y, x2: x, y2: this.points[i + 1].y });
                x += width + gapPixel;
            }
            else {
                this.points[i].color.points.push({ x1: this.points[i].x, y1: this.points[i].y, x2: this.points[i].x, y2: this.points[i + 1].y });
                x = this.points[i + 1].x;
            }
        }
        this.maxX = x;

        this.colors.forEach(c => {
            var path = "";

            c.points.forEach(p => {
                path += `M${p.x1},${p.y1}L${p.x2},${p.y2}`;
            });

            c.path = path;
        });
        this.needcalc = false;
    }
    drawBars({ svg, width, gapPixel }) {
        if (!svg) {
            svg = this.svg;
        }
        var path = null;
        if (this.needcalc) {
            this.makeBars(width, gapPixel);
        }
        this.colors.forEach(c => {
            path = createPath({
                d: c.path,
                style: `stroke:${c.color};fill:none;stroke-width:${width}`
            });
            svg.appendChild(path);
        })
    }
}

function typSelected(obj, nr) {
    const dialog = chartManager.dialogFromNr(nr);
    const sel = dialog.select_typ;
    switch (dialog.markSource) {
        case MARK_SOURCE_DOC:
            dialog.input_color.value = sel.options[sel.selectedIndex].getAttribute("color");
            break;
        case MARK_SOURCE_REPORT:
            dialog.typInfo.innerHTML = sel.options[sel.selectedIndex].getAttribute("info");
            break;
    }
}
function createMark(nr, markSource) {
    const dialog = chartManager.dialogFromNr(nr);
    const svg = dialog.svg;
    const uuid = ""; // Für Implementierung als Component (wenn Datenbankzugriff besteht und Markierungen geladen werden)
    const mark = new Mark(uuid, nr, dialog.note, dialog.color, dialog.type, true, svg, markSource, dialog.rowStart + chartManager.partValuesStart, dialog.rowEnd + chartManager.partValuesStart);

    chartManager._marks.push(mark);
    chartManager.div.removeChild(dialog.div);
    chartManager._dialogs.splice(chartManager._dialogs.indexOf(dialog), 1);
}
function changeMark(nr) {
    const dialog = chartManager.dialogFromNr(nr);
    const mark = dialog.mark;
    const color = dialog.input_color.value;
    const svg = dialog.svg;
    const uuid = ""; // Für Implementierung als Component (wenn Datenbankzugriff besteht und Markierungen geladen werden)

    mark.note = dialog.note;
    mark.color = dialog.color;
    mark.type = dialog.type;
    mark._rect.setAttribute("fill", dialog.color);

    try {
        dialog.svg.removeChild(dialog.rectLeft);
        dialog.svg.removeChild(dialog.rectRight);
    }
    catch (e) { }

    dialog.mark.needUpdate = true;
    dialog.mark.create();
    chartManager.div.removeChild(dialog.div);
    chartManager._dialogs.splice(chartManager._dialogs.indexOf(dialog), 1);
}
function cancelMark(nr) {
    const dialog = chartManager.dialogFromNr(nr);
    if (dialog.oldRowStart) {
        dialog.mark.rowStart = dialog.oldRowStart;
    }
    if (dialog.oldRowEnd) {
        dialog.mark.rowEnd = dialog.oldRowEnd;
    }
    if (dialog.rectLeft) {
        dialog.svg.removeChild(dialog.rectLeft);
    }
    if (dialog.rectRight) {
        dialog.svg.removeChild(dialog.rectRight);
    }
    chartManager.div.removeChild(dialog.div);
    chartManager._dialogs.splice(chartManager._dialogs.indexOf(dialog), 1);
}
function deleteMark(nr) {
    const dialog = chartManager.dialogFromNr(nr);
    if (dialog.mark) {
        dialog.svg.removeChild(dialog.mark._rect);
        dialog.svg.removeChild(dialog.mark.text1);
        dialog.svg.removeChild(dialog.mark.text2);
        dialog.svg.removeChild(dialog.mark.text3);
        if (dialog.rectLeft) {
            dialog.svg.removeChild(dialog.rectLeft);
        }
        if (dialog.rectRight) {
            dialog.svg.removeChild(dialog.rectRight);
        }

        if (dialog.mark.source == MARK_SOURCE_ML) {
            // Nicht löschen, nur als NICHT SICHTBAR ändern
            dialog.mark.visible = false;
        }
        else {
            // Arztmarkierungen werden wirklich gelöscht
            const indexOfMark = chartManager._marks.indexOf(dialog.mark);
            if (indexOfMark > -1) {
                chartManager._marks.splice(indexOfMark, 1);
            }
        }

        chartManager.div.removeChild(dialog.div);
        chartManager._dialogs.splice(chartManager._dialogs.indexOf(dialog), 1);
    }
}
function resizeMark(nr) {
    const dialog = chartManager.dialogFromNr(nr);
    dialog.oldRowStart = dialog.rowStart;
    dialog.oldRowEnd = dialog.rowEnd;
    dialog.rectLeft = createRect();
    dialog.rectLeft.setAttribute('x', chartManager.calcPixelFromRowNumber(dialog.rowStart - chartManager.partValuesStart));
    dialog.rectLeft.setAttribute('y', 0);
    dialog.rectLeft.setAttribute('width', MARK_DRAGBOX_WIDTH);
    dialog.rectLeft.setAttribute('height', DIAGRAM_HEIGHT);
    dialog.rectLeft.setAttribute("fill", MARK_DRAGBOX_COLOR);
    dialog.rectLeft.setAttribute("opacity", MARK_DRAGBOX_OPACITY)
    dialog.rectLeft.setAttribute("cursor", "ew-resize");
    dialog.rectLeft.setAttribute("dest", "resizeLeft");
    dialog.rectLeft.setAttribute("nr", nr);
    dialog.svg.appendChild(dialog.rectLeft);

    chartManager._resizeData.anchorLeft = dialog.rectLeft;


    dialog.rectRight = createRect();
    dialog.rectRight.setAttribute('x', chartManager.calcPixelFromRowNumber(dialog.rowEnd - chartManager.partValuesStart) - MARK_DRAGBOX_WIDTH);
    dialog.rectRight.setAttribute('y', 0);
    dialog.rectRight.setAttribute('width', MARK_DRAGBOX_WIDTH);
    dialog.rectRight.setAttribute('height', DIAGRAM_HEIGHT);
    dialog.rectRight.setAttribute("fill", MARK_DRAGBOX_COLOR);
    dialog.rectRight.setAttribute("opacity", MARK_DRAGBOX_OPACITY)
    dialog.rectRight.setAttribute("cursor", "ew-resize");
    dialog.rectRight.setAttribute("dest", "resizeRight");
    dialog.rectRight.setAttribute("nr", nr);
    dialog.svg.appendChild(dialog.rectRight);
    chartManager._resizeData.anchorRight = dialog.rectRight;

    // chartManager.div.removeChild(dialog.div);
}


var usedDataManager;
async function prepare() {
    // Nur die Daten laden, keine UI initialisieren, kein zeichnen...
    //let load = await (fetch("./all.json"));
    let load = await (fetch("./kurven.json"));
    let json = await load.json();
    // --------------------------------  Fuckup Point -------------------------------- 
    usedDataManager = dataManager;

    usedDataManager.json = json;
    chartManager = new ChartManager(json, usedDataManager);

    // ------------------------------  END Fuckup Point ------------------------------ 

    var chart1 = chartManager.addChart("Nasal");
    chartManager.addHorizontalScale({ before: chart1, height: HORIZONTAL_SCALE_HEIGHT, align: HSCALE_ALIGNMENTS.Bottom });
    chart1.addLine("#000000", "Nasaler Druck");

    var chart2 = chartManager.addChart("Thorax");
    chart2.addLine("#000000", "Thorax");

    var chart3 = chartManager.addChart("PSchnarchen");
    chart3.addLine("#000000", "PSchnarchen")

    var chart4 = chartManager.addChart("SpO2");
    chart4.addLine("#880000", "SpO2");
    chart4.addLine("#008800", "SpO2 B-B");

    var chart5 = chartManager.addChart("Pulsrate");
    chart5.addLine("#000000", "Pulsrate");

    var chart6 = chartManager.addChart("Plethysmogramm");
    chart6.addLine("#000000", "Plethysmogramm");

    var chart7 = chartManager.addChart("Aktivität");
    chart7.addLine("#000000", "Aktivitaet");

    chartManager.addHorizontalScale({ after: chart7, height: HORIZONTAL_SCALE_HEIGHT, align: HSCALE_ALIGNMENTS.Top });
}
async function start() { // @function Start
    await prepare();


    /// #start weiss
    const UITop2 = chartManager.addUIManager({
        div: UI_TYPES.MenuTop, height: "auto",
        elementsData: [
            {
                name: "ButtonLinks",
                position: 1,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Button,
                function: testButton,
                label: "Test",
                class: "btn",
                style: "margin-bottom: 3px;"
            },
            // {
            //     name: "Spacer",
            //     position: 3,
            //     visible: true,
            //     enabled: true,
            //     type: ELEMENTTYPES.Spacer,
            //     width: "10px",
            // },
            {
                name: "IMG2",
                position: 5,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.ImageButton,
                function: function () { alert("Vor"); },
                src: "https://icons.veryicon.com/png/System/Cristal%20Intense/Fleche%20droite%20bleue.png",
                width: "16px",
                height: "16px",
                class: "btn btnGrpRight"
            },
            {
                name: "SVG",
                position: 6,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.SVGButton,
                function: function () { alert("SVG Record"); },
                xml: '<circle cx="8" cy="8" r="6" stroke="black" stroke-width="1" fill="red" />',
                width: "16px",
                height: "16px",
                class: "btn"
            },
            {
                name: "CHECK",
                position: 7,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Checkbox,
                function: mitParameter,
                id: "testCheck",
                value: false,
                label: "AnAus"
            },
            {
                name: "NUMBER",
                position: 8,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Number,
                function: fuerNumber,
                id: "testNumber",
                value: 10,
                min: 1,
                max: 100,
                label: "1-100"
            },
            {
                name: "Zoom:",
                position: 8.5,
                visible: true,
                enabled: true,
                text: "Zoom:",
                type: ELEMENTTYPES.Label,
                style: "padding-left: 5px"
            },
            {
                name: "OPT1",
                position: 9,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Radio,
                function: fuerRadio,
                id: "radioG1A",
                value: 1,
                group: "G1",
                label: "1",
                checked: false
            },
            {
                name: "OPT2",
                position: 10,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Radio,
                function: fuerRadio,
                id: "radioG1B",
                value: 2,
                group: "G1",
                label: "2",
                checked: true
            },
            {
                name: "Bereich",
                position: 13,
                visible: true,
                enable: true,
                type: ELEMENTTYPES.Range,
                function: fuerNumber,
                id: "range",
                value: 20,
                min: 1,
                max: 100,
                label: "Bereich:",
                labelStyle: "padding-left: 5px"
            },
            {
                name: "Name",
                position: 14,
                visible: true,
                enable: true,
                type: ELEMENTTYPES.Text,
                function: fuerNumber,
                id: "text",
                value: "Bitte ändern",
                label: "Name:",
                labelStyle: "padding-left: 5px"
            },
            {
                name: "Zeit",
                position: 14,
                visible: true,
                enable: true,
                type: ELEMENTTYPES.Time,
                function: fuerNumber,
                id: "zeit",
                value: "15:00:00",
                label: "Zeit:",
                labelStyle: "padding-left: 5px"
            },
            {
                name: "Auswahl",
                position: 15,
                visible: true,
                enable: true,
                type: ELEMENTTYPES.Select,
                function: fuerNumber,
                id: "select",
                value: 10,
                label: "Abstand:",
                labelStyle: "",
                labelClass: "label",
                class: "select",
                options: [
                    { value: 1, text: "1 Pixel" },
                    { value: 2, text: "2 Pixel" },
                    { value: 3, text: "3 Pixel" },
                    { value: 4, text: "4 Pixel" },
                    { value: 5, text: "5 Pixel" },
                    { value: 10, text: "10 Pixel" }
                ]
            }
        ]
    });
    /// #end weiss
    UITop2.addCSS('.selectionDialog{border:1px solid #0854a0;border-radius:5px;color:#0854a0;background-color:#ebf5fe;font-size:16px;font-weight:700;font-family:"Roboto",sans-serif}.btnDialog{background-color:#fff;border:1px solid #0854a0;border-radius:5px;color:#0854a0;padding:0;font-size:12px;cursor:pointer;min-width:60px;min-height:32px;margin:0 5px 0 0}.btnDialog:hover{background-color:#ebf5fe;transition:.7s}.btnDialog:active{background-color:#0854a0;transition:0;color:#fff;fill:#fff}.btnDialog:disabled{color:#9cbbda;border-color:#9cbbda}.btnDialog:focus{outline:1px solid #0854a0}.btn svg{vertical-align:middle;fill:#0854a0;width:28px;height:28px}button,select,label,option,p{color:#0854a0;font-size:18px;font-weight:700;font-family:"Roboto",sans-serif}.label{display:inline-block;box-sizing:border-box;background-color:#fff;color:#0854a0;font-size:18px;min-width:103px;min-height:38px;margin:0 5px 0 0;text-align:center;padding-top:8px}input[type="text"],.select{box-sizing:border-box;background-color:#fff;border:1px solid #0854a0;border-radius:5px;color:#0854a0;padding:0;font-size:18px;cursor:pointer;min-width:103px;min-height:38px;margin:0 5px 0 0}input[type="text"]:focus,.select:focus{outline:1px solid #0854a0}input[type="text"]{padding:0 8px}input[type="checkbox"]{color:#0854a0;min-width:22px;min-height:22px}.btn{background-color:#fff;border:1px solid #0854a0;border-radius:5px;color:#0854a0;padding:0;font-size:18px;cursor:pointer;min-width:103px;min-height:38px;margin:0 5px 0 0}.grpLeft{border-radius:5px 0 0 5px;margin:0}.grpInner{border-left:none;border-radius:0 0 0 0;margin:0}.grpRight{border-left:none;border-radius:0 5px 5px 0}.btn:hover{background-color:#ebf5fe;transition:.7s}.btn:active{background-color:#0854a0;transition:0;color:#fff;fill:#fff}.btn:disabled{color:#9cbbda;border-color:#9cbbda}.btn:focus{outline:1px solid #0854a0}.grpRight:focus{border:1px solid #0854a0;outline:1px solid #0854a0}.grpLeft:focus{border:1px solid #0854a0;outline:1px solid #0854a0}.grpInner:focus{border:1px solid #0854a0;outline:1px solid #0854a0}');
    //UITop.addCSS("input[type=checkbox] { visibility: hidden; } .checkbox-example { width: 45px; height: 15px; background: #555; margin: 20px 10px; position: relative; border-radius: 5px; } .checkbox-example label { display: block; width: 18px; height: 18px; border-radius: 50%; transition: all .5s ease; cursor: pointer; position: absolute; top: -2px; left: -3px; background: #ccc; } .checkbox-example input[type=checkbox]:checked + label { left: 27px; }");

    /// #start rot
    const UITop = chartManager.addUIManager({
        div: UI_TYPES.MenuTop, height: "auto",
        elementsData: [
            {
                name: "ScrollPageLeft",
                position: 1.2,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Button,
                function: ButtonEvent_ScrollPageLeft,
                label: "<i class='fa-solid fa-angles-left fa-lg'></i>",
                class: "btn grpLeft"
            },
            {
                name: "ScrollRangeLeft",
                position: 1.4,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Button,
                function: ButtonEvent_ScrollRangeLeft,
                label: "<i class='fa-solid fa-angle-left fa-lg'></i>",
                class: "btn grpInner"
            },
            {
                name: "ScrollRangeRight",
                position: 1.6,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Button,
                function: ButtonEvent_ScrollRangeRight,
                label: "<i class='fa-solid fa-angle-right fa-lg'></i>",
                class: "btn grpInner"
            },
            {
                name: "ScrollPageRight",
                position: 1.8,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Button,
                function: ButtonEvent_ScrollPageRight,
                label: "<i class='fa-solid fa-angles-right fa-lg'></i>",
                class: "btn grpRight"
            },
            {
                name: "zoomTo",
                position: 2.0,
                visible: true,
                enable: true,
                type: ELEMENTTYPES.Select,
                function: SelectEvent_zoomTo,
                id: "select_zoomTo",
                value: 0,
                label: "<i class='fa-solid fa-magnifying-glass fa-lg'></i>",
                labelStyle: "text-align:right;min-width:2em;",
                labelClass: "label",
                class: "select grpLeft",
                options: [
                    { value: 0, text: "Aktueller Zoom", id: "ActualZoom" },
                    { value: 60, text: "1 Minute" },
                    { value: 120, text: "2 Minuten" },
                    { value: 180, text: "3 Minuten" },
                    { value: 240, text: "4 Minuten" },
                    { value: 300, text: "5 Minuten" },
                    { value: 600, text: "10 Minuten" },
                    { value: 1200, text: "20 Minuten" },
                    { value: 1800, text: "30 Minuten" },
                    { value: 3600, text: "1 Stunde" },
                ]
            },
            {
                name: "AllZoom",
                position: 2.2,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Button,
                function: ButtonEvent_AllZoom,
                label: "Alles",
                class: "btn grpInner",
                style: ""
            },
            {
                name: "ZoomOut",
                position: 2.4,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Button,
                function: ButtonEvent_ZoomOut,
                label: "<i class='fa-solid fa-magnifying-glass-minus fa-lg'></i>",
                class: "btn grpInner",
                style: ""
            },
            {
                name: "ZoomUndo",
                position: 2.4,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Button,
                function: ButtonEvent_ZoomUndo,
                label: "<i class='fa-solid fa-undo fa-lg'></i>",
                class: "btn grpRight",
                style: ""
            },
            {
                name: "xGap",
                position: 3,
                visible: true,
                enable: true,
                type: ELEMENTTYPES.Select,
                function: SelectEvent_XGap,
                id: "select_xGap",
                value: chartManager.xGap,
                label: "Abstand:",
                labelStyle: "",
                labelClass: "label",
                class: "select",
                options: [
                    { value: 1, text: "1 Pixel" },
                    { value: 2, text: "2 Pixel" },
                    { value: 3, text: "3 Pixel" },
                    { value: 4, text: "4 Pixel" },
                    { value: 5, text: "5 Pixel" },
                ]
            },
            {
                name: "TEST",
                position: 4,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Button,
                function: ButtonEvent_TEST,
                label: "TEST",
                class: "btn",
                style: ""
            },

        ]
    });
    const UILeft = chartManager.addUIManager({
        div: UI_TYPES.MenuLeft, height: "auto", width: "6.5em",
        elementsData: [
            {
                name: "Sichtbar",
                position: 1.0,
                visible: true,
                enabled: true,
                text: "Sichtbar:",
                type: ELEMENTTYPES.Label,
                newLine: true,
                class: "menuLeft",
                style: "font-size: 0.85em;"
            },
            {
                name: "Sichtbar",
                position: 1.1,
                visible: true,
                enabled: true,
                text: "Markierungen/Ereignisse",
                type: ELEMENTTYPES.Label,
                newLine: true,
                style: "font-size: 0.35em;"
            },
            {
                name: "Sichtbar_Doc",
                position: 1.2,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Checkbox,
                function: Checkbox_Event_SichtbarChanges,
                id: "Sichtbar_Doc",
                value: chartManager.visibility.markDoc,
                labelPos: LABEL_POSITIONS.Right,
                label: "Arzt",
                newLine: true,
                labelClass: "menuLeft"
            },
            {
                name: "Sichtbar_ML",
                position: 1.4,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Checkbox,
                function: Checkbox_Event_SichtbarChanges,
                id: "Sichtbar_ML",
                value: chartManager.visibility.markML,
                labelPos: LABEL_POSITIONS.Right,
                label: "ML",
                newLine: true,
                labelClass: "menuLeft"
            },
            {
                name: "Sichtbar_Report",
                position: 1.6,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Checkbox,
                function: Checkbox_Event_SichtbarChanges,
                id: "Sichtbar_Report",
                value: chartManager.visibility.markReport,
                labelPos: LABEL_POSITIONS.Right,
                label: "Report",
                newLine: true,
                labelClass: "menuLeft"
            },
            {
                name: "Sichtbar_Text",
                position: 1.6,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Checkbox,
                function: Checkbox_Event_SichtbarChanges,
                id: "Sichtbar_Text",
                value: chartManager.visibility.markText,
                labelPos: LABEL_POSITIONS.Right,
                label: "Beschriftungen",
                newLine: true,
                labelClass: "menuLeft",
                newLineMargin: "1em",
            },
            {
                name: "Zoom_Modus",
                position: 2,
                visible: true,
                enabled: true,
                text: "Zoom-Modus:",
                type: ELEMENTTYPES.Label,
                style: "margin-top: 100px;",
                class: "menuLeft",
                newLine: true,
                style: "font-size: 0.85em;"
            },
            {
                name: "Zoom_Modus_1",
                position: 2.2,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Radio,
                function: Option_Event_ZoomModus,
                id: "Zoom_Modus_1",
                value: 1,
                group: "ZoomModus",
                label: "Linksbündig",
                labelClass: "menuLeft",
                checked: true,
                newLine: true,
                labelPos: LABEL_POSITIONS.Right
            },
            {
                name: "Zoom_Modus_2",
                position: 2.4,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Radio,
                function: Option_Event_ZoomModus,
                id: "Zoom_Modus_2",
                value: 2,
                group: "ZoomModus",
                label: "Zentriert",
                labelClass: "menuLeft",
                checked: false,
                newLine: true,
                labelPos: LABEL_POSITIONS.Right
            },
            {
                name: "Zoom_Modus_3",
                position: 2.6,
                visible: true,
                enabled: true,
                type: ELEMENTTYPES.Radio,
                function: Option_Event_ZoomModus,
                id: "Zoom_Modus_3",
                value: 3,
                group: "ZoomModus",
                label: "Rechtsbündig",
                labelClass: "menuLeft",
                checked: false,
                newLine: true,
                labelPos: LABEL_POSITIONS.Right
            },

        ]
    });
    UILeft.addCSS(".menuLeft { font-size: 0.7em; line-height: 50%; }");
    /// #end rot

    // Immer vorhandes DIV mit 1 Pixel breite auf der linken Seite. Bei nicht vorhanden sein eines DIVs links
    // wird aufgrund von overflow-x: auto das Diagramm nicht dargestellt! (k.a. warum)
    chartManager.addDIV(DIV_TYPES.MenuLeft, { width: "1px" });
    // **************************************************************************************************** 
    // **                                       Zusätzliche DIVs                                         ** 
    // **************************************************************************************************** 
    // ** In folgender Reihenfolge!                                                                      ** 
    // **------------------------------------------------------------------------------------------------** 
    // ** Top (Menu oder Skalas)                                                                         ** 
    // ** Bottom (Menu oder Skalas)                                                                      ** 
    // ** Left (Menu oder Skalas)                                                                        ** 
    // ** Right (Menu oder Skalas)                                                                       ** 
    // **************************************************************************************************** 
    // Tops
    // Bottoms
    // Lefts
    chartManager.addVerticalScale({ vscale_alignment: VSCALE_ALIGNMENTS.Left, width: VSCALE_DEFAULT_WIDTH });
    chartManager.addVerticalScale({ vscale_alignment: VSCALE_ALIGNMENTS.Right, width: VSCALE_DEFAULT_WIDTH });
    // Rights

    // ********************************************* CREATE ALL ********************************************* 
    chartManager.createAll();

    loadMarks();
    //UITop2.create();
    UITop.create();
    UILeft.create();
    chartManager.createVerticalScales();
    chartManager.setActualZoom();
    // ****************************************************************************************************** 

    // BUTTONS EVENTS
    /// #start gelb
    function ButtonEvent_ScrollPageLeft(eventArgs) {
        scroll(-100);
    }
    function ButtonEvent_ScrollRangeLeft(eventArgs) {
        scroll(-90);
    }
    function ButtonEvent_ScrollRangeRight(eventArgs) {
        scroll(90);
    }
    function ButtonEvent_ScrollPageRight(eventArgs) {
        scroll(100);
    }
    function ButtonEvent_AllZoom(eventArgs) {
        chartManager.saveViewUndo();
        chartManager.partValuesStart = 0;
        chartManager.partValuesCount = chartManager.json.data.length;
        chartManager.zoomFreq = chartManager.allZoom;
    }
    function ButtonEvent_ZoomUndo(eventArgs) {
        chartManager.restoreViewLastUndo(true);
    }
    function ButtonEvent_ZoomOut(eventArgs) {
        chartManager.saveViewUndo();
        const chartDiv = chartManager.div;
        // Alte Position vom Zentrum des Bildschirms aus gesehen
        const posAlt = (chartManager.partValuesStart + (chartDiv.scrollLeft * chartManager.zoomFreq / chartManager.maximumXStepDivider) + (chartManager.pageWidth * chartManager.zoomFreq / chartManager.maximumXStepDivider / 2));
        const zoomNeu = chartManager.zoomFreq * (DEFAULT_ZOOMOUT_PERCENT / 100 + 1);
        chartManager.calcPartValuesCount(zoomNeu);
        var newZoomFreq = chartManager.zoomFreq * (DEFAULT_ZOOMOUT_PERCENT / 100 + 1);
        if (newZoomFreq > chartManager.allZoom) {
            newZoomFreq = chartManager.allZoom;
        }
        chartManager.zoomFreq = newZoomFreq;
        const posNeu = (chartManager.partValuesStart + (chartDiv.scrollLeft * chartManager.zoomFreq / chartManager.maximumXStepDivider) + (chartManager.pageWidth * chartManager.zoomFreq / chartManager.maximumXStepDivider / 2));
        var newScrollLeft = chartDiv.scrollLeft - ((posNeu - posAlt) / chartManager.zoomFreq * chartManager.maximumXStepDivider);
        if (newScrollLeft < 0) {
            var negativScroll = (newScrollLeft * -1);
            if (chartManager.partValuesStart > 0) {
                chartManager.partValuesStart -= negativScroll * chartManager.zoomFreq / chartManager.maximumXStepDivider;
                if (chartManager.partValuesStart < 0) {
                    chartManager.partValuesStart = 0;
                }
            }
            chartManager.createAll();
            newScrollLeft = 0;
        }
        chartDiv.scrollLeft = newScrollLeft;
    }
    function SelectEvent_zoomTo(eventArgs) {
        const htmlElement = eventArgs.srcElement;
        const uiElement = htmlElement.UIElement;
        const uiManager = uiElement.uiManager;

        const zoomSeconds = uiElement.Value;
        if (zoomSeconds > 0) {
            // 0 = Aktueller Zoom (immer gewähltes Item, sollte nicht auswählbar sein)
            chartManager.saveViewUndo();
            var pos;
            var scrollPos;
            if (chartManager.getUIElementFromName("Zoom_Modus_1").Value) {
                var pos = chartManager.positionLeft;
                scrollPos = SCROLL_POSITION.LeftLeft;
            }
            else if (chartManager.getUIElementFromName("Zoom_Modus_2").Value) {
                var pos = chartManager.positionCenter;
                scrollPos = SCROLL_POSITION.Center;
            }
            else if (chartManager.getUIElementFromName("Zoom_Modus_3").Value) {
                var pos = chartManager.positionRight;
                scrollPos = SCROLL_POSITION.RightRight;
            }

            chartManager.positionCenter = { values: pos, zoomSeconds: zoomSeconds, scrollPosition: scrollPos };
            uiElement.Value = 0;
        }
    }
    // @pos TEST-Button Eventfunktion
    function ButtonEvent_TEST(eventArgs) {
        const htmlElement = eventArgs.srcElement;
        const uiElement = htmlElement.UIElement;
        const uiManager = uiElement.uiManager;
        debugger;
        const markReport = chartManager.marksFromReport();
    }
    function Option_Event_ZoomModus(eventArgs) {
        const htmlElement = eventArgs.srcElement;
        const uiElement = htmlElement.UIElement;
        const uiManager = uiElement.uiManager;
    }

    function SelectEvent_XGap(eventArgs) {
        chartManager.saveViewUndo();
        const htmlElement = eventArgs.srcElement;
        const uiElement = htmlElement.UIElement;
        const uiManager = uiElement.uiManager;

        var oldXGap = chartManager.xGap;
        chartManager.xGap = Number(uiElement.Value);
        chartManager.createAll();
        var newXGap = chartManager.xGap;
        chartManager.div.scrollLeft = (chartManager.div.scrollLeft / (oldXGap + 1) * (newXGap + 1));
    }
    function Checkbox_Event_SichtbarChanges(eventArgs) {
        const htmlElement = eventArgs.srcElement;
        const uiElement = htmlElement.UIElement;
        const uiManager = uiElement.uiManager;
        chartManager.visibility.markDoc = uiManager.getUIElementFromName("Sichtbar_Doc").Value;
        chartManager.visibility.markML = uiManager.getUIElementFromName("Sichtbar_ML").Value;
        chartManager.visibility.markReport = uiManager.getUIElementFromName("Sichtbar_Report").Value;
        chartManager.visibility.markText = uiManager.getUIElementFromName("Sichtbar_Text").Value;

        chartManager.createAll();

    }
    /// #end gelb
    /**
     * 
     * @param {Richtung und Scrollbreite in % (-100 = voll links...100 = voll rechts)} sizePercent 
     */
    function scroll(sizePercent) {
        const chartDiv = chartManager.div;
        const scrollWidth = chartDiv.scrollWidth;
        const clientWidth = chartDiv.clientWidth;
        const scroll = clientWidth / 100 * sizePercent;
        const partStart = chartManager.partValuesStart;
        const partCount = chartManager.partValuesCount;
        var newScrollLeft = chartDiv.scrollLeft + scroll;

        if (chartManager.json.data.length == chartManager.partValuesCount) {
            // Alles sichtbar, es muss nur die Scrollposition verändert werden
            if (newScrollLeft < 0) {
                newScrollLeft = 0;
            }
            chartDiv.scrollLeft = newScrollLeft;
        }
        else {
            if (newScrollLeft + clientWidth > scrollWidth) {
                var partStartOverflow = 0;
                var scrollDiff = chartDiv.scrollWidth - chartDiv.scrollLeft - chartDiv.clientWidth;
                const dataLength = chartManager.json.data.length;

                var newPartStart = partStart + partCount - (scrollDiff * chartManager.zoomFreq / chartManager.maximumXStepDivider);
                if (Math.abs(sizePercent) != 100) {
                    var percentRest = 100 - Math.abs(sizePercent);
                    var pixelRest = clientWidth / 100 * percentRest;
                    var valuesRest = pixelRest * chartManager.zoomFreq / chartManager.maximumXStepDivider;
                    newPartStart -= valuesRest;
                }
                if (newPartStart + partCount > dataLength) {
                    partStartOverflow = newPartStart + partCount - dataLength;
                    newPartStart = dataLength - partCount;
                }
                if (chartManager.partValuesStart != newPartStart) {
                    chartManager.partValuesStart = newPartStart;
                    chartManager.createAll();
                }
                newScrollLeft = 0;
                if (partStartOverflow > 0) {
                    newScrollLeft = (partStartOverflow / chartManager.zoomFreq * chartManager.maximumXStepDivider);
                }
                chartDiv.scrollLeft = newScrollLeft;
            }
            chartDiv.scrollLeft = newScrollLeft;
        }

        console.log(`[INFO] Scrolling ${sizePercent}%`);
    }

    /// #end gelb
    function testButton(e) {
        const htmlElement = e.srcElement;
        const uiElement = htmlElement.UIElement;
        const uiManager = uiElement.uiManager;

        debugger;
        const reportMarks = chartManager.marksFromReport();

    }
    function fuerRadio(e) {
        console.log('Radio');

    }
    function mitParameter(p) {
        if (p.srcElement.checked) {

            alert("An");
        }
        else {
            alert("Aus");
        }
    }
    function fuerNumber(e) {
        const htmlElement = e.VsrcElement;
        const uiElement = htmlElement.UIElement;
        const uiManager = uiElement.uiManager;
        console.log(uiElement.Value);
    }
}

function loadMarks() {
    loadMarksTest();
}
function loadMarksTest() {
    // TODO Wenn DB Verbindung, die vorhanden Marks aus dem JSON laden
    const svg = chartManager.charts[0].svg;
    const uuid = ""; // Für Implementierung als Component (wenn Datenbankzugriff besteht und Markierungen geladen werden)
    const mark = new Mark(uuid, 10000, "Test", "#ff0000", "TEST", true, svg, MARK_SOURCE_DOC, 10000, 50000);

    chartManager._marks.push(mark);

    const mark2 = new Mark(uuid, 10001, "90%", "#aaaaaa", "Apnoe", true, svg, MARK_SOURCE_ML, 100000, 150000, true);
    chartManager._marks.push(mark2);

    const mark3 = new Mark(uuid, 10001, "Report-Text", "#FF5555", "Report-Text", true, svg, MARK_SOURCE_REPORT, 200000, 300000, true);
    chartManager._marks.push(mark3);
}


class Vertical_Scale {
    constructor({ vscale_alignment, width }) {
        if (vscale_alignment == VSCALE_ALIGNMENTS.Left) {
            this.div = chartManager.addDIV(DIV_TYPES.MenuLeft, { width: width });
            this.alignment = vscale_alignment;
            this.width = width;
        }
        else if (vscale_alignment == VSCALE_ALIGNMENTS.Right) {
            this.div = chartManager.addDIV(DIV_TYPES.MenuRight, { width: width });
            this.alignment = vscale_alignment;
            this.width = width;
        }
        this.svg = null;
    }
    create() {
        while (this.div.childNodes.length > 0) this.div.removeChild(svg.firstChild);
        // V-Skalas werden nicht nach den definierten Charts erstellt
        // Sondern nach den vorhandenen Nodes in scrollbaren DIV
        // Diese könnten H-Skalas sein (nur mit weißer Fläche füllen)
        // Oder ein Diagramm (Skala mit Beschriftung und Linien zeichnen)
        chartManager.div.childNodes.forEach(c => {
            var type = c.getAttribute("type");
            if (type == "hscale") {
                this.drawScale(c.childNodes[0].clientHeight);
            }
            else {
                this.drawChartScale(chartManager.charts.find(ch => ch.titel == type));
            }
        });
    }

    drawChartScale(chart) {
        var div = createDIV();
        var svg = createSVG();
        var height = chart.svg.getAttribute("height");
        svg.setAttribute("style", `height: ${height};background-color: ${DEFAULT_BACKGROUND};width:${this.width};`);
        div.appendChild(svg);
        this.div.appendChild(div);
        var svgWidth = svg.clientWidth;

        var xPos;
        var xDistance;
        var xLines;
        var xLineWidth;
        if (this.alignment == VSCALE_ALIGNMENTS.Left) {
            xPos = 15;
            xDistance = 15;
            xLines = svgWidth - 15;
            xLineWidth = 15;
        }
        else if (this.alignment == VSCALE_ALIGNMENTS.Right) {
            xPos = svgWidth;
            xDistance = -15;
            xLines = 15;
            xLineWidth = -15;
        }

        this.drawVerticalText(chart.chartLines[0].data.sigName, xPos, svg, chart.chartLines[0].color);

        if (chart.chartLines.length > 1) {
            var x = xPos + xDistance;
            for (var idx = 1; idx < chart.chartLines.length; idx++) {
                var line = chart.chartLines[idx];
                var name = line.data.sigName;
                this.drawVerticalText(name, x, svg, line.color, 0.7);
                x += xDistance;
                if (this.alignment == VSCALE_ALIGNMENTS.Left) {
                    if (x > (svgWidth - 20)) {
                        break;
                    }
                }
                else if (this.alignment == VSCALE_ALIGNMENTS.Right) {
                    if (x < 35) {
                        break;
                    }
                }
            };
        }

        // Linien
        var rect = createRect();
        rect.setAttribute('x', xLines);
        rect.setAttribute('y', 0);
        rect.setAttribute('width', VSCALE_LINE_WIDTH);
        rect.setAttribute('height', height);
        rect.setAttribute('opacity', VSCALE_LINE_OPACITY);
        rect.setAttribute("fill", VSCALE_LINE_COLOR);
        svg.appendChild(rect);
        rect = createRect();
        rect.setAttribute('x', xLineWidth < 0 ? xLines + xLineWidth : xLines);
        rect.setAttribute('y', 0);
        rect.setAttribute('width', Math.abs(xLineWidth));
        rect.setAttribute('height', VSCALE_LINE_WIDTH);
        rect.setAttribute('opacity', VSCALE_LINE_OPACITY);
        rect.setAttribute("fill", VSCALE_LINE_COLOR);
        svg.appendChild(rect);
        rect = createRect();
        rect.setAttribute('x', xLineWidth < 0 ? xLines + xLineWidth : xLines);
        rect.setAttribute('y', height - 1);
        rect.setAttribute('width', Math.abs(xLineWidth));
        rect.setAttribute('height', VSCALE_LINE_WIDTH);
        rect.setAttribute('opacity', VSCALE_LINE_OPACITY);
        rect.setAttribute("fill", VSCALE_LINE_COLOR);
        svg.appendChild(rect);

        // ZeroLine
        const zeroLineTotalPoints = chart.chartLines[0].data.valueMax - chart.chartLines[0].data.valueMin; // alle -> 100%
        const zeroLineYPercent = 1 / zeroLineTotalPoints * chart.chartLines[0].data.valueMax; // Max-Wert in x%
        const zeroLineY = (height * zeroLineYPercent) - 1;  // Diagrammhöhe x% = Y Position der Null-Linie

        rect = createRect();
        rect.setAttribute('x', xLineWidth < 0 ? xLines + xLineWidth : xLines);
        rect.setAttribute('y', zeroLineY);
        rect.setAttribute('width', Math.abs(xLineWidth) * 0.8);
        rect.setAttribute('height', VSCALE_LINE_WIDTH);
        rect.setAttribute('opacity', VSCALE_LINE_OPACITY);
        rect.setAttribute("fill", VSCALE_LINE_COLOR);
        svg.appendChild(rect);

    }
    drawScale(height) {
        var div = createDIV();
        var svg = createSVG();
        svg.setAttribute("style", `height: ${height};background-color: ${DEFAULT_BACKGROUND};width:${this.width};`);
        div.appendChild(svg);
        this.div.appendChild(div);
    }
    drawVerticalText(text, x, svg, color, fontsizeFactor) {
        if (!fontsizeFactor) fontsizeFactor = 1;
        var txt = createText();
        var height = svg.clientHeight;
        var y = 0;
        var size = 16 * fontsizeFactor;

        txt.setAttribute('x', x);
        txt.setAttribute('y', y);
        txt.setAttribute('font-size', `${size}px`);
        txt.setAttribute('fill', color);
        txt.setAttribute('style', "font-weight:400");

        txt.innerHTML = text;
        svg.appendChild(txt)
        var textwidth = txt.getBoundingClientRect().width;
        var textheight = txt.getBoundingClientRect().width;
        txt.setAttribute('transform', `rotate(-90,${textwidth / 2},${textheight / 2})`);
        textwidth = txt.getBoundingClientRect().width;
        textheight = txt.getBoundingClientRect().height;
        txt.setAttribute('y', x);
        txt.setAttribute("x", (height * -0.5) + textheight / 2)
        while (txt.getBoundingClientRect().height > (height - 4) * fontsizeFactor) {
            size--;
            txt.setAttribute('font-size', `${size}px`);
        }
        // Evtl. Größenanpassungen (font-size) korrigieren in der Pos. damit es zentriert wird
        var diff = (textheight - txt.getBoundingClientRect().height) / 2; // Halber Unterschied zur vorherigen Höhe
        var old = txt.getAttribute("x");  // Alte Position
        txt.setAttribute("x", Number(old) + Number(diff));


        //            txt.setAttribute('x', x - (txt.getBoundingClientRect().width / 2));
    }

}
class HorizontalScale {
    constructor({ before, after, height, align }) {
        this.before = before;
        this.after = after;
        this.height = height;
        this.rect = null;
        this.div = null;
        this.svg = null;
        this.align = align;
    }

    create() {
        var width = 0;
        if (this.after) {
            width = this.after.svg.getAttribute("width");
        }
        else if (this.before) {
            width = this.before.svg.getAttribute("width");
        }
        if (!this.rect) {
            this.rect = createRect();
            this.rect.setAttribute('x', 0);
            this.rect.setAttribute('y', 0);
            this.rect.setAttribute('width', width);
            this.rect.setAttribute('height', this.height);
            this.rect.setAttribute("fill", HORIZONTAL_SCALE_BACKGROUND);

            this.svg = createSVG();
            this.svg.setAttribute('width', width);
            this.svg.setAttribute('height', this.height);

            this.div = createDIV();
            this.div.setAttribute("type", "hscale");
            this.div.appendChild(this.svg);

            this.svg.appendChild(this.rect);
        }
        else {
            this.svg.setAttribute('width', width);
            this.svg.setAttribute('height', this.height);

            this.rect.setAttribute('x', 0);
            this.rect.setAttribute('y', 0);
            this.rect.setAttribute('width', width);
            this.rect.setAttribute('height', this.height);
            this.rect.setAttribute("fill", HORIZONTAL_SCALE_BACKGROUND);
        }
        if (this.before) {
            chartManager.div.insertBefore(this.div, this.before.div);
        }
        if (this.after) {
            var idx = -1;
            for (var i = 0; i < chartManager.div.children.length; i++) {
                if (chartManager.div.children[i] == this.after.div) {
                    idx = i;
                }
            }
            if (idx < chartManager.div.children.length - 1) {
                chartManager.div.insertBefore(this.div, chartManager.div.children[idx + 1]);
            }
            else {
                chartManager.div.appendChild(this.div);
            }
        }

        this.draw();
    }
    draw() {
        const svg = this.svg;
        const startTimeSeconds = chartManager.horizontalScaleShowsTime ? chartManager.json.header.TimeStampStart / 1000000 : 0;
        // Alle vorhandenen Elemente aus der Skala (SVG) löschen
        while (svg.childNodes.length > 0) svg.removeChild(svg.firstChild);

        // Linie 0 (ganz links) als Start immer voll gezeichnet
        this.line(0, 100, null, "#000000", 1);

        const svgWidth = svg.getAttribute('width');
        const secondsPerPixel = chartManager.calcSecondsFromPixel(1);

        // Alle Skala-Einheiten (1s, 10s, 1m, 5m...) durchlaufen und prüfen, ob für diese die Beschriftung erstellt werden muss
        chartManager.HScaleRanges.forEach(h => {
            h.drawText = (chartManager.calcPixelsForSeconds(h.seconds) >= h.minPixelDistForText);
        });

        // Nun die Schrittweite (Pixel) berechnen:
        // 1. geplante Mindestanstandbreite (x Pixel) nutzen um die Sekunden dafür auszurechnen (z.B. 5 Pixel = 77 Sekunden)
        var secondsPerMinDist = HSCALE_MIN_PIXEL_DISTANCE_X * secondsPerPixel;
        // Ist man unter 1 Sekunde, dann 1 Sekunde als mindest Abstand verwenden
        if (secondsPerMinDist < 1) {
            secondsPerMinDist = 1;
        }
        // 2. passende Skala-Range für diese Sekundenzahl ermitteln (z.B. 77 Sekunden -> Skala Range für 60 Sekunden)
        const stepRange = chartManager.HScaleRanges.find(h => secondsPerMinDist >= h.seconds);
        // 3. Schrittweite für diese Skala-Range (60 Sekunden = z.B. 3.5 Pixel) ermitteln
        const pixelStep = stepRange.seconds / secondsPerPixel * chartManager.maximumXStepDivider;

        // Startwerte initialisieren
        var posX = pixelStep;
        var actualSecond = stepRange.seconds + (chartManager.partValuesStart / chartManager.maxFreq);

        while (posX < svgWidth) {
            var roundedSeconds = Math.round(actualSecond);
            // Skala-Range für die aktuelle Zeit (gerundet) suchen
            // Es wird immer eine Skala-Range genommen, die in der aktuellen Zeit passt 
            // Also Aktuelle Zeit z.B. 8400 Sekunden = 02:20:00 / 1 Stunde hat einen Rest
            //                                                  / 10 Minuten hat keinen Rest, diese wird verwendet
            const range = chartManager.HScaleRanges.find(d => roundedSeconds % d.seconds == 0);
            if (range) {
                // passende Range gefunden -> Linie zeichnen
                const lineHeight = range.height;
                const color = range.color;
                const lineWidth = range.width;
                if (range.drawText) {
                    // falls vorher ermittelt wurde, das diese Range genug Abstand (X-Pixel) hat, dann auch eine Beschriftung hinzufügen
                    const text = secondFormat(actualSecond + startTimeSeconds, "HH:MM:SS");
                    this.line(posX, lineHeight, text, color, lineWidth);
                }
                else {
                    // andernfalls nur die Linie
                    this.line(posX, lineHeight, "", color, lineWidth);
                }

                posX += pixelStep;
                actualSecond += stepRange.seconds;
            }
            else {
                // Wurde keine passende Range gefunden (darf eigentlich nicht vorkommen, da die pixelStep ja vorher ermittelt wurde)
                // dann EINEN Pixel weiter erneut versuchen
                posX++;
                actualSecond += secondsPerPixel;
            }
        }
    }
    line(x, heightPercent, text, color, width) {
        var height = (this.height / 100 * heightPercent); // Halb weil von der Mitte nach oben und nach unten
        var center = this.height / 2;
        var rect = createRect();
        rect.setAttribute('x', x);
        var textYPos = 2;
        var textYFactor = 1;
        if (this.align == HSCALE_ALIGNMENTS.Bottom) {
            rect.setAttribute('y', this.height - height);
        }
        else if (this.align == HSCALE_ALIGNMENTS.Top) {
            rect.setAttribute('y', 0);
            textYPos = this.height + 5;
            textYFactor = -1;
        }
        else if (this.align == HSCALE_ALIGNMENTS.Center) {
            rect.setAttribute('y', (this.height / 2) - (height / 2));
            textYPos = this.height / 2;
            textYFactor = 0.5;
        }
        else {
            throw new Error(`[ERROR] Unknown alignment for HScale: ${align}`);
        }
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute("fill", color);
        this.svg.appendChild(rect);
        if (text && text != "") {
            var txt = createText();
            txt.setAttribute('x', x);
            txt.setAttribute('y', textYPos);
            txt.setAttribute('dest', "title");
            txt.setAttribute('font-size', HORIZONTAL_SCALE_CAPTION_FONTSIZE);

            txt.innerHTML = text;
            txt.setAttribute('fill', HSCALE_TEXT_COLOR);
            this.svg.appendChild(txt);
            txt.setAttribute('x', x - (txt.getBoundingClientRect().width / 2));
            txt.setAttribute('y', textYPos + ((txt.getBoundingClientRect().height / 2) * textYFactor));
        }
    }
}


class UIElement {
    constructor(data, uiManager) {
        this.data = data;
        this.uiManager = uiManager;
        this.htmlElement = null;
        this.labelElement = null;
        this.imgElement = null;
        this.svgElement = null;
    }
    get Visible() { return this.data.visible; }
    set Visible(visibility) {
        this.htmlElement.style.setProperty("display", visibility ? "" : "none");
        this.data.visible = visibility;
    }
    get Enable() { return this.data.eneble; }
    set Enable(enable) {
        this.htmlElement.disabled = !enable;
        this.data.enable = enable;
    }
    get Position() { return this.data.position; }
    set Position(position) {
        // TODO Position des Elementds ändern mittels uiManager.create()
        this.data.position = position;
        this.uiManager.create();
    }
    get Value() {
        switch (this.data.type) {
            case ELEMENTTYPES.Checkbox:
                return this.htmlElement.checked;
            case ELEMENTTYPES.Number:
                return this.htmlElement.value;
            case ELEMENTTYPES.Radio:
                return this.htmlElement.checked;
            case ELEMENTTYPES.Range:
                return this.htmlElement.value;
            case ELEMENTTYPES.Text:
                return this.htmlElement.value;
            case ELEMENTTYPES.Time:
                return this.htmlElement.value;
            case ELEMENTTYPES.Select:
                return this.htmlElement.value;
        }
    }
    set Value(value) {
        switch (this.data.type) {
            case ELEMENTTYPES.Checkbox:
                this.htmlElement.checked = value;
                break;
            case ELEMENTTYPES.Number:
                this.htmlElement.value = value;
                break;
            case ELEMENTTYPES.Radio:
                this.htmlElement.checked = value;
                break;
            case ELEMENTTYPES.Range:
                this.htmlElement.value = value;
                break;
            case ELEMENTTYPES.Text:
                this.htmlElement.value = value;
                break;
            case ELEMENTTYPES.Time:
                this.htmlElement.value = value;
                break;
            case ELEMENTTYPES.Select:
                this.htmlElement.value = value;
                break;
        }
    }
}

class UIManager {
    constructor({ div, height, width, elementsData }) {
        this.byside = false;
        if (div == UI_TYPES.MenuTop) {
            this.uiType = UI_TYPES.MenuTop;
            div = chartManager.addDIV(DIV_TYPES.MenuTop, { height: height });
            div.style.setProperty("margin-bottom", MENU_MARGIN_BOTTOM);
        }
        else if (div == UI_TYPES.MenuBottom) {
            this.uiType = UI_TYPES.MenuBottom;
            div = chartManager.addDIV(DIV_TYPES.MenuBottom, { height: height });
        }
        else if (div == UI_TYPES.MenuLeft) {
            this.uiType = UI_TYPES.MenuLeft;
            this.byside = true;
            div = chartManager.addDIV(DIV_TYPES.MenuLeft, { width: width });
        }
        else if (div == UI_TYPES.MenuRight) {
            this.uiType = UI_TYPES.MenuRight;
            this.byside = true;
            div = chartManager.addDIV(DIV_TYPES.MenuRight, { width: width });
        }
        this.div = div;
        this.height = height;
        this.uiElements = [];
        this.div.setAttribute("type", "__UIELEMENT");
        elementsData.forEach(e => {
            var uielement = new UIElement(e, this);
            this.uiElements.push(uielement);
        });
    }

    getUIElementFromName(name) {
        return this.uiElements.find(e => e.data.name == name);
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
        //this.div.setAttribute("height", this.height);

        this.draw();
    }
    draw() {
        while (this.div.childNodes.length > 0) this.div.removeChild(this.div.firstChild);
        this.uiElements.sort((a, b) => a.data.position - b.data.position);
        this.uiElements.forEach(e => {
            if (e.data.visible) {
                var element = null;
                var labelElement = null;
                var imgElement = null;
                var svgElement = null;
                var data = e.data;

                switch (data.type) {
                    case ELEMENTTYPES.Button:
                        element = createButton();
                        element.innerHTML = data.label;
                        this.div.appendChild(element);
                        element.onclick = data.function;
                        break;
                    case ELEMENTTYPES.ImageButton:
                        element = createButton();
                        imgElement = createElement("img");
                        imgElement.setAttribute("src", data.src);
                        if (data.width) imgElement.setAttribute("width", data.width);
                        if (data.height) imgElement.setAttribute("height", data.height);
                        element.appendChild(imgElement);
                        this.div.appendChild(element);
                        element.onclick = data.function;
                        break;
                    case ELEMENTTYPES.SVGButton:
                        element = createButton();
                        svgElement = createSVG();
                        svgElement.innerHTML = data.xml;
                        if (data.width) svgElement.setAttribute("width", data.width);
                        if (data.height) svgElement.setAttribute("height", data.height);
                        element.appendChild(svgElement);
                        this.div.appendChild(element);
                        element.onclick = data.function;
                        break;
                    case ELEMENTTYPES.Spacer:
                        element = createElement("canvas");
                        element.setAttribute("width", data.width);
                        element.setAttribute("height", 1);
                        this.div.appendChild(element);
                        break;
                    case ELEMENTTYPES.Checkbox:
                        element = createInput("checkbox");
                        if (data.value) {
                            element.setAttribute("checked", "");
                        }
                        element.onclick = data.function;
                        if (data.label) {
                            labelElement = createElement("label");
                            labelElement.setAttribute("for", data.id);
                            labelElement.innerHTML = data.label;
                            if (data.labelClass) {
                                labelElement.setAttribute("class", data.labelClass);
                            }
                            if (data.labelStyle) {
                                labelElement.setAttribute("style", data.labelStyle);
                            }
                            if (data.labelPos != LABEL_POSITIONS.Right) {
                                this.div.appendChild(labelElement);
                            }
                        }
                        this.div.appendChild(element);
                        if (data.labelPos == LABEL_POSITIONS.Right) {
                            this.div.appendChild(labelElement);
                        }
                        break;
                    case ELEMENTTYPES.Number:
                        element = createInput("number");
                        if (data.value) {
                            element.setAttribute("value", data.value);
                        }
                        if (data.min) element.setAttribute("min", data.min);
                        if (data.max) element.setAttribute("max", data.max);
                        element.onclick = data.function;
                        element.onchange = data.function;

                        if (data.label) {
                            labelElement = createElement("label");
                            labelElement.setAttribute("for", data.id);
                            labelElement.innerHTML = data.label;
                            this.div.appendChild(labelElement);
                            if (data.labelClass) {
                                labelElement.setAttribute("class", data.labelClass);
                            }
                            if (data.labelStyle) {
                                labelElement.setAttribute("style", data.labelStyle);
                            }
                        }
                        this.div.appendChild(element);
                        break;
                    case ELEMENTTYPES.Radio:
                        element = createInput("radio");
                        if (data.value) {
                            element.setAttribute("value", data.value);
                        }
                        element.onclick = data.function;
                        element.onchange = data.function;

                        if (data.label) {
                            labelElement = createElement("label");
                            labelElement.setAttribute("for", data.id);
                            labelElement.innerHTML = data.label;
                            if (data.labelClass) {
                                labelElement.setAttribute("class", data.labelClass);
                            }
                            if (data.labelStyle) {
                                labelElement.setAttribute("style", data.labelStyle);
                            }
                            if (data.labelPos != LABEL_POSITIONS.Right) {
                                this.div.appendChild(labelElement);
                            }
                        }
                        if (data.checked) {
                            element.setAttribute("checked", "");
                        }
                        this.div.appendChild(element);
                        if (data.labelPos == LABEL_POSITIONS.Right) {
                            this.div.appendChild(labelElement);
                        }
                        break;
                    case ELEMENTTYPES.Label:
                        element = createElement("label");
                        element.innerHTML = data.text;
                        this.div.appendChild(element);
                        break;
                    case ELEMENTTYPES.Range:
                        element = createInput("range");
                        if (data.value) {
                            element.setAttribute("value", data.value);
                        }
                        if (data.min) element.setAttribute("min", data.min);
                        if (data.max) element.setAttribute("max", data.max);
                        element.onclick = data.function;
                        element.onchange = data.function;

                        if (data.label) {
                            labelElement = createElement("label");
                            labelElement.setAttribute("for", data.id);
                            labelElement.innerHTML = data.label;
                            this.div.appendChild(labelElement);
                            if (data.labelClass) {
                                labelElement.setAttribute("class", data.labelClass);
                            }
                            if (data.labelStyle) {
                                labelElement.setAttribute("style", data.labelStyle);
                            }
                        }
                        this.div.appendChild(element);
                        break;
                    case ELEMENTTYPES.Text:
                        element = createInput("text");
                        if (data.value) {
                            element.setAttribute("value", data.value);
                        }
                        element.onchange = data.function;

                        if (data.label) {
                            labelElement = createElement("label");
                            labelElement.setAttribute("for", data.id);
                            labelElement.innerHTML = data.label;
                            this.div.appendChild(labelElement);
                            if (data.labelClass) {
                                labelElement.setAttribute("class", data.labelClass);
                            }
                            if (data.labelStyle) {
                                labelElement.setAttribute("style", data.labelStyle);
                            }
                        }
                        this.div.appendChild(element);
                        break;
                    case ELEMENTTYPES.Time:
                        element = createInput("time");
                        if (data.value) {
                            element.setAttribute("value", data.value);
                        }
                        element.onchange = data.function;

                        if (data.label) {
                            labelElement = createElement("label");
                            labelElement.setAttribute("for", data.id);
                            labelElement.innerHTML = data.label;
                            this.div.appendChild(labelElement);
                            if (data.labelClass) {
                                labelElement.setAttribute("class", data.labelClass);
                            }
                            if (data.labelStyle) {
                                labelElement.setAttribute("style", data.labelStyle);
                            }
                        }
                        this.div.appendChild(element);
                        break;
                    case ELEMENTTYPES.Select:
                        element = createElement("select");
                        element.onchange = data.function;
                        if (data.label) {
                            labelElement = createElement("label");
                            labelElement.setAttribute("for", data.id);
                            labelElement.innerHTML = data.label;
                            this.div.appendChild(labelElement);
                            if (data.labelClass) {
                                labelElement.setAttribute("class", data.labelClass);
                            }
                            if (data.labelStyle) {
                                labelElement.setAttribute("style", data.labelStyle);
                            }
                        }
                        data.options.forEach(o => {
                            var optionElement = createElement("option");
                            optionElement.value = o.value;
                            optionElement.innerHTML = o.text;
                            if (o.id) {
                                optionElement.id = o.id;
                            }
                            element.appendChild(optionElement);
                        });
                        if (data.value) {
                            element.setAttribute("value", data.value);
                            element.value = data.value;
                        }
                        this.div.appendChild(element);

                        break;
                }
            }

            if (data.class) element.setAttribute("class", data.class);
            if (data.style) element.setAttribute("style", data.style);
            if (data.id) {
                element.setAttribute("id", data.id);
                if (data.group) {
                    element.setAttribute("name", data.group);
                }
                else {
                    element.setAttribute("name", data.id);
                }
            }
            else {
                if (data.group) {
                    element.setAttribute("name", data.group);
                }
            }
            if (data.newLine) {
                var br = createElement("span");
                var margin = "0em";
                if (data.newLineMargin) {
                    margin = data.newLineMargin;
                }
                br.setAttribute("style", `display:block;margin-bottom:${margin};margin-left:0;margin-right:0;margin-top:0;`);
                this.div.appendChild(br);
            }


            // Elemente des UIElement (e) zuweisen
            element.UIElement = e;
            e.htmlElement = element;
            e.labelElement = labelElement;
            e.imgElement = imgElement;
            e.svgElement = svgElement;
        });
    }
}


//start();
// wird nun im HTML (body onload...) ausgeführt und muss in einer UI5 App in AfterRendering

