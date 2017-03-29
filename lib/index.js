"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const crypto = require("crypto");
class Racl {
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
                ]
            },
            action: {
                sections: [
                    {
                        name: 'action',
                    }
                ]
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
        _.forEach(statement, item => {
            this.add(item.effect, item.resource, item.action);
        });
    }
    add(effect, resource, action) {
        // If we are missing any of the params throw error
        if (_.isNil(effect) || _.isNil(resource) || _.isNil(action))
            throw new Error('Missing require arg');
        if (!_.eq('allow', effect) && !_.eq('deny', effect))
            throw new Error('Invalid value for effect');
        // We need to know which effect tree to add the index to
        let effectTree = _.get(this._index, effect, this._index.deny);
        resource = _.isArray(resource) ? resource : [resource];
        action = _.isArray(action) ? action : [action];
        _.forEach(resource, item => {
            if (!_.has(effectTree, item))
                _.set(effectTree, item, action);
            else
                effectTree[item] = _.union(effectTree[item], action);
        });
    }
    remove(effect, resource, action) {
        if (_.isNil(effect) || _.isNil(resource))
            throw new Error('Missing require arg');
    }
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
        for (var r = 0, rlen = resource.length; r < rlen; r++) {
            for (var a = 0, alen = action.length; a < alen; a++) {
                // First failure we return false
                if (!this._isPermitted(resource[r], action[a]))
                    return false;
            }
        }
        // We only return true if all tests passed
        return true;
    }
    serialize() {
        let hash = crypto.createHash('sha1');
        let indexJson = JSON.stringify(this._index);
        hash.update(indexJson);
        let serializeObject = {
            index: this._index,
            checksum: hash.digest('hex'),
        };
        return JSON.stringify(serializeObject);
    }
    deserialize(value) {
        // Something
    }
    getResourceVariation(resource) {
        // TODO: can we cache the variations of a resource?
        return [];
    }
    getActionVariation(action) {
        // Because actions are fixed we can cache the variations we build
        let variations = _.get(this._variations.action, action, []);
        if (!_.isEmpty(variations))
            return variations;
        // Loop through the config settings for the action to build the variations
        return variations;
    }
    _isPermitted(resource, action) {
        return false;
    }
}
exports.Racl = Racl;
exports.default = Racl;
