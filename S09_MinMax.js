function createPath(attributes) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    if (attributes) {
        Object.entries(attributes).forEach(e => {
            element.setAttribute(e[0], e[1]);
        });
    }
    return element;
}

class PathGenerator {
    constructor({ startPointX, startPointY, SVG }) {
        this.startPointX = 0;
        this.startPointY = 0;
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
    addYValue(y, color) {
        var col = this.colors.find(c => c.color == color);

        if (!col) {
            col = { color: color, points: [], path: "" };
            this.colors.push(col);
        }
        this.points.push({ y: this.height - y, color: col });
        this.needcalc = true;
    }
    // Fügt mehrere einzellne Y-Werte hinzu, 0 = unten
    addYValues(values) {
        values.forEach(v => {
            this.addYValue(v.y, v.color);
        });
    }
    addYValuesFromArray(array, color) {
        array.forEach(v => {
            if (v.min && v.max) {
                // Array mit min/max Werten
                if (v.color) {
                    // und mit Farbangaben
                    this.addYValue(v.min, v.color);
                    this.addYValue(v.max, v.color);
                }
                else {
                    // aber ohne Farbangaben (Parameter nutzen)
                    this.addYValue(v.min, color);
                    this.addYValue(v.max, color);
                }
            }
            else {
                if (v.min) {
                    // Nur Min-Wert
                    // Mit Farbangaben bzw. Parameter nutzen
                    this.addYValue(v.min, v.color ? v.color : color);
                }
                if (v.max) {
                    // Nur Max-Wert
                    // Mit Farbangaben bzw. Parameter nutzen
                    this.addYValue(v.max, v.color ? v.color : color);
                }
                if (!v.min && !v.min) {
                    // Weder Min, noch Max-Wert, d.h. ein Array aus Zahlen
                    this.addYValue(v, color);
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
                p.color.points.push({ x1: x, y1: y, x2: x + gapPixel, y2: p.y });
                x += gapPixel;
            }
            else {
                p.color.points.push({ x1: x, y1: y, x2: p.x, y2: p.y });
                x = p.x;
            }
            y = p.y;
        });

        this.colors.forEach(c => {
            var path = "";
            var x = -1;
            var y = -1;

            c.points.forEach(p => {
                if (p.x1 == x && p.y1 == y) {
                    // Alter Endpunkt entspricht dem neuen Startpunkt, nur eine Linie hinzufügen
                    path += `L${p.x2},${p.y2}`;
                }
                else {
                    // Versetzter Startpunkt, erst dorthin bewegen
                    path += `M${p.x1},${p.y1}L${p.x2},${p.y2}`;
                }
                x = p.x2;
                y = p.y2;
            });

            c.path = path;
        });
        this.needcalc = false;
    }
    drawPath({ svg, gapPixel }) {
        if (!svg) {
            svg = this.svg;
        }
        var path = null;
        if (this.needcalc) {
            this.makePath(gapPixel);
        }

        this.colors.forEach(c => {
            path = createPath({
                d: c.path,
                style: `stroke:${c.color};fill:none;`
            });
            svg.appendChild(path);
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
            }
        }

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

const width = 4;
const svg = document.getElementById("DEST");
const pg = new PathGenerator({ startPointX: width / 2, SVG: svg });
/* Mittel Points
pg.addPoint(150, 0, "#FF0000");
pg.addPoint(300, 150, "#000000");
pg.addPoint(450, 0, "#000000");
pg.addPoint(600, 150, "#FF0000");
*/
// Mittels Y-Values
pg.addYValue(30, "#000000");
pg.addYValue(150, "#000000");
pg.addYValue(80, "#FF0000");
pg.addYValue(145, "#000000");
pg.addYValue(105, "#FF0000");
pg.addYValue(108, "#FF0000");
pg.addYValue(99, "#0000FF");
pg.addYValue(117, "#FF0000");
// pg.makeBars(4);
pg.drawBars({ width: width, gapPixel: 0 });

// Mit PATH ############################################
const svg2 = document.getElementById("DEST2");
const pg2 = new PathGenerator({ startPointX: 0, SVG: svg2 });
/* Mittel Points
pg.addPoint(150, 0, "#FF0000");
pg.addPoint(300, 150, "#000000");
pg.addPoint(450, 0, "#000000");
pg.addPoint(600, 150, "#FF0000");
*/
// Mittels Y-Values
pg2.addYValue(30, "#000000");
pg2.addYValue(150, "#000000");
pg2.addYValue(80, "#FF0000");
pg2.addYValue(145, "#000000");
pg2.addYValue(105, "#FF0000");
pg2.addYValue(108, "#FF0000");
pg2.addYValue(99, "#0000FF");
pg2.addYValue(117, "#FF0000");
// pg.makePath(4);
pg2.drawPath({ gapPixel: width / 2 });


// addYValuesFromArray
// Mit PATH ############################################ aus Array
const svg3 = document.getElementById("DEST3");
const pg3 = new PathGenerator({ startPointX: 0, SVG: svg3 });
// Mittels Arrays
pg3.addYValuesFromArray([30, 150, 80, 145, 105, 108, 99, 117], "#000000");

pg3.addYValuesFromArray([
    { min: 30, max: 150, color: "#FF0000" },
    { min: 80, max: 145, color: "#00FF00" },
    { min: 105, max: 108, color: "#00FF00" },
    { min: 99, max: 117, color: "#000000" }
], "#000000");
// pg.makePath(4);
pg3.drawPath({ gapPixel: width / 2 });
