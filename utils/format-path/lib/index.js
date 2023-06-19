'use strict';

module.exports = formatPath;
const path = require('path')

function formatPath(p) {
    // TODO
    console.log(p)
    if(p  && typeof p === 'string'){
        const sep = path.sep;
        if(sep!=='/'){
            return p.replace(/\\/g,'/')
        }
    }
    return p
}
