
describe('ServiceObject', function() {

    var compose = require("../index").setup({
//        debug: true,
//        apiKey: "NTEzOGQ1OGYtYjc2Ni00M2MxLTllZDEtYzAyNmQyM2E2YWU2Yzk0ZDYyNzItZGQ3MS00YzQwLWJlYjUtZDM4ZTkyNjEwYTU2",
        apiKey: "M2UxYTFmNzQtZDZhYi00ZTNiLWEzZWUtYzdjMTU1MzJhMDE1ZTdlYWRiYzQtMmU2ZS00YTk5LTgyNGQtZDU3YzkzOWQwYzQw",
        url: "http://192.168.9.243:8080",
        transport: 'http'
    });


    var smartphone = null;
    var smartphoneDefinition = require('./smartphone.2').definition;

    var _size = function(obj) {
        var count = 0;
        for(var i in obj) count++;
        return count;
    };

    // @todo handle better this
    var catchError = function(error) {
        console.log("\n\n", error ,"\n\n");
    };

    it('Create SO', function(done) {
        compose.create(smartphoneDefinition)
            .then(function(so) {
                expect((so.id)).toBeTruthy();
                smartphone = so;
                done();
            })
            .catch(function(e) { catchError(e); done(); });
    });

    it('Load SO', function(done) {
        compose.load(smartphone.id)
            .then(function(so) {
                expect(so.id).toEqual(smartphone.id);
                done();
            })
            .catch(function(e) { catchError(e); done(); });
    });

    it('List SO', function(done) {
        compose.list()
            .then(function(list) {
                expect(list.length > 0).toBeTruthy();
                done();
            })
            .catch(function(e) { catchError(e); done(); });
    });

    it('Update SO custom fields', function(done) {
        var time = new Date().getTime();
        smartphone.customFields.newTestField = time;
        smartphone.update()
            .then(function(so) {
                expect(smartphone.customFields.newTestField).toEqual(time);
                done();
            })
            .catch(function(e) { catchError(e); done(); });
    });

    it('Push and pull stream data', function(done) {

        var stream = smartphone.getStream('location');
        var raw = {
            latitude: 11.123,
            longitude: 45.321
        };

        stream.setValue(raw);
        var pushData = stream.getCurrentValue();

        expect(raw.latitude).toEqual(stream.getValue('latitude'));

        stream.push()
            .then(function() {

                setTimeout(function() {

                    stream.pull('lastUpdate')
                        .then(function(data, raw) {

                            var record = data.last();

                            expect(record.lastUpdate)
                                        .toEqual(pushData.lastUpdate);

                            expect(record.get("latitude"))
                                        .toEqual(pushData.channels.latitude['current-value']);

                            done();
                        })
                        .catch(function(e) { catchError(e); done(); });

                }, 2500);

            })
            .catch(function(e) { catchError(e); done(); });

    });

    it('Search by text', function(done) {

        var teststream = smartphone.getStream('testsuite');

        var __then = function() {
            teststream.searchByText("text", "Lorem")
                .then(function(data) {

                    console.log(data);
                    expect(so.id).toEqual(null);
                    done();
                })
                .catch(function(e) { catchError(e); done(); });
        };

        teststream.push({
            text: "ipsum eidam Lorem ",
            location: [46.123, 12.321],
            number: Math.round()
        }).then(function(){

            teststream.push({
                text: "ipsum eidam",
                location: [55.123, 33.321],
                number: -1
            }).then(function(){

                teststream.push({
                    text: "Lorem ipsum eidam dolet",
                    location: [45.123, 11.321],
                    number: Math.round()
                }).then(function() {
                    __then();
                });

            });
        });
    });

    it('Delete SO', function(done) {
        smartphone.delete()
            .then(function(so) {
                expect(so.id).toEqual(null);
                done();
            })
            .catch(function(e) { catchError(e); done(); });
    });

});