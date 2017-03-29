'use strict';

const expect = require('chai').expect;
const RACL = require('../lib/').default;
const _ = require('lodash');
const uuidV4 = require('uuid/v4');
const fs = require('fs');

let testIds = _.times(100000, uuidV4);
let testRacl = {};

describe('Testing: RACL', function() {
  it('RACL should be a class', function(){
    expect(RACL).to.be.a.class;
  });
  it('new RACL should create a new object', function(){
    let racl = new RACL();
    expect(racl).to.be.a.class;
  });
  it('racl.serialize() x1000', ()=>{
    let racl = new RACL();
    for (var i = 0, len = 1000; i < len; i++) {
      let effect = (i % 2 == 0) ? 'allow' : 'deny';
      racl.add(effect, testIds[i], 'action');
    }
    let serialized = racl.serialize();
    //fs.writeFileSync('./test.json', racl.serialize())
  });
  _.forEach([1,10,100,1000,10000,100000], value=>{
    it('racl.add({effect}, {resource}, {action}) x'+value, ()=>{
      testRacl[value] = new RACL();
      for (var i = 0, len = value; i < len; i++) {
        let effect = (i % 2 == 0) ? 'allow' : 'deny';
        testRacl[value].add(effect, testIds[i], 'action');
      }
    });
    it('racl.can({resource}, {action}) x'+value, ()=>{
      let results;
      for (var i = 0, len = value; i < len; i++) {
        testRacl[value].isPermitted(testIds[i], 'action');
      }
    });
  });
});
  