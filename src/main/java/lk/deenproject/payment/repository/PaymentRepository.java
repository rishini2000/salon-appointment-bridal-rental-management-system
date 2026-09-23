package lk.deenproject.payment.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import lk.deenproject.enums.PaymentType;
import lk.deenproject.payment.entity.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("SELECT p FROM Payment p WHERE p.bill_no = :billNo")
    Payment getByBillNo(String billNo);

    @Query("SELECT COALESCE(SUM(p.pay_amount), 0) FROM Payment p WHERE p.appointment_id.id = :appointmentId")
    BigDecimal getTotalPaidByAppointmentId(@Param("appointmentId") Integer appointmentId);

    @Query("SELECT p FROM Payment p WHERE p.appointment_id.id = :appointmentId")
    List<Payment> findByAppointmentId(@Param("appointmentId") Integer appointmentId);

  @Query("""
    SELECT COALESCE(SUM(p.pay_amount),0)
    FROM Payment p
    WHERE p.rental_id.id = :rentalId
      AND (
            p.paymentType = lk.deenproject.enums.PaymentType.ADVANCE
         OR p.paymentType = lk.deenproject.enums.PaymentType.REMAINING
      )
""")
BigDecimal getTotalPaidByRentalId(@Param("rentalId") Integer rentalId);

    @Query("SELECT p FROM Payment p WHERE p.rental_id.id=:rentalId")
    List<Payment> findByRentalId(@Param("rentalId") Integer rentalId);

 @Query("""
SELECT p
FROM Payment p
WHERE p.rental_id.id = :rentalId
AND p.paymentType = :paymentType
""")
Payment findByRentalAndPaymentType(
        @Param("rentalId") Integer rentalId,
        @Param("paymentType") PaymentType paymentType);

        @Query("""
SELECT p
FROM Payment p
WHERE p.appointment_id.id = :appointmentId
AND p.paymentType = :paymentType
""")
Payment findByAppointmentAndPaymentType(
        @Param("appointmentId") Integer appointmentId,
        @Param("paymentType") PaymentType paymentType);

        @Query("SELECT p FROM Payment p WHERE p.rental_id IS NOT NULL")
List<Payment> findRentalPayments();

@Query("SELECT p FROM Payment p WHERE p.appointment_id IS NOT NULL")
List<Payment> findAppointmentPayments();

}
