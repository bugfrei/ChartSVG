var data = [];
for(var i = 1; i < 1000; i++) {
    data.push(i);
}
var nr = 0;
var sum = 0;
var anz = 10;

var newData = [];
for(var d of data)
{
    nr++;
    sum += d;
    if (nr >= anz) {
        var res = sum / nr;
        sum = 0;
        nr = 0;
        newData.push(res);
    }
}

const json = require("/Users/carstenschlegel/Coding/JS/SVG/mittel.json");

nr = 0;
sum = 0;
var newData2 = [];

for(var dd of json.data.map(d => d.a))
{
    nr++;
    sum += dd;
    if (nr >= anz) {
        var res = sum / nr;
        sum = 0;
        nr = 0;
        newData2.push(res);
    }
}