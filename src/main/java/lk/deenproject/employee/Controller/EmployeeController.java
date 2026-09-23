package lk.deenproject.employee.Controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lk.deenproject.leaveplan.repository.LeaveDayRepository;
import lk.deenproject.appointment.repository.AppointmentRepository;

import jakarta.validation.Valid;
import lk.deenproject.common.BaseController;
import lk.deenproject.employee.Entity.Employee;
import lk.deenproject.employee.Entity.EmployeePermLeave;
import lk.deenproject.employee.Repository.EmployeePermLeaveRepository;
import lk.deenproject.employee.Repository.EmployeeRepository;
import lk.deenproject.enums.EmployeeStatus;

@RestController
public class EmployeeController extends BaseController<Employee, Integer> {

    @Autowired
    private EmployeeRepository employeeDao;

    @Autowired
    private LeaveDayRepository leaveDayDao;

    @Autowired
    private AppointmentRepository appointmentDao;

    @Autowired
    private EmployeePermLeaveRepository employeePermLeaveDao;

    @Override
    protected EmployeeRepository getRepository() {
        return employeeDao;
    }

    @Override
    protected String getEntityName() {
        return "employee";
    }

    @RequestMapping("/employee")
    public org.springframework.web.servlet.ModelAndView employeePage() {
        return createPageView();
    }

    @GetMapping(value = "/employee/available", produces = "application/json")
    public List<Employee> getAvailableEmployees(
            @RequestParam("date") String date,
            @RequestParam("startTime") String startTime,
            @RequestParam("endTime") String endTime) {

        LocalDate appointmentDate = LocalDate.parse(date);
        LocalTime appointmentStart = LocalTime.parse(startTime);
        LocalTime appointmentEnd = LocalTime.parse(endTime);

        List<Employee> availableEmployees = employeeDao.getByDesignation("Beautician");

        availableEmployees.removeIf(employee -> !leaveDayDao.findLeaveByEmployeeAndDate(
                employee.getId(),
                appointmentDate).isEmpty());

        availableEmployees.removeIf(employee -> !appointmentDao.findOverlappingAppointments(
                employee.getId(),
                appointmentDate,
                appointmentStart,
                appointmentEnd).isEmpty());

        return availableEmployees;
    }

    @PreAuthorize("hasAuthority('EMPLOYEE_SELECT')")
    @RequestMapping(value = "/employee/byid/{empid}", method = RequestMethod.GET, produces = "application/json")
    public Employee getEmployeeById(@PathVariable("empid") Integer empid) {
        return employeeDao.getReferenceById(empid);
    }

    @PreAuthorize("hasAuthority('EMPLOYEE_SELECT')")
    @RequestMapping(value = "/employee/byid", params = {
            "id" }, method = RequestMethod.GET, produces = "application/json")
    public Employee getEmployeeByIdRequestParam(@RequestParam("id") Integer empid) {
        return employeeDao.getReferenceById(empid);
    }

    @PreAuthorize("hasAuthority('EMPLOYEE_SELECT')")
    @RequestMapping(value = "/employee/alldata", method = RequestMethod.GET, produces = "application/json")
    public List<Employee> getAllEmployeeData() {
        return employeeDao.getSelectedColumn();
    }

    @PreAuthorize("hasAuthority('EMPLOYEE_SELECT')")
    @GetMapping(value = "/employee/list", produces = "application/json")
    public List<Employee> getAllEmployeeDataList() {
        return employeeDao.getSelectedColumn();
    }

    @PreAuthorize("hasAuthority('EMPLOYEE_SELECT')")
    @RequestMapping(value = "/employee/bydesignation", params = {
            "designation" }, method = RequestMethod.GET, produces = "application/json")
    public List<Employee> getEmployeesByDesignation(@RequestParam("designation") String designation) {
        return employeeDao.getByDesignation(designation);
    }

    @PreAuthorize("hasAuthority('EMPLOYEE_INSERT')")
    @PostMapping(value = "/employee/save")
    public String saveEmployee(@Valid @RequestBody Employee employee) {
        Employee existingEmployeeByNic = employeeDao.getByNic(employee.getNic());
        if (existingEmployeeByNic != null) {
            return error("save", "Duplicate NIC found. " + employee.getNic() + " already exists in database.");
        }

        Employee existingEmployeeByMobile = employeeDao.getByMobile(employee.getMobile());
        if (existingEmployeeByMobile != null) {
            return error("save",
                    "Duplicate mobile number found. " + employee.getMobile() + " already exists in database.");
        }

        Employee existingEmployeeByEmail = employeeDao.getByEmail(employee.getEmail());
        if (existingEmployeeByEmail != null) {
            return error("save", "Duplicate email found. " + employee.getEmail() + " already exists in database.");
        }

        try {
            employee.setEmpno(generateCode("employee", "empno", "EMP"));
            employee.setAddeddatetime(LocalDateTime.now());

            employee.setEmployeeStatus(EmployeeStatus.ACTIVE);

            Employee savedEmployee = employeeDao.save(employee);

            EmployeePermLeave permLeave = new EmployeePermLeave();

            permLeave.setEmployee_id(savedEmployee);

            permLeave.setDay_of_week(employee.getPermanentLeaveDay());

            employeePermLeaveDao.save(permLeave);

            return success();
        } catch (Exception e) {
            return error("save", e.getMessage());
        }
    }

    @PreAuthorize("hasAuthority('EMPLOYEE_UPDATE')")
    @PutMapping(value = "/employee/update", produces = "application/json")
    public String updateEmployeeForm(@Valid @RequestBody Employee employee) {
        Employee existingEmployee = employeeDao.getReferenceById(employee.getId());
        if (existingEmployee == null) {
            return error("update", employee.getFullname() + " not available in database.");
        }

        Employee existingEmployeeByNic = employeeDao.getByNic(employee.getNic());
        if (existingEmployeeByNic != null && existingEmployeeByNic.getId() != employee.getId()) {
            return error("update", "Duplicate NIC found. " + employee.getNic() + " already exists in database.");
        }

        Employee existingEmployeeByMobile = employeeDao.getByMobile(employee.getMobile());
        if (existingEmployeeByMobile != null && existingEmployeeByMobile.getId() != employee.getId()) {
            return error("update",
                    "Duplicate mobile number found. " + employee.getMobile() + " already exists in database.");
        }

        Employee existingEmployeeByEmail = employeeDao.getByEmail(employee.getEmail());
        if (existingEmployeeByEmail != null && existingEmployeeByEmail.getId() != employee.getId()) {
            return error("update", "Duplicate email found. " + employee.getEmail() + " already exists in database.");
        }

        try {
           employee.setUpdateddatetime(LocalDateTime.now());

Employee updatedEmployee = employeeDao.save(employee);

EmployeePermLeave permanentLeave =
        employeePermLeaveDao.getEmployeePermanentLeave(employee.getId());

if (permanentLeave != null) {

    permanentLeave.setDay_of_week(employee.getPermanentLeaveDay());

    employeePermLeaveDao.save(permanentLeave);

}

return success();
        } catch (Exception e) {
            return error("update", e.getMessage());
        }
    }

    @PreAuthorize("hasAuthority('EMPLOYEE_DELETE')")
    @DeleteMapping(value = "/employee/delete")
    public String deleteEmployee(@RequestBody Employee employee) {
        Employee existingEmployee = employeeDao.getReferenceById(employee.getId());
        if (existingEmployee == null) {
            return error("delete", employee.getFullname() + " not available in database.");
        }

        try {

            existingEmployee.setEmployeeStatus(EmployeeStatus.DELETED);
            employeeDao.save(existingEmployee);

            return success();

        } catch (Exception e) {

            return error("delete", e.getMessage());

        }

    }

}
