const DEFAULT_ZOOM_FREQ = 1;
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
            clickChart: null
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
        this._zoom_freq = zoomFreq;
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
        newDiv.appendChild(newSVG);

        var newChart = new Chart(this, newDiv, newSVG, this.json);
        this.charts.push(newChart);
        return newChart;
    }

    mouseMove(e)
    {
        console.log(this.Time(e.offsetX));
        this.charts.forEach(c => c.setCursor(e.offsetX));
    }
    nouseClick(e)
    {
    }
    


    createAll() {
        this.charts.forEach(c => c.drawLines());
    }
}

function mouseMove(e)
{
    chartManager.mouseMove(e);
}
function mouseClick(e)
{
    chartManager.mouseClick(e);
}

function createDIV() {
    //return document.createElementNS('http://www.w3.org/2000/div', 'div');
    return document.createElement('div');
}

function createSVG() {
    return document.createElementNS('http://www.w3.org/2000/svg', 'svg');
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

    setCursor(x)
    {
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
        cursorLine.setAttribute('height', 160);
        cursorLine.setAttribute("fill", "#000000");
        this.svg.appendChild(cursorLine);
        this.cursorLine = cursorLine;
        
        var maxWidth = 0;
        // Dann neu zeichnen
        this.chartLines.forEach(line => {
            if (line.data.usePath) {
                console.log('[INFO] Use Path');
                
                this.chartLines.forEach(line => {
                    var path = createPath();
                    var x = 1;
                    var pth = "M1,150";
                    if (Array.isArray(line.data)) {
                        line.data.forEach(y => { pth += `C${x++} ${y} ` })
                    }
                    else if (typeof line.data === 'string') {
                        pth = line.data;
                    }
                    else {
                        const arr = line.data.dataFunction(line.data, this.chartManager.zoomFreq, this.chartManager.maxFreq);
                        for (var p of arr) {
                            x++;
                            if (p != undefined && p != NaN) {
                                pth += `L${x},${(150 - p)}`;
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
                        arr.forEach(y => { pts += `${x++},${150-y} ` })
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
    chart4.addLine("FF0000", "Breathing");
    chartManager.createAll();
    await new Promise(resolve => setTimeout(resolve, 2000));
    chart4.clearLines();
    chart4.addLine("FF0000", "Pulse");

    chartManager.createAll();
}

const dataManager =
{
    json: null,
    dataInformation: [
        ["Breathing", {
            "dataFunction": function recalc(dataInformation, factor, maxFreq) {
                var x = 0;
                if (factor == 0 || dataInformation.freq == 0) {
                    // Alles übergeben wenn kein Faktor oder Frequenz vorhanden
                    return dataInformation.data.map(e => Math.round((e + 1000) / 14));
                    // return dataInformation.data.map(e => ` ${x++},${150 - ((e + 1000) / 14)}`).toString().trim()
                }
                var newData = dataManager.simpleAvg(dataInformation.data, factor, maxFreq);
                return newData.map(e => Math.round((e + 1000) / 14));
                // return newData.map(e => ` ${x++},${150 - ((e + 1000) / 14)}`).toString().trim()
            },
            "valueMin": -32768,
            "valueMax": 32767,
            "usePath": false,
            "zeroLine": true
        }],
        ["MovementX", {
            "dataFunction": function recalc(dataInformation, factor, maxFreq) {
                var x = 0;
                if (factor == 0 || dataInformation.freq == 0) {
                    // Alles übergeben wenn kein Faktor oder Frequenz vorhanden
                    return dataInformation.data.map(e => Math.round((e + 1000) / 14));
                    // return dataInformation.data.map(e => ` ${x++}${150 - ((e + 1000) / 14)}`).toString().trim()
                }
                var newData = dataManager.simpleAvg(dataInformation.data, factor, maxFreq);
                return newData.map(e => Math.round((e + 1000) / 14));
                // return newData.map(e => ` ${x++},${150 - ((e + 1000) / 14)}`).toString().trim()
            },
            "valueMin": -32768,
            "valueMax": 32767,
            "usePath": true,
            "zeroLine": true
        }],
        ["MovementY", {
            "dataFunction": function recalc(dataInformation, factor, maxFreq) {
                var x = 0;
                if (factor == 0 || dataInformation.freq == 0) {
                    // Alles übergeben wenn kein Faktor oder Frequenz vorhanden
                    return dataInformation.data.map(e => Math.round((e + 1000) / 14));
                    // return dataInformation.data.map(e => ` ${x++},${150 - ((e + 1000) / 14)}`).toString().trim()
                }
                var newData = dataManager.simpleAvg(dataInformation.data, factor, maxFreq);
                return newData.map(e => Math.round((e + 1000) / 14));
                // return newData.map(e => ` ${x++},${150 - ((e + 1000) / 14)}`).toString().trim()
            },
            "valueMin": -32768,
            "valueMax": 32767,
            "usePath": true,
            "zeroLine": true
        }],
        ["MovementZ", {
            "dataFunction": function recalc(dataInformation, factor, maxFreq) {
                var x = 0;
                if (factor == 0 || dataInformation.freq == 0) {
                    // Alles übergeben wenn kein Faktor oder Frequenz vorhanden
                    return dataInformation.data.map(e => Math.round((e + 1000) / 14));
                    // return dataInformation.data.map(e => ` ${x++},${150 - ((e + 1000) / 14)}`).toString().trim()
                }
                var newData = dataManager.simpleAvg(dataInformation.data, factor, maxFreq);
                return newData.map(e => Math.round((e + 1000) / 14));
                // return newData.map(e => ` ${x++},${150 - ((e + 1000) / 14)}`).toString().trim()
            },
            "valueMin": -32768,
            "valueMax": 32767,
            "usePath": true,
            "zeroLine": true
        }],
        ["OxSaturation", {
            "dataFunction": function recalc(dataInformation, factor, maxFreq) {
                var x = 0;
                if (factor == 0 || dataInformation.freq == 0) {
                    // Alles übergeben wenn kein Faktor oder Frequenz vorhanden
                    return dataInformation.data.map(e => Math.round(e * 15));
                    // return dataInformation.data.map(e => ` ${x++},${150 - (e == undefined ? 0 : e * 15)}`).toString().trim()
                }

                var newData = dataManager.simpleAvg(dataInformation.data, factor, maxFreq);
                return newData.map(e => Math.round(e * 15));
                // return newData.map(e => ` ${x++},${150 - (e * 15)}`).toString().trim()
            },
            "valueMin": 0,
            "valueMax": 127,
            "usePath": true,
            "zeroLine": false
        }],
        ["Pulse", {
            "dataFunction": function recalc(dataInformation, factor, maxFreq) {
                var x = 0;
                if (factor == 0 || dataInformation.freq == 0) {
                    // Alles übergeben wenn kein Faktor oder Frequenz vorhanden
                    return dataInformation.data.map(e => Math.round(e * 15));
                    // return dataInformation.data.map(e => ` ${x++},${150 - (e == undefined ? 0 : e * 15)}`).toString().trim()
                }
                var newData = dataManager.simpleAvg(dataInformation.data, factor, maxFreq);
                return newData.map(e => Math.round(e * 15));
                // return newData.map(e => ` ${x++},${150 - (e * 15)}`).toString().trim()
            },
            "valueMin": 0,
            "valueMax": 255,
            "usePath": false,
            "zeroLine": false
        }]
    ],
    simpleAvg(data, factor, freq) {
        var nr = 0;
        var sum = 0;
        var valCount = 0;

        const anz = factor; // Faktor (in Bezugsnehmend zur Frequenz; 1 = jeden Messwert (1:1), 2 )= jeden Zweiten (1:2))
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
