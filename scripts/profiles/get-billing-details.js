'use strict';

// packages
const fs = require('fs');
const v4 = require('uuid');
const qs = require('querystring');

// common util

const common = require('../../helpers/common');
const { isEmpty, uniqBy, size } = require('lodash');
const { getAllSpecifications, getAllAssessments, getAssessmentsControlsMapping, getAssessmentsParametersMapping, getDefaultParametersMapping } = require('../../helpers/utils');

// environment variables
const apiKey = process.env['IAM_API_KEY'];
const tokenURL = 'https://iam.cloud.ibm.com/identity/token';
const sccRegion = process.env['SCC_REGION'] || 'us-south';
const sccInstanceId = process.env['SCC_INSTANCE_ID'];
const sccBaseURL = `https://${sccRegion}.compliance.cloud.ibm.com/instances/${sccInstanceId}/v3`
const profileId = process.env['npm_config_profile_id'];
const totalResources = process.env['npm_config_total_resources'];
const noOfScans = process.env['npm_config_scans_per_month'];
const currentCost = 0.013;

const getBillingDetails = async () => {

    if (!isEmpty(profileId) && !isEmpty(totalResources) && !isEmpty(noOfScans)) {
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


                        let specifications = getAllSpecifications(profileData);
                        let assessments = getAssessmentsControlsMapping(specifications, getAllAssessments(specifications));


                        // add assessment details to parameters
                        let { defaultParameters, uniqueAssessments } = getDefaultParametersMapping(profileData.default_parameters, uniqBy(assessments, 'assessment_id'));
                        const uniqueComponents = uniqBy(assessments, 'component_name');
                        const uniqueAssessmentsCount = size(uniqueAssessments);

                        const parameterMapping = getAssessmentsParametersMapping(uniqueAssessments, defaultParameters)
                        let components = parameterMapping.components;
                        uniqueAssessments = parameterMapping.uniqueAssessments;


                        const costPerScan = currentCost * totalResources * uniqueAssessmentsCount;
                        const costPerMonth = costPerScan * noOfScans;

                        // file name creation
                        const profileName = profileData.profile_name;
                        const fileName = profileName.toLowerCase().replace(/\s+/g, "-") + '-' + profileData.profile_version;
                        const jsonFilePath = `./output/get-${fileName}-billing-details.json`;
                        const txtFilePath = `./output/get-${fileName}-billing-details.txt`;


                        console.log('===============================');
                        console.log('.... Billing Cost Calculation Assumptions ...');
                        console.log('.... Assumption 1: total_resources are all the resources that are scanned by this profile ....');
                        console.log('.... Assumption 2: all evaluations have  compliant or not compliant only and no unable to perform ....');
                        console.log('.... Assumption 3: individual resources cost is not included in this calculation ....');
                        console.log('.................................................');
                        console.log('....Cost per scan based on the formula: 0.013 * unique_assessments_count * total_resources ...');
                        console.log('===============================');

                        console.log('Profile name: ', profileName);
                        console.log('Profile version: ', profileData.profile_version);
                        console.log('Unique assessments count: ', uniqueAssessmentsCount);
                        console.log('Total resources: ', totalResources);
                        console.log('Total cost per Scan: $', costPerScan);
                        console.log('Scans per month: ', noOfScans);
                        console.log('Total cost per month: $', costPerMonth);



                        const data = {
                            profile_data: profileData,
                            unique_assessments: uniqueAssessments,
                            unique_assessments_count: size(uniqueAssessments),
                            unique_components: uniqBy(components, 'component_id'),
                            total_resources: totalResources,
                            cost_per_scan: costPerScan,
                            scans_per_month: noOfScans,
                            cost_per_month: costPerMonth
                        };
                        const finalData = JSON.stringify(data, null, 2);

                        console.log('===============================');
                        console.log('....Printing Output files Information...');
                        console.log('===============================');

                        var logger = fs.createWriteStream(txtFilePath, {})

                        logger.write('===============================' + '\n');
                        logger.write('.... Billing Cost Calculation Assumptions ...' + '\n');
                        logger.write('.... Assumption 1: total_resources are all the resources that are scanned by this profile ....' + '\n');
                        logger.write('.... Assumption 2: all evaluations have compliant or not compliant only and no unable to perform ....' + '\n');
                        logger.write('.... Assumption 3: individual resources cost is not included in this calculation ....' + '\n');
                        logger.write('.................................................' + '\n');
                        logger.write('....Cost per scan based on the formula: 0.013 * unique_assessments_count * total_resources ...' + '\n');
                        logger.write('===============================' + '\n');

                        logger.write('Profile name: ' + profileName + '\n');
                        logger.write('Profile version: ' + profileData.profile_version + '\n');
                        logger.write('Unique assessments count: ' + uniqueAssessmentsCount + '\n');
                        logger.write('Total resources: ' + totalResources + '\n');
                        logger.write('Total cost per Scan: $' + costPerScan + '\n');
                        logger.write('Scans per month: ' + noOfScans + '\n');
                        logger.write('Total cost per month: $' + costPerMonth + '\n');
                        console.log('Billing Data written to TXT file at ', txtFilePath);
                        logger.end() // close string

                        // writing to JSON
                        fs.writeFile(jsonFilePath, finalData, (err) => {
                            if (err) throw err;
                            console.log('JSON Data written to file at ', jsonFilePath);
                        });

                    }
                });
            }
            return err;
        });
    } else {
        isEmpty(profileId) && console.log('Profile ID missing please enter one using "npm run get:BillingDetails --profile_id=<ID> --total_resources=<count> --scans_per_month=<count>"');
        isEmpty(totalResources) && console.log('Total resources missing please enter one using "npm run get:BillingDetails --profile_id=<ID> --total_resources=<count> --scans_per_month=<count>"');
        isEmpty(noOfScans) && console.log('Scans per month is missing please enter one using "npm run get:BillingDetails --profile_id=<ID> --total_resources=<count> --scans_per_month=<count>"');

    }

}
common.checkEnvVariables(apiKey, sccRegion, sccInstanceId) && getBillingDetails();