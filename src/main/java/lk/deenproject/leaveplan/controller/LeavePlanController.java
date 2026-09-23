package lk.deenproject.leaveplan.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import lk.deenproject.User.Repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lk.deenproject.common.BaseController;
import lk.deenproject.enums.LeaveType;
import lk.deenproject.leaveplan.LeaveSlot;
import lk.deenproject.leaveplan.entity.LeaveDay;
import lk.deenproject.leaveplan.entity.LeavePlan;
import lk.deenproject.leaveplan.repository.LeaveDayRepository;
import lk.deenproject.leaveplan.repository.LeavePlanRepository;

@RestController
public class LeavePlanController extends BaseController<LeavePlan, Integer> {

    @Autowired
    private LeavePlanRepository leavePlanDao;

    @Autowired
    private LeaveDayRepository leaveDayDao;

    @Autowired
    private UserRepository userRepository;

    @Override
    protected LeavePlanRepository getRepository() {
        return leavePlanDao;
    }

    @Override
    protected String getEntityName() {
        return "leaveplan";
    }

    @RequestMapping("/leaveplan")
    public org.springframework.web.servlet.ModelAndView leavePlanPage() {
        return createPageView();
    }

    @PreAuthorize("hasAuthority('LEAVEPLAN_SELECT')")
    @GetMapping(value = "/leaveplan/alldata", produces = "application/json")
    public List<LeavePlan> getAllData() {
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
            return leavePlanDao.findAll();
        }
        return leavePlanDao.findByEmployee(user.getEmployee_id().getId());
    }

    @GetMapping(value = "/leaveplan/leavetypes", produces = "application/json")
    public List<Map<String, String>> getLeaveTypes() {
        return Arrays.stream(LeaveType.values())
                .map(t -> {
                    Map<String, String> entry = new LinkedHashMap<>();
                    entry.put("value", t.name());
                    entry.put("displayName", t.getDisplayName());
                    return entry;
                })
                .toList();
    }

    @PreAuthorize("hasAuthority('LEAVEPLAN_INSERT')")
    @PostMapping(value = "/leaveplan/insert")
    public String saveData(@Valid @RequestBody LeavePlan leavePlan) {
        if (leavePlan.getId() != null && leavePlanDao.existsById(leavePlan.getId())) {
            return error("save", "Leave Plan with the same ID already exists.");
        }

        LeaveType leaveType = LeaveType.fromDisplayName(leavePlan.getLeaveType());
        if (leaveType == null) {
            return error("save", "Invalid leave type. Allowed values: "
                    + Arrays.toString(LeaveType.values()));
        }

        try {
            leavePlan.setLeaveType(leaveType.getDisplayName());
            leavePlan.setAddeddatetime(LocalDateTime.now());
            LeavePlan savedPlan = leavePlanDao.save(leavePlan);

            if (leavePlan.getLeaveDates() != null) {
                LocalTime slotStart = LeaveSlot.startFor(leaveType);
                LocalTime slotEnd = LeaveSlot.endFor(leaveType);
                for (String leaveDate : leavePlan.getLeaveDates()) {
                    LocalDate date = LocalDate.parse(leaveDate);
                    LeaveDay leaveDay = new LeaveDay();
                    leaveDay.setLeave_date(date);
                    leaveDay.setLeave_type(leaveType.getDisplayName());
                    leaveDay.setStart_time(slotStart);
                    leaveDay.setEnd_time(slotEnd);
                    leaveDay.setLeave_plan_id(savedPlan);
                    leaveDayDao.save(leaveDay);
                }
            }
            return success();
        } catch (Exception e) {
            return error("save", e.getMessage());
        }
    }

    @PreAuthorize("hasAuthority('LEAVEPLAN_UPDATE')")
    @PutMapping(value = "/leaveplan/update")
    public String updateData(@Valid @RequestBody LeavePlan leavePlan) {
        LeaveType leaveType = LeaveType.fromDisplayName(leavePlan.getLeaveType());
        if (leaveType == null) {
            return error("update", "Invalid leave type. Allowed values: "
                    + Arrays.toString(LeaveType.values()));
        }

        try {
            LeavePlan existing = leavePlanDao.findById(leavePlan.getId()).orElse(null);
            if (existing != null) {
                leavePlan.setAddeddatetime(existing.getAddeddatetime());
                leavePlan.setDeletedatetime(existing.getDeletedatetime());
            }
            leavePlan.setLeaveType(leaveType.getDisplayName());
            leavePlan.setUpdatedatetime(LocalDateTime.now());
            LeavePlan savedPlan = leavePlanDao.save(leavePlan);

            LocalTime slotStart = LeaveSlot.startFor(leaveType);
            LocalTime slotEnd = LeaveSlot.endFor(leaveType);

            List<LeaveDay> existingDays = leaveDayDao.findByEmployeeId(savedPlan.getEmployee_id().getId());
            for (LeaveDay ld : existingDays) {
                if (ld.getLeave_plan_id() != null && ld.getLeave_plan_id().getId().equals(savedPlan.getId())) {
                    ld.setLeave_type(leaveType.getDisplayName());
                    ld.setStart_time(slotStart);
                    ld.setEnd_time(slotEnd);
                    leaveDayDao.save(ld);
                }
            }
            return success();
        } catch (Exception e) {
            return error("update", e.getMessage());
        }
    }

    @PreAuthorize("hasAuthority('LEAVEPLAN_INSERT')")
    @DeleteMapping(value = "/leaveplan/delete")
    public String deleteData(@RequestBody LeavePlan leavePlan) {
        if (!leavePlanDao.existsById(leavePlan.getId())) {
            return error("delete", "Leave Plan with the given ID does not exist.");
        }

        try {
            leaveDayDao.deleteLeaveDaysByLeavePlanId(leavePlan.getId());
            leavePlanDao.deleteById(leavePlan.getId());
            return success();
        } catch (Exception e) {
            return error("delete", e.getMessage());
        }
    }
}
