# 🎨 Frontend Implementation Guide - Marketplace v2.1

## Overview
This guide explains how to implement the new marketplace UI components for:
1. Multi-producer product listings
2. Secure in-app messaging
3. Advance order management

---

## 1. Product Listings Page

### Component: `ProductListingsView`

**Location:** `frontend/app/dashboard/products/listings/page.tsx`

**Features:**
- Display single product with all producer listings
- Sort by price, availability, producer rating
- Filter by status (available, future, out of stock)
- "Order Now" or "Pre-order" buttons
- Producer profile card with contact info

**Structure:**
```tsx
interface ProductListing {
  id: string;
  productId: string;
  sellerId: string;
  currentStock: number;
  isAvailable: boolean;
  availabilityDate: Date;
  estimatedEndDate?: Date;
  listingStatus: 'AVAILABLE' | 'UNAVAILABLE' | 'FUTURE' | 'EXPIRED';
  product: Product;
  seller: ProducerProfile;
}

interface ProducerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  region: string;
  country: string;
  rating?: number;
  reviews?: Review[];
  totalOrders?: number;
}
```

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ Product: Tomato 1kg                     │
├─────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐│
│ │ Producer: Ahmed Farm        ⭐ 4.8   ││
│ │ Location: Dakar, Senegal             ││
│ │ Available: 500 kg @ $5.00/kg         ││
│ │ Next: Now                    ▼ More  ││
│ │ [Order Now] [Pre-order]              ││
│ └──────────────────────────────────────┘│
│ ┌──────────────────────────────────────┐│
│ │ Producer: Fatima's Farm    ⭐ 4.9    ││
│ │ Location: Thiès, Senegal             ││
│ │ Available: 300 kg @ $5.50/kg         ││
│ │ Next: Now                    ▼ More  ││
│ │ [Order Now] [Pre-order]              ││
│ └──────────────────────────────────────┘│
│ ┌──────────────────────────────────────┐│
│ │ Producer: Kofi's Organic   ⭐ 4.7    ││
│ │ Location: Kaolack, Senegal           ││
│ │ Available: 200 kg @ $4.80/kg         ││
│ │ Next: May 30, 2026          ▼ More  ││
│ │ [Pre-order] [Contact]                ││
│ └──────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**Code Example:**
```tsx
'use client';

import { useState, useEffect } from 'react';
import { productListings } from '@/lib/api';

export default function ProductListingsPage({ 
  params 
}: { 
  params: { productId: string } 
}) {
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'availability'>('price');

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await productListings.getForProduct(params.productId);
        setListings(data);
      } catch (error) {
        console.error('Failed to fetch listings', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchListings();
  }, [params.productId]);

  const sortedListings = [...listings].sort((a, b) => {
    if (sortBy === 'price') return a.product.price - b.product.price;
    if (sortBy === 'rating') return (b.seller.rating || 0) - (a.seller.rating || 0);
    return a.isAvailable ? -1 : 1;
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{listings[0]?.product.name}</h1>
      
      <div className="mb-6 flex gap-4">
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border rounded"
        >
          <option value="price">Price (Low to High)</option>
          <option value="rating">Highest Rated</option>
          <option value="availability">Available First</option>
        </select>
      </div>

      <div className="space-y-4">
        {sortedListings.map((listing) => (
          <div key={listing.id} className="border rounded-lg p-4 hover:shadow-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold">{listing.seller.name}</h3>
                <p className="text-sm text-gray-600">
                  📍 {listing.seller.region}, {listing.seller.country}
                </p>
              </div>
              <div className="text-right">
                {listing.seller.rating && (
                  <div className="text-yellow-500">⭐ {listing.seller.rating.toFixed(1)}</div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded mb-3">
              <div className="flex justify-between">
                <span className="font-semibold">{listing.currentStock} {listing.product.unit}</span>
                <span className="text-green-600">${listing.product.price.toFixed(2)}/{listing.product.unit}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {listing.isAvailable ? (
                  <span>✓ Available now</span>
                ) : (
                  <span>Available: {new Date(listing.availabilityDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleOrderNow(listing)}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                {listing.isAvailable ? 'Order Now' : 'Pre-order'}
              </button>
              <button
                onClick={() => handleContact(listing)}
                className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50"
              >
                Contact Producer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function handleOrderNow(listing: ProductListing) {
  // Open order modal or navigate to checkout
}

function handleContact(listing: ProductListing) {
  // Open or create conversation with producer
}
```

---

## 2. Messaging/Conversation Component

### Component: `MessagingInterface`

**Location:** `frontend/app/dashboard/messages/page.tsx`

**Features:**
- Conversation list with latest message preview
- Message thread viewer
- Real-time message sending
- Unread badge counter
- Conversation archiving

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ Conversations          [+ New]          │
├──────────────┬──────────────────────────┤
│ Ahmed Farm   │ Ahmed Farm               │
│ 2 unread     │ ─────────────────────   │
│ 5 min ago    │ 10:30 AM                 │
│ [message..]. │ Me: When can you del... │
│              │                          │
│ Fatima's Farm│ 10:35 AM                 │
│ Read         │ Ahmed: Tomorrow mornin...│
│ 1 hour ago   │                          │
│ [message..]. │ 10:36 AM                 │
│              │ Me: Perfect! See you...  │
│              │ ───────────────────────  │
│              │ Message... [Send] [📎]  │
│              └──────────────────────────┤
```

**Code Example:**
```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { messaging } from '@/lib/api';

export default function MessagingPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const data = await messaging.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await messaging.getMessages(conversationId);
      setMessages(data);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await messaging.sendMessage(selectedConversation.id, newMessage);
      setNewMessage('');
      await loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4 p-4">
      {/* Conversations List */}
      <div className="w-1/3 border rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Messages</h2>
          <button className="text-2xl">+</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{conv.participants[0]?.name}</h3>
                <span className="text-xs text-gray-500">
                  {new Date(conv.messages[0]?.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {conv.messages[0]?.content || 'No messages'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Message Thread */}
      {selectedConversation && (
        <div className="flex-1 border rounded-lg flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-bold">
              {selectedConversation.participants.map((p) => p.name).join(', ')}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender.id === 'currentUserId' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender.id === 'currentUserId'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-black'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 3. Advance Orders Management

### Component: `AdvanceOrdersDashboard`

**Location:** `frontend/app/dashboard/advance-orders/page.tsx`

**Features:**
- For Buyers: View advance order requests, pre-orders status
- For Sellers: Manage incoming requests, create offers
- Accept/Reject interface
- Linked conversation for coordination

**Buyer View:**
```
┌──────────────────────────────────────────┐
│ My Pre-orders & Requests                 │
├──────────────────────────────────────────┤
│ Status Filter: [Pending] [Accepted] All  │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐
│ │ 🔶 PENDING - Tomato 1kg               │
│ │ Producer: Ahmed Farm                   │
│ │ Quantity: 100 kg                       │
│ │ Needed: May 30, 2026                   │
│ │ Requested 2 days ago                   │
│ │ [Message] [Cancel]                     │
│ └────────────────────────────────────────┘
│ ┌────────────────────────────────────────┐
│ │ ✅ ACCEPTED - Carrot 1kg              │
│ │ Producer: Fatima's Farm                │
│ │ Quantity: 50 kg                        │
│ │ Needed: May 25, 2026                   │
│ │ [View Details] [Message] [Track]       │
│ └────────────────────────────────────────┘
└──────────────────────────────────────────┘
```

**Seller View:**
```
┌──────────────────────────────────────────┐
│ Incoming Pre-order Requests              │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐
│ │ 🔴 NEW REQUEST                         │
│ │ Buyer: John's Restaurant               │
│ │ Product: Tomato 1kg                    │
│ │ Quantity: 100 kg @ $5/kg = $500        │
│ │ Needed: May 30, 2026                   │
│ │ [Accept] [Reject]                      │
│ └────────────────────────────────────────┘
│ 
│ My Production Offers
│ ┌────────────────────────────────────────┐
│ │ [+ Create New Offer]                   │
│ └────────────────────────────────────────┘
```

**Code Example:**
```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { advanceOrders } from '@/lib/api';

export default function AdvanceOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = user?.role === 'BUYER'
        ? await advanceOrders.getBuyerOrders()
        : await advanceOrders.getSellerOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (orderId: string) => {
    try {
      await advanceOrders.accept(orderId);
      await loadOrders();
    } catch (error) {
      console.error('Failed to accept order', error);
    }
  };

  const handleReject = async (orderId: string, reason: string) => {
    try {
      await advanceOrders.reject(orderId, reason);
      await loadOrders();
    } catch (error) {
      console.error('Failed to reject order', error);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    return order.status.toLowerCase() === filter;
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        {user?.role === 'BUYER' ? 'My Pre-orders' : 'Pre-order Requests'}
      </h1>

      <div className="mb-6 flex gap-2">
        {['all', 'pending', 'accepted', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded capitalize ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className="border rounded-lg p-4 hover:shadow-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold">
                  {user?.role === 'BUYER' ? order.seller.name : order.buyer.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {order.productListing.product.name}
                </p>
              </div>
              <span className={`px-3 py-1 rounded text-white text-sm font-semibold ${
                order.status === 'PENDING' ? 'bg-yellow-500' :
                order.status === 'ACCEPTED' ? 'bg-green-500' :
                order.status === 'REJECTED' ? 'bg-red-500' : 'bg-gray-500'
              }`}>
                {order.status}
              </span>
            </div>

            <div className="bg-gray-50 p-3 rounded mb-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Quantity:</span>
                  <p className="font-semibold">{order.requestedQuantity} {order.productListing.product.unit}</p>
                </div>
                <div>
                  <span className="text-gray-600">Needed:</span>
                  <p className="font-semibold">{new Date(order.requiredDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Message
              </button>
              {user?.role === 'SELLER' && order.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleAccept(order.id)}
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(order.id, 'Not available')}
                    className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 4. Integration Points

### When User Orders a Product
```typescript
// 1. Create order
const order = await orders.create({
  productListingId: listing.id,
  quantity: 100
});

// 2. Auto-create conversation
const conversation = await messaging.createConversation(
  listing.seller.id,
  `Order #${order.id} - ${product.name}`,
  order.id
);

// 3. Navigate to conversation
router.push(`/dashboard/messages?conv=${conversation.id}`);
```

### When Seller Creates Pre-order Offer
```typescript
// 1. Create advance order
const advanceOrder = await advanceOrders.createSellerOffer({
  productListingId: listing.id,
  buyerId: buyer.id,
  requestedQuantity: 100,
  requiredDate: new Date('2026-05-30')
});

// 2. Buyer receives notification
// 3. Buyer can accept in dashboard
```

### When Seller Accepts Pre-order
```typescript
// 1. Accept order
await advanceOrders.accept(orderId);

// 2. Auto-create conversation for coordination
const conversation = await messaging.createConversation(
  buyer.id,
  `Pre-order Confirmation - ${product.name}`,
  null  // Not linked to specific order yet
);

// 3. Send initial message
await messaging.sendMessage(
  conversation.id,
  `Your pre-order has been confirmed! Delivery scheduled for ${requiredDate.toLocaleDateString()}`
);
```

---

## 5. Data Flow Diagram

```
┌─────────────┐
│   Buyer     │
└──────┬──────┘
       │
       ├─→ Browse Products (ProductListing API)
       │
       ├─→ View All Producers
       │
       ├─→ Click "Order Now" or "Pre-order"
       │   ├─→ If Now: Create Order + Auto-Conversation
       │   └─→ If Pre-order: Create AdvanceOrderRequest
       │
       └─→ Messaging Interface
           ├─→ Send/Receive Messages
           └─→ Coordinate with Seller

┌─────────────┐
│   Seller    │
└──────┬──────┘
       │
       ├─→ Create/Edit ProductListings
       │   ├─→ Current Stock
       │   └─→ Future Production
       │
       ├─→ Accept/Reject AdvanceOrderRequests
       │
       ├─→ Create Production Offers
       │   └─→ Send to Specific Buyers
       │
       └─→ Messaging Interface
           ├─→ Discuss with Buyers
           └─→ Coordinate Delivery
```

---

## 6. State Management Pattern

```tsx
// Use zustand or Redux for global state
interface MarketplaceStore {
  // Product Listings
  listings: ProductListing[];
  selectedListing: ProductListing | null;
  
  // Conversations
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  unreadCount: number;
  
  // Advance Orders
  advanceOrders: AdvanceOrderRequest[];
  
  // Actions
  fetchListings: (productId: string) => Promise<void>;
  createConversation: (participantId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  createAdvanceOrder: (data: CreateAdvanceOrderDto) => Promise<void>;
}
```

---

**Document Version:** 1.0  
**Last Updated:** May 15, 2026  
**Status:** ✅ Ready for Implementation
