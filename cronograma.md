# Playwright + TypeScript — Learning Timeline
**Target:** practicesoftwaretesting.com · **Pace:** 5h/day · 5 days/week · 5 weeks · 125h total

---

## Week 1 — Foundations
> Setup · Locators · Assertions · Form Interactions · Debugging

| Day | Focus | What to do |
|-----|-------|------------|
| Mon | Environment setup | Install Node, Playwright, TypeScript config, VS Code extension. First test: navigate to practicesoftwaretesting.com and assert the page title. |
| Tue | Locators deep dive | `getByRole`, `getByText`, `getByLabel`, `getByPlaceholder`, `getByTestId`, CSS/XPath. Practice on the homepage search bar and nav links. |
| Wed | Assertions | `toBeVisible`, `toHaveText`, `toHaveURL`, `toHaveValue`, `toBeEnabled/Disabled`. Test the product listing page. |
| Thu | Form interactions | `fill()`, `click()`, `check()`, `selectOption()`, `upload()`. Use the contact form and checkout fields. |
| Fri | Debugging tools | Playwright Inspector (`--debug`), Trace Viewer, headed mode, `slowMo`, screenshot on failure. Deliberately break a test and trace it. |

---

## Week 2 — Patterns
> Page Object Model · Fixtures · Auth State · Data-driven Tests

| Day | Focus | What to do |
|-----|-------|------------|
| Mon | Page Object Model (POM) | Build `LoginPage`, `ProductPage`, `CartPage` classes. This is the most important architectural pattern — spend the full day on it. |
| Tue | POM continued + hooks | `beforeEach`, `afterAll`, `beforeAll`. Refactor Monday's tests. Add shared state between tests. |
| Wed | Authentication & `storageState` | Log in once, save `storageState` to JSON, reuse across all tests. Critical to understand — massive time saver in real projects. |
| Thu | Fixtures (built-in + custom) | `page`, `browser`, `context` fixtures. Write a custom `authenticatedPage` fixture that auto-logs in. `playwright.config.ts` setup. |
| Fri | Data-driven tests | `test.describe` + parametrize patterns. Run the same checkout flow with the 3 different user accounts from the practice site. |

**Default accounts to use:**
- `admin@practicesoftwaretesting.com` / `welcome01` (admin)
- `customer@practicesoftwaretesting.com` / `welcome01` (user)
- `customer2@practicesoftwaretesting.com` / `welcome01` (user)

---

## Week 3 — Advanced Features
> API Testing · Network Interception · Visual Regression · Parallel Execution

| Day | Focus | What to do |
|-----|-------|------------|
| Mon | API testing with `request()` | Use the Swagger API directly. `GET /products`, `POST /auth/login`, assert JSON responses. `apiRequest` fixture. |
| Tue | Mixing UI + API | Create a product via API, assert it appears in the UI, delete via API in teardown. This is real SDET workflow. |
| Wed | Network interception: `page.route()` | Mock API responses, simulate 500 errors, slow network. Test the app's error states without touching the real backend. |
| Thu | Visual regression testing | `toHaveScreenshot()`. Test the product card on Chrome + Firefox. Understand the diff workflow and when to use visual vs functional assertions. |
| Fri | Parallel execution + config | `workers`, sharding, projects (chromium/firefox/mobile). Multi-browser setup in `playwright.config.ts` targeting all sprint versions. |

**Sprint URLs to target:**
| Sprint | URL |
|--------|-----|
| Sprint 1 | v1.practicesoftwaretesting.com |
| Sprint 2 | v2.practicesoftwaretesting.com |
| Sprint 3 | v3.practicesoftwaretesting.com |
| Sprint 4 | v4.practicesoftwaretesting.com |
| Sprint 5 (stable) | practicesoftwaretesting.com |
| Sprint 5 (with bugs) | with-bugs.practicesoftwaretesting.com |

---

## Week 4 — Real-world Application
> Full E2E Suite · Bug Hunting · CI/CD · Reporting

| Day | Focus | What to do |
|-----|-------|------------|
| Mon | Full E2E happy paths | Complete purchase flow: login → search → add to cart → checkout → order confirmation. Use Sprint 5 (practicesoftwaretesting.com). |
| Tue | Bug hunting on `with-bugs` version | Run your suite against `with-bugs.practicesoftwaretesting.com`. Document every failure as a real finding — this is the portfolio goldmine. |
| Wed | CI/CD: GitHub Actions | Write the workflow YAML: install deps, run tests, upload HTML report as artifact. Add the passing badge to your README immediately. |
| Thu | Reporting + retries | HTML reporter, Allure (optional). `test.retry` config for flaky network tests. Screenshot and video recording on failure. |
| Fri | Admin flows + role-based testing | Log in as admin, test product CRUD. Compare behaviour vs customer role. Focus: authorization boundary testing. |

---

## Week 5 — Portfolio
> Accessibility · Mobile · Refactor · Documentation · Portfolio Page

| Day | Focus | What to do |
|-----|-------|------------|
| Mon | Accessibility + keyboard nav | `page.keyboard`, tab order, ARIA assertions. Pairs directly with your existing a11y QA experience from the ArcanaFutura audit. |
| Tue | Mobile viewport + emulation | `devices['iPhone 14']`, touch events, viewport assertions. Use BrowserStack if needed. Document cross-browser results. |
| Wed | Refactor & document | Clean up POMs, add JSDoc comments, finalize README. The repo is a deliverable — treat it like one. |
| Thu | Pick your portfolio finding | Choose one interesting test (a bug caught on the buggy sprint, a network interception, an a11y catch) and write it up exactly like the five Pytest bugs. |
| Fri | Build the portfolio page | Match the style of your existing QA audit page. CI badge + one documented finding + architecture diagram + GitHub link. |

---

## Key Concepts by Week

```
Week 1  ██░░░░░░░░  Foundations   — locators, assertions, debugging
Week 2  ████░░░░░░  Patterns      — POM, fixtures, auth state
Week 3  ██████░░░░  Advanced      — API, network mock, visual, parallel
Week 4  ████████░░  Real-world    — E2E suite, bug hunting, CI/CD
Week 5  ██████████  Portfolio     — polish, docs, portfolio page
```

---

## Notes

**Why POM comes in Week 2, not Week 1:** You need to feel the pain of messy tests before the pattern makes sense. Write bad tests first — the solution becomes obvious.

**Why Week 4 is the centerpiece:** `with-bugs.practicesoftwaretesting.com` is where this becomes real. Your suite catches actual regressions you can document as findings, not just a suite that runs green.

**Why the API days are not optional:** Mixing `request()` API calls with UI assertions is what separates SDET-level work from basic UI automation. It's what will differentiate you to clients.

**On shared test data:** The practice site has shared test data across users, so another person practicing at the same time can affect your tests (e.g. modifying shared cart state). This is useful — it forces proper test isolation with `storageState` and API-driven setup/teardown earlier than you'd otherwise learn it.

**CI badge from day one of Week 4:** Don't wait until the portfolio page. Push the Actions workflow the moment the first tests pass. A badge that's been green for weeks reads very differently than one set up the day before you sent the link.