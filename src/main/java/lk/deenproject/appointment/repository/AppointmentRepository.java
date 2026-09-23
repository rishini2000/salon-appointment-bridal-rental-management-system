package lk.deenproject.appointment.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import lk.deenproject.appointment.entity.Appointment;
import lk.deenproject.enums.AppointmentStatus;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {

    @Query("SELECT a FROM Appointment a WHERE a.employee_id.id = :employeeId AND a.date BETWEEN :startDate AND :endDate AND a.appointmentStatus != :cancelledStatus")
    List<Appointment> findConflictingAppointments(
            @Param("employeeId") Integer employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("cancelledStatus") AppointmentStatus cancelledStatus);

    @Query("SELECT a FROM Appointment a WHERE a.employee_id.id = :employeeId AND a.date = :date")
    List<Appointment> findByEmployeeIdAndDate(@Param("employeeId") Integer employeeId,
            @Param("date") LocalDate date);

    @Query("""
            SELECT a
            FROM Appointment a
            WHERE a.employee_id.id = :employeeId
            AND a.date = :date
            AND a.appointmentStatus <> lk.deenproject.enums.AppointmentStatus.CANCELLED
            AND (
                a.start_time < :endTime
                AND
                a.end_time > :startTime
            )
            """)
    List<Appointment> findOverlappingAppointments(
            @Param("employeeId") Integer employeeId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime);

    @Query("""
                SELECT a
                FROM Appointment a
                WHERE a.customer_id.id = :customerId
                AND a.date = :date
                AND a.appointmentStatus <> lk.deenproject.enums.AppointmentStatus.CANCELLED
                AND (
                    a.start_time < :endTime
                    AND
                    a.end_time > :startTime
                )
            """)
    List<Appointment> findCustomerOverlappingAppointments(
            @Param("customerId") Integer customerId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime);

    @Query("SELECT a FROM Appointment a WHERE a.employee_id.id = :employeeId")
    List<Appointment> findByEmployee(@Param("employeeId") Integer employeeId);
}
