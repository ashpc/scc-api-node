'use strict';

// packages
const fs = require('fs');
const v4 = require('uuid');
const qs = require('querystring');

// common util

const common = require('../../helpers/common');
const { isEqual, size, get, map, groupBy, keys } = require('lodash');
const { getAllSpecifications } = require('../../helpers/utils');

// environment variables
const apiKey = process.env['IAM_API_KEY'];
const tokenURL = 'https://iam.cloud.ibm.com/identity/token';
const sccRegion = process.env['SCC_REGION'] || 'us-south';
const sccInstanceId = process.env['SCC_INSTANCE_ID'];
const sccBaseURL = `https://${sccRegion}.compliance.cloud.ibm.com/instances/${sccInstanceId}/v3`
const profilesType = process.env['npm_config_profile_type'] || 'all';
const groupByEnvironment = process.env['npm_config_group_by_env'];
const latest = process.env['npm_config_latest'];

let profilesList = [];

const getProfiles = async (startToken) => {
    let profilesUrl = `${sccBaseURL}/profiles?limit=200`;

    // get based on type provided
    if (profilesType === 'custom') {
        profilesUrl += `&profile_type=custom`
    } else if (profilesType === 'predefined') {
        profilesUrl += `&profile_type=predefined`
    }
    if (latest === 'true') {
        profilesUrl += '&latest=true';
    }


    if (!isEqual(profilesType, 'all') && !isEqual(profilesType, 'custom') && !isEqual(profilesType, 'predefined')) {
        console.log('ERROR: Unsupported rule type was provided.Please use one of these "custom" or "predefined" or "all"');
        return { error: 'Unsupported rule type was provided. Please use one of these "custom" or "predefined" or "all" ' };
    }


    // get next page if token is present 
    if (startToken) {
        profilesUrl += `&start=${startToken}`;
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
                url: profilesUrl,
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

            const fileName = profilesType.replace(/[^a-z]/g, "-");

            const folderName = './output/profiles';
            try {
                if (!fs.existsSync(folderName)) {
                    fs.mkdirSync(folderName);
                }
            } catch (err) {
                console.error(err);
            }
            const filePath = `${folderName}/get-${fileName}-profiles.json`;

            return common.getData(options, (profilesData, profilesError) => {
                if (!profilesError) {
                    profilesList = profilesList.concat(get(profilesData, 'profiles', []));
                    if (get(profilesData, 'next.start', null)) {
                        getProfiles(profilesData.next.start);
                    } else {
                        // Group by environment and store the output into right env folder
                        if (groupByEnvironment) {
                            map(profilesList, async (profile) => {
                                await common.getData({ ...options, url: `${sccBaseURL}/profiles/${profile.id}` }, (profileDetails, profileError) => {
                                    if (profileError) {
                                        console.log('Error in fetching profile details for ', profile.id);
                                    } else {
                                        // get environment from controlspec
                                        const envs = groupBy(getAllSpecifications(profileDetails), 'environment');
                                        profile.environments = keys(envs);

                                        // file name creation
                                        const profileName = profile.profile_name;
                                        const fileName = profileName.toLowerCase().replace(/\s+/g, "-") + '-' + profile.profile_version;
                                        const folderName = './output/profiles';
                                        const EnvfolderName = './output/profiles/environments';

                                        const IBMfolderName = './output/profiles/environments/ibm-cloud';
                                        const AWSfolderName = './output/profiles/environments/aws-cloud';
                                        const AZUREfolderName = './output/profiles/environments/azure-cloud';
                                        const OthersfolderName = './output/profiles/environments/others';

                                        try {
                                            if (!fs.existsSync(folderName)) {
                                                fs.mkdirSync(folderName);
                                            }
                                            if (!fs.existsSync(EnvfolderName)) {
                                                fs.mkdirSync(EnvfolderName);
                                            }
                                            if (!fs.existsSync(IBMfolderName)) {
                                                fs.mkdirSync(IBMfolderName);
                                            }
                                            if (!fs.existsSync(AWSfolderName)) {
                                                fs.mkdirSync(AWSfolderName);
                                            }
                                            if (!fs.existsSync(AZUREfolderName)) {
                                                fs.mkdirSync(AZUREfolderName);
                                            }
                                            if (!fs.existsSync(OthersfolderName)) {
                                                fs.mkdirSync(OthersfolderName);
                                            }
                                        } catch (err) {
                                            console.error(err);
                                        }
                                        const finalData = JSON.stringify(data, null, 2);
                                        // write into individual folders
                                        if (envs['ibm-cloud']) {
                                            const jsonFilePath = `${IBMfolderName}/get-${fileName}-details.json`;
                                            fs.writeFile(jsonFilePath, finalData, (err) => {
                                                if (err) throw err;
                                                console.log('JSON Data written to file at ', jsonFilePath);
                                            });
                                        } else if (envs['aws-cloud']) {
                                            const jsonFilePath = `${AWSfolderName}/get-${fileName}-details.json`;
                                            fs.writeFile(jsonFilePath, finalData, (err) => {
                                                if (err) throw err;
                                                console.log('JSON Data written to file at ', jsonFilePath);
                                            });
                                        } else if (envs['azure-cloud']) {
                                            const jsonFilePath = `${AZUREfolderName}/get-${fileName}-details.json`;
                                            fs.writeFile(jsonFilePath, finalData, (err) => {
                                                if (err) throw err;
                                                console.log('JSON Data written to file at ', jsonFilePath);
                                            });
                                        } else {
                                            const jsonFilePath = `${OthersfolderName}/get-${fileName}-details.json`;
                                            fs.writeFile(jsonFilePath, finalData, (err) => {
                                                if (err) throw err;
                                                console.log('JSON Data written to file at ', jsonFilePath);
                                            });
                                        }
                                    }
                                });
                            });
                        }

                        const finalData = JSON.stringify({ total_count: size(profilesList), profiles: profilesList }, null, 2);
                        console.log('=============START Details==================');
                        console.log('Total profiles count: ', size(profilesList));
                        console.log('Type of profiles in the response: ', profilesType);
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
common.checkEnvVariables(apiKey, sccRegion, sccInstanceId) && getProfiles();