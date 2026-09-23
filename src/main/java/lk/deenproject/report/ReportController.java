package lk.deenproject.report;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.ModelAndView;
import lk.deenproject.item.entity.Item;
import lk.deenproject.item.repository.ItemRepository;

import lk.deenproject.appointment.entity.Appointment;
import lk.deenproject.appointment.repository.AppointmentRepository;
import lk.deenproject.customer.entity.Customer;
import lk.deenproject.customer.repository.CustomerRepository;
import lk.deenproject.payment.entity.Payment;
import lk.deenproject.payment.repository.PaymentRepository;
import lk.deenproject.report.dto.CreditReportDTO;
import lk.deenproject.rental.entity.Rental;
import lk.deenproject.rental.repository.RentalRepository;

@RestController
public class ReportController {

    @Autowired
    private PaymentRepository paymentDao;
    @Autowired
    private AppointmentRepository appointmentDao;
    @Autowired
    private RentalRepository rentalDao;
    @Autowired
    private CustomerRepository customerDao;
    @Autowired
private ItemRepository itemDao;



    private ModelAndView createReportView(String reportName) {
        ModelAndView mv = new ModelAndView(reportName);
        mv.addObject("currentPage", reportName.replace("report_", ""));
        return mv;
    }

    @RequestMapping("/reports/revenue")
    public ModelAndView revenueReportPage() {
        return createReportView("report_revenue");
    }

    @RequestMapping("/reports/appointments")
    public ModelAndView appointmentReportPage() {
        return createReportView("report_appointments");
    }

    @RequestMapping("/reports/rentals")
    public ModelAndView rentalReportPage() {
        return createReportView("report_rentals");
    }
        @RequestMapping("/reports/payments")
    public ModelAndView paymentReportPage() {
        return createReportView("report_payments");
    }

    @RequestMapping("/reports/customers")
public ModelAndView customerSummaryReportPage() {
    return createReportView("report_customers");
}

    @RequestMapping("/reports/rentalitems")
public ModelAndView rentalItemAvailabilityReportPage() {
    return createReportView("report_rental_items");
}

    @RequestMapping("/reports/service_appointments")
    public ModelAndView serviceAppointmentsReportPage() {
        return createReportView("report_service_appointments");
    }

    @PreAuthorize("hasAuthority('PAYMENT_SELECT')")
    @GetMapping(value = "/reports/revenue/data", produces = "application/json")
    public List<Payment> getRevenueData() {
        return paymentDao.findAll();
    }

    @PreAuthorize("hasAuthority('APPOINTMENT_SELECT')")
    @GetMapping(value = "/reports/appointments/data", produces = "application/json")
    public List<Appointment> getAppointmentData() {
        return appointmentDao.findAll();
    }

    @PreAuthorize("hasAuthority('RENTAL_SELECT')")
    @GetMapping(value = "/reports/rentals/data", produces = "application/json")
    public List<Rental> getRentalData() {
        return rentalDao.findAll();
    }

    @PreAuthorize("hasAuthority('ITEM_SELECT')")
    @GetMapping(value = "/reports/rentalitems/data", produces = "application/json")
    public List<Item> getRentalItemAvailabilityData() {
        return itemDao.findAll();
    }

    @PreAuthorize("hasAuthority('CUSTOMER_SELECT')")
    @GetMapping(value="/reports/customers/data", produces="application/json")
    @ResponseBody
    public List<Customer> getCustomerReportData() {
        return customerDao.findAll();
    }

    @PreAuthorize("hasAuthority('PAYMENT_SELECT')")
    @GetMapping(value = "/reports/payments/data", produces = "application/json")
    public List<Payment> getPaymentReportData() {
        return paymentDao.findAll();
    }

    @PreAuthorize("hasAuthority('APPOINTMENT_SELECT')")
    @GetMapping(value = "/reports/service_appointments/data", produces = "application/json")
    public List<Appointment> getServiceAppointmentsData() {
        return appointmentDao.findAll();
    }
}
