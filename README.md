
#### Running the Security and Compliance Center APIs using node scripts

This repo will have scripts to get entities using the SCC APIs that can be found in <https://cloud.ibm.com/apidocs/security-compliance>.

**Steps to use this script are listed below**

- Clone the repo
- Run `npm install`
- Set the following environment variables
  - `IAM_API_KEY` IAM API key that has access to make SCC API calls
  - `SCC_REGION` Region of the SCC instance to get the rules from. Default is set to `us-south`
  - `SCC_INSTANCE_ID` SCC instance ID to get the rules from.

---
**Steps to get Rules are listed below**

- To get list of all rules in the instance run `npm run get:rules`. The output is stored in the `output` folder under this name `get-all-rules.json`
- To get list of all predefined rules in the instance run `npm run get:rules --rule_type=system_defined`.  The output is stored in the `output` folder under this name `get-system-defined-rules.json`
- To get list of all custom rules in the instance run `npm run get:rules --rule_type=user_defined`.  The output is stored in the `output` folder under this name `get-user-defined-rules.json`

---
**Steps to get Profiles are listed below**

- To get list of all profiles in the instance run `npm run get:profiles`. The output is stored in the `output` folder under this name `get-all-profiles.json`
- To get list of all predefined profiles in the instance run `npm run get:profiles --profile_type=system_defined`.  The output is stored in the `output` folder under this name `get-system-defined-profiles.json`
- To get list of all custom profiles in the instance run `npm run get:profiles --profile_type=user_defined`.  The output is stored in the `output` folder under this name `get-user-defined-profiles.json`

---

**Steps to get Profile details are listed below**

- To get a profile details in the instance run `npm run get:profileDetails --profile_id=<PROFILE_ID>`. Replace `<PROFILE_ID>` with the profile you need details for that can be found in `npm run get:profiles`. - The JSON output is stored in the `output` folder under the name of the profile and version. For example if the Profile is IBM Cloud Framework for Financial Services version v1.5.0 the output will be in `./output/get-ibm-cloud-framework-for-financial-services-1.5.0-details.json`.
  - This output has the following details
    - Full profile details under `profile_data`
    - Unique assessments under `unique_assessments`
    - Default parameters under `assessments_default_parameters`
- There are 3 CSV outputs generated
  - CSV that has Actual API response under `get-${fileName}-details-as-is.csv`
  - CSV that has Unique Assessments details under `get-${fileName}-assessments-details.csv` --> Most useful csv
  - CSV that has only parameter details under `get-${fileName}-parameters-details.csv`

---
