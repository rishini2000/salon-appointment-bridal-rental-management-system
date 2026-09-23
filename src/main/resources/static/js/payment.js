let paymentPagination = null;

window.addEventListener("load", () => {
    togglePaymentType();
    refreshPaymentForm();
    paymentPagination = attachPagination({
        pagerSel: "#pagerPayment",
        countSel: "#countPayment",
        pageSizeSel: "#pageSizePayment",
        refresh: refreshPaymentTable
    });
    refreshPaymentTable();
});

const searchAppointmentElement = document.querySelector("#searchAppointment");
const paymentAppointmentElement = document.querySelector("#paymentAppointment");
const paymentRentalElement = document.querySelector("#paymentRental");
const selectRentalPaymentTypeElement = document.querySelector("#selectRentalPaymentType");
const selectAppointmentPaymentTypeElement = document.querySelector("#selectAppointmentPaymentType");
const appointmentSectionElement = document.querySelector("#appointmentSection");
const rentalSectionElement = document.querySelector("#rentalSection");
const textAppointmentIdElement = document.querySelector("#textAppointmentId");
const textCustomerNameElement = document.querySelector("#textCustomerName");
const textCustomerPhoneElement = document.querySelector("#textCustomerPhone");
const textAppointmentDateElement = document.querySelector("#textAppointmentDate");
const customerInfoSection = document.querySelector("#customerInfoSection");
const paymentSummaryElement = document.querySelector("#paymentSummary");
const summaryTotalElement = document.querySelector("#summaryTotal");
const summaryPaidElement = document.querySelector("#summaryPaid");
const summaryRemainingElement = document.querySelector("#summaryRemaining");
const textAppointmentAmountElement = document.querySelector("#textAppointmentAmount");
const textPayAmountElement = document.querySelector("#textPayAmount");
const textPayBalanceAmountElement = document.querySelector("#textPayBalanceAmount");
const textKeyMoneyElement = document.querySelector("#textKeyMoney");
const textPaymentNoteElement = document.querySelector("#textPaymentNote");

const buttonSubmit = document.getElementById("buttonSubmit");
const buttonUpdate = document.getElementById("buttonUpdate");
const buttonClear = document.getElementById("buttonClear");
const tableBodyElement = document.querySelector("#tableBodyPayment");

paymentAppointmentElement.onchange = function () {
    togglePaymentType();
};

paymentRentalElement.onchange = function () {
    togglePaymentType();
};
selectRentalPaymentTypeElement.onchange = function () {

    payment.paymentType = this.value;

    if (!payment.selectedRental) {
        return;
    }

    // Total rental amount
    const total = Number(payment.selectedRental.total_charge || 0);

    textAppointmentAmountElement.value = total.toFixed(2);
    payment.appointment_amount = total;

    // Advance Payment
    if (this.value === "ADVANCE") {

        textPayAmountElement.value =
            Number(payment.selectedRental.advance || 0).toFixed(2);

    }

// Key Money
else if (this.value === "KEY_MONEY") {

    textPayAmountElement.value =
        Number(payment.selectedRental.keymoney || 0).toFixed(2);

    // Keep rental balance unchanged
    textPayBalanceAmountElement.value =
        window.currentRemaining.toFixed(2);

}

    // Remaining Balance
    else if (this.value === "REMAINING") {

const remaining = window.currentRemaining;

textPayAmountElement.value = remaining.toFixed(2);

    }

if (payment.paymentType === "KEY_MONEY") {

    // Key Money is a deposit.
    // It does NOT reduce the rental balance.
    textPayBalanceAmountElement.value =
        window.currentRemaining.toFixed(2);

} else {

    textPayBalanceAmountElement.value =
        (window.currentRemaining - Number(textPayAmountElement.value)).toFixed(2);

}
}
let paymentMethodList = [];

function showModal() {
    openPanel('panelPaymentForm');
}
function hideModal() {
    closePanel('panelPaymentForm');
}

function setPaymentFormMode(mode = 'new') {
    const titleEl = document.querySelector('#panelPaymentForm .offcanvas-title');
    if (titleEl) titleEl.textContent = mode === 'edit' ? 'Edit Payment' : 'New Payment';
    if (buttonUpdate) buttonUpdate.style.display = mode === 'edit' ? 'inline-block' : 'none';
    if (buttonSubmit) buttonSubmit.style.display = mode === 'edit' ? 'none' : 'inline-block';
}

function togglePaymentType() {

    if (paymentAppointmentElement.checked) {

        appointmentSectionElement.style.display = "block";
        rentalSectionElement.style.display = "none";

        // Appointment
        textAppointmentAmountElement.readOnly = true;
        textPayAmountElement.readOnly = false;
        textPayBalanceAmountElement.readOnly = true;

        loadAppointmentData();

    } else {

        appointmentSectionElement.style.display = "none";
        rentalSectionElement.style.display = "block";

        // Rental
        textAppointmentAmountElement.readOnly = true;
        textPayAmountElement.readOnly = true;
        textPayBalanceAmountElement.readOnly = true;

        loadRentalData();

    }

}

// automticaly calculate remain balance
textPayAmountElement.addEventListener("input", function () {
    const pay = parseFloat(this.value) || 0;
    const bal = window.currentRemaining - pay;
    textPayBalanceAmountElement.value = bal.toFixed(2);
    payment.paybalance_amount = bal;
});

let appointmentInputHandler = null;

function refreshPaymentForm() {

    formPayment.reset();
    payment = new Object();
    payment.paymentType = null;
    paymentMethodList = [];

    if (appointmentInputHandler) {
        searchAppointmentElement.removeEventListener("input", appointmentInputHandler);
    }

    buttonUpdate.style.display = "none";
    buttonSubmit.style.display = "block";

    clearElement([searchAppointmentElement, textAppointmentIdElement, textAppointmentAmountElement, textPayAmountElement, textPayBalanceAmountElement, textPaymentNoteElement]);
    refreshPaymentMethodInnerTable();

    textPayAmountElement.disabled = false;
    textPayAmountElement.placeholder = "0.00";

    if (customerInfoSection) customerInfoSection.style.display = "none";
    if (paymentSummaryElement) paymentSummaryElement.style.display = "none";

    window.currentRemaining = 0;

    togglePaymentType();

    setPaymentFormMode('new');
}

function populateAppointmentDataList(appointments) {
    const datalist = document.getElementById("listAppointment");
    datalist.innerHTML = "";

    if (!Array.isArray(appointments)) return;

    appointments.forEach(appt => {
        const option = document.createElement("option");
        const customerName = appt.customer_id
            ? (appt.customer_id.firstname + " " + (appt.customer_id.lastname || "")).trim()
            : "Unknown";
        const phone = appt.customer_id ? (appt.customer_id.mobile || "") : "";
        const date = appt.date || "";

        const label = appt.appointment_no + " - " + customerName;
        option.value = label;
        option.dataset.appointmentId = appt.id;
        datalist.appendChild(option);
    });

    // Single named handler — removed before re-adding to prevent stacking
    appointmentInputHandler = function () {
        const inputVal = this.value;
        const match = appointments.find(a => {
            const customerName = a.customer_id
                ? (a.customer_id.firstname + " " + (a.customer_id.lastname || "")).trim()
                : "Unknown";
            const phone = a.customer_id ? (a.customer_id.mobile || "") : "";
            const label = a.appointment_no + " - " + customerName;
            return label === inputVal;
        });

        if (match) {
            textAppointmentIdElement.value = match.id;
            onAppointmentSelected(match);
        } else {
            textAppointmentIdElement.value = "";
        }
    };
    searchAppointmentElement.addEventListener("input", appointmentInputHandler);
}
function populateRentalDataList(rentals) {

    const datalist = document.getElementById("listRental");

    datalist.innerHTML = "";

    if (!Array.isArray(rentals)) return;

    rentals.forEach(rental => {

        const option = document.createElement("option");

        const customerName = rental.customer_id
            ? (rental.customer_id.firstname + " " + (rental.customer_id.lastname || "")).trim()
            : "Unknown";

        option.value =
            rental.rent_no +
            " - " +
            customerName +
            " - " +
            (rental.customer_id.mobile || "");

        datalist.appendChild(option);

    });

    const searchRentalElement = document.getElementById("searchRental");

    searchRentalElement.oninput = function () {

        const selectedRental = rentals.find(r => {

            const customerName = r.customer_id
                ? (r.customer_id.firstname + " " + (r.customer_id.lastname || "")).trim()
                : "Unknown";

            let label =
                r.rent_no +
                " - " +
                customerName +
                " - " +
                (r.customer_id.mobile || "");

            return label === this.value;

        });

        if (selectedRental) {

            onRentalSelected(selectedRental);

        }

    };

}
function onAppointmentSelected(appointment) {

    console.log("Appointment Selected");

    payment.appointment_id = { id: appointment.id };

    const customerName = appointment.customer_id
        ? (appointment.customer_id.firstname + " " + (appointment.customer_id.lastname || "")).trim()
        : "";
    const phone = appointment.customer_id ? (appointment.customer_id.mobile || "") : "";
    const date = appointment.date || "";

    if (customerInfoSection) customerInfoSection.style.display = "flex";
    if (textCustomerNameElement) textCustomerNameElement.value = customerName;
    if (textCustomerPhoneElement) textCustomerPhoneElement.value = phone;
    if (textAppointmentDateElement) textAppointmentDateElement.value = date;

const paymentInfo = getServiceRequest(
    "/appointment/payment-info?id=" + appointment.id
);

const advancePayment = parseFloat(paymentInfo.advancePayment) || 0;

const amount = parseFloat(paymentInfo.amount) || 0;

textAppointmentAmountElement.value = amount.toFixed(2);

payment.appointment_amount = amount;
textAppointmentAmountElement.value = paymentInfo.amount;
payment.appointment_amount = paymentInfo.amount;

// Appointment payment mode
// Enable all options
for (let option of selectAppointmentPaymentTypeElement.options) {
    option.disabled = false;
}

// Disable all first
for (let option of selectAppointmentPaymentTypeElement.options) {
    if (option.value !== "") {
        option.disabled = true;
    }
}

if (advancePayment > 0) {

    console.log("Advance appointment");

    let totalPaidData = getServiceRequest("/payment/total-paid/" + appointment.id);
    let payments = totalPaidData.payments || [];

    let hasAdvance = payments.some(p => p.paymentType === "ADVANCE");

    if (hasAdvance) {

        selectAppointmentPaymentTypeElement.value = "REMAINING";
        selectAppointmentPaymentTypeElement.querySelector("option[value='REMAINING']").disabled = false;

    } else {

        selectAppointmentPaymentTypeElement.value = "ADVANCE";
        selectAppointmentPaymentTypeElement.querySelector("option[value='ADVANCE']").disabled = false;

    }

} else {

    console.log("Full payment appointment");

    selectAppointmentPaymentTypeElement.value = "FULL";

    const fullOption =
        selectAppointmentPaymentTypeElement.querySelector("option[value='FULL']");

    if (fullOption) {
        fullOption.disabled = false;
    }

}
    const totalPaidData = getServiceRequest("/payment/total-paid/" + appointment.id);
    const totalPaid = parseFloat(totalPaidData.totalPaid) || 0;
   
let remaining;

if (advancePayment > 0) {

    // If no payment has been made yet, show the advance amount
if (totalPaid === 0) {

    // First payment = only the advance amount
    remaining = advancePayment;

} else if (totalPaid < amount) {

    // After advance has been paid
    remaining = amount - totalPaid;

} else {

    // Fully paid
    remaining = 0;

}

} else {

    remaining = amount - totalPaid;

}

    window.currentRemaining = remaining;

    if (paymentSummaryElement) paymentSummaryElement.style.display = "block";
    if (summaryTotalElement) summaryTotalElement.textContent = "Rs. " + amount.toFixed(2);
    if (summaryPaidElement) summaryPaidElement.textContent = "Rs. " + totalPaid.toFixed(2);
    if (summaryRemainingElement) summaryRemainingElement.textContent = "Rs. " + remaining.toFixed(2);

    if (remaining <= 0) {
        textPayAmountElement.value = "";
        textPayBalanceAmountElement.value = "";
        payment.pay_amount = null;
        payment.paybalance_amount = null;
        textPayAmountElement.disabled = true;
        showToast("This appointment is fully paid. No further payment allowed.", "info");
    } else {
        textPayAmountElement.disabled = false;
        textPayAmountElement.value = "";
        textPayAmountElement.placeholder = "Enter amount (max Rs. " + remaining.toFixed(2) + ")";
        textPayBalanceAmountElement.value = "";
        payment.pay_amount = null;
        payment.paybalance_amount = null;
    }
}

function onRentalSelected(rental) {

    payment.rental_id = { id: rental.id };

    payment.selectedRental = rental;

    const customerName = rental.customer_id
        ? (rental.customer_id.firstname + " " + (rental.customer_id.lastname || "")).trim()
        : "";

    const phone = rental.customer_id
        ? (rental.customer_id.mobile || "")
        : "";

    const date = rental.appointment_date || "";

    if (customerInfoSection)
        customerInfoSection.style.display = "flex";

    textCustomerNameElement.value = customerName;

    textCustomerPhoneElement.value = phone;

    textAppointmentDateElement.value = date;

    const amount = parseFloat(rental.total_charge) || 0;

    textAppointmentAmountElement.value = amount.toFixed(2);

    payment.appointment_amount = amount;

    const totalPaidData = getServiceRequest("/payment/total-paid/rental/" + rental.id);

    const totalPaid = parseFloat(totalPaidData.totalPaid) || 0;

    const remaining = amount - totalPaid;

    window.currentRemaining = remaining;

let rentalPaymentData = getServiceRequest("/payment/total-paid/rental/" + rental.id);

let rentalPayments = rentalPaymentData.payments;

// Enable all options first
for (let option of selectRentalPaymentTypeElement.options) {
    option.disabled = false;
}

// Disable already paid payment types
if (Array.isArray(rentalPayments)) {

    rentalPayments.forEach(function (payment) {

        for (let option of selectRentalPaymentTypeElement.options) {

            if (option.value === payment.paymentType) {
                option.disabled = true;
            }

        }

    });

}

// Automatically select the next available payment type
for (let option of selectRentalPaymentTypeElement.options) {

    if (option.value !== "" && !option.disabled) {

        selectRentalPaymentTypeElement.value = option.value;

        // Trigger onchange so amounts are calculated automatically
        selectRentalPaymentTypeElement.onchange();

        break;

    }

}

    if (paymentSummaryElement)
        paymentSummaryElement.style.display = "block";

    summaryTotalElement.textContent = "Rs. " + amount.toFixed(2);

    summaryPaidElement.textContent = "Rs. " + totalPaid.toFixed(2);

    summaryRemainingElement.textContent = "Rs. " + remaining.toFixed(2);

    if (remaining <= 0) {

        textPayAmountElement.disabled = true;

        showToast("This rental is fully paid.", "info");

    } else {

        textPayAmountElement.disabled = false;

        textPayAmountElement.value = "";

        textPayBalanceAmountElement.value = "";

    }

}

function refreshPaymentTable() {
    const { page, size, sort } = getPaginationState(paymentPagination);
    const url = buildPagedUrl("/payment/getpage", page, size, sort);
    const response = getServiceRequest(url);

    let payments = (response && Array.isArray(response.content))
        ? response.content
        : (Array.isArray(response) ? response : Object.values(response || {}));

    let propertyList = [
        { propertyName: getAppointment, dataType: "function" },
        { propertyName: getCustomer, dataType: "function" },
        { propertyName: getPaymentType, dataType: "function" },
        { propertyName: getAmount, dataType: "function" },
        { propertyName: getTotalPaidForAppointment, dataType: "function" },
        { propertyName: getRemainingForAppointment, dataType: "function" },
        { propertyName: getPaymentMethod, dataType: "function" },
        { propertyName: "note", dataType: "string" }
    ];
    fillDataIntoTable(tableBodyElement, payments, propertyList, refillPaymentForm, deletePayment, printPayment, true, 'PAYMENT_UPDATE', 'PAYMENT_DELETE', null);
    renderPager(response, refreshPaymentTable, paymentPagination);
}

const getAppointment = (obj) => {

    if (obj.appointment_id) {

        return obj.appointment_id.appointment_no;

    }

    if (obj.rental_id) {

        return obj.rental_id.rent_no;

    }

    return "N/A";

}

const getAmount = (obj) => {

    if (obj.appointment_id) {
        return "Rs. " + (parseFloat(obj.appointment_amount) || 0).toFixed(2);
    }

    if (obj.rental_id) {
        return "Rs. " + (parseFloat(obj.appointment_amount) || 0).toFixed(2);
    }

    return "Rs. 0.00";

}

const getCustomer = (obj) => {

    if (obj.appointment_id && obj.appointment_id.customer_id) {

        const c = obj.appointment_id.customer_id;

        return (c.firstname + " " + (c.lastname || "")).trim();

    }

    if (obj.rental_id && obj.rental_id.customer_id) {

        const c = obj.rental_id.customer_id;

        return (c.firstname + " " + (c.lastname || "")).trim();

    }

    return "N/A";

}

const getTotalPaidForAppointment = (obj) => {

    if (obj.appointment_id) {

        let totalPaidData = getServiceRequest("/payment/total-paid/" + obj.appointment_id.id);

        let totalPaid = parseFloat(totalPaidData.totalPaid) || 0;

        return "Rs. " + totalPaid.toFixed(2);

    }

    if (obj.rental_id) {

        let totalPaidData = getServiceRequest("/payment/total-paid/rental/" + obj.rental_id.id);

        let totalPaid = parseFloat(totalPaidData.totalPaid) || 0;

        return "Rs. " + totalPaid.toFixed(2);

    }

    return "Rs. 0.00";

}

const getRemainingForAppointment = (obj) => {

    let amount = parseFloat(obj.appointment_amount) || 0;

    if (obj.appointment_id) {

        let totalPaidData = getServiceRequest("/payment/total-paid/" + obj.appointment_id.id);

        let totalPaid = parseFloat(totalPaidData.totalPaid) || 0;

        return "Rs. " + (amount - totalPaid).toFixed(2);

    }

    if (obj.rental_id) {

        let totalPaidData = getServiceRequest("/payment/total-paid/rental/" + obj.rental_id.id);

        let totalPaid = parseFloat(totalPaidData.totalPaid) || 0;

        return "Rs. " + (amount - totalPaid).toFixed(2);

    }

    return "Rs. 0.00";

}

const getPaymentMethod = (obj) => {
    return getEnumDisplayName("paymentMethod", obj.paymentMethod);
}

const getPaymentType = (obj) => {

    // Appointment payment
    if (obj.appointment_id != null) {
        return "Appointment";
    }

    // Rental payment
    if (obj.paymentType != null) {

        switch (obj.paymentType) {

            case "ADVANCE":
                return "Advance Payment";

            case "KEY_MONEY":
                return "Key Money";

            case "REMAINING":
                return "Remaining Balance";

            default:
                return obj.paymentType;

        }

    }

    return "-";

}

function checkPaymentFormErrors() {

    let errors = "";

    if (payment.paymentType === "Appointment") {

        if (textAppointmentIdElement.value === "") {
            errors += "Appointment is required.\n";
        }

    }

    if (payment.paymentType === "Rental") {

        if (textRentalIdElement.value === "") {
            errors += "Rental is required.\n";
        }

    }

    if (textPayAmountElement.value === "" || parseFloat(textPayAmountElement.value) <= 0) {
        errors += "Pay Amount is required and must be greater than 0.\n";
    }

    if (paymentMethodList.length === 0) {
        errors += "Please add at least one payment method.\n";
    }

    const payAmount = parseFloat(textPayAmountElement.value) || 0;

    payment.pay_amount = payAmount;

    payment.paybalance_amount =
        parseFloat(textPayBalanceAmountElement.value) || 0;

    // Only set payment method if one exists

    if (paymentAppointmentElement.checked) {

        if (!payment.appointment_id) {
            errors += "Appointment is required.\n";
        }

    }

    if (paymentRentalElement.checked) {

        if (!payment.rental_id) {
            errors += "Rental is required.\n";
        }

        if (selectRentalPaymentTypeElement.value === "") {
            errors += "Payment Type is required.\n";
        }

        payment.paymentType = selectRentalPaymentTypeElement.value;

}else {

    if (selectAppointmentPaymentTypeElement.value === "") {
        errors += "Payment Type is required.\n";
    }

    payment.paymentType = selectAppointmentPaymentTypeElement.value;

}

    if (!payment.paymentMethod) {
        errors += "Payment Method is required.\n";
    }

    return errors;
}
function buttonPaymentSubmit() {
    let errors = checkPaymentFormErrors();

    if (errors == "") {
        showConfirm("Confirm Submission", "Are you sure to submit the form?", "Submit", "primary").then(confirmed => {
            if (!confirmed) return;
            let serviceResponse = getHTTPServicesRequest("/payment/insert", "POST", payment);
            if (serviceResponse == "OK") {

                showToast("Form submitted successfully!", "success");

                refreshPaymentForm();
                refreshPaymentTable();

                closePanel('panelPaymentForm');
            } else {
                showToast("Form submission cancelled..! \n Have some errors.. \n" + serviceResponse, "error");
            }
        });
    } else {
        showToast("Please fill all required fields correctly..! \n" + errors, "warning");
    }

}

function deletePayment(obj) {

    showConfirm("Confirm Deletion", "Are you sure to delete payment for " + obj.appointment_id.appointment_no + " (Amount: " + obj.pay_amount + ")?", "Delete", "danger").then(confirmed => {
        if (!confirmed) return;
        let deleteResponse = getHTTPServicesRequest("/payment/delete", "DELETE", obj);
        if (deleteResponse == "OK") {

            showToast("Payment deleted successfully!", "success");

            refreshPaymentForm();
            refreshPaymentTable();
            closePanel('panelPaymentForm');
        } else {
            showToast("Payment deletion cancelled..! \n Have some errors.. \n" + deleteResponse, "error");
        }
    });
}

function printPayment(obj) {
    const newTab = window.open();
    newTab.document.write(`<!DOCTYPE html><html><head><title>Payment ${escapeHtml(obj.bill_no || "")}</title>
        <link rel="stylesheet" href="/Resources/bootstrap-5.3.7/css/bootstrap.min.css">
        <link rel="stylesheet" href="/Resources/fontawesome-7.0.0/css/all.min.css">
        <link rel="stylesheet" href="/Resources/css/common.css">
        </head><body><div class="print-card">
        <div class="print-header">
            <h3><i class="fa-solid fa-credit-card me-2"></i>Payment Details</h3>
            <p>${escapeHtml(obj.bill_no || "")}</p>
        </div>
        <div class="print-body"><table>
            <tr><th>Bill No</th><td>${escapeHtml(obj.bill_no || "N/A")}</td></tr>
            <tr><th>Appointment</th><td>${escapeHtml(obj.appointment_id ? obj.appointment_id.appointment_no : "N/A")}</td></tr>
            <tr><th>Customer</th><td>${escapeHtml(obj.appointment_id && obj.appointment_id.customer_id ? obj.appointment_id.customer_id.firstname + " " + (obj.appointment_id.customer_id.lastname || "") : "N/A")}</td></tr>
            <tr><th>Appointment Amount</th><td>Rs. ${formatCurrency(obj.appointment_amount)}</td></tr>
            <tr><th>Pay Amount</th><td>Rs. ${formatCurrency(obj.pay_amount)}</td></tr>
            <tr><th>Balance</th><td>Rs. ${formatCurrency(obj.paybalance_amount)}</td></tr>
            <tr><th>Method</th><td>${escapeHtml(getEnumDisplayName("paymentMethod", obj.paymentMethod))}</td></tr>
            <tr><th>Note</th><td>${escapeHtml(obj.note || "N/A")}</td></tr>
        </table></div>
        <div class="print-footer">Printed on ${new Date().toLocaleDateString("en-LK")} | Salon DEEN</div>
        </div></body></html>`);
    setTimeout(() => { newTab.print(); newTab.close(); }, 500);
}

function refillPaymentForm(obj) {

    payment = getServiceRequest("/payment/byid/" + obj.id);
    oldPayment = JSON.parse(JSON.stringify(payment));

    if (appointmentInputHandler) {
        searchAppointmentElement.removeEventListener("input", appointmentInputHandler);
    }

    let appointments = getServiceRequest("/appointment/alldata");
    let payableAppointments = appointments.filter(a => a.appointmentStatus !== 'CANCELLED');
    populateAppointmentDataList(payableAppointments);

    const selectedAppt = payableAppointments.find(a => a.id === payment.appointment_id?.id);
    if (selectedAppt) {
        const customerName = selectedAppt.customer_id
            ? (selectedAppt.customer_id.firstname + " " + (selectedAppt.customer_id.lastname || "")).trim()
            : "Unknown";
        const phone = selectedAppt.customer_id ? (selectedAppt.customer_id.mobile || "") : "";
        searchAppointmentElement.value = selectedAppt.appointment_no + " - " + customerName + " - " + phone + " - " + (selectedAppt.date || "");
        textAppointmentIdElement.value = selectedAppt.id;

        if (customerInfoSection) customerInfoSection.style.display = "flex";
        if (textCustomerNameElement) textCustomerNameElement.value = customerName;
        if (textCustomerPhoneElement) textCustomerPhoneElement.value = phone;
        if (textAppointmentDateElement) textAppointmentDateElement.value = selectedAppt.date || "";
    }

const paymentMethodSelect = document.getElementById("selectPaymentMethod");

if (paymentMethodSelect) {
    paymentMethodSelect.value = payment.paymentMethod || "";
}

    textAppointmentAmountElement.value = payment.appointment_amount;
    textPayAmountElement.value = payment.pay_amount;
    textPayBalanceAmountElement.value = payment.paybalance_amount;
    // textPaymentNoteElement.value = payment.note;
//     if (textPaymentNoteElement) {
//     textPaymentNoteElement.value = payment.note || "";
// }

    const amount = parseFloat(payment.appointment_amount) || 0;
    const totalPaidData = getServiceRequest("/payment/total-paid/" + payment.appointment_id?.id);
    const totalPaid = parseFloat(totalPaidData.totalPaid) || 0;
    const remaining = amount - totalPaid;
    window.currentRemaining = remaining;

    if (paymentSummaryElement) paymentSummaryElement.style.display = "block";
    if (summaryTotalElement) summaryTotalElement.textContent = "Rs. " + amount.toFixed(2);
    if (summaryPaidElement) summaryPaidElement.textContent = "Rs. " + totalPaid.toFixed(2);
    if (summaryRemainingElement) summaryRemainingElement.textContent = "Rs. " + remaining.toFixed(2);

    setPaymentFormMode('edit');

    openPanel('panelPaymentForm');

}

const checkFormUpdates = () => {

    let updates = "";

    if (payment.appointment_id !== oldPayment.appointment_id) {
        updates += "Appointment changed from " + oldPayment.appointment_id + " to " + payment.appointment_id + "\n";
    }
    if (payment.paymentMethod !== oldPayment.paymentMethod) {
        updates += "Payment method changed from " + oldPayment.paymentMethod + " to " + payment.paymentMethod + "\n";
    }
    if (payment.pay_amount !== oldPayment.pay_amount) {
        updates += "Pay Amount changed from " + oldPayment.pay_amount + " to " + payment.pay_amount + "\n";
    }
    if (payment.paybalance_amount !== oldPayment.paybalance_amount) {
        updates += "Balance Amount changed from " + oldPayment.paybalance_amount + " to " + payment.paybalance_amount + "\n";
    }
    if (payment.note !== oldPayment.note) {
        updates += "Note changed from " + oldPayment.note + " to " + payment.note + "\n";
    }
    return updates;

}

function buttonPaymentUpdate() {

    let errors = checkPaymentFormErrors();
    if (errors == "") {
        let updates = checkFormUpdates();
        if (updates == "") {
            showToast("No changes detected to update.", "info");
        } else {
            showConfirm("Confirm Update", "Are you sure to update the payment with following changes..? \n" + updates, "Update", "primary").then(confirmed => {
                if (!confirmed) return;
                let serviceResponse = getHTTPServicesRequest("/payment/update", "PUT", payment);
                if (serviceResponse == "OK") {

                    showToast("Payment updated successfully!", "success");

                    refreshPaymentForm();
                    refreshPaymentTable();
                    closePanel('panelPaymentForm');
                } else {
                    showToast("Payment update cancelled..! \n Have some errors.. \n" + serviceResponse, "error");
                }
            });
        }
    } else {
        showToast("Please fill all required fields correctly..! \n" + errors, "warning");
    }

}

function addPaymentMethod() {

    let method = document.getElementById("selectPaymentMethod").value;

    let amount = parseFloat(document.getElementById("textMethodAmount").value);

    if (method == "") {

        showToast("Please select payment method", "warning");

        return;

    }

    if (!amount || amount <= 0) {

        showToast("Please enter payment amount", "warning");

        return;

    }

    paymentMethodList.push({

        method: method,

        amount: amount

    });

    payment.paymentMethod = method;

    refreshPaymentMethodInnerTable();

}
function refreshPaymentMethodInnerTable() {

    let tbody = document.getElementById("tableBodyPaymentMethod");

    tbody.innerHTML = "";

    let totalPaid = 0;

    paymentMethodList.forEach((item, index) => {

        totalPaid += item.amount;

        tbody.innerHTML += `

        <tr>

            <td>${index + 1}</td>

            <td>${item.method}</td>

            <td>Rs. ${item.amount.toFixed(2)}</td>

            <td>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="removePaymentMethod(${index})">

                    Remove

                </button>

            </td>

        </tr>

        `;

    });

    textPayAmountElement.value = totalPaid.toFixed(2);

let remaining;

// Key Money is a refundable deposit.
// It does NOT reduce the rental balance.
if (payment.paymentType === "KEY_MONEY") {

    remaining = window.currentRemaining;

} else {

    remaining = window.currentRemaining - totalPaid;

}

textPayBalanceAmountElement.value = remaining.toFixed(2);

payment.paybalance_amount = remaining;

}

function removePaymentMethod(index) {

    paymentMethodList.splice(index, 1);

    refreshPaymentMethodInnerTable();

}
function loadAppointmentData() {

    let appointments = getServiceRequest("/appointment/alldata");

    let payableAppointments = appointments.filter(function (appointment) {

        if (appointment.appointmentStatus === "CANCELLED") {
            return false;
        }

        let totalPaidData = getServiceRequest("/payment/total-paid/" + appointment.id);

        let totalPaid = parseFloat(totalPaidData.totalPaid) || 0;

        let appointmentAmount = parseFloat(appointment.price) || 0;

        return totalPaid < appointmentAmount;

    });

    populateAppointmentDataList(payableAppointments);

}

function loadRentalData() {

    let rentals = getServiceRequest("/rental/alldata");

    let payableRentals = rentals.filter(function (rental) {

        if (rental.rental_status === "COMPLETED") {
            return false;
        }

        let totalPaidData = getServiceRequest("/payment/total-paid/rental/" + rental.id);

        let totalPaid = parseFloat(totalPaidData.totalPaid) || 0;

        let rentalAmount = parseFloat(rental.total_charge) || 0;

        return totalPaid < rentalAmount;

    });

    populateRentalDataList(payableRentals);

}