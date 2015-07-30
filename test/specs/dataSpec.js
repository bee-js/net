import net from '../../src/net.js';

describe('Data', function() {
  let xhr, request, result;

  beforeEach(function() {
    xhr = sinon.useFakeXMLHttpRequest();
    xhr.onCreate = function(res) { result = res; };
  });

  afterEach(function() {
    xhr.restore();
  });

  it('should serialize GET data', function() {
    request = new net.Request('get', '/');
    request.set('one', 1).set('two', 2);
    request.send();

    expect(result.url).to.be.eql('/?one=1&two=2');
  });

  it('allows multi-assign', function() {
    request = new net.Request('get', '/');
    request.set({one: 1, two: 2});
    request.send();

    expect(result.url).to.be.eql('/?one=1&two=2');
  });

  it('should merge data', function() {
    request = new net.Request('get', '/');
    request.set('one', 1).set({ two: 2, three: 3 });
    request.send();

    expect(result.url).to.be.eql('/?one=1&two=2&three=3');
  });

  it('can be a plain text', function() {
    request = new net.Request('post', '/');
    request.set('Hello server');
    request.send();

    expect(result.requestBody).to.be.eql('Hello server');
  });

  it('should serialize POST data', function() {
    request = new net.Request('post', '/');
    request.set({ one: 1, two: 2 });
    request.send();

    expect(result.requestBody).to.be.eql('one=1&two=2');
  });

  it('should accept FormData', function() {
    let data = new FormData();
    data.append('one', 1);

    request = new net.Request('post', '/');
    request.set(data);
    request.send();

    expect(result.requestBody).to.be.an.instanceof(FormData);
  });

  it('should accept ArrayBuffer', function() {
    let buf = new Uint8Array([1, 2]).buffer;

    request = new net.Request('post', '/');
    request.set(buf);
    request.send();

    expect(result.requestBody).to.be.an.instanceof(ArrayBuffer);
  });

  it('should accept ArrayBuffer as value', function() {
    let buf = new Uint8Array([1, 2]).buffer;

    request = new net.Request('post', '/');
    request.set('data', buf);
    request.send();

    expect(result.requestBody).to.be.an.instanceof(FormData);
  });

  // Blob is pending because of Phantomjs < 2 bug
  xit('should accept Blob', function() {
    let blob = new Blob();

    request = new net.Request('post', '/');
    request.set(blob);
    request.send();

    expect(result.requestBody).to.be.an.instanceof(Blob);
  });

  xit('should accept Blob as value', function() {
    let blob = new Blob();

    request = new net.Request('post', '/');
    request.set('file', blob);
    request.send();

    expect(result.requestBody).to.be.an.instanceof(FormData);
  });
});
