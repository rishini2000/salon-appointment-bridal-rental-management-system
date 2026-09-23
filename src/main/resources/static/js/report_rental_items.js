window.addEventListener("load", () => {

    document.getElementById("reportDate").textContent =
        new Date().toLocaleDateString("en-GB");

    fillSelectFromEnum(document.getElementById("filterCategory"), "itemCategory", "All");
    fillSelectFromEnum(document.getElementById("filterStatus"), "itemStatus", "Available");

    loadData();

});
let allItems = [];

function loadData() {

    allItems = getServiceRequest("/reports/rentalitems/data");

 if (!Array.isArray(allItems))
    allItems = Object.values(allItems || {});

document.getElementById("filterStatus").value = "AVAILABLE";

applyFilters();

    fillSelectFromEnum(document.getElementById("filterCategory"), "itemCategory", "All");
    fillSelectFromEnum(document.getElementById("filterStatus"), "itemStatus", "Available");


}
function applyFilters() {
    let filtered = [...allItems];

    const category = document.getElementById("filterCategory").value;
    const status = document.getElementById("filterStatus").value;

    if (category)
        filtered = filtered.filter(i => i.itemCategory === category);

    if (status)
        filtered = filtered.filter(i => i.itemStatus === status);

    renderTable(filtered);
    updateSummary(filtered);
}

function clearFilters() {
    document.getElementById("filterCategory").value = "";
    document.getElementById("filterStatus").value = "";
    applyFilters();
}

function renderTable(data) {
    const propertyList = [
        { propertyName: "itemcode", dataType: "string" },
        { propertyName: "item_name", dataType: "string" },
        { propertyName: obj => getEnumDisplayName("itemCategory", obj.itemCategory), dataType: "function" },
        { propertyName: "rental_price", dataType: "currency" },
        { propertyName: "key_money", dataType: "currency" },
        { propertyName: obj => getEnumDisplayName("itemStatus", obj.itemStatus), dataType: "function" }
    ];
    fillDataIntoTable(document.getElementById("tableBodyRentals"), data, propertyList, null, null, printRentalRow);
}

const printRentalRow = (obj) => {

    const newTab = window.open();

    newTab.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Rental Item Details</title>

        <link rel="stylesheet" href="/Resources/bootstrap-5.3.7/css/bootstrap.min.css">
        <link rel="stylesheet" href="/Resources/fontawesome-7.0.0/css/all.min.css">
        <link rel="stylesheet" href="/Resources/css/common.css">

    </head>

    <body>

    <div class="print-card">

        <div class="print-header">
            <h3>Rental Item Details</h3>
        </div>

        <table>

            <tr>
                <th>Item Code</th>
                <td>${obj.itemcode}</td>
            </tr>

            <tr>
                <th>Item Name</th>
                <td>${obj.item_name}</td>
            </tr>

            <tr>
                <th>Category</th>
                <td>${getEnumDisplayName("itemCategory", obj.itemCategory)}</td>
            </tr>

            <tr>
                <th>Rental Price</th>
                <td>Rs. ${formatCurrency(obj.rental_price)}</td>
            </tr>

            <tr>
                <th>Key Money</th>
                <td>Rs. ${formatCurrency(obj.key_money)}</td>
            </tr>

            <tr>
                <th>Status</th>
                <td>${getEnumDisplayName("itemStatus", obj.itemStatus)}</td>
            </tr>

        </table>

    </div>

    </body>

    </html>
    `);

    setTimeout(() => {
        newTab.print();
        newTab.close();
    }, 500);

};


function updateSummary(data) {

    const available =
        data.filter(i => i.itemStatus === "Available").length;

    const rented =
        data.filter(i => i.itemStatus === "Rented").length;

    const totalValue =
        data.reduce((sum, i) =>
            sum + (parseFloat(i.rental_price) || 0), 0);

    document.getElementById("totalItems").textContent = data.length;

    document.getElementById("availableItems").textContent = available;

    document.getElementById("rentedItems").textContent = rented;

    document.getElementById("totalRentalValue").textContent =
        "Rs. " + formatCurrency(totalValue);

}
function printReport() { window.print(); }

function exportCSV() {

    let csv =
        "Item Code,Item Name,Category,Rental Price,Key Money,Status\n";

    allItems.forEach(i => {

        csv += `${i.itemcode},
${i.item_name},
${i.itemCategory},
${i.rental_price},
${i.key_money},
${i.itemStatus}\n`;

    });

    const blob = new Blob([csv], { type: "text/csv" });

    const el = document.createElement("a");

    el.href = URL.createObjectURL(blob);

    el.download = "Rental_Item_Availability_Report.csv";

    el.click();

}
