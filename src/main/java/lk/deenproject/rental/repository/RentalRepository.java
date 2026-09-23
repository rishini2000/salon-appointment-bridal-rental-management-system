package lk.deenproject.rental.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import lk.deenproject.enums.RentalStatus;
import lk.deenproject.rental.entity.Rental;
import org.springframework.transaction.annotation.Transactional;


public interface RentalRepository extends JpaRepository<Rental, Integer> {

    @Query("SELECT r FROM Rental r WHERE r.deletedatetime IS NULL")
    List<Rental> getActiveRentals();

    @Query("""
            SELECT r
            FROM Rental r
            WHERE r.deletedatetime IS NULL
            AND r.customer_id.id = :customerId
            AND r.rentalStatus = lk.deenproject.enums.RentalStatus.ACTIVE
            """)
    List<Rental> getActiveRentalsByCustomer(Integer customerId);


    @Modifying
@Transactional
@Query("UPDATE Rental r SET r.rentalStatus = :status WHERE r.id = :id")
void updateRentalStatus(@Param("id") Integer id,
                        @Param("status") RentalStatus status);

}
