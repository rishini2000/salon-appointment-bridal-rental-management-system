package lk.deenproject.common;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.servlet.ModelAndView;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

public abstract class BaseController<T, ID> {

    @PersistenceContext
    private EntityManager entityManager;

    protected abstract JpaRepository<T, ID> getRepository();

    protected abstract String getEntityName();

    protected String generateCode(String tableName, String columnName, String prefix) {
        try {
            Object result = entityManager.createNativeQuery(
                "SELECT MAX(CAST(SUBSTRING(" + columnName + ", " + (prefix.length() + 1) + ") AS UNSIGNED)) " +
                "FROM " + tableName + " WHERE " + columnName + " LIKE :pattern"
            ).setParameter("pattern", prefix + "%").getSingleResult();

            int nextNumber = 1;
            if (result != null) {
                nextNumber = ((Number) result).intValue() + 1;
            }

            Object maxCode = entityManager.createNativeQuery(
                "SELECT MAX(" + columnName + ") FROM " + tableName + " WHERE " + columnName + " LIKE :pattern"
            ).setParameter("pattern", prefix + "%").getSingleResult();

            int padding = 3;
            if (maxCode != null) {
                String maxCodeStr = maxCode.toString();
                int numericPartLength = maxCodeStr.length() - prefix.length();
                if (numericPartLength > 0) {
                    padding = numericPartLength;
                }
            }

            return prefix + String.format("%0" + padding + "d", nextNumber);
        } catch (Exception e) {
            Long count = getRepository().count();
            return prefix + String.format("%03d", count + 1);
        }
    }

    protected ModelAndView createPageView() {
        ModelAndView mv = new ModelAndView();
        mv.setViewName(getEntityName() + ".html");
        mv.addObject("currentPage", getEntityName());
        return mv;
    }

    protected List<T> findAll() {
        return getRepository().findAll();
    }

    protected boolean existsById(ID id) {
        return getRepository().findById(id).isPresent();
    }

    protected String success() {
        return "OK";
    }

    protected String error(String operation, String reason) {
        return capitalize(getEntityName()) + " " + operation + " failed: " + reason;
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }

    /**
     * Build a {@link Pageable} from raw request params with sensible defaults.
     * Caps page size to {@link #MAX_PAGE_SIZE} to prevent abusive requests.
     */
    protected Pageable parsePageable(Integer page, Integer size, String sort) {
        int pageNumber = (page == null || page < 0) ? 0 : page;
        int pageSize = (size == null || size <= 0) ? 10 : Math.min(size, MAX_PAGE_SIZE);
        Sort sortObj = parseSort(sort);
        return PageRequest.of(pageNumber, pageSize, sortObj);
    }

    /**
     * Convert a list already filtered by controller logic into a {@link Page}
     * so the same role/security scoping can back both unpaged and paged reads.
     */
    protected Page<T> toPage(List<T> filtered, Pageable pageable) {
        if (filtered == null) {
            return Page.empty(pageable);
        }
        int total = filtered.size();
        int start = (int) Math.min((long) pageable.getPageNumber() * pageable.getPageSize(), total);
        int end = Math.min(start + pageable.getPageSize(), total);
        List<T> slice = filtered.subList(start, end);
        return new PageImpl<>(slice, pageable, total);
    }

    private Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "id");
        }
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        Sort.Direction direction = Sort.Direction.ASC;
        if (parts.length > 1) {
            try {
                direction = Sort.Direction.fromString(parts[1].trim());
            } catch (IllegalArgumentException ignored) {
                direction = Sort.Direction.ASC;
            }
        }
        return Sort.by(direction, field.isBlank() ? "id" : field);
    }

    public static final int MAX_PAGE_SIZE = 100;
    public static final int DEFAULT_PAGE_SIZE = 10;
}
