# Interface Context

## Product and user

This project recreates the core browsing flow of a vacation-rental marketplace. The user is a traveler comparing places to stay. They want to discover destinations, narrow the available homes, compare price and rating, inspect a specific room, and choose how many guests will stay before reserving.

## Pages

- **Home (`/`)** — A welcoming discovery page with a brand/search header, horizontal stay categories, and a responsive collection of rental cards. Search text and the active category filter the visible cards immediately.
- **Catalog (`/catalog`)** — A focused results view with the same reusable cards, result count, price sorting, and a map placeholder. On mobile the map follows the results; on desktop it sits beside them.
- **Room detail (`/rooms/[id]`)** — A detailed rental view loaded from the URL id. It includes a navigable photo gallery, title/rating/location summary, host information, amenities, and a booking card with guest controls.

## Screenshot-derived component specification

The supplied screenshots describe the assignment requirements rather than a literal visual mockup, so this specification combines those constraints with the familiar Airbnb information hierarchy:

- `TopNavigation`: brand link, controlled search input, Catalog link, and compact user menu. Props: `search`, `onSearchChange`, and optional compact mode.
- `CategoryFilter`: horizontally scrollable buttons with icon and label. Props: category list, active value, and selection callback.
- `ListingGrid`: responsive one-column/mobile and multi-column/desktop layout. Props: listing array.
- `ListingCard`: reusable linked card containing a photo treatment, favorite control, location, short descriptor, nightly price, and rating. Props: one `Listing`.
- `LoadingState`: visible status while simulated data loading completes.
- `ResultsHeader`: result count plus controlled ascending/descending price sort. Props: count, order, and change callback.
- `MapPlaceholder`: styled geographic panel that changes placement at the desktop breakpoint.
- `PhotoGallery`: current image with previous/next controls and an image counter. Props: photo array and title.
- `ListingHeader`, `HostInfo`, and `AmenitiesGrid`: focused room-information sections.
- `BookingCard`: nightly price, guest decrement/increment controls with limits, and reserve call to action.

All internal route changes use Next.js `Link`, preserving client-side navigation. Layouts start at a 375px viewport and expand at 768px.
