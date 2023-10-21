'use strict';

// packages
const fs = require('fs');
const v4 = require('uuid');
const qs = require('querystring');

// common util

const common = require('../../helpers/common');
const { isEqual, size, get } = require('lodash');

// environment variables
const apiKey = process.env['IAM_API_KEY'];
const tokenURL = 'https://iam.cloud.ibm.com/identity/token';
const sccRegion = process.env['SCC_REGION'] || 'us-south';
const sccInstanceId = process.env['SCC_INSTANCE_ID'];
const sccBaseURL = `https://${sccRegion}.compliance.cloud.ibm.com/instances/${sccInstanceId}/v3`
const rulesType = process.env['npm_config_rule_type'] || 'all';

let rulesList = [];

const getRules = async (startToken) => {
    let rulesUrl = `${sccBaseURL}/rules?limit=200`;

    // get based on type provided
    if (rulesType === 'custom') {
        rulesUrl += `&type=user_defined`
    } else if (rulesType === 'predefined') {
        rulesUrl += `&type=system_defined`
    }


    if (!isEqual(rulesType, 'all') && !isEqual(rulesType, 'custom') && !isEqual(rulesType, 'predefined')) {
        console.log('ERROR: Unsupported rule type was provided.Please use one of these "custom" or "predefined" or "all"');
        return { error: 'Unsupported rule type was provided. Please use one of these "custom" or "predefined" or "all" ' };
    }


    // get next page if token is present 
    if (startToken) {
        rulesUrl += `&start=${startToken}`;
    }

    const payload = {
        grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
        apikey: apiKey
    };
    const tokenOpts = {
        url: tokenURL,
        body: qs.stringify(payload),
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    return common.getData(tokenOpts, (data, err) => {
        if (!err) {
            const options = {
                url: rulesUrl,
                method: 'GET',
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'Accept-Language': 'en',
                    'X-Correlation-ID': v4,
                    Authorization: data.access_token
                },
                json: true
            };

            const fileName = rulesType.replace(/[^a-z]/g, "-");
            const filePath = `./output/get-${fileName}-rules.json`;

            return common.getData(options, (rulesData, rulesError) => {
                if (!rulesError) {
                    rulesList = rulesList.concat(get(rulesData, 'rules', []));
                    if (get(rulesData, 'next.start', null)) {
                        getRules(rulesData.next.start);
                    } else {
                        const finalData = JSON.stringify({ total_count: size(rulesList), rules: rulesList }, null, 2);
                        console.log('=============START Details==================');
                        console.log('Total rules count: ', size(rulesList));
                        console.log('Type of rules in the response: ', rulesType);
                        fs.writeFile(filePath, finalData, (err) => {
                            if (err) throw err;
                            console.log('Data written to file at ', filePath);
                            console.log('============END==================');
                        });
                    }
                }
            });
        }
        return err;
    })
}
common.checkEnvVariables(apiKey, sccRegion, sccInstanceId) && getRules();