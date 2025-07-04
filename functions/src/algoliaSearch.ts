import { onDocumentWritten, Change, FirestoreEvent, DocumentSnapshot } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import algoliasearch from 'algoliasearch';

admin.initializeApp();

const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID as string;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY as string;
const ALGOLIA_INDEX_NAME = 'services';

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
const index = client.initIndex(ALGOLIA_INDEX_NAME);

// Helper function for retries with exponential backoff
async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`Retrying after error: ${error.message}. Retries left: ${retries}`);
      await new Promise(res => setTimeout(res, delay));
      return retry(fn, retries - 1, delay * 2);
    } else {
      throw error;
    }
  }
}

/**
 * Cloud Function to index service data in Algolia whenever a service document
 * is created, updated, or deleted in Firestore.
 */
export const indexService = onDocumentWritten('services/{serviceId}', async (event: FirestoreEvent<Change<DocumentSnapshot> | undefined>) => {
    const change = event.data;
    const data = change?.after.data();
    const objectID = change?.after.id;

    if (!change?.after.exists) { // Document is deleted
      if (objectID) {
        console.log(`Deleting Algolia object: ${objectID}`);
        return retry(() => index.deleteObject(objectID));
      }
      return null;
    } else if (!change.before.exists) { // Document is new
      if (data && objectID) {
        console.log(`Saving new Algolia object: ${objectID}`);
        return retry(() => index.saveObject({ ...data, objectID }));
      }
      return null;
    } else { // Document is updated
      if (data && objectID) {
        console.log(`Updating Algolia object: ${objectID}`);
        return retry(() => index.partialUpdateObject({ ...data, objectID }));
      }
      return null;
    }
  });
