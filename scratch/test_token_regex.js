const qs = 'collection:"castle set" -tag:"prop name" tree -dead';
const parts = [];
const regex = /(-?\w+:)?("[^"]*"|'[^']*'|[^\s]+)/g;
let m;
while ((m = regex.exec(qs)) !== null) {
    const prefix = m[1] || '';
    const val = m[2].replace(/^["']|["']$/g, '');
    parts.push(prefix + val);
}
console.log("Parts:", parts);
