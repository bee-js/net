import net from '../../src/net.js';

describe('Options', function() {
  var xhr, request, result;

  beforeEach(function() {
    xhr = sinon.useFakeXMLHttpRequest();
    xhr.onCreate = function(res) { result = res; };
  });

  afterEach(function() {
    xhr.restore();
  });

  describe('async', function() {
    it('should be async by default', function() {
      request = new net.Request('get', '/');
      request.send();

      expect(result.async).to.be.true;
    });

    it('should be sync if option set to false', function() {
      request = new net.Request('get', '/');
      request.setOption('async', false);
      request.send();

      expect(result.async).to.be.false;
    });

    it('should have alias function', function() {
      request = new net.Request('get', '/');
      request.async(false);
      request.send();

      expect(result.async).to.be.false;
    });
  });

  describe('timeout', function() {
    it('should set timeout and add event listener', function() {
      request = new net.Request('get', '/');
      request.timeout(100);
      request.send();

      expect(result.timeout).to.be.equal(100);
      expect(result.eventListeners).to.have.property('timeout');
    });
  });

  describe('type', function() {
    it('urlencoded by default', function() {
      request = new net.Request('post', '/');
      request.set('one', 1).set('two', 2);
      request.send();

      expect(result.requestBody).to.be.eql('one=1&two=2');
    });

    it('json', function() {
      request = new net.Request('post', '/');
      request.set('one', 1).set('two', 2);
      request.type('json');
      request.send();

      expect(result.requestHeaders['Content-Type']).to.have.string('application/json');
      expect(result.requestBody).to.be.eql('{"one":1,"two":2}');
    });

    it('content-type', function() {
      request = new net.Request('post', '/');
      request.set('{"one":1,"two":2}');
      request.type('application/json');
      request.send();

      expect(result.requestHeaders['Content-Type']).to.have.string('application/json');
      expect(result.requestBody).to.be.eql('{"one":1,"two":2}');
    });
  });

  describe('expect', function() {
    it('sets responseType for xhr if applicable', function() {
      request = new net.Request('post', '/');
      request.expect('blob');
      request.send();

      expect(result.responseType).to.be.eql('blob');
    });

    it('does not set responseType for xhr if not applicable', function() {
      request = new net.Request('post', '/');
      request.expect('json');
      request.send();

      expect(result.responseType).to.not.be.eql('json');
    });

    it('forces expected type', function() {
      request = new net.Request('post', '/');
      request.expect('json');
      request.send();

      result.respond(200, { 'Content-Type': 'text/plain' }, '{"one":1,"two":2}');

      let res = new net.Response(result, request);
      expect(res.body.one).to.be.eql(1);
    });
  });
});
