import TimelineConverter from '../../../../src/dash/utils/TimelineConverter.js';
import ListSegmentsGetter from '../../../../src/dash/utils/ListSegmentsGetter.js';
import Constants from '../../../../src/streaming/constants/Constants.js';
import VoHelper from '../../helpers/VOHelper.js';
import {expect} from 'chai';

const segmentsList = {
    'Initialization': {
        'sourceURL': 'init.m4s'
    },
    'SegmentURL': [
        {
            'media': 'media1.m4s'
        },
        {
            'media': 'media2.m4s'
        },
        {
            'media': 'media3.m4s'
        },
        {
            'media': 'media4.m4s'
        },
        {
            'media': 'media5.m4s'
        }
    ],
    'presentationTimeOffset': 0,
    'timescale': 1,
    'duration': 10,
    'startNumber': 1
};

function createRepresentationMock() {
    const voHelper = new VoHelper();
    const representation = voHelper.getDummyRepresentation(Constants.VIDEO);
    representation.SegmentList = segmentsList;
    representation.adaptation.period.mpd.manifest.Period[0].AdaptationSet[0].Representation[0] = representation;
    representation.segmentDuration = 10;

    return representation;
}

describe('ListSegmentsGetter', () => {
    const context = {};
    const timelineConverter = TimelineConverter(context).getInstance();
    timelineConverter.initialize();

    const listSegmentsGetter = ListSegmentsGetter(context).create({
        timelineConverter: timelineConverter
    });

    it('should expose segments getter interface', () => {
        expect(listSegmentsGetter.getSegmentByIndex).to.exist; // jshint ignore:line
        expect(listSegmentsGetter.getSegmentByTime).to.exist; // jshint ignore:line
    });

    describe('initialization', () => {
        it('should throw an error if config object is not defined', function () {
            const getter = ListSegmentsGetter(context).create();
            expect(getter.getSegmentByIndex.bind(getter)).to.be.throw(Constants.MISSING_CONFIG_ERROR);
        });

        it('should throw an error if config object has not been properly passed', function () {
            const getter = ListSegmentsGetter(context).create({});
            expect(getter.getSegmentByIndex.bind(getter)).to.be.throw(Constants.MISSING_CONFIG_ERROR);
        });

        it('should throw an error if representation parameter has not been properly set', function () {
            const getter = ListSegmentsGetter(context).create({ timelineConverter: timelineConverter });
            const segment = getter.getSegmentByIndex();

            expect(segment).to.be.null; // jshint ignore:line
        });
    });

    describe('mediaFinishedInformation calculation', () => {
        it('should calculate the right number of segments', () => {
            const representation = createRepresentationMock();

            const mediaFinishedInformation = listSegmentsGetter.getMediaFinishedInformation(representation);
            expect(mediaFinishedInformation.numberOfSegments).to.equal(5);
        });

        it('mediaTimeOfLastSignaledSegments should be NaN', () => {
            const representation = createRepresentationMock();

            const mediaFinishedInformation = listSegmentsGetter.getMediaFinishedInformation(representation);
            expect(mediaFinishedInformation.mediaTimeOfLastSignaledSegment).to.be.NaN;
        });
    });

    describe('getSegmentByIndex', () => {
        it('should return segment given an index', () => {
            const representation = createRepresentationMock();

            let seg = listSegmentsGetter.getSegmentByIndex(representation, 0);
            expect(seg.index).to.equal(0);
            expect(seg.presentationStartTime).to.equal(0);
            expect(seg.duration).to.equal(10);

            seg = listSegmentsGetter.getSegmentByIndex(representation, 1);
            expect(seg.index).to.equal(1);
            expect(seg.presentationStartTime).to.equal(10);
            expect(seg.duration).to.equal(10);

            seg = listSegmentsGetter.getSegmentByIndex(representation, 2);
            expect(seg.index).to.equal(2);
            expect(seg.presentationStartTime).to.equal(20);
            expect(seg.duration).to.equal(10);
        });

        it('should return null if segment is out of range', () => {
            const representation = createRepresentationMock();

            let seg = listSegmentsGetter.getSegmentByIndex(representation, 10);
            expect(seg).to.be.null; // jshint ignore:line
        });
    });

    describe('getSegmentByTime', () => {
        it('should return null if segment duration is not defined', () => {
            const representation = createRepresentationMock();
            representation.segmentDuration = undefined;

            let seg = listSegmentsGetter.getSegmentByTime(representation, 0);
            expect(seg).to.be.null; // jshint ignore:line
        });

        it('should return segment by time', () => {
            const representation = createRepresentationMock();

            let seg = listSegmentsGetter.getSegmentByTime(representation, 0);
            expect(seg.index).to.equal(0);
            expect(seg.presentationStartTime).to.equal(0);
            expect(seg.duration).to.equal(10);

            seg = listSegmentsGetter.getSegmentByTime(representation, 22);
            expect(seg.index).to.equal(2);
            expect(seg.presentationStartTime).to.equal(20);
            expect(seg.duration).to.equal(10);

            seg = listSegmentsGetter.getSegmentByTime(representation, 32);
            expect(seg.index).to.equal(3);
            expect(seg.presentationStartTime).to.equal(30);
            expect(seg.duration).to.equal(10);
        });

        it('should return null if segment is out of range', () => {
            const representation = createRepresentationMock();

            let seg = listSegmentsGetter.getSegmentByTime(representation, 110);
            expect(seg).to.be.null; // jshint ignore:line
        });
    });
});
