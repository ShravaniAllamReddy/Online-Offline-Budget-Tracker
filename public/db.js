let db;
//db request for a "budget" database.
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
    //object store called "pending" is created and autoIncrement is set to true
    const db = event.target.result;
    db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;

    // checks if app is online before reading from db
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function (event) {
    console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
    // transaction on the pending db is created with readwrite access
    const transaction = db.transaction(["pending"], "readwrite");

    // to access pending object store
    const store = transaction.objectStore("pending");

    // adds record to store
    store.add(record);
}

function checkDatabase() {
    // opens a transaction on pending db
    const transaction = db.transaction(["pending"], "readwrite");
    // to access pending object store
    const store = transaction.objectStore("pending");
    // gets all records from store
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
                .then(response => response.json())
                .then(() => {
                    // if successful, opens a transaction on pending db
                    const transaction = db.transaction(["pending"], "readwrite");

                    // access pending object store
                    const store = transaction.objectStore("pending");

                    // clear all items in store
                    store.clear();
                });
        }
    };
}

// listens for app coming back online
window.addEventListener("online", checkDatabase);
