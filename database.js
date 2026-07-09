// ==========================================================================
// APEX INFRASTRUCTURE ERP - LOCAL DATABASE ENGINE (IndexedDB)
// ==========================================================================

const DB_NAME = "ApexERP_CoreDB";
const DB_VERSION = 1;
let db;

/**
 * Database Initialize aur Setup karne ka function
 * Ye function Promises use karta hai taaki data fetch hone tak app wait kare.
 */
const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // Agar database pehli baar ban raha hai ya version update ho raha hai
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            console.log("Apex ERP Database Upgrade/Creation Started...");

            // 1. Tenders & G-Schedule Store
            if (!db.objectStoreNames.contains('Tender_Projects')) {
                const tenderStore = db.createObjectStore('Tender_Projects', { keyPath: 'id', autoIncrement: true });
                tenderStore.createIndex('tender_name', 'tender_name', { unique: false });
                tenderStore.createIndex('status', 'status', { unique: false }); // Active, Completed, Pending
            }

            // 2. Funds, EMD & BG Tracker Store
            if (!db.objectStoreNames.contains('Funds_Legal')) {
                const fundStore = db.createObjectStore('Funds_Legal', { keyPath: 'id', autoIncrement: true });
                fundStore.createIndex('type', 'type', { unique: false }); // EMD, SD, BG
                fundStore.createIndex('maturity_date', 'maturity_date', { unique: false });
            }

            // 3. Site Operations & Logs Store
            if (!db.objectStoreNames.contains('Site_Logs')) {
                const siteStore = db.createObjectStore('Site_Logs', { keyPath: 'id', autoIncrement: true });
                siteStore.createIndex('date', 'date', { unique: false });
                siteStore.createIndex('project_id', 'project_id', { unique: false });
            }

            // 4. Master Rate Card (Cement, Steel, etc.)
            if (!db.objectStoreNames.contains('Master_Rates')) {
                db.createObjectStore('Master_Rates', { keyPath: 'item_code' });
            }
        };

        // Agar database successfully open ho gaya
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log("Apex ERP Database Initialized Successfully!");
            resolve(db);
        };

        // Agar koi error aaye
        request.onerror = (event) => {
            console.error("Database Error: ", event.target.error);
            reject(event.target.error);
        };
    });
};

// ==========================================================================
// UNIVERSAL CRUD OPERATIONS (Create, Read, Update, Delete)
// ==========================================================================

const ApexDB = {
    // Naya record add karna (Jaise naya Tender ya Site Log)
    add: async (storeName, data) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // ID ke basis par ek specific record nikalna
    get: async (storeName, id) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Ek Table (Store) ka saara data nikalna
    getAll: async (storeName) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Kisi existing record ko update karna (Jaise Rate change karna)
    update: async (storeName, data) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.put(data); // 'put' add/update dono karta hai
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Record delete karna
    delete: async (storeName, id) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
};

// Database ko turant initialize kar dete hain
initDB();