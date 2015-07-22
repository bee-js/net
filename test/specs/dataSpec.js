import net from '../../src/net.js';

describe('Data', function() {
  var xhr, request, result;

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
    request.set('one', 1).set({two: 2, three: 3});
    request.send();

    expect(result.url).to.be.eql('/?one=1&two=2&three=3');
  });

  it('should serialize POST data', function() {
    request = new net.Request('post', '/');
    request.set({one: 1, two: 2});
    request.send();

    expect(result.requestBody).to.be.eql({one: 1, two: 2});
  });

  it('should accept FormData', function() {
    let data = new FormData();
    data.append('one', 1);
    data.append('two', 2);

    request = new net.Request('post', '/');
    request.set(data);
    request.send();

    expect(result.requestBody).to.be.an.instanceof(FormData);
  });
});
