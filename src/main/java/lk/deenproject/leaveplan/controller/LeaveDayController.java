package lk.deenproject.leaveplan.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lk.deenproject.common.BaseController;
import lk.deenproject.leaveplan.entity.LeaveDay;
import lk.deenproject.leaveplan.repository.LeaveDayRepository;

@RestController
public class LeaveDayController extends BaseController<LeaveDay, Integer> {

    @Autowired
    private LeaveDayRepository leaveDayDao;

    @Override
    protected LeaveDayRepository getRepository() {
        return leaveDayDao;
    }

    @Override
    protected String getEntityName() {
        return "leave_day";
    }

    @PreAuthorize("hasAuthority('LEAVEPLAN_SELECT')")
    @GetMapping(value = "/leave_day/alldata", produces = "application/json")
    public List<LeaveDay> getAllData() {
        return findAll();
    }

    @PreAuthorize("hasAuthority('LEAVEPLAN_SELECT')")
    @GetMapping(value = "/leave_day/byemployee", params = {"employeeid"}, produces = "application/json")
    public List<LeaveDay> getByEmployee(@RequestParam("employeeid") Integer employeeid) {
        return leaveDayDao.findByEmployeeId(employeeid);
    }

    @PreAuthorize("hasAuthority('LEAVEPLAN_SELECT')")
    @GetMapping(value = "/leave_day/byleaveplan", produces = "application/json")
    public List<LeaveDay> getLeaveDaysByLeavePlan(
            @RequestParam("leaveplanid") Integer leaveplanid) {
        return leaveDayDao.findByLeavePlanId(leaveplanid);
    }
}
