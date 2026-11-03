# Gurukripa REST API & Contract Specification

This document details the production REST API endpoints shared between the Web platform and Android application.

Specification Version: OpenAPI 3.1.0 (`packages/api-contracts/src/openapi.json`)

---

## Endpoints

### 1. Products Catalog
* **Endpoint:** `GET /api/v1/products`
* **Description:** Retrieves the verified catalog of 8 brick products, piece rates, and trolley pricing.
* **Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Shiv Eent Grade-A",
    "category": "shiv-eent",
    "price": 12,
    "oldPrice": 14,
    "unit": "per piece",
    "desc": "Ultra-premium Grade-A brick with double-fired durability.",
    "rating": 5,
    "reviews": 89,
    "stock": "in-stock",
    "features": ["Double-fired process", "Weather resistant", "ISI certified"]
  }
]
```

### 2. 3-in-1 Estimator
* **Endpoint:** `POST /api/v1/calculator/estimate`
* **Description:** Calculates required bricks, trolleys (4,000 pcs/trolley), cement bags, sand volume, and budget.
* **Request:**
```json
{
  "type": "wall",
  "lengthFt": 20,
  "heightFt": 10,
  "thicknessInches": 9,
  "unitPrice": 12
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "bricksNeeded": 3440,
    "trolleysCount": 0.9,
    "cementBags": 25,
    "sandCuFt": 1204,
    "totalEstimatedCost": 41280,
    "breakageMarginPct": 5
  }
}
```

### 3. Customer Enquiry Submission
* **Endpoint:** `POST /api/v1/enquiry`
* **Request:**
```json
{
  "fullName": "Rajesh Kumar",
  "phone": "9198923230",
  "brickType": "Shiv Eent Grade-A",
  "quantity": 4000,
  "deliveryLocation": "Jaunpur",
  "pincode": "222001"
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Enquiry registered. Kiln dispatch desk will respond within 30 minutes."
}
```

### 4. Trolley Order Tracking
* **Endpoint:** `GET /api/v1/orders/{orderId}/track`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orderId": "GK-1001",
    "status": "Trolley Loaded — En Route to Site",
    "carrier": "Ramesh Transport Co.",
    "trolleyNumber": "UP62-T-4421"
  }
}
```
