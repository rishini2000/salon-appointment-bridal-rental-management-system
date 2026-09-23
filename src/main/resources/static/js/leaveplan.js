// On window load, refresh main form and table
window.addEventListener("load", () => {
    refreshMonthlyAvailablePlanForm();
    refreshMonthlyAvailablePlanTable();
});

// Main form element references
const searchEmployeeElement = document.querySelector("#searchEmployee");
const listEmployeeElement = document.querySelector("#listEmployee");
const selectEmployeeHidden = document.querySelector("#selectEmployee");
const selectLeaveTypeElement = document.querySelector("#selectLeaveType");
const buttonSubmit = document.getElementById("buttonSubmit");
const buttonClear = document.getElementById("buttonClear");
const buttonUpdate = document.getElementById("buttonUpdate");
const tableBodyElement = document.querySelector("#tableBodyMonthlyAvailablePlan");

let calendar;
let selectedLeaveDates = [];
let leaveTypeOptions = [];

const COLOR_PERM_LEAVE   = "#dc3545";
const COLOR_FULL_DAY     = "#0d6efd";
const COLOR_HALF_MORNING = "#198754";
const COLOR_HALF_AFTERNOON = "#fd7e14";

const KIND_PERM_LEAVE  = "perm";
const KIND_BOOKED      = "booked";
const KIND_DRAFT       = "draft";

let permLeaveDays = [];
let bookedLeaves  = [];
let currentEmployeeId = null;

const LT_FULL_DAY = "FULL_DAY";
const LT_HALF_DAY_MORNING = "HALF_DAY_MORNING";
const LT_HALF_DAY_AFTERNOON = "HALF_DAY_AFTERNOON";

function isFullDay(value) {
    return value === LT_FULL_DAY
        || (typeof value === "string"
            && value.trim().toLowerCase() === "full day");
}

function isHalfMorning(value) {
    return value === LT_HALF_DAY_MORNING
        || (typeof value === "string"
            && /morning/i.test(value));
}

function isHalfAfternoon(value) {
    return value === LT_HALF_DAY_AFTERNOON
        || (typeof value === "string"
            && /afternoon/i.test(value));
}

function isHalfDay(value) {
    return isHalfMorning(value) || isHalfAfternoon(value);
}

function colorForLeaveType(value) {
    if (isHalfMorning(value)) return COLOR_HALF_MORNING;
    if (isHalfAfternoon(value)) return COLOR_HALF_AFTERNOON;
    return COLOR_FULL_DAY;
}

function titleForLeaveType(value) {
    if (isHalfMorning(value)) return "Half Day Morning";
    if (isHalfAfternoon(value)) return "Half Day Afternoon";
    return "Full Day";
}

window.addEventListener("load", () => {
    refreshMonthlyAvailablePlanForm();
    initializeCalendar();
});

function initializeCalendar() {

    let calendarElement =
        document.getElementById("calendar");

    calendar = new FullCalendar.Calendar(calendarElement, {

        initialView: "dayGridMonth",

        dateClick: function (info) {

            if (!selectLeaveTypeElement.value) {
                showToast("Please select a leave type first", "warning");
                return;
            }

            const idx = selectedLeaveDates.indexOf(info.dateStr);
            if (idx !== -1) {
                selectedLeaveDates.splice(idx, 1);
                const ev = calendar.getEvents().find(e =>
                    e.start && e.startStr === info.dateStr && e.extendedProps && e.extendedProps.kind === KIND_DRAFT);
                if (ev) ev.remove();
                return;
            }

            const currentType = selectLeaveTypeElement.value;
            calendar.addEvent({
                title: titleForLeaveType(currentType),
                start: info.dateStr,
                color: colorForLeaveType(currentType),
                extendedProps: { kind: KIND_DRAFT, leaveType: currentType }
            });

            selectedLeaveDates.push(info.dateStr);

        },

        datesSet: function () {
            renderPermLeaveHighlights();
            renderBookedLeaveHighlights();
        }

    });

    calendar.render();
}

function clearCalendarByKind(kind) {
    calendar.getEvents().slice().forEach(e => {
        if (e.extendedProps && e.extendedProps.kind === kind) e.remove();
    });
}

function renderPermLeaveHighlights() {
    clearCalendarByKind(KIND_PERM_LEAVE);
    if (!permLeaveDays.length) return;

    const viewStart = calendar.view.currentStart;
    const viewEnd   = calendar.view.currentEnd;
    for (let d = new Date(viewStart); d < viewEnd; d.setDate(d.getDate() + 1)) {
        const weekday = d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        if (permLeaveDays.includes(weekday)) {
            const ds = formatLocalDate(d);
            calendar.addEvent({
                title: "Weekly Holiday",
                start: ds,
                color: COLOR_PERM_LEAVE,
                display: "background",
                extendedProps: { kind: KIND_PERM_LEAVE }
            });
        }
    }
}

function renderBookedLeaveHighlights() {
    clearCalendarByKind(KIND_BOOKED);
    if (!bookedLeaves.length) return;
    for (const bd of bookedLeaves) {
        const lt = bd.leave_type;
        calendar.addEvent({
            title: titleForLeaveType(lt),
            start: bd.leave_date,
            color: colorForLeaveType(lt),
            extendedProps: { kind: KIND_BOOKED, leaveType: lt }
        });
    }
}

function formatLocalDate(d) {
    const y  = d.getFullYear();
    const m  = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

//employee change event to load employee's permanent leaves and booked leaves
searchEmployeeElement.addEventListener("change", function () {

    loadEmployeeLeaves();

});
// Helper to show/hide panel
function showModal() {
    openPanel('panelLeavePlanForm');
}
function hideModal() {
    closePanel('panelLeavePlanForm');
}


function loadEmployeeLeaves() {

    let employeeId = selectEmployeeHidden.value;

    if (!employeeId) {
        permLeaveDays = [];
        bookedLeaves  = [];
        currentEmployeeId = null;
        document.querySelector("#permanentLeaveDays").innerHTML = "";
        renderPermLeaveHighlights();
        renderBookedLeaveHighlights();
        return;
    }

    currentEmployeeId = parseInt(employeeId);

    const permLeaves = getServiceRequest(
        "/employeepermleave/byemployee?employeeid=" + currentEmployeeId
    ) || [];

    permLeaveDays = permLeaves.map(pl => pl.day_of_week.toLowerCase());

    const labelEl = document.querySelector("#permanentLeaveDays");
    labelEl.innerHTML = permLeaveDays.length
        ? permLeaveDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")
        : "—";

    bookedLeaves = getServiceRequest(
        "/leave_day/byemployee?employeeid=" + currentEmployeeId
    ) || [];

    renderPermLeaveHighlights();
    renderBookedLeaveHighlights();

    clearCalendarByKind(KIND_DRAFT);
    selectedLeaveDates = [];

}

// Backward-compatible alias used by existing change handler
function loadEmployeePermanentLeaves() {
    loadEmployeeLeaves();
}

const refreshMonthlyAvailablePlanForm = () => {
    let employees =
        getServiceRequest("/employee/alldata");

    console.log("Employees =", employees);

    document.getElementById("formMonthlyAvailablePlan").reset();
    leavePlan = new Object();
    oldLeavePlan = null;
    permLeaveDays = [];
    bookedLeaves  = [];
    selectedLeaveDates = [];
    currentEmployeeId = null;

    populateDataList(
        listEmployeeElement,
        searchEmployeeElement,
        selectEmployeeHidden,
        employees,
        (emp) => emp.empno + " - " + emp.fullname,
        "id"
    );

    // Fetch canonical leave types from the backend
    leaveTypeOptions = getServiceRequest("/leaveplan/leavetypes") || [];

    selectLeaveTypeElement.innerHTML = "";
    let placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.selected = "selected";
    placeholder.disabled = "disabled";
    placeholder.innerText = "-- Select Leave Type --";
    selectLeaveTypeElement.appendChild(placeholder);

    leaveTypeOptions.forEach(lt => {
        let opt = document.createElement("option");
        opt.value = lt.value;
        opt.innerText = lt.displayName;
        selectLeaveTypeElement.appendChild(opt);
    });

    document.querySelector('#panelLeavePlanForm .offcanvas-title').textContent = 'New Leave Plan';
    buttonUpdate.style.display = "none";
    buttonSubmit.style.display = "inline-block";

    clearValidation(searchEmployeeElement);

    if (calendar) {
        clearCalendarByKind(KIND_PERM_LEAVE);
        clearCalendarByKind(KIND_BOOKED);
        clearCalendarByKind(KIND_DRAFT);
    }
}

const refreshMonthlyAvailablePlanTable = () => {

    let leavePlans =
        getServiceRequest("/leaveplan/alldata");

    tableBodyElement.innerHTML = "";

    const propertyList = [
        { propertyName: getEmpNo, dataType: "function" },
        { propertyName: getEmployeeName, dataType: "function" },
        { propertyName: getLeaveType, dataType: "function" },
        { propertyName: getLeaveDates, dataType: "function" }
    ];

    fillDataIntoTable(
        tableBodyElement,
        leavePlans,
        propertyList,
        refillLeavePlanForm,
        deleteLeaveplan,
        printLeaveplan,
        true,
        'LEAVEPLAN_UPDATE',
        'LEAVEPLAN_DELETE',
        null
    );
}

const getEmpNo = (plan) => {
    return plan.employee_id.empno;
}

const getEmployeeName = (plan) => {
    return plan.employee_id.fullname;
}

const getLeaveType = (plan) => {
    return titleForLeaveType(plan.leaveType) || "Full Day";
}

const getLeaveDates = (plan) => {
    if (!plan.leaveDays || plan.leaveDays.length === 0) return "—";
    return plan.leaveDays
        .map(d => d.leave_date)
        .filter(Boolean)
        .sort()
        .join(", ");
}


function checkLeaveplanFormErrors() {

    let errors = "";

    if (!selectEmployeeHidden.value) {
        errors += "Employee is required.\n";
    }

    if (!selectedLeaveDates.length) {
        errors += "Please select at least one leave date on the calendar.\n";
    }

    if (!selectLeaveTypeElement.value) {
        errors += "Leave type is required.\n";
    }

    const months = new Set(selectedLeaveDates.map(d => d.slice(0, 7)));
    if (months.size > 1) {
        errors += "All selected dates must be in the same calendar month.\n";
    }

    return errors;
}

function submitLeaveplanForm() {

    let errors = checkLeaveplanFormErrors();
    if (errors == "") {
        showConfirm("Confirm Submit", "Are you sure to submit the form ?", "Submit", "primary").then(confirmed => {
            if (!confirmed) return;
            let leavePlan = {

                employee_id: {
                    id: parseInt(selectEmployeeHidden.value)
                },

                leaveType: selectLeaveTypeElement.value,

                leaveDates: selectedLeaveDates
            };

            console.log(selectedLeaveDates);
            // console.log(leavePlan);
            let serviceResponse = getHTTPServicesRequest("/leaveplan/insert", "POST", leavePlan);
            if (serviceResponse == "OK") {
                showToast("Form submitted successfully!", "success");

                refreshMonthlyAvailablePlanForm();
                refreshMonthlyAvailablePlanTable();

                closePanel('panelLeavePlanForm');
            } else {
                showToast("Form submission cancelled..! \n Have some errors.. \n" + serviceResponse, "error");
            }
        });
    } else {
        showToast("Please fill all required fields correctly..! \n" + errors, "warning");
    }
}

function deleteLeaveplan(obj) {

    showConfirm("Confirm Delete", "Are you sure to delete leaveplan : " + obj.leaveplan_id + " ?", "Delete", "danger").then(confirmed => {
        if (!confirmed) return;
        let serviceResponse = getHTTPServicesRequest("/leaveplan/delete", "DELETE", obj);
        if (serviceResponse == "OK") {
            showToast("Leaveplan deleted successfully!", "success");

            refreshMonthlyAvailablePlanForm();
            refreshMonthlyAvailablePlanTable();
            closePanel('panelLeavePlanForm');
        } else {
            showToast("Leaveplan deletion cancelled..! \n Have some errors.. \n" + serviceResponse, "error");
        }
    });
}

function printLeaveplan(obj) {
    const newTab = window.open();
    newTab.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Leaveplan - ${escapeHtml(obj.leaveplan_id)}</title>
    <link rel="stylesheet" href="/Resources/bootstrap-5.3.7/css/bootstrap.min.css">
    <link rel="stylesheet" href="/Resources/fontawesome-7/fonts/all.min.css">
    <style>
        body { background: #f8f9fa; }
        .card { box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: none; border-radius: 12px; overflow: hidden; }
        .card-header { padding: 20px 24px; }
        .card-header h3 { margin: 0; font-weight: 700; }
        .info-row { border-bottom: 1px solid #eee; padding: 12px 0; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: 600; color: #555; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-value { font-size: 1.05rem; color: #222; }
        @media print { body { background: #fff; } .card { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="container py-5">
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-7">
                <div class="card">
                    <div class="card-header bg-primary text-light text-center">
                        <h3><i class="fa-solid fa-calendar-days me-2"></i>Leaveplan Details</h3>
                    </div>
                    <div class="card-body p-4">
                        <div class="row info-row">
                            <div class="col-5 info-label">Leaveplan ID</div>
                            <div class="col-7 info-value">${escapeHtml(obj.leaveplan_id)}</div>
                        </div>
                        <div class="row info-row">
                            <div class="col-5 info-label">Employee Name</div>
                            <div class="col-7 info-value">${escapeHtml(obj.employee_id.fullname)}</div>
                        </div>
                        <div class="row info-row">
                            <div class="col-5 info-label">Employee No</div>
                            <div class="col-7 info-value">${escapeHtml(obj.employee_id.empno)}</div>
                        </div>
                        <div class="row info-row">
                            <div class="col-5 info-label">Leave Type</div>
                            <div class="col-7 info-value">${escapeHtml(titleForLeaveType(obj.leaveType) || "Full Day")}</div>
                        </div>
                        <div class="row info-row">
                            <div class="col-5 info-label">Leave Dates</div>
                            <div class="col-7 info-value">${escapeHtml(getLeaveDates(obj))}</div>
                        </div>
                        <div class="row info-row">
                            <div class="col-5 info-label">Status</div>
                            <div class="col-7 info-value">${escapeHtml(obj.status)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`);
    setTimeout(() => {
        newTab.print();
        newTab.close();
    }, 400);
}


const refillLeavePlanForm = (ob) => {
    leavePlan = getServiceRequest("/leaveplan/alldata").find(lp => lp.id === ob.id);
    oldLeavePlan = JSON.parse(JSON.stringify(leavePlan));

    // Re-populate employee datalist
    let employees = getServiceRequest("/employee/alldata");
    populateDataList(
        listEmployeeElement,
        searchEmployeeElement,
        selectEmployeeHidden,
        employees,
        (emp) => emp.empno + " - " + emp.fullname,
        "id"
    );

    if (leavePlan.employee_id)
        setSelectedByHiddenId(searchEmployeeElement, selectEmployeeHidden, employees, (emp) => emp.empno + " - " + emp.fullname, "id", leavePlan.employee_id.id);

    // Match the saved leaveType to one of the canonical enum values
    if (leavePlan.leaveType) {
        const match = leaveTypeOptions.find(lt => lt.displayName === leavePlan.leaveType)
            || leaveTypeOptions.find(lt => lt.value === leavePlan.leaveType);
        if (match) selectLeaveTypeElement.value = match.value;
    }

    buttonUpdate.style.display = "inline-block";
    buttonSubmit.style.display = "none";
    document.querySelector('#panelLeavePlanForm .offcanvas-title').textContent = 'Edit Leave Plan';
    openPanel('panelLeavePlanForm');

    // Load perm + booked leaves for the employee, and pre-fill selectedLeaveDates with this plan's booked days
    loadEmployeeLeaves();
    clearCalendarByKind(KIND_DRAFT);
    selectedLeaveDates = [];

    const thisPlanBooked = leavePlan.leaveDays || [];

    thisPlanBooked.forEach(b => {
        if (!b.leave_date) return;
        selectedLeaveDates.push(b.leave_date);
        const lt = leavePlan.leaveType;
        calendar.addEvent({
            title: titleForLeaveType(lt),
            start: b.leave_date,
            color: colorForLeaveType(lt),
            extendedProps: { kind: KIND_DRAFT, leaveType: lt }
        });
    });
};

function updateMonthlyAvailablePlanForm() {
    if (!selectEmployeeHidden.value) { showToast("Employee is required", "error"); return; }

    const months = new Set(selectedLeaveDates.map(d => d.slice(0, 7)));
    if (months.size > 1) {
        showToast("All selected dates must be in the same calendar month.", "error");
        return;
    }

    leavePlan.employee_id = { id: parseInt(selectEmployeeHidden.value) };
    leavePlan.leaveType = selectLeaveTypeElement.value;

    showConfirm("Confirm Update", "Are you sure you want to update this leave plan?", "Update", "primary").then(confirmed => {
        if (!confirmed) return;
        let serverResponse = getHTTPServicesRequest("/leaveplan/update", "PUT", leavePlan);
        if (serverResponse === "OK") {
            showToast("Leave plan updated successfully!", "success");
            refreshMonthlyAvailablePlanForm();
            refreshMonthlyAvailablePlanTable();
            closePanel('panelLeavePlanForm');
        } else {
            showToast("Failed to update leave plan. " + serverResponse, "error");
        }
    });
}
