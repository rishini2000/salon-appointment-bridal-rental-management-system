const getServiceRequest = (url) => {

    let getResponces = [];

    $.ajax({

        url: url,
        type: "GET",
        async: false,
        dataType: "json",
        success: function (response) {
            console.log("Success:", response);
            getResponces = response;
            // fillDataIntoTable();
        },
        error: function (xhr, status, error) {
            console.log(error);
            console.log(xhr);
            console.log(status);
            // getResponces = status;
        },
        complete: function () {
            console.log("Request completed");
        }
    });


    return getResponces;
}


const getHTTPServicesRequest = (url, method, data) => {

    let ServicesResponces = "";

    let ajaxOptions = {
        url: url,
        type: method,
        async: false,
        dataType: "text",

        success: function (response) {
            console.log("Data received:", response);
            ServicesResponces = response;
        },

        error: function (_xhr, status, error) {
            console.error("AJAX Error:", status, error);
            ServicesResponces = "AJAX Error: " + status + " - " + error;
        },

        complete: function () {
            console.log("Ajax Request completed");
        }
    };

    // If FormData is being sent
    if (data instanceof FormData) {

        ajaxOptions.data = data;

        // IMPORTANT:
        // Do not set Content-Type manually.
        // jQuery will automatically set multipart/form-data
        // with the correct boundary.
        ajaxOptions.processData = false;
        ajaxOptions.contentType = false;

    } else {

        // Normal JSON request
        ajaxOptions.data = JSON.stringify(data);
        ajaxOptions.contentType = "application/json";
    }

    $.ajax(ajaxOptions);

    return ServicesResponces;
};



const textValidator = (element, pattern, object, property) => {

    let elementValue = element.value;
    let regOb = new RegExp(pattern);

    if (elementValue != "") {
        if (regOb.test(elementValue)) {
            setValid(element);
            object[property] = elementValue;

        } else {
            setInvalid(element);
            object[property] = null;
        }
    } else {
        if (element.required) {
            setInvalid(element);
        } else {
            clearValidation(element);
        }
        object[property] = null;
    }
}



function fillDataIntoSelect(element, message, dataList, property) {
    element.innerHTML = "";
    let optionMsg = document.createElement("option");
    optionMsg.selected = "selected";
    optionMsg.disabled = "disabled";
    optionMsg.value = "";
    optionMsg.innerText = message;
    element.appendChild(optionMsg);
dataList.forEach(dataOb => {
    let option = document.createElement("option");

    if (typeof dataOb === "string") {
        option.value = dataOb;
        option.innerText = dataOb;
    } else {
        option.value = JSON.stringify(dataOb);
        option.innerText = dataOb[property];
    }

    element.appendChild(option);
});
}

// New: fillDataIntoSelectById - sets option.value to id or package_id
function fillDataIntoSelectById(element, message, dataList, valueProperty, textProperty) {
    element.innerHTML = "";
    let optionMsg = document.createElement("option");
    optionMsg.selected = "selected";
    optionMsg.disabled = "disabled";
    optionMsg.value = "";
    optionMsg.innerText = message;
    element.appendChild(optionMsg);
    dataList.forEach(dataOb => {
        let option = document.createElement("option");
        option.value = dataOb[valueProperty] || dataOb["id"] || dataOb["package_id"];
        option.innerText = dataOb[textProperty];
        element.appendChild(option);
    });
}


const clearElement = (elements) => {
    elements.forEach(element => {
        if (element) {
            clearValidation(element);
        }
    });
}


// ---- Enum Helpers ----

// Cache enum data to avoid repeated AJAX calls
const enumCache = {};

const getEnumData = (enumName) => {
    if (!enumCache[enumName]) {
        enumCache[enumName] = getServiceRequest("/api/enums/" + enumName);
    }
    return enumCache[enumName];
};

const getEnumDisplayName = (enumName, enumValue) => {
    if (!enumValue) return "";
    let data = getEnumData(enumName);
    let found = data.find(e => e.name === enumValue || e.displayName === enumValue);
    return found ? found.displayName : enumValue;
};

const fillSelectFromEnum = (element, enumName, message) => {
    let data = getEnumData(enumName);
    fillDataIntoSelectById(element, message, data, "displayName", "displayName");
};

// ---- Formatting Utilities ----

const formatTableDate = (value) => {
    if (!value) return "";
    try {
        const d = new Date(value);
        if (isNaN(d.getTime())) return value;
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return d.getDate().toString().padStart(2, "0") + " " + months[d.getMonth()] + " " + d.getFullYear();
    } catch (e) {
        return value;
    }
};

const formatTableDateTime = (value) => {
    if (!value) return "";
    try {
        const d = new Date(value);
        if (isNaN(d.getTime())) return value;
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return d.getDate().toString().padStart(2, "0") + " " + months[d.getMonth()] + " " + d.getFullYear() +
            " " + d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0");
    } catch (e) {
        return value;
    }
};

const formatTableCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return "Rs. " + num.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatTableNumber = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString("en-LK");
};

// ---- Utility Helpers ----

const escapeHtml = (str) => {
    if (str === null || str === undefined) return "";
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
};

const capitalize = (str) => {
    if (!str) return "";
    str = String(str);
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const calculateAge = (dob) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return "";
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age >= 0 ? age : "";
};

const formatDate = (value) => {
    if (!value) return "";
    try {
        const d = new Date(value);
        if (isNaN(d.getTime())) return value;
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return d.getDate().toString().padStart(2, "0") + " " + months[d.getMonth()] + " " + d.getFullYear();
    } catch (e) {
        return value;
    }
};

const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "0.00";
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ---- Cell Renderer ----

const renderTableCell = (td, data, property) => {
    if (property.dataType === "string") {
        td.innerText = data[property.propertyName] || "";
    } else if (property.dataType === "function") {
        td.innerHTML = typeof property.propertyName === "function" ? property.propertyName(data) : "";
    } else if (property.dataType === "date") {
        td.innerText = formatTableDate(data[property.propertyName]);
    } else if (property.dataType === "datetime") {
        td.innerText = formatTableDateTime(data[property.propertyName]);
    } else if (property.dataType === "currency") {
        td.innerText = formatTableCurrency(data[property.propertyName]);
    } else if (property.dataType === "number") {
        td.innerText = formatTableNumber(data[property.propertyName]);
    } else if (property.dataType === "boolean") {
        td.innerHTML = data[property.propertyName]
            ? '<i class="fa-solid fa-check text-success"></i>'
            : '<i class="fa-solid fa-xmark text-danger"></i>';
    } else {
        td.innerText = data[property.propertyName] || "";
    }
};


window.hasAuthority = (authority) => {
    return window.userAuthorities instanceof Set && window.userAuthorities.has(authority);
};

const fillDataIntoTable = (tableBodyId, dataList, PropertyList, editfunction, deletefunction, printfunction, buttonVisibility = true, editAuthority = null, deleteAuthority = null, printAuthority = null) => {
    tableBodyId.innerHTML = "";

    dataList.forEach((data, index) => {
        let tr = document.createElement("tr");

        let tdIndex = document.createElement("td");
        tdIndex.innerText = index + 1;
        tr.appendChild(tdIndex);

        PropertyList.forEach((property) => {
            let td = document.createElement("td");
            renderTableCell(td, data, property);
            tr.appendChild(td);
        });

        if (buttonVisibility) {
            let tdActions = document.createElement("td");
            let hasButtons = false;

            // Edit button with FontAwesome 7+ icon
            if (typeof editfunction === "function") {
                if (!editAuthority || (window.hasAuthority && window.hasAuthority(editAuthority))) {
                    let buttonEdit = document.createElement("button");
                    buttonEdit.type = "button";
                    buttonEdit.onclick = () => {
                        console.log("Edit button clicked for:", data);
                        editfunction(data);
                    };
                    buttonEdit.className = "btn btn-outline-warning me-1 fw-bold";
                    buttonEdit.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
                    tdActions.appendChild(buttonEdit);
                    hasButtons = true;
                }
            }

            if (typeof printfunction === "function") {
                if (!printAuthority || (window.hasAuthority && window.hasAuthority(printAuthority))) {
                    let buttonPrint = document.createElement("button");
                    buttonPrint.type = "button";
                    buttonPrint.onclick = () => {
                        console.log("Print button clicked for:", data);
                        printfunction(data);
                    };
                    buttonPrint.className = "btn btn-outline-success me-1 fw-bold";
                    buttonPrint.innerHTML = '<i class="fa-solid fa-print"></i>';
                    tdActions.appendChild(buttonPrint);
                    hasButtons = true;
                }
            }

            // Delete button with FontAwesome 7+ icon
            if (typeof deletefunction === "function") {
                if (!deleteAuthority || (window.hasAuthority && window.hasAuthority(deleteAuthority))) {
                    let buttonDelete = document.createElement("button");
                    buttonDelete.type = "button";
                    buttonDelete.className = "btn btn-outline-danger fw-bold";
                    buttonDelete.innerHTML = '<i class="fa-solid fa-trash"></i>';
                    buttonDelete.onclick = () => {
                        console.log("Delete button clicked for:", data);
                        deletefunction(data);
                    };
                    tdActions.appendChild(buttonDelete);
                    hasButtons = true;
                }
            }

            if (hasButtons) {
                tr.appendChild(tdActions);
            }
        }

        // append this row into the table body
        tableBodyId.appendChild(tr);
    });

    // Dev-only: warn if a rendered row's cell count doesn't match its <thead>.
    const firstRow = tableBodyId.querySelector("tr");
    if (firstRow) {
        const table = tableBodyId.closest("table");
        const thead = table && table.querySelector("thead");
        if (thead) {
            const ths = thead.querySelectorAll("th").length;
            const tds = firstRow.querySelectorAll("td").length;
            if (ths !== tds) {
                const tableId = table.id || "(unnamed table)";
                const headerLabels = Array.from(thead.querySelectorAll("th"))
                    .map(th => th.textContent.trim())
                    .join(", ");
                console.warn(
                    `[fillDataIntoTable] Column count mismatch in #${tableId}: ` +
                    `<thead> has ${ths} <th>, first body row has ${tds} <td>. ` +
                    `Headers: [${headerLabels}]`
                );
            }
        }
    }
}


const fillDataIntoInnerTable = (tableBodyId, dataList, PropertyList, editfunction, deletefunction, buttonVisibility = true) => {
    tableBodyId.innerHTML = "";

    dataList.forEach((data, index) => {
        let tr = document.createElement("tr");

        let tdIndex = document.createElement("td");
        tdIndex.innerText = index + 1;
        tr.appendChild(tdIndex);

        PropertyList.forEach((property) => {
            let td = document.createElement("td");
            renderTableCell(td, data, property);
            tr.appendChild(td);
        });

        if (buttonVisibility) {
            let tdActions = document.createElement("td");
            let hasButtons = false;

            // Edit button with FontAwesome 7+ icon
            if (typeof editfunction === "function") {
                let buttonEdit = document.createElement("button");
                buttonEdit.type = "button";
                buttonEdit.onclick = () => {
                    console.log("Edit button clicked for:", data);
                    editfunction(data);
                };
                buttonEdit.className = "btn btn-outline-warning me-1 fw-bold";
                buttonEdit.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
                tdActions.appendChild(buttonEdit);
                hasButtons = true;
            }

            // Delete button with FontAwesome 7+ icon
            if (typeof deletefunction === "function") {
                let buttonDelete = document.createElement("button");
                buttonDelete.type = "button";
                buttonDelete.className = "btn btn-outline-danger fw-bold";
                buttonDelete.innerHTML = '<i class="fa-solid fa-trash"></i>';
                buttonDelete.onclick = () => {
                    console.log("Delete button clicked for:", data);
                    deletefunction(data);
                };
                tdActions.appendChild(buttonDelete);
                hasButtons = true;
            }

            if (hasButtons) {
                tr.appendChild(tdActions);
            }
        }

        // append this row into the table body
        tableBodyId.appendChild(tr);
    });
}


// ---- Bootstrap Confirm Modal ----

// ---- Offcanvas Panel Helpers ----

const openPanel = (panelId) => {
    const el = document.getElementById(panelId);
    if (!el) { console.warn('Panel not found:', panelId); return; }
    bootstrap.Offcanvas.getOrCreateInstance(el).show();
};

const closePanel = (panelId) => {
    const el = document.getElementById(panelId);
    if (!el) { console.warn('Panel not found:', panelId); return; }
    bootstrap.Offcanvas.getOrCreateInstance(el).hide();
};


// ---- Datalist Search Component ----

const populateDataList = (listEl, searchInputEl, hiddenInputEl, dataList, displayFn, valueField) => {
    if (!listEl || !searchInputEl) return;
    listEl.innerHTML = "";
    dataList.forEach(item => {
        const opt = document.createElement("option");
        opt.value = typeof displayFn === "function" ? displayFn(item) : item[displayFn];
        opt.dataset.id = item[valueField];
        listEl.appendChild(opt);
    });
    searchInputEl.addEventListener("input", () => {
        const val = searchInputEl.value;
        const match = dataList.find(item => {
            const display = typeof displayFn === "function" ? displayFn(item) : item[displayFn];
            return display === val;
        });
        if (match) {
            hiddenInputEl.value = match[valueField];
            setValid(searchInputEl);
        } else {
            hiddenInputEl.value = "";
            if (val.length > 0) setInvalid(searchInputEl);
            else searchInputEl.classList.remove("is-valid", "is-invalid");
        }
    });
    searchInputEl.addEventListener("change", () => {
        const val = searchInputEl.value;
        const match = dataList.find(item => {
            const display = typeof displayFn === "function" ? displayFn(item) : item[displayFn];
            return display === val;
        });
        if (match) {
            hiddenInputEl.value = match[valueField];
            setValid(searchInputEl);
        }
    });
};

const setSelectedByHiddenId = (searchInputEl, hiddenInputEl, dataList, displayFn, valueField, idValue) => {
    if (!idValue || !dataList) return;
    const match = dataList.find(item => item[valueField] == idValue);
    if (match) {
        const display = typeof displayFn === "function" ? displayFn(match) : match[displayFn];
        searchInputEl.value = display;
        hiddenInputEl.value = match[valueField];
        setValid(searchInputEl);
    }
};


// ---- Bootstrap Validation Helpers ----

const setValid = (el) => {
    if (!el) return;
    el.classList.remove("is-invalid");
    el.classList.add("is-valid");
};

const setInvalid = (el, msg) => {
    if (!el) return;
    el.classList.remove("is-valid");
    el.classList.add("is-invalid");
    if (msg) {
        let fb = el.parentElement.querySelector(".invalid-feedback");
        if (!fb) {
            fb = document.createElement("div");
            fb.className = "invalid-feedback";
            el.parentElement.appendChild(fb);
        }
        fb.textContent = msg;
    }
};

const clearValidation = (el) => {
    if (!el) return;
    el.classList.remove("is-valid", "is-invalid");
};

const togglePassword = (btn) => {
    const input = btn.parentElement.querySelector("input");
    if (!input) return;
    const icon = btn.querySelector("i");
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
};


// ---- Form Section Helper ----

const createSectionTitle = (icon, text) => {
    return `<h6 class="form-section-title"><i class="fa-solid ${icon} me-2"></i>${text}</h6>`;
};


// ---- Bootstrap Confirm Modal ----

const showConfirm = (title, message, confirmText = "Confirm", confirmStyle = "danger") => {
    return new Promise((resolve) => {
        const modalId = "confirmModal_" + Date.now();
        const styleMap = {
            danger: "btn-danger",
            warning: "btn-warning",
            success: "btn-success",
            info: "btn-info",
            primary: "btn-primary"
        };
        const btnClass = styleMap[confirmStyle] || "btn-danger";

        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content">
                        <div class="modal-header bg-${confirmStyle} text-white py-2">
                            <h6 class="modal-title"><i class="fa-solid fa-triangle-exclamation me-2"></i>${escapeHtml(title)}</h6>
                        </div>
                        <div class="modal-body py-3">
                            <p class="mb-0">${escapeHtml(message)}</p>
                        </div>
                        <div class="modal-footer py-2">
                            <button type="button" class="btn btn-sm btn-light" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-sm ${btnClass}" id="${modalId}_confirm">${escapeHtml(confirmText)}</button>
                        </div>
                    </div>
                </div>
            </div>`;

        const container = document.createElement("div");
        container.innerHTML = modalHtml;
        document.body.appendChild(container);

        const modalEl = document.getElementById(modalId);
        const bsModal = new bootstrap.Modal(modalEl, { backdrop: "static" });

        document.getElementById(modalId + "_confirm").addEventListener("click", () => {
            bsModal.hide();
            resolve(true);
        });

        modalEl.addEventListener("hidden.bs.modal", () => {
            container.remove();
            resolve(false);
        });

        bsModal.show();
    });
};


// ---- Pagination ----

const DEFAULT_PAGE_SIZE = 10;

/**
 * Build a paged URL with the given page/size/sort and optional filters.
 */
const buildPagedUrl = (endpoint, page, size, sort, filters) => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("size", size);
    if (sort) params.set("sort", sort);
    if (filters && typeof filters === "object") {
        Object.entries(filters).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== "") {
                params.set(k, v);
            }
        });
    }
    return endpoint + "?" + params.toString();
};

/**
 * Thin pagination layer that preserves the existing refresh-table pattern.
 *
 * opts = {
 *   endpoint:    '/api/xxx/getpage',
 *   pagerSel:    '#pagerXxx',
 *   countSel:    '#countXxx',
 *   pageSizeSel: '#pageSizeXxx',
 *   refresh:     function() { ... }   // existing refresh-table function
 * }
 *
 * Call attachPagination(opts) once on init. The supplied refresh() should
 * read pagination state via getPaginationState(opts) and pass it as query
 * params to the paged endpoint, then render rows + call renderPager(...).
 */
const attachPagination = (opts) => {
    const state = { page: 0, size: DEFAULT_PAGE_SIZE, sort: "id,desc" };
    const sizeEl = opts.pageSizeSel ? document.querySelector(opts.pageSizeSel) : null;

    if (sizeEl) {
        sizeEl.value = String(state.size);
        sizeEl.addEventListener("change", () => {
            const newSize = parseInt(sizeEl.value, 10);
            if (!isNaN(newSize) && newSize > 0) {
                state.size = newSize;
                state.page = 0;
                if (typeof opts.refresh === "function") opts.refresh();
            }
        });
    }

    return {
        state,
        pagerSel: opts.pagerSel,
        countSel: opts.countSel
    };
};

const getPaginationState = (handle) => handle && handle.state
    ? { ...handle.state }
    : { page: 0, size: DEFAULT_PAGE_SIZE, sort: "id,desc" };

/**
 * Render the pager + result count for a Spring Data Page response.
 *
 * pageData = response from /getpage (Spring Page JSON)
 * refresh  = function to call when the user clicks a pager button
 * handle   = pagination handle returned by attachPagination()
 */
const renderPager = (pageData, refresh, handle) => {
    const pagerEl = handle && handle.pagerSel ? document.querySelector(handle.pagerSel) : null;
    const countEl = handle && handle.countSel ? document.querySelector(handle.countSel) : null;
    if (!pagerEl) return;

    const data = pageData || {};
    const totalPages = Math.max(1, data.totalPages || 1);
    const current = (data.number || 0) + 1;
    const total = data.totalElements || 0;
    const start = total === 0 ? 0 : (data.number * data.size) + 1;
    const end = Math.min(total, (data.number + 1) * data.size);

    if (countEl) {
        countEl.innerHTML = total === 0
            ? '<span class="text-muted">No records found</span>'
            : `Showing <strong>${start}</strong>&ndash;<strong>${end}</strong> of <strong>${total}</strong>`;
    }

    const isFirst = data.first === true;
    const isLast = data.last === true;

    const pageItems = buildPageItems(current, totalPages);
    const pageButtons = pageItems.map(item => {
        if (item === "…") {
            return `<li class="page-item disabled"><span class="page-link">&hellip;</span></li>`;
        }
        const isActive = item === current;
        const pageIndex = item - 1;
        return `<li class="page-item ${isActive ? "active" : ""}" ${isActive ? 'aria-current="page"' : ""}>
                    <button class="page-link" data-page-action="goto" data-page="${pageIndex}">${item}</button>
                </li>`;
    }).join("");

    pagerEl.innerHTML = `
        <nav aria-label="Page navigation">
            <ul class="pagination pagination-sm justify-content-end mb-0">
                <li class="page-item ${isFirst ? "disabled" : ""}">
                    <button class="page-link" data-page-action="first" aria-label="First" ${isFirst ? "disabled" : ""}>&laquo;</button>
                </li>
                <li class="page-item ${isFirst ? "disabled" : ""}">
                    <button class="page-link" data-page-action="prev" aria-label="Previous" ${isFirst ? "disabled" : ""}>&lsaquo;</button>
                </li>
                ${pageButtons}
                <li class="page-item ${isLast ? "disabled" : ""}">
                    <button class="page-link" data-page-action="next" aria-label="Next" ${isLast ? "disabled" : ""}>&rsaquo;</button>
                </li>
                <li class="page-item ${isLast ? "disabled" : ""}">
                    <button class="page-link" data-page-action="last" aria-label="Last" ${isLast ? "disabled" : ""}>&raquo;</button>
                </li>
            </ul>
        </nav>`;

    pagerEl.querySelectorAll("button[data-page-action]").forEach(btn => {
        btn.addEventListener("click", () => {
            if (!handle || !handle.state) return;
            const action = btn.getAttribute("data-page-action");
            if (action === "first") handle.state.page = 0;
            else if (action === "prev") handle.state.page = Math.max(0, handle.state.page - 1);
            else if (action === "next") handle.state.page = Math.min(totalPages - 1, handle.state.page + 1);
            else if (action === "last") handle.state.page = totalPages - 1;
            else if (action === "goto") {
                const target = parseInt(btn.getAttribute("data-page"), 10);
                if (!isNaN(target) && target >= 0 && target < totalPages) handle.state.page = target;
            }
            if (typeof refresh === "function") refresh();
        });
    });
};

// currentPage is 1-based; totalPages is at least 1.
const buildPageItems = (currentPage, totalPages) => {
    if (totalPages <= 7) {
        const all = [];
        for (let i = 1; i <= totalPages; i++) all.push(i);
        return all;
    }
    const items = [1];
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);
    if (left > 2) items.push("…");
    for (let i = left; i <= right; i++) items.push(i);
    if (right < totalPages - 1) items.push("…");
    items.push(totalPages);
    return items;
};

// ---- Bootstrap Toast Notifications ----

const _ensureToastContainer = () => {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container position-fixed top-0 end-0 p-3";
        container.style.zIndex = "9999";
        document.body.appendChild(container);
    }
    return container;
};

const showToast = (message, type = "info") => {
    const container = _ensureToastContainer();
    const toastId = "toast_" + Date.now();

    const iconMap = {
        success: "fa-circle-check text-success",
        error: "fa-circle-xmark text-danger",
        warning: "fa-triangle-exclamation text-warning",
        info: "fa-circle-info text-info"
    };
    const bgMap = {
        success: "border-start border-success border-3",
        error: "border-start border-danger border-3",
        warning: "border-start border-warning border-3",
        info: "border-start border-info border-3"
    };

    const icon = iconMap[type] || iconMap.info;
    const bg = bgMap[type] || bgMap.info;

    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center ${bg}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center gap-2">
                    <i class="fa-solid ${icon} fs-5"></i>
                    <span>${escapeHtml(message)}</span>
                </div>
                <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>`;

    container.insertAdjacentHTML("beforeend", toastHtml);

    const toastEl = document.getElementById(toastId);
    const bsToast = new bootstrap.Toast(toastEl, { delay: 3500 });
    bsToast.show();

    toastEl.addEventListener("hidden.bs.toast", () => {
        toastEl.remove();
    });
};
