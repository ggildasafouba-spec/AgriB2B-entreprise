# 🔌 API Reference - AgroMarket Marketplace v2.1

## Base URL
```
http://localhost:3001/api
```

---

## 📦 Product Listings API

### List All Listings for a Product
```http
GET /product-listings/product/{productId}?available=true
```

**Response:**
```json
[
  {
    "id": "listing-123",
    "productId": "product-1",
    "sellerId": "seller-1",
    "currentStock": 500,
    "isAvailable": true,
    "availabilityDate": "2026-05-15T00:00:00Z",
    "estimatedEndDate": null,
    "listingStatus": "AVAILABLE",
    "product": {
      "id": "product-1",
      "name": "Tomato 1kg",
      "price": 5.00,
      "unit": "kg"
    },
    "seller": {
      "id": "seller-1",
      "name": "Ahmed Farm",
      "region": "Dakar",
      "country": "Senegal"
    }
  }
]
```

### Create New Listing (Seller Only)
```http
POST /product-listings
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "product-1",
  "currentStock": 500,
  "isAvailable": true,
  "availabilityDate": "2026-05-15T00:00:00Z",
  "estimatedEndDate": "2026-06-15T00:00:00Z"
}
```

### Get Seller's Listings
```http
GET /product-listings/seller/{sellerId}
```

### Update Listing
```http
PUT /product-listings/{listingId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentStock": 450,
  "isAvailable": true,
  "listingStatus": "AVAILABLE"
}
```

### Update Stock Only
```http
PUT /product-listings/{listingId}/stock
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantityChange": -50
}
```

### Delete Listing
```http
DELETE /product-listings/{listingId}
Authorization: Bearer {token}
```

---

## 💬 Messaging API

### Create Conversation
```http
POST /messaging/conversations
Authorization: Bearer {token}
Content-Type: application/json

{
  "participantId": "user-2",
  "title": "Tomato Order Discussion",
  "orderId": "order-123"  // Optional
}
```

**Response:**
```json
{
  "id": "conv-123",
  "title": "Tomato Order Discussion",
  "participants": [
    { "id": "user-1", "name": "John", "avatar": null },
    { "id": "user-2", "name": "Ahmed", "avatar": null }
  ],
  "createdAt": "2026-05-15T10:30:00Z"
}
```

### Get All Conversations
```http
GET /messaging/conversations
Authorization: Bearer {token}
```

### Get Conversation Messages
```http
GET /messaging/conversations/{conversationId}/messages
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "msg-1",
    "content": "Hi, when can you deliver?",
    "sender": { "id": "user-1", "name": "John" },
    "read": true,
    "createdAt": "2026-05-15T10:35:00Z"
  },
  {
    "id": "msg-2",
    "content": "Tomorrow morning!",
    "sender": { "id": "user-2", "name": "Ahmed" },
    "read": true,
    "createdAt": "2026-05-15T10:36:00Z"
  }
]
```

### Send Message
```http
POST /messaging/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "conversationId": "conv-123",
  "content": "Perfect! See you tomorrow",
  "attachments": []
}
```

### Get Unread Count
```http
GET /messaging/unread-count
Authorization: Bearer {token}
```

**Response:**
```json
{
  "unreadCount": 5
}
```

### Archive Conversation
```http
PUT /messaging/conversations/{conversationId}/archive
Authorization: Bearer {token}
```

---

## 📅 Advance Orders API

### Create Buyer Request (Buyer Only)
```http
POST /advance-orders/buyer-request
Authorization: Bearer {token}
Content-Type: application/json

{
  "productListingId": "listing-123",
  "requestedQuantity": 100,
  "requiredDate": "2026-05-30T00:00:00Z",
  "notes": "For restaurant supply"
}
```

**Response:**
```json
{
  "id": "advorder-123",
  "status": "PENDING",
  "initiatedBy": "BUYER",
  "requestedQuantity": 100,
  "requiredDate": "2026-05-30T00:00:00Z",
  "productListing": {
    "product": { "id": "product-1", "name": "Tomato 1kg" }
  },
  "buyer": { "id": "buyer-1", "name": "John" },
  "seller": { "id": "seller-1", "name": "Ahmed" },
  "createdAt": "2026-05-15T10:30:00Z"
}
```

### Create Seller Offer (Seller Only)
```http
POST /advance-orders/seller-offer
Authorization: Bearer {token}
Content-Type: application/json

{
  "productListingId": "listing-123",
  "buyerId": "buyer-1",
  "requestedQuantity": 100,
  "requiredDate": "2026-05-30T00:00:00Z",
  "notes": "Premium grade tomatoes"
}
```

### Get Buyer's Advance Orders
```http
GET /advance-orders/buyer
Authorization: Bearer {token}
```

### Get Seller's Advance Orders
```http
GET /advance-orders/seller
Authorization: Bearer {token}
```

### Get Advance Order Details
```http
GET /advance-orders/{advanceOrderId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "advorder-123",
  "status": "ACCEPTED",
  "initiatedBy": "BUYER",
  "requestedQuantity": 100,
  "requiredDate": "2026-05-30T00:00:00Z",
  "notes": "For restaurant supply",
  "productListing": {
    "id": "listing-123",
    "product": { "name": "Tomato 1kg", "unit": "kg" }
  },
  "buyer": { "id": "buyer-1", "name": "John", "phone": "221123456", "region": "Dakar" },
  "seller": { "id": "seller-1", "name": "Ahmed", "phone": "221654321", "region": "Thiès" },
  "conversation": {
    "id": "conv-123",
    "messages": [...]
  },
  "createdAt": "2026-05-15T10:30:00Z"
}
```

### Accept Advance Order (Seller Only)
```http
PUT /advance-orders/{advanceOrderId}/accept
Authorization: Bearer {token}
```

### Reject Advance Order (Seller Only)
```http
PUT /advance-orders/{advanceOrderId}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Out of stock due to weather damage"
}
```

---

## 🔑 Common Query Parameters

### Pagination
```
?page=1&limit=20
```

### Filtering
```
?available=true
?status=AVAILABLE
?initiatedBy=BUYER
```

### Sorting
```
?sort=createdAt&order=desc
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid quantity",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "You can only update your own listings",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Product listing not found",
  "error": "Not Found"
}
```

---

## 📝 Sample JavaScript Client

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';
const TOKEN = localStorage.getItem('authToken');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Authorization': `Bearer ${TOKEN}`
  }
});

// Product Listings
export const productListings = {
  async getForProduct(productId: string) {
    const res = await api.get(`/product-listings/product/${productId}`);
    return res.data;
  },
  
  async create(data: CreateProductListingDto) {
    const res = await api.post('/product-listings', data);
    return res.data;
  },
  
  async update(listingId: string, data: UpdateProductListingDto) {
    const res = await api.put(`/product-listings/${listingId}`, data);
    return res.data;
  },
  
  async updateStock(listingId: string, quantityChange: number) {
    const res = await api.put(`/product-listings/${listingId}/stock`, {
      quantityChange
    });
    return res.data;
  }
};

// Messaging
export const messaging = {
  async createConversation(participantId: string, title?: string) {
    const res = await api.post('/messaging/conversations', {
      participantId,
      title
    });
    return res.data;
  },
  
  async getConversations() {
    const res = await api.get('/messaging/conversations');
    return res.data;
  },
  
  async getMessages(conversationId: string) {
    const res = await api.get(`/messaging/conversations/${conversationId}/messages`);
    return res.data;
  },
  
  async sendMessage(conversationId: string, content: string) {
    const res = await api.post('/messaging/messages', {
      conversationId,
      content
    });
    return res.data;
  },
  
  async getUnreadCount() {
    const res = await api.get('/messaging/unread-count');
    return res.data;
  }
};

// Advance Orders
export const advanceOrders = {
  async createBuyerRequest(productListingId: string, quantity: number, requiredDate: Date) {
    const res = await api.post('/advance-orders/buyer-request', {
      productListingId,
      requestedQuantity: quantity,
      requiredDate
    });
    return res.data;
  },
  
  async getBuyerOrders() {
    const res = await api.get('/advance-orders/buyer');
    return res.data;
  },
  
  async getSellerOrders() {
    const res = await api.get('/advance-orders/seller');
    return res.data;
  },
  
  async accept(advanceOrderId: string) {
    const res = await api.put(`/advance-orders/${advanceOrderId}/accept`);
    return res.data;
  },
  
  async reject(advanceOrderId: string, reason?: string) {
    const res = await api.put(`/advance-orders/${advanceOrderId}/reject`, { reason });
    return res.data;
  }
};
```

---

## 🧪 Testing with cURL

### Get All Listings for a Product
```bash
curl -X GET "http://localhost:3001/api/product-listings/product/product-1?available=true"
```

### Create a Listing
```bash
curl -X POST "http://localhost:3001/api/product-listings" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-1",
    "currentStock": 500,
    "isAvailable": true
  }'
```

### Send a Message
```bash
curl -X POST "http://localhost:3001/api/messaging/messages" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-123",
    "content": "Hello, when can you deliver?"
  }'
```

### Create Buyer Request
```bash
curl -X POST "http://localhost:3001/api/advance-orders/buyer-request" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "productListingId": "listing-123",
    "requestedQuantity": 100,
    "requiredDate": "2026-05-30"
  }'
```

---

**Document Version:** 1.0  
**Last Updated:** May 15, 2026  
**API Status:** ✅ Ready for Integration
