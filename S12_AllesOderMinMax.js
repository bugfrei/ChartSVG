//const data = require("./mindata.json");
const d2 = new Date();
const data = require("./kurven.json");

const dataA = data.data.map(d => d.a);
const dataB = data.data.map(d => d.b);
const dataC = data.data.map(d => d.c);
const dataD = data.data.map(d => d.d);
const dataE = data.data.map(d => d.e);
const dataF = data.data.map(d => d.f);
const dataG = data.data.map(d => d.g);
const dataH = data.data.map(d => d.h);

// Funktion gibt ein Array eines Punktes zurück. Dieser kann 4 Zustände haben
// 1. null                         -> es wurde für einen Datenbereich, der ein Pixel darstellt (zoomFreq) KEIN gültiger Wert gefunden
//                                    In diesem Fall sollte eine Verbindung vom VORHERIGEN Wert erstellt werden (also den alten Wert
//                                    nochmal verwenden)
// 2. { point: ... }               -> es wurde für den Datenbereich exakt EIN gültiger Wert gefunden
//                                    Hier wird diese Pixel mit xGap+1 Abstand gezeichnet und mit einen . versehen
// 3. { point1: ..., point2: ... } -> es wurde für den Datenbereich exkakt ZWEI gültige Werte gefunden
//                                    Hier werden beide Pixel mit xGap-1+1 Abstand gezeichnet und mit einem . versehen

// 4. { min: ..., max: ... }       -> es wurde für den Datenbereich mehr als 2 gültige Werte gefunden
function complexeMinMax(dataArray, factor, freq) {
    console.log(`Anzahl: ${dataArray.length}`)
    const maxIdx = dataArray.length - 1;
    var newData = [];
    var nr = 0;
    var nrWithValue = 0;
    var v1 = null;
    var v2 = null;
    var min = null;
    var max = null;
    var ddif = Number(new Date() - d2);
    console.log(`LOAD: ${ddif}`)
    const d1 = new Date();
    for (var idx = 0; idx < dataArray.length; idx++) {
        const d = dataArray[idx];
        nr++;
        if (d != undefined) {
            if (min == null || d < min) min = d;
            if (max == null || d > max) max = d;
            nrWithValue++;
            if (nrWithValue == 1) v1 = d;
            if (nrWithValue == 2) v2 = d;
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
    ddif = Number(new Date() - d1);
    console.log(`DAUER: ${ddif}`)
    return newData;
}

var nd = complexeMinMax(dataF, 3318);
console.log(nd.length);