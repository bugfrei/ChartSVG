const DEFAULT_ZOOM_FREQ = 1 * 64;
const DIAGRAM_HEIGHT = 150;
const SELECTION_COLOR = "#0000FF";
const SELECTION_OPACITY = 0.5;
const SELECTION_TITELCOLOR = "#FF0000";
const SELECTION_TITLEOPACITY = 0.3;
const SELECTION_ZOOMCOLOR = "#FFFFFF";
const SELECTION_ZOOMOPACITY = 0.8;
const SELECTION_NOTECOLOR = "#FFFFFF";
const SELECTION_NOTEOPACITY = 0.8;
const SELECTION_MIN_VALUES = 100; // Wenn eine Markierung sehr klein ist, wird dieser Wert als min. größe einer Markierung verwendet (ANZAHL DATENWERTE)
const SELECTION_MIN_PIXEL = 20; // Wenn eine Markierung sehr klein ist, wird dieser Wert als min. größe einer Markierung verwendet (ANZAHL PIXEL)
const SELECTION_DIALOG_BACKGROUNDCOLOR = "#DDDDDD";
const SELECTION_DIALOG_WIDTH = "300"; // px
const SELECTION_DIALOG_HEIGHT = "300"; // px
const SELECTION_DIALOG_BORDERCOLOR = "black";
const SELECTION_DIALOG_BORDERWIDTH = "2"; // px
const MARK_DRAGBOX_COLOR = "#000000";
const MARK_DRAGBOX_OPACITY = 0.2;
const MARK_DRAGBOX_WIDTH = 20;
const MARK_SOURCE_DOC = "A";
const MARK_SOURCE_ML = "M";
const MARK_OPACITY = 0.5;
const HORIZONTAL_SCALE_HEIGHT = 60;
//const HORIZONTAL_SCALE_BACKGROUND = "#FF0000"; // eigentlich #AAAAAA
const HORIZONTAL_SCALE_BACKGROUND = "#dddddd"; // eigentlich #333333
const HSCALE_TEXT_COLOR = "#000000";


var chartManager;

class ChartManager {
    // Default-Values

    constructor(json, dataManager) {
        this.json = json;
        this.dataManager = dataManager;
        this._zoom_freq = DEFAULT_ZOOM_FREQ;
        this.charts = [];
        this._maxFreq = 0;
        this._dialogNr = 0;         // Fortlaufende Nummer zur identifikation neuer Dialoge
        this._dialogs = [];         // Auflistung der Dialoge
        this._marks = [];           // Auflistung der Markierungen (egal ob Arzt oder ML)
        this._horizontalScale = []; // Auflistung der horizontalen Skalas (in der Regel nur eine für oben)
        this.HScaleRanges = [       // die Bereiche, die in der Horizontalen Skala dargestellt werden können
            {
                seconds: 3600,      // Stundenabstände
                text: 1,             // jede Markierung mit Beschriftung
                height: 90,
                color: "#000000",
                width: 1
            },
            {
                seconds: 600,       // 10 Minuten
                text: 3,            // jede dritte Markierung mit Beschriftung
                height: 70,
                color: "#000000",
                width: 1
            },
            {
                seconds: 300,       // 5 Minuten
                text: 0,            // keine Beschriftung
                height: 50,
                color: "#000000",
                width: 0.8
            },
            {
                seconds: 60,        // 1 Minute
                text: 0,            // keine Beschriftung
                height: 30,
                color: "#000000",
                width: 0.6
            },
            {
                seconds: 10,        // 10 Sekunden
                text: 0,
                height: 20,
                color: "#000000",
                width: 0.4
            },
            {
                seconds: 1,         // 1 Sekunde
                text: 0,
                height: 10,
                color: "#000000",
                width: 0.2
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

                    this.selectionRect.setAttribute('x', x1);
                    this.selectionRect.setAttribute('width', x2 - x1);
                    // Titel
                    let anchor = createAnchor();
                    anchor.setAttribute('href', 'javascript:alert("huhu");');
                    anchor.setAttribute('x', x1 + 10);
                    anchor.setAttribute('y', 10);
                    anchor.setAttribute('width', x2 - x1 - 20);
                    anchor.setAttribute('height', 20);
                    anchor.setAttribute('dest', "title");
                    this.clickChart.svg.appendChild(anchor);

                    let title = createRect();
                    title.setAttribute('x', x1 + 10);
                    title.setAttribute('y', 10);
                    title.setAttribute('width', x2 - x1 - 20);
                    title.setAttribute('height', 20);
                    title.setAttribute('fill', SELECTION_TITELCOLOR);
                    title.setAttribute('fill-opacity', SELECTION_TITLEOPACITY);
                    title.setAttribute('dest', "title");

                    let text = createText();
                    text.setAttribute('x', x1 + 20);
                    text.setAttribute('y', 25);
                    text.setAttribute('dest', "title");
                    this.clickChart.svg.appendChild(anchor);
                    const time = dateFormat(chartManager.Time(x1), "HH:MM:SS");
                    const seconds = chartManager.Seconds(x2 - x1);

                    text.innerHTML = time + ` (${seconds} s)`; // TODO i18n Zeitformat!
                    text.setAttribute('fill', 'black');

                    //this.clickChart.svg.appendChild(title);
                    anchor.appendChild(title);
                    anchor.appendChild(text);
                    this.selectionElements.push(anchor);

                    // Zoom
                    anchor = createAnchor();
                    anchor.setAttribute('href', 'javascript:doZoom();');
                    anchor.setAttribute('x', x1 + 10);
                    anchor.setAttribute('y', DIAGRAM_HEIGHT - 80);
                    anchor.setAttribute('width', x2 - x1 - 20);
                    anchor.setAttribute('height', 20);
                    anchor.setAttribute('dest', "title");
                    this.clickChart.svg.appendChild(anchor);

                    title = createRect();
                    title.setAttribute('x', x1 + 10);
                    title.setAttribute('y', DIAGRAM_HEIGHT - 80);
                    title.setAttribute('width', x2 - x1 - 20);
                    title.setAttribute('height', 20);
                    title.setAttribute('fill', SELECTION_ZOOMCOLOR);
                    title.setAttribute('fill-opacity', SELECTION_ZOOMOPACITY);
                    title.setAttribute('dest', "title");

                    text = createText();
                    text.setAttribute('x', x1 + 20);
                    text.setAttribute('y', DIAGRAM_HEIGHT - 65);
                    text.setAttribute('dest', "title");
                    this.clickChart.svg.appendChild(anchor);

                    text.innerHTML = `Zoom`;  // TODO i18n
                    text.setAttribute('fill', 'black');

                    //this.clickChart.svg.appendChild(title);
                    anchor.appendChild(title);
                    anchor.appendChild(text);
                    this.selectionElements.push(anchor);
                    text.setAttribute('x', x1 + 10 + (x2 - x1 - 20) / 2 - (text.getBoundingClientRect().width / 2));

                    // Note
                    var yPos = this.mouseData.clientY;
                    var xPos = this.mouseData.clientX;
                    //var yPos = this.clickChart.svg.parentElement.offsetTop + this.clickChart.svg.parentElement.parentElement.parentElement.offsetTop + DIAGRAM_HEIGHT;
                    anchor = createAnchor();
                    anchor.setAttribute('href', `javascript:doNote(${xPos}, ${yPos});`);
                    anchor.setAttribute('x', x1 + 10);
                    anchor.setAttribute('y', DIAGRAM_HEIGHT - 50);
                    anchor.setAttribute('width', x2 - x1 - 20);
                    anchor.setAttribute('height', 20);
                    anchor.setAttribute('dest', "title");
                    this.clickChart.svg.appendChild(anchor);

                    title = createRect();
                    title.setAttribute('x', x1 + 10);
                    title.setAttribute('y', DIAGRAM_HEIGHT - 50);
                    title.setAttribute('width', x2 - x1 - 20);
                    title.setAttribute('height', 20);
                    title.setAttribute('fill', SELECTION_NOTECOLOR);
                    title.setAttribute('fill-opacity', SELECTION_NOTEOPACITY);
                    title.setAttribute('dest', "title");

                    text = createText();
                    text.setAttribute('x', x1 + 20);
                    text.setAttribute('y', DIAGRAM_HEIGHT - 35);
                    text.setAttribute('dest', "title");
                    this.clickChart.svg.appendChild(anchor);

                    text.innerHTML = `Markierung`; // TODO i18n
                    text.setAttribute('fill', 'black');

                    //this.clickChart.svg.appendChild(title);
                    anchor.appendChild(title);
                    anchor.appendChild(text);
                    this.selectionElements.push(anchor);
                    text.setAttribute('x', x1 + 10 + (x2 - x1 - 20) / 2 - (text.getBoundingClientRect().width / 2));
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
        ]
        const mainDIV = document.getElementById('chart');
        window.onkeydown = keyDown;
        var wrapperDIV = createDIV();
        wrapperDIV.setAttribute('class', 'chartWrapper');
        mainDIV.appendChild(wrapperDIV);

        var areawrapperDIV = createDIV();
        areawrapperDIV.setAttribute('class', 'chartAreaWrapper');
        wrapperDIV.appendChild(areawrapperDIV);
        this.div = areawrapperDIV;
    }

    addHorizontalScale({ before, after, height }) {
        var hs = new HorizontalScale({ before, after, height });
        this._horizontalScale.push(hs);
        return hs;
    }

    createHorizontalScales() {
        this._horizontalScale.forEach(h => { h.create(); });
    }


    calcRowNumberFromSelectionPosition(pixelPosition) {
        return pixelPosition * this.zoomFreq;
    }
    calcPixelFromRowNumber(rowNumber) {
        return rowNumber / this.zoomFreq;
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

    nextDialogNr() {
        this._dialogNr++;
        return this._dialogNr;
    }

    newDialog(x, y, x1, x2, svg) {
        var dialog = new SelectionDialog(x, y, x1, x2, svg);
        dialog.create(x, y);
        this._dialogs.push(dialog);
        return dialog;
    }

    openDialog(x, y, x1, x2, svg, mark) {
        var dialog;
        dialog = chartManager._dialogs.find(d => d.mark == mark);
        if (!dialog) {
            dialog = new SelectionDialog(x, y, x1, x2, svg);
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
        this.createAll();
    }

    Seconds(offsetX) {
        return offsetX * this.zoomFreq / this.maxFreq;
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

    addChart() {
        var newDiv = createDIV();
        this.div.appendChild(newDiv);
        var newSVG = createSVG();
        newSVG.onmousemove = mouseMove;
        newSVG.onclick = mouseClick;
        newSVG.onmousedown = mouseDown;
        newSVG.onmouseup = mouseUp;
        newSVG.setAttribute('width', '50000');
        newSVG.setAttribute('height', DIAGRAM_HEIGHT.toString());
        newDiv.appendChild(newSVG);

        var newChart = new Chart(this, newDiv, newSVG, this.json);
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
            console.log(newX + " (" + (newX - chartManager._resizeData.offsetX) + ")");
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
        this.charts.forEach(c => c.drawLines());
        this._marks.forEach(m => { m.needUpdate = true; m.create(); })
        this.createHorizontalScales();
    }
}

function doZoom() {
    // Calculate new Zoom
    const selectionPixel = chartManager.clickStatus.width;
    const zoomXValuesFor1Pixel = chartManager.zoomFreq;
    const selectionValues = selectionPixel * zoomXValuesFor1Pixel;

    const clientWidth = chartManager.div.getBoundingClientRect().width;
    const newZoom = selectionValues / clientWidth;

    // Calculate new Position (scroll)
    const newPos = chartManager.clickStatus.left * zoomXValuesFor1Pixel / newZoom;

    chartManager.zoomFreq = newZoom;
    chartManager.div.scroll(newPos, 0);
    OUT(newZoom);
}
function doNote(x, y) {
    var svg = chartManager.clickStatus.clickChart.svg;
    var newDialog = chartManager.newDialog(x, y, chartManager.clickStatus.click1OffsetX, chartManager.clickStatus.click2OffsetX, svg);
}

function OUT(t) {
    document.getElementById("OUT").innerHTML = t;
}

function mouseMove(e) {
    chartManager.mouseMove(e);
}
function keyDown(obj, e) {
    chartManager.clickStatus.removeSelectionRect();
    chartManager.clickStatus.clickNumber = 0;
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
function createPath() {
    return document.createElementNS('http://www.w3.org/2000/svg', 'path');
}
function createButton() {
    return document.createElement('button');
}
function dateFormat(date, format) {
    /* Formats:
        dd      Day     like 05
        d       Day     like 5
        mm      Month   like 09
        m       Month   like 9
        yy      Year    like 22
        yyyy    Year    like 2022
        hh      Hour    like 07
        h       Hour    like 7
        HH      Hour    like 19
        MM      Minute  like 07
        M       Minute  like 7
        SS      Second  like 07
        S       Second  like 7
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

    return res;
}
class Chart {
    constructor(manager, div, svg, json) {
        this.chartManager = manager;
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

        // xStep: Schrittweite für 1 Messwert. Ist der Zoom >= 1 (d.h. exakt 1 oder mehr Datenwerte liefern 1 Pixel im Diagramm)
        //        dann ist xStep immer 1 (X Werte = 1 Pixel).
        //        Ist der Zoom < 1, dann entspricht immer 1 Wert mehr als 1 Pixel.
        //        Bei z.B. Zoom = 0.5, sind 0.5 Datenpunkte = 1 Pixel, 1 Datenpunkt = 2 Pixel (1 / 0.5 = 2)
        const xStep = chartManager.zoomFreq >= 1 ? 1 : 1 / chartManager.zoomFreq;

        var maxWidth = 0;
        // Dann neu zeichnen
        this.chartLines.forEach(line => {
            const range = line.data.valueMax - line.data.valueMin;   // 65535
            const yRange = DIAGRAM_HEIGHT / range;         // 1 Messwert = yRange Pixel
            const yOffset = line.data.valueMin * yRange * -1;   // Addierung damit min. Value = 0 ist und nicht -75
            if (line.data.usePath) {
                console.log('[INFO] Use Path');

                this.chartLines.forEach(line => {
                    var path = createPath();
                    var x = 1;
                    var pth = `M1,${DIAGRAM_HEIGHT}`;
                    if (Array.isArray(line.data)) {
                        line.data.forEach(y => { pth += `C${x++} ${y} ` })
                    }
                    else if (typeof line.data === 'string') {
                        pth = line.data;
                    }
                    else {
                        const arr = line.data.dataFunction(line.data, this.chartManager.zoomFreq, this.chartManager.maxFreq);
                        // (e => Math.round(e * yRange + yOffset));
                        for (var p of arr) {
                            x += xStep;
                            if (p != undefined && p != NaN) {
                                pth += `L${x},${(DIAGRAM_HEIGHT - (p * yRange + yOffset))}`;
                            }
                        }
                    }
                    path.setAttribute('d', pth.trim());
                    path.setAttribute('stroke', `#${line.color}`);
                    path.setAttribute('stroke-width', 0.5);
                    path.setAttribute('fill', 'none');

                    if (x > maxWidth) { maxWidth = x; }
                    this.svg.appendChild(path);
                })
            }
            else {
                console.log('[INFO] Use Polyline');
                this.chartLines.forEach(line => {
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
                        var arr = line.data.dataFunction(line.data, this.chartManager.zoomFreq, this.chartManager.maxFreq);
                        arr.forEach(y => { pts += `${x += xStep},${DIAGRAM_HEIGHT - (y * yRange + yOffset)} ` })
                    }
                    polyLine.setAttribute('points', pts.trim());
                    polyLine.setAttribute('stroke', `#${line.color}`);
                    polyLine.setAttribute('stroke-width', 0.5);
                    polyLine.setAttribute('fill', 'none');

                    if (polyLine.points.length > maxWidth) { maxWidth = polyLine.points.length; }
                    this.svg.appendChild(polyLine);
                })
            }

            this.svg.setAttribute('width', maxWidth.toString());
            console.log(`[INFO] drawLines maxWidth (=svg.width): ${maxWidth}`);
        });
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

const dataManager =
{
    json: null,
    dataInformation: [
        ["Breathing", {
            "dataFunction": function recalc(dataInformation, factor, maxFreq) {
                if (factor == 0 || dataInformation.freq == 0) {
                    // Alles übergeben wenn kein Faktor oder Frequenz vorhanden
                    return dataInformation.data;
                }
                // Interpolierung zur y-Größe der Diagramme erfolgt beim zeichnen
                var newData = dataManager.simpleAvg(dataInformation.data, factor, maxFreq);
                return newData;
            },
            "valueMin": -1000,
            "valueMax": 1000,
            "usePath": false,
            "zeroLine": true
        }],
        ["MovementX", {
            "dataFunction": function recalc(dataInformation, factor, maxFreq) {
                if (factor == 0 || dataInformation.freq == 0) {
                    // Alles übergeben wenn kein Faktor oder Frequenz vorhanden
                    return dataInformation.data;
                }
                // Interpolierung zur y-Größe der Diagramme erfolgt beim zeichnen
                var newData = dataManager.simpleAvg(dataInformation.data, factor, maxFreq);
                return newData;
            },
            "valueMin": -1000,
            "valueMax": 1000,
            "usePath": true,
            "zeroLine": true
        }],
        ["MovementY", {
            "dataFunction": function recalc(dataInformation, factor, maxFreq) {
                var x = 0;
                if (factor == 0 || dataInformation.freq == 0) {
                    // Alles übergeben wenn kein Faktor oder Frequenz vorhanden
                    return dataInformation.data;
                }
                // Interpolierung zur y-Größe der Diagramme erfolgt beim zeichnen
                var newData = dataManager.simpleAvg(dataInformation.data, factor, maxFreq);
                return newData;
            },
            "valueMin": -1000,
            "valueMax": 1000,
            "usePath": true,
            "zeroLine": true
        }],
        ["MovementZ", {
            "dataFunction": function recalc(dataInformation, factor, maxFreq) {
                var x = 0;
                if (factor == 0 || dataInformation.freq == 0) {
                    // Alles übergeben wenn kein Faktor oder Frequenz vorhanden
                    return dataInformation.data;
                }
                // Interpolierung zur y-Größe der Diagramme erfolgt beim zeichnen
                var newData = dataManager.simpleAvg(dataInformation.data, factor, maxFreq);
                return newData;
            },
            "valueMin": -1000,
            "valueMax": 1000,
            "usePath": true,
            "zeroLine": true
        }],
        ["OxSaturation", {
            "dataFunction": function recalc(dataInformation, factor, maxFreq) {
                var x = 0;
                if (factor == 0 || dataInformation.freq == 0) {
                    // Alles übergeben wenn kein Faktor oder Frequenz vorhanden
                    return dataInformation.data;
                }
                // Interpolierung zur y-Größe der Diagramme erfolgt beim zeichnen
                var newData = dataManager.simpleAvg(dataInformation.data, factor, maxFreq);
                return newData;
            },
            "valueMin": 0,
            "valueMax": 5,
            "usePath": true,
            "zeroLine": false
        }],
        ["Pulse", {
            "dataFunction": function recalc(dataInformation, factor, maxFreq) {
                var x = 0;
                if (factor == 0 || dataInformation.freq == 0) {
                    // Alles übergeben wenn kein Faktor oder Frequenz vorhanden
                    return dataInformation.data;
                }
                // Interpolierung zur y-Größe der Diagramme erfolgt beim zeichnen
                var newData = dataManager.simpleAvg(dataInformation.data, factor, maxFreq);
                return newData;
            },
            "valueMin": 0,
            "valueMax": 10,
            "usePath": false,
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
            "data": data
        };
    },
    freqFromSignalName(sigName) {
        const re = /\d/;
        const sigNr = re.exec(Object.entries(this.json.header).filter(e => e[1] == sigName)[0][0])[0];
        return Object.entries(dataManager.json.header).find(f => f[0] == `Freq${sigNr}`)[1];
    }
}

class SelectionDialog {
    constructor(x, y, x1, x2, svg) {
        this._nr = chartManager.nextDialogNr();
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
        return this.input_color.value;
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

        this.div = createDIV();
        var left = x;
        var top = y;

        // Prüfen ob es in das Fenster passt
        if (Number(SELECTION_DIALOG_WIDTH) + left + 20 > window.innerWidth) {
            left = window.innerWidth - SELECTION_DIALOG_WIDTH - 40;
        }
        if (Number(SELECTION_DIALOG_HEIGHT) + top + 20 > window.innerHeight) {
            top = window.innerHeight - SELECTION_DIALOG_HEIGHT - 50;
        }

        var time1 = dateFormat(chartManager.Time(this.selectionStart), "HH:MM:SS");
        var time2 = dateFormat(chartManager.Time(this.selectionEnd), "HH:MM:SS");
        var timeRange = `${time1} - ${time2}`; // TODO i18n

        var sec = chartManager.Seconds(this.selectionEnd - this.selectionStart);
        var secDate = new Date(2022, 1, 1, 0, 0, sec);


        var timeDiff = dateFormat(secDate, "HH:MM:SS");             // TODO i18n

        // DIV (Rahmen)
        this.div.setAttribute("style", `position:absolute;left:${left}px;top:${top}px;border-width:${SELECTION_DIALOG_BORDERWIDTH}px;border-color:${SELECTION_DIALOG_BORDERCOLOR};border-style: solid;background: ${SELECTION_DIALOG_BACKGROUNDCOLOR}; width: ${SELECTION_DIALOG_WIDTH}px; height: ${SELECTION_DIALOG_HEIGHT}px;`);
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
        this.div.appendChild(this.textarea_note);

        // Typ
        span = createElement("span");
        span.setAttribute("style", "margin-left:5px;");
        span.innerHTML = "Typ:"; // TODO i18n
        this.div.appendChild(span);

        this.select_typ = createElement("select");
        this.select_typ.setAttribute("id", "typ");
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

        // ------------------------------ 
        hr = createElement("hr");
        this.div.appendChild(hr);

        // Erstellen-Button
        var input = createElement("input");
        input.setAttribute("type", "button");
        input.setAttribute("id", "create");
        input.setAttribute("style", `margin-left:5px;`);
        input.setAttribute("onclick", `createMark(${this.Nr});`);
        input.value = "Erstellen"; // TODO i18n
        this.div.appendChild(input);

        // Abbruch-Button
        input = createElement("input");
        input.setAttribute("type", "button");
        input.setAttribute("id", "cancel");
        input.setAttribute("style", `float:right;margin-right:5px;`);
        input.setAttribute("onclick", `cancelMark(${this.Nr});`);
        input.value = "Abbruch"; // TODO i18n
        this.div.appendChild(input);

        const sel = this.select_typ;
        this.input_color.value = sel.options[sel.selectedIndex].getAttribute("color");
    }
    open(x, y, mark) {
        const parentDIV = chartManager.div;

        this.div = createDIV();
        this.mark = mark;
        var left = x;
        var top = y;

        // Prüfen ob es in das Fenster passt
        if (Number(SELECTION_DIALOG_WIDTH) + left + 20 > window.innerWidth) {
            left = window.innerWidth - SELECTION_DIALOG_WIDTH - 40;
        }
        if (Number(SELECTION_DIALOG_HEIGHT) + top + 20 > window.innerHeight) {
            top = window.innerHeight - SELECTION_DIALOG_HEIGHT - 50;
        }

        var time1 = dateFormat(chartManager.Time(this.selectionStart), "HH:MM:SS");
        var time2 = dateFormat(chartManager.Time(this.selectionEnd), "HH:MM:SS");
        var timeRange = `${time1} - ${time2}`; // TODO i18n

        var sec = chartManager.Seconds(this.selectionEnd - this.selectionStart);
        var secDate = new Date(2022, 1, 1, 0, 0, sec);


        var timeDiff = dateFormat(secDate, "HH:MM:SS");             // TODO i18n

        // DIV (Rahmen)
        this.div.setAttribute("style", `position:absolute;left:${left}px;top:${top}px;border-width:${SELECTION_DIALOG_BORDERWIDTH}px;border-color:${SELECTION_DIALOG_BORDERCOLOR};border-style: solid;background: ${SELECTION_DIALOG_BACKGROUNDCOLOR}; width: ${SELECTION_DIALOG_WIDTH}px; height: ${SELECTION_DIALOG_HEIGHT}px;`);
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
        input.setAttribute("onclick", `changeMark(${this.Nr});`);
        input.value = "Ändern"; // TODO i18n
        this.div.appendChild(input);

        // Resize-Button
        input = createElement("input");
        input.setAttribute("type", "button");
        input.setAttribute("id", "cancel");
        input.setAttribute("style", `position: absolute; left:5.3em;`);
        input.setAttribute("onclick", `resizeMark(${this.Nr});`);
        input.value = "Start/Ende"; // TODO i18n
        this.div.appendChild(input);

        // Löschen-Button
        input = createElement("input");
        input.setAttribute("type", "button");
        input.setAttribute("id", "cancel");
        input.setAttribute("style", `position: absolute; left:11.7em;`);
        input.setAttribute("onclick", `deleteMark(${this.Nr});`);
        input.value = "Löschen"; // TODO i18n
        this.div.appendChild(input);

        // Abbruch-Button
        input = createElement("input");
        input.setAttribute("type", "button");
        input.setAttribute("id", "cancel");
        input.setAttribute("style", `float:right;margin-right:5px;`);
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
        this.source = source;  // A für Arzt, M für ML
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
        if (this.visible) {
            var rect = this._rect;
            if (!rect) {
                rect = createRect();
                this._rect = rect;
            }
            var x = chartManager.calcPixelFromRowNumber(this.rowStart)
            rect.setAttribute('x', x);
            rect.setAttribute('y', 0);
            var width = this.rowEnd - this.rowStart;
            rect.setAttribute('width', chartManager.calcPixelFromRowNumber(width));
            rect.setAttribute('height', DIAGRAM_HEIGHT);
            rect.setAttribute("fill", this.color);
            rect.setAttribute("fill-opacity", MARK_OPACITY);
            rect.setAttribute("dest", "mark");
            rect.setAttribute("nr", this.nr);
            rect.setAttribute("uuid", this.uuid);
            this.svg.appendChild(rect);

            var time1 = dateFormat(chartManager.TimeFromRow(this.rowStart), "HH:MM:SS");
            var time2 = dateFormat(chartManager.TimeFromRow(this.rowEnd), "HH:MM:SS");
            var timeRange = `${time1} - ${time2}`; // TODO i18n

            var sec = chartManager.SecondsFromRow(this.rowEnd - this.rowStart);
            var secDate = new Date(2022, 1, 1, 0, 0, sec);
            var timeDiff = dateFormat(secDate, "HH:MM:SS");             // TODO i18n

            if (!this.text1) {
                this.text1 = createText();
            }
            this.text1.setAttribute('x', x + 20);
            this.text1.setAttribute('y', 25);
            this.text1.innerHTML = timeRange; // TODO i18n Zeitformat!
            this.text1.setAttribute('fill', 'black');
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
            this.text2.setAttribute('fill', 'black');
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
            this.text3.setAttribute('fill', 'black');
            this.text3.setAttribute("dest", "mark");
            this.text3.setAttribute("nr", this.nr);
            this.text3.setAttribute("uuid", this.uuid);
            this.svg.appendChild(this.text3);

            chartManager.clickStatus.removeSelectionRect();
        }
    }
}

function typSelected(obj, nr) {
    const dialog = chartManager.dialogFromNr(nr);
    const sel = dialog.select_typ;
    dialog.input_color.value = sel.options[sel.selectedIndex].getAttribute("color");
}
function createMark(nr) {
    const dialog = chartManager.dialogFromNr(nr);
    const svg = dialog.svg;
    const uuid = ""; // Für Implementierung als Component (wenn Datenbankzugriff besteht und Markierungen geladen werden)
    const mark = new Mark(uuid, nr, dialog.note, dialog.color, dialog.type, true, svg, MARK_SOURCE_DOC, dialog.rowStart, dialog.rowEnd);

    chartManager._marks.push(mark);
    chartManager.div.removeChild(dialog.div);
    chartManager._dialogs.splice(chartManager._dialogs.indexOf(dialog), 1);
}
function changeMark(nr) {
    const dialog = chartManager.dialogFromNr(nr);
    const mark = dialog.mark;
    const svg = dialog.svg;
    const uuid = ""; // Für Implementierung als Component (wenn Datenbankzugriff besteht und Markierungen geladen werden)

    mark.note = dialog.note;
    mark.color = dialog.color;
    mark.type = dialog.type;
    mark._rect.setAttribute("fill", dialog.color);

    dialog.svg.removeChild(dialog.rectLeft);
    dialog.svg.removeChild(dialog.rectRight);
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
            console.log("M - Visible false");
            // Nicht löschen, nur als NICHT SICHTBAR ändern
            dialog.mark.visible = false;
        }
        else {
            console.log("A - Deleted");
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
    dialog.rectLeft.setAttribute('x', chartManager.calcPixelFromRowNumber(dialog.rowStart));
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
    dialog.rectRight.setAttribute('x', chartManager.calcPixelFromRowNumber(dialog.rowEnd) - MARK_DRAGBOX_WIDTH);
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



async function start() {
    let load = await (fetch("./all.json"));
    let json = await load.json();
    // --------------------------------  Fuckup Point -------------------------------- 
    const usedDataManager = dataManager;

    usedDataManager.json = json;
    chartManager = new ChartManager(json, usedDataManager);

    // ------------------------------  END Fuckup Point ------------------------------ 

    var chart1 = chartManager.addChart();
    chartManager.addHorizontalScale({ before: chart1, height: HORIZONTAL_SCALE_HEIGHT });
    chart1.addLine("000000", "Breathing");
    var chart2 = chartManager.addChart();
    chart2.addLine("FF0000", "MovementX");
    chart2.addLine("00FF00", "MovementY");
    chart2.addLine("0000FF", "MovementZ");
    var chart3 = chartManager.addChart();
    chart3.addLine("0000FF", "OxSaturation");
    var chart4 = chartManager.addChart();
    if (false) {
        chart4.addLine("FF0000", "Breathing");
        chartManager.createAll();
        await new Promise(resolve => setTimeout(resolve, 2000));
        chart4.clearLines();
    }
    chart4.addLine("FF0000", "Pulse");

    chartManager.addHorizontalScale({ after: chart4, height: HORIZONTAL_SCALE_HEIGHT });

    chartManager.createAll();
    loadMarks();
}

function loadMarks() {
    // TODO Wenn DB Verbindung, die vorhanden Marks aus dem JSON laden
    const svg = chartManager.charts[0].svg;
    const uuid = ""; // Für Implementierung als Component (wenn Datenbankzugriff besteht und Markierungen geladen werden)
    const mark = new Mark(uuid, 10000, "Test", "#ff0000", "TEST", true, svg, MARK_SOURCE_DOC, 10000, 30000);

    chartManager._marks.push(mark);

    const mark2 = new Mark(uuid, 10001, "90%", "#aaaaaa", "Apnoe", true, svg, MARK_SOURCE_ML, 50000, 70000, true);
    chartManager._marks.push(mark2);

}

class HorizontalScale {
    constructor({ before, after, height }) {
        this.before = before;
        this.after = after;
        this.height = height;
        this.rect = null;
        this.div = null;
        this.svg = null;
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
            this.div.appendChild(this.svg);

            this.svg.appendChild(this.rect);
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
        this.line(0, 100, null, "#000000", 1);
        chartManager.HScaleRanges.forEach(range => {
            const sec = range.seconds;
            const pixelsPerSeconds = chartManager.calcPixelsForSeconds(sec);
            if (pixelsPerSeconds >= 5) {
                // Mindestens 5 Pixel Abstand pro Skala-Linie muss sein da sie sonnst zu eng gezeichnet wird
                const textNr = range.text;
                const lineHeight = range.height;
                const color = range.color;
                const lineWidth = range.width;

                const svg = this.svg;
                const svgWidth = svg.getAttribute('width');

                var actualPosition_seconds = sec;
                var pixelPos = chartManager.calcPixelsForSeconds(actualPosition_seconds);
                while (pixelPos < svgWidth) {
                    this.line(pixelPos, lineHeight, "", color, lineWidth);
                    actualPosition_seconds += sec;
                    pixelPos = chartManager.calcPixelsForSeconds(actualPosition_seconds);
                }
            }

        })
    }
    line(x, heightPercent, text, color, width) {
        var height = (this.height / 100 * heightPercent) / 2; // Halb weil von der Mitte nach oben und nach unten
        var center = this.height / 2;
        var line = createLine();
        var x1 = x;
        var y1 = center - height;
        var x2 = x;
        var y2 = center + height;

        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('style', `stroke:${color}; stroke-width:${width}`);

        this.svg.appendChild(line);
        if (text && text != "") {
            var txt = createText();

            txt.setAttribute('x', x1);
            txt.setAttribute('y', 15);
            txt.setAttribute('dest', "title");

            txt.innerHTML = text;
            txt.setAttribute('fill', HSCALE_TEXT_COLOR);
            this.svg.appendChild(txt);
        }
    }


}


start();
//startNode();
//var x = dataManager.dataInformationFromSignalName("Breathing");
;
