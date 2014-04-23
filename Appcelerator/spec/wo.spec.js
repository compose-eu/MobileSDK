
describe('WebObject', function() {

    var compose = require('../index');
    compose.setup("dummy");
    
    var wo = compose.WebObject;
    
    var smartphoneDefinition = require('./smartphone').definition;
    var smartphoneWo;

    var wo_def = {
        name: "wo-test-1",
        description: "My test WO"
    };
    var woTest;

    var _size = function(obj) {
        var count = 0;
        for(var i in obj) count++;
        return count;
    };

    it('Create empty WO', function() {
        woTest = wo.create(wo_def);
        expect(woTest.name).toEqual(wo_def.name);
    });

    it('Create empty WO', function() {
        var woTest = wo.create(wo_def);
        expect(woTest.name).toEqual(wo_def.name);
    });

    it('Create Smartphone WO', function() {
        smartphoneWo = wo.create(smartphoneDefinition);
        expect(smartphoneWo.description).toEqual(smartphoneDefinition.description);
    });

    it('Check WO streams', function() {
        expect(smartphoneWo.getStreams().size())
            .toEqual(_size(smartphoneDefinition.streams));
    });

    it('Add a stream', function() {

        smartphoneWo.addStream("battery", {
            description: "Report the battery level of the phone",
            type: "sensor"
        }).addChannel({
                level: {
                    unit: "percentage",
                    type: "numeric"
                }
            });

        expect(smartphoneWo.getStream("battery").getChannel('level').unit)
            .toEqual("percentage");

    });

    it('Check WO `location` stream channels', function() {
        expect(smartphoneWo.getStream('location').channels.size())
            .toEqual(_size(smartphoneDefinition.streams.location.channels));
    });

    it('Check WO actions', function() {
        var smartphoneWo = wo.create(smartphoneDefinition);
        expect(smartphoneWo.getActions().size())
            .toEqual(smartphoneDefinition.actions.length);
    });

});