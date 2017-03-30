"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const VARIATION_SPLITTER = ',';
class RACL {
    constructor(config = {}) {
        this._index = {
            allow: {},
            deny: {},
        };
        this._variations = {
            action: {},
        };
        this._config = _.defaultsDeep(config, {
            resource: {
                sections: [
                    {
                        name: 'resource',
                    }
                ],
                sectionCount: 1,
                sectionSeparator: ':',
                sectionVariationFormat: '/',
                wildcard: '*',
            },
            action: {
                sections: [
                    {
                        name: 'action',
                    }
                ],
                sectionCount: 1,
                sectionSeparator: ':',
                sectionVariationFormat: 'pascal',
                wildcard: '*',
            }
        });
        if (_.isArray(this._config.resource.sections))
            _.set(this._config, 'resource.sectionCount', this._config.resource.sections.length);
        if (_.isArray(this._config.action.sections))
            _.set(this._config, 'action.sectionCount', this._config.action.sections.length);
    }
    addStatement(statement) {
        if (_.isNil(statement))
            throw new Error('Missing require arg');
        if (!_.isArray(statement))
            statement = [statement];
        for (let i = 0, l = statement.length; i < l; i++) {
            // TODO: should we throw an error?
            // If we are missing any of the required fields skip
            if (!_.has(statement[i], 'effect') || !_.has(statement[i], 'resource') || !_.has(statement[i], 'action'))
                continue;
            this.add(statement[i].effect, statement[i].resource, statement[i].action);
        }
    }
    add(effect, resource, action) {
        // If we are missing any of the params throw error
        if (_.isNil(effect) || _.isNil(resource) || _.isNil(action))
            throw new Error('Missing required arg');
        if (!_.eq('allow', effect) && !_.eq('deny', effect))
            throw new Error('Invalid value for effect');
        // We need to know which effect tree to add the index to
        let effectTree = _.get(this._index, effect, this._index.deny);
        resource = (resource instanceof Array) ? resource : [resource];
        action = (action instanceof Array) ? action : [action];
        for (let i = 0, l = resource.length; i < l; i++) {
            let resourceValue = this._normalizeSections(resource[i], this._config.resource);
            if (!_.has(effectTree, [resourceValue]))
                _.set(effectTree, [resourceValue], action);
            else
                effectTree[resourceValue] = _.union(effectTree[resourceValue], action);
        }
    }
    // remove(effect: string, resource: string | Array<string>, action?: string | Array<string>): void {
    //   if (_.isNil(effect)||_.isNil(resource)) throw new Error('Missing required arg');
    //   // TODO: Need to add support
    // }
    allow(resource, action) {
        return this.add('allow', resource, action);
    }
    deny(resource, action) {
        return this.add('deny', resource, action);
    }
    isPermitted(resource, action) {
        let isArrayResource = (resource instanceof Array);
        let isArrayAction = (action instanceof Array);
        // Bypass all the loops if no arrays passed in (on 10k runs 2x as fast)
        if (!isArrayResource && !isArrayAction)
            return this._isPermitted(resource, action);
        if (!isArrayResource)
            resource = [resource];
        if (!isArrayAction)
            action = [action];
        for (let r = 0, rlen = resource.length; r < rlen; r++) {
            for (let a = 0, alen = action.length; a < alen; a++) {
                // First failure we return false
                if (!this._isPermitted(resource[r], action[a]))
                    return false;
            }
        }
        // We only return true if all tests passed
        return true;
    }
    serialize() {
        // TODO: need a browser safe hash lib
        // let hash = crypto.createHash('sha1');
        let indexJson = JSON.stringify(this._index);
        // hash.update(indexJson);
        let serializeObject = {
            index: this._index,
        };
        return JSON.stringify(serializeObject);
    }
    deserialize(value) {
        // TODO: import the stringified serializedObject and merge it into the _index
    }
    buildSectionVariation(sectionValue, configTree, section) {
        let format = _.get(configTree.section, section + '.variationFormat', configTree.sectionVariationFormat);
        // TODO: add more formats
        // TODO: use a diffrenct normalizing value, '-' will cause issues down the road
        let normalizeValue;
        let splitter = VARIATION_SPLITTER;
        let denormalizefunction = (values) => {
            return _.join(values, splitter);
        };
        switch (format) {
            case 'pascal':
                splitter = '-';
                normalizeValue = (_.kebabCase(sectionValue));
                denormalizefunction = values => {
                    return _.upperFirst(_.camelCase(_.join(values, '-')));
                };
                break;
            case 'kebab':
                splitter = '-';
                normalizeValue = sectionValue;
                denormalizefunction = values => {
                    return _.upperFirst(_.camelCase(_.join(values, '-')));
                };
                break;
            case ':':
                splitter = ':';
                normalizeValue = sectionValue;
                denormalizefunction = values => {
                    return _.join(values, ':');
                };
                break;
            case VARIATION_SPLITTER:
                normalizeValue = sectionValue;
                denormalizefunction = values => {
                    return _.join(values, splitter);
                };
                break;
            case '-':
                splitter = '-';
                normalizeValue = sectionValue;
                denormalizefunction = values => {
                    return _.join(values, '-');
                };
                break;
            case '/':
                splitter = '/';
                normalizeValue = sectionValue;
                denormalizefunction = values => {
                    return _.join(values, '/');
                };
                break;
            default:
                // If an unknown format is passed just return an array with a single value
                return [sectionValue];
        }
        let forwardValues = _.split(normalizeValue, splitter);
        let reverseValues = _.clone(forwardValues);
        let reverseVariations = [];
        let forwardVariations = [];
        let i = forwardValues.length;
        while (i--) {
            reverseValues.pop();
            forwardValues.shift();
            // If there is only one value left just exit loop early
            if (0 == i)
                continue;
            let forwardValue = configTree.wildcard + denormalizefunction(forwardValues);
            let reverseValue = denormalizefunction(reverseValues) + configTree.wildcard;
            forwardVariations.push(forwardValue);
            reverseVariations.push(reverseValue);
        }
        return _.concat([sectionValue], reverseVariations, forwardVariations, [configTree.wildcard]);
    }
    buildVariation(value, configTree) {
        if (_.isNil(value) || _.isNil(configTree))
            throw new Error('Missing required arg');
        let variationTree = Array(configTree.sectionCount);
        let variations = [];
        let sections = this._fillSectionsArray(_.split(value, configTree.sectionSeparator, configTree.sectionCount), configTree);
        let position = 0;
        let addVariations = (i, sectionValue, currentArray, useWildcard, sectionConfig) => {
            if (position) {
                let lastArray = variationTree[position - 1];
                for (let x = 0, l = lastArray.length; x < l; x++) {
                    if (1 != i)
                        currentArray.push(sectionValue + configTree.sectionSeparator + lastArray[x]);
                    else
                        variations.push(sectionValue + configTree.sectionSeparator + lastArray[x]);
                }
                if (useWildcard && !sectionConfig.hasVariation) {
                    for (let x = 0, l = lastArray.length; x < l; x++) {
                        if (1 != i)
                            currentArray.push(configTree.wildcard + configTree.sectionSeparator + lastArray[x]);
                        else
                            variations.push(configTree.wildcard + configTree.sectionSeparator + lastArray[x]);
                    }
                }
            }
            else {
                if (1 != i)
                    currentArray.push(sectionValue);
                else
                    variations.push(sectionValue);
                if (1 != i && useWildcard && !sectionConfig.hasVariation)
                    currentArray.push(configTree.wildcard);
                else if (useWildcard && !sectionConfig.hasVariation)
                    variations.push(configTree.wildcard);
            }
        };
        for (let i = sections.length; i > 0; --i) {
            let sectionValue = sections[i - 1];
            if ('' == sectionValue)
                sectionValue = configTree.wildcard;
            let sectionConfig = configTree.sections[i - 1];
            let currentArray = variationTree[position] = [];
            let useWildcard = (configTree.wildcard !== sectionValue && _.get(sectionConfig, 'useWildcard', false));
            let sectionVariation;
            if (sectionConfig.hasVariation)
                sectionVariation = this.buildSectionVariation(sectionValue, configTree, i);
            if (!sectionVariation) {
                addVariations(i, sectionValue, currentArray, useWildcard, sectionConfig);
            }
            else {
                for (let x = 0, l = sectionVariation.length; x < l; x++) {
                    addVariations(i, sectionVariation[x], currentArray, useWildcard, sectionConfig);
                }
            }
            position++;
        }
        return variations;
    }
    getResourceVariation(resource) {
        // TODO: can we cache the variations of a resource?
        return this.buildVariation(resource, this._config.resource);
    }
    getActionVariation(action) {
        // Because actions are fixed we can cache the variations we build
        let variations = _.get(this._variations.action, action, []);
        if (!_.isEmpty(variations))
            return variations;
        variations = this.buildVariation(action, this._config.action);
        _.set(this._variations.action, action, variations);
        return variations;
    }
    _fillSectionsArray(sections, configTree) {
        let fullSections = Array(configTree.sectionCount);
        _.fill(fullSections, configTree.wildcard);
        for (let x = 0, l = sections.length; x < l; x++) {
            if ('' != sections[x])
                fullSections[x] = sections[x];
        }
        return fullSections;
    }
    _normalizeSections(value, configTree) {
        if (1 == configTree.sectionCount)
            return value;
        let sections = this._fillSectionsArray(_.split(value, configTree.sectionSeparator, configTree.sectionCount), configTree);
        return _.join(sections, configTree.sectionSeparator);
    }
    _isActionFound(index, action) {
        let actionVariations = this.getActionVariation(action);
        for (let x = 0, l = actionVariations.length; x < l; x++) {
            if (_.indexOf(index, actionVariations[x]) >= 0)
                return true;
        }
        return false;
    }
    _isResouceActionCheck(index, resource, action) {
        if (_.has(index, [resource]) && this._isActionFound(index[resource], action))
            return true;
        return false;
    }
    _isPermitted(resource, action) {
        resource = this._normalizeSections(resource, this._config.resource);
        if (this._isResouceActionCheck(this._index.deny, resource, action))
            return false;
        if (this._isResouceActionCheck(this._index.allow, resource, action))
            return true;
        let resourceVariations = this.getResourceVariation(resource);
        resourceVariations.shift(); // We have already checked the base version of the resource
        for (let x = 0, l = resourceVariations.length; x < l; x++) {
            if (this._isResouceActionCheck(this._index.deny, resourceVariations[x], action))
                return false;
            if (this._isResouceActionCheck(this._index.allow, resourceVariations[x], action))
                return true;
        }
        return false;
    }
}
exports.RACL = RACL;
exports.default = RACL;
