package lk.deenproject.rental.controller;

import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import jakarta.validation.Valid;
import lk.deenproject.common.BaseController;
import lk.deenproject.rental.entity.Rental;
import lk.deenproject.rental.repository.RentalRepository;

@RestController
public class RentalController extends BaseController<Rental, Integer> {

    @Autowired
    private RentalRepository rentalDao;

    @Override
    protected RentalRepository getRepository() {
        return rentalDao;
    }

    @Override
    protected String getEntityName() {
        return "rental";
    }

    @RequestMapping("/rental")
    public org.springframework.web.servlet.ModelAndView rentalPage() {
        return createPageView();
    }

    @PreAuthorize("hasAuthority('RENTAL_SELECT')")
    @GetMapping(value = "/rental/rent_no", produces = "application/json")
    public String getRentNoByIdAndCustomerName(@RequestParam("id") Integer id,
            @RequestParam("customer_name") String customerName) {
        Rental rental = rentalDao.findById(id).orElse(null);
        if (rental != null && rental.getCustomer_id() != null
                && rental.getCustomer_id().getFirstname().equals(customerName)) {
            return rental.getRent_no();
        }
        return null;
    }

    @PreAuthorize("hasAuthority('RENTAL_SELECT')")
    @GetMapping(value = "/rental/alldata", produces = "application/json")
    public List<Rental> getAllData() {
        return rentalDao.getActiveRentals();
    }

    @PreAuthorize("hasAuthority('RENTAL_SELECT')")
    @GetMapping(value = "/rental/getpage", produces = "application/json")
    public Page<Rental> getPage(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        Pageable pageable = parsePageable(page, size, sort);
        return toPage(rentalDao.getActiveRentals(), pageable);
    }

    @PreAuthorize("hasAuthority('RENTAL_SELECT')")
@GetMapping(value = "/rental/activebycustomer/{customerId}", produces = "application/json")
public List<Rental> getActiveRentalsByCustomer(@PathVariable Integer customerId) {
    return rentalDao.getActiveRentalsByCustomer(customerId);
}

    @PreAuthorize("hasAuthority('RENTAL_SELECT')")
    @GetMapping(value = "/rental/byid/{id}", produces = "application/json")
    public Rental getById(@PathVariable Integer id) {
        return rentalDao.findById(id).orElse(null);
    }


@PreAuthorize("hasAuthority('RENTAL_INSERT')")
@PostMapping(value = "/rental/insert", consumes = "multipart/form-data")
public String saveData(
        @RequestPart("rental") @Valid Rental rental,
        @RequestPart(value = "nicImage", required = false) MultipartFile nicImage) {

    try {

        // Generate Rental Number
        rental.setRent_no(generateCode("rental", "rent_no", "RNT"));

        // Set Added Date/Time
        rental.setAddeddatetime(LocalDateTime.now());

        // Save NIC Image
        if (nicImage != null && !nicImage.isEmpty()) {

            String uploadDirectory = "uploads/nic/";

            Path uploadPath = Paths.get(uploadDirectory);

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFileName = nicImage.getOriginalFilename();

            String extension = "";

            if (originalFileName != null &&
                    originalFileName.contains(".")) {

                extension = originalFileName.substring(
                        originalFileName.lastIndexOf(".")
                ).toLowerCase();
            }

            String fileName = UUID.randomUUID().toString() + extension;

            Path filePath = uploadPath.resolve(fileName);

            Files.copy(
                    nicImage.getInputStream(),
                    filePath
            );

            // Store image path in database
            rental.setNic_image(
                    "/uploads/nic/" + fileName
            );
        }

        // Set Rental ID for child items
        if (rental.getRentalHasItemList() != null) {

            rental.getRentalHasItemList().forEach(item -> {
                item.setRental_id(rental);
            });
        }

        // Save Rental
        rentalDao.save(rental);

        return success();

    } catch (Exception e) {

        return error("save", e.getMessage());
    }
}

    @PreAuthorize("hasAuthority('RENTAL_UPDATE')")
    @PutMapping(value = "/rental/update")
    public String updateData(@Valid @RequestBody Rental rental) {
        try {

            rental.setUpdatedatetime(LocalDateTime.now());

            if (rental.getRentalHasItemList() != null) {
                rental.getRentalHasItemList().forEach(item -> {
                    item.setRental_id(rental);
                });
            }

            rentalDao.save(rental);

            return success();

        } catch (Exception e) {
            return error("update", e.getMessage());
        }
    }

    @PreAuthorize("hasAuthority('RENTAL_DELETE')")
    @DeleteMapping(value = "/rental/delete")
    public String deleteData(@RequestBody Rental rental) {

        Rental existingRental = rentalDao.findById(rental.getId()).orElse(null);

        if (existingRental == null) {
            return error("delete", "Rental not found.");
        }

        try {

            existingRental.setDeletedatetime(LocalDateTime.now());

            if (existingRental.getRentalHasItemList() != null) {
                existingRental.getRentalHasItemList().forEach(item -> {
                    item.setRental_id(existingRental);
                });
            }

            rentalDao.save(existingRental);

            return success();

        } catch (Exception e) {
            return error("delete", e.getMessage());
        }
    }
}
