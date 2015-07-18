var mock    = require('mock-fs')
  , chai = require('chai')
  , chaiAsPromised = require('chai-as-promised')

  ,	functions 	= require('../functions.js')

  , mockFileList = []
  ;

beforeEach(function() {
  chai.should();
  chai.use(chaiAsPromised);

  mock({
    'valid-json.json': '{ "id" : 1, "content" : "foo" }',
    'invalid-json.json': 'file contents',
    'mixed-directory': {
      'valid.json': '{ "id" : 1, "content" : "foo" }',
      'valid2.json': '{ "id" : 1, "content" : "foo" }',
      'not-valid-2.xml': '{ "id" : 1, "content" : "foo" }'
    },
    'empty-directory': {}
  });

  mockFileList = [
    'mixed-directory/valid.json',
    'mixed-directory/valid2.json'
  ]
});


describe('read file json', function() {
  it('should get id property from a valid file json', function() {
    return functions.readJSONFile("valid-json.json").should.eventually.to.be.instanceof(Object).and.have.property('id').and.equal(1);
  });
  it('should get content property from a valid file json', function() {
    return functions.readJSONFile("valid-json.json").should.eventually.to.be.instanceof(Object).and.have.property('content').and.equal('foo');
  });
  it('should throws error reading an invalid file json', function() {
    return functions.readJSONFile("invalid-json.json").should.be.rejected;
  });
  it('should throws error reading a non existing file', function() {
    return functions.readJSONFile("no-exists.json").should.be.rejected;
  });
});

describe('read directory', function(){
  it('should be an array with length 2', function() {
    return functions.readDir("mixed-directory", ".json").should.eventually.to.be.instanceof(Array).and.have.length('2');
  });
  it('should be an empty array', function() {
    return functions.readDir("empty-directory", ".json").should.eventually.to.be.instanceof(Array).and.be.empty;
  });
  it('should throws error reading a non existing file', function() {
    return functions.readJSONFile("no-exists").should.be.rejected;
  });
});

describe('merge content of files in one array', function(){
  it('should be an array with length 2', function() {
    return functions.pushContentFiles(mockFileList).should.eventually.to.be.instanceof(Array).and.have.length(2);
  });
});

afterEach(mock.restore);