'use strict';

const expect = require('chai').expect;
const RACL = require('../lib/').default;
const _ = require('lodash');
const uuidV4 = require('uuid/v4');
const fs = require('fs');

let testIds = _.times(100000, uuidV4);
let testRacl = {};

let raclConfig = {
  resource: {
    sections: [
      {
        name: 'a',
        useWildcard: false,
      },
      {
        name: 'b',
        useWildcard: true,
      },
      {
        name: 'c',
        useWildcard: true,
      },
      {
        name: 'd',
        useWildcard: true,
      },
      {
        name: 'e',
        useWildcard: true,
      }
    ]
  },
  action: {
    sections: [
      {
        name: 'a',
        useWildcard: true,
      },
      {
        name: 'b',
        hasVariation: true,
      }
    ]
  }
};


describe('Testing: RACL', function() {
  it('RACL should be a class', function(){
    expect(RACL).to.be.a.class;
  });
  it('new RACL should create a new object', function(){
    let racl = new RACL();
    expect(racl).to.be.a.class;
  });
  _.forEach([10,100,1000,10000], value=>{
    it('racl.serialize() x'+value, ()=>{
      let racl = new RACL();
      for (let i = 0, len = value; i < len; i++) {
        let effect = (i % 2 == 0) ? 'allow' : 'deny';
        racl.add(effect, testIds[i], 'action');
      }
      let serialized = racl.serialize();
      //fs.writeFileSync('./test.json', racl.serialize())
    });
  });
});

describe('Testing racl.getResourceVariation(\'a:b:c:d:SampleValue\')', function() {

  let grvResults = [
    "a:b:c:d:SampleValue",
    "a:b:c:d:*",
    "a:b:c:*:SampleValue",
    "a:b:c:*:*",
    "a:b:*:d:SampleValue",
    "a:b:*:d:*",
    "a:b:*:*:SampleValue",
    "a:b:*:*:*",
    "a:*:c:d:SampleValue",
    "a:*:c:d:*",
    "a:*:c:*:SampleValue",
    "a:*:c:*:*",
    "a:*:*:d:SampleValue",
    "a:*:*:d:*",
    "a:*:*:*:SampleValue",
    "a:*:*:*:*"
  ];

  _.forEach([10,100,1000,10000], value=>{
    it('Speed test x'+value, function(){
      let racl = new RACL(raclConfig);
      let test;
      for (let i = 0, len = value; i < len; i++) {
        test = racl.getResourceVariation('a:b:c:d:SampleValue');
      }
      // console.log(JSON.stringify(test, null, 2));
      expect(test).to.eql(grvResults);
    });
  });

});

describe('Testing racl.getActionVariation(\'a:TestingSampleValue\')', function() {

  let gavResults = [
    "a:TestingSampleValue",
    "a:TestingSample*",
    "a:Testing*",
    "a:*SampleValue",
    "a:*Value",
    "a:*",
    "*:TestingSampleValue",
    "*:TestingSample*",
    "*:Testing*",
    "*:*SampleValue",
    "*:*Value",
    "*:*"
  ];

  _.forEach([10,100,1000,10000], value=>{
    it('Speed test x'+value, function(){
      let racl = new RACL(raclConfig);
      let test;
      for (let i = 0, len = value; i < len; i++) {
        test = racl.getActionVariation('a:TestingSampleValue');
      }
      // console.log(JSON.stringify(test, null, 2));
      expect(test).to.eql(gavResults);
    });
  });

});
  
describe('Testing: RACL', function() {
  _.forEach([10,100,1000,10000], value=>{
    it('racl.add({effect}, {resource}, {action}) x'+value, ()=>{
      testRacl[value] = new RACL();
      for (let i = 0, len = value; i < len; i++) {
        let effect = (i % 2 == 0) ? 'allow' : 'deny';
        testRacl[value].add(effect, testIds[i], 'action');
      }
    });
    it('racl.can({resource}, {action}) x'+value, ()=>{
      let results;
      for (let i = 0, len = value; i < len; i++) {
        let effect = (i % 2 == 0) ? 'allow' : 'deny';
        results = testRacl[value].isPermitted(testIds[i], 'action');
        if ('allow' == effect) expect(results).to.equal(true);
        else if ('deny' == effect) expect(results).to.equal(false);
      }
    });
  });
});

describe('Testing racl.isPermitted', function() {
  it('racl.allow(\'a:b:c:d:e\', \'a:SomethingTest\')', function(){
    let racl = new RACL(raclConfig);
    racl.allow('a:b:c:d:e', 'a:SomethingTest');
    let results = racl.isPermitted('a:b:c:d:e', 'a:SomethingTest');
    expect(results).to.equal(true);
  });
  it('racl.allow(\'a:*:c:d:e\', \'a:*Test\')', function(){
    let racl = new RACL(raclConfig);
    racl.allow('a:*:c:d:e', 'a:*Test');
    let results = racl.isPermitted('a:b:c:d:e', 'a:SomethingTest');
    expect(results).to.equal(true);
  });
  it('racl.allow(\'a:b:c::e\', \'a:Something*\')', function(){
    let racl = new RACL(raclConfig);
    racl.allow('a:b:c::e', 'a:Something*');
    let results = racl.isPermitted('a:b:c::e', 'a:SomethingTest');
    expect(results).to.equal(true);
  });
  it('racl.allow(\'a:*\', \'a:Something*\')', function(){
    let racl = new RACL(raclConfig);
    racl.allow('a:*', 'a:Something*');
    let results = racl.isPermitted('a:b:c:d', 'a:SomethingTest');
    expect(results).to.equal(true);
  });
});
