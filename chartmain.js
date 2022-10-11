class ChartManager
{
    constructor(json)
    {
        this.json = json;
        this.charts = [];
        const mainDIV = document.getElementById('chart');
        var wrapperDIV = createDIV();
        wrapperDIV.setAttribute('class', 'chartWrapper');
        mainDIV.appendChild(wrapperDIV);
        var areawrapperDIV = createDIV();
        areawrapperDIV.setAttribute('class', 'chartAreaWrapper');
        wrapperDIV.appendChild(areawrapperDIV);
        this.div = areawrapperDIV;
    }

    addChart()
    {
        var newDiv = createDIV();
        this.div.appendChild(newDiv);
        var newSVG = createSVG();
        newSVG.setAttribute('width', '10000');
        newDiv.appendChild(newSVG);

        var newChart = new Chart(newDiv, newSVG, this.json);
        this.charts.push(newChart);
        return newChart;
    }


    createAll()
    {
        this.charts.forEach(c => c.drawLines());
    }
}

function createDIV()
{
    //return document.createElementNS('http://www.w3.org/2000/div', 'div');
    return document.createElement('div');
}

function createSVG()
{
    return document.createElementNS('http://www.w3.org/2000/svg', 'svg');
}

function createPolyline()
{
    return document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
}
class Chart
{
    constructor(div, svg, json)
    {
        this.chartLines = [];
        this.div = div;
        this.svg = svg;
        this.json = json;
    }

    addLine(color, data)
    {
        this.chartLines.push(new ChartLine(color, data));
    }

    drawLines()
    {
        this.chartLines.forEach(line =>
        {
            var polyLine = createPolyline();
            var x = 0;
            var pts = "";
            if (Array.isArray(line.data))
            {
                line.data.forEach(y => { pts += `${x++},${y} ` })
            }
            else if (typeof line.data === 'string')
            {
                pts = line.data;
            }
            else if (typeof line.data === 'function')
            {
                pts = line.data(this.json);
            }
            polyLine.setAttribute('points', pts.trim());
            polyLine.setAttribute('stroke', `#${line.color}`);
            polyLine.setAttribute('stroke-width', 0.5);
            polyLine.setAttribute('fill', 'none');
            this.svg.appendChild(polyLine);
        })
    }



}

class ChartLine
{
    constructor(color, data)
    {
        this.color = color;
        this.data = data;
    }
}



var chartManager;

async function loadJSON()
{
    fetch("./part1.json")
        .then(r =>
        {
            return r.json;
        })
}

async function start()
{
    let load = await (fetch("./part1.json"));
    let json = await load.json();

    chartManager = new ChartManager(json);

    var chart1 = chartManager.addChart();
    chart1.addLine("FF0000", recalcA);
    var chart2 = chartManager.addChart();
    chart2.addLine("FF0000", recalcB);
    chart2.addLine("00FF00", recalcC);
    chart2.addLine("0000FF", recalcD);
    chartManager.createAll();
}

function recalcA(json)
{
    var x = 0;
    return json.data.map(e => ` ${x++},${150 - ((e.a + 1000) / 14)}`).toString().trim()
}
function recalcB(json)
{
    var x = 0;
    return json.data.map(e => ` ${x++},${150 - ((e.b + 1000) / 14)}`).toString().trim()
}
function recalcC(json)
{
    var x = 0;
    return json.data.map(e => ` ${x++},${150 - ((e.c + 1000) / 14)}`).toString().trim()
}
function recalcD(json)
{
    var x = 0;
    return json.data.map(e => ` ${x++},${150 - ((e.d + 1000) / 14)}`).toString().trim()
}
function recalcE(json)
{
    var x = 0;
    return json.data.map(e => ` ${x++},${150 - ((e.e + 1000) / 14)}`).toString().trim()
}
function recalcF(json)
{
    var x = 0;
    return json.data.map(e => ` ${x++},${150 - ((e.f + 1000) / 14)}`).toString().trim()
}
start();
