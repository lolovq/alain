import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as firebaseFunctionsTest from 'firebase-functions-test';
import * as sinon from 'sinon';
import { createUserProfile } from '../../src/auth/userManagement';

// Initialize firebase-functions-test
const test = firebaseFunctionsTest();

// Mock admin.initializeApp
const stubInitializeApp = sinon.stub(admin, 'initializeApp');

describe('createUserProfile', () => {
  let adminInitStub: sinon.SinonStub;
  let firestoreStub: sinon.SinonStub;

  before(() => {
    // Stub admin.initializeApp() before any functions are loaded
    adminInitStub = sinon.stub(admin, 'initializeApp');
  });

  after(() => {
    // Restore admin.initializeApp() after all tests are done
    adminInitStub.restore();
    test.cleanup();
  });

  beforeEach(() => {
    // Stub Firestore methods
    firestoreStub = sinon.stub(admin, 'firestore');
    firestoreStub.returns({
      collection: sinon.stub().returns({
        doc: sinon.stub().returns({
          set: sinon.stub().resolves(true),
        }),
      }),
    });
  });

  afterEach(() => {
    // Restore Firestore stubs
    firestoreStub.restore();
  });

  it('should create a user profile in Firestore when a new user is created', async () => {
    const user = {
      uid: 'testUserId',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'http://example.com/photo.jpg',
    };

    const wrapped = test.wrap(createUserProfile);
    await wrapped(user);

    // Assert that admin.firestore().collection('users').doc(user.uid).set() was called with the correct data
    sinon.assert.calledWith(
      firestoreStub().collection('users').doc(user.uid).set,
      sinon.match({
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: sinon.match.any,
      })
    );
  });
});
