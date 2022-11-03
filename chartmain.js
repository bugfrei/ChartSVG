//  const DEFAULT_ZOOM_FREQ = 1 * 64;   // Zoomfaktor Default (Anzahl Messwerte je Pixel)
const DEFAULT_ZOOM_FREQ = null;         // Zoomfaktor wird berechnet für vollansicht (Anzahl Messwerte / Window.Width)
//const DIAGRAM_HEIGHT = 88;
const DIAGRAM_HEIGHT = 80;
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
const HSCALE_MIN_PIXEL_DISTANCE_X = 5;
const HSCALE_ALIGNMENTS = {
    Top: "top",
    Bottom: "bottom",
    Center: "center"
}
const HORIZONTAL_SCALE_CAPTION_MINDIST_X = 60;
//const HORIZONTAL_SCAPE_CAPTION_FONTSIZE = "0.8em";
const HORIZONTAL_SCAPE_CAPTION_FONTSIZE = "12px";


var chartManager;

class ChartManager {
    // Default-Values

    constructor(json, dataManager) {
        this.json = json;
        this._partValuesStart = 0; // Default von Anfang an
        this._partValuesCount = this.json.data.length; // Default alles anzeigen (wird beim Änderung von ZoomFreq und MaxFreq berechnet)

        this.dataManager = dataManager;
        if (DEFAULT_ZOOM_FREQ) {
            this._zoom_freq = DEFAULT_ZOOM_FREQ;
        }
        else {
            const valueCount = this.json.data.length;
            const width = window.innerWidth - 30;
            this._zoom_freq = valueCount / width;
        }
        this.charts = [];
        this._maxFreq = 0;
        this._dialogNr = 0;         // Fortlaufende Nummer zur identifikation neuer Dialoge
        this._dialogs = [];         // Auflistung der Dialoge
        this._marks = [];           // Auflistung der Markierungen (egal ob Arzt oder ML)
        this._horizontalScale = []; // Auflistung der horizontalen Skalas (in der Regel nur eine für oben)
        this.horizontalScaleShowsTime = false;   // Zeigt die Skala die Uhrzeit (true) oder die Zeitdifferenz (false)
        this.HScaleRanges = [       // die Bereiche, die in der Horizontalen Skala dargestellt werden können
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

                    // Elementhöhe berechnen
                    const elementHeight = DIAGRAM_HEIGHT / 5; // 3 Elemente und etwas Abstand

                    this.selectionRect.setAttribute('x', x1);
                    this.selectionRect.setAttribute('width', x2 - x1);
                    // Titel
                    let anchor = createAnchor();
                    anchor.setAttribute('href', 'javascript:alert("huhu");');
                    anchor.setAttribute('x', x1 + 10);
                    anchor.setAttribute('y', 10);
                    anchor.setAttribute('width', x2 - x1 - 20);
                    anchor.setAttribute('height', elementHeight);
                    anchor.setAttribute('dest', "title");
                    this.clickChart.svg.appendChild(anchor);

                    let title = createRect();
                    title.setAttribute('x', x1 + 10);
                    title.setAttribute('y', 10);
                    title.setAttribute('width', x2 - x1 - 20);
                    title.setAttribute('height', elementHeight);
                    title.setAttribute('fill', SELECTION_TITELCOLOR);
                    title.setAttribute('fill-opacity', SELECTION_TITLEOPACITY);
                    title.setAttribute('dest', "title");

                    let text = createText();
                    text.setAttribute('x', x1 + 20);
                    text.setAttribute('y', 10 + (elementHeight * 0.85));
                    text.setAttribute('dest', "title");
                    text.setAttribute('font-size', elementHeight);
                    this.clickChart.svg.appendChild(anchor);
                    const time = dateFormat(chartManager.Time(x1), "HH:MM:SS");
                    const seconds = chartManager.Seconds(x2 - x1) - (chartManager.partValuesStart / chartManager.maxFreq);
                    const secondsStr = secondFormat(seconds, "HH:MM:SS");

                    text.innerHTML = time + ` (${secondsStr})`; // TODO i18n Zeitformat!
                    text.setAttribute('fill', 'black');

                    //this.clickChart.svg.appendChild(title);
                    anchor.appendChild(title);
                    anchor.appendChild(text);
                    this.selectionElements.push(anchor);

                    // Zoom
                    var elementYPos = 10 + (elementHeight * 1.5);
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
                    text.setAttribute('fill', 'black');

                    //this.clickChart.svg.appendChild(title);
                    anchor.appendChild(title);
                    anchor.appendChild(text);
                    this.selectionElements.push(anchor);
                    text.setAttribute('x', x1 + 10 + (x2 - x1 - 20) / 2 - (text.getBoundingClientRect().width / 2));

                    // Note
                    elementYPos = 10 + (elementHeight * 3);
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

    addHorizontalScale({ before, after, height, align }) {
        var hs = new HorizontalScale({ before, after, height, align });
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
        }
        else if (freqZoomFactor <= 4) {
            // Zoom Faktor zu hoch für alles, auf zwei Stunde reduzieren
            this.partValuesCount = this.maxFreq * 3600 * 2;
            console.log(`[INFO] PartValuesCount = ${this.partValuesCount / 60} min.`);

        }
        else if (freqZoomFactor <= 16) {
            // Zoom Faktor zu hoch für alles, auf eine Stunde reduzieren
            this.partValuesCount = this.maxFreq * 3600; // 32 * 3600 / 2 = 57600 Pixel
            console.log(`[INFO] PartValuesCount = ${this.partValuesCount / 60} min.`);

        }
        else if (freqZoomFactor <= 128) {
            // Zoom Faktor sehr hoch, nur noch 10 Minuten anzeigen
            this.partValuesCount = this.maxFreq * 600; // 32 * 60 / 0.25 = 76800 Pixel Width für SVG
            console.log(`[INFO] PartValuesCount = ${this.partValuesCount / 60} min.`);
        }
        else {
            // Zoom Faktor noch höher, nur noch 1 Minuten anzeigen
            this.partValuesCount = this.maxFreq * 60; // 32 * 60 / 0.125 = 15360 Pixel Width für SVG
            console.log(`[INFO] PartValuesCount = ${this.partValuesCount / 60} min.`);
        }
    }

    Seconds(offsetX) {
        return ((offsetX * this.zoomFreq) + chartManager.partValuesStart) / this.maxFreq;
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

    chartManager.calcPartValuesCount(newZoom);
    // set partValuesStart
    if (chartManager.partValuesCount == chartManager.json.data.length) {
        // Alle Daten werden angezeigt -> von Anfang an anzeigen
        chartManager.partValuesStart = 0;
    }
    else {
        // Nur ein Teil wird angezeigt -> Anfang ermitteln
        chartManager.partValuesStart += chartManager.clickStatus.left * zoomXValuesFor1Pixel;

    }

    chartManager.zoomFreq = newZoom;
    // Calculate new Position (scroll)
    const newPos = ((chartManager.clickStatus.left * zoomXValuesFor1Pixel) - chartManager.partValuesStart) / chartManager.zoomFreq;
    chartManager.div.scroll(newPos, 0);
    OUT(chartManager.zoomFreq);
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
        var drawZeroLine = this.zeroLine;

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

                // DOPPELT ?!?!    this.chartLines.forEach(line => {
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
                    const arr = line.data.dataFunction(this.pickLineData(line.data), this.chartManager.zoomFreq, this.chartManager.maxFreq);
                    // (e => Math.round(e * yRange + yOffset));
                    for (var p of arr) {
                        x += xStep;
                        if (p != undefined && p != NaN) {
                            pth += `L${x},${(DIAGRAM_HEIGHT - (p * yRange + yOffset))}`;
                        }
                    }
                    this.svg.setAttribute("width", x);
                }
                path.setAttribute('d', pth.trim());
                path.setAttribute('stroke', `#${line.color}`);
                path.setAttribute('stroke-width', 0.5);
                path.setAttribute('fill', 'none');

                if (x > maxWidth) { maxWidth = x; }
                this.svg.appendChild(path);
                // DOPPELT ?!?    })
            }
            else {
                console.log('[INFO] Use Polyline');
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
            console.log(`[INFO] drawLines maxWidth (=svg.width): ${maxWidth}`);
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

const dataManager =
{
    json: null,
    dataInformation: [
        ["Nasaler Druck", { // "a"
            "dataFunction": function recalc(dataInformation, factor, maxFreq) {
                if (factor == 0 || dataInformation.freq == 0) {
                    // Alles übergeben wenn kein Faktor oder Frequenz vorhanden
                    return dataInformation.data;
                }
                // Interpolierung zur y-Größe der Diagramme erfolgt beim zeichnen
                var newData = dataManager.simpleAvg(dataInformation.data, factor, maxFreq);
                return newData;
            },
            "valueMin": -3000,
            "valueMax": 32767,
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
            "dataFunction": function recalc(dataInformation, factor, maxFreq) {
                if (factor == 0 || dataInformation.freq == 0) {
                    // Alles übergeben wenn kein Faktor oder Frequenz vorhanden
                    return dataInformation.data;
                }
                // Interpolierung zur y-Größe der Diagramme erfolgt beim zeichnen
                var newData = dataManager.simpleAvg(dataInformation.data, factor, maxFreq);
                return newData;
            },
            "valueMin": -2200,
            "valueMax": 32767,
            "usePath": true,
            "zeroLine": { color: "#FF0000", opacity: 0.3, height: 1, style: '' }
        }],
        ["PSchnarchen", { // "c"
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
            "valueMin": -1400,
            "valueMax": 17100,
            "usePath": true,
            "zeroLine": { color: "#FF0000", opacity: 0.3, height: 1, style: '' }
        }],
        ["SpO2", { // "d"
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
            "valueMin": -1200,
            "valueMax": 10000,
            "usePath": true,
            "zeroLine": { color: "#FF0000", opacity: 0.3, height: 1, style: '' }
        }],
        ["SpO2 B-B", { // "e"
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
            "valueMin": -1700,
            "valueMax": 12000,
            "usePath": true,
            "zeroLine": false
        }],
        ["Pulsrate", { // "f"
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
            "valueMin": -1700,
            "valueMax": 12000,
            "usePath": true,
            "zeroLine": false
        }],
        ["Plethysmogramm", { // "g"
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
            "valueMin": -3400,
            "valueMax": 32767,
            "usePath": false,
            "zeroLine": false
        }],
        ["Aktivitaet", { // "h"
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
            "valueMin": -1300,
            "valueMax": 24000,
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

        var sec = chartManager.Seconds(this.selectionEnd - this.selectionStart) - (chartManager.partValuesStart / chartManager.maxFreq);
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

        var sec = chartManager.Seconds(this.selectionEnd - this.selectionStart) - (chartManager.partValuesStart / chartManager.maxFreq);
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
    const mark = new Mark(uuid, nr, dialog.note, dialog.color, dialog.type, true, svg, MARK_SOURCE_DOC, dialog.rowStart + chartManager.partValuesStart, dialog.rowEnd + chartManager.partValuesStart);

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
    //let load = await (fetch("./all.json"));
    let load = await (fetch("./kurven.json"));
    let json = await load.json();
    // --------------------------------  Fuckup Point -------------------------------- 
    const usedDataManager = dataManager;

    usedDataManager.json = json;
    chartManager = new ChartManager(json, usedDataManager);

    // ------------------------------  END Fuckup Point ------------------------------ 

    var chart1 = chartManager.addChart();
    // all.json
    /*
    chartManager.addHorizontalScale({ before: chart1, height: HORIZONTAL_SCALE_HEIGHT, align: HSCALE_ALIGNMENTS.Bottom });
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

    chartManager.addHorizontalScale({ before: chart3, height: HORIZONTAL_SCALE_HEIGHT, align: HSCALE_ALIGNMENTS.Center });
    chartManager.addHorizontalScale({ after: chart4, height: HORIZONTAL_SCALE_HEIGHT, align: HSCALE_ALIGNMENTS.Top });
    */

    // kurven.json
    chartManager.addHorizontalScale({ before: chart1, height: HORIZONTAL_SCALE_HEIGHT, align: HSCALE_ALIGNMENTS.Bottom });
    chart1.addLine("000000", "Nasaler Druck");

    var chart2 = chartManager.addChart();
    chart2.addLine("000000", "Thorax");

    var chart3 = chartManager.addChart();
    chart3.addLine("000000", "PSchnarchen")

    var chart4 = chartManager.addChart();
    chart4.addLine("FF0000", "SpO2");
    chart4.addLine("00FF00", "SpO2 B-B");

    var chart5 = chartManager.addChart();
    chart5.addLine("000000", "Pulsrate");

    var chart6 = chartManager.addChart();
    chart6.addLine("000000", "Plethysmogramm");

    var chart7 = chartManager.addChart();
    chart7.addLine("000000", "Aktivitaet");

    //chartManager.addHorizontalScale({ before: chart4, height: HORIZONTAL_SCALE_HEIGHT, align: HSCALE_ALIGNMENTS.Center });
    chartManager.addHorizontalScale({ after: chart7, height: HORIZONTAL_SCALE_HEIGHT, align: HSCALE_ALIGNMENTS.Top });

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
        const pixelStep = stepRange.seconds / secondsPerPixel;

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
            txt.setAttribute('font-size', HORIZONTAL_SCAPE_CAPTION_FONTSIZE);

            txt.innerHTML = text;
            txt.setAttribute('fill', HSCALE_TEXT_COLOR);
            this.svg.appendChild(txt);
            txt.setAttribute('x', x - (txt.getBoundingClientRect().width / 2));
            txt.setAttribute('y', textYPos + ((txt.getBoundingClientRect().height / 2) * textYFactor));
        }
    }


}


start();
//startNode();
//var x = dataManager.dataInformationFromSignalName("Breathing");
;
