const { object } = require('joi');
const mongoose = require('mongoose');

const actionDetailsSchema = new mongoose.Schema({
    name: String,
    key: String,
});

const actionTypesSchema = new mongoose.Schema({
    type_name: String,
    details: [actionDetailsSchema],
});

const conditionPairSchema = new mongoose.Schema({
    metric: {
        type: String,
        enum: {
            values: ['Ad Spend', 'Clicks', 'Impressions', 'CTR', 'CPC', 'CPM', 'Ad Revenue', 'Ad Orders', 'CPA', 'ROAS', 'AOV', 'ACOS', 'CR'],
            message: '{VALUE} is not supported',
        },
    },
    condition: {
        type: String,
        enum: {
            values: ['Is greater than', 'Is smaller than', 'Is between', 'Is not between'],
            message: '{VALUE} is not supported',
        },
    },

    check: {
        type: String
    },

    from_value: {
        type: Number
    },

    to: {
        type: Number,
    },
});

const ruleSchema = new mongoose.Schema({
    dataPeriod: {
        type: String
    },

    adsCategory: {
        type: String
    },

    ruleName: {
        type: String,
    },

    applyRuleTo: {
        type: String,
        enum: {
            values: ['Campaign', 'AdGroup', 'Placement', 'Targeting', 'SearchTerm', 'Keyword', 'Asin/product_name', 'Creatives', 'Placement Bid'],
            message: '{VALUE} is not supported',
        },
    },

    action: {
        type: Object
    },

    conditions: {
        type: [Object],
        default: [],
    },
    timeRange: {
        type: String,
        enum: {
            values: ['Yesterday', 'Last 2 days', 'Last 3 days', 'Last 7 days', 'Last 14 days', 'Last 30 days'],
            message: '{VALUE} is not supported',
        },
    },
    schedule: {
        type: String,
        default: 'Daily',
    },

    undoRedo: {
        type: Boolean,
        default: false
    },
});

const Rule = mongoose.model('Rule', ruleSchema);

module.exports = Rule;
