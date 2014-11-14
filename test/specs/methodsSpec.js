define(['bee/net'], function(net) {
  describe('HTTP methods', function() {
    var xhr, request, result;

    beforeEach(function() {
      xhr = sinon.useFakeXMLHttpRequest();
      xhr.onCreate = function(res) { result = res; };
    });

    afterEach(function() {
      xhr.restore();
    });

    it('should send GET requests', function() {
      request = new net.Request('get', '/');
      request.send();

      expect(result.method).to.be.equal('GET');
      expect(result.url).to.be.equal('/');
    });

    it('should send POST requests', function() {
      request = new net.Request('post', '/');
      request.send();

      expect(result.method).to.be.equal('POST');
      expect(result.url).to.be.equal('/');
    });

    it('should send PUT requests', function() {
      request = new net.Request('put', '/');
      request.send();

      expect(result.method).to.be.equal('PUT');
      expect(result.url).to.be.equal('/');
    });

    it('should send PATCH requests', function() {
      request = new net.Request('patch', '/');
      request.send();

      expect(result.method).to.be.equal('PATCH');
      expect(result.url).to.be.equal('/');
    });

    it('should send DELETE requests', function() {
      request = new net.Request('delete', '/');
      request.send();

      expect(result.method).to.be.equal('DELETE');
      expect(result.url).to.be.equal('/');
    });
  });

});
