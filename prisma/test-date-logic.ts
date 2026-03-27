
const date = "2026-03-07"; // Example date provided by user input (e.g. tomorrow)

// Logic from generateShoppingListFromOrders
const startOfDay = new Date(`${date}T00:00:00.000Z`)
const endOfDay = new Date(`${date}T23:59:59.999Z`)

console.log(`Input Date String: ${date}`);
console.log(`Start of Day (UTC): ${startOfDay.toISOString()}`);
console.log(`End of Day (UTC): ${endOfDay.toISOString()}`);

// Verify it covers the full day in UTC
if (startOfDay.toISOString() === `${date}T00:00:00.000Z` && 
    endOfDay.toISOString() === `${date}T23:59:59.999Z`) {
    console.log("SUCCESS: Date range covers the full UTC day correctly.");
} else {
    console.error("FAILURE: Date range is incorrect.");
}

// Logic from updateOrderStatus
const requestedDeliveryDate = new Date("2026-03-07T12:00:00.000Z"); // Example date from DB
const d = new Date(requestedDeliveryDate);
const year = d.getUTCFullYear();
const month = String(d.getUTCMonth() + 1).padStart(2, "0");
const day = String(d.getUTCDate()).padStart(2, "0");
const deliveryDate = `${year}-${month}-${day}`;

console.log(`DB Date: ${requestedDeliveryDate.toISOString()}`);
console.log(`Extracted Date String: ${deliveryDate}`);

if (deliveryDate === "2026-03-07") {
    console.log("SUCCESS: Date string extraction is correct using UTC methods.");
} else {
    console.error("FAILURE: Date string extraction is incorrect.");
}
