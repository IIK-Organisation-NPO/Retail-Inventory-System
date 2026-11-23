import { useEffect, useState } from "react";
import SupplierSidebar from "../../components/Supplier/SupplierSidebar";
import "../../Style/components/Supplier/SupplierDashboard.css";

const REGISTRATION_STEPS = [
  "Enter your company’s CIPC registration number",
  "Check the details we find at CIPC",
  "Add your contact, categories and delivery areas",
  "Send it to IIK for review",
];
const PRODUCT_CATEGORIES = [
  "Groceries",
  "Drinks",
  "Snacks",
  "Household",
  "Toiletries",
  "Stationery",
  "Agriculture",
  "Hardware",
];
const SUPPLIER_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

const MOCK_CIPC_COMPANY = {
  name: "Tiger Brands Ltd",
  type: "Public Company",
  registrationDate: "12 March 2012",
  status: "In Business",
  registeredAddress: "1 Sample Road, Sandton, Gauteng, 2191",
};

const APPROVED_DASHBOARD_STATS = [
  { label: "Open demand requests", value: 3 },
  { label: "Not quoted yet", value: 2 },
  { label: "Quotes accepted", value: 1 },
  { label: "Orders to confirm", value: 1 },
];

const OPEN_DEMAND_REQUESTS = [
  { product: "Coca-Cola 500ml", demand: "72 units", stores: 2, closes: "Sun 22 Nov", status: "New", action: "View and quote" },
  { product: "Ace Maize Meal 2.5kg", demand: "100 units", stores: 3, closes: "Fri 20 Nov", status: "Quote submitted", action: "View" },
  { product: "Sunflower oil 5L", demand: "60 L", stores: 4, closes: "Wed 25 Nov", status: "New", action: "View and quote" },
];

const WAITING_ORDERS = [
  { order: "ORD-001", product: "Ace Maize Meal 2.5kg", quantity: 70, total: "R3,640.00", deliverBy: "20 Nov" },
];

const RECENT_QUOTES = [
  { product: "Ace Maize Meal 2.5kg", unitPrice: "R52.00", status: "Accepted" },
  { product: "Fanta Orange 500ml", unitPrice: "R14.50", status: "Declined" },
];

const SupplierApprovedDashboard = () => (
  <main className="supplier-dashboard-main supplier-approved-dashboard">
    <header className="supplier-dashboard-header">
      <h1>Dashboard</h1>
      <div className="supplier-dashboard-account">
        <div className="supplier-company-pill">
          <span className="supplier-company-initials">TB</span>
          <span>Tiger Brands Ltd</span>
        </div>
        <span className="supplier-user-avatar" aria-label="Supplier account">NM</span>
      </div>
    </header>

    <p className="supplier-approved-notice" role="status">
      2 new demand requests match your product categories.
    </p>

    <section className="supplier-dashboard-stats" aria-label="Supplier activity summary">
      {APPROVED_DASHBOARD_STATS.map((stat) => (
        <article className="supplier-dashboard-stat" key={stat.label}>
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
        </article>
      ))}
    </section>

    <section className="supplier-dashboard-panel supplier-demand-panel">
      <div className="supplier-dashboard-panel-header">
        <h2>Open demand requests</h2>
        <button type="button" className="supplier-dashboard-outline-button">All requests</button>
      </div>
      <div className="supplier-dashboard-table-wrap">
        <table className="supplier-dashboard-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Combined demand</th>
              <th scope="col">Stores</th>
              <th scope="col">Closes</th>
              <th scope="col">Status</th>
              <th scope="col"><span className="supplier-visually-hidden">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {OPEN_DEMAND_REQUESTS.map((request) => (
              <tr key={request.product}>
                <td>{request.product}</td>
                <td>{request.demand}</td>
                <td>{request.stores}</td>
                <td>{request.closes}</td>
                <td>
                  <span className={`supplier-dashboard-status${request.status === "New" ? " new" : ""}`}>
                    {request.status}
                  </span>
                </td>
                <td><button type="button" className="supplier-dashboard-text-button">{request.action}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    <div className="supplier-dashboard-lower-panels">
      <section className="supplier-dashboard-panel">
        <h2>Orders waiting for you</h2>
        <div className="supplier-dashboard-table-wrap">
          <table className="supplier-dashboard-table supplier-orders-table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Product</th>
                <th scope="col">Quantity</th>
                <th scope="col">Total</th>
                <th scope="col">Deliver by</th>
                <th scope="col"><span className="supplier-visually-hidden">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {WAITING_ORDERS.map((order) => (
                <tr key={order.order}>
                  <td>{order.order}</td>
                  <td>{order.product}</td>
                  <td>{order.quantity}</td>
                  <td>{order.total}</td>
                  <td>{order.deliverBy}</td>
                  <td><button type="button" className="supplier-dashboard-text-button">Confirm order</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="supplier-dashboard-panel">
        <h2>Recent quotations</h2>
        <div className="supplier-dashboard-table-wrap">
          <table className="supplier-dashboard-table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Unit price</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_QUOTES.map((quote) => (
                <tr key={quote.product}>
                  <td>{quote.product}</td>
                  <td>{quote.unitPrice}</td>
                  <td>
                    <span className={`supplier-dashboard-status ${quote.status.toLowerCase()}`}>
                      {quote.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
);

const SupplierDashboard = () => {
  const [showVerification, setShowVerification] = useState(false);
  const [cipcNumber, setCipcNumber] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [isCheckingCipc, setIsCheckingCipc] = useState(false);
  const [verifiedCompany, setVerifiedCompany] = useState(null);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [contactPerson, setContactPerson] = useState("Nandi Mokoena");
  const [contactMobile, setContactMobile] = useState("011 840 4000");
  const [contactEmail, setContactEmail] = useState("info@tigerbrands.com");
  const [website, setWebsite] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["Groceries", "Drinks", "Snacks"]);
  const [deliveryAreas, setDeliveryAreas] = useState(["Msunduzi", "Mkhambathini", "uMngeni"]);
  const [showAddArea, setShowAddArea] = useState(false);
  const [newDeliveryArea, setNewDeliveryArea] = useState("");
  const [sameRegisteredAddress, setSameRegisteredAddress] = useState(true);
  const [businessAddress, setBusinessAddress] = useState("1 Sample Road, Sandton, Gauteng, 2191");
  const [postalAddress, setPostalAddress] = useState("PO Box 100, Sandton, 2146");
  const [province, setProvince] = useState("Gauteng");
  const [showApplicationReview, setShowApplicationReview] = useState(false);
  const [acceptedSupplierTerms, setAcceptedSupplierTerms] = useState(false);
  const [confirmedApplicationDetails, setConfirmedApplicationDetails] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [applicationApproved, setApplicationApproved] = useState(false);

  useEffect(() => {
    if (!isCheckingCipc) return undefined;

    const timer = setTimeout(() => {
      setVerifiedCompany({
        ...MOCK_CIPC_COMPANY,
        registrationNumber: cipcNumber.trim(),
      });
      setIsCheckingCipc(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [cipcNumber, isCheckingCipc]);

  const handleVerifyCompany = (event) => {
    event.preventDefault();
    if (!/^\d{4}\/\d{6}\/\d{2}$/.test(cipcNumber.trim())) {
      setVerificationError("Enter the CIPC number in the format YYYY/NNNNNN/NN.");
      return;
    }

    setVerificationError("");
    setIsCheckingCipc(true);
  };

  const closeVerification = () => {
    setShowVerification(false);
    setIsCheckingCipc(false);
    setVerificationError("");
  };

  const toggleProductCategory = (category) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((entry) => entry !== category)
        : [...current, category]
    );
  };

  const addDeliveryArea = () => {
    const area = newDeliveryArea.trim();
    if (!area || deliveryAreas.some((entry) => entry.toLowerCase() === area.toLowerCase())) return;
    setDeliveryAreas((current) => [...current, area]);
    setNewDeliveryArea("");
    setShowAddArea(false);
  };

  const canReviewApplication = Boolean(
    contactPerson.trim() &&
    contactMobile.trim() &&
    contactEmail.trim() &&
    selectedCategories.length &&
    deliveryAreas.length &&
    businessAddress.trim() &&
    province
  );
  const companyInitials = verifiedCompany?.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="supplier-dashboard-layout">
      <SupplierSidebar />

      {applicationApproved ? <SupplierApprovedDashboard /> : <main className="supplier-dashboard-main">
        <header className="supplier-dashboard-header">
          <h1>Welcome</h1>
          <div className="supplier-dashboard-account">
            <div className="supplier-company-pill">
              <span className="supplier-company-initials">TB</span>
              <span>Tiger Brands Ltd</span>
            </div>
            <span className="supplier-user-avatar" aria-label="Supplier account">NM</span>
          </div>
        </header>

        <p className="supplier-registration-notice" role="status">
          {applicationSubmitted
            ? "Your application is pending approval. You will be notified when it is approved."
            : "Your company is not registered yet. You cannot see demand requests until it is approved."}
        </p>

        <section className="supplier-register-card" aria-labelledby="supplier-register-title">
          {applicationSubmitted ? (
            <>
              <h2 id="supplier-register-title">Application submitted</h2>
              <p className="supplier-register-description">
                {verifiedCompany.name} is awaiting approval from IIK. You can see demand requests and send
                quotations after approval.
              </p>
              <span className="supplier-application-pending-badge">Pending approval</span>
            </>
          ) : (
            <>
              <h2 id="supplier-register-title">Register your company</h2>
              <p className="supplier-register-description">
                Before you can see demand requests and send quotations, register your company using its CIPC
                registration number.
              </p>

              <ol className="supplier-registration-steps">
                {REGISTRATION_STEPS.map((step, index) => (
                  <li key={step}>
                    <span className="supplier-step-number" aria-hidden="true">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              <button
                type="button"
                className="supplier-register-button"
                onClick={() => setShowVerification(true)}
              >
                Register your company
              </button>
            </>
          )}
        </section>
      </main>}

      {showVerification && (
        <div className="supplier-modal-overlay">
          <section
            className={`supplier-verification-modal${showCompanyDetails || showApplicationReview ? " supplier-company-details-modal" : ""}${applicationSubmitted ? " supplier-application-success-modal" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-verification-title"
          >
            {!applicationSubmitted && (
              <>
                <div
                  className="supplier-registration-progress"
                  aria-label={`Step ${showApplicationReview ? 4 : showCompanyDetails ? 3 : verifiedCompany ? 2 : 1} of 4`}
                >
                  {REGISTRATION_STEPS.map((step, index) => (
                    <span
                      key={step}
                      className={index < (showApplicationReview ? 4 : showCompanyDetails ? 3 : verifiedCompany ? 2 : 1) ? "active" : ""}
                      aria-hidden="true"
                    />
                  ))}
                </div>

                <div className="supplier-verification-step-label">
                  {showApplicationReview
                    ? "STEP 4 OF 4 · FINAL CHECK"
                    : showCompanyDetails
                    ? "STEP 3 OF 4 · COMPANY DETAILS"
                    : verifiedCompany
                    ? "STEP 2 OF 4 · COMPANY INFORMATION"
                    : "STEP 1 OF 4 · VERIFY YOUR COMPANY"}
                </div>
              </>
            )}

            <header className="supplier-verification-header">
              <h2 id="supplier-verification-title">
                {applicationSubmitted
                  ? "Application submitted"
                  : showApplicationReview
                  ? "Review your application"
                  : showCompanyDetails
                  ? "Company details"
                  : verifiedCompany
                  ? "Company information"
                  : "Verify your company"}
              </h2>
              <button
                type="button"
                className="supplier-verification-close"
                onClick={closeVerification}
                aria-label="Close verification"
              >
                ×
              </button>
            </header>

            {applicationSubmitted ? (
              <div className="supplier-application-success" role="status">
                <p>
                  {verifiedCompany.name} has been sent to IIK for review. You will get a notification when it is
                  approved. After that you can see demand requests and send quotations.
                </p>
                <span className="supplier-application-pending-badge">Pending approval</span>
                <button
                  type="button"
                  className="supplier-verify-button supplier-success-account-button"
                  onClick={() => {
                    setApplicationApproved(true);
                    closeVerification();
                  }}
                >
                  Back to my account
                </button>
              </div>
            ) : isCheckingCipc ? (
              <>
                <div className="supplier-cipc-checking">
                  <span className="supplier-cipc-spinner" role="status" aria-label="Checking CIPC" />
                  <p>Looking up {cipcNumber.trim()}. This takes a few seconds.</p>
                </div>
                <button
                  type="button"
                  className="supplier-checking-cancel"
                  onClick={closeVerification}
                >
                  Cancel
                </button>
              </>
            ) : showApplicationReview ? (
              <div className="supplier-application-review">
                <p className="supplier-verification-description">Check everything before you submit.</p>

                <div className="supplier-review-grid">
                  <section className="supplier-review-card">
                    <h3>Business registration</h3>
                    <dl className="supplier-review-details">
                      <div><dt>Application type</dt><dd>Supplier</dd></div>
                      <div><dt>CIPC number</dt><dd>{verifiedCompany.registrationNumber}</dd></div>
                    </dl>
                  </section>

                  <section className="supplier-review-card">
                    <h3>CIPC verification</h3>
                    <p className="supplier-review-caption">Read-only. Not account approval</p>
                    <dl className="supplier-review-details">
                      <div><dt>Registered name</dt><dd>{verifiedCompany.name}</dd></div>
                      <div><dt>Company type</dt><dd>{verifiedCompany.type}</dd></div>
                      <div><dt>Registration date</dt><dd>{verifiedCompany.registrationDate}</dd></div>
                      <div><dt>Status</dt><dd>{verifiedCompany.status}</dd></div>
                    </dl>
                  </section>

                  <section className="supplier-review-card">
                    <h3>Company profile</h3>
                    <p className="supplier-review-caption">Provided by you</p>
                    <div className="supplier-review-logo-row">
                      <span className="supplier-review-logo">{companyInitials}</span>
                      <div>
                        <label className="supplier-logo-upload">
                          Upload logo
                          <input
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                          />
                        </label>
                        <span className="supplier-logo-hint">
                          {logoFile ? logoFile.name : "Logo not uploaded: initials will show"}
                        </span>
                      </div>
                    </div>
                    <dl className="supplier-review-details">
                      <div><dt>Categories</dt><dd>{selectedCategories.join(", ")}</dd></div>
                      <div><dt>Delivery areas</dt><dd>{deliveryAreas.join(", ")}</dd></div>
                    </dl>
                  </section>

                  <section className="supplier-review-card">
                    <h3>Contact information</h3>
                    <p className="supplier-review-caption">Provided by you</p>
                    <dl className="supplier-review-details">
                      <div><dt>Contact person</dt><dd>{contactPerson}</dd></div>
                      <div><dt>Email</dt><dd>{contactEmail}</dd></div>
                      <div><dt>Mobile</dt><dd>{contactMobile}</dd></div>
                      <div><dt>Website</dt><dd>{website || "Not provided"}</dd></div>
                    </dl>
                  </section>

                  <section className="supplier-review-card supplier-review-address-card">
                    <h3>Address information</h3>
                    <p className="supplier-review-caption">Registered address from CIPC, the rest from you</p>
                    <dl className="supplier-review-details">
                      <div><dt>Registered address</dt><dd>{verifiedCompany.registeredAddress}</dd></div>
                      <div>
                        <dt>Business address</dt>
                        <dd>{sameRegisteredAddress ? "Same as registered address" : businessAddress}</dd>
                      </div>
                      <div><dt>Postal address</dt><dd>{postalAddress || "Not provided"}</dd></div>
                    </dl>
                  </section>
                </div>

                <button
                  type="button"
                  className="supplier-edit-details-button"
                  onClick={() => setShowApplicationReview(false)}
                >
                  Edit company details
                </button>

                <label className="supplier-review-confirmation">
                  <input
                    type="checkbox"
                    checked={acceptedSupplierTerms}
                    onChange={(event) => setAcceptedSupplierTerms(event.target.checked)}
                  />
                  <span>I accept the platform’s terms for suppliers.</span>
                </label>
                <label className="supplier-review-confirmation">
                  <input
                    type="checkbox"
                    checked={confirmedApplicationDetails}
                    onChange={(event) => setConfirmedApplicationDetails(event.target.checked)}
                  />
                  <span>
                    I confirm that the information is correct and that I am allowed to apply for this company.
                  </span>
                </label>

                <div className="supplier-verification-actions">
                  <button
                    type="button"
                    className="supplier-verify-button"
                    disabled={!acceptedSupplierTerms || !confirmedApplicationDetails}
                    onClick={() => {
                      setApplicationSubmitted(true);
                      setShowApplicationReview(false);
                      setShowCompanyDetails(false);
                    }}
                  >
                    Submit application
                  </button>
                  <button
                    type="button"
                    className="supplier-cancel-button"
                    onClick={() => setShowApplicationReview(false)}
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : showCompanyDetails ? (
              <>
                <p className="supplier-verification-description">
                  You fill in these details. They are kept separate from the read-only CIPC information.
                  Fields marked * are required.
                </p>

                <form
                  className="supplier-company-details-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setShowApplicationReview(true);
                  }}
                >
                  <div className="supplier-logo-row">
                    <div className="supplier-logo-placeholder">
                      {logoFile ? logoFile.name.slice(0, 8) : "Logo"}
                    </div>
                    <div>
                      <label className="supplier-logo-upload">
                        Upload logo
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                        />
                      </label>
                      <span className="supplier-logo-hint">Company logo. PNG or JPG. Optional.</span>
                    </div>
                  </div>

                  <div className="supplier-details-grid">
                    <label className="supplier-details-field">
                      Contact person *
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={(event) => setContactPerson(event.target.value)}
                        required
                      />
                    </label>
                    <label className="supplier-details-field">
                      Contact mobile number *
                      <input
                        type="tel"
                        value={contactMobile}
                        onChange={(event) => setContactMobile(event.target.value)}
                        required
                      />
                    </label>
                    <label className="supplier-details-field">
                      Contact email address *
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(event) => setContactEmail(event.target.value)}
                        required
                      />
                    </label>
                    <label className="supplier-details-field">
                      Website (optional)
                      <input
                        type="url"
                        value={website}
                        onChange={(event) => setWebsite(event.target.value)}
                        placeholder="https://example.co.za"
                      />
                    </label>
                  </div>

                  <fieldset className="supplier-detail-group">
                    <legend>Product categories *</legend>
                    <div className="supplier-category-chips">
                      {PRODUCT_CATEGORIES.map((category) => (
                        <button
                          key={category}
                          type="button"
                          className={`supplier-option-chip${selectedCategories.includes(category) ? " selected" : ""}`}
                          aria-pressed={selectedCategories.includes(category)}
                          onClick={() => toggleProductCategory(category)}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="supplier-detail-group">
                    <legend>Delivery areas *</legend>
                    <div className="supplier-delivery-area-list">
                      {deliveryAreas.map((area) => (
                        <button
                          key={area}
                          type="button"
                          className="supplier-option-chip selected"
                          onClick={() => setDeliveryAreas((current) => current.filter((entry) => entry !== area))}
                          aria-label={`Remove ${area}`}
                        >
                          {area}
                        </button>
                      ))}
                      {showAddArea ? (
                        <span className="supplier-add-area">
                          <input
                            type="text"
                            value={newDeliveryArea}
                            onChange={(event) => setNewDeliveryArea(event.target.value)}
                            aria-label="New delivery area"
                            autoFocus
                          />
                          <button type="button" className="supplier-add-area-button" onClick={addDeliveryArea}>
                            Add
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="supplier-option-chip"
                          onClick={() => setShowAddArea(true)}
                        >
                          Add area
                        </button>
                      )}
                    </div>
                  </fieldset>

                  <div className="supplier-same-address">
                    <input
                      id="supplier-same-address"
                      type="checkbox"
                      checked={sameRegisteredAddress}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setSameRegisteredAddress(checked);
                        setBusinessAddress(checked ? verifiedCompany.registeredAddress : "");
                      }}
                    />
                    <label htmlFor="supplier-same-address">
                      Business address is the same as the company’s registered address
                    </label>
                  </div>

                  <label className="supplier-details-field supplier-business-address">
                    Business address *
                    <textarea
                      rows="3"
                      value={businessAddress}
                      onChange={(event) => setBusinessAddress(event.target.value)}
                      readOnly={sameRegisteredAddress}
                      required
                    />
                  </label>

                  <div className="supplier-details-grid supplier-address-row">
                    <label className="supplier-details-field">
                      Postal address
                      <input
                        type="text"
                        value={postalAddress}
                        onChange={(event) => setPostalAddress(event.target.value)}
                      />
                    </label>
                    <label className="supplier-details-field">
                      Province *
                      <select value={province} onChange={(event) => setProvince(event.target.value)} required>
                        {SUPPLIER_PROVINCES.map((provinceName) => (
                          <option key={provinceName}>{provinceName}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="supplier-verification-actions">
                    <button
                      type="submit"
                      className="supplier-verify-button"
                      disabled={!canReviewApplication}
                    >
                      Review application
                    </button>
                    <button
                      type="button"
                      className="supplier-cancel-button"
                      onClick={() => setShowCompanyDetails(false)}
                    >
                      Back
                    </button>
                  </div>
                </form>
              </>
            ) : verifiedCompany ? (
              <>
                <span className="supplier-cipc-readonly">From CIPC · read-only</span>
                <p className="supplier-verification-description">
                  These details come from the CIPC lookup. You cannot change them here.
                </p>
                <dl className="supplier-cipc-details">
                  <div>
                    <dt>Registration number</dt>
                    <dd>{verifiedCompany.registrationNumber}</dd>
                  </div>
                  <div>
                    <dt>Registered company name</dt>
                    <dd>{verifiedCompany.name}</dd>
                  </div>
                  <div>
                    <dt>Company type</dt>
                    <dd>{verifiedCompany.type}</dd>
                  </div>
                  <div>
                    <dt>Registration date</dt>
                    <dd>{verifiedCompany.registrationDate}</dd>
                  </div>
                  <div>
                    <dt>Company status</dt>
                    <dd>{verifiedCompany.status}</dd>
                  </div>
                  <div>
                    <dt>Registered address</dt>
                    <dd>{verifiedCompany.registeredAddress}</dd>
                  </div>
                </dl>
                <p className="supplier-cipc-demo-note">
                  Checking your number does not approve your company. IIK reviews every application.
                </p>
                <div className="supplier-verification-actions">
                  <button
                    type="button"
                    className="supplier-verify-button"
                    onClick={() => setShowCompanyDetails(true)}
                  >
                    Continue to company details
                  </button>
                  <button
                    type="button"
                    className="supplier-cancel-button"
                    onClick={() => {
                      setVerifiedCompany(null);
                      setVerificationError("");
                    }}
                  >
                    Back
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="supplier-verification-description">
                  Enter the CIPC registration number of your company. We check it against CIPC records before
                  you add your details.
                </p>

                <form onSubmit={handleVerifyCompany}>
                  <label className="supplier-cipc-label" htmlFor="supplier-cipc-number">
                    CIPC registration number *
                  </label>
                  <input
                    id="supplier-cipc-number"
                    className="supplier-cipc-input"
                    type="text"
                    value={cipcNumber}
                    onChange={(event) => {
                      setCipcNumber(event.target.value);
                      setVerificationError("");
                    }}
                    placeholder="2012/123456/07"
                    aria-describedby={verificationError ? "supplier-cipc-error" : "supplier-cipc-format"}
                    required
                  />
                  <span id="supplier-cipc-format" className="supplier-cipc-format">
                    Format: YYYY/NNNNNN/NN. Example: 2024/123456/07
                  </span>
                  {verificationError && (
                    <p id="supplier-cipc-error" className="supplier-verification-error" role="alert">
                      {verificationError}
                    </p>
                  )}

                  <div className="supplier-verification-actions">
                    <button type="submit" className="supplier-verify-button">Verify company</button>
                    <button type="button" className="supplier-cancel-button" onClick={closeVerification}>
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default SupplierDashboard;