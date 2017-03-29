import * as _ from 'lodash';
import * as crypto from 'crypto'

export interface ConfigInterface {

}

export interface StatmentInterface {

}

export interface RaclInterface {
  isPermitted(resource: string | Array<string>, action: string | Array<string>): boolean;
  add(effect: string, resource: string | Array<string>, action: string | Array<string>): void;
  remove(effect: string, resource: string | Array<string>, action?: string | Array<string>): void;
  addStatement(statement: StatmentInterface): void;
  allow(resource: string | Array<string>, action: string | Array<string>): void;
  deny(resource: string | Array<string>, action: string | Array<string>): void;
}

export class Racl implements RaclInterface {
  
  private _index: any = {
    allow: {},
    deny: {},
  }

  private _variations: any = {
    action: {},
  }

  private _config: any;

  constructor(config: ConfigInterface = {}) {
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
    if (_.isArray(this._config.resource.sections)) _.set(this._config, 'resource.sectionCount', this._config.resource.sections.length);
    if (_.isArray(this._config.action.sections)) _.set(this._config, 'action.sectionCount', this._config.action.sections.length);
  }

  addStatement(statement: StatmentInterface): void {
    if (_.isNil(statement)) throw new Error('Missing require arg');
    if (!_.isArray(statement)) statement = [statement];
    _.forEach(statement, item=>{
      this.add(item.effect, item.resource, item.action);
    });
  }

  add(effect: string, resource: string | Array<string>, action: string | Array<string>): void {   
    // If we are missing any of the params throw error
    if (_.isNil(effect)||_.isNil(resource)||_.isNil(action)) throw new Error('Missing require arg');
    if (!_.eq('allow', effect)&&!_.eq('deny', effect)) throw new Error('Invalid value for effect');

    // We need to know which effect tree to add the index to
    let effectTree = _.get(this._index, effect, this._index.deny);
    resource = _.isArray(resource) ? resource : [resource];
    action = _.isArray(action) ? action : [action];
    _.forEach(resource, item=>{
      if (!_.has(effectTree, item)) _.set(effectTree, item, action);
      else effectTree[item] = _.union(effectTree[item], action);
    });
  }

  remove(effect: string, resource: string | Array<string>, action?: string | Array<string>): void {
    if (_.isNil(effect)||_.isNil(resource)) throw new Error('Missing require arg');
  }

  allow(resource: string | Array<string>, action: string | Array<string>): void {
    return this.add('allow', resource, action);
  }
  
  deny(resource: string | Array<string>, action: string | Array<string>): void {
    return this.add('deny', resource, action);
  }

  isPermitted(resource: string | Array<string>, action: string | Array<string>): boolean {
    let isArrayResource = (resource instanceof Array);
    let isArrayAction = (action instanceof Array);

    // Bypass all the loops if no arrays passed in (on 10k runs 2x as fast)
    if (!isArrayResource&&!isArrayAction) return this._isPermitted(<string>resource, <string>action);

    if (!isArrayResource) resource = [<string>resource];
    if (!isArrayAction) action = [<string>action];
    for (var r = 0, rlen = resource.length; r < rlen; r++) {
      for (var a = 0, alen = action.length; a < alen; a++) {
        // First failure we return false
        if (!this._isPermitted(resource[r], action[a])) return false;
      }
    }
    // We only return true if all tests passed
    return true;
  }

  serialize(): string {
    let hash = crypto.createHash('sha1');
    let indexJson = JSON.stringify(this._index);
    hash.update(indexJson);
    
    let serializeObject = {
      index:this._index,
      checksum:hash.digest('hex'),
    }

    return JSON.stringify(serializeObject);
  }

  deserialize(value: string): void {
    // Something
  }

  getResourceVariation(resource: string): Array<string> {
    // TODO: can we cache the variations of a resource?
    return [];
  }

  getActionVariation(action: string): Array<string> {
    // Because actions are fixed we can cache the variations we build
    let variations = _.get(this._variations.action, action, []);
    if (!_.isEmpty(variations)) return variations;

    // Loop through the config settings for the action to build the variations

    return variations;
  }

  private _isPermitted(resource: string, action: string): boolean {
    return false;
  }

}

export default Racl;
