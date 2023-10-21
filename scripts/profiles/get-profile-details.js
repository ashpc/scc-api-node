'use strict';

// packages
const fs = require('fs');
const v4 = require('uuid');
const qs = require('querystring');
let converter = require('json-2-csv');

// common util

const common = require('../../helpers/common');
const { isEmpty, flatten, map, uniqBy, size, filter, get } = require('lodash');

// environment variables
const apiKey = process.env['IAM_API_KEY'];
const tokenURL = 'https://iam.cloud.ibm.com/identity/token';
const sccRegion = process.env['SCC_REGION'] || 'us-south';
const sccInstanceId = process.env['SCC_INSTANCE_ID'];
const sccBaseURL = `https://${sccRegion}.compliance.cloud.ibm.com/instances/${sccInstanceId}/v3`
const profileId = process.env['npm_config_profile_id'];



const getProfileDetails = async () => {

    if (!isEmpty(profileId)) {
        let profilesUrl = `${sccBaseURL}/profiles/${profileId}`;
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

                return common.getData(options, (profileData, profileError) => {
                    if (!profileError) {

                        // getting list of specifications 
                        const specifications = flatten(map(profileData.controls, (control) => ([
                            ...control.control_specifications
                        ])));

                        // getting list of assessments 
                        const assessments = flatten(map(specifications, (specification) => (
                            map(specification.assessments, (assessment) => ({
                                component_id: specification.component_id,
                                component_name: specification.component_name,
                                ...assessment
                            }))
                        )));

                        // add assessment details to parameters
                        const uniqueAssessments = uniqBy(assessments, 'assessment_id');
                        const defaultParameters = profileData.default_parameters;

                        map(defaultParameters, (parameter) => {
                            const assessment = filter(uniqueAssessments, { assessment_id: parameter.assessment_id });
                            if (isEmpty(assessment)) {
                                console.log('ERROR: Missing assessment');
                            } else {
                                parameter.component_id = get(assessment, '[0].component_id');
                                parameter.component_name = get(assessment, '[0].component_name');
                                parameter.assessment_description = get(assessment, '[0].assessment_description');
                                parameter.assessment_type = get(assessment, '[0].assessment_type');
                            }
                        });

                        // add parameter details to assessments
                        map(uniqueAssessments, (assessment) => {
                            if (!isEmpty(assessment.parameters)) {
                                const parameter = filter(defaultParameters, { parameter_name: get(assessment, 'parameters[0].parameter_name', null) });
                                if (isEmpty(parameter)) {
                                    console.log('ERROR: Missing parameter');
                                } else {
                                    assessment.parameters[0].parameter_default_value = get(parameter, '[0].parameter_default_value');
                                }
                            }
                        });

                        // file name creation
                        const profileName = profileData.profile_name;
                        const fileName = profileName.toLowerCase().replace(/[^a-z]/g, "-") + '-' + profileData.profile_version;
                        const jsonFilePath = `./output/get-${fileName}-details.json`;
                        const csvAsIsFilePath = `./output/get-${fileName}-details-as-is.csv`;
                        const csvAssessmentsFilePath = `./output/get-${fileName}-assessments-details.csv`;
                        const csvParametersFilePath = `./output/get-${fileName}-parameters-details.csv`;




                        console.log('=============START==================');
                        console.log('Profile name: ', profileName);
                        console.log('Profile version: ', profileData.profile_version);
                        console.log('Controls count: ', profileData.controls_count);
                        console.log('Total assessments count: ', size(assessments));
                        console.log('Unique assessments count: ', size(uniqueAssessments));
                        console.log('Assessments with parameters count: ', size(uniqBy(defaultParameters, 'assessment_id')));

                        const data = {
                            profile_data: profileData,
                            unique_assessments: uniqueAssessments,
                            controls_count: profileData.controls_count,
                            assessments_count: size(assessments),
                            unique_assessments_count: size(uniqueAssessments),
                            assessments_default_parameters: profileData.default_parameters
                        };
                        const finalData = JSON.stringify(data, null, 2);


                        // writing to JSON
                        fs.writeFile(jsonFilePath, finalData, (err) => {
                            if (err) throw err;
                            console.log('JSON Data written to file at ', jsonFilePath);
                        });

                        // api response as is in CSV
                        converter.json2csv(profileData)
                            .then((csv) => {
                                fs.writeFile(csvAsIsFilePath, csv, (err) => {
                                    if (err) throw err;
                                    console.log('API response as in CSV Data written to file at ', csvAsIsFilePath);
                                });
                            })
                            .catch((err) => console.log('ERROR in profileData: ' + err.message));

                        // writing uniqueAssessments to CSV

                        converter.json2csv(uniqueAssessments)
                            .then((csv) => {
                                fs.writeFile(csvAssessmentsFilePath, csv, (err) => {
                                    if (err) throw err;
                                    console.log('uniqueAssessments CSV Data written to file at ', csvAssessmentsFilePath);
                                });
                            })
                            .catch((err) => console.log('ERROR in uniqueAssessments : ' + err.message));

                        // writing parameters to CSV

                        converter.json2csv(profileData.default_parameters)
                            .then((csv) => {
                                fs.writeFile(csvParametersFilePath, csv, (err) => {
                                    if (err) throw err;
                                    console.log('default_parameters CSV Data written to file at ', csvParametersFilePath);
                                });
                            })
                            .catch((err) => console.log('ERROR in default_parameters: ' + err.message));


                    }
                });
            }
            return err;
        });
    } else {
        console.log('Profile ID missing please enter one using "npm run get:profileDetails --profile_id=<ID>"');
    }

}
common.checkEnvVariables(apiKey, sccRegion, sccInstanceId) && getProfileDetails();