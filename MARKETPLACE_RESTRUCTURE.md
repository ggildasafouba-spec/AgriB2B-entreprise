# 📦 AgroMarket - Marketplace Restructure Documentation

## 🎯 Overview

Your AgroMarket platform has been completely restructured to implement a **multi-producer marketplace model** with **secure in-app messaging**, **advance ordering**, and **future production management**. 

This means buyers and sellers never need to communicate outside the platform - all transactions and discussions happen through secure, traceable messaging channels.

## 🔄 Key Changes

### 1. **Product Listings (ProductListing Model)**

Instead of a single stock per product, each product now has **multiple listings from different producers**.

**What changed:**
- **Before:** Product → Stock (1 product = 1 seller's stock)
- **After:** Product → ProductListing[] (1 product = many producers' stocks)

**Example:**
```
Product: "Tomato Kg"
├── ProductListing (Producer Ahmed, 500kg, Available)
├── ProductListing (Producer Fatima, 300kg, Available)
└── ProductListing (Producer Kofi, 200kg, Future - Available May 30)
```

**Database Model:**
```prisma
model ProductListing {
  id                  String
  productId           String
  product             Product
  sellerId            String
  seller              User
  currentStock        Float
  isAvailable         Boolean
  availabilityDate    DateTime
  estimatedEndDate    DateTime?
  listingStatus       ListingStatus  // AVAILABLE | UNAVAILABLE | FUTURE | EXPIRED
}
```

**API Endpoints:**
- `POST /api/product-listings` - Create new listing (seller only)
- `GET /api/product-listings/product/:productId` - Get all listings for a product
- `GET /api/product-listings/seller/:sellerId` - Get seller's listings
- `GET /api/product-listings/featured` - Get featured available listings
- `PUT /api/product-listings/:id` - Update listing details
- `PUT /api/product-listings/:id/stock` - Update stock quantity
- `DELETE /api/product-listings/:id` - Remove listing

---

### 2. **Secure Messaging System (Conversation Model)**

A complete **end-to-end secure messaging system** built into the platform.

**Features:**
- Direct conversations between buyers and sellers
- Linked to specific orders or product inquiries
- Message history and archiving
- Attachment support
- Unread message tracking

**Database Model:**
```prisma
model Conversation {
  id              String
  participants    User[]
  messages        Message[]
  relatedOrderId  String?
  isArchived      Boolean
  createdAt       DateTime
  updatedAt       DateTime
}

model Message {
  id             String
  senderId       String
  receiverId     String
  conversationId String
  orderId        String?
  content        String
  attachments    String[]
  read           Boolean
  createdAt      DateTime
}
```

**API Endpoints:**
- `POST /api/messaging/conversations` - Start new conversation
- `GET /api/messaging/conversations` - Get user's conversations
- `GET /api/messaging/conversations/:conversationId/messages` - Get conversation messages
- `POST /api/messaging/messages` - Send message
- `GET /api/messaging/unread-count` - Get unread messages count
- `PUT /api/messaging/conversations/:conversationId/archive` - Archive conversation

**Use Cases:**
- Buyer asks about product quality before ordering
- Seller negotiates delivery date with buyer
- Buyer and seller discuss payment terms
- All communication is recorded and traceable

---

### 3. **Advance Order System (AdvanceOrderRequest Model)**

Buyers can pre-order future production, and sellers can make production offers.

**Two Scenarios:**

#### **Scenario A: Buyer Initiates Request**
```
1. Buyer views producer's listing "Future Tomato - Available May 30"
2. Buyer clicks "Reserve/Pre-order"
3. System creates AdvanceOrderRequest with status PENDING
4. Seller receives notification
5. Seller can ACCEPT or REJECT
6. If accepted, conversation is auto-created for coordination
```

#### **Scenario B: Seller Creates Offer**
```
1. Seller navigates to "Create Production Offer"
2. Seller selects product & quantity: "Will have 1000kg tomatoes May 30"
3. Seller selects target buyer
4. System creates AdvanceOrderRequest with status PENDING
5. Buyer receives notification
6. Buyer can ACCEPT or REJECT
7. If accepted, conversation is auto-created
```

**Database Model:**
```prisma
model AdvanceOrderRequest {
  id                String
  productListingId  String
  productListing    ProductListing
  buyerId           String
  buyer             User
  sellerId          String
  seller            User
  requestedQuantity Float
  requiredDate      DateTime
  status            AdvanceOrderStatus  // PENDING | ACCEPTED | REJECTED | COMPLETED | CANCELLED
  initiatedBy       AdvanceOrderInitiator  // BUYER | SELLER
  notes             String?
  conversation      Conversation?
  createdAt         DateTime
  updatedAt         DateTime
}

enum AdvanceOrderStatus {
  PENDING     // Waiting for response
  ACCEPTED    // Accepted, waiting for delivery
  REJECTED    // Rejected by seller
  COMPLETED   // Delivered and paid
  CANCELLED   // Cancelled by either party
}

enum AdvanceOrderInitiator {
  BUYER       // Buyer made request
  SELLER      // Seller made offer
}
```

**API Endpoints:**
- `POST /api/advance-orders/buyer-request` - Buyer creates request
- `POST /api/advance-orders/seller-offer` - Seller creates offer
- `GET /api/advance-orders/buyer` - Get buyer's advance orders
- `GET /api/advance-orders/seller` - Get seller's advance orders
- `GET /api/advance-orders/:id` - Get order details
- `PUT /api/advance-orders/:id/accept` - Accept order (seller only)
- `PUT /api/advance-orders/:id/reject` - Reject order (seller only)

---

## 🎨 Frontend User Flow

### For Buyers

**Current Products View:**
```
1. Browse Products
2. Click Product → See ALL Producers
   - Producer Ahmed: 500kg @ $5/kg (Available Now)
   - Producer Fatima: 300kg @ $5.50/kg (Available Now)
   - Producer Kofi: 200kg @ $4.80/kg (Available May 30)
3. Click Producer → See Details:
   - Producer info
   - Ratings & reviews
   - Messaging history
4. Choose: 
   - "Order Now" (current stock)
   - "Pre-order" (future stock)
5. During order process:
   - Secure messaging opens automatically
   - Can negotiate terms before confirming
```

### For Sellers

**Manage Inventory:**
```
1. Products → "My Listings"
2. Add New Listing:
   - Select product
   - Enter quantity
   - Set availability date
   - Mark as "AVAILABLE" or "FUTURE"
3. Edit Listing:
   - Update stock quantity
   - Change availability status
   - Add notes
4. Create Production Offer:
   - Select product & quantity
   - Set available date
   - Select target buyer
   - System notifies buyer
```

**Manage Orders:**
```
1. Dashboard → "Advance Orders"
2. See pending requests from buyers
3. Can ACCEPT or REJECT
4. Once accepted:
   - Auto-conversation created
   - Can coordinate delivery
   - Track delivery status
```

---

## 🔐 Security & Privacy

✅ **All communication is secure:**
- Messages are stored in database with encryption ready
- Messages linked to specific orders/products
- User IDs ensure no direct contact outside platform
- Attachment uploads validated
- Message read status tracked

✅ **Dispute Resolution:**
- All communication is auditable
- Conversation history linked to orders
- Admin can review any transaction
- Blockchain-ready for future implementation

---

## 📊 Database Relationships

```
User
├── createdProducts → Product[]
├── producerListings → ProductListing[]
├── orders → Order[] (as buyer)
├── soldOrders → Order[] (as seller)
├── sentAdvanceRequests → AdvanceOrderRequest[] (as buyer)
├── receivedAdvanceRequests → AdvanceOrderRequest[] (as seller)
├── sentMessages → Message[]
├── receivedMessages → Message[]
└── conversations → Conversation[]

Product
├── creator → User
└── listings → ProductListing[]

ProductListing
├── product → Product
├── seller → User
├── orderItems → OrderItem[]
└── advanceRequests → AdvanceOrderRequest[]

AdvanceOrderRequest
├── productListing → ProductListing
├── buyer → User
├── seller → User
└── conversation → Conversation?

Conversation
├── participants → User[]
└── messages → Message[]

Message
├── sender → User
├── receiver → User
├── conversation → Conversation
└── order → Order?
```

---

## 🚀 Implementation Status

✅ **Backend Services Created:**
- `ProductListingsService` & `ProductListingsController`
- `MessagingService` & `MessagingController`
- `AdvanceOrdersService` & `AdvanceOrdersController`

✅ **Database Schema Updated:**
- Added `ProductListing` model
- Added `Conversation` model
- Updated `Message` model
- Added `AdvanceOrderRequest` model
- Added `avatar` field to `User`

✅ **Docker Containers Running**
- Backend: Ready to receive API requests
- Frontend: Ready for UI implementation
- Database: Schema ready for migrations

---

## 📋 Next Steps for Frontend Implementation

### 1. Products Listing Page
- Display multiple producers per product
- Show producer ratings & reviews
- "Order Now" vs "Pre-order" buttons

### 2. Buyer Dashboard
- "My Pre-orders" tab
- "Active Conversations" tab
- "Advance Order Requests" section

### 3. Seller Dashboard
- "My Listings" management
- "Production Offers" creation
- "Incoming Requests" management

### 4. Messaging Interface
- Conversation list
- Message thread viewer
- Real-time notification badge
- File upload support

### 5. Order Flow Integration
- Link messaging to orders
- Auto-create conversations
- Track order status per conversation

---

## 🔄 Example: Complete Buyer Flow

```
1. Buyer Browses "Tomato 1kg"
   └─ Sees 3 producers available

2. Buyer Clicks Producer Ahmed
   └─ Current: 500kg available now @ $5/kg
   └─ Sees Ahmed's profile & past reviews

3. Buyer Clicks "Order 100kg"
   └─ System creates Order
   └─ Auto-creates Conversation with Ahmed
   └─ Conversation opens immediately

4. In Conversation:
   ├─ Buyer: "Hi Ahmed, 100kg of tomatoes please"
   ├─ Ahmed: "Hi! Perfect, I have fresh ones"
   ├─ Buyer: "Can you deliver to Main Market by Friday?"
   ├─ Ahmed: "Yes, no problem!"
   └─ Buyer: "Great, let's proceed"

5. Buyer Pays
   └─ Payment confirmed
   └─ Conversation continues for delivery coordination

6. Order Completed
   └─ Conversation can be archived
   └─ Review left for Ahmed
```

---

## 📞 API Integration Example

```typescript
// Buyer pre-orders future production
const response = await fetch('/api/advance-orders/buyer-request', {
  method: 'POST',
  body: JSON.stringify({
    productListingId: 'listing-123',
    requestedQuantity: 100,
    requiredDate: '2026-05-30',
    notes: 'Need for restaurant supply'
  })
});

// Seller creates production offer
const offer = await fetch('/api/advance-orders/seller-offer', {
  method: 'POST',
  body: JSON.stringify({
    productListingId: 'listing-456',
    buyerId: 'buyer-789',
    requestedQuantity: 200,
    requiredDate: '2026-05-25',
    notes: 'Premium grade tomatoes'
  })
});

// Send message in conversation
const message = await fetch('/api/messaging/messages', {
  method: 'POST',
  body: JSON.stringify({
    conversationId: 'conv-123',
    content: 'When can you deliver?',
    attachments: []
  })
});
```

---

## ✨ Key Benefits

✅ **For Buyers:**
- See ALL producers of a product
- Choose best price/quality/delivery
- Pre-order for planning
- Secure in-app communication
- Dispute resolution trail

✅ **For Sellers:**
- Multiple orders from same buyers
- Pre-plan production
- Direct buyer relationships
- Clear communication trail
- No intermediaries

✅ **For Platform:**
- Transparent transactions
- Better data for analytics
- Reduced fraud risk
- Scalable marketplace model
- Revenue from transaction fees

---

**Version:** 2.1.0  
**Date:** May 15, 2026  
**Status:** ✅ Backend Ready, Frontend Implementation Pending
