let d = new Date();

function dateFormat(date, format)
{
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
    res = res.replace('mm', ('0' + (date.getMonth()+1)).slice(-2));
    res = res.replace('yy', ('' + date.getFullYear()).slice(-2));
    res = res.replace('hh', ('0' + date.getHours()).slice(-2));
    res = res.replace('HH', ('0' + date.getHours()).slice(-2));
    res = res.replace('MM', ('0' + date.getMinutes()).slice(-2));
    res = res.replace('SS', ('0' + date.getSeconds()).slice(-2));

    return res;
}

console.log(dateFormat(d, "HH:MM:SS"));


