const searchCustomerElement = document.querySelector("#searchCustomer");
const hiddenCustomerIdElement = document.querySelector("#selectCustomerId");
const nicImageElement = document.querySelector("#nicImage");
const nicImagePreviewElement = document.querySelector("#nicImagePreview");
const dateAppointmentElement = document.querySelector("#dateAppointment");
const dateFunctionElement = document.querySelector("#dateFunction");
const dateFittonElement = document.querySelector("#dateFitton");
const datePickupElement = document.querySelector("#datePickup");
const dateReturnElement = document.querySelector("#dateReturn");
const textKeyMoneyElement = document.querySelector("#textKeyMoney");
const selectStatusElement = document.querySelector("#selectStatus");
const textTotalChargeElement = document.querySelector("#textTotalCharge");
const textAdvanceElement = document.querySelector("#textAdvance");
const textNotesElement = document.querySelector("#textNotes");

const buttonSubmit = document.getElementById("buttonSubmit");
const buttonUpdate = document.getElementById("buttonUpdate");
const buttonClear = document.getElementById("buttonClear");
const tableBodyElement = document.querySelector("#tableBodyRental");


dateAppointmentElement.addEventListener("change", validateAppointmentDate);
dateFunctionElement.addEventListener("change", validateFunctionDate);
dateFittonElement.addEventListener("change", validateFittonDate);
datePickupElement.addEventListener("change", validatePickupDate);
dateReturnElement.addEventListener("change", validateReturnDate);
textAdvanceElement.addEventListener("keyup", validateAdvance);
textAdvanceElement.addEventListener("change", validateAdvance);
textKeyMoneyElement.addEventListener("keyup", validateKeyMoney);
textKeyMoneyElement.addEventListener("change", validateKeyMoney);

textTotalChargeElement.addEventListener("keyup", validateKeyMoney);
textTotalChargeElement.addEventListener("change", validateKeyMoney);
// item list elements
const searchItemElement = document.querySelector("#searchItem");
const hiddenItemElement = document.querySelector("#selectItem");
const listItemElement = document.querySelector("#listItem");
const selectItemCategoryElement = document.querySelector("#selectItemCategory");
selectItemCategoryElement.addEventListener("change", filterItemsByCategory);

const textItemPriceElement = document.querySelector("#textItemPrice");
const textItemKeyMoneyElement = document.querySelector("#textItemKeyMoney");

const tableBodySelectedItemsInnerForm = document.querySelector("#tableBodySelectedItemsInnerForm");

function showModal() {
    openPanel('panelRentalForm');
}
function hideModal() {
    closePanel('panelRentalForm');
}

nicImageElement.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) {
        nicImagePreviewElement.style.display = "none";
        nicImagePreviewElement.src = "";
        return;
    }

    // Validate image type
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
        showToast("Please select a JPG or PNG image.", "warning");

        this.value = "";
        nicImagePreviewElement.style.display = "none";
        nicImagePreviewElement.src = "";

        return;
    }

    // Validate image size - maximum 5MB
    if (file.size > 5 * 1024 * 1024) {
        showToast("NIC image must be less than 5MB.", "warning");

        this.value = "";
        nicImagePreviewElement.style.display = "none";
        nicImagePreviewElement.src = "";

        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        nicImagePreviewElement.src = e.target.result;
        nicImagePreviewElement.style.display = "block";
    };

    reader.readAsDataURL(file);
});

function setRentalFormMode(mode = 'new') {
    const titleEl = document.querySelector('#panelRentalForm .offcanvas-title');
    if (titleEl) titleEl.textContent = mode === 'edit' ? 'Edit Rental' : 'New Rental';
    if (buttonUpdate) buttonUpdate.style.display = mode === 'edit' ? 'inline-block' : 'none';
    if (buttonSubmit) buttonSubmit.style.display = mode === 'edit' ? 'none' : 'inline-block';
}

// init
let rentalPagination = null;

window.addEventListener("load", () => {
    refreshRentalForm();
    refreshRentalInnerForm();
    refreshRentalInnerTable();
    rentalPagination = attachPagination({
        pagerSel: "#pagerRental",
        countSel: "#countRental",
        pageSizeSel: "#pageSizeRental",
        refresh: refreshRentalTable
    });
    refreshRentalTable();
});
//***********start of the main form area************

function refreshRentalForm() {

    formRental.reset();

    rental = new Object();
    rental.rentalStatus = "Active";
    rental.rentalHasItemList = new Array();

    refreshRentalInnerForm();
    refreshRentalInnerTable();

    buttonUpdate.style.display = "none";
    buttonSubmit.style.display = "block";

    let customers = getServiceRequest("/customer/alldata");
    populateDataList(
        document.getElementById("listCustomer"),
        searchCustomerElement,
        hiddenCustomerIdElement,
        customers,
        (c) => c.firstname + " " + (c.lastname || ""),
        "id"
    );

    fillSelectFromEnum(selectStatusElement, "rentalStatus", "Please select status...!");

    selectStatusElement.value = "Active";
    rental.rentalStatus = "Active";

    clearElement([dateAppointmentElement, dateFunctionElement, dateFittonElement, datePickupElement, dateReturnElement, textKeyMoneyElement, textTotalChargeElement, textAdvanceElement, textNotesElement]);
    clearValidation(searchCustomerElement);

    nicImageElement.value = "";
    nicImagePreviewElement.src = "";
    nicImagePreviewElement.style.display = "none";

    // Prevent selecting past dates for Appointment Date
    let today = new Date().toISOString().split("T")[0];

    // Auto-fill Appointment Date with today's date
    dateAppointmentElement.value = today;
    rental.appointment_date = today;


    dateAppointmentElement.min = today;
    dateAppointmentElement.max = today;

    dateFunctionElement.min = today;
    dateFittonElement.min = today;
    datePickupElement.min = today;
    dateReturnElement.min = today;

    setRentalFormMode('new');

}

function refreshRentalTable() {
    const { page, size, sort } = getPaginationState(rentalPagination);
    const url = buildPagedUrl("/rental/getpage", page, size, sort);
    const response = getServiceRequest(url);

    const rentals = (response && Array.isArray(response.content))
        ? response.content
        : (Array.isArray(response) ? response : Object.values(response || {}));

    const propertyList = [
        { propertyName: getCustomer, dataType: "function" },
        { propertyName: "appointment_date", dataType: "date" },
        { propertyName: "function_date", dataType: "date" },
        { propertyName: "fitton_date", dataType: "date" },
        { propertyName: "pickup_date", dataType: "date" },
        { propertyName: "return_date", dataType: "date" },
        { propertyName: "keymoney", dataType: "currency" },
        { propertyName: getStatus, dataType: "function" },
        { propertyName: "total_charge", dataType: "currency" },
        { propertyName: "advance", dataType: "currency" },
    ];
    fillDataIntoTable(tableBodyElement, rentals, propertyList, refillRentalForm, deleteRental, printRental, true, 'RENTAL_UPDATE', 'RENTAL_DELETE', null);
    renderPager(response && response.content ? response : null, refreshRentalTable, rentalPagination);
}


// Defensive override to prevent TypeError if customer_id or firstname is missing
const getCustomer = (obj) => {
    return (obj && obj.customer_id && obj.customer_id.firstname) ? obj.customer_id.firstname : "";
}

const getStatus = (obj) => {
    return getEnumDisplayName("rentalStatus", obj.rentalStatus);
}


// ********************Defensive override to prevent TypeError if rental. is undefined
function checkRentalFormErrors() {

    let errors = "";

    if (!hiddenCustomerIdElement.value) {
        errors += "Please select customer..!\n";
        setInvalid(searchCustomerElement);
    } else {
        setValid(searchCustomerElement);
    }

    // ******** Appointment Date Validation ********

    if (!dateAppointmentElement.value) {

        errors += "Please select an Appointment Date.\n";
        setInvalid(dateAppointmentElement);

    } else {

        let today = new Date();
        let appointmentDate = new Date(dateAppointmentElement.value);

        today.setHours(0, 0, 0, 0);
        appointmentDate.setHours(0, 0, 0, 0);

        if (appointmentDate.getTime() !== today.getTime()) {
            errors += "Appointment Date must be today's date.\n";
            setInvalid(dateAppointmentElement);
        } else {
            setValid(dateAppointmentElement);
        }
    }

    //********function date check errors and validation
    if (!rental.function_date) {
        errors += "Function date is required.\n";
        setInvalid(dateFunctionElement);
    } else {
        setValid(dateFunctionElement);
    }

    // Function Date must be after Appointment Date
    if (dateAppointmentElement.value && dateFunctionElement.value) {

        let appointmentDate = new Date(dateAppointmentElement.value);
        let functionDate = new Date(dateFunctionElement.value);

        if (functionDate < appointmentDate) {
            errors += "Please select a Function Date on or after the Appointment Date.\n";
            setInvalid(dateFunctionElement);
        }
    }

    //**************** Fitton Date Validation ****************

    if (!rental.fitton_date) {

        errors += "Fitton Date is required.\n";
        setInvalid(dateFittonElement);

    } else {

        let appointmentDate = new Date(dateAppointmentElement.value);
        let fittonDate = new Date(dateFittonElement.value);
        let functionDate = new Date(dateFunctionElement.value);

        appointmentDate.setHours(0, 0, 0, 0);
        fittonDate.setHours(0, 0, 0, 0);
        functionDate.setHours(0, 0, 0, 0);

        let fittonError = false;

        // Fitton cannot be before Appointment Date
        if (fittonDate < appointmentDate) {
            errors += "Fitton Date cannot be before the Appointment Date.\n";
            fittonError = true;
        }

        // Fitton can only be within 7 days from Appointment Date
        let maximumFittonDate = new Date(appointmentDate);
        maximumFittonDate.setDate(maximumFittonDate.getDate() + 6);

        if (fittonDate > maximumFittonDate) {
            errors += "Fitton Date must be within 7 days from the Appointment Date.\n";
            fittonError = true;
        }

        // Fitton cannot be after Function Date
        if (dateFunctionElement.value && fittonDate > functionDate) {
            errors += "Fitton Date cannot be after the Function Date.\n";
            fittonError = true;
        }

        if (fittonError) {
            setInvalid(dateFittonElement);
        } else {
            setValid(dateFittonElement);
        }
    }

    // ******************* Pickup Date Validation ***********************
    let pickupError = false;
    if (!rental.pickup_date) {

        errors += "Please select the Pickup Date.\n";
        setInvalid(datePickupElement);

    } else {

        let pickupDate = new Date(datePickupElement.value);
        let appointmentDate = new Date(dateAppointmentElement.value);
        let fittonDate = new Date(dateFittonElement.value);
        let functionDate = new Date(dateFunctionElement.value);

        pickupDate.setHours(0, 0, 0, 0);
        appointmentDate.setHours(0, 0, 0, 0);
        fittonDate.setHours(0, 0, 0, 0);
        functionDate.setHours(0, 0, 0, 0);

        // Pickup cannot be before Appointment Date
        if (pickupDate < appointmentDate) {
            errors += "Please select a Pickup Date on or after the Appointment Date.\n";
            pickupError = true;
        }

        // Pickup cannot be before Fitton Date
        if (pickupDate < fittonDate) {
            errors += "Please select a Pickup Date on or after the Fitton Date.\n";
            pickupError = true;
        }

        // Pickup cannot be after Function Date
        if (pickupDate > functionDate) {
            errors += "Please select a Pickup Date on or before the Function Date.\n";
            pickupError = true;
        }

        // Pickup must be within 7 dates ending on Function Date
        let minimumPickupDate = new Date(functionDate);
        minimumPickupDate.setDate(minimumPickupDate.getDate() - 4);

        // Pickup cannot be before Fitton
        if (fittonDate > minimumPickupDate) {
            minimumPickupDate = fittonDate;
        }

        if (pickupDate < minimumPickupDate) {
            errors += "Pickup Date must be within 7 days before the Function Date and cannot be before the Fitton Date.\n";
            pickupError = true;
        }
        // Final Validation
        if (pickupError) {
            setInvalid(datePickupElement);
        } else {
            setValid(datePickupElement);
        }
    }


    // ******************* Return Date Validation ***********************


    if (!rental.return_date) {

        errors += "Return Date is required.\n";
        setInvalid(dateReturnElement);

    } else {

        let returnDate = new Date(dateReturnElement.value);

        let appointmentDate = new Date(dateAppointmentElement.value);
        let fittonDate = new Date(dateFittonElement.value);
        let pickupDate = new Date(datePickupElement.value);
        let functionDate = new Date(dateFunctionElement.value);

        returnDate.setHours(0, 0, 0, 0);
        appointmentDate.setHours(0, 0, 0, 0);
        fittonDate.setHours(0, 0, 0, 0);
        pickupDate.setHours(0, 0, 0, 0);
        functionDate.setHours(0, 0, 0, 0);

        let returnError = false;

        if (returnDate < appointmentDate) {
            errors += "Please select a Return Date on or after the Appointment Date.\n";
            returnError = true;
        }

        if (returnDate < fittonDate) {
            errors += "Please select a Return Date on or after the Fitton Date.\n";
            returnError = true;
        }

        if (returnDate < pickupDate) {
            errors += "Please select a Return Date on or after the Pickup Date.\n";
            returnError = true;
        }

        if (returnDate < functionDate) {
            errors += "Please select a Return Date on or after the Function Date.\n";
            returnError = true;
        }
        // Return Date cannot be more than 5 days after Function Date
        let maximumReturnDate = new Date(functionDate);
        maximumReturnDate.setDate(maximumReturnDate.getDate() + 5);

        if (returnDate > maximumReturnDate) {
            errors += "Return Date must be within 5 days after the Function Date.\n";
            returnError = true;
        }

        if (returnError) {
            setInvalid(dateReturnElement);
        } else {
            setValid(dateReturnElement);
        }

    }


    if (!rental.keymoney) {
        errors += "Please enter valid key money amount..!\n";
        setInvalid(textKeyMoneyElement);
    } else {
        setValid(textKeyMoneyElement);
    }
    if (!rental.rentalStatus) {
        errors += "Please select status..!\n";
        setInvalid(selectStatusElement);
    } else {
        setValid(selectStatusElement);
    }
    if (!rental.total_charge) {
        errors += "Please enter valid total charge amount..!\n";
        setInvalid(textTotalChargeElement);
    } else {
        setValid(textTotalChargeElement);
    }
    // ******************* Advance Payment Validation *******************

    if (!rental.advance) {

        errors += "Advance Payment is required.\n";
        setInvalid(textAdvanceElement);

    } else {

        let advance = parseFloat(rental.advance);
        let totalCharge = parseFloat(rental.total_charge);
        let keyMoney = parseFloat(rental.keymoney);

        let advanceError = false;

        if (isNaN(advance)) {
            errors += "Please enter a valid Advance Payment.\n";
            advanceError = true;
        }

        // Advance Payment must be at least Rs. 1,000
        if (advance < 1000) {
            errors += "Advance Payment must be at least Rs. 1,000.\n";
            advanceError = true;
        }

        // Advance Payment cannot exceed Total Charge
        if (advance > totalCharge) {
            errors += "Advance Payment cannot exceed the Total Charge.\n";
            advanceError = true;
        }

        // Advance Payment cannot exceed Key Money
        if (advance > keyMoney) {
            errors += "Advance Payment cannot exceed the Key Money.\n";
            advanceError = true;
        }

        if (advanceError) {
            setInvalid(textAdvanceElement);
        } else {
            setValid(textAdvanceElement);
        }
    }
    if (!Array.isArray(rental.rentalHasItemList) || rental.rentalHasItemList.length === 0) {
        errors += "Please add at least one rental item..!\n";
    }

    return errors;
}
function submitRentalForm() {

    // Map hidden ID to rental object
    rental.customer_id = hiddenCustomerIdElement.value ? { id: parseInt(hiddenCustomerIdElement.value) } : null;
    rental.appointment_date = dateAppointmentElement.value;
    rental.function_date = dateFunctionElement.value;
    rental.fitton_date = dateFittonElement.value;
    rental.pickup_date = datePickupElement.value;
    rental.return_date = dateReturnElement.value;
    rental.keymoney = textKeyMoneyElement.value;
    rental.total_charge = textTotalChargeElement.value;
    rental.advance = textAdvanceElement.value;
    rental.rentalStatus = selectStatusElement.value;
    rental.note = textNotesElement.value;

    const errors = checkRentalFormErrors();

    if (errors == "") {
        showConfirm("Submit Rental", "Are you sure to submit the form ?", "Submit", "primary").then(confirmed => {
            if (!confirmed) return;

            let formData = new FormData();

            formData.append(
                "rental",
                new Blob(
                    [JSON.stringify(rental)],
                    { type: "application/json" }
                )
            );

            if (nicImageElement.files.length > 0) {

                formData.append(
                    "nicImage",
                    nicImageElement.files[0]
                );
            }

            let serviceResponse = getHTTPServicesRequest(
                "/rental/insert",
                "POST",
                formData
            );
            if (serviceResponse == "OK") {

                showToast("Form submitted successfully!", "success");

                refreshRentalForm();
                refreshRentalTable();
                closePanel('panelRentalForm');
            } else {
                showToast("Form submission cancelled..! \n Have some errors.. \n" + serviceResponse, "error");
            }
        });
    } else {
        showToast("Please fill all required fields correctly..! \n" + errors, "warning");
    }
}

function deleteRental(obj) {

    showConfirm("Delete Rental", "Are you sure to delete rental : " + obj.rent_no + " ?", "Delete", "danger").then(confirmed => {
        if (!confirmed) return;

        let serviceResponse = getHTTPServicesRequest("/rental/delete", "DELETE", obj);
        if (serviceResponse == "OK") {

            showToast("Rental deleted successfully!", "success");

            refreshRentalForm();
            refreshRentalTable();
            closePanel('panelRentalForm');
        } else {
            showToast("Rental deletion cancelled..! \n Have some errors.. \n" + serviceResponse, "error");
        }
    });
}

function printRental(obj) {
    const items = obj.rentalHasItemList || [];
    let itemRows = items.map(item =>
        `<tr>
            <td>${escapeHtml(item.item_id ? item.item_id.itemcode : "")}</td>
            <td>${escapeHtml(item.item_id ? item.item_id.item_name : "")}</td>
            <td>Rs. ${formatCurrency(item.item_price)}</td>
        </tr>`
    ).join("");

    if (!itemRows) {
        itemRows = `<tr><td colspan="5" class="text-center text-muted">No items</td></tr>`;
    }

    const newTab = window.open();
    newTab.document.write(`<!DOCTYPE html><html><head><title>Rental ${escapeHtml(obj.rent_no || "")}</title>
        <link rel="stylesheet" href="/Resources/bootstrap-5.3.7/css/bootstrap.min.css">
        <link rel="stylesheet" href="/Resources/fontawesome-7.0.0/css/all.min.css">
        <link rel="stylesheet" href="/Resources/css/common.css">
        </head><body><div class="print-card">
        <div class="print-header">
            <h3><i class="fa-solid fa-shirt me-2"></i>Rental Details</h3>
            <p>${escapeHtml(obj.rent_no || "")}</p>
        </div>
        <div class="print-body">
        <table>
            <tr><th>Rental No</th><td>${escapeHtml(obj.rent_no || "N/A")}</td></tr>
            <tr><th>Customer</th><td>${escapeHtml(getCustomer(obj))}</td></tr>
            <tr><th>Appointment Date</th><td>${formatDate(obj.appointment_date)}</td></tr>
            <tr><th>Function Date</th><td>${formatDate(obj.function_date)}</td></tr>
            <tr><th>Fitton Date</th><td>${formatDate(obj.fitton_date)}</td></tr>
            <tr><th>Pickup Date</th><td>${formatDate(obj.pickup_date)}</td></tr>
            <tr><th>Return Date</th><td>${formatDate(obj.return_date)}</td></tr>
            <tr><th>Key Money</th><td>Rs. ${formatCurrency(obj.keymoney)}</td></tr>
            <tr><th>Status</th><td>${escapeHtml(capitalize(getStatus(obj)))}</td></tr>
            <tr><th>Total Charge</th><td>Rs. ${formatCurrency(obj.total_charge)}</td></tr>
            <tr><th>Advance</th><td>Rs. ${formatCurrency(obj.advance)}</td></tr>
            <tr><th>Note</th><td>${escapeHtml(obj.note || "N/A")}</td></tr>
        </table>
        ${items.length > 0 ? `<h6 class="mt-3 mb-2"><i class="fa-solid fa-box-open me-2"></i>Rental Items</h6>
        <table class="table table-bordered">
            <thead><tr><th>Item Code</th><th>Item Name</th><th>Price</th><th>Line Total</th></tr></thead>
            <tbody>${itemRows}</tbody>
        </table>` : ""}
        </div>
        <div class="print-footer">Printed on ${new Date().toLocaleDateString("en-LK")} | Salon DEEN</div>
        </div></body></html>`);
    setTimeout(() => { newTab.print(); newTab.close(); }, 500);
}

function refillRentalForm(obj) {

    rental = getServiceRequest("/rental/byid/" + obj.id);
    oldRental = JSON.parse(JSON.stringify(rental));

    // Load existing NIC image
if (rental.nic_image) {
    nicImagePreviewElement.src = rental.nic_image;
    nicImagePreviewElement.style.display = "block";
} else {
    nicImagePreviewElement.src = "";
    nicImagePreviewElement.style.display = "none";
}
    //customer options as datalist
    let customers = getServiceRequest("/customer/alldata");
    populateDataList(
        document.getElementById("listCustomer"),
        searchCustomerElement,
        hiddenCustomerIdElement,
        customers,
        (c) => c.firstname + " " + (c.lastname || ""),
        "id"
    );
    setSelectedByHiddenId(searchCustomerElement, hiddenCustomerIdElement, customers, (c) => c.firstname + " " + (c.lastname || ""), "id", rental.customer_id?.id);

    //rental status genarate karana function
    fillSelectFromEnum(selectStatusElement, "rentalStatus", "Please select status...!");
    selectStatusElement.value = rental.rentalStatus;

    dateAppointmentElement.value = rental.appointment_date;
    dateFunctionElement.value = rental.function_date;
    dateFittonElement.value = rental.fitton_date;
    datePickupElement.value = rental.pickup_date;
    dateReturnElement.value = rental.return_date;
    textKeyMoneyElement.value = rental.keymoney;
    textTotalChargeElement.value = rental.total_charge;
    textAdvanceElement.value = rental.advance;
    textNotesElement.value = rental.note;

    buttonUpdate.style.display = "block";
    buttonSubmit.style.display = "none";

    refreshRentalInnerTable();

    refreshRentalInnerForm();

    setRentalFormMode('edit');

    openPanel('panelRentalForm');
}

////define function for check form updates
const checkFormUpdates = () => {

    let updates = "";

    // Customer
    const oldCustomerId = oldRental.customer_id?.id ?? null;
    const newCustomerId = rental.customer_id?.id ?? null;

    if (oldCustomerId !== newCustomerId) {
        updates += "Customer changed\n";
    }

    // Appointment Date
    if (String(oldRental.appointment_date ?? "") !==
        String(rental.appointment_date ?? "")) {

        updates += "Appointment date changed from " +
            oldRental.appointment_date + " to " +
            rental.appointment_date + "\n";
    }

    // Function Date
    if (String(oldRental.function_date ?? "") !==
        String(rental.function_date ?? "")) {

        updates += "Function date changed from " +
            oldRental.function_date + " to " +
            rental.function_date + "\n";
    }

    // Fitton Date
    if (String(oldRental.fitton_date ?? "") !==
        String(rental.fitton_date ?? "")) {

        updates += "Fitton date changed from " +
            oldRental.fitton_date + " to " +
            rental.fitton_date + "\n";
    }

    // Pickup Date
    if (String(oldRental.pickup_date ?? "") !==
        String(rental.pickup_date ?? "")) {

        updates += "Pickup date changed from " +
            oldRental.pickup_date + " to " +
            rental.pickup_date + "\n";
    }

    // Return Date
    if (String(oldRental.return_date ?? "") !==
        String(rental.return_date ?? "")) {

        updates += "Return date changed from " +
            oldRental.return_date + " to " +
            rental.return_date + "\n";
    }

    // Key Money
    if (Number(oldRental.keymoney ?? 0) !==
        Number(rental.keymoney ?? 0)) {

        updates += "Key money changed from " +
            oldRental.keymoney + " to " +
            rental.keymoney + "\n";
    }

    // Status
    if (String(oldRental.rentalStatus ?? "") !==
        String(rental.rental_status ?? "")) {

        updates += "Status changed from " +
            oldRental.rentalStatus + " to " +
            rental.rental_status + "\n";
    }

    // Total Charge
    if (Number(oldRental.total_charge ?? 0) !==
        Number(rental.total_charge ?? 0)) {

        updates += "Total charge changed from " +
            oldRental.total_charge + " to " +
            rental.total_charge + "\n";
    }

    // Advance
    if (Number(oldRental.advance ?? 0) !==
        Number(rental.advance ?? 0)) {

        updates += "Advance changed from " +
            oldRental.advance + " to " +
            rental.advance + "\n";
    }

    // Notes
    if (String(oldRental.note ?? "") !==
        String(rental.note ?? "")) {

        updates += "Notes changed from " +
            oldRental.note + " to " +
            rental.note + "\n";
    }

    return updates;
}
function buttonRentalUpdate() {

    // Map hidden ID to rental object
    rental.customer_id = hiddenCustomerIdElement.value ? { id: parseInt(hiddenCustomerIdElement.value) } : null;
    rental.appointment_date = dateAppointmentElement.value;
    rental.function_date = dateFunctionElement.value;
    rental.fitton_date = dateFittonElement.value;
    rental.pickup_date = datePickupElement.value;
    rental.return_date = dateReturnElement.value;
    rental.keymoney = textKeyMoneyElement.value;
    rental.total_charge = textTotalChargeElement.value;
    rental.advance = textAdvanceElement.value;
    rental.rental_status = selectStatusElement.value;
    rental.note = textNotesElement.value;

    let errors = checkRentalFormErrors();
    if (errors == "") {
        let updates = checkFormUpdates();
        if (updates == "") {
            showToast("No changes detected to update.", "info");
        } else {
            showConfirm("Update Rental", "Are you sure to update the rental with following changes..? \n" + updates, "Update", "primary").then(confirmed => {
                if (!confirmed) return;

                let serviceResponse = getHTTPServicesRequest("/rental/update", "PUT", rental);
                if (serviceResponse == "OK") {

                    showToast("Rental updated successfully!", "success");

                    refreshRentalForm();
                    refreshRentalTable();
                    closePanel('panelRentalForm');
                } else {
                    showToast("Rental update cancelled..! \n Have some errors.. \n" + serviceResponse, "error");
                }
            });
        }
    } else {
        showToast("Please fill all required fields correctly..! \n" + errors, "warning");
    }

}
//***********end of the main form area*************

//***********start of the inner form area************
function checkFormError() {
    let errors = "";
    if (!hiddenItemElement.value) errors += "Item is required.\n";
    if (!textItemPriceElement.value || textItemPriceElement.value <= 0) errors += "Item price is required.\n";
    return errors;
}

function refreshRentalInnerForm() {

    rentalInner = new Object();

    let categories = getServiceRequest("/itemcategory/alldata");;

    console.log(categories);

    fillDataIntoSelect(selectItemCategoryElement, "Select Category", categories, "name");

    //item options as datalist
    let items = getServiceRequest("/item/alldata");
    populateDataList(
        listItemElement,
        searchItemElement,
        hiddenItemElement,
        items,
        (item) => item.item_name + " (" + item.itemcode + ")",
        "id"
    );

    clearElement([
        selectItemCategoryElement,
        textItemPriceElement,
        textItemKeyMoneyElement,
    ]);
    textTotalChargeElement.value = rental.total_charge;
    clearValidation(searchItemElement);

    hiddenItemElement.value = "";

    searchItemElement.value = "";

    textItemPriceElement.value = "";
}

function refreshRentalInnerTable() {

    const propertyList = [
        { propertyName: getItemCode, dataType: "function" },
        { propertyName: getItemName, dataType: "function" },
        { propertyName: "item_price", dataType: "currency" },
        { propertyName: getItemKeyMoney, dataType: "function" }
    ];

    fillDataIntoInnerTable(
        tableBodySelectedItemsInnerForm,
        rental.rentalHasItemList,
        propertyList,
        refillRentalInnerForm,
        deleteRentalItem
    );
}
const getItem = (obj) => {
    return obj.item_id.itemcode + " - " + obj.item_id.item_name;
}

const getItemCode = (obj) => {
    return obj.item_id.itemcode;
}

const getItemName = (obj) => {
    return obj.item_id.item_name;
}

const getTotal = (obj) => {
    return obj.item_price;
}

const getItemKeyMoney = (obj) => {
    return obj.key_money ??
        obj.keymoney ??
        obj.item_id?.key_money ??
        obj.item_id?.keymoney ??
        0;
}
function buttonInnerRentalSubmit() {

    let errors = checkFormError();
    if (errors == "") {
        showConfirm("Submit Item", "Are you sure to submit the form ?", "Submit", "primary").then(confirmed => {
            if (!confirmed) return;

            rentalInner.item_price = Number(textItemPriceElement.value);
            rentalInner.key_money = Number(textItemKeyMoneyElement.value);

            rental.rentalHasItemList.push(rentalInner);

            updateFittonDateLimits();

            let total = 0;

            rental.rentalHasItemList.forEach(item => {
                total += Number(item.item_price);
            });

            textTotalChargeElement.value = total;
            rental.total_charge = total;
            showToast("Form submitted successfully!", "success");

            refreshRentalInnerForm();
            refreshRentalInnerTable();

            textTotalChargeElement.value = total;
            rental.total_charge = total;
        });
    } else {
        showToast("Please fill all required fields correctly..! \n" + errors, "warning");
    }
}

function deleteRentalItem(obj) {

    showConfirm("Delete Item", "Are you sure to delete this item from rental?", "Delete", "danger").then(confirmed => {
        if (!confirmed) return;

        const idx = rental.rentalHasItemList.indexOf(obj);

        if (idx > -1) {
            rental.rentalHasItemList.splice(idx, 1);
        }

        // Recalculate Total Charge and Total Key Money
        let totalCharge = 0;
        let totalKeyMoney = 0;

        rental.rentalHasItemList.forEach(item => {

            totalCharge += Number(item.item_price || 0);

            totalKeyMoney += Number(
                item.key_money ??
                item.keymoney ??
                item.item_id?.key_money ??
                item.item_id?.keymoney ??
                0
            );

        });
        textTotalChargeElement.value = totalCharge;
        rental.total_charge = totalCharge;

        textKeyMoneyElement.value = totalKeyMoney;
        rental.keymoney = totalKeyMoney;

        showToast("Item removed from rental successfully!", "success");

        refreshRentalInnerForm();
        refreshRentalInnerTable();
    });
}

function refillRentalInnerForm(obj) {

    innerRental = JSON.parse(JSON.stringify(obj));
    oldInnerRental = JSON.parse(JSON.stringify(obj));

    let items = getServiceRequest("/item/alldata");
    populateDataList(
        listItemElement,
        searchItemElement,
        hiddenItemElement,
        items,
        (item) => item.item_name + " (" + item.itemcode + ")",
        "id"
    );
    setSelectedByHiddenId(searchItemElement, hiddenItemElement, items, (item) => item.item_name + " (" + item.itemcode + ")", "id", innerRental.item_id?.id);
    textItemPriceElement.value = innerRental.item_price || "";

    textItemKeyMoneyElement.value =
        innerRental.key_money ??
        innerRental.keymoney ??
        innerRental.item_id?.key_money ??
        "";

    setRentalFormMode('edit');
}

const checkFormUpdate = () => {
    let updates = "";

    if (hiddenItemElement.value != (oldInnerRental.item_id?.id)) {
        updates += "Item changed\n";
    }
    if (textItemPriceElement.value != oldInnerRental.item_price) {
        updates += "Price changed from " + oldInnerRental.item_price + " to " + textItemPriceElement.value + "\n";
    }
    return updates;
}

function buttonInnerUpdate() {

    let errors = checkFormError();

    if (errors == "") {
        let updates = checkFormUpdate();
        if (updates == "") {
            showToast("No changes detected to update.", "info");
        } else {
            showConfirm("Update Item", "Are you sure to update the rental item detail with following changes ?\n" + updates, "Update", "primary").then(confirmed => {
                if (!confirmed) return;

                const idx = rental.rentalHasItemList.indexOf(innerRental);
                if (idx > -1) {
                    innerRental.item_id = { id: parseInt(hiddenItemElement.value) };
                    innerRental.item_price = textItemPriceElement.value;
                    innerRental.key_money = textItemKeyMoneyElement.value;
                    rental.rentalHasItemList[idx] = innerRental;
                }

                showToast("Rental item detail updated successfully!", "success");

                refreshRentalInnerForm();
                refreshRentalInnerTable();
            });
        }
    } else {
        showToast("Please fill all required fields correctly..! \n" + errors, "warning");
    }
}

function addSelectedItem() {

    rentalInner = new Object();

    let allItems = getServiceRequest("/item/alldata");

    let selectedItem = allItems.find(item => item.id == hiddenItemElement.value);

    rentalInner.item_id = selectedItem;

    rentalInner.item_price = textItemPriceElement.value;
    rentalInner.key_money = Number(textItemKeyMoneyElement.value);


    console.log(rentalInner);

    rental.rentalHasItemList.push(rentalInner);
    updateFittonDateLimits();

    let total = 0;

    rental.rentalHasItemList.forEach(item => {
        total += Number(item.item_price);
    });

    textTotalChargeElement.value = total;
    rental.total_charge = total;

    let totalKeyMoney = 0;

    rental.rentalHasItemList.forEach(item => {
        totalKeyMoney += Number(item.key_money);
    });

    textKeyMoneyElement.value = totalKeyMoney;
    console.log("Rental Item List:", rental.rentalHasItemList);
    console.log("Total Key Money:", totalKeyMoney);
    rental.keymoney = totalKeyMoney;

    refreshRentalInnerTable();
    refreshRentalInnerForm();
}

function filterItemsByCategory() {

    let allItems = getServiceRequest("/item/alldata");

    let selectedCategory = selectItemCategoryElement.value;

    let filteredItems = allItems.filter(item =>
        item.itemCategory === selectedCategory
    );

    populateDataList(
        listItemElement,
        searchItemElement,
        hiddenItemElement,
        filteredItems,
        (item) => item.item_name + " (" + item.itemcode + ")",
        "id"
    );

    // Wait until user selects an item
    searchItemElement.onchange = function () {

        console.log("Hidden ID:", hiddenItemElement.value);

        let selectedItem = allItems.find(item =>
            item.id == Number(hiddenItemElement.value)
        );

        if (selectedItem) {

            rentalInner.item_id = selectedItem;
            rentalInner.item_price = Number(selectedItem.rental_price);
            textItemPriceElement.value = Number(selectedItem.rental_price);

            textItemKeyMoneyElement.value = Number(selectedItem.key_money);

            rentalInner.key_money = Number(selectedItem.key_money);

            console.log("Selected Item =", selectedItem);
        }

    };
}


function validateAppointmentDate() {

    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let appointmentDate = new Date(dateAppointmentElement.value);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {

        setInvalid(dateAppointmentElement);

    } else {

        setValid(dateAppointmentElement);

    }
    // Fitton Date can be Appointment Date up to 7 days later
    if (dateAppointmentElement.value) {

        dateFittonElement.min = dateAppointmentElement.value;

        let maximumFittonDate = new Date(dateAppointmentElement.value);

        maximumFittonDate.setDate(
            maximumFittonDate.getDate() + 7
        );

        dateFittonElement.max =
            maximumFittonDate.toISOString().split("T")[0];
    }

}

function validateFunctionDate() {

    if (!dateAppointmentElement.value ||
        !dateFunctionElement.value) {
        return;
    }

    let appointmentDate =
        new Date(dateAppointmentElement.value);

    let functionDate =
        new Date(dateFunctionElement.value);

    appointmentDate.setHours(0, 0, 0, 0);
    functionDate.setHours(0, 0, 0, 0);


    // Function Date cannot be before Appointment Date
    if (functionDate < appointmentDate) {

        setInvalid(dateFunctionElement);
        return;

    } else {

        setValid(dateFunctionElement);
    }


    // ==========================================
    // FITTON DATE
    // Appointment Date → Appointment + 7 days
    // BUT cannot be after Function Date
    // ==========================================

    dateFittonElement.min =
        dateAppointmentElement.value;

    let maximumFittonDate =
        new Date(appointmentDate);

    maximumFittonDate.setDate(
        maximumFittonDate.getDate() + 7
    );

    // If Function Date is earlier than Appointment + 7,
    // Function Date becomes the maximum Fitton Date
    if (functionDate < maximumFittonDate) {
        maximumFittonDate = functionDate;
    }

    dateFittonElement.max =
        maximumFittonDate.toISOString().split("T")[0];


    // ==========================================
    // PICKUP DATE
    // Pickup must be within 5 dates ending on Function Date
    // ==========================================

    datePickupElement.max =
        dateFunctionElement.value;

    let minimumPickupDate =
        new Date(functionDate);

    minimumPickupDate.setDate(
        minimumPickupDate.getDate() - 4
    );


    // Pickup cannot be before Fitton
    if (dateFittonElement.value) {

        let fittonDate =
            new Date(dateFittonElement.value);

        fittonDate.setHours(0, 0, 0, 0);

        if (fittonDate > minimumPickupDate) {
            minimumPickupDate = fittonDate;
        }
    }

    datePickupElement.min =
        minimumPickupDate.toISOString().split("T")[0];


    // ==========================================
    // RETURN DATE
    // Function Date → Function Date + 5 days
    // ==========================================

    dateReturnElement.min =
        dateFunctionElement.value;

    let maximumReturnDate =
        new Date(functionDate);

    maximumReturnDate.setDate(
        maximumReturnDate.getDate() + 5
    );

    dateReturnElement.max =
        maximumReturnDate.toISOString().split("T")[0];
}
function validateFittonDate() {

    if (!dateAppointmentElement.value ||
        !dateFittonElement.value ||
        !dateFunctionElement.value) {
        return;
    }

    let appointmentDate = new Date(dateAppointmentElement.value);
    let fittonDate = new Date(dateFittonElement.value);
    let functionDate = new Date(dateFunctionElement.value);

    appointmentDate.setHours(0, 0, 0, 0);
    fittonDate.setHours(0, 0, 0, 0);
    functionDate.setHours(0, 0, 0, 0);


    // ==========================================
    // FITTON VALIDATION
    // ==========================================

    let maximumFittonDate = new Date(appointmentDate);

    maximumFittonDate.setDate(maximumFittonDate.getDate() + 7
    );

    // Function Date can be earlier than Appointment + 7
    if (functionDate < maximumFittonDate) {
        maximumFittonDate = functionDate;
    }

    if (
        fittonDate < appointmentDate ||
        fittonDate > maximumFittonDate
    ) {

        setInvalid(dateFittonElement);

    } else {

        setValid(dateFittonElement);
    }


    // ==========================================
    // UPDATE PICKUP CALENDAR
    // ==========================================

    let minimumPickupDate =
        new Date(functionDate);

    // Function Date - 6 days
    // Function Date - 4 days
    minimumPickupDate.setDate(
        minimumPickupDate.getDate() - 4
    );
    // Pickup cannot be before Fitton
    if (fittonDate > minimumPickupDate) {
        minimumPickupDate = fittonDate;
    }

    datePickupElement.min =
        minimumPickupDate.toISOString().split("T")[0];

    datePickupElement.max =
        dateFunctionElement.value;
}
function validatePickupDate() {

    if (!datePickupElement.value ||
        !dateFittonElement.value ||
        !dateFunctionElement.value) {
        return;
    }

    let pickupDate =
        new Date(datePickupElement.value);

    let fittonDate =
        new Date(dateFittonElement.value);

    let functionDate =
        new Date(dateFunctionElement.value);

    pickupDate.setHours(0, 0, 0, 0);
    fittonDate.setHours(0, 0, 0, 0);
    functionDate.setHours(0, 0, 0, 0);


    // Pickup cannot be before Fitton
    if (pickupDate < fittonDate) {

        setInvalid(datePickupElement);
        return;
    }



    // Pickup must be within 5 dates ending on Function Date
    let minimumPickupDate =
        new Date(functionDate);

    // Function Date - 4 days
    minimumPickupDate.setDate(
        minimumPickupDate.getDate() - 4
    );

    // The actual minimum is the later of:
    // 1. Fitton Date
    // 2. Function Date - 5 days

    if (fittonDate > minimumPickupDate) {
        minimumPickupDate = fittonDate;
    }


    if (
        pickupDate < minimumPickupDate ||
        pickupDate > functionDate
    ) {

        setInvalid(datePickupElement);

    } else {

        setValid(datePickupElement);
    }
}
function validateReturnDate() {

    if (!dateReturnElement.value ||
        !dateFunctionElement.value) {
        return;
    }

    let returnDate =
        new Date(dateReturnElement.value);

    let functionDate =
        new Date(dateFunctionElement.value);

    returnDate.setHours(0, 0, 0, 0);
    functionDate.setHours(0, 0, 0, 0);


    // Return Date must be on or after Function Date
    if (returnDate < functionDate) {

        setInvalid(dateReturnElement);
        return;
    }


    // Return Date can be maximum 5 days after Function Date
    let maximumReturnDate =
        new Date(functionDate);

    maximumReturnDate.setDate(
        maximumReturnDate.getDate() + 5
    );


    if (returnDate > maximumReturnDate) {

        setInvalid(dateReturnElement);

    } else {

        setValid(dateReturnElement);
    }
}
function validateAdvance() {

    let advance = Number(textAdvanceElement.value);
    let totalCharge = Number(textTotalChargeElement.value);
    let keyMoney = Number(textKeyMoneyElement.value);

    if (textAdvanceElement.value == "") {
        setInvalid(textAdvanceElement);
        return;
    }

    if (advance < 1000) {
        setInvalid(textAdvanceElement);
        return;
    }

    if (advance > totalCharge) {
        setInvalid(textAdvanceElement);
        return;
    }

    if (advance > keyMoney) {
        setInvalid(textAdvanceElement);
        return;
    }

    setValid(textAdvanceElement);

}

function validateKeyMoney() {

    let keyMoney = Number(textKeyMoneyElement.value);
    let totalCharge = Number(textTotalChargeElement.value);
    let advance = Number(textAdvanceElement.value);

    if (textKeyMoneyElement.value == "") {
        setInvalid(textKeyMoneyElement);
        return;
    }

    // Key Money cannot exceed Total Charge
    if (keyMoney > totalCharge) {
        setInvalid(textKeyMoneyElement);
        return;
    }

    // Key Money must be at least the Advance Payment
    if (keyMoney < advance) {
        setInvalid(textKeyMoneyElement);
        return;
    }

    setValid(textKeyMoneyElement);
}

function updateFittonDateLimits() {

    if (!dateAppointmentElement.value) {
        return;
    }

    // ==========================================
    // FITTON DATE
    // Minimum = Appointment Date
    // Maximum = Appointment Date + 7 days
    // ==========================================

    dateFittonElement.min =
        dateAppointmentElement.value;

    let maximumFittonDate =
        new Date(dateAppointmentElement.value);

    maximumFittonDate.setDate(
        maximumFittonDate.getDate() + 7
    );


    // Fitton cannot be after Function Date
    if (dateFunctionElement.value) {

        let functionDate =
            new Date(dateFunctionElement.value);

        functionDate.setHours(0, 0, 0, 0);

        if (functionDate < maximumFittonDate) {
            maximumFittonDate = functionDate;
        }
    }


    dateFittonElement.max =
        maximumFittonDate.toISOString().split("T")[0];


    // ==========================================
    // PICKUP DATE
    // Minimum = later of:
    // 1. Fitton Date
    // 2. Function Date - 4 days
    // ==========================================

    if (dateFittonElement.value &&
        dateFunctionElement.value) {

        let fittonDate =
            new Date(dateFittonElement.value);

        let functionDate =
            new Date(dateFunctionElement.value);

        fittonDate.setHours(0, 0, 0, 0);
        functionDate.setHours(0, 0, 0, 0);


        let minimumPickupDate =
            new Date(functionDate);

        minimumPickupDate.setDate(
            minimumPickupDate.getDate() - 4
        );

        // Pickup cannot be before Fitton
        if (fittonDate > minimumPickupDate) {
            minimumPickupDate = fittonDate;
        }


        datePickupElement.min = minimumPickupDate.toISOString().split("T")[0];

        datePickupElement.max = dateFunctionElement.value;
    }
}