package com.isabilalli.rentora;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.function.Executable;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.client.EntityExchangeResult;
import org.springframework.test.web.servlet.client.RestTestClient;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

// The rules in docs/ROLES.md, checked over real HTTP: the whole app on a random port, its security filters, and the
// throwaway PostgreSQL from TestcontainersConfiguration. Every account signs up and logs in through the API, so the
// tokens are real too. One organization holds an owner, a manager and a member; an outsider has their own.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AccessRulesApiTest {

    private static final String NOT_A_MEMBER = "User does not have access to this organization";
    private static final String ROLE_REFUSED = "Your role in this organization does not allow this action";
    private static final String PASSWORD = "test-password-123";

    private record Account(String email, long userId, long organizationId, String token) {}

    @LocalServerPort
    private int port;

    private RestTestClient client;

    // The database outlives one run of this class, so every email and name is unique to the run.
    private final String run = UUID.randomUUID().toString().substring(0, 8);

    private Account owner;
    private Account manager;
    private Account member;
    private Account outsider;

    // The owner's organization, and what the owner set up in it.
    private long organizationId;
    private long propertyId;
    private long spaceId;
    private long tenantId;
    private long leaseId;
    private List<Long> paymentIds;
    private long expenseId;
    private long maintenanceId;

    @BeforeAll
    void setUp() {
        client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();

        owner = signUp("owner");
        manager = signUp("manager");
        member = signUp("member");
        outsider = signUp("outsider");
        organizationId = owner.organizationId();

        create(owner, "/organizations/" + organizationId + "/members", Map.of("email", manager.email(), "role", "MANAGER"));
        create(owner, "/organizations/" + organizationId + "/members", Map.of("email", member.email(), "role", "MEMBER"));

        propertyId = createProperty(owner);
        spaceId = createSpace(owner, "Unit 1");
        tenantId = createTenant(owner, "Tenant");
        leaseId = createLease(owner, tenantId, spaceId);
        // A year-long lease has a payment due every month; each test works on its own one.
        paymentIds = paymentsOf(leaseId);
        expenseId = createExpense(owner);
        maintenanceId = id(create(owner, in("/maintenance"), Map.of(
                "propertyId", propertyId, "spaceId", spaceId, "title", "Leaking tap", "priority", "MEDIUM")));
    }

    @Test
    void requestsWithoutAValidTokenAreRefused() {
        assertAll(
                () -> assertEquals(401, status(null, HttpMethod.GET, in("/properties"))),
                () -> assertEquals(401, status(null, HttpMethod.GET, "/auth/me")),
                () -> assertEquals(401, status(new Account("", 0, 0, "not-a-real-token"), HttpMethod.GET, in("/properties")))
        );
    }

    @Test
    void someoneOutsideTheOrganizationCanNeitherReadNorChangeIt() {
        List<String> reads = List.of(
                "/properties", "/properties/" + propertyId, "/properties/" + propertyId + "/spaces",
                "/spaces", "/spaces/" + spaceId,
                "/tenants", "/tenants/" + tenantId,
                "/leases", "/leases/" + leaseId,
                "/payments", "/payments/" + paymentIds.get(0), "/payments/summary", "/payments/page?status=PENDING",
                "/expenses", "/expenses/" + expenseId,
                "/maintenance", "/maintenance/" + maintenanceId,
                "/members", "/dashboard");

        assertAll(reads.stream().map(path -> (Executable) () -> assertRefused(outsider, HttpMethod.GET, in(path), null, NOT_A_MEMBER)));

        assertAll(
                () -> assertRefused(outsider, HttpMethod.POST, in("/tenants"), Map.of("type", "INDIVIDUAL", "firstName", "Sneaky", "lastName", "Tenant"), NOT_A_MEMBER),
                () -> assertRefused(outsider, HttpMethod.POST, in("/payments/" + paymentIds.get(0) + "/record"), recordPayment(), NOT_A_MEMBER),
                () -> assertRefused(outsider, HttpMethod.POST, in("/leases/" + leaseId + "/end"), null, NOT_A_MEMBER),
                () -> assertRefused(outsider, HttpMethod.DELETE, in("/tenants/" + tenantId), null, NOT_A_MEMBER),
                () -> assertRefused(outsider, HttpMethod.POST, in("/members"), Map.of("email", outsider.email(), "role", "MANAGER"), NOT_A_MEMBER)
        );

        assertNothingChanged();
    }

    // The outsider owns their own organization, so they pass its role checks; the records still aren't theirs.
    @Test
    void anotherOrganizationsRecordsCannotBeReachedThroughYourOwn() {
        String theirs = "/organizations/" + outsider.organizationId();
        List<String> reads = List.of(
                "/properties/" + propertyId, "/properties/" + propertyId + "/spaces", "/spaces/" + spaceId,
                "/tenants/" + tenantId, "/leases/" + leaseId, "/payments/" + paymentIds.get(0),
                "/expenses/" + expenseId, "/maintenance/" + maintenanceId);

        assertAll(reads.stream().map(path -> (Executable) () -> assertNotReachable(HttpMethod.GET, theirs + path, null)));

        assertAll(
                () -> assertNotReachable(HttpMethod.POST, theirs + "/payments/" + paymentIds.get(0) + "/record", recordPayment()),
                () -> assertNotReachable(HttpMethod.POST, theirs + "/payments/" + paymentIds.get(0) + "/void", null),
                () -> assertNotReachable(HttpMethod.POST, theirs + "/leases/" + leaseId + "/cancel", null),
                () -> assertNotReachable(HttpMethod.POST, theirs + "/expenses/" + expenseId + "/void", null),
                () -> assertNotReachable(HttpMethod.DELETE, theirs + "/tenants/" + tenantId, null),
                () -> assertNotReachable(HttpMethod.DELETE, theirs + "/properties/" + propertyId + "/spaces/" + spaceId, null)
        );

        assertNothingChanged();
    }

    @Test
    void aMemberIsRefusedTheManagerOnlyActions() {
        assertAll(
                () -> assertRefused(member, HttpMethod.POST, in("/members"), Map.of("email", outsider.email(), "role", "MEMBER"), ROLE_REFUSED),
                () -> assertRefused(member, HttpMethod.DELETE, in("/tenants/" + tenantId), null, ROLE_REFUSED),
                () -> assertRefused(member, HttpMethod.DELETE, in("/properties/" + propertyId + "/spaces/" + spaceId), null, ROLE_REFUSED),
                () -> assertRefused(member, HttpMethod.POST, in("/payments/" + paymentIds.get(0) + "/void"), null, ROLE_REFUSED),
                () -> assertRefused(member, HttpMethod.POST, in("/expenses/" + expenseId + "/void"), null, ROLE_REFUSED),
                () -> assertRefused(member, HttpMethod.POST, in("/leases/" + leaseId + "/end"), null, ROLE_REFUSED),
                () -> assertRefused(member, HttpMethod.POST, in("/leases/" + leaseId + "/cancel"), null, ROLE_REFUSED)
        );

        assertNothingChanged();
        List<?> members = (List<?>) read(owner, in("/members")).getResponseBody();
        assertTrue(members.stream().noneMatch(person -> outsider.email().equals(((Map<?, ?>) person).get("email"))), "nobody was added");
    }

    @Test
    void aMemberCanDoTheDayToDayWork() {
        assertAll(
                () -> assertEquals(200, status(member, HttpMethod.GET, in("/leases"))),
                () -> assertEquals(200, status(member, HttpMethod.GET, in("/payments/summary"))),
                () -> assertEquals(200, status(member, HttpMethod.GET, in("/members"))),
                () -> assertEquals(200, status(member, HttpMethod.GET, in("/dashboard")))
        );

        long createdTenant = createTenant(member, "Member's tenant");
        Map<?, ?> recorded = json(create(member, in("/payments/" + paymentIds.get(1) + "/record"), recordPayment()));
        Map<?, ?> paidExpense = json(create(member, in("/expenses/" + createExpense(member) + "/pay"), null));

        assertEquals(200, status(owner, HttpMethod.GET, in("/tenants/" + createdTenant)));
        assertEquals("PAID", recorded.get("status"));
        assertEquals(true, paidExpense.get("paid"));
    }

    @Test
    void aManagerCanDoTheManagerOnlyActions() {
        Account newcomer = signUp("newcomer");
        assertEquals("MEMBER", json(create(manager, in("/members"), Map.of("email", newcomer.email(), "role", "MEMBER"))).get("role"));

        long spareTenant = createTenant(manager, "Spare tenant");
        long spareSpace = createSpace(manager, "Spare unit");
        long expense = createExpense(manager);
        // A lease can only be ended after its first day, so this one started a month ago.
        long leaseToEnd = createLease(manager, createTenant(manager, "Ending tenant"), createSpace(manager, "Unit 2"), LocalDate.now().minusMonths(1));
        long leaseToCancel = createLease(manager, createTenant(manager, "Cancelled tenant"), createSpace(manager, "Unit 3"));

        assertAll(
                () -> assertSucceeds(manager, HttpMethod.DELETE, in("/tenants/" + spareTenant)),
                () -> assertSucceeds(manager, HttpMethod.DELETE, in("/properties/" + propertyId + "/spaces/" + spareSpace)),
                () -> assertEquals("VOIDED", json(create(manager, in("/payments/" + paymentIds.get(2) + "/void"), null)).get("status")),
                () -> assertEquals("VOIDED", json(create(manager, in("/expenses/" + expense + "/void"), null)).get("status")),
                () -> assertEquals("ENDED", json(create(manager, in("/leases/" + leaseToEnd + "/end"), null)).get("status")),
                () -> assertEquals("CANCELLED", json(create(manager, in("/leases/" + leaseToCancel + "/cancel"), null)).get("status"))
        );

        assertEquals(404, status(owner, HttpMethod.GET, in("/tenants/" + spareTenant)), "the tenant is gone");
    }

    @Test
    void nobodyCanBeAddedAsAnOwner() {
        Account newcomer = signUp("would-be-owner");

        EntityExchangeResult<Map> result = send(manager, HttpMethod.POST, in("/members"), Map.of("email", newcomer.email(), "role", "OWNER"));

        assertEquals(400, result.getStatus().value());
    }

    // The records the refused requests aimed at are as the owner left them.
    private void assertNothingChanged() {
        assertAll(
                () -> assertEquals(200, status(owner, HttpMethod.GET, in("/tenants/" + tenantId)), "tenant still there"),
                () -> assertEquals(200, status(owner, HttpMethod.GET, in("/spaces/" + spaceId)), "space still there"),
                () -> assertEquals("ACTIVE", json(read(owner, in("/leases/" + leaseId))).get("status")),
                () -> assertEquals("PENDING", json(read(owner, in("/payments/" + paymentIds.get(0)))).get("status")),
                () -> assertEquals("RECORDED", json(read(owner, in("/expenses/" + expenseId))).get("status"))
        );
    }

    private void assertRefused(Account account, HttpMethod method, String path, Object body, String message) {
        EntityExchangeResult<Map> result = send(account, method, path, body);
        assertEquals(403, result.getStatus().value(), method + " " + path);
        assertEquals(message, json(result).get("error"), method + " " + path);
    }

    // Through the outsider's own organization, a record of another one answers as forbidden or as missing.
    private void assertNotReachable(HttpMethod method, String path, Object body) {
        int status = status(outsider, method, path, body);
        assertTrue(status == 403 || status == 404, method + " " + path + " answered " + status);
    }

    private void assertSucceeds(Account account, HttpMethod method, String path) {
        int status = status(account, method, path);
        assertTrue(status >= 200 && status < 300, method + " " + path + " answered " + status);
    }

    // Paths inside the owner's organization.
    private String in(String path) {
        return "/organizations/" + organizationId + path;
    }

    private Account signUp(String name) {
        String email = name + "-" + run + "@rentora.test";
        Map<?, ?> registered = json(create(null, "/auth/register", Map.of(
                "organizationName", name + "'s organization " + run,
                "firstName", name,
                "lastName", "Tester",
                "email", email,
                "password", PASSWORD)));
        Map<?, ?> login = json(create(null, "/auth/login", Map.of("email", email, "password", PASSWORD)));
        return new Account(email, number(registered, "userId"), number(registered, "organizationId"), (String) login.get("accessToken"));
    }

    private long createProperty(Account account) {
        return id(create(account, in("/properties"), Map.of(
                "name", "Harbour View", "addressLine", "1 Test Street", "city", "Dublin", "country", "Ireland")));
    }

    private long createSpace(Account account, String name) {
        return id(create(account, in("/properties/" + propertyId + "/spaces"), Map.of(
                "name", name, "type", "RESIDENTIAL", "floor", 1, "area", 50)));
    }

    private long createTenant(Account account, String lastName) {
        return id(create(account, in("/tenants"), Map.of("type", "INDIVIDUAL", "firstName", "Test", "lastName", lastName)));
    }

    private long createLease(Account account, long tenant, long space) {
        return createLease(account, tenant, space, LocalDate.now());
    }

    private long createLease(Account account, long tenant, long space, LocalDate start) {
        return id(create(account, in("/leases"), Map.of(
                "tenantId", tenant, "spaceId", space,
                "startDate", start.toString(), "endDate", start.plusYears(1).minusDays(1).toString(),
                "monthlyRentCents", 100_000, "securityDepositCents", 200_000)));
    }

    private long createExpense(Account account) {
        return id(create(account, in("/expenses"), Map.of(
                "propertyId", propertyId, "category", "CLEANING", "amountCents", 5_000, "expenseDate", LocalDate.now().toString())));
    }

    private List<Long> paymentsOf(long lease) {
        List<?> payments = (List<?>) read(owner, in("/payments/leases/" + lease)).getResponseBody();
        return payments.stream().map(payment -> number((Map<?, ?>) payment, "id")).toList();
    }

    private static Map<String, Object> recordPayment() {
        return Map.of("paidAt", OffsetDateTime.now().toString(), "paymentMethod", "BANK_TRANSFER");
    }

    // A request that must succeed, e.g. setting something up; any 2xx will do.
    private EntityExchangeResult<Map> create(Account account, String path, Object body) {
        EntityExchangeResult<Map> result = send(account, HttpMethod.POST, path, body);
        assertTrue(result.getStatus().is2xxSuccessful(), "POST " + path + " answered " + result.getStatus() + ": " + result.getResponseBody());
        return result;
    }

    private EntityExchangeResult<Object> read(Account account, String path) {
        EntityExchangeResult<Object> result = request(account, HttpMethod.GET, path, null).expectBody(Object.class).returnResult();
        assertEquals(200, result.getStatus().value(), "GET " + path);
        return result;
    }

    private int status(Account account, HttpMethod method, String path) {
        return status(account, method, path, null);
    }

    // Read as text, since a list endpoint answers with an array.
    private int status(Account account, HttpMethod method, String path, Object body) {
        return request(account, method, path, body).expectBody(String.class).returnResult().getStatus().value();
    }

    private EntityExchangeResult<Map> send(Account account, HttpMethod method, String path, Object body) {
        return request(account, method, path, body).expectBody(Map.class).returnResult();
    }

    private RestTestClient.ResponseSpec request(Account account, HttpMethod method, String path, Object body) {
        RestTestClient.RequestBodySpec request = client.method(method).uri("/api" + path);
        if (account != null) {
            request.header(HttpHeaders.AUTHORIZATION, "Bearer " + account.token());
        }
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).body(body);
        }
        return request.exchange();
    }

    private static Map<?, ?> json(EntityExchangeResult<?> result) {
        return (Map<?, ?>) result.getResponseBody();
    }

    private static long id(EntityExchangeResult<Map> result) {
        return number(json(result), "id");
    }

    private static long number(Map<?, ?> json, String field) {
        return ((Number) json.get(field)).longValue();
    }
}
