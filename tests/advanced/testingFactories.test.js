const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');
const emailSender = require('../../src/advanced/emailSender');
const emailProvider = require('../../src/advanced/emailProvider');

// Import the sinonChai plugin to make stub assertions
chai.use(sinonChai);
// Import the chaiAsPromised plugin to make promise assertions
chai.use(chaiAsPromised);

const { expect } = chai;

describe('Testing factoriess suite', () => {
  // It's very common to see Node libraries that uses the factory pattern
  // and sometimes we need to ensure that the functions that are generated
  // by these factories are receiving the right parameters.
  // In this case we want to test the sendEmail function that is generated by
  // the createInstance factory

  before(() => {
    // First we need to mock the factory creation method emailProvider.createInstance
    // because we can't mock the sendEmail method directly
    this.createInstanceStub = sinon.stub(emailProvider, 'createInstance');

    // To record the calls to the sendEmail, we will use this spy
    this.sendEmailSpy = sinon.spy();
  });

  afterEach(() => {
    // We use the resetHistory after each test to clean the spy records
    this.sendEmailSpy.resetHistory();
  });

  after(() => {
    this.createInstanceStub.restore();
  });

  it('Should call the send email twice with different destinations', async () => {
    // Arrange
    // Now we have to make the factory mock return the same structure as the real implementation
    // but, the sendEmail function will be replaced by our spy
    this.createInstanceStub.returns({
      sendEmail: this.sendEmailSpy,
    });

    const sender = 'me@email.com';
    const dest1 = 'some@email.com';
    const dest2 = 'another@email.com';
    const message = 'Hello !';

    // Act
    // Now we call the method beeing tested emailSender.send, and assert
    // that the sendEmail function inside there is receiving the right values
    await emailSender.send(dest1, sender, message);
    await emailSender.send(dest2, sender, message);

    // Assert
    // We can validate how many times the spy was called
    expect(this.sendEmailSpy).callCount(2);

    // and can make more assertions on the spys, see the Sinon spy doc
    // https://sinonjs.org/releases/v12.0.1/spies/
    expect(this.sendEmailSpy.lastCall.args).to.deep.equal([dest2, sender, message]);
    expect(this.sendEmailSpy.alwaysCalledWithMatch([sender, message]));
  });

  it('Should throw an error if sendEmail fails', async () => {
    // Arrange
    // Now we want to make the sendEmail reject the promise
    this.createInstanceStub.returns({
      sendEmail: () => Promise.reject(),
    });

    // Act - Assert
    // Calling the emailSender.send will throw an error now
    await expect(emailSender.send('error', 'me@email.com', 'Some message')).rejectedWith('Failed to send email');
  });
});