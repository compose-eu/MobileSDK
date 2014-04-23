
describe('ServiceObject', function() {

    var compose = require("../index").setup({
//        debug: true,
        apiKey: "ODc1Nzc3ZTgtMGMxZS00YTYxLTg3ZjItMzJmOTY0YTJlYjdkNzg0NWMwNzYtNTVkYy00NzkwLThhZTItNDI2NTM1MzJjNzUx",
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

//    it('Update SO [not implemented yet in backend]', function(done) {
//        smartphone.getStream('location').addChannel("test", "numeric", "time");
//        smartphone.update()
//            .then(function(so) {
//                expect(so.getStreams().size()).toEqual(smartphone.getStreams().size());
//                done();
//            })
//            .catch(function() {
//                expect(error.code).toEqual(405);
//                done();
//            });
//    });

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
                        .then(function(data) {

                            var record = data[data.length-1];

                            expect(record.lastUpdate)
                                        .toEqual(pushData.lastUpdate);

                            expect(record.channels.latitude['current-value'])
                                        .toEqual(pushData.channels.latitude['current-value']);

                            done();
                        })
                        .catch(function(e) { catchError(e); done(); });

                }, 2500);

            })
            .catch(function(e) { catchError(e); done(); });

    });

});