import { expect } from 'chai';
import {
    addHighResTimes,
    highResTimeFromMilliseconds,
    highResTimeFromSeconds,
    highResTimeToMilliseconds,
    highResTimeToSeconds,
    subtractHighResTimes,
} from './HighResTime';

describe('HighResTime', () => {
    it('has highResTimeFromMilliseconds()', () => {
        expect(highResTimeFromMilliseconds(123510)).to.be.deep.equal([123, 510000000]);
    });

    it('has highResTimeFromSeconds()', () => {
        expect(highResTimeFromSeconds(123.51)).to.be.deep.equal([123, 510000000]);
    });

    it('has highResTimeToSeconds()', () => {
        expect(highResTimeToSeconds([123, 510000000])).to.be.deep.equal(123.51);
    });

    it('has highResTimeToMilliseconds()', () => {
        expect(highResTimeToMilliseconds([123, 510000000])).to.be.deep.equal(123510);
    });

    it('has addHighResTimes()', () => {
        expect(addHighResTimes([5, 999999990], [0, 20])).to.be.deep.equal([6, 10]);
    });

    it('has subtractHighResTimes()', () => {
        expect(subtractHighResTimes([6, 10], [0, 20])).to.be.deep.equal([5, 999999990]);
    });
});
