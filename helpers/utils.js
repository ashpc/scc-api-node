'use strict';

const { isEmpty, flatten, map, size, filter, get, find, keys, mapKeys, isEqual, uniq } = require('lodash');

const getAllSpecifications = (profileData) => {
    console.log('...Flattening the Control Specifications');
    // getting list of specifications 
    const specifications = flatten(map(profileData.controls, (control) => {
        map(control.control_specifications, (specification) => {
            specification.control_name = control.control_name;
        })
        return [
            ...control.control_specifications,
        ];
    }));
    return specifications;
}

const getAllAssessments = (specifications) => {
    console.log('.....Flattening the Assessments');
    // getting list of assessments 
    const assessments = flatten(map(specifications, (specification) => (
        map(specification.assessments, (assessment) => ({
            component_id: specification.component_id,
            component_name: specification.component_name,
            controls: [specification.control_name],
            ...assessment
        }))
    )));
    return assessments;
}

const getAssessmentsControlsMapping = (specifications, assessments) => {
    console.log('........Mapping the controls to assessments');
    // getting controls for the assessments
    map(specifications, (controlSpecification) => {
        map(controlSpecification.assessments, (assessment) => {
            map(assessments, (evaluation) => {
                if (assessment.assessment_id === evaluation.assessment_id) {
                    // check if control is already added
                    const controlPresent = find(evaluation.control_details, { control_name: controlSpecification.control_name });
                    if (!isEmpty(evaluation.control_details)) {
                        isEmpty(controlPresent) && evaluation.control_details.push({ control_name: controlSpecification.control_name });
                    } else {
                        evaluation.control_details = [{
                            control_name: controlSpecification.control_name
                        }];
                    }
                }
                // list of unique control names only
                evaluation.controls = keys(mapKeys(evaluation.control_details, 'control_name'));
            });
        });
    });
    return assessments;
}

const getDefaultParametersMapping = (defaultParameters, uniqueAssessments) => {
    map(defaultParameters, (parameter) => {
        const assessments = filter(uniqueAssessments, { assessment_id: parameter.assessment_id });
        if (isEmpty(assessments)) {
            console.log('ERROR: Missing assessment');
        } else {
            // ideally 1 parameter per assessment but this will handle more than 1
            map(assessments, (assessment) => {
                if (isEqual(parameter.parameter_name, assessment.parameter_name)) {
                    parameter.component_id = get(assessment, 'component_id', null);
                    parameter.component_name = get(assessment, 'component_name', null);
                    parameter.assessment_description = get(assessment, 'assessment_description', null);
                    parameter.assessment_type = get(assessment, 'assessment_type', null);
                }
            });

        }
    });
    return { defaultParameters, uniqueAssessments };
}


const getAssessmentsParametersMapping = (uniqueAssessments, defaultParameters) => {
    let components = [];
    console.log('..............Mapping the parameters values to assessments');
    // add parameter details to assessments
    map(uniqueAssessments, (assessment) => {
        delete assessment.control_details;
        if (isEmpty(components)) {
            components = [{ component_id: assessment.component_id, controls: assessment.controls }]
        } else {
            components.push({ component_id: assessment.component_id, controls: assessment.controls });
        }
        if (!isEmpty(assessment.parameters)) {
            map(assessment.parameters, (assessmentParameter) => {
                const parameters = filter(defaultParameters, { parameter_name: get(assessmentParameter, 'parameter_name', null) });
                if (isEmpty(parameters)) {
                    console.log('ERROR: Missing parameter');
                } else {
                    map(parameters, (parameter) => {
                        if (parameter.parameter_name === assessmentParameter.parameter_name) {
                            assessmentParameter.parameter_default_value = parameter.parameter_default_value;
                        }
                    });
                }
            });
        }
        // get components to controls mapping 
        map(components, (component) => {
            if (component.component_id === assessment.component_id) {
                component.controls = uniq(component.controls.concat(assessment.controls))
                component.controls_count = size(component.controls);
            }
        });
    });

    return { uniqueAssessments, components };
}

module.exports = {
    getAllAssessments,
    getAllSpecifications,
    getAssessmentsControlsMapping,
    getAssessmentsParametersMapping,
    getDefaultParametersMapping
};
