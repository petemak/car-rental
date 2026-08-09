/**
 * Local fixture data used ONLY as a fallback when a real fetch to the API
 * defined in api-contract.md fails (see js/config.js MOCK_FALLBACK).
 * Shapes mirror the contract exactly so swapping to a live backend
 * requires no frontend changes.
 */
window.MOCK_DB = (function () {
  const categories = [
    { id: "cat_city", name: "City Car", description: "Compact and easy to park.", icon: "city" },
    { id: "cat_sedan", name: "Sedan", description: "Comfortable for road trips between towns.", icon: "sedan" },
    { id: "cat_suv", name: "SUV", description: "More room, comfortable on longer routes.", icon: "suv" },
    { id: "cat_offroad", name: "Off-Road", description: "Built for national park terrain.", icon: "offroad" },
  ];

  const locations = [
    { id: "loc_kgl_airport", name: "Kigali International Airport (KGL)", type: "airport", address: "Kanombe, Kigali" },
    { id: "loc_city_office", name: "Rwanda Roadways City Office", type: "city_office", address: "KN 4 Ave, Kigali" },
    { id: "loc_musanze", name: "Musanze (Volcanoes NP gateway)", type: "city_office", address: "Musanze Town" },
  ];

  const vehicles = [
    {
      id: "veh_101",
      name: "Toyota Land Cruiser Prado",
      category: { id: "cat_offroad", name: "Off-Road" },
      seats: 7,
      transmission: "automatic",
      fuel_type: "diesel",
      price_per_day: "180.00",
      currency: "USD",
      thumbnail_url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80",
      photos: [
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80",
        "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80",
        "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=80",
      ],
      available: true,
      chauffeur_available: true,
      airport_pickup_available: true,
      rating_avg: 4.8,
      rating_count: 37,
      features: ["4x4", "Air conditioning", "Bluetooth", "Roof rack"],
      specs: { doors: 5, luggage_capacity_l: 500, air_conditioning: true, off_road_capable: true },
      policies: {
        mileage_limit_km_per_day: 250,
        fuel_policy: "full-to-full",
        min_driver_age: 23,
        license_requirement: "Valid driver's license or IDP, held 2+ years",
        security_deposit_amount: "300.00",
        currency: "USD",
        cancellation_policy_summary: "Full refund up to 72h before pickup.",
      },
      availability_blocked_ranges: [{ start_date: "2026-09-01", end_date: "2026-09-04" }],
    },
    {
      id: "veh_102",
      name: "Toyota RAV4",
      category: { id: "cat_suv", name: "SUV" },
      seats: 5,
      transmission: "automatic",
      fuel_type: "petrol",
      price_per_day: "95.00",
      currency: "USD",
      thumbnail_url: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80",
      photos: [
        "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80",
        "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=80",
      ],
      available: true,
      chauffeur_available: true,
      airport_pickup_available: true,
      rating_avg: 4.7,
      rating_count: 22,
      features: ["Air conditioning", "Bluetooth", "Backup camera"],
      specs: { doors: 5, luggage_capacity_l: 400, air_conditioning: true, off_road_capable: false },
      policies: {
        mileage_limit_km_per_day: 250,
        fuel_policy: "full-to-full",
        min_driver_age: 21,
        license_requirement: "Valid driver's license or IDP, held 1+ years",
        security_deposit_amount: "200.00",
        currency: "USD",
        cancellation_policy_summary: "Full refund up to 72h before pickup.",
      },
      availability_blocked_ranges: [],
    },
    {
      id: "veh_103",
      name: "Toyota Corolla",
      category: { id: "cat_sedan", name: "Sedan" },
      seats: 5,
      transmission: "automatic",
      fuel_type: "petrol",
      price_per_day: "60.00",
      currency: "USD",
      thumbnail_url: "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80",
      photos: ["https://images.unsplash.com/photo-1550355291-bbee04a92027?w=1200&q=80"],
      available: true,
      chauffeur_available: false,
      airport_pickup_available: true,
      rating_avg: 4.6,
      rating_count: 18,
      features: ["Air conditioning", "Bluetooth"],
      specs: { doors: 4, luggage_capacity_l: 350, air_conditioning: true, off_road_capable: false },
      policies: {
        mileage_limit_km_per_day: 200,
        fuel_policy: "full-to-full",
        min_driver_age: 21,
        license_requirement: "Valid driver's license or IDP, held 1+ years",
        security_deposit_amount: "150.00",
        currency: "USD",
        cancellation_policy_summary: "Full refund up to 72h before pickup.",
      },
      availability_blocked_ranges: [],
    },
    {
      id: "veh_104",
      name: "Toyota Aygo",
      category: { id: "cat_city", name: "City Car" },
      seats: 4,
      transmission: "manual",
      fuel_type: "petrol",
      price_per_day: "35.00",
      currency: "USD",
      thumbnail_url: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80",
      photos: ["https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200&q=80"],
      available: true,
      chauffeur_available: false,
      airport_pickup_available: true,
      rating_avg: 4.5,
      rating_count: 14,
      features: ["Air conditioning", "Compact parking"],
      specs: { doors: 4, luggage_capacity_l: 168, air_conditioning: true, off_road_capable: false },
      policies: {
        mileage_limit_km_per_day: 180,
        fuel_policy: "full-to-full",
        min_driver_age: 21,
        license_requirement: "Valid driver's license or IDP, held 1+ years",
        security_deposit_amount: "120.00",
        currency: "USD",
        cancellation_policy_summary: "Full refund up to 72h before pickup.",
      },
      availability_blocked_ranges: [],
    },
    {
      id: "veh_105",
      name: "Toyota Land Cruiser 76 (Hardtop)",
      category: { id: "cat_offroad", name: "Off-Road" },
      seats: 5,
      transmission: "manual",
      fuel_type: "diesel",
      price_per_day: "165.00",
      currency: "USD",
      thumbnail_url: "https://images.unsplash.com/photo-1571607388263-1044f9ea01dd?w=800&q=80",
      photos: ["https://images.unsplash.com/photo-1571607388263-1044f9ea01dd?w=1200&q=80"],
      available: true,
      chauffeur_available: true,
      airport_pickup_available: true,
      rating_avg: 4.9,
      rating_count: 11,
      features: ["4x4", "Roof rack", "Snorkel"],
      specs: { doors: 3, luggage_capacity_l: 600, air_conditioning: true, off_road_capable: true },
      policies: {
        mileage_limit_km_per_day: 250,
        fuel_policy: "full-to-full",
        min_driver_age: 25,
        license_requirement: "Valid driver's license or IDP, held 3+ years",
        security_deposit_amount: "350.00",
        currency: "USD",
        cancellation_policy_summary: "Full refund up to 72h before pickup.",
      },
      availability_blocked_ranges: [],
    },
    {
      id: "veh_106",
      name: "Nissan X-Trail",
      category: { id: "cat_suv", name: "SUV" },
      seats: 5,
      transmission: "automatic",
      fuel_type: "petrol",
      price_per_day: "88.00",
      currency: "USD",
      thumbnail_url: "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=800&q=80",
      photos: ["https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=1200&q=80"],
      available: true,
      chauffeur_available: true,
      airport_pickup_available: true,
      rating_avg: 4.4,
      rating_count: 9,
      features: ["Air conditioning", "Bluetooth"],
      specs: { doors: 5, luggage_capacity_l: 410, air_conditioning: true, off_road_capable: false },
      policies: {
        mileage_limit_km_per_day: 250,
        fuel_policy: "full-to-full",
        min_driver_age: 21,
        license_requirement: "Valid driver's license or IDP, held 1+ years",
        security_deposit_amount: "200.00",
        currency: "USD",
        cancellation_policy_summary: "Full refund up to 72h before pickup.",
      },
      availability_blocked_ranges: [],
    },
  ];

  const reviews = [
    { id: "rev_1", customer_name: "Mark T.", country: "United Kingdom", rating: 5, comment: "Land Cruiser was spotless, driver was excellent and knew every stop along the way to Musanze.", vehicle_name: "Toyota Land Cruiser Prado", created_at: "2026-06-02T09:00:00Z" },
    { id: "rev_2", customer_name: "Anke V.", country: "Netherlands", rating: 5, comment: "Self-drive was easy, the RAV4 was clean and the airport pickup meant we didn't have to think about a thing after a long flight.", vehicle_name: "Toyota RAV4", created_at: "2026-05-18T09:00:00Z" },
    { id: "rev_3", customer_name: "Daniel O.", country: "United States", rating: 4, comment: "Great value, transparent pricing, no surprise fees. Would book again for our next Rwanda trip.", vehicle_name: "Toyota Corolla", created_at: "2026-04-27T09:00:00Z" },
    { id: "rev_4", customer_name: "Chiara B.", country: "Italy", rating: 5, comment: "The chauffeur made the Nyungwe route stress-free — punctual, careful driving, and a great local guide.", vehicle_name: "Toyota Land Cruiser 76 (Hardtop)", created_at: "2026-03-14T09:00:00Z" },
    { id: "rev_5", customer_name: "Grace N.", country: "Canada", rating: 5, comment: "Booked the Aygo for a few city days before our safari — perfect little car and easy to park anywhere in Kigali.", vehicle_name: "Toyota Aygo", created_at: "2026-02-20T09:00:00Z" },
    { id: "rev_6", customer_name: "Peter M.", country: "South Africa", rating: 4, comment: "Solid fleet condition and responsive WhatsApp support when our flight was delayed.", vehicle_name: "Nissan X-Trail", created_at: "2026-01-30T09:00:00Z" },
  ];

  const destinations = [
    { id: "dest_1", title: "Self-Driving to Volcanoes National Park", slug: "volcanoes-national-park", thumbnail_url: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=900&q=80", excerpt: "Gorilla trekking gateway — what to expect on the Musanze road and which vehicle suits it best.", hero_image_url: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&q=80", body_html: "<p>The drive from Kigali to Volcanoes National Park takes roughly two to three hours on well-maintained tarmac, with a short stretch of rougher road near the park gate.</p><p>Most travelers are comfortable in an SUV, though our Land Cruiser range gives extra ground clearance for the final approach roads in wet season.</p>", suggested_category: { id: "cat_suv", name: "SUV" } },
    { id: "dest_2", title: "Airport to Lake Kivu: What to Expect", slug: "airport-to-lake-kivu", thumbnail_url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=900&q=80", excerpt: "A relaxed lakeside add-on to your trip — road conditions, drive time, and pickup logistics from KGL.", hero_image_url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80", body_html: "<p>Lake Kivu is roughly a 3-3.5 hour drive from Kigali International Airport via Rubavu or Karongi, on paved roads throughout.</p><p>Both self-drive and chauffeur service are popular for this route — a sedan is perfectly comfortable if you're going via the main highway.</p>", suggested_category: { id: "cat_sedan", name: "Sedan" } },
    { id: "dest_3", title: "Exploring Nyungwe Forest by Road", slug: "nyungwe-forest-by-road", thumbnail_url: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=900&q=80", excerpt: "Canopy walks and chimp tracking — the drive south, and why we recommend a chauffeur for this one.", hero_image_url: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1600&q=80", body_html: "<p>Nyungwe is Rwanda's furthest major park from Kigali (around 5-6 hours), with winding mountain roads for the final stretch.</p><p>We recommend our chauffeur service for this route so you can enjoy the scenery rather than the switchbacks.</p>", suggested_category: { id: "cat_offroad", name: "Off-Road" } },
  ];

  const faqs = [
    { group: "Booking", q: "How far in advance should I book?", a: "We recommend booking at least 2-3 weeks before arrival, especially during peak gorilla trekking season (June-September, December-February), though we can often accommodate shorter notice." },
    { group: "Booking", q: "Do I need to pay the full amount upfront?", a: "It depends on our current payment settings — many bookings use a deposit now, balance on arrival model. The exact split is always shown in your price breakdown before you pay." },
    { group: "Payment", q: "What payment methods do you accept?", a: "We accept major credit and debit cards online. Additional methods may be available — you'll see all current options at checkout." },
    { group: "Payment", q: "Is the security deposit refundable?", a: "Yes. The security deposit is held (not charged) and released after the vehicle is returned in its original condition, per the policy shown on each vehicle's page." },
    { group: "On the Road", q: "Can I self-drive, or do I need a chauffeur?", a: "Both are available on most vehicles. Self-drive requires a valid license or International Driving Permit held for the minimum period shown on the vehicle. First-time visitors unfamiliar with Rwandan roads often prefer chauffeur service, especially for mountain routes." },
    { group: "On the Road", q: "What is the mileage policy?", a: "Each vehicle lists a daily mileage allowance on its detail page (typically 180-250 km/day). Additional mileage can be arranged for an extra fee." },
    { group: "Chauffeur & Airport Pickup", q: "How does airport pickup work?", a: "Provide your flight number at checkout and your driver will track your flight and meet you at Kigali International Airport arrivals." },
    { group: "Cancellation", q: "What is your cancellation policy?", a: "Full details are on our Cancellation & Refund Policy page — in general, full refunds are available up to 72 hours before pickup, with prorated refunds closer to the date." },
  ];

  const settings = {
    business_name: "Rwanda Roadways",
    contact_email: "hello@rwandaroadways.com",
    contact_phone: "+250 788 000 000",
    whatsapp_number: "+250 788 000 000",
    office_address: "KN 4 Ave, Kigali, Rwanda",
    notification_templates: {
      booking_confirmed: "Your booking {{reference}} is confirmed!",
      booking_reminder: "Your pickup is in 48 hours.",
      booking_cancelled: "Your booking {{reference}} has been cancelled.",
    },
    payment_provider: { provider: "stripe", public_key: "pk_test_mock" },
  };

  const pricingSettings = {
    payment_model: "deposit",
    deposit_percentage: 30,
    currency_default: "USD",
    extras: {
      chauffeur_fee_per_day: "50.00",
      airport_pickup_fee: "40.00",
      additional_driver_fee: "15.00",
      child_seat_fee: "5.00",
    },
  };

  const bookings = [
    {
      id: "bk_9001",
      reference: "RR-9001",
      status: "confirmed",
      vehicle: { id: "veh_101", name: "Toyota Land Cruiser Prado", thumbnail_url: vehicles[0].thumbnail_url },
      pickup_date: "2026-09-10",
      pickup_time: "10:00",
      return_date: "2026-09-15",
      return_time: "10:00",
      pickup_location: locations[0],
      dropoff_location: locations[0],
      service_type: "chauffeur",
      airport_pickup: true,
      flight_number: "KQ123",
      chauffeur_assigned: null,
      customer: { first_name: "Jane", last_name: "Doe", email: "jane@example.com", phone: "+1 555 010 2000" },
      price_breakdown: {
        base_rate_per_day: "180.00",
        days: 5,
        subtotal: "900.00",
        chauffeur_fee: "250.00",
        airport_pickup_fee: "40.00",
        taxes_fees: "60.75",
        total: "1275.75",
        currency: "USD",
        payment_model: "deposit",
        deposit_due: "382.73",
        balance_due: "893.02",
      },
      payment_status: "paid",
      created_at: "2026-08-01T12:04:00Z",
    },
  ];

  const customers = [
    { id: "cust_1", first_name: "Jane", last_name: "Doe", email: "jane@example.com", phone: "+1 555 010 2000", bookings_count: 1, last_booking_date: "2026-08-01" },
    { id: "cust_2", first_name: "Mark", last_name: "Taylor", email: "mark.t@example.com", phone: "+44 7700 900123", bookings_count: 3, last_booking_date: "2026-06-02" },
  ];

  const adminUsers = [
    { id: "adm_1", name: "Alice Uwase", email: "alice@rwandaroadways.com", role: "super_admin" },
    { id: "adm_2", name: "Eric Habimana", email: "eric@rwandaroadways.com", role: "booking_staff" },
  ];

  // This is a multi-page app with no shared backend process, so an
  // in-memory mock mutation (e.g. a booking created via the mock fallback
  // in js/api.js) would otherwise vanish the moment the browser navigates
  // to a new HTML page (booking.html -> booking-confirmation.html). To
  // keep the mock fallback usable across that real full-page navigation,
  // bookings created/updated through the mock path are also snapshotted
  // to localStorage (see js/api.js persistMockBookings()) and merged back
  // in here on load. This has no bearing on the real API integration —
  // it only exists to make the local demo/dev experience coherent.
  try {
    const stored = window.localStorage.getItem("rr_mock_bookings_snapshot");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length) {
        bookings.length = 0;
        bookings.push(...parsed);
      }
    }
  } catch (e) {
    /* ignore corrupt snapshot */
  }

  return { categories, locations, vehicles, reviews, destinations, faqs, settings, pricingSettings, bookings, customers, adminUsers };
})();
