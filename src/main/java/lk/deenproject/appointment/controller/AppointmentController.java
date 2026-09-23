package lk.deenproject.appointment.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import lk.deenproject.User.Repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lk.deenproject.appointment.entity.Appointment;
import lk.deenproject.appointment.entity.AppointmentHasService;
import lk.deenproject.appointment.entity.AppointmentHasServicePackage;
import lk.deenproject.appointment.repository.AppointmentHasServiceRepository;
import lk.deenproject.appointment.repository.AppointmentHasServicePackageRepository;
import lk.deenproject.appointment.repository.AppointmentRepository;
import lk.deenproject.appointment.service.AvailabilityService;
import lk.deenproject.common.BaseController;
import lk.deenproject.enums.AppointmentStatus;

@RestController
public class AppointmentController extends BaseController<Appointment, Integer> {

    @Autowired
    private AppointmentRepository appointmentDao;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentHasServicePackageRepository appointmentHasServicePackageRepository;

    @Autowired
    private AppointmentHasServiceRepository appointmentHasServiceRepository;

    @Autowired
    private AvailabilityService availabilityService;

    @Override
    protected AppointmentRepository getRepository() {
        return appointmentDao;
    }

    @Override
    protected String getEntityName() {
        return "appointment";
    }

    @RequestMapping("/appointment")
    public org.springframework.web.servlet.ModelAndView appointmentPage() {
        return createPageView();
    }

    @PreAuthorize("hasAuthority('APPOINTMENT_SELECT')")
    @GetMapping(value = "/appointment/alldata", produces = "application/json")
    public List<Appointment> getAllData() {
        return getScopedAppointments();
    }

    @PreAuthorize("hasAuthority('APPOINTMENT_SELECT')")
    @GetMapping(value = "/appointment/getpage", produces = "application/json")
    public Page<Appointment> getPage(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        Pageable pageable = parsePageable(page, size, sort);
        return toPage(getScopedAppointments(), pageable);
    }

    private List<Appointment> getScopedAppointments() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String username = authentication.getName();

        lk.deenproject.User.Entity.User user = userRepository.getByUsername(username);

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ADMIN"));

        boolean isManager = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("MANAGER"));

        boolean isReceptionist = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("RECEPTIONIST"));

        if (isAdmin || isManager || isReceptionist) {
            return appointmentDao.findAll();
        }

        return appointmentDao.findByEmployee(user.getEmployee_id().getId());
    }

    @PreAuthorize("hasAuthority('APPOINTMENT_INSERT')")
    @PostMapping(value = "/appointment/insert")
    public String saveData(@Valid @RequestBody Appointment appointment) {

        System.out.println("Package List = " + appointment.getAppointmentHasServicePackageList());

        try {
            appointment.setAppointment_no(generateCode("appointment", "appointment_no", "APT"));
            appointment.setAddeddatetime(LocalDateTime.now());

            if (appointment.getAppointmentStatus() == AppointmentStatus.COMPLETED
                    && appointment.getDate().isAfter(LocalDate.now())) {
                return "Future appointments cannot be marked as Completed.";
            }

            List<Appointment> customerConflicts = appointmentDao.findCustomerOverlappingAppointments(
                    appointment.getCustomer_id().getId(),
                    appointment.getDate(),
                    appointment.getStart_time(),
                    appointment.getEnd_time());

            if (!customerConflicts.isEmpty()) {
                return "This customer already has another appointment during the selected time.";
            }

            Appointment savedAppointment = appointmentDao.saveAndFlush(appointment);

            System.out.println("Appointment ID = " + savedAppointment.getId());

            if (appointment.getAppointmentHasServicePackageList() == null) {

                System.out.println("Package List is NULL");

            } else {

                System.out.println("Package Count = " + appointment.getAppointmentHasServicePackageList().size());

                for (AppointmentHasServicePackage pkg : appointment.getAppointmentHasServicePackageList()) {

                    System.out.println("Saving Package : " + pkg.getService_package_id().getId());

                    pkg.setAppointment_id(savedAppointment);

                    appointmentHasServicePackageRepository.saveAndFlush(pkg);

                    System.out.println("Saved Successfully");

                }

            }
            return success();
        } catch (Exception e) {
            return error("save", e.getMessage());
        }
    }

    @PreAuthorize("hasAuthority('APPOINTMENT_UPDATE')")
    @PutMapping(value = "/appointment/update")
    public String updateData(@Valid @RequestBody Appointment appointment) {
        try {
            appointment.setUpdatedatetime(LocalDateTime.now());

            if (appointment.getAppointmentStatus() == AppointmentStatus.COMPLETED
                    && appointment.getDate().isAfter(LocalDate.now())) {
                return "Future appointments cannot be marked as Completed.";
            }

            List<Appointment> customerConflicts = appointmentDao.findCustomerOverlappingAppointments(
                    appointment.getCustomer_id().getId(),
                    appointment.getDate(),
                    appointment.getStart_time(),
                    appointment.getEnd_time());

            customerConflicts.removeIf(a -> a.getId().equals(appointment.getId()));

            if (!customerConflicts.isEmpty()) {
                return "This customer already has another appointment during the selected time.";
            }
            appointmentDao.save(appointment);
            return success();
        } catch (Exception e) {
            return error("update", e.getMessage());
        }
    }

    @PreAuthorize("hasAuthority('APPOINTMENT_DELETE')")
    @DeleteMapping(value = "/appointment/delete")
    public String deleteData(@RequestBody Appointment appointment) {
        Appointment existingAppointment = appointmentDao.getReferenceById(appointment.getId());
        if (existingAppointment == null) {
            return error("delete", "Appointment not found.");
        }

        try {
            appointmentDao.delete(existingAppointment);
            return success();
        } catch (Exception e) {
            return error("delete", e.getMessage());
        }
    }

    @GetMapping(value = "/appointment/byid")
    public Appointment getById(@RequestParam Integer id) {

        return appointmentDao.findById(id).orElse(null);

    }

    @PreAuthorize("hasAuthority('APPOINTMENT_UPDATE')")
    @DeleteMapping(value = "/appointment/remove-package")
    public String removeServicePackage(@RequestBody AppointmentHasServicePackage appointmentHasServicePackage) {
        try {
            appointmentHasServicePackageRepository.delete(appointmentHasServicePackage);
            return success();
        } catch (Exception e) {
            return error("remove-package", e.getMessage());
        }
    }

    @PreAuthorize("hasAuthority('APPOINTMENT_UPDATE')")
    @DeleteMapping(value = "/appointment/remove-service")
    public String removeService(@RequestBody AppointmentHasService appointmentHasService) {
        try {
            appointmentHasServiceRepository.delete(appointmentHasService);
            return success();
        } catch (Exception e) {
            return error("remove-service", e.getMessage());
        }
    }

    @PreAuthorize("hasAuthority('APPOINTMENT_SELECT')")
    @GetMapping(value = "/appointment/check-availability")
    public Map<String, Object> checkAvailability(
            @RequestParam Integer employeeId,
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime) {

        Map<String, Object> response = new HashMap<>();
        try {
            LocalDate localDate = LocalDate.parse(date);
            LocalTime localStartTime = LocalTime.parse(startTime);
            LocalTime localEndTime = LocalTime.parse(endTime);

            boolean available = availabilityService.isEmployeeAvailable(employeeId, localDate, localStartTime,
                    localEndTime);

            response.put("available", available);
            response.put("message",
                    available ? "Employee is available" : "Employee is not available for the selected time");

            return response;
        } catch (Exception e) {
            response.put("available", false);
            response.put("message", "Error checking availability: " + e.getMessage());
            return response;
        }
    }

    @GetMapping("/appointment/payment-info")
    public Map<String, Object> getAppointmentPaymentInfo(@RequestParam Integer id) {

        Appointment appointment = appointmentDao.findById(id).orElse(null);

        if (appointment == null) {
            return null;
        }

        Map<String, Object> result = new HashMap<>();

        result.put("appointmentId", appointment.getId());
        result.put("amount", appointment.getPrice());
        result.put("advancePayment", appointment.getAdvance_payment());

        String packageType = "SALON";

        List<AppointmentHasServicePackage> packages = appointmentHasServicePackageRepository
                .findByAppointmentId(appointment.getId());

        if (!packages.isEmpty()) {

            packageType = packages.get(0)
                    .getService_package_id()
                    .getPackageType()
                    .toString();

        }

        result.put("packageType", packageType);

        return result;

    }
}
