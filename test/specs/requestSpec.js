import net from '../../src/net.js';

describe('Request', function() {
  describe('Headers', function() {
    var xhr, request, result;

    beforeEach(function() {
      xhr = sinon.useFakeXMLHttpRequest();
      xhr.onCreate = function(res) { result = res; };
    });

    afterEach(function() {
      xhr.restore();
    });

    request = new net.Request('get', '/');

    it('should add header', function() {
      request.setHeader('X-Requested-With', 'beejs-net');
      request.send();

      expect(result.requestHeaders['X-Requested-With']).to.eql('beejs-net');
    });
  });

  describe('Promise', function() {
    var server;

    beforeEach(function() {
      server = sinon.fakeServer.create();

      server.respondWith('GET', '/ok', [200, {}, 'Ok']);
      server.respondWith('GET', '/problem', [404, {}, 'Not found']);
      server.autoRespond = true;
    });

    afterEach(function() {
      server.restore();
    });

    it('should resolve when ok', function() {
      var request = new net.Request('get', '/ok');

      return expect(request.send()).to.be.fulfilled;
    });

    it('should resolve when status not ok', function() {
      var request = new net.Request('get', '/problem');

      return expect(request.send()).to.be.fulfilled;
    });

    it('should resolve 200 with result', function() {
      var request = new net.Request('get', '/ok'),
          promise = request.send();

      return promise.then(function(res) {
        expect(res.status).to.be.equal(200);
        expect(res.text).to.be.eql('Ok');
      });
    });

    it('should resolve 404 with result', function() {
      var request = new net.Request('get', '/problem'),
          promise = request.send();

      return promise.then(function(res) {
        expect(res.status).to.be.equal(404);
        expect(res.text).to.be.eql('Not found');
      });
    });
  });
});
