"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processExpenseReceipt = void 0;
const storage_1 = require("firebase-functions/v2/storage");
const admin = require("firebase-admin");
const documentai_1 = require("@google-cloud/documentai");
admin.initializeApp();
// Initialize Document AI client
const client = new documentai_1.DocumentProcessorServiceClient();
// Configure these using Firebase CLI: firebase functions:config:set documentai.project_id="YOUR_GCP_PROJECT_ID" documentai.location="YOUR_PROCESSOR_LOCATION" documentai.processor_id="YOUR_PROCESSOR_ID"
const projectId = process.env.DOCUMENTAI_PROJECT_ID;
const location = process.env.DOCUMENTAI_LOCATION;
const processorId = process.env.DOCUMENTAI_PROCESSOR_ID;
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
 * Cloud Function to process expense receipts using Document AI.
 * Triggered when a new image is uploaded to Firebase Storage.
 */
exports.processExpenseReceipt = (0, storage_1.onObjectFinalized)(async (event) => {
    var _a, _b;
    const object = event.data;
    if (!(object === null || object === void 0 ? void 0 : object.name) || !(object === null || object === void 0 ? void 0 : object.bucket)) {
        return;
    }
    // Only process images in a specific folder (e.g., 'expense-receipts')
    if (!object.name.startsWith("expense-receipts/")) {
        return;
    }
    // Only process image files
    if (!((_a = object.contentType) === null || _a === void 0 ? void 0 : _a.startsWith("image/"))) {
        return;
    }
    const filePath = object.name;
    const bucketName = object.bucket;
    console.log(`Processing new expense receipt: gs://${bucketName}/${filePath}`);
    try {
        const [fileContents] = await admin.storage().bucket(bucketName).file(filePath).download();
        const encodedImage = Buffer.from(fileContents).toString("base64");
        const request = {
            name: `projects/${projectId}/locations/${location}/processors/${processorId}`,
            rawDocument: {
                content: encodedImage,
                mimeType: object.contentType,
            },
        };
        const [result] = await retry(() => client.processDocument(request), 5, 2000); // 5 retries, starting with 2s delay
        const document = result.document;
        if (!document || !document.entities) {
            console.warn("No entities found in the processed document.");
            return;
        }
        const expenseData = {};
        document.entities.forEach((entity) => {
            if (entity.type && entity.mentionText) {
                expenseData[entity.type] = entity.mentionText;
            }
        });
        // Save extracted data to Firestore
        await admin.firestore().collection("expenses").add({
            filePath: filePath,
            bucketName: bucketName,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            extractedData: expenseData,
            userId: (_b = object.metadata) === null || _b === void 0 ? void 0 : _b.userId, // Assuming you set custom metadata for the user who uploaded
        });
        console.log(`Successfully processed ${filePath} and saved data to Firestore.`);
    }
    catch (error) {
        console.error(`Error processing expense receipt ${filePath}:`, error);
    }
});
//# sourceMappingURL=processExpenseReceipt.js.map