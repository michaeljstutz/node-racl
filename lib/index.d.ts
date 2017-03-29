declare module 'racl/index' {
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
	    private _index;
	    private _variations;
	    private _config;
	    constructor(config?: ConfigInterface);
	    addStatement(statement: StatmentInterface): void;
	    add(effect: string, resource: string | Array<string>, action: string | Array<string>): void;
	    remove(effect: string, resource: string | Array<string>, action?: string | Array<string>): void;
	    allow(resource: string | Array<string>, action: string | Array<string>): void;
	    deny(resource: string | Array<string>, action: string | Array<string>): void;
	    isPermitted(resource: string | Array<string>, action: string | Array<string>): boolean;
	    serialize(): string;
	    deserialize(value: string): void;
	    getResourceVariation(resource: string): Array<string>;
	    getActionVariation(action: string): Array<string>;
	    private _isPermitted(resource, action);
	}
	export default Racl;

}
