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
var chartManager;

class ChartManager {
    // Default-Values

    constructor(json, dataManager) {
        this.json = json;
        this.dataManager = dataManager;
        this._zoom_freq = DEFAULT_ZOOM_FREQ;
        this.charts = [];
        this._maxFreq = 0;
        this._clickStatus = {
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
                    var difValues = difPixel * chartManager.zoomFreq;
                    if (difValues < SELECTION_MIN_VALUES) {
                        // Zu kleiner Bereich, Bereich links und rechts auf SELECTION_MIN_VALUES erweitern
                        var expandValues = SELECTION_MIN_VALUES - difValues;
                        var expandPixel = expandValues / chartManager.zoomFreq;
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

                    text.innerHTML = time + ` (${seconds} s)`;
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

                    text.innerHTML = `Zoom`;
                    text.setAttribute('fill', 'black');

                    //this.clickChart.svg.appendChild(title);
                    anchor.appendChild(title);
                    anchor.appendChild(text);
                    this.selectionElements.push(anchor);
                    text.setAttribute('x', x1 + 10 + (x2 - x1 - 20) / 2 - (text.getBoundingClientRect().width / 2));

                    // Note
                    anchor = createAnchor();
                    anchor.setAttribute('href', 'javascript:doNote();');
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

                    text.innerHTML = `Notiz`;
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
        const mainDIV = document.getElementById('chart');
        var wrapperDIV = createDIV();
        wrapperDIV.setAttribute('class', 'chartWrapper');
        mainDIV.appendChild(wrapperDIV);

        var areawrapperDIV = createDIV();
        areawrapperDIV.setAttribute('class', 'chartAreaWrapper');
        wrapperDIV.appendChild(areawrapperDIV);
        this.div = areawrapperDIV;
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

    addChart() {
        var newDiv = createDIV();
        this.div.appendChild(newDiv);
        var newSVG = createSVG();
        newSVG.onmousemove = mouseMove;
        newSVG.onclick = mouseClick;
        newSVG.setAttribute('width', '50000');
        newSVG.setAttribute('height', DIAGRAM_HEIGHT.toString());
        newDiv.appendChild(newSVG);

        var newChart = new Chart(this, newDiv, newSVG, this.json);
        this.charts.push(newChart);
        return newChart;
    }

    mouseMove(e) {
        console.log(this.Time(e.offsetX));
        this.charts.forEach(c => c.setCursor(e.offsetX));
        if (this.clickStatus.clickNumber == 1) {
            this.clickStatus.resizeSelectionRect(e.offsetX);
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
function doNote() {
    alert("Note");
}

function OUT(t) {
    document.getElementById("OUT").innerHTML = t;
}

function mouseMove(e) {
    chartManager.mouseMove(e);
}
function mouseClick(e) {
    if (e.srcElement.getAttribute('dest') == "title") {
        // Title clicked
    }
    else {
        // Chart clicked
        chartManager.mouseClick(e);
    }
}

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

async function start() {
    let load = await (fetch("./all.json"));
    let json = await load.json();
    // --------------------------------  Fuckup Point -------------------------------- 
    const usedDataManager = dataManager;

    usedDataManager.json = json;
    chartManager = new ChartManager(json, usedDataManager);
    // ------------------------------  END Fuckup Point ------------------------------ 

    var chart1 = chartManager.addChart();
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

    chartManager.createAll();
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



start();
//startNode();
//var x = dataManager.dataInformationFromSignalName("Breathing");
;
