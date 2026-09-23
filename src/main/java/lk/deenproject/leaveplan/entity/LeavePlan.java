package lk.deenproject.leaveplan.entity;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lk.deenproject.employee.Entity.Employee;
import lk.deenproject.enums.LeaveType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "leave_plan")

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LeavePlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "leave_type")
    private String leaveType;

    private LocalDateTime addeddatetime;
    private LocalDateTime updatedatetime;
    private LocalDateTime deletedatetime;

    @ManyToOne
    @JoinColumn(name = "employee_id", referencedColumnName = "id")
    private Employee employee_id;

    @JsonManagedReference
    @OneToMany(mappedBy = "leave_plan_id", fetch = FetchType.LAZY)
    private List<LeaveDay> leaveDays;

    @Transient
    private List<String> leaveDates;

    public LeaveType getLeaveTypeEnum() {
        return LeaveType.fromDisplayName(leaveType);
    }
}
