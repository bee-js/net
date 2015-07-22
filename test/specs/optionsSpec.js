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
});
