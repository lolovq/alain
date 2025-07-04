"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexService = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const algoliasearch_1 = require("algoliasearch");
admin.initializeApp();
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const ALGOLIA_INDEX_NAME = 'services';
const client = (0, algoliasearch_1.default)(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
const index = client.initIndex(ALGOLIA_INDEX_NAME);
// Helper function for retries with exponential backoff
async function retry(fn, retries = 3, delay = 1000) {
    try {
        return await fn();
    }
    catch (error) {
        if (retries > 0) {
            console.warn(`Retrying after error: ${error.message}. Retries left: ${retries}`);
            await new Promise(res => setTimeout(res, delay));
            return retry(fn, retries - 1, delay * 2);
        }
        else {
            throw error;
        }
    }
}
/**
 * Cloud Function to index service data in Algolia whenever a service document
 * is created, updated, or deleted in Firestore.
 */
exports.indexService = (0, firestore_1.onDocumentWritten)('services/{serviceId}', async (event) => {
    const change = event.data;
    const data = change === null || change === void 0 ? void 0 : change.after.data();
    const objectID = change === null || change === void 0 ? void 0 : change.after.id;
    if (!(change === null || change === void 0 ? void 0 : change.after.exists)) { // Document is deleted
        if (objectID) {
            console.log(`Deleting Algolia object: ${objectID}`);
            return retry(() => index.deleteObject(objectID));
        }
        return null;
    }
    else if (!change.before.exists) { // Document is new
        if (data && objectID) {
            console.log(`Saving new Algolia object: ${objectID}`);
            return retry(() => index.saveObject(Object.assign(Object.assign({}, data), { objectID })));
        }
        return null;
    }
    else { // Document is updated
        if (data && objectID) {
            console.log(`Updating Algolia object: ${objectID}`);
            return retry(() => index.partialUpdateObject(Object.assign(Object.assign({}, data), { objectID })));
        }
        return null;
    }
});
//# sourceMappingURL=algoliaSearch.js.map