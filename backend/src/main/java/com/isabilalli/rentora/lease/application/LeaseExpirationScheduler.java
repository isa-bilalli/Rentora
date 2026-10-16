package com.isabilalli.rentora.lease.application;

import com.isabilalli.rentora.lease.domain.Lease;
import com.isabilalli.rentora.lease.infrastructure.LeaseRepository;
import com.isabilalli.rentora.lease.domain.LeaseStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class LeaseExpirationScheduler {

    private static final Logger log = LoggerFactory.getLogger(LeaseExpirationScheduler.class);

    private final LeaseRepository leaseRepository;
    private final LeaseService leaseService;

    public LeaseExpirationScheduler(
            LeaseRepository leaseRepository,
            LeaseService leaseService
    ) {
        this.leaseRepository = leaseRepository;
        this.leaseService = leaseService;
    }

    @Scheduled(cron = "0 5 0 * * *", zone = "Europe/Belgrade")
    public void runDailyLeaseJobs() {
        expireLeases();
        activateStartedLeases();
    }

    // Catches up on nightly runs missed while the server was down.
    @EventListener(ApplicationReadyEvent.class)
    public void runOnStartup() {
        runDailyLeaseJobs();
    }

    private void expireLeases() {
        List<Lease> expiredLeases = leaseRepository.findAllByStatusAndEndDateBefore(LeaseStatus.ACTIVE, LocalDate.now());
        for (Lease lease : expiredLeases) {
            // One bad lease must not stop the rest of the batch (or, at startup, the application).
            try {
                leaseService.expireLease(lease.getId());
            } catch (RuntimeException exception) {
                log.warn("Could not expire lease {}", lease.getId(), exception);
            }
        }
    }

    // Spaces reserved for a future lease become occupied once that lease starts.
    private void activateStartedLeases() {
        LocalDate today = LocalDate.now();
        List<Lease> currentLeases = leaseRepository.findAllByStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(LeaseStatus.ACTIVE, today, today);
        for (Lease lease : currentLeases) {
            try {
                leaseService.activateLease(lease.getId());
            } catch (RuntimeException exception) {
                log.warn("Could not activate lease {}", lease.getId(), exception);
            }
        }
    }
}
