var SsbRef = require("ssb-ref");

var Publish = module.exports = {};

var help = Publish.help = function () {
    console.log("Try: ");
    console.log("./publish.js name type data (class)");
};

var TYPES = Publish.TYPES = ['A', 'AAAA', 'CNAME', 'HINFO', 'ISDN', 'MX', 'NS', 'PTR', 'SOA', 'TXT', 'SRV', 'SSHFP', 'DS', 'SPF'];

var isValidType = Publish.isValidType = function (t) {
    return TYPES.indexOf(t) !== -1;
};

var CLASSES = Publish.CLASSES = ['IN', 'CH', 'NONE'];

var isValidClass = Publish.isValidClass = function (c) {
    return CLASSES.indexOf(c) !== -1;
};

var validateRecord = Publish.validateRecord = function (record) {
    if (!isValidType(record.type)) { return "[Record TypeError] " + record.type + " is not a valid dns type"; }
    if (!isValidClass(record.class)) { return "[Record ClassError] class must be one of [" + CLASSES.join(', ') + "]"; }

    // TODO perform stricter validation on data
    if (!record.data) { return "[Record DataError] expected data to publish"; }

    if (record.type === 'SOA' && record.data.serial !== 0) {
        return "[Record DataError] set SOA serial to 0 so it can be auto-generated";
    }
};

Publish.record = function (branches, record, cb) {
    var complaint = validateRecord(record);
    if (complaint) { return void cb(new Error(complaint)); }

    if (!branches.every(SsbRef.isMsgId)) {
        return void cb(new Error("invalid branches"));
    }

    // our schema does not use the trailing dot in record names
    record.name = record.name.replace(/\.$/, '')

    require("ssb-client")(function (err, sbot) {
        if (err) { return void cb(err); }

        var val = {
            type: "ssb-dns",
            record: record,
            path: record.name.split(/\./g).reverse()
                .concat(record.class, record.type)
        }
        if (branches.length > 1) val.branch = branches;
        else if (branches.length == 1) val.branch = branches[0];

        // publish a message
        sbot.publish(val, function (err, msg) {
            if (err) { return void cb(err); }
            sbot.close();
            return void cb(err, msg);
        })
    });
};

