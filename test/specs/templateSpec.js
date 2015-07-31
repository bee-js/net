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

  it('replaces one param', function() {
    request = new net.Request('get', '/users/{id}');
    request.set('id', 1);
    request.send();

    expect(result.url).to.be.eql('/users/1');
  });

  it('replaces multiple params', function() {
    request = new net.Request('get', '/news/{date_at}/{id}');
    request.set('id', 5);
    request.set('date_at', '08-2015');
    request.send();

    expect(result.url).to.be.eql('/news/08-2015/5');
  });

  it('handles params and data separately', function() {
    request = new net.Request('get', '/users/{id}');
    request.set('id', 1);
    request.set('show', 'name');
    request.send();

    expect(result.url).to.be.eql('/users/1?show=name');
  });
});
