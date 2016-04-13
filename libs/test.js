var chai = require('chai');
var redis = require('redis');
var should  = chai.should();

describe('Testing db', function(){
	var dbClient;
	before(function(){
		dbClient = redis.createClient();
		dbClient.keys('*', function(err, keys){
			keys.forEach(function(x){dbClient.del(x);});
		});
		testArray = ['aaa', 'bbb', 'ccc', 'ddd'];
		testArray.forEach(function(x){
			dbClient.set(testArray.indexOf(x).toString(), x);
		});
	});

	after(function(){
		dbClient.keys('*', function(err, keys){
			keys.forEach(function(x){dbClient.del(x);});
		});
	});

	describe('#keys()', function(){
		it('length', function(done){
			dbClient.keys('*', function(err, keys){
				keys.should.have.length(4);
				done();
			});
		});
		it('should have zero length on nonexistent key', function(done){
			dbClient.keys('eee', function(err, keys){
				keys.should.have.length(0);
				done();
			});
		});
		it('should return existed key', function(done){
			dbClient.keys('0', function(err, keys){
				keys.should.have.length(1);
				keys[0].should.equal('0');
				done();
			});
		});
	});

	describe('#get()', function(){
		it('get nonexistent key', function(done){
			dbClient.get('aaa', function(err, value){
				chai.assert.equal(value, null, 'value equal null');
				done();
			});
		});

		it('get actual value', function(done){
			dbClient.get('1', function(err, value){
				value.should.equal('bbb');
				done();
			});
		});

	});
});

