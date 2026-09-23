window.addEventListener("load", () => {
    populateFilterDropdowns();
    loadData();
});

let allAppointments = [];

function populateFilterDropdowns() {
    let packages = getServiceRequest("/service_package/alldata");
    if (Array.isArray(packages)) {
        fillDataIntoSelectById(document.getElementById("filterPackage"), "All", packages, "id", "package_name");
    } else if (packages && typeof packages === "object") {
        fillDataIntoSelectById(document.getElementById("filterPackage"), "All", Object.values(packages), "id", "package_name");
    }

    let services = getServiceRequest("/service/alldata");
    if (Array.isArray(services)) {
        fillDataIntoSelectById(document.getElementById("filterService"), "All", services, "id", "name");
    } else if (services && typeof services === "object") {
        fillDataIntoSelectById(document.getElementById("filterService"), "All", Object.values(services), "id", "name");
    }
}

function loadData() {
    allAppointments = getServiceRequest("/reports/service_appointments/data");
    if (!Array.isArray(allAppointments)) allAppointments = Object.values(allAppointments || {});
    applyFilters();
}

function applyFilters() {
    let filtered = [...allAppointments];
    const fromDate = document.getElementById("filterDateFrom").value;
    const toDate = document.getElementById("filterDateTo").value;
    const packageId = document.getElementById("filterPackage").value;
    const serviceId = document.getElementById("filterService").value;

    if (fromDate) filtered = filtered.filter(a => a.date >= fromDate);
    if (toDate) filtered = filtered.filter(a => a.date <= toDate);

    if (packageId) {
        filtered = filtered.filter(a =>
            Array.isArray(a.appointmentHasServicePackageList) &&
            a.appointmentHasServicePackageList.some(p =>
                p.service_package_id && String(p.service_package_id.id) === String(packageId)
            )
        );
    }

    if (serviceId) {
        filtered = filtered.filter(a =>
            Array.isArray(a.appointmentHasServicePackageList) &&
            a.appointmentHasServicePackageList.some(p =>
                p.service_package_id &&
                Array.isArray(p.service_package_id.servicePackageHasServiceList) &&
                p.service_package_id.servicePackageHasServiceList.some(s =>
                    s.service_id && String(s.service_id.id) === String(serviceId)
                )
            )
        );
    }

    renderTable(filtered);
    updateSummary(filtered);
}

function clearFilters() {
    document.getElementById("filterDateFrom").value = "";
    document.getElementById("filterDateTo").value = "";
    document.getElementById("filterPackage").value = "";
    document.getElementById("filterService").value = "";
    applyFilters();
}

function renderTable(data) {
    const propertyList = [
        { propertyName: "appointment_no", dataType: "string" },
        { propertyName: "date", dataType: "date" },
        { propertyName: getPackages, dataType: "function" },
        { propertyName: getServices, dataType: "function" },
        { propertyName: "duration", dataType: "string" },
        { propertyName: "price", dataType: "currency" },
        { propertyName: getStatus, dataType: "function" },
    ];
    fillDataIntoTable(document.getElementById("tableBodyServiceAppointments"), data, propertyList, null, null, printAppointmentRow);
}

const printAppointmentRow = (obj) => {
    const newTab = window.open();
    newTab.document.write(`<!DOCTYPE html><html><head><title>Appointment ${escapeHtml(obj.appointment_no || "")}</title>
        <link rel="stylesheet" href="/Resources/bootstrap-5.3.7/css/bootstrap.min.css">
        <link rel="stylesheet" href="/Resources/fontawesome-7.0.0/css/all.min.css">
        <link rel="stylesheet" href="/Resources/css/common.css">
        </head><body><div class="print-card">
        <div class="print-header">
            <h3><i class="fa-solid fa-calendar-check me-2"></i>Appointment Details</h3>
            <p>${escapeHtml(obj.appointment_no || "")}</p>
        </div>
        <div class="print-body"><table>
            <tr><th>Appointment No</th><td>${escapeHtml(obj.appointment_no || "N/A")}</td></tr>
            <tr><th>Date</th><td>${formatDate(obj.date)}</td></tr>
            <tr><th>Employee</th><td>${escapeHtml(obj.employee_id ? obj.employee_id.fullname : "N/A")}</td></tr>
            <tr><th>Packages</th><td>${escapeHtml(getPackagesText(obj) || "N/A")}</td></tr>
            <tr><th>Services</th><td>${escapeHtml(getServicesText(obj) || "N/A")}</td></tr>
            <tr><th>Duration</th><td>${escapeHtml(obj.duration || "N/A")} min</td></tr>
            <tr><th>Price</th><td>Rs. ${formatCurrency(obj.price)}</td></tr>
            <tr><th>Status</th><td>${escapeHtml(getEnumDisplayName("appointmentStatus", obj.appointmentStatus))}</td></tr>
            <tr><th>Booking Method</th><td>${escapeHtml(getEnumDisplayName("bookingMethod", obj.bookingMethod))}</td></tr>
        </table></div>
        <div class="print-footer">Printed on ${new Date().toLocaleDateString("en-LK")} | Salon DEEN</div>
        </div></body></html>`);
    setTimeout(() => { newTab.print(); newTab.close(); }, 500);
};

const getStatus = (obj) => getEnumDisplayName("appointmentStatus", obj.appointmentStatus);

const getPackages = (obj) => {
    if (!obj || !Array.isArray(obj.appointmentHasServicePackageList)) return "";
    return obj.appointmentHasServicePackageList
        .map(p => p.service_package_id && p.service_package_id.package_name)
        .filter(Boolean)
        .map(escapeHtml)
        .join("<br>");
};

const getPackagesText = (obj) => {
    if (!obj || !Array.isArray(obj.appointmentHasServicePackageList)) return "";
    return obj.appointmentHasServicePackageList
        .map(p => p.service_package_id && p.service_package_id.package_name)
        .filter(Boolean)
        .join(", ");
};

const getServices = (obj) => {
    if (!obj || !Array.isArray(obj.appointmentHasServicePackageList)) return "";
    const names = [];
    obj.appointmentHasServicePackageList.forEach(p => {
        const pkg = p.service_package_id;
        if (pkg && Array.isArray(pkg.servicePackageHasServiceList)) {
            pkg.servicePackageHasServiceList.forEach(s => {
                if (s.service_id && s.service_id.name) names.push(s.service_id.name);
            });
        }
    });
    return [...new Set(names)].map(escapeHtml).join("<br>");
};

const getServicesText = (obj) => {
    if (!obj || !Array.isArray(obj.appointmentHasServicePackageList)) return "";
    const names = [];
    obj.appointmentHasServicePackageList.forEach(p => {
        const pkg = p.service_package_id;
        if (pkg && Array.isArray(pkg.servicePackageHasServiceList)) {
            pkg.servicePackageHasServiceList.forEach(s => {
                if (s.service_id && s.service_id.name) names.push(s.service_id.name);
            });
        }
    });
    return [...new Set(names)].join(", ");
};

function updateSummary(data) {
    const completed = data.filter(a => a.appointmentStatus === "COMPLETED").length;
    const cancelled = data.filter(a => a.appointmentStatus === "CANCELLED").length;
    const revenue = data.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);
    document.getElementById("totalAppointments").textContent = data.length;
    document.getElementById("completedCount").textContent = completed;
    document.getElementById("cancelledCount").textContent = cancelled;
    document.getElementById("totalApptRevenue").textContent = "Rs. " + formatCurrency(revenue);
}

function printReport() { window.print(); }

function exportCSV() {
    let csv = "Appt No,Date,Packages,Services,Duration,Price,Status\n";
    const rows = document.querySelectorAll("#tableBodyServiceAppointments tr");
    rows.forEach(tr => {
        const cells = tr.querySelectorAll("td");
        if (cells.length < 8) return;
        const values = [
            cells[1].innerText,
            cells[2].innerText,
            cells[3].innerText,
            cells[4].innerText,
            cells[5].innerText,
            cells[6].innerText,
            cells[7].innerText,
        ];
        csv += values.map(v => `"${(v || "").replace(/"/g, '""')}"`).join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const el = document.createElement("a");
    el.href = URL.createObjectURL(blob);
    el.download = "service_appointments_report.csv";
    el.click();
}
