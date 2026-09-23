package lk.deenproject.fitton.controller;

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
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lk.deenproject.common.BaseController;
import lk.deenproject.fitton.entity.Fitton;
import lk.deenproject.fitton.entity.FittonHasItem;
import lk.deenproject.fitton.repository.FittonRepository;

@RestController
public class FittonController extends BaseController<Fitton, Integer> {

    @Autowired
    private FittonRepository fittonDao;

    @Override
    protected FittonRepository getRepository() {
        return fittonDao;
    }

    @Override
    protected String getEntityName() {
        return "fitton";
    }

    @RequestMapping("/fitton")
    public org.springframework.web.servlet.ModelAndView fittonPage() {
        return createPageView();
    }

    @PreAuthorize("hasAuthority('FITTON_SELECT')")
    @GetMapping(value = "/fitton/alldata", produces = "application/json")
    public List<Fitton> getAllData() {
        return findAll();
    }

    @PreAuthorize("hasAuthority('FITTON_SELECT')")
    @GetMapping(value = "/fitton/getpage", produces = "application/json")
    public Page<Fitton> getPage(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        Pageable pageable = parsePageable(page, size, sort);
        return toPage(findAll(), pageable);
    }

    @PreAuthorize("hasAuthority('FITTON_SELECT')")
    @GetMapping(value = "/fitton/byid/{id}", produces = "application/json")
    public Fitton getById(@PathVariable Integer id) {
        return fittonDao.findById(id).orElse(null);
    }

    @PreAuthorize("hasAuthority('FITTON_INSERT')")
    @PostMapping(value = "/fitton/insert")
    public String saveData(@Valid @RequestBody Fitton fitton) {

        try {

            fitton.setAddeddatetime(LocalDateTime.now());

            if (fitton.getFittonHasItemsList() != null) {
                for (FittonHasItem item : fitton.getFittonHasItemsList()) {
                    item.setFitton_id(fitton);
                }
            }

            fittonDao.save(fitton);

            return success();

        } catch (Exception e) {
            return error("save", e.getMessage());
        }
    }

@PreAuthorize("hasAuthority('FITTON_UPDATE')")
@PutMapping(value = "/fitton/update")
public String updateData(@Valid @RequestBody Fitton fitton) {

    if (!fittonDao.existsById(fitton.getId())) {
        return error("update",
                "Fitton with ID " + fitton.getId() + " does not exist.");
    }

    try {

        // Get the existing managed Fitton from database
        Fitton existingFitton =
                fittonDao.findById(fitton.getId()).orElse(null);

        if (existingFitton == null) {
            return error("update",
                    "Fitton with ID " + fitton.getId() + " does not exist.");
        }

        // Update main Fitton fields
        existingFitton.setFitton_date(fitton.getFitton_date());
        existingFitton.setFittonStatus(fitton.getFittonStatus());
        existingFitton.setRental_id(fitton.getRental_id());
        existingFitton.setUpdatedatetime(LocalDateTime.now());

        // Incoming items from frontend

final List<FittonHasItem> incomingItems =
        fitton.getFittonHasItemsList() != null
                ? fitton.getFittonHasItemsList()
                : List.of();

        // ------------------------------------------------
        // Remove items which were deleted from inner table
        // ------------------------------------------------

        existingFitton.getFittonHasItemsList()
                .removeIf(existingItem -> {

                    Integer existingItemId = existingItem.getId();

                    if (existingItemId == null) {
                        return false;
                    }

                    return incomingItems.stream()
                            .noneMatch(incomingItem ->
                                    incomingItem.getId() != null
                                    && incomingItem.getId()
                                        .equals(existingItemId));
                });


        // ------------------------------------------------
        // Add new items / update existing items
        // ------------------------------------------------

        for (FittonHasItem incomingItem : incomingItems) {

            if (incomingItem.getId() == null) {

                // New inner item
                incomingItem.setFitton_id(existingFitton);

                existingFitton.getFittonHasItemsList()
                        .add(incomingItem);

            } else {

                // Find existing inner item
                FittonHasItem existingItem =
                        existingFitton.getFittonHasItemsList()
                                .stream()
                                .filter(item ->
                                        incomingItem.getId()
                                                .equals(item.getId()))
                                .findFirst()
                                .orElse(null);

                if (existingItem != null) {

                    existingItem.setItem_id(
                            incomingItem.getItem_id());

                    existingItem.setAlteration_required(
                            incomingItem.getAlteration_required());

                    existingItem.setAlteration_note(
                            incomingItem.getAlteration_note());

                }
            }
        }

        // Save managed parent
        fittonDao.save(existingFitton);

        return success();

    } catch (Exception e) {

        return error("update", e.getMessage());
    }
}

    @PreAuthorize("hasAuthority('FITTON_DELETE')")
    @DeleteMapping(value = "/fitton/delete")
    public String deleteData(@RequestBody Fitton fitton) {
        if (!fittonDao.existsById(fitton.getId())) {
            return error("delete", "Fitton with ID " + fitton.getId() + " does not exist.");
        }

        try {
            fitton.setDeletedatetime(LocalDateTime.now());
            fittonDao.deleteById(fitton.getId());
            return success();
        } catch (Exception e) {
            return error("delete", e.getMessage());
        }
    }
}
