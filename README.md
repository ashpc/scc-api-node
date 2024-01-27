
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

#### Steps to get Rules are listed below  <a id="rules"></a>

- To get list of all rules in the instance run `npm run get:rules`. The output is stored in the `output/rules` folder under this name `get-all-rules.json`
- To get list of all predefined rules in the instance run `npm run get:rules --rule_type=predefined`.  The output is stored in the `output/rules` folder under this name `get-predefined-rules.json`
- To get list of all custom rules in the instance run `npm run get:rules --rule_type=custom`.  The output is stored in the `output/rules` folder under this name `get-custom-rules.json`

---

#### Steps to get Profiles are listed below <a id="proifles"></a>

- To get list of all profiles in the instance run `npm run get:profiles`. The output is stored in the `output/profiles` folder under this name `get-all-profiles.json`
- To get list of all predefined profiles in the instance run `npm run get:profiles --profile_type=predefined`.  The output is stored in the `output/profiles` folder under this name `get-predefined-profiles.json`
- To get list of all custom profiles in the instance run `npm run get:profiles --profile_type=custom`.  The output is stored in the `output/profiles` folder under this name `get-custom-profiles.json`
- To get list of profiles in the instance grouped by environment then run `npm run get:profiles --profile_type=predefined --group_by_env=true`.  The output is stored in the `output/profiles/environments/<environment-name>` folder under this name `get-<profile-name>-<version>-details.json`

---

#### Steps to get Profile details are listed below <a id="profile-details"></a>

- To get a profile details in the instance run `npm run get:profileDetails --profile_id=<PROFILE_ID>`. Replace `<PROFILE_ID>` with the profile you need details for that can be found in `npm run get:profiles`.
- The JSON output is stored in the `output/profiles` folder under the name of the profile and version. For example if the Profile is IBM Cloud Framework for Financial Services version v1.5.0 the output will be in `./output/profiles/get-ibm-cloud-framework-for-financial-services-1.5.0-details.json`.
- This output has the following details
  - Full profile details under `profile_data`
  - Unique assessments under `unique_assessments`
  - Default parameters under `assessments_default_parameters`
- There are 3 CSV outputs generated
  - CSV that has Actual API response under `get-${fileName}-details-as-is.csv`
  - CSV that has Unique Assessments details under `get-${fileName}-assessments-details.csv` --> Most useful csv
  - CSV that has only parameter details under `get-${fileName}-parameters-details.csv`

---

#### Steps to get Billing details for a scan are listed below <a id="billing"></a>

- To get a billing details for a scan in the instance run `npm run get:BillingDetails --profile_id=<PROFILE_ID> --total_resources=<TOTAL_RESOURCES_COUNT> --scans_per_month=<SCANS_PER_MONTH>`.
  - Replace `<PROFILE_ID>` with the profile you need details for that can be found in `npm run get:profiles`.
  - Replace `<TOTAL_RESOURCES_COUNT>` with the number of resources you want to scan with SCC
  - Replace `<SCANS_PER_MONTH>` with the number of scans you will have per month
- This script will calculate the cost per scan based on the current cost per evaluation at $0.013(<https://cloud.ibm.com/catalog/services/security-and-compliance-center>) and based on the input provided.
- The JSON output is stored in the `output` folder under the name of the profile and version. For example if the Profile is IBM Cloud Framework for Financial Services version v1.5.0 the output will be in `./output/get-ibm-cloud-framework-for-financial-services-1.5.0-billing-details.json`.
  - This output has the following details
    - Full profile details under `profile_data`
    - Unique assessments under `unique_assessments`
- The cost is printed as well as stored in `./output/get-ibm-cloud-framework-for-financial-services-1.5.0-billing-details.txt`

Sample output: when we run `npm run get:BillingDetails --profile_id=01326738-c8ca-456f-8315-e4573f534869 --total_resources=100 --scans_per_month=2`

```
===============================
.... Billing Cost Calculation Assumptions ...
.... Assumption 1: total_resources are all the resources that are scanned by this profile ....
.... Assumption 2: all evaluations have compliant or not compliant only and no unable to perform ....
.... Assumption 3: individual resources cost is not included in this calculation ....
.................................................
....Cost per scan based on the formula: 0.013 * unique_assessments_count * total_resources ...
===============================
Profile name:  IBM Cloud Framework for Financial Services
Profile version:  1.5.0
Unique assessments count:  237
Total resources:  100
Total cost per Scan: $308.1
Scans per month:  2
Total cost per month: $616.2
```

---
