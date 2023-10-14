
const qs = require('querystring');
const got = require('got');
const _ = require('lodash');
const { isEmpty } = require('lodash');

/**
 * Try catch to parse JSON objects
 * @param   {Object} data [description]
 * @returns {[type]}      [description]
 */
const parseIfJson = (data) => {
    try {
        return JSON.parse(data);
    } catch (e) {
        return data;
    }
}

const getIamToken = () => {
    const payload = {
        grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
        apikey: process.env['IAM_API_KEY']
    };
    const options = {
        url: process.env['IAM_TOKEN_EXCHANGE_URL'],
        body: qs.stringify(payload),
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    return getData(options);

};

const getData = async (opt, cb) => {
    try {
        const options = await opt;
        console.log(JSON.stringify(options.url))
        const response = await got(_.omit(options, ['json']));
        let responseBody = parseIfJson(response.body);
        return cb ? cb(responseBody, null) : responseBody;
    } catch (err) {
        console.log(err);
        return cb ? cb(null, err) : err;
    }
};

const checkEnvVariables = (apiKey, sccRegion, sccInstanceId) => {
    let allSet = true;
    if (isEmpty(apiKey)) {
        console.log('IAM_API_KEY is missing, please set this environment variable');
        allSet = false;
    } else if (isEmpty(sccInstanceId)) {
        console.log('SCC_INSTANCE_ID is missing, please set this environment variable');
        allSet = false;
    } else if (isEmpty(sccRegion)) {
        console.log('SCC_REGION is missing, us-south will be used as default region');
    }
    return allSet;
}

module.exports = {
    parseIfJson,
    getData,
    getIamToken,
    checkEnvVariables
};
