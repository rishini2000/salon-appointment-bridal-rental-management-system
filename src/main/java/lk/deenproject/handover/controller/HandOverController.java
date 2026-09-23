package lk.deenproject.handover.controller;

import java.time.LocalDateTime;
import java.util.List;

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
import org.springframework.web.bind.annotation.RestController;
import lk.deenproject.enums.HandOverStatus;
import lk.deenproject.enums.ItemCondition;
import lk.deenproject.enums.ItemStatus;
import lk.deenproject.enums.RentalStatus;

import jakarta.validation.Valid;
import lk.deenproject.common.BaseController;
import lk.deenproject.handover.entity.HandOver;
import lk.deenproject.handover.repository.HandOverRepository;
import lk.deenproject.item.entity.Item;
import lk.deenproject.item.repository.ItemRepository;
import lk.deenproject.rental.entity.Rental;
import lk.deenproject.rental.entity.RentalHasItem;
import lk.deenproject.rental.repository.RentalRepository;

@RestController
public class HandOverController extends BaseController<HandOver, Integer> {

    @Autowired
    private HandOverRepository handOverDao;

    @Override
    protected HandOverRepository getRepository() {
        return handOverDao;
    }

    @Autowired
private RentalRepository rentalDao;

@Autowired
private ItemRepository itemDao;

    @Override
    protected String getEntityName() {
        return "handover";
    }

    @RequestMapping("/handover")
    public org.springframework.web.servlet.ModelAndView handoverPage() {
        return createPageView();
    }

    @PreAuthorize("hasAuthority('HANDOVER_SELECT')")
    @GetMapping(value = "/handover/alldata", produces = "application/json")
    public List<HandOver> getAllData() {
        return findAll();
    }

    @PreAuthorize("hasAuthority('HANDOVER_SELECT')")
    @GetMapping(value = "/handover/getpage", produces = "application/json")
    public Page<HandOver> getPage(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        Pageable pageable = parsePageable(page, size, sort);
        return toPage(findAll(), pageable);
    }

    @PreAuthorize("hasAuthority('HANDOVER_INSERT')")
    @PostMapping(value = "/handover/insert")
    public String saveData(@Valid @RequestBody HandOver handover) {
        try {

handover.setAddeddatetime(LocalDateTime.now());

updateItemStatuses(handover);

HandOver savedHandOver = handOverDao.save(handover);

if (savedHandOver.getHandoverStatus() == HandOverStatus.RETURNED) {
    rentalDao.updateRentalStatus(savedHandOver.getRental_id().getId(), RentalStatus.COMPLETED);
}

return success();

        } catch (Exception e) {
            return error("save", e.getMessage());
        }
    }

    @PreAuthorize("hasAuthority('HANDOVER_UPDATE')")
    @PutMapping(value = "/handover/update")
    public String updateData(@Valid @RequestBody HandOver handover) {
        try {
            handover.setUpdatedatetime(LocalDateTime.now());
            handOverDao.save(handover);
            return success();
        } catch (Exception e) {
            return error("update", e.getMessage());
        }
    }

    @PreAuthorize("hasAuthority('HANDOVER_DELETE')")
    @DeleteMapping(value = "/handover/delete")
    public String deleteData(@RequestBody HandOver handover) {
        HandOver existing = handOverDao.getReferenceById(handover.getId());
        if (existing == null) {
            return error("delete", "Handover not found.");
        }
        try {
            handOverDao.delete(handover);
            return success();
        } catch (Exception e) {
            return error("delete", e.getMessage());
        }
    }

    private void updateItemStatuses(HandOver handover) {

    if (handover.getRental_id() == null) {
        return;
    }

    Rental rental = handover.getRental_id();

    if (rental.getRentalHasItemList() == null) {
        return;
    }

    for (RentalHasItem rentalHasItem : rental.getRentalHasItemList()) {

        if (rentalHasItem.getItem_id() == null) {
            continue;
        }

        Item item = rentalHasItem.getItem_id();

        ItemCondition condition = rentalHasItem.getItemCondition();

        if (condition == null) {
            continue;
        }

        if (condition == ItemCondition.GOOD) {

            item.setItemStatus(ItemStatus.AVAILABLE);

        } else if (condition == ItemCondition.DAMAGED) {

            item.setItemStatus(ItemStatus.UNDER_MAINTENANCE);

        } else if (condition == ItemCondition.LOST) {

            item.setItemStatus(ItemStatus.INACTIVE);
        }

        itemDao.save(item);
    }
}
}
