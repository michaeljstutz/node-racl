declare module 'racl/index' {
	export interface RACLInterface {
	    isPermitted(resource: string | Array<string>, action: string | Array<string>): boolean;
	    add(effect: string, resource: string | Array<string>, action: string | Array<string>): void;
	    addStatement(statement: any | Array<any>): void;
	    allow(resource: string | Array<string>, action: string | Array<string>): void;
	    deny(resource: string | Array<string>, action: string | Array<string>): void;
	}
	export class RACL implements RACLInterface {
	    private _index;
	    private _variations;
	    private _config;
	    constructor(config?: any);
	    addStatement(statement: any | Array<any>): void;
	    add(effect: string, resource: string | Array<string>, action: string | Array<string>): void;
	    allow(resource: string | Array<string>, action: string | Array<string>): void;
	    deny(resource: string | Array<string>, action: string | Array<string>): void;
	    isPermitted(resource: string | Array<string>, action: string | Array<string>): boolean;
	    serialize(): string;
	    deserialize(value: string): void;
	    buildSectionVariation(sectionValue: string, configTree: any, section: number): Array<string>;
	    buildVariation(value: string, configTree: any): Array<string>;
	    getResourceVariation(resource: string): Array<string>;
	    getActionVariation(action: string): Array<string>;
	    private _fillSectionsArray(sections, configTree);
	    private _normalizeSections(value, configTree);
	    private _isActionFound(index, action);
	    private _isResouceActionCheck(index, resource, action);
	    private _isPermitted(resource, action);
	}
	export default RACL;

}
