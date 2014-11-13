define(['bee/net'], function(net) {
  describe('Response', function() {
    var xhr, request, response;

    beforeEach(function() {
      xhr = new sinon.FakeXMLHttpRequest();
      xhr.open();
    });

    describe('metadata', function() {
      beforeEach(function() {
        request  = { xhr: xhr }; // Stub

        xhr.respond(200);
        response = new net.Response(xhr, request);
      });

      it('should inject original request', function() {
        expect(response.request).to.be.eql(request);
      });

      it('should inject original xhr object', function() {
        expect(response.xhr).to.be.eql(xhr);
      });
    });

    describe('status', function() {
      describe('type', function() {
        it('info', function() {
          xhr.respond(101);
          response = new net.Response(xhr);

          expect(response.status).to.be.eql(101);
          expect(response.statusText).to.be.eql('Switching Protocols');

          expect(response.info).to.be.true;
          expect(response.success).to.be.false;
          expect(response.redirect).to.be.false;
          expect(response.clientError).to.be.false;
          expect(response.serverError).to.be.false;

          expect(response.error).to.be.false;

          expect(response.statusType).to.be.eql('info');
        });

        it('success', function() {
          xhr.respond(201);
          response = new net.Response(xhr);

          expect(response.status).to.be.eql(201);
          expect(response.statusText).to.be.eql('Created');

          expect(response.info).to.be.false;
          expect(response.success).to.be.true;
          expect(response.redirect).to.be.false;
          expect(response.clientError).to.be.false;
          expect(response.serverError).to.be.false;

          expect(response.error).to.be.false;

          expect(response.statusType).to.be.eql('success');
        });

        it('redirect', function() {
          xhr.respond(302);
          response = new net.Response(xhr);

          expect(response.status).to.be.eql(302);
          expect(response.statusText).to.be.eql('Found');

          expect(response.info).to.be.false;
          expect(response.success).to.be.false;
          expect(response.redirect).to.be.true;
          expect(response.clientError).to.be.false;
          expect(response.serverError).to.be.false;

          expect(response.error).to.be.false;

          expect(response.statusType).to.be.eql('redirect');
        });

        it('clientError', function() {
          xhr.respond(404);
          response = new net.Response(xhr);

          expect(response.status).to.be.eql(404);
          expect(response.statusText).to.be.eql('Not Found');

          expect(response.info).to.be.false;
          expect(response.success).to.be.false;
          expect(response.redirect).to.be.false;
          expect(response.clientError).to.be.true;
          expect(response.serverError).to.be.false;

          expect(response.error).to.be.true;

          expect(response.statusType).to.be.eql('clientError');
        });

        it('clientError', function() {
          xhr.respond(502);
          response = new net.Response(xhr);

          expect(response.status).to.be.eql(502);
          expect(response.statusText).to.be.eql('Bad Gateway');

          expect(response.info).to.be.false;
          expect(response.success).to.be.false;
          expect(response.redirect).to.be.false;
          expect(response.clientError).to.be.false;
          expect(response.serverError).to.be.true;

          expect(response.error).to.be.true;

          expect(response.statusType).to.be.eql('serverError');
        });
      });
    });

    describe('headers', function() {
      beforeEach(function() {
        xhr.respond(200, { 'Content-Type': 'application/json', 'X-Custom-Header': 'somedata' });
        response = new net.Response(xhr);
      });

      it('should get headers case-insensitive', function() {
        expect(response.getHeader('x-custom-header')).to.be.eql('somedata');
        expect(response.getHeader('x-Custom-hEader')).to.be.eql('somedata');
      });

      it('should get response headers', function() {
        expect(response.headers['Content-Type']).to.be.eql('application/json');
        expect(response.headers['X-Custom-Header']).to.be.eql('somedata');
      });

      it('should get Content-Type', function() {
        expect(response.contentType).to.be.eql('application/json');
      });

      it('should get type', function() {
        expect(response.type).to.be.eql('json');
      });
    });

    describe('data', function() {
      it('should contains response text', function() {
        xhr.respond(200, { 'Content-Type': 'text/plain' }, 'Hello!');
        response = new net.Response(xhr);

        expect(response.text).to.be.eql('Hello!');
      });

      it('should parse JSON', function() {
        xhr.respond(200, { 'Content-Type': 'application/json' }, '{"name": "Andrey"}');
        response = new net.Response(xhr);

        expect(response.json).to.be.eql({ name: 'Andrey' });
        expect(response.body).to.be.eql({ name: 'Andrey' });
        expect(response.text).to.be.eql('{"name": "Andrey"}');
      });
    });

  });
});
